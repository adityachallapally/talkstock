'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Upload } from 'lucide-react';
import { upload } from '@vercel/blob/client';
import { parseMedia } from '@remotion/media-parser';

// Add type declaration for webkitAudioContext
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export interface VideoUploadResult {
  url: string;
  durationInFrames: number;
  transcriptionUrl?: string;
}

interface VideoSelectorProps {
  onVideoSelected?: (result: VideoUploadResult) => void;
}

export function VideoSelector({ onVideoSelected }: VideoSelectorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [audioExtractionProgress, setAudioExtractionProgress] = useState(0);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const demoVideoUrl = 'https://hx7mp5wayo6ybdwl.public.blob.vercel-storage.com/IMG_6062-ustELCsT8kuxTiuEmUhR0NTEefvx6P.MP4';
  const demoTranscriptUrl = 'https://hx7mp5wayo6ybdwl.public.blob.vercel-storage.com/transcript-YxnHCXJcmH4JJqN5LH4M7r79CprrIa.json';

  // Save video data to database
  const saveVideoToDatabase = async (videoData: {
    videoUrl: string;
    audioUrl?: string;
    durationInFrames: number;
    transcriptionUrl?: string;
  }) => {
    try {
      const response = await fetch('/api/videos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(videoData),
      });

      if (!response.ok) {
        throw new Error('Failed to save video data');
      }

      const data = await response.json();
      console.log('✅ Video data saved to database:', data);
      return data.id;
    } catch (error) {
      console.error('❌ Error saving video to database:', error);
      throw error;
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
      
      // Use direct client-side upload to Vercel Blob for video
      const { url: videoUrl } = await clientSideUpload(file, (percent) => {
        // Update progress directly with actual upload percentage
        setUploadProgress(percent);
      })();
      
      // Upload audio blob to Vercel Blob
      const audioFile = new File([audioBlob], `audio-${file.name.split('.')[0]}.wav`, { type: 'audio/wav' });
      const { url: audioUrl } = await clientSideUpload(audioFile, () => {})();
      
      const clientUploadTime = (Date.now() - clientUploadStartTime) / 1000;
      console.log(`⏱️ Client direct upload completed in ${clientUploadTime.toFixed(2)}s`);
      console.log(`⏱️ Video URL:`, videoUrl);
      console.log(`⏱️ Audio URL:`, audioUrl);
      
      // Create mock transcript URL (in a real app, you'd generate a real transcript)
      const transcriptionUrl = '';
      
      // Save video data to database
      const videoId = await saveVideoToDatabase({
        videoUrl,
        audioUrl,
        durationInFrames,
        transcriptionUrl
      });
      
      toast({
        title: "Success",
        description: "Video uploaded and processed successfully!",
      });

      // Call the callback with the result
      if (onVideoSelected) {
        onVideoSelected({
          url: videoUrl,
          durationInFrames,
          transcriptionUrl
        });
      }

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
    setShowLoadingScreen(true);

    try {
      console.log('🚀 Starting demo load with:', { demoVideoUrl, demoTranscriptUrl });
      
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
      
      toast({
        title: "Success",
        description: "Demo content loaded successfully!",
      });

      // Call the callback with the demo result
      if (onVideoSelected) {
        onVideoSelected({
          url: demoVideoUrl,
          durationInFrames,
          transcriptionUrl: demoTranscriptUrl
        });
      }

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
      setShowLoadingScreen(false);
    }
  };

  // Loading screen component
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
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-6">
      {/* Show loading screen when uploading */}
      {showLoadingScreen && <VideoUploadLoadingScreen />}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={handleUpload}
        disabled={isUploading}
        className="hidden"
      />
      
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold mb-2">Upload Your Video</h2>
        <p className="text-gray-600">Select a video file to upload or use our demo content</p>
      </div>
      
      <Button 
        onClick={handleButtonClick}
        disabled={isUploading}
        className="w-64 flex items-center gap-2"
      >
        <Upload className="w-4 h-4" />
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
      
      <p className="text-sm text-gray-500 mt-4 max-w-md text-center">
        Supported formats: MP4, MOV, AVI, WebM. Maximum file size: 500MB.
      </p>
    </div>
  );
} 