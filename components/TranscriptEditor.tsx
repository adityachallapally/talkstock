'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Trash2, RotateCcw } from 'lucide-react';
import { TranscriptLine, VideoVariant, useHighlights } from './StockVideoUploader';
import { OverlayConfig, TemplateType } from '@/types/constants';

interface TranscriptEditorProps {
  transcript: TranscriptLine[];
  videoVariants: VideoVariant[];
  setVideoVariants: (v: VideoVariant[]) => void;
  handleSearch: () => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedVideo: { videoSrc: string } | null;
  setSelectedVideo: (video: { videoSrc: string } | null) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  showInstructions: boolean;
  setShowInstructions: (show: boolean) => void;
  setPendingTranscriptSegment: (segment: TranscriptLine | null) => void;
}

export const TranscriptEditor: React.FC<TranscriptEditorProps> = ({
  transcript,
  videoVariants,
  setVideoVariants,
  handleSearch,
  searchTerm,
  setSearchTerm,
  selectedVideo,
  setSelectedVideo,
  isSearchOpen,
  setIsSearchOpen,
  showInstructions,
  setShowInstructions,
  setPendingTranscriptSegment
}) => {
  const [selectedText, setSelectedText] = useState('');
  const [selectedTranscriptSegment, setSelectedTranscriptSegment] = useState<TranscriptLine | null>(null);
  const [localPendingTranscriptSegment, setLocalPendingTranscriptSegment] = useState<TranscriptLine | null>(null);
  const [hasExistingOverlay, setHasExistingOverlay] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Update both local and parent state for pendingTranscriptSegment
  const updatePendingSegment = (segment: TranscriptLine | null) => {
    setLocalPendingTranscriptSegment(segment);
    setPendingTranscriptSegment(segment);
  };
  const { toast } = useToast();

  // Use the highlights hook
  const {
    highlights,
    isDragging,
    setIsDragging,
    activeHighlight,
    setActiveHighlight,
    dragType,
    setDragType,
    updateHighlightDuration,
    words,
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
        updatePendingSegment(segment);
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
            updatePendingSegment(segment);
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
    updatePendingSegment(segment);
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
        (localPendingTranscriptSegment &&
         wordObj.startMs >= localPendingTranscriptSegment.startMs && 
         wordObj.endMs <= localPendingTranscriptSegment.endMs) ||
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
        hasPendingSegment: !!localPendingTranscriptSegment
    });
    
    setSelectedText('');
    setHasExistingOverlay(false);
    
    if (!isSearchOpen) {
        console.log('🎯 ClickAway - Clearing segments because search is closed');
        setSelectedTranscriptSegment(null);
        updatePendingSegment(null);
    } else {
        console.log('🎯 ClickAway - Preserving segments because search is open');
    }
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

  return (
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
            if (localPendingTranscriptSegment) {
              setSearchTerm(localPendingTranscriptSegment.text);
              setSelectedText('');
              setIsSearchOpen(true);
            }
          }}
          disabled={!localPendingTranscriptSegment}
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
            if (videoVariants.length && localPendingTranscriptSegment) {
              const variant = videoVariants[0];
              const deleteStartFrame = Math.round((localPendingTranscriptSegment.startMs / 1000) * 30);
              const deleteEndFrame = Math.round((localPendingTranscriptSegment.endMs / 1000) * 30);
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
              updatePendingSegment(null);
              setSelectedTranscriptSegment(null);
              setHasExistingOverlay(false);
            }
          }}
          disabled={!localPendingTranscriptSegment || !hasExistingOverlay}
          className="h-8 px-3 text-sm font-medium flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete B-Roll
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            updatePendingSegment(null);
            setSelectedTranscriptSegment(null);
            setSelectedText('');
            setHasExistingOverlay(false);
          }}
          disabled={!localPendingTranscriptSegment}
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
  );
};