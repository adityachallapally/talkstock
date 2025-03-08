'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Player } from '@remotion/player';
import { AbsoluteFill, OffthreadVideo } from 'remotion';
import { CaptionedVideo } from '@/remotion/CaptionedVideo';
import { OverlayConfig, TemplateType } from '@/types/constants';
import { parseMedia } from '@remotion/media-parser';
import { Trash2, HelpCircle, RotateCcw, Upload, Download, RefreshCw } from 'lucide-react';
import { RenderControls } from './Remotion/RenderControls';
import { TranscriptEditor } from './TranscriptEditor';

// Add type declaration for webkitAudioContext
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export interface VideoVariant {
  src: string;
  overlays: OverlayConfig[];
  durationInFrames: number;
  transcriptionUrl: string;
  provider: string;
}

export interface TranscriptLine {
  text: string;
  startMs: number;
  endMs: number;
}

export interface RenderProgress {
  type: 'progress' | 'done' | 'error';
  progress?: number;
  url?: string;
  message?: string;
}

// Modify the useHighlights hook to use indices
export const useHighlights = (transcript: TranscriptLine[], videoVariants: VideoVariant[], setVideoVariants: (v: VideoVariant[]) => void) => {
  // Build an array of word objects with index info
  const words = transcript.reduce((acc: { index: number; word: string; transcriptIndex: number; startMs: number; endMs: number }[], line, transcriptIndex) => {
    const lineWords = line.text.split(/\s+/).filter(w => w.trim().length > 0);
    lineWords.forEach((word) => {
      acc.push({
        index: acc.length,
        word,
        transcriptIndex,
        startMs: line.startMs,
        endMs: line.endMs
      });
    });
    return acc;
  }, []);

  const [isDragging, setIsDragging] = useState(false);
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);
  const [dragType, setDragType] = useState<string | null>(null);
  const [hoveredHighlight, setHoveredHighlight] = useState<string | null>(null);
  const [selectionStart, setSelectionStart] = useState<number | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<number | null>(null);

  const overlaysToHighlights = () => {
    if (!videoVariants.length) return [];
    const highlights: { id: string; start: number; end: number; overlay: OverlayConfig }[] = [];
    const variant = videoVariants[0];

    variant.overlays.forEach(overlay => {
      if (overlay.type === TemplateType.STOCK_VIDEO) {
        const overlayStartMs = (overlay.startFrame / 30) * 1000;
        const overlayEndMs = ((overlay.startFrame + overlay.duration) / 30) * 1000;

        // Find words that fall within this overlay's time range
        const startIndex = words.findIndex(w => w.startMs >= overlayStartMs);
        const endIndex = words.findLastIndex(w => w.endMs <= overlayEndMs);
        
        if (startIndex !== -1 && endIndex !== -1 && startIndex <= endIndex) {
          highlights.push({
            id: overlay.startFrame.toString(),
            start: startIndex,
            end: endIndex,
            overlay
          });
        }
      }
    });

    return highlights;
  };

  const updateHighlightDuration = (id: string, newStart: number, newEnd: number, type: 'start' | 'end') => {
    if (!videoVariants.length || words.length === 0) return;
    const variant = videoVariants[0];
    
    const currentOverlay = variant.overlays.find(o => 
      o.type === TemplateType.STOCK_VIDEO && o.startFrame.toString() === id
    );
    
    if (!currentOverlay) return;

    const updatedOverlays = variant.overlays.map(overlay => {
      if (overlay.type === TemplateType.STOCK_VIDEO && overlay.startFrame.toString() === id) {
        if (type === 'start') {
          // Make left handle calculation symmetrical with right handle
          const newStartFrame = Math.round((words[Math.max(0, newStart)].startMs / 1000) * 30);
          const currentEndFrame = overlay.startFrame + overlay.duration;
          const newDuration = currentEndFrame - newStartFrame;
          
          return {
            ...overlay,
            startFrame: newStartFrame,
            duration: Math.max(30, newDuration) // Ensure minimum duration
          };
        } else {
          // Right handle calculation remains the same
          const newEndFrame = Math.round((words[newEnd].endMs / 1000) * 30);
          const newDuration = newEndFrame - overlay.startFrame;
          
          return {
            ...overlay,
            duration: Math.max(30, newDuration) // Ensure minimum duration
          };
        }
      }
      return overlay;
    });

    setVideoVariants([{ ...variant, overlays: updatedOverlays }]);
  };

  const addHighlight = (startIndex: number, endIndex: number, videoSrc: string) => {
    if (!videoVariants.length || Math.abs(startIndex - endIndex) < 1) return;
    
    const variant = videoVariants[0];
    const startTime = words[startIndex].startMs;
    const endTime = words[endIndex].endMs;
    
    const startFrame = Math.round((startTime / 1000) * 30);
    const duration = Math.round(((endTime - startTime) / 1000) * 30);

    const newOverlay: OverlayConfig = {
      startFrame,
      duration: Math.max(duration, 30),
      type: TemplateType.STOCK_VIDEO,
      videoSrc,
      provider: 'Pexels'
    };

    // Remove overlapping overlays
    const nonOverlappingOverlays = variant.overlays.filter(overlay => {
      if (overlay.type !== TemplateType.STOCK_VIDEO) return true;
      const overlayEnd = overlay.startFrame + overlay.duration;
      return !(startFrame <= overlayEnd && (startFrame + duration) >= overlay.startFrame);
    });

    setVideoVariants([{
      ...variant,
      overlays: [...nonOverlappingOverlays, newOverlay]
    }]);
  };

  return {
    highlights: overlaysToHighlights(),
    isDragging,
    setIsDragging,
    activeHighlight,
    setActiveHighlight,
    dragType,
    setDragType,
    updateHighlightDuration,
    words,        // now array of { word, timeMs }
    hoveredHighlight,
    setHoveredHighlight,
    selectionStart,
    setSelectionStart,
    selectionEnd,
    setSelectionEnd,
    addHighlight
  };
};

export function StockVideoUploader() {
  const [isUploading, setIsUploading] = useState(false);
  const [videoVariants, setVideoVariants] = useState<VideoVariant[]>([]);
  const [showCaptions, setShowCaptions] = useState(true);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<{ videoSrc: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState<RenderProgress | null>(null);
  const { toast } = useToast();
  const [selectedVideo, setSelectedVideo] = useState<{ videoSrc: string } | null>(null);
  const [pendingTranscriptSegment, setPendingTranscriptSegment] = useState<TranscriptLine | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout>();
  
  // Mock overlays based on the logs
  const [mockOverlays, setMockOverlays] = useState([
    {
      startFrame: Math.round((8540 / 1000) * 30),
      duration: Math.round((2000 / 1000) * 30),
      type: TemplateType.STOCK_VIDEO,
      videoSrc: 'https://videos.pexels.com/video-files/5532765/5532765-sd_506_960_25fps.mp4',
      title: '',
      provider: 'Pexels'
    },
    {
      startFrame: Math.round((11800 / 1000) * 30),
      duration: Math.round((2000 / 1000) * 30),
      type: TemplateType.STOCK_VIDEO,
      videoSrc: 'https://videos.pexels.com/video-files/5532765/5532765-sd_506_960_25fps.mp4',
      title: '',
      provider: 'Pexels'
    },
    {
      startFrame: Math.round((14560 / 1000) * 30),
      duration: Math.round((2000 / 1000) * 30),
      type: TemplateType.STOCK_VIDEO,
      videoSrc: 'https://videos.pexels.com/video-files/5532765/5532765-sd_506_960_25fps.mp4',
      title: '',
      provider: 'Pexels'
    }
  ]);

  const demoVideoUrl = 'https://hx7mp5wayo6ybdwl.public.blob.vercel-storage.com/IMG_6062-ustELCsT8kuxTiuEmUhR0NTEefvx6P.MP4';
  const demoTranscriptUrl = 'https://hx7mp5wayo6ybdwl.public.blob.vercel-storage.com/transcript-YxnHCXJcmH4JJqN5LH4M7r79CprrIa.json';

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
      
      console.log('🚀 Starting demo load with:', { demoVideoUrl, demoTranscriptUrl });

      // Use static dimensions for portrait mode videos
      const width = 1080;
      const height = 1920;
      
      // Test video metadata retrieval explicitly with detailed logging
      console.log('📏 Attempting to get video metadata...');
      
      // Initialize slowDurationInSeconds with a default value
      let slowDurationInSeconds = 30; // Default 30 seconds
      
      try {
        console.log('📏 Calling parseMedia with URL:', demoVideoUrl);
        const metadata = await parseMedia({
          src: demoVideoUrl,
          fields: {
            slowDurationInSeconds: true
          },
          acknowledgeRemotionLicense: true
        });
        console.log('📏 Video metadata retrieved successfully:', {
          slowDurationInSeconds: metadata.slowDurationInSeconds,
          fullMetadata: metadata
        });
        
        slowDurationInSeconds = metadata.slowDurationInSeconds;
      } catch (metadataError) {
        console.error('❌ Failed to get video metadata:', {
          error: metadataError,
          message: metadataError.message,
          stack: metadataError.stack
        });
        console.warn('⚠️ Using fallback duration:', slowDurationInSeconds);
      }

      // Calculate frames using the metadata (either retrieved or fallback)
      const durationInFrames = Math.round(slowDurationInSeconds * 30);
      console.log('📏 Using duration in frames:', durationInFrames);

      // Check transcript URL accessibility
      console.log('📝 Checking transcript URL accessibility...');
      const transcriptResponse = await fetch(demoTranscriptUrl);
      
      if (!transcriptResponse.ok) {
        throw new Error(`Transcript URL is not accessible: ${transcriptResponse.status} ${transcriptResponse.statusText}`);
      }

      const transcriptData = await transcriptResponse.json();
      console.log('📝 Loaded transcript data:', transcriptData);

      // Create a mock variant with demo content
      const demoVariant = {
        src: demoVideoUrl,
        overlays: mockOverlays,
        durationInFrames,
        width,
        height,
        transcriptionUrl: demoTranscriptUrl,
        provider: 'Pexels'
      };

      console.log('✨ Setting video variant with metadata:', {
        durationInFrames,
        width,
        height,
        durationInSeconds: slowDurationInSeconds
      });
      setVideoVariants([demoVariant]);
      setTranscript(transcriptData.transcription);
      
      toast({
        title: "Success",
        description: "Demo content loaded successfully!",
      });

    } catch (error) {
      console.error('❌ Demo loading error:', error);
      // Log detailed error information
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
      
      toast({
        title: "Error",
        description: `Failed to load demo content: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle search operation
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    console.log('🔍 Starting Search:', {
      searchTerm
    });

    try {
      const response = await fetch(`/api/search-videos?term=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) throw new Error('Search failed');
      
      const data = await response.json();
      console.log('🎥 Search Results:', {
        resultCount: data.videos?.length || 0,
        firstResult: data.videos?.[0]
      });
      
      setSearchResults(data.videos || []);
    } catch (error) {
      console.error('❌ Search error:', error);
      toast({
        title: "Error",
        description: "Failed to search videos. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle continue button click in the search dialog
  const handleContinueClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!selectedVideo || !videoVariants.length || !pendingTranscriptSegment) {
      toast({
        title: "Error",
        description: "Missing required data for video replacement",
        variant: "destructive",
      });
      return;
    }

    const variant = videoVariants[0];
    const startFrame = Math.round((pendingTranscriptSegment.startMs / 1000) * 30);
    const endFrame = Math.round((pendingTranscriptSegment.endMs / 1000) * 30);
    const duration = Math.max(endFrame - startFrame, 30);

    // Find if there's an existing overlay for this segment
    const existingOverlayIndex = variant.overlays.findIndex(overlay => 
      overlay.type === TemplateType.STOCK_VIDEO &&
      overlay.startFrame <= endFrame && 
      (overlay.startFrame + overlay.duration) >= startFrame
    );

    let updatedOverlays = [...variant.overlays];
    
    if (existingOverlayIndex !== -1) {
      // Update existing overlay with new video source
      updatedOverlays[existingOverlayIndex] = {
        ...updatedOverlays[existingOverlayIndex],
        videoSrc: selectedVideo.videoSrc,
        provider: 'Pexels'
      };
    } else {
      // Create new overlay
      const newOverlay: OverlayConfig = {
        startFrame,
        duration,
        type: TemplateType.STOCK_VIDEO,
        videoSrc: selectedVideo.videoSrc,
        provider: 'Pexels'
      };
      updatedOverlays.push(newOverlay);
    }

    // Update video variants with new overlays
    setVideoVariants([{
      ...variant,
      overlays: updatedOverlays
    }]);

    setIsSearchOpen(false);
    setSelectedVideo(null);

    toast({
      title: "Success",
      description: "B-Roll updated successfully",
    });
  };

  const handleRegenerateAll = async () => {
    if (!videoVariants.length) return;
    
    try {
      const variant = videoVariants[0];
      // Show loading state
      toast({
        title: "Regenerating",
        description: "Generating new B-roll suggestions...",
      });

      const response = await fetch('/api/stock-videos/regenerate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoSrc: variant.src,
          transcriptionUrl: variant.transcriptionUrl,
          durationInFrames: variant.durationInFrames,
        }),
      });

      if (!response.ok) throw new Error('Regeneration failed');

      const data = await response.json();
      
      if (data.success) {
        setVideoVariants([{
          ...variant,
          overlays: data.overlays
        }]);
        
        toast({
          title: "Success",
          description: "B-roll suggestions have been regenerated!",
        });
      }
    } catch (error) {
      console.error('Regeneration error:', error);
      toast({
        title: "Error",
        description: "Failed to regenerate B-roll suggestions. Please try again.",
        variant: "destructive",
      });
    }
  };

  const checkRenderProgress = async (renderId: string, bucketName: string) => {
    console.log('🔍 Checking render progress for:', { renderId, bucketName });
    
    // Ensure we have valid parameters
    if (!renderId || !bucketName) {
      console.error('❌ Invalid parameters for checkRenderProgress:', { renderId, bucketName });
      return;
    }
    
    try {
      // Create the request payload
      const payload = {
        id: renderId,
        bucketName: bucketName,
      };
      
      console.log('📤 Sending progress request with payload:', JSON.stringify(payload, null, 2));
      
      const response = await fetch('/api/lambda/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📡 Progress response status:', response.status);
      console.log('📡 Progress response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('📡 Raw progress response:', responseText);

      if (!response.ok) {
        let errorMessage = `Failed to fetch progress (${response.status})`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        throw new Error(errorMessage);
      }

      const responseData = JSON.parse(responseText);
      console.log('✅ Progress data received:', responseData);
      
      // Extract the actual progress data, handling potential nested structure
      const progress: RenderProgress = responseData.data || responseData;

      setRenderProgress(progress);

      if (progress.type === 'done') {
        setIsRendering(false);
        clearInterval(progressIntervalRef.current);
        // Trigger download
        if (progress.url) {
          window.location.href = progress.url;
        }
        toast({
          title: "Success",
          description: "Video rendered successfully!",
        });
      } else if (progress.type === 'error') {
        setIsRendering(false);
        clearInterval(progressIntervalRef.current);
        toast({
          title: "Error",
          description: progress.message || "Failed to render video",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error checking render progress:', error);
      toast({
        title: "Error",
        description: "Failed to check render progress",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async () => {
    if (!videoVariants.length) return;
    
    setIsRendering(true);
    setRenderProgress({ type: 'progress', progress: 0 });

    try {
      const variant = videoVariants[0];
      
      // Use static dimensions for portrait mode videos
      const width = 1080;
      const height = 1920;
      const fps = 30;
      
      // Calculate video metadata on client side
      console.log("📏 Getting video metadata...");
      let slowDurationInSeconds = variant.durationInFrames / fps; // Default fallback
      
      try {
        console.log("📏 Parsing media for:", variant.src);
        const metadata = await parseMedia({
          src: variant.src,
          fields: {
            fps: true,
            slowDurationInSeconds: true
          },
          acknowledgeRemotionLicense: true
        });
        
        console.log("📏 Media metadata:", { 
          fps: metadata.fps, 
          slowDurationInSeconds: metadata.slowDurationInSeconds 
        });
        
        // Use the retrieved metadata
        slowDurationInSeconds = metadata.slowDurationInSeconds;
      } catch (error) {
        console.error("❌ Error getting video metadata:", error);
        console.warn("⚠️ Using fallback duration:", slowDurationInSeconds);
      }
      
      // Calculate duration in frames based on the video duration
      const durationInFrames = Math.floor(slowDurationInSeconds * fps);
      
      console.log("📐 Final video settings:", {
        slowDurationInSeconds,
        fps,
        durationInFrames,
        width,
        height,
        timeInSeconds: durationInFrames / fps
      });
      
      // Log the request payload
      const payload = {
        id: 'captioned-video',
        inputProps: {
          src: variant.src,
          overlays: variant.overlays,
          transcriptionUrl: variant.transcriptionUrl,
          showCaptions,
        },
        fps,
        durationInFrames,
        width,
        height,
      };
      console.log('🚀 Starting render request with payload:', JSON.stringify(payload, null, 2));

      const response = await fetch('/api/lambda/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Log detailed response information
      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      const responseText = await response.text();
      console.log('📡 Raw response:', responseText);

      if (!response.ok) {
        let errorMessage = `Failed to start render (${response.status})`;
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        throw new Error(errorMessage);
      }

      const responseData = JSON.parse(responseText);
      console.log('✅ Render started successfully:', responseData);
      
      // Extract the actual data from the nested structure
      const data = responseData.data || responseData;
      
      // Validate the data before starting the interval
      if (!data.renderId || !data.bucketName) {
        console.error('❌ Missing required fields in render response data:', data);
        toast({
          title: "Error",
          description: "Invalid response from render service. Missing renderId or bucketName.",
          variant: "destructive",
        });
        setIsRendering(false);
        return;
      }
      
      console.log('🔄 Starting progress polling with:', { 
        renderId: data.renderId, 
        bucketName: data.bucketName 
      });

      // Define a named function for the interval
      const pollProgress = () => {
        console.log('⏱️ Polling progress at:', new Date().toISOString());
        checkRenderProgress(data.renderId, data.bucketName);
      };

      // Start polling for progress
      progressIntervalRef.current = setInterval(pollProgress, 2000);
      
      // Call once immediately to start checking
      pollProgress();
    } catch (error) {
      console.error('❌ Error starting render:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }
      setIsRendering(false);
      setRenderProgress(null);
      toast({
        title: "Error",
        description: error.message || "Failed to start video render",
        variant: "destructive",
      });
    }
  };

  // Add cleanup for interval
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        console.log('🧹 Cleaning up progress interval on unmount');
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              if (window.confirm('Are you sure you want to go back? Any unsaved changes will be lost.')) {
                // Add navigation logic here
              }
            }}
            className="text-gray-600 hover:text-gray-800 text-sm flex items-center gap-2"
          >
            <span>←</span>
            <span>Back to Home</span>
          </button>
          <img src="craftclipslogov2.png" alt="CraftClips.ai" className="h-9" />
        </div>
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            className="text-orange-500 hover:text-orange-600 px-4 py-2 h-9"
            onClick={() => setShowPricingModal(true)}
          >
            Upgrade
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRegenerateAll}
            className="h-9 px-4 py-2 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Regenerate All B-Roll
          </Button>
          <Button 
            variant="outline" 
            className="px-4 py-2 h-9 flex items-center gap-2"
            onClick={handleButtonClick}
          >
            <Upload className="w-4 h-4" />
            Upload Another Video
          </Button>
          <Button 
            className="bg-[#4F46E5] hover:bg-[#4338CA] text-white px-4 py-2 h-9 flex items-center gap-2"
            onClick={handleDownload}
            disabled={isRendering || !videoVariants.length}
          >
            {isRendering ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {renderProgress?.type === 'progress' && renderProgress.progress 
                  ? `${Math.round(renderProgress.progress * 100)}%` 
                  : 'Rendering...'}
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {videoVariants.length > 0 ? (
          <>
            {/* Transcript Editor Component */}
            <TranscriptEditor
              transcript={transcript}
              videoVariants={videoVariants}
              setVideoVariants={setVideoVariants}
              handleSearch={handleSearch}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedVideo={selectedVideo}
              setSelectedVideo={setSelectedVideo}
              isSearchOpen={isSearchOpen}
              setIsSearchOpen={setIsSearchOpen}
              showInstructions={showInstructions}
              setShowInstructions={setShowInstructions}
              setPendingTranscriptSegment={setPendingTranscriptSegment}
            />

            {/* Video Section */}
            <div className="w-[60%] h-full flex flex-col bg-gray-50">
              <div className="text-right p-3 text-sm text-gray-600 border-b">
                Basic Stock videos provided by <a href="#" className="text-gray-800">Pexels</a>. 
                <button 
                  onClick={() => setShowPricingModal(true)} 
                  className="text-blue-600 hover:text-blue-700 ml-1"
                >
                  Upgrade to iStock
                </button>
              </div>
              {videoVariants.map((variant, index) => (
                <div key={index} className="flex-1 flex items-center justify-center p-6">
                  <div className="h-full max-h-[calc(100vh-12rem)] aspect-[9/16]">
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
                        height: '100%',
                      }}
                      controls
                    />
                  </div>
                </div>
              ))}
              <div className="px-6 pb-3 text-sm text-gray-600">
                Pro tip: If you encounter a bug while editing, try refreshing the page to resolve the issue.
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              onChange={handleUpload}
              disabled={isUploading}
              className="hidden"
            />
            <Button 
              onClick={handleButtonClick}
              disabled={isUploading}
              className="w-64"
            >
              {isUploading ? 'Processing...' : 'Select Video'}
            </Button>
            <Button 
              onClick={handleDemoClick}
              disabled={isUploading}
              variant="secondary"
              className="w-64"
            >
              Load Demo Content
            </Button>
          </div>
        )}
      </div>

      {/* Search Assets Dialog */}
      {isSearchOpen && (
        <div onClick={(e) => { e.stopPropagation(); }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div id="asset-search-dialog" className="bg-white rounded-lg w-[90vw] max-w-4xl max-h-[90vh] flex flex-col">
            {/* Main content area */}
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Search Assets</h2>
                <button 
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSelectedVideo(null);
                  }}
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

              <div className="grid grid-cols-3 gap-4">
                {searchResults.map((result, index) => (
                  <div 
                    key={index} 
                    className={`aspect-[9/16] relative rounded-lg overflow-hidden cursor-pointer transition-all
                              ${selectedVideo?.videoSrc === result.videoSrc ? 'ring-4 ring-blue-500' : 'hover:ring-2 hover:ring-blue-300'}`}
                    onClick={() => setSelectedVideo(result)}
                  >
                    <AbsoluteFill>
                      <video
                        src={result.videoSrc}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        muted
                      />
                    </AbsoluteFill>
                  </div>
                ))}
              </div>
            </div>

            {/* Fixed banner at bottom */}
            <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
              <div className="flex justify-end">
                <Button
                  onClick={handleContinueClick}
                  disabled={!selectedVideo}
                  className={!selectedVideo ? 'opacity-50 cursor-not-allowed' : ''}
                >
                  Continue
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Modal */}
      {showPricingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPricingModal(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">iStock Pricing</h2>
              <button 
                onClick={() => setShowPricingModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            <div className="mb-6">
              <p className="text-gray-600 mb-4">Get access to premium iStock videos for your content.</p>
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">20 Videos Package</span>
                  <span className="text-xl font-bold">$2</span>
                </div>
                <p className="text-sm text-gray-500">This is the same price as what we are paying, we&apos;re not making any more, that&apos;s just what iStock charges.</p>
              </div>
            </div>
            <Button 
              className="w-full"
              onClick={() => {
                setShowPricingModal(false);
                toast({
                  title: "Coming Soon",
                  description: "This feature will be available soon!",
                });
              }}
            >
              Upgrade Now
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}