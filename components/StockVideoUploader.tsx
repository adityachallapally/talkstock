'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Player } from '@remotion/player';
import { CaptionedVideo } from '@/components/remotion/CaptionedVideo';
import { OverlayConfig } from '@/types/constants';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Add type declaration for webkitAudioContext
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

interface VideoVariant {
  src: string;
  overlays: OverlayConfig[];
  durationInFrames: number;
  transcriptionUrl: string;
  provider: string;
}

interface TranscriptLine {
  text: string;
  startMs: number;
  endMs: number;
}

export function StockVideoUploader() {
  const [isUploading, setIsUploading] = useState(false);
  const [videoVariants, setVideoVariants] = useState<VideoVariant[]>([]);
  const [showCaptions, setShowCaptions] = useState(true);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [selectedText, setSelectedText] = useState('');
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [clickedSegmentIndex, setClickedSegmentIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      return;
    }

    const text = selection.toString().trim();
    if (text) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelectedText(text);
      setSelectedRange(range);
      setMenuPosition({
        x: rect.left + (rect.width / 2),
        y: rect.bottom
      });
    }
  };

  const handleClickAway = () => {
    setSelectedText('');
    setMenuPosition(null);
    if (selectedRange) {
      window.getSelection()?.removeAllRanges();
      setSelectedRange(null);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', (e) => {
      const transcriptDiv = document.getElementById('transcript-container');
      if (transcriptDiv && !transcriptDiv.contains(e.target as Node)) {
        handleClickAway();
      }
    });
  }, []);

  const extractAudioFromVideo = async (videoFile: File): Promise<{ audioBlob: Blob, durationInFrames: number }> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      video.src = URL.createObjectURL(videoFile);

      video.onloadedmetadata = async () => {
        const duration = video.duration;
        const durationInFrames = Math.ceil(duration * 30); // 30 fps
        const offlineContext = new OfflineAudioContext(2, duration * audioContext.sampleRate, audioContext.sampleRate);
        
        video.play();
        try {
          const source = audioContext.createMediaElementSource(video);
          const destination = audioContext.createMediaStreamDestination();
          source.connect(destination);
          
          const mediaRecorder = new MediaRecorder(destination.stream);
          const chunks: BlobEvent['data'][] = [];
          
          mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
          mediaRecorder.onstop = () => {
            const audioBlob = new Blob(chunks, { type: 'audio/wav' });
            video.pause();
            URL.revokeObjectURL(video.src);
            resolve({ audioBlob, durationInFrames });
          };
          
          mediaRecorder.start();
          setTimeout(() => mediaRecorder.stop(), duration * 1000);
        } catch (error) {
          reject(error);
        }
      };

      video.onerror = () => reject(new Error('Failed to load video'));
    });
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    setIsUploading(true);
    setVideoVariants([]);
    setTranscript([]);

    try {
      // Extract audio from video and get duration
      const { audioBlob, durationInFrames } = await extractAudioFromVideo(file);
      
      const formData = new FormData();
      formData.append('video', file);
      formData.append('audio', audioBlob, 'audio.wav');
      formData.append('durationInFrames', durationInFrames.toString());

      const response = await fetch('/api/stock-videos', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      if (data.success) {
        // Create a variant for each provider's overlays but only use Pexels
        const variants = data.overlaysByProvider
          .map((overlays: OverlayConfig[], index: number) => ({
            src: data.src,
            overlays,
            durationInFrames,
            transcriptionUrl: data.transcriptionUrl,
            provider: overlays[0]?.provider || `Provider ${index + 1}`
          }))
          .filter(variant => variant.provider === 'Pexels');

        setVideoVariants(variants);

        // Fetch and set transcript
        const transcriptResponse = await fetch(data.transcriptionUrl);
        const transcriptData = await transcriptResponse.json();
        setTranscript(transcriptData.transcription);
        
        toast({
          title: "Success",
          description: "Video processed successfully!",
        });
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Function to check if a text segment has a matching stock video and get the overlay info
  const getMatchingStockVideo = (startMs: number, endMs: number) => {
    if (!videoVariants.length) return null;
    const currentVariant = videoVariants[0]; // Using first variant (Pexels)
    
    // Convert milliseconds to frames
    const startFrame = Math.round((startMs / 1000) * 30); // 30 fps
    const endFrame = Math.round((endMs / 1000) * 30);
    
    return currentVariant.overlays.find(overlay => {
      const overlayEndFrame = overlay.startFrame + overlay.duration;
      return overlay.type === 'STOCK_VIDEO' &&
             ((startFrame >= overlay.startFrame && startFrame <= overlayEndFrame) ||
              (endFrame >= overlay.startFrame && endFrame <= overlayEndFrame));
    });
  };

  // Group consecutive segments that belong to the same overlay
  const getGroupedTranscript = () => {
    const groups: { 
      segments: TranscriptLine[],
      overlay: OverlayConfig | null,
      startIndex: number
    }[] = [];
    let currentGroup: TranscriptLine[] = [];
    let currentOverlay: OverlayConfig | null = null;
    let groupStartIndex = 0;

    transcript.forEach((line, index) => {
      const overlay = getMatchingStockVideo(line.startMs, line.endMs);
      
      if (overlay !== currentOverlay) {
        if (currentGroup.length > 0) {
          groups.push({ 
            segments: [...currentGroup], 
            overlay: currentOverlay,
            startIndex: groupStartIndex
          });
        }
        currentGroup = [line];
        currentOverlay = overlay;
        groupStartIndex = index;
      } else {
        currentGroup.push(line);
      }
    });

    // Add the last group
    if (currentGroup.length > 0) {
      groups.push({ 
        segments: currentGroup, 
        overlay: currentOverlay,
        startIndex: groupStartIndex
      });
    }

    return groups;
  };

  const handleSegmentClick = (event: React.MouseEvent, startIndex: number) => {
    setClickedSegmentIndex(startIndex);
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setMenuPosition({
      x: rect.left + (rect.width / 2),
      y: rect.bottom
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Video</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleUpload}
            disabled={isUploading}
            className="hidden"
          />
          
          {videoVariants.length > 0 && (
            <>
              <div className="flex items-center space-x-2 mb-4">
                <Switch
                  id="captions"
                  checked={showCaptions}
                  onCheckedChange={setShowCaptions}
                />
                <Label htmlFor="captions">Show Captions</Label>
              </div>

              <div className="flex gap-8">
                {/* Transcript Section */}
                <div 
                  id="transcript-container"
                  className="w-1/2 bg-muted p-4 rounded-lg max-h-[600px] overflow-y-auto"
                >
                  <h3 className="text-lg font-semibold mb-4">Transcript</h3>
                  <p className="whitespace-normal">
                    {getGroupedTranscript().map(({ segments, overlay, startIndex }) => (
                      <span 
                        key={startIndex}
                        onClick={overlay ? (e) => handleSegmentClick(e, startIndex) : undefined}
                        className={`inline ${overlay ? 'bg-green-500/20 px-1 rounded cursor-pointer hover:bg-green-500/30' : ''}`}
                      >
                        {segments.map(segment => segment.text).join(' ')}{' '}
                      </span>
                    ))}
                  </p>
                </div>

                {/* Video Section */}
                <div className="w-1/2">
                  {videoVariants.map((variant, index) => (
                    <div key={index} className="space-y-2">
                      <Player
                        component={CaptionedVideo}
                        inputProps={{
                          src: variant.src,
                          overlays: variant.overlays,
                          transcriptionUrl: variant.transcriptionUrl,
                          showCaptions
                        }}
                        durationInFrames={variant.durationInFrames}
                        fps={30}
                        compositionHeight={1920}
                        compositionWidth={1080}
                        style={{
                          width: '100%',
                          aspectRatio: '9/16',
                        }}
                        controls
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <Button 
            onClick={handleButtonClick}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? 'Processing...' : 'Select Video'}
          </Button>
        </div>

        {/* B-Roll Menu */}
        {menuPosition && clickedSegmentIndex !== null && (
          <DropdownMenu 
            open={clickedSegmentIndex !== null} 
            onOpenChange={(open) => !open && handleClickAway()}
          >
            <DropdownMenuContent
              style={{
                position: 'fixed',
                left: `${menuPosition.x}px`,
                top: `${menuPosition.y}px`,
                transform: 'translateX(-50%)',
              }}
            >
              <DropdownMenuItem onSelect={() => console.log('Edit Text Overlay')}>
                <span className="flex items-center">
                  Edit Text Overlay
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => console.log('Switch B-roll')}>
                <span className="flex items-center">
                  Switch to other B-roll
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => console.log('Remove B-roll')} className="text-red-500">
                <span className="flex items-center">
                  Remove B-roll
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Selection Menu (keep the existing one for text selection) */}
        {menuPosition && selectedText && !clickedSegmentIndex && (
          <DropdownMenu 
            open={!!selectedText} 
            onOpenChange={(open) => !open && handleClickAway()}
          >
            <DropdownMenuContent
              style={{
                position: 'fixed',
                left: `${menuPosition.x}px`,
                top: `${menuPosition.y}px`,
                transform: 'translateX(-50%)',
              }}
            >
              <DropdownMenuItem onSelect={() => console.log('Generate video')}>
                <span className="flex items-center">
                  Generate video
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => console.log('Generate image')}>
                <span className="flex items-center">
                  Generate image
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => console.log('Search web image')}>
                <span className="flex items-center">
                  Search web image
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => console.log('Add GIF')}>
                <span className="flex items-center">
                  Add GIF
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => console.log('Upload media')}>
                <span className="flex items-center">
                  Upload image/video
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => console.log('Generate text')}>
                <span className="flex items-center">
                  Generate text overlay
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardContent>
    </Card>
  );
} 