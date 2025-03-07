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

interface RenderProgress {
  type: 'progress' | 'done' | 'error';
  progress?: number;
  url?: string;
  message?: string;
}

// Modify the useHighlights hook to use indices
const useHighlights = (transcript: TranscriptLine[], videoVariants: VideoVariant[], setVideoVariants: (v: VideoVariant[]) => void) => {
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
  const [selectedText, setSelectedText] = useState('');
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);
  const [selectedTranscriptSegment, setSelectedTranscriptSegment] = useState<TranscriptLine | null>(null);
  const [pendingTranscriptSegment, setPendingTranscriptSegment] = useState<TranscriptLine | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<{ videoSrc: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasExistingOverlay, setHasExistingOverlay] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState<RenderProgress | null>(null);
  const { toast } = useToast();
  const [selectedVideo, setSelectedVideo] = useState<{ videoSrc: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showHelp, setShowHelp] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout>();

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
    const wordIndex = (e.target as HTMLElement).getAttribute('data-word-index');
    if (wordIndex) {  // Only log if we actually clicked a word
        console.log('🎯 Word Click:', {
            word: words[parseInt(wordIndex)].word,
            action: highlightId ? 'adjust-highlight' : 'new-selection'
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
            setSelectedTranscriptSegment(null);
            setPendingTranscriptSegment(null);
            setHasExistingOverlay(false);
        }
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const wordIndex = getWordIndexAtPosition(e.clientX, e.clientY);
    if (wordIndex === null) return;

    if (activeHighlight) {
      const highlight = highlights.find(h => h.id === activeHighlight);
      if (!highlight) {
        // Recovery logic for lost highlight reference
        const variant = videoVariants[0];
        if (variant) {
          const overlayId = activeHighlight;
          const overlay = variant.overlays.find(o => 
            o.type === TemplateType.STOCK_VIDEO && 
            o.startFrame.toString() === overlayId
          );
          
          if (overlay) {
            const startMs = (overlay.startFrame / 30) * 1000;
            const endMs = ((overlay.startFrame + overlay.duration) / 30) * 1000;
            
            // Find word indices that match these times
            const startIndex = words.findIndex(w => w.startMs >= startMs);
            const endIndex = words.findLastIndex(w => w.endMs <= endMs);

            if (startIndex !== -1 && endIndex !== -1) {
              if (dragType === 'start') {
                // Add buffer for left handle and ensure bounds
                const adjustedWordIndex = Math.max(0, wordIndex);
                if (adjustedWordIndex < endIndex) {
                  updateHighlightDuration(activeHighlight, adjustedWordIndex, endIndex, 'start');
                }
              } else if (dragType === 'end') {
                // Right handle remains the same
                if (wordIndex >= startIndex) {
                  updateHighlightDuration(activeHighlight, startIndex, wordIndex, 'end');
                }
              }
            }
            return;
          }
        }
        return;
      }

      if (dragType === 'start') {
        // Add buffer for left handle and ensure bounds
        const adjustedWordIndex = Math.max(0, wordIndex);
        if (adjustedWordIndex < highlight.end) {
          updateHighlightDuration(activeHighlight, adjustedWordIndex, highlight.end, 'start');
        }
      } else if (dragType === 'end') {
        // Right handle remains the same
        if (wordIndex >= highlight.start) {
          updateHighlightDuration(activeHighlight, highlight.start, wordIndex, 'end');
        }
      }
    } else if (selectionStart !== null) {
      setSelectionEnd(wordIndex);
      
      const start = Math.min(selectionStart, wordIndex);
      const end = Math.max(selectionStart, wordIndex);
      const selectedWords = words.slice(start, end + 1);
      
      if (selectedWords.length > 0) {
        const segment = {
          text: selectedWords.map(w => w.word).join(' '),
          startMs: transcript[selectedWords[0].transcriptIndex].startMs,
          endMs: transcript[selectedWords[selectedWords.length - 1].transcriptIndex].endMs
        };
        setPendingTranscriptSegment(segment);
      }
    }
  };

  const handleMouseUp = () => {
    // For single-word click or drag selection
    if (isDragging && !activeHighlight && selectionStart !== null && selectionEnd !== null) {
        const start = Math.min(selectionStart, selectionEnd);
        const end = Math.max(selectionStart, selectionEnd);
        const selectedWords = words.slice(start, end + 1);
        
        if (selectedWords.length > 0) {
            const segment = {
                text: selectedWords.map(w => w.word).join(' '),
                startMs: transcript[selectedWords[0].transcriptIndex].startMs,
                endMs: transcript[selectedWords[selectedWords.length - 1].transcriptIndex].endMs
            };
            
            console.log('🎯 Segment:', {
                text: segment.text,
                action: 'created'
            });

            setSelectedTranscriptSegment(segment);
            setPendingTranscriptSegment(segment);
            setHasExistingOverlay(false);
        }
    }

    // Only clear the selection states, but keep the segment
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
  }, [isDragging, activeHighlight, dragType, selectionStart, selectionEnd, words]);

  // Add debug effect to track selection state changes
  useEffect(() => {
    console.log('🔄 Selection State Updated:', {
      selectionStart,
      selectionEnd,
      isDragging,
      activeHighlight
    });
  }, [selectionStart, selectionEnd, isDragging, activeHighlight]);

  // Fix the handleHighlightClick function to use transcriptIndex and avoid redeclarations
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
    const wordsInRange = words.slice(highlight.start, highlight.end + 1);
    const firstWord = wordsInRange[0];
    const lastWord = wordsInRange[wordsInRange.length - 1];
    
    const segment = {
      text: wordsInRange.map(w => w.word).join(' '),
      startMs: transcript[firstWord.transcriptIndex].startMs,
      endMs: transcript[lastWord.transcriptIndex].endMs
    };
    
    console.log('🔍 Created Segment:', segment);
    
    setSelectedTranscriptSegment(segment);
    setPendingTranscriptSegment(segment);
    setHasExistingOverlay(true);
  };

  // Update the renderWords function for continuous highlighting
  const renderWords = () => {
    let paragraphs: JSX.Element[][] = [[]];
    let currentParagraph = 0;

    words.forEach((wordObj, index) => {
      const highlight = highlights.find(h => index >= h.start && index <= h.end);
      
      const isInSelection =
        selectionStart !== null &&
        selectionEnd !== null &&
        index >= Math.min(selectionStart, selectionEnd) &&
        index <= Math.max(selectionStart, selectionEnd);

      const isSelected = 
        (pendingTranscriptSegment &&
         wordObj.startMs >= pendingTranscriptSegment.startMs && 
         wordObj.endMs <= pendingTranscriptSegment.endMs) ||
        isInSelection;

      const isHovered = highlight && hoveredHighlight === highlight.id;
      const isHighlightStart = highlight && index === highlight.start;
      const isHighlightEnd = highlight && index === highlight.end;
      const isHighlightMiddle = highlight && !isHighlightStart && !isHighlightEnd;

      // Check if a new paragraph should start
      const startsWithCapital = /^[A-Z]/.test(wordObj.word);
      const isFirstWord = index === 0;
      const prevWordEndsPunctuation = index > 0 && /[.!?]$/.test(words[index - 1].word);
      
      if (startsWithCapital && (isFirstWord || prevWordEndsPunctuation)) {
        currentParagraph++;
        paragraphs[currentParagraph] = [];
      }

      const wrapperClasses = [
        'relative',
        'inline-flex',
        'items-center',
        'mx-1.5',
        'px-[3px]',
        'group',
        highlight || isSelected ? 'bg-amber-200/75' : '',
        isHovered ? 'bg-amber-200/90' : '',
        isHighlightStart ? 'rounded-l-sm' : '',
        isHighlightEnd ? 'rounded-r-sm' : '',
        isHighlightMiddle ? '-mx-[1px]' : '',
        'transition-colors duration-150',
        'cursor-pointer',
        'text-xl',
        'select-none',
        'leading-loose',
        'my-1',
        (highlight || isSelected) && !isHighlightStart ? '-ml-[1px]' : '',
        (highlight || isSelected) && !isHighlightEnd ? '-mr-[1px]' : '',
      ].filter(Boolean).join(' ');

      const wordElement = (
        <span
          key={index}
          data-word-index={index}
          className={wrapperClasses}
          onMouseDown={(e) => {
            if (highlight) {
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
          <span className="relative">
            {wordObj.word}
          </span>
          {highlight && isHighlightEnd && (
            <span
              className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-6 cursor-ew-resize bg-amber-400 hover:bg-amber-500 transition-colors rounded-full shadow-sm hover:shadow-md -mr-1"
              onMouseDown={(e) => {
                e.stopPropagation();
                handleMouseDown(e, highlight.id, 'end');
              }}
            />
          )}
        </span>
      );

      paragraphs[currentParagraph].push(wordElement);
    });

    return paragraphs.map((paragraph, index) => (
      <p key={index} className="mb-8 leading-[3] flex flex-wrap">
        {paragraph}
      </p>
    ));
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      return;
    }

    const text = selection.toString().trim();
    if (text) {
      // Get the range and find the start and end word indices
      const range = selection.getRangeAt(0);
      const startContainer = range.startContainer;
      const endContainer = range.endContainer;
      
      // Find the word elements that contain the selection
      const startWordElement = startContainer.parentElement?.closest('[data-word-index]');
      const endWordElement = endContainer.parentElement?.closest('[data-word-index]');
      
      if (startWordElement && endWordElement) {
        const startIndex = parseInt(startWordElement.getAttribute('data-word-index') || '0');
        const endIndex = parseInt(endWordElement.getAttribute('data-word-index') || '0');
        
        // Create a segment from the selected words
        const selectedWords = words.slice(startIndex, endIndex + 1);
        const segment = {
          text: selectedWords.map(w => w.word).join(' '),
          startMs: transcript[selectedWords[0].transcriptIndex].startMs,
          endMs: transcript[selectedWords[selectedWords.length - 1].transcriptIndex].endMs
        };

        setSelectedTranscriptSegment(segment);
        setPendingTranscriptSegment(segment);
        setHasExistingOverlay(false);
        
        // Clear the selection
        window.getSelection()?.removeAllRanges();
      }
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
    console.log('🎯 Add B-Roll:', {
        selectedWord: selectedTranscriptSegment?.text,
        action: 'opening-search'
    });
    
    if (selectedTranscriptSegment) {
        setPendingTranscriptSegment(selectedTranscriptSegment);
        setSearchTerm(selectedTranscriptSegment.text || selectedText);
        setIsSearchOpen(true);
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
    console.log('🎯 ClickAway - Entry:', {
        isSearchOpen,
        hasSelectedSegment: !!selectedTranscriptSegment,
        hasPendingSegment: !!pendingTranscriptSegment
    });
    
    setSelectedText('');
    setHasExistingOverlay(false);
    
    if (!isSearchOpen) {
        console.log('🎯 ClickAway - Clearing segments because search is closed');
        setSelectedTranscriptSegment(null);
        setPendingTranscriptSegment(null);
    } else {
        console.log('🎯 ClickAway - Preserving segments because search is open');
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
        // Mock overlays based on the logs
        const mockOverlays = [
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
        ];
        const demoVideoUrl = 'https://hx7mp5wayo6ybdwl.public.blob.vercel-storage.com/IMG_6062-ustELCsT8kuxTiuEmUhR0NTEefvx6P.MP4';
      const demoTranscriptUrl = 'https://hx7mp5wayo6ybdwl.public.blob.vercel-storage.com/transcript-YxnHCXJcmH4JJqN5LH4M7r79CprrIa.json';


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

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    console.log('🔍 Starting Search:', {
      searchTerm,
      pendingSegment: pendingTranscriptSegment ? {
        text: pendingTranscriptSegment.text,
        startMs: pendingTranscriptSegment.startMs,
        endMs: pendingTranscriptSegment.endMs
      } : null
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

  // Function to check if a text segment has a matching stock video and get the overlay info
  const getMatchingStockVideo = (startMs: number, endMs: number) => {
    if (!videoVariants.length) return null;
    const currentVariant = videoVariants[0]; // Using first variant (Pexels)
    
    // Convert milliseconds to frames
    const startFrame = Math.round((startMs / 1000) * 30); // 30 fps
    const endFrame = Math.round((endMs / 1000) * 30);
    
    console.log('🔍 getMatchingStockVideo:', {
      input: { startMs, endMs },
      frames: { startFrame, endFrame }
    });

    const matchingOverlay = currentVariant.overlays.find(overlay => {
      if (overlay.type !== 'STOCK_VIDEO') return false;
      const overlayEndFrame = overlay.startFrame + overlay.duration;
      const overlayStartMs = (overlay.startFrame / 30) * 1000;
      const overlayEndMs = (overlayEndFrame / 30) * 1000;

      const isMatching = ((startMs >= overlayStartMs && startMs <= overlayEndMs) ||
                         (endMs >= overlayStartMs && endMs <= overlayEndMs));

      console.log('  Checking overlay:', {
        overlay: {
          startFrame: overlay.startFrame,
          endFrame: overlayEndFrame,
          startMs: overlayStartMs,
          endMs: overlayEndMs
        },
        isMatching
      });

      return isMatching;
    });

    console.log('  Found matching overlay:', matchingOverlay);
    return matchingOverlay;
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

  // Fix the handleSegmentClick function to use transcriptIndex
  const handleSegmentClick = (event: React.MouseEvent, wordIndex: number) => {
    console.log('🎯 handleSegmentClick - Initial:', {
      wordIndex,
      clickedWord: words[wordIndex],
      existingHighlights: highlights.map(h => ({
        id: h.id,
        range: { start: h.start, end: h.end },
        words: words.slice(h.start, h.end + 1).map(w => w.word).join(' ')
      }))
    });
    
    const clickedWord = words[wordIndex];
    
    // First check if this word is part of an existing highlight
    const existingHighlight = highlights.find(h => 
      wordIndex >= h.start && wordIndex <= h.end
    );

    if (existingHighlight) {
      console.log('  Clicked existing highlight:', {
        highlight: {
          id: existingHighlight.id,
          range: { start: existingHighlight.start, end: existingHighlight.end },
          words: words.slice(existingHighlight.start, existingHighlight.end + 1).map(w => w.word).join(' ')
        }
      });
      
      // If clicking an existing highlight, use its exact range
      const highlightWords = words.slice(existingHighlight.start, existingHighlight.end + 1);
      const firstHighlightWord = highlightWords[0];
      const lastHighlightWord = highlightWords[highlightWords.length - 1];
      
      const segment = {
        text: highlightWords.map(w => w.word).join(' '),
        startMs: transcript[firstHighlightWord.transcriptIndex].startMs,
        endMs: transcript[lastHighlightWord.transcriptIndex].endMs
      };

      setSelectedTranscriptSegment(segment);
      setPendingTranscriptSegment(segment);
      setHasExistingOverlay(true);
      return;
    }
    
    // If not clicking a highlight, find the exact segment for the clicked word
    const transcriptSegment = transcript[clickedWord.transcriptIndex];
    
    if (transcriptSegment) {
      console.log('  Found matching word segment:', {
        transcriptSegment,
        clickedWord
      });
      
      // Create a segment that only includes this word's timing
      const segment = {
        text: clickedWord.word,
        startMs: transcriptSegment.startMs,
        endMs: transcriptSegment.endMs
      };
      
      setSelectedTranscriptSegment(segment);
      setPendingTranscriptSegment(segment);
      setHasExistingOverlay(false);
    }
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
      if (selectedTranscriptSegment) {
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
  }, [selectedTranscriptSegment]);

  // Update the useEffect debug logging to be more verbose
  useEffect(() => {
  }, [selectedText, selectedTranscriptSegment, hasExistingOverlay, highlights]);

  // Update the Continue button click handler in the search dialog
  const handleContinueClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('🎬 Continue Click - Initial State:', {
      selectedVideo,
      pendingSegment: {
        text: pendingTranscriptSegment?.text,
        startMs: pendingTranscriptSegment?.startMs,
        endMs: pendingTranscriptSegment?.endMs
      },
      currentVariant: videoVariants[0] ? {
        overlayCount: videoVariants[0].overlays.length,
        src: videoVariants[0].src
      } : null
    });

    if (!selectedVideo || !pendingTranscriptSegment || !videoVariants.length) {
      console.error('❌ Missing required data:', {
        hasSelectedVideo: !!selectedVideo,
        hasPendingSegment: !!pendingTranscriptSegment,
        hasVideoVariants: videoVariants.length > 0
      });
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

    console.log('🎯 Calculated Frames:', {
      startFrame,
      duration,
      timing: {
        startMs: pendingTranscriptSegment.startMs,
        endMs: pendingTranscriptSegment.endMs,
        durationMs: pendingTranscriptSegment.endMs - pendingTranscriptSegment.startMs
      }
    });

    // Remove any existing overlays that overlap with this time range
    const nonOverlappingOverlays = variant.overlays.filter(overlay => {
      if (overlay.type !== TemplateType.STOCK_VIDEO) return true;
      const overlayStartMs = (overlay.startFrame / 30) * 1000;
      const overlayEndMs = ((overlay.startFrame + overlay.duration) / 30) * 1000;
      const doesNotOverlap = overlayEndMs <= pendingTranscriptSegment.startMs || 
             overlayStartMs >= pendingTranscriptSegment.endMs;
      
      console.log('🔍 Checking Overlay Overlap:', {
        overlay: {
          startFrame: overlay.startFrame,
          duration: overlay.duration,
          startMs: overlayStartMs,
          endMs: overlayEndMs
        },
        doesNotOverlap
      });
      
      return doesNotOverlap;
    });

    // Add the new overlay
    const newOverlay: OverlayConfig = {
      startFrame,
      duration: Math.max(duration, 30), // Ensure minimum duration of 1 second
      type: TemplateType.STOCK_VIDEO,
      videoSrc: selectedVideo.videoSrc,
      provider: 'Pexels'
    };

    console.log('✨ New Overlay Created:', {
      newOverlay,
      existingOverlaysKept: nonOverlappingOverlays.length,
      totalOverlaysAfter: nonOverlappingOverlays.length + 1
    });

    const updatedVariant = {
      ...variant,
      overlays: [...nonOverlappingOverlays, newOverlay]
    };

    console.log('📼 Final Variant Update:', {
      overlaysCount: {
        before: variant.overlays.length,
        after: updatedVariant.overlays.length
      },
      newOverlayDetails: {
        startFrame: newOverlay.startFrame,
        duration: newOverlay.duration,
        videoSrc: newOverlay.videoSrc
      }
    });

    setVideoVariants([updatedVariant]);

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
            {/* Transcript Section */}
            <div className="w-[40%] h-full border-r flex flex-col">
              {/* Add instructional text */}
              {showInstructions && (
                <div className="p-4 bg-blue-50 text-blue-800 text-sm relative">
                  <p>We&apos;ve auto-populated B-rolls into your setup. If you like them, feel free to download. You can drag the right handle to extend how long you want the B-roll to run, or delete and add your own.</p>
                  <button 
                    onClick={() => setShowInstructions(false)}
                    className="absolute top-2 right-2 text-blue-600 hover:text-blue-800"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              )}

              {/* B-Roll Action Toolbar */}
              <div className="flex items-center gap-2 p-3 border-b">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    if (pendingTranscriptSegment) {
                      setSearchTerm(pendingTranscriptSegment.text);
                      setSelectedText('');
                      setIsSearchOpen(true);
                    }
                  }}
                  disabled={!pendingTranscriptSegment}
                  className="h-8 px-3 text-sm font-medium flex items-center gap-2"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="stroke-current">
                    <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  {hasExistingOverlay ? 'Change B-Roll' : 'Add B-Roll'}
                </Button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (videoVariants.length && pendingTranscriptSegment) {
                      const variant = videoVariants[0];
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
                        description: "B-Roll deleted successfully",
                      });
                      setPendingTranscriptSegment(null);
                      setSelectedTranscriptSegment(null);
                      setHasExistingOverlay(false);
                    }
                  }}
                  disabled={!pendingTranscriptSegment || !hasExistingOverlay}
                  className="h-8 px-3 text-sm font-medium flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete B-Roll
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setPendingTranscriptSegment(null);
                    setSelectedTranscriptSegment(null);
                    setSelectedText('');
                    setHasExistingOverlay(false);
                  }}
                  disabled={!pendingTranscriptSegment}
                  className="h-8 px-3 text-sm font-medium flex items-center gap-2 ml-auto"
                >
                  <RotateCcw className="w-4 h-4" />
                  Clear Selection
                </Button>
              </div>

              <div className="p-4 flex-1 overflow-y-auto">
                <div
                  ref={containerRef}
                  id="transcript-container"
                  className="text-sm select-none text-gray-800 space-y-12"
                >
                  {renderWords()}
                </div>
              </div>
            </div>

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
                      <OffthreadVideo 
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