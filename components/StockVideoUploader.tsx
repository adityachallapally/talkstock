'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Player } from '@remotion/player';
import { AbsoluteFill, OffthreadVideo } from 'remotion';
import { CaptionedVideo } from '@/remotion/CaptionedVideo';
import { OverlayConfig, TemplateType } from '@/types/constants';
import { parseMedia } from '@remotion/media-parser';
import { Trash2, HelpCircle, RotateCcw, Upload, Download, RefreshCw, Check } from 'lucide-react';
import { RenderControls } from './Remotion/RenderControls';
import { TranscriptEditor } from './TranscriptEditor';
import { upload } from '@vercel/blob/client';

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

// Add this to the StockVideoUploader component props
interface StockVideoUploaderProps {
  initialVideoId?: number;
}

export function StockVideoUploader({ initialVideoId }: StockVideoUploaderProps) {
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
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState(0);
  const { toast } = useToast();
  const [selectedVideo, setSelectedVideo] = useState<{ videoSrc: string } | null>(null);
  const [pendingTranscriptSegment, setPendingTranscriptSegment] = useState<TranscriptLine | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout>();
  const [audioExtractionProgress, setAudioExtractionProgress] = useState(0);
  
  // Define processing stages - each time is in seconds when this stage should end
  const processingStages = [
    { name: "Uploading video", time: 2 },
    { name: "Planning AI edits", time: 4 },
    { name: "Adding B-Rolls", time: 6 },
    { name: "Finalizing", time: 8 }
  ];
  
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

// Helper function for direct client-side upload to Vercel Blob
const clientSideUpload = (
  file: File, 
  onProgress: (percent: number) => void
) => {
  return async () => {
    console.log(`📤 Starting client-side upload for file: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
    const startTime = Date.now();
    
    try {
      // Use the Vercel Blob client library for upload
      // This follows the Vercel Blob documentation for client-side uploads
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload-video',
        onUploadProgress: (progressEvent) => {
          console.log(`Loaded ${progressEvent.loaded} bytes`);
          console.log(`Total ${progressEvent.total} bytes`);
          console.log(`Percentage ${progressEvent.percentage}%`);
          // Update the UI progress bar with the actual percentage
          onProgress(progressEvent.percentage);
        },
      });
      
      console.log(`📤 Upload completed in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
      console.log(`✅ Upload to Vercel Blob successful!`);
      console.log(`🔗 File URL: ${blob.url}`);
      
      return { url: blob.url, id: '0' };
    } catch (error) {
      console.error('❌ Client-side upload failed:', error);
      throw error;
    }
  };
};

const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  if (!event.target.files || event.target.files.length === 0) {
    return;
  }

  console.log(`🎬 Upload process started at ${new Date().toISOString()}`);
  const uploadStartTime = Date.now();
  
  const file = event.target.files[0];
  setIsUploading(true);
  setShowLoadingScreen(true);
  setUploadProgress(0); // Reset progress
  setAudioExtractionProgress(0); // Reset audio extraction progress
  setVideoVariants([]);
  setTranscript([]);

  // Start audio extraction progress simulation
  const extractionDuration = 60000; // 1 minute in milliseconds
  const extractionInterval = 500; // Update every 500ms
  const extractionSteps = extractionDuration / extractionInterval;
  const extractionIncrement = 100 / extractionSteps;
  
  const extractionProgressInterval = setInterval(() => {
    setAudioExtractionProgress(prev => {
      const newProgress = prev + extractionIncrement;
      return newProgress >= 100 ? 100 : newProgress;
    });
  }, extractionInterval);

  try {
    // Extract audio from video and get duration
    const { audioBlob, durationInFrames } = await extractAudioFromVideo(file);
    
    // Clear the extraction progress interval once extraction is complete
    clearInterval(extractionProgressInterval);
    setAudioExtractionProgress(100);
    
    console.log(`🎧 Audio extracted successfully. audioBlob: ${audioBlob}, durationInFrames: ${durationInFrames}`);
    console.log(`⏱️ Starting direct upload to Vercel Blob at ${new Date().toISOString()}`);
    const clientUploadStartTime = Date.now();
    
    // Use direct client-side upload to Vercel Blob
    // This function will update the progress directly based on actual upload progress
    const { url } = await clientSideUpload(file, (percent) => {
      // Update progress directly with actual upload percentage
      setUploadProgress(percent);
    })();
    
    const clientUploadTime = (Date.now() - clientUploadStartTime) / 1000;
    console.log(`⏱️ Client direct upload completed in ${clientUploadTime.toFixed(2)}s`);
    console.log(`⏱️ File URL:`, url);
    
    // Upload is complete, now perform additional processing
    // Create the video variant with the Vercel Blob URL
    const videoVariant = {
      src: url,
      overlays: mockOverlays, // We'll update this after generating the transcript
      durationInFrames,
      transcriptionUrl: '',
      provider: 'Pexels'
    };
    
    // Set initial state with mock data while we generate the real transcript
    const mockTranscript = [
      { text: "Generating transcript and B-roll suggestions...", startMs: 0, endMs: 5000 },
      { text: "This may take a minute or two.", startMs: 5000, endMs: 10000 },
      { text: "The content will update automatically when ready.", startMs: 10000, endMs: 15000 }
    ];
    
    setVideoVariants([videoVariant]);
    setTranscript(mockTranscript);
    
    // If we have a video ID, generate a transcript and overlays
    if (initialVideoId) {
      try {
        // First create a FormData with the audio file
        const formData = new FormData();
        formData.append('audio', audioBlob, `audio-${initialVideoId}.wav`);
        
        // Call the transcript generation API
        const transcriptResponse = await fetch('/api/generate-transcript', {
          method: 'POST',
          body: formData
        });
        
        if (!transcriptResponse.ok) {
          console.error('Transcript generation failed');
          throw new Error('Failed to generate transcript');
        }
        
        const transcriptData = await transcriptResponse.json();
        console.log('Transcript generated:', transcriptData);
        
        // If we have a transcription URL, fetch the transcript
        if (transcriptData.transcriptionUrl) {
          try {
            const response = await fetch(transcriptData.transcriptionUrl);
            if (response.ok) {
              const data = await response.json();
              
              // Update the state with the real transcript and overlays
              setTranscript(data.transcription);
              
              // If overlays were generated, update the video variant
              if (transcriptData.overlays && transcriptData.overlays.length > 0) {
                setVideoVariants([{
                  ...videoVariant,
                  overlays: transcriptData.overlays,
                  transcriptionUrl: transcriptData.transcriptionUrl
                }]);
              } else {
                setVideoVariants([{
                  ...videoVariant,
                  transcriptionUrl: transcriptData.transcriptionUrl
                }]);
              }
              
              console.log('Updated video with transcript and overlays');
            }
          } catch (transcriptFetchError) {
            console.error('Error fetching transcript:', transcriptFetchError);
          }
        }
      } catch (transcriptError) {
        console.error('Error generating transcript:', transcriptError);
        toast({
          title: "Warning",
          description: "Video uploaded but transcript generation failed.",
          variant: "destructive",
        });
      }
    } else {
      setVideoVariants([videoVariant]);
      setTranscript(mockTranscript);
    }
    
    toast({
      title: "Success",
      description: "Video uploaded and processed successfully!",
    });

  } catch (error) {
    // Clear the extraction progress interval in case of error
    clearInterval(extractionProgressInterval);
    console.error('Upload error:', error);
    toast({
      title: "Error",
      description: "Failed to upload video. Please try again.",
      variant: "destructive",
    });
  } finally {
    const totalTime = (Date.now() - uploadStartTime) / 1000;
    console.log(`🏁 Total upload time: ${totalTime.toFixed(2)}s`);
    
    // Short delay to ensure user sees 100% completion state
    setTimeout(() => {
      console.log(`🔚 Cleaning up and hiding loading screen`);
      setIsUploading(false);
      setShowLoadingScreen(false);
      console.log(`✅ Process complete, loading screen hidden`);
    }, 500);
    
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

  // Add a useEffect to load the video when initialVideoId is provided
  useEffect(() => {
    if (initialVideoId) {
      loadVideoById(initialVideoId);
    }
  }, [initialVideoId]);
  
  // Function to load a video by ID
  const loadVideoById = async (id: number) => {
    try {
      console.log(`Loading video with ID: ${id}`);
      
      // Fetch video details from the API
      const response = await fetch(`/api/videos/${id}`);
      if (!response.ok) {
        throw new Error('Failed to load video');
      }
      
      const videoData = await response.json();
      console.log('Loaded video data:', videoData);
      
      // For now, create a dummy transcript if none exists
      const dummyTranscript: TranscriptLine[] = [
        { text: "This is a dummy transcript for testing.", startMs: 0, endMs: 3000 },
        { text: "It will be replaced with real transcription data later.", startMs: 3000, endMs: 6000 },
        { text: "Each line represents a segment of speech in the video.", startMs: 6000, endMs: 9000 },
      ];
      
      // Use overlays from the database if available, fallback to mock overlays if not
      const videoOverlays = videoData.overlays || mockOverlays;
      console.log(`Using ${videoData.overlays ? 'database' : 'mock'} overlays:`, videoOverlays);
      
      // Set up the video variant with the loaded data
      setVideoVariants([{
        src: videoData.videoLink || videoData.url,
        overlays: videoOverlays,
        durationInFrames: videoData.durationInFrames || 1800, // Default to 60 seconds if not available
        transcriptionUrl: videoData.transcriptionUrl || '',
        provider: 'Pexels'
      }]);
      
      // Set the transcript
      setTranscript(videoData.transcript || dummyTranscript);
      
      toast({
        title: "Success",
        description: "Video loaded successfully!",
      });
      
    } catch (error) {
      console.error('Error loading video:', error);
      toast({
        title: "Error",
        description: "Failed to load video. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Function to save overlays to the database
  const saveOverlays = async () => {
    if (!videoVariants.length || !initialVideoId) return;
    
    try {
      const variant = videoVariants[0];
      console.log('Saving overlays to database:', variant.overlays);
      
      const response = await fetch(`/api/videos/${initialVideoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          overlays: variant.overlays,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save overlays');
      }
      
      toast({
        title: "Success",
        description: "Overlays saved successfully!",
      });
      
    } catch (error) {
      console.error('Error saving overlays:', error);
      toast({
        title: "Error",
        description: "Failed to save overlays. Please try again.",
        variant: "destructive",
      });
    }
  };

// Modified VideoUploadLoadingScreen component
const VideoUploadLoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">Processing Your Video</h2>
          
          {/* Audio Extraction Progress */}
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2 text-left">
              Extracting audio
            </p>
            <Progress 
              value={audioExtractionProgress} 
              className="h-2 transition-all duration-300" 
              indicatorClassName="bg-green-600"
            />
            <div className="text-sm font-medium flex items-center justify-end gap-2 mt-1">
              <RefreshCw className={`w-3 h-3 ${audioExtractionProgress < 100 ? 'animate-spin' : ''}`} />
              {Math.round(audioExtractionProgress)}% {audioExtractionProgress >= 100 ? 'Complete' : 'Processing'}
            </div>
          </div>
          
          {/* Video Upload Progress */}
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-2 text-left">
              Uploading video
            </p>
            <Progress 
              value={uploadProgress} 
              className="h-2 transition-all duration-300" 
              indicatorClassName="bg-blue-600"
            />
            <div className="text-sm font-medium flex items-center justify-end gap-2 mt-1">
              <RefreshCw className={`w-3 h-3 ${uploadProgress < 100 ? 'animate-spin' : ''}`} />
              {Math.round(uploadProgress)}% {uploadProgress >= 100 ? 'Complete' : 'Uploaded'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Show loading screen when uploading */}
      {showLoadingScreen && <VideoUploadLoadingScreen />}
      
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
            disabled={isUploading}
          >
            <Upload className="w-4 h-4" />
            {isUploading ? 'Uploading...' : 'Upload Another Video'}
          </Button>
          {initialVideoId && (
            <Button 
              variant="outline" 
              className="px-4 py-2 h-9 flex items-center gap-2"
              onClick={saveOverlays}
            >
              <Check className="w-4 h-4" />
              Save Overlays
            </Button>
          )}
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
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Loading Video</h2>
              <p className="text-gray-500">Please wait while we prepare your editor</p>
            </div>
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