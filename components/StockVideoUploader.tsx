'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Player } from '@remotion/player';
import { CaptionedVideo } from '@/components/remotion/CaptionedVideo';
import { OverlayConfig, TemplateType } from '@/types/constants';
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<{ videoSrc: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isTranscriptDropdownOpen, setIsTranscriptDropdownOpen] = useState(false);
  const transcriptDropdownOpenRef = useRef(false);

  useEffect(() => {
    transcriptDropdownOpenRef.current = isTranscriptDropdownOpen;
  }, [isTranscriptDropdownOpen]);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (transcriptDropdownOpenRef.current) return;
      const transcriptDiv = document.getElementById('transcript-container');
      if (transcriptDiv && transcriptDiv.contains(e.target as Node)) return;
      handleClickAway();
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

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

  const handleDemoClick = async () => {
    setIsUploading(true);
    setVideoVariants([]);
    setTranscript([]);

    try {
      const demoVideoUrl = 'https://hx7mp5wayo6ybdwl.public.blob.vercel-storage.com/IMG_6062-ustELCsT8kuxTiuEmUhR0NTEefvx6P.MP4';
      const demoTranscriptUrl = 'https://hx7mp5wayo6ybdwl.public.blob.vercel-storage.com/transcriptions/14-LPluQMfijVrCEOY2nAiqc4yTzuvPYR.json';

      // Mock overlays based on the logs
      const mockOverlays: OverlayConfig[] = [
        {
          startFrame: Math.round((8540 / 1000) * 30),
          duration: Math.round((2000 / 1000) * 30),
          type: TemplateType.STOCK_VIDEO,
          videoSrc: 'https://videos.pexels.com/video-files/5717293/5717293-uhd_2160_3840_25fps.mp4',
          title: '',
          provider: 'Pexels'
        },
        {
          startFrame: Math.round((11800 / 1000) * 30),
          duration: Math.round((2000 / 1000) * 30),
          type: TemplateType.STOCK_VIDEO,
          videoSrc: 'https://videos.pexels.com/video-files/9364184/9364184-sd_240_426_25fps.mp4',
          title: '',
          provider: 'Pexels'
        },
        {
          startFrame: Math.round((14560 / 1000) * 30),
          duration: Math.round((2000 / 1000) * 30),
          type: TemplateType.STOCK_VIDEO,
          videoSrc: 'https://videos.pexels.com/video-files/7822022/7822022-sd_360_640_30fps.mp4',
          title: '',
          provider: 'Pexels'
        },
        {
          startFrame: Math.round((22360 / 1000) * 30),
          duration: Math.round((2000 / 1000) * 30),
          type: TemplateType.STOCK_VIDEO,
          videoSrc: 'https://videos.pexels.com/video-files/5495890/5495890-sd_540_960_30fps.mp4',
          title: '',
          provider: 'Pexels'
        },
        {
          startFrame: Math.round((25320 / 1000) * 30),
          duration: Math.round((2000 / 1000) * 30),
          type: TemplateType.STOCK_VIDEO,
          videoSrc: 'https://videos.pexels.com/video-files/7660184/7660184-uhd_1440_2560_25fps.mp4',
          title: '',
          provider: 'Pexels'
        },
        {
          startFrame: Math.round((34880 / 1000) * 30),
          duration: Math.round((2000 / 1000) * 30),
          type: TemplateType.STOCK_VIDEO,
          videoSrc: 'https://videos.pexels.com/video-files/5756114/5756114-uhd_2160_3840_24fps.mp4',
          title: '',
          provider: 'Pexels'
        },
        {
          startFrame: Math.round((38260 / 1000) * 30),
          duration: Math.round((2000 / 1000) * 30),
          type: TemplateType.STOCK_VIDEO,
          videoSrc: 'https://videos.pexels.com/video-files/8165696/8165696-uhd_2160_4096_25fps.mp4',
          title: '',
          provider: 'Pexels'
        }
      ];

      // Create a mock variant with demo content
      const demoVariant = {
        src: demoVideoUrl,
        overlays: mockOverlays,
        durationInFrames: Math.round((41420 / 1000) * 30), // Based on the last caption timestamp from logs
        transcriptionUrl: demoTranscriptUrl,
        provider: 'Pexels'
      };

      setVideoVariants([demoVariant]);

      // Fetch and set transcript
      const transcriptResponse = await fetch(demoTranscriptUrl);
      const transcriptData = await transcriptResponse.json();
      setTranscript(transcriptData.transcription);
      
      toast({
        title: "Success",
        description: "Demo content loaded successfully!",
      });

    } catch (error) {
      console.error('Demo loading error:', error);
      toast({
        title: "Error",
        description: "Failed to load demo content. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      const response = await fetch(`/api/search-videos?term=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      setSearchResults(data.videos || []);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Error",
        description: "Failed to search videos. Please try again.",
        variant: "destructive",
      });
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
    console.log('Segment clicked:', startIndex);
    console.log('Current transcript line:', transcript[startIndex]);
    setClickedSegmentIndex(startIndex);
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setMenuPosition({
      x: rect.left + (rect.width / 2),
      y: rect.bottom
    });
    setIsMenuOpen(true);
    console.log('Menu position set to:', { x: rect.left + (rect.width / 2), y: rect.bottom });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Video</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Test Dropdown Menu */}
          <div className="mb-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Test Dropdown Menu</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem 
                  onSelect={() => {
                    console.log('Test option 1 selected');
                    alert('Test option 1 selected');
                  }}
                >
                  Test Option 1
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onSelect={() => {
                    console.log('Test option 2 selected');
                    alert('Test option 2 selected');
                  }}
                >
                  Test Option 2
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

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
            className="w-full mb-2"
          >
            {isUploading ? 'Processing...' : 'Select Video'}
          </Button>

          <Button 
            onClick={handleDemoClick}
            disabled={isUploading}
            variant="secondary"
            className="w-full"
          >
            Load Demo Content
          </Button>
        </div>

        {/* B-Roll Menu */}
        {menuPosition && clickedSegmentIndex !== null && (
          <div id="transcript-dropdown" onMouseDown={(e) => e.stopPropagation()} style={{
            position: 'fixed',
            left: `${menuPosition.x}px`,
            top: `${menuPosition.y}px`,
            transform: 'translateX(-50%)',
          }}>
            <DropdownMenu onOpenChange={(open) => setIsTranscriptDropdownOpen(open)}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Test Dropdown Menu</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent id="transcript-dropdown-content" onMouseDown={(e) => e.stopPropagation()}>
                <DropdownMenuItem 
                  onSelect={() => {
                    console.log('Test option 1 selected');
                    alert('Test option 1 selected');
                  }}
                >
                  Test Option 1
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onSelect={() => {
                    console.log('Test option 2 selected');
                    alert('Test option 2 selected');
                  }}
                >
                  Test Option 2
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Search Assets Dialog */}
        {isSearchOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-[90vw] max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Search Assets</h2>
                <button 
                  onClick={() => setIsSearchOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
              
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg pr-10"
                  />
                  <svg 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    xmlns="http://www.w3.org/2000/svg" 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8"/>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </div>
                <Button onClick={handleSearch}>
                  Search
                </Button>
              </div>

              <div className="flex gap-4 mb-6">
                <button className="text-blue-600 font-medium px-4 py-2 rounded-lg hover:bg-blue-50 border-b-2 border-blue-600">
                  Stock Assets
                </button>
                <button className="text-gray-600 font-medium px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                    <polyline points="13 2 13 9 20 9"/>
                  </svg>
                  Web Images
                </button>
                <button className="text-gray-600 font-medium px-4 py-2 rounded-lg hover:bg-gray-50">
                  Uploaded
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {searchResults.map((result, index) => (
                  <div 
                    key={index} 
                    className="aspect-[9/16] relative rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-500"
                    onClick={() => {
                      // Update the overlay with the new video
                      if (videoVariants.length && clickedSegmentIndex !== null) {
                        const newOverlays = [...videoVariants[0].overlays];
                        const overlayIndex = newOverlays.findIndex(overlay => {
                          const startFrame = Math.round((transcript[clickedSegmentIndex].startMs / 1000) * 30);
                          const endFrame = Math.round((transcript[clickedSegmentIndex].endMs / 1000) * 30);
                          return overlay.startFrame <= endFrame && overlay.startFrame + overlay.duration >= startFrame;
                        });

                        if (overlayIndex !== -1) {
                          newOverlays[overlayIndex] = {
                            ...newOverlays[overlayIndex],
                            videoSrc: result.videoSrc
                          };
                          
                          setVideoVariants([{
                            ...videoVariants[0],
                            overlays: newOverlays
                          }]);
                          
                          setIsSearchOpen(false);
                          handleClickAway();
                          
                          toast({
                            title: "Success",
                            description: "B-roll updated successfully!",
                          });
                        }
                      }
                    }}
                  >
                    <video 
                      src={result.videoSrc}
                      className="w-full h-full object-cover"
                      loop
                      muted
                      onMouseEnter={e => e.currentTarget.play()}
                      onMouseLeave={e => {
                        e.currentTarget.pause();
                        e.currentTarget.currentTime = 0;
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
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