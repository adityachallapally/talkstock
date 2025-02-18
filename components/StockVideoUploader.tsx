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
import { Trash2, HelpCircle, RotateCcw } from 'lucide-react';

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

// New hook for interactive highlight logic (revised to use transcript timing)
const useHighlights = (transcript: TranscriptLine[], videoVariants: VideoVariant[], setVideoVariants: (v: VideoVariant[]) => void) => {
  // Build an array of word objects with timing info
  const wordData = transcript.reduce((acc: { word: string; timeMs: number; segmentIndex: number }[], line, segmentIndex) => {
    const lineWords = line.text.split(/(\s+|\b)/).filter(w => w.length > 0);
    const wordCount = lineWords.length;
    const duration = line.endMs - line.startMs;
    const durationPerWord = wordCount > 0 ? duration / wordCount : 0;
    lineWords.forEach((word, i) => {
      acc.push({
        word,
        timeMs: line.startMs + i * durationPerWord,
        segmentIndex
      });
    });
    return acc;
  }, []);

  const words = wordData;
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
        const overlayStart = (overlay.startFrame / 30) * 1000;
        const overlayEnd = ((overlay.startFrame + overlay.duration) / 30) * 1000;

        // Find the indices in the words array that fall within these times
        const startIndex = words.findIndex(wordObj => wordObj.timeMs >= overlayStart);
        const endIndex = words.findIndex(wordObj => wordObj.timeMs > overlayEnd);
        
        if (startIndex !== -1) {
          highlights.push({
            id: overlay.startFrame.toString(),
            start: startIndex,
            end: endIndex === -1 ? words.length - 1 : endIndex - 1,
            overlay
          });
        }
      }
    });

    return highlights;
  };

  const updateHighlightDuration = (id: string, newStart: number, newEnd: number) => {
    if (!videoVariants.length || words.length === 0) return;
    const variant = videoVariants[0];
    
    // Get the times corresponding to the new start and end indices
    const startTime = words[newStart]?.timeMs;
    const endTime = words[newEnd]?.timeMs;
    
    if (startTime === undefined || endTime === undefined) return;
    
    const newStartFrame = Math.round((startTime / 1000) * 30);
    const newDuration = Math.round(((endTime - startTime) / 1000) * 30);

    const updatedOverlays = variant.overlays.map(overlay => {
      if (overlay.type === TemplateType.STOCK_VIDEO && overlay.startFrame.toString() === id) {
        return {
          ...overlay,
          startFrame: newStartFrame,
          duration: Math.max(newDuration, 30) // Ensure minimum duration of 1 second
        };
      }
      return overlay;
    });
    
    setVideoVariants([{ ...variant, overlays: updatedOverlays }]);
  };

  const addHighlight = (startIndex: number, endIndex: number, videoSrc: string) => {
    if (!videoVariants.length || Math.abs(startIndex - endIndex) < 2) return;
    
    const variant = videoVariants[0];
    const startTime = words[startIndex]?.timeMs;
    const endTime = words[endIndex]?.timeMs;
    
    if (startTime === undefined || endTime === undefined) return;
    
    const startFrame = Math.round((startTime / 1000) * 30);
    const duration = Math.round(((endTime - startTime) / 1000) * 30);

    // Create new overlay
    const newOverlay: OverlayConfig = {
      startFrame,
      duration: Math.max(duration, 30), // Ensure minimum duration of 1 second
      type: TemplateType.STOCK_VIDEO,
      videoSrc,
      provider: 'Pexels'
    };

    // Remove any overlapping overlays
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
  const [selectedText, setSelectedText] = useState('');
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);
  const [selectedTranscriptSegment, setSelectedTranscriptSegment] = useState<TranscriptLine | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [clickedSegmentIndex, setClickedSegmentIndex] = useState<number | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<{ videoSrc: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasExistingOverlay, setHasExistingOverlay] = useState(false);
  const [pendingTranscriptSegment, setPendingTranscriptSegment] = useState<TranscriptLine | null>(null);
  const { toast } = useToast();
  const [selectedVideo, setSelectedVideo] = useState<{ videoSrc: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New state for help toggle in transcript highlight UI
  const [showHelp, setShowHelp] = useState(false);

  // Ref for the transcript container
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute transcript text
  // const transcriptText = transcript.map(line => line.text).join(' ');
  
  // Use the revised highlights hook, passing transcript instead of transcriptText
  const {
    highlights,
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
  } = useHighlights(transcript, videoVariants, setVideoVariants);

  // Functions for interactive highlight adjustments
  const getWordIndexAtPosition = (x: number, y: number): number | null => {
    if (!containerRef.current) return null;
    const elements = document.elementsFromPoint(x, y);
    const wordElement = elements.find(el => el.getAttribute('data-word-index') !== null);
    if (wordElement) {
      const index = wordElement.getAttribute('data-word-index');
      return index ? parseInt(index) : null;
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent, highlightId: string | null = null, type: string | null = null) => {
    // Only log word-level interactions
    if (!isDragging && !highlightId) {
      console.log('🎯 Word Click:', {
        wordIndex: (e.target as HTMLElement).getAttribute('data-word-index'),
        text: (e.target as HTMLElement).textContent?.trim()
      });
    }
    
    e.preventDefault();
    if (highlightId) {
      setActiveHighlight(highlightId);
      setDragType(type);
      setIsDragging(true);
    } else {
      const wordIndex = getWordIndexAtPosition(e.clientX, e.clientY);
      if (wordIndex !== null) {
        setSelectionStart(wordIndex);
        setSelectionEnd(wordIndex);
        setIsDragging(true);
      }
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const wordIndex = getWordIndexAtPosition(e.clientX, e.clientY);
    if (wordIndex === null) return;

    if (activeHighlight) {
      const highlight = highlights.find(h => h.id === activeHighlight);
      if (highlight) {
        if (dragType === 'start') {
          updateHighlightDuration(activeHighlight, wordIndex, highlight.end);
        } else {
          updateHighlightDuration(activeHighlight, highlight.start, wordIndex);
        }
      }
    } else {
      setSelectionEnd(wordIndex);
    }
  };

  const handleMouseUp = () => {
    // Log only when there's a meaningful selection
    if (isDragging && !activeHighlight && selectionStart !== null && selectionEnd !== null) {
      const startWord = words[selectionStart];
      const endWord = words[selectionEnd];
      console.log('=== Selection Complete ===', {
        selection: {
          start: { index: selectionStart, word: startWord?.word },
          end: { index: selectionEnd, word: endWord?.word }
        },
        segment: startWord && endWord ? transcript[startWord.segmentIndex] : null
      });
    }
    setIsDragging(false);
    setActiveHighlight(null);
    setDragType(null);
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, activeHighlight, dragType]);

  // Add handleHighlightClick function after handleMouseUp
  const handleHighlightClick = (e: React.MouseEvent, highlight: { id: string; start: number; end: number; overlay: OverlayConfig }) => {
    console.log('🔍 Highlight Click Debug:', {
      highlightRange: {
        start: highlight.start,
        end: highlight.end,
        text: words.slice(highlight.start, highlight.end + 1).map(w => w.word).join(' ')
      },
      startWord: words[highlight.start],
      endWord: words[highlight.end],
      allWords: words.slice(highlight.start, highlight.end + 1)
    });

    // Get the clicked element's position
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const menuPos = {
      x: rect.left + (rect.width / 2),
      y: rect.bottom
    };
    
    // Create a segment that spans the entire highlight
    const segment = {
      text: words.slice(highlight.start, highlight.end + 1).map(w => w.word).join(' '),
      startMs: words[highlight.start].timeMs,
      endMs: words[highlight.end].timeMs
    };
    
    console.log('🔍 Created Segment:', segment);
    
    setSelectedTranscriptSegment(segment);
    setPendingTranscriptSegment(segment);
    setMenuPosition(menuPos);
    setClickedSegmentIndex(highlight.start);
    setHasExistingOverlay(true);
  };

  // Update the renderWords function
  const renderWords = () => {
    return words.map((wordObj, index) => {
      const highlight = highlights.find(h => index >= h.start && index <= h.end);
      const isHovered = highlight && hoveredHighlight === highlight.id;
      const isSelected = selectionStart !== null && 
        index >= Math.min(selectionStart, selectionEnd || selectionStart) && 
        index <= Math.max(selectionStart, selectionEnd || selectionStart);
      
      const wrapperClasses = [
        'relative',
        'inline',
        highlight ? `bg-amber-600/${isHovered ? '90' : '75'}` : '',
        isSelected ? 'bg-amber-600/50' : '',
        highlight && index === highlight.start ? 'pl-2 rounded-l-md' : '',
        highlight && index === highlight.end ? 'pr-2 rounded-r-md' : '',
        'transition-colors duration-150',
        highlight ? 'cursor-pointer' : ''
      ].filter(Boolean).join(' ');
      
      return (
        <span
          key={index}
          data-word-index={index}
          className={wrapperClasses}
          onMouseDown={(e) => {
            if (highlight) {
              e.stopPropagation();
              handleHighlightClick(e, highlight);
            } else {
              handleMouseDown(e);
            }
          }}
          onMouseEnter={() => {
            if (highlight) {
              setHoveredHighlight(highlight.id);
            }
          }}
          onMouseLeave={() => {
            setHoveredHighlight(null);
          }}
        >
          {highlight && index === highlight.start && (
            <span
              className="absolute left-0.5 top-1/2 -translate-y-1/2 w-1 h-4 cursor-ew-resize bg-amber-500/50 hover:bg-amber-400 transition-colors rounded-full"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown(e, highlight.id, 'start');
              }}
            />
          )}
          {highlight && index === highlight.end && (
            <span
              className="absolute right-0.5 top-1/2 -translate-y-1/2 w-1 h-4 cursor-ew-resize bg-amber-500/50 hover:bg-amber-400 transition-colors rounded-full"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown(e, highlight.id, 'end');
              }}
            />
          )}
          {wordObj.word + " "}
        </span>
      );
    });
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      return;
    }

    const text = selection.toString().trim();
    if (text) {
      console.log('Text Selection:', {
        selectedText: text,
        selectionLength: text.length
      });

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      const container = range.startContainer;
      const textContent = container.textContent || '';
      const selectionStart = range.startOffset;
      const selectionEnd = range.endOffset;

      console.log('Selection Range:', {
        textContent,
        selectionStart,
        selectionEnd,
        containerType: container.nodeType,
        containerText: container.textContent
      });
      
      // Find all transcript segments that overlap with the selection
      const overlappingSegments = transcript.filter(segment => {
        const segmentStartInText = textContent.indexOf(segment.text);
        if (segmentStartInText === -1) return false;
        const segmentEndInText = segmentStartInText + segment.text.length;

        // More precise overlap check
        const isOverlapping = (
          // Selection completely contains segment
          (selectionStart <= segmentStartInText && selectionEnd >= segmentEndInText) ||
          // Segment completely contains selection
          (segmentStartInText <= selectionStart && segmentEndInText >= selectionEnd) ||
          // Selection overlaps with start of segment
          (selectionStart <= segmentStartInText && selectionEnd >= segmentStartInText) ||
          // Selection overlaps with end of segment
          (selectionStart <= segmentEndInText && selectionEnd >= segmentEndInText)
        );
        
        console.log('Segment Check:', {
          segmentText: segment.text,
          segmentStart: segmentStartInText,
          segmentEnd: segmentEndInText,
          isOverlapping,
          startMs: segment.startMs,
          endMs: segment.endMs
        });

        return isOverlapping;
      });

      console.log('Overlapping Segments:', {
        count: overlappingSegments.length,
        segments: overlappingSegments.map(s => ({
          text: s.text,
          startMs: s.startMs,
          endMs: s.endMs
        }))
      });

      if (overlappingSegments.length > 0 && videoVariants.length) {
        // Find the segments that best match the selection
        const selectedTextStart = textContent.indexOf(text, selectionStart);
        const selectedTextEnd = selectedTextStart + text.length;

        // Sort segments by how well they match the selection
        const sortedSegments = overlappingSegments.sort((a, b) => {
          const aStart = textContent.indexOf(a.text);
          const bStart = textContent.indexOf(b.text);
          const aDistance = Math.abs(aStart - selectedTextStart);
          const bDistance = Math.abs(bStart - selectedTextStart);
          return aDistance - bDistance;
        });

        console.log('Sorted Segments:', {
          selectedTextStart,
          selectedTextEnd,
          segments: sortedSegments.map(s => ({
            text: s.text,
            startMs: s.startMs,
            endMs: s.endMs,
            position: textContent.indexOf(s.text)
          }))
        });

        // Use the segments that best match the selection
        const firstSegment = sortedSegments[0];
        const lastSegment = sortedSegments[sortedSegments.length - 1];
        
        const combinedSegment = {
          text: text,
          startMs: firstSegment.startMs,
          endMs: lastSegment.endMs
        };

        console.log('Combined Segment:', combinedSegment);
        
        setSelectedTranscriptSegment(combinedSegment);

        const startFrame = Math.round((combinedSegment.startMs / 1000) * 30);
        const endFrame = Math.round((combinedSegment.endMs / 1000) * 30);
        
        // Check if there's an existing overlay
        const existingOverlay = videoVariants[0].overlays.find(overlay => 
          overlay.type === 'STOCK_VIDEO' && 
          overlay.startFrame <= endFrame && 
          (overlay.startFrame + overlay.duration) >= startFrame
        );

        console.log('Overlay Check:', {
          startFrame,
          endFrame,
          hasExisting: !!existingOverlay,
          existingOverlay,
          allOverlays: videoVariants[0].overlays
        });

        setHasExistingOverlay(!!existingOverlay);
      } else {
        setHasExistingOverlay(false);
        setSelectedTranscriptSegment(null);
      }

      setSelectedText(text);
      setSelectedRange(range);
      setMenuPosition({
        x: rect.left + (rect.width / 2),
        y: rect.bottom
      });
      setClickedSegmentIndex(null);
    }
  };

  const findLongestWord = (text: string): string => {
    return text.split(/\s+/).reduce((longest, current) => {
      return current.length > longest.length ? current : longest;
    }, '');
  };

  // New dropdown action functions
  const handleAISelectVideo = async () => {
    if (!selectedText) return;
    // Implement AI selection logic here
    toast({ title: "Success", description: "AI selected video added successfully" });
  };

  const handleManualSelect = () => {
    console.log('🎯 Selection State:', {
      segmentText: selectedTranscriptSegment?.text,
      wordRange: selectionStart !== null && selectionEnd !== null ? 
        words.slice(selectionStart, selectionEnd + 1).map(w => w.word).join(' ') : null
    });
    
    if (selectedTranscriptSegment) {
      setPendingTranscriptSegment(selectedTranscriptSegment);
      setSearchTerm(selectedTranscriptSegment.text || selectedText);
      setIsSearchOpen(true);
      
      console.log('2. State Updates:', {
        segment: selectedTranscriptSegment,
        searchTerm: selectedTranscriptSegment.text || selectedText,
        words: words
      });
      
      window.getSelection()?.removeAllRanges();
      setSelectedText('');
      setMenuPosition(null);
      setSelectedRange(null);
    }
  };

  const handleDeleteBRoll = () => {
    if (videoVariants.length && selectedTranscriptSegment) {
      const variant = videoVariants[0];
      const startFrame = Math.round((selectedTranscriptSegment.startMs / 1000) * 30);
      const endFrame = Math.round((selectedTranscriptSegment.endMs / 1000) * 30);
      const newOverlays = variant.overlays.filter(overlay =>
        !(overlay.type === 'STOCK_VIDEO' &&
          overlay.startFrame <= endFrame &&
          (overlay.startFrame + overlay.duration) >= startFrame)
      );
      setVideoVariants([{ ...variant, overlays: newOverlays }]);
      toast({ title: "Success", description: "B Roll deleted successfully" });
    } else {
      toast({ title: "Error", description: "Could not determine segment", variant: "destructive" });
    }
  };

  const handleClickAway = () => {
    console.log('handleClickAway - Entry point with state:', {
      isSearchOpen,
      hasSelectedTranscriptSegment: !!selectedTranscriptSegment,
      hasPendingTranscriptSegment: !!pendingTranscriptSegment,
      menuPosition,
      clickedSegmentIndex
    });
    
    setSelectedText('');
    setMenuPosition(null);
    setClickedSegmentIndex(null);
    
    // Log state right before the isSearchOpen check
    console.log('handleClickAway - Before isSearchOpen check:', {
      isSearchOpen,
      pendingTranscriptSegment
    });
    
    if (!isSearchOpen) {
      console.log('handleClickAway - Clearing transcript segments because isSearchOpen is false');
      setSelectedTranscriptSegment(null);
      setPendingTranscriptSegment(null);
      setHasExistingOverlay(false);
    } else {
      console.log('handleClickAway - Preserving transcript segments because isSearchOpen is true');
    }
    
    if (selectedRange) {
      window.getSelection()?.removeAllRanges();
      setSelectedRange(null);
    }
    
    console.log('handleClickAway - Exit point');
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
    // Get the clicked word element
    const wordElement = event.target as HTMLElement;
    const wordIndex = wordElement.getAttribute('data-word-index');
    
    console.log('🔍 Word Click Debug:', {
        wordIndex,
        element: wordElement.textContent,
        startIndex
    });
    
    if (wordIndex) {
        const index = parseInt(wordIndex);
        const clickedWord = words[index];
        
        // Find the full segment this word belongs to
        const segment = transcript.find(seg => 
            clickedWord.timeMs >= seg.startMs && 
            clickedWord.timeMs <= seg.endMs
        );

        if (segment) {
            console.log('🔍 Found Segment:', {
                clickedWord: {
                    text: clickedWord.word,
                    timeMs: clickedWord.timeMs,
                    index
                },
                fullSegment: {
                    text: segment.text,
                    startMs: segment.startMs,
                    endMs: segment.endMs
                }
            });

            // Set the full segment for replacement
            setSelectedTranscriptSegment(segment);
            setPendingTranscriptSegment(segment);
            setClickedSegmentIndex(startIndex);
        }
    }

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    setMenuPosition({
        x: rect.left + (rect.width / 2),
        y: rect.bottom
    });
    setIsMenuOpen(true);
  };

  useEffect(() => {
    const transcriptDiv = document.getElementById('transcript-container');
    if (transcriptDiv) {
      const onMouseUp = () => {
        handleTextSelection();
      };
      transcriptDiv.addEventListener('mouseup', onMouseUp);
      return () => {
        transcriptDiv.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [transcript, videoVariants]);

  // Add click-away handler for dropdown menus
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      // Check if we have an open menu
      if (menuPosition) {
        // Get references to both dropdown menus
        const highlightDropdown = document.getElementById('highlight-dropdown');
        const transcriptDropdown = document.getElementById('transcript-dropdown');
        
        // Check if click is outside both dropdowns
        if (highlightDropdown && !highlightDropdown.contains(event.target as Node) &&
            transcriptDropdown && !transcriptDropdown.contains(event.target as Node)) {
          handleClickAway();
        }
      }
    };

    // Add global click listener
    document.addEventListener('click', handleGlobalClick);

    // Cleanup
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [menuPosition]);

  // Update the useEffect debug logging to be more verbose
  useEffect(() => {
    console.log('State Change Debug:', {
      menuPosition,
      selectedText,
      clickedSegmentIndex,
      hasSelectedTranscriptSegment: !!selectedTranscriptSegment,
      hasExistingOverlay,
      highlights: highlights.length
    });
  }, [menuPosition, selectedText, clickedSegmentIndex, selectedTranscriptSegment, hasExistingOverlay, highlights]);

  // Update the Continue button click handler in the search dialog
  const handleContinueClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('🔍 Continue Click:', {
      selectedVideo,
      pendingSegment: pendingTranscriptSegment,
      currentOverlays: videoVariants[0]?.overlays.map(o => ({
        type: o.type,
        startFrame: o.startFrame,
        duration: o.duration,
        timeRange: {
          start: (o.startFrame / 30) * 1000,
          end: ((o.startFrame + o.duration) / 30) * 1000
        }
      }))
    });

    if (!selectedVideo || !pendingTranscriptSegment || !videoVariants.length) {
      toast({
        title: "Error",
        description: "Missing required data for video replacement",
        variant: "destructive",
      });
      return;
    }

    const variant = videoVariants[0];
    const startFrame = Math.round((pendingTranscriptSegment.startMs / 1000) * 30);
    const duration = Math.round(((pendingTranscriptSegment.endMs - pendingTranscriptSegment.startMs) / 1000) * 30);

    // Remove any existing overlays that overlap with this time range
    const nonOverlappingOverlays = variant.overlays.filter(overlay => {
      if (overlay.type !== TemplateType.STOCK_VIDEO) return true;
      const overlayStartMs = (overlay.startFrame / 30) * 1000;
      const overlayEndMs = ((overlay.startFrame + overlay.duration) / 30) * 1000;
      return overlayEndMs <= pendingTranscriptSegment.startMs || 
             overlayStartMs >= pendingTranscriptSegment.endMs;
    });

    // Add the new overlay
    const newOverlay: OverlayConfig = {
      startFrame,
      duration: Math.max(duration, 30), // Ensure minimum duration of 1 second
      type: TemplateType.STOCK_VIDEO,
      videoSrc: selectedVideo.videoSrc,
      provider: 'Pexels'
    };

    setVideoVariants([{
      ...variant,
      overlays: [...nonOverlappingOverlays, newOverlay]
    }]);

    // Reset states
    setIsSearchOpen(false);
    setSelectedVideo(null);
    setPendingTranscriptSegment(null);
    setHasExistingOverlay(false);
    setSelectionStart(null);
    setSelectionEnd(null);

    toast({
      title: "Success",
      description: "B-Roll updated successfully",
    });
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
                {/* Transcript Section replaced with interactive highlight UI */}
                <div className="w-1/2">
                  <div className="bg-gray-900 text-gray-200 p-4 rounded-lg max-h-[600px] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-light text-gray-300">
                        Highlight transcript to generate B-roll
                      </h3>
                      <button 
                        onClick={() => setShowHelp(!showHelp)}
                        className="text-gray-400 hover:text-gray-300 flex items-center gap-2 transition-colors"
                      >
                        <HelpCircle className="w-4 h-4" />
                        <span>Help</span>
                      </button>
                    </div>
                    {showHelp && (
                      <div className="bg-gray-800 rounded-md p-4 mb-6 text-sm">
                        <h3 className="font-medium mb-2">How to use:</h3>
                        <ul className="space-y-2 text-gray-400">
                          <li>• Drag the handles to adjust B-roll timing</li>
                          <li>• Click on highlighted text to see options</li>
                        </ul>
                      </div>
                    )}
                    <div
                      ref={containerRef}
                      className="text-xl leading-loose select-none relative"
                      style={{ whiteSpace: 'normal', lineHeight: '2' }}
                    >
                      {renderWords()}
                    </div>
                  </div>
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

        {/* Dropdown Menu for highlighted text */}
        {menuPosition && selectedText && !clickedSegmentIndex && (
          <div 
            id="highlight-dropdown"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              left: `${menuPosition.x}px`,
              top: `${menuPosition.y}px`,
              transform: 'translateX(-50%)',
              backgroundColor: 'white',
              border: '1px solid #ccc',
              borderRadius: '4px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              zIndex: 1000
            }}
          >
            <div 
              onClick={handleAISelectVideo}
              className="hover:bg-gray-100"
              style={{ cursor: 'pointer', padding: '8px 16px', borderBottom: '1px solid #eee' }}
            >
              AI Select Video
            </div>
            <div 
              onClick={(e) => { e.stopPropagation(); handleManualSelect(); }}
              className="hover:bg-gray-100"
              style={{ cursor: 'pointer', padding: '8px 16px', borderBottom: hasExistingOverlay ? '1px solid #eee' : 'none' }}
            >
              Select B-Roll Manually
            </div>
            {hasExistingOverlay && (
              <div 
                onClick={handleDeleteBRoll}
                className="hover:bg-gray-100"
                style={{ cursor: 'pointer', padding: '8px 16px', color: '#dc2626' }}
              >
                Delete B-Roll
              </div>
            )}
          </div>
        )}

        {/* Dropdown Menu for transcript segment actions */}
        {menuPosition && clickedSegmentIndex !== null && (
          <div id="transcript-dropdown" 
               onMouseDown={(e) => e.stopPropagation()}
               onClick={(e) => e.stopPropagation()}
               style={{
                 position: 'fixed',
                 left: `${menuPosition.x}px`,
                 top: `${menuPosition.y}px`,
                 transform: 'translateX(-50%)',
                 backgroundColor: 'white',
                 border: '1px solid #ccc',
                 borderRadius: '4px'
               }}>
            <div onClick={() => {
                 console.log('Select B Roll Manually clicked - Starting state:', {
                   isSearchOpen,
                   clickedSegmentIndex,
                   hasTranscriptSegment: !!selectedTranscriptSegment,
                   pendingSegment: pendingTranscriptSegment
                 });
                 
                 if (pendingTranscriptSegment) {
                   console.log('Using pending segment:', pendingTranscriptSegment);
                   
                   // Use the full segment that was saved from the highlight click
                   setSearchTerm(pendingTranscriptSegment.text);
                   setSelectedText('');
                   setMenuPosition(null);
                   setClickedSegmentIndex(null);
                   setIsSearchOpen(true);
                   
                   console.log('State updates completed:', {
                     segment: pendingTranscriptSegment,
                     searchTerm: pendingTranscriptSegment.text
                   });
                 }
               }} style={{ cursor: 'pointer', padding: '8px', borderBottom: '1px solid #eee' }}>
                  Select B Roll Manually
            </div>
            <div onClick={() => {
                 console.log('Delete B Roll');
                 if (videoVariants.length && pendingTranscriptSegment) {
                   const variant = videoVariants[0];
                   // Use the timing from pendingTranscriptSegment
                   const deleteStartFrame = Math.round((pendingTranscriptSegment.startMs / 1000) * 30);
                   const deleteEndFrame = Math.round((pendingTranscriptSegment.endMs / 1000) * 30);
                   const newOverlays = variant.overlays.filter((overlay) => {
                     return !(overlay.type === 'STOCK_VIDEO' &&
                       overlay.startFrame <= deleteEndFrame &&
                       (overlay.startFrame + overlay.duration) >= deleteStartFrame);
                   });
                   setVideoVariants([{ ...variant, overlays: newOverlays }]);
                   toast({
                     title: "Success",
                     description: "B Roll deleted successfully",
                   });
                 }
                 handleClickAway();
               }} style={{ cursor: 'pointer', padding: '8px' }}>
                  Delete B Roll
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 