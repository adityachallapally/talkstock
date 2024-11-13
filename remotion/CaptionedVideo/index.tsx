import {useCallback, useEffect, useState} from 'react';
import {
	AbsoluteFill,
	CalculateMetadataFunction,
	cancelRender,
	continueRender,
	delayRender,
	getStaticFiles,
	OffthreadVideo,
	Sequence,
	useVideoConfig,
	watchStaticFile,
  staticFile,
  useCurrentFrame
} from 'remotion';
import {z} from 'zod';
import Subtitle from './Subtitle';
import {getVideoMetadata} from '@remotion/media-utils';
import {loadFont, loadMontserrat} from '../load-font';
import {NoCaptionFile} from './NoCaptionFile';


export type SubtitleProp = {
	startInSeconds: number;
	text: string;
};

export const captionedVideoSchema = z.object({
	src: z.string(),
});

export const calculateCaptionedVideoMetadata: CalculateMetadataFunction<
	z.infer<typeof captionedVideoSchema>
> = async ({props}) => {
	const fps = 30;
	const metadata = await getVideoMetadata(props.src);

	return {
		fps,
		durationInFrames: Math.floor(metadata.durationInSeconds * fps),
	};
};

const getFileExists = (file: string) => {
	const files = getStaticFiles();
	const fileExists = files.find((f) => {
		return f.src === file;
	});
	return Boolean(fileExists);
};

// Add this new component above the CaptionedVideo component
const TypewriterText: React.FC<{
	text: string;
	delay?: number;
}> = ({text, delay = 0}) => {
	const {fps} = useVideoConfig();
	const frame = useCurrentFrame();
	
	const adjustedFrame = Math.max(frame - delay, 0);
	const charactersToShow = Math.min(
		Math.floor(adjustedFrame * 0.5),
		text.length
	);
	
	const displayText = text.slice(0, charactersToShow);
	const isTypingComplete = charactersToShow >= text.length;
	const hasStarted = frame > delay;
	const showCursor = hasStarted && !isTypingComplete;
	
	const shouldPlaySound = hasStarted && !isTypingComplete;
	
	return (
		<>
			{displayText}
			{showCursor && <span style={{ opacity: 0.8 }}>|</span>}
			{shouldPlaySound && (
				<audio 
					src={staticFile('long-keyboard-typing.mp3')} 
					autoPlay 
					ref={(audio) => {
						if (audio) {
							audio.volume = 0.05;
						}
					}}
				>
					<track kind="captions" />
				</audio>
			)}
		</>
	);
};

const BoxReveal: React.FC<{children: React.ReactNode}> = ({children}) => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();
    
    // Animation takes 1 second (30 frames at 30fps)
    const progress = Math.min(frame / fps, 1);
    
    // Use easeOut for smoother animation
    const easeOutProgress = 1 - Math.pow(1 - progress, 2);
    
    return (
        <div style={{
            border: '2px solid rgba(255, 255, 255, 0.6)',
            padding: `40px ${50 * easeOutProgress}px`,
            width: `${80 * easeOutProgress}%`,
            backgroundColor: 'rgba(0, 0, 0, 0.2)',
            backdropFilter: 'blur(8px)',
            boxShadow: '0 0 20px rgba(0,0,0,0.3)',
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1,
        }}>
            {children}
        </div>
    );
};

// New type definitions for overlay content
type OverlayItem = {
  text: string;
  delay: number;
};

type OverlaySection = {
  startFrame: number;
  duration: number;
  title: string;
  items: OverlayItem[];
  videoSrc: string;
};

// New reusable component for overlay sections
const OverlaySection: React.FC<OverlaySection> = ({
  title,
  items,
  videoSrc,
}) => {
  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={videoSrc}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'blur(4px) brightness(0.8)',
        }}
      />
      
      <AbsoluteFill
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.25)',
          position: 'absolute',
        }}
      />

      <AbsoluteFill
        style={{
          background: `repeating-linear-gradient(
            180deg,
            transparent,
            transparent 3px,
            rgba(255, 255, 255, 0.01) 4px,
            rgba(255, 255, 255, 0.03) 4.5px,
            rgba(255, 255, 255, 0.1) 5px,
            rgba(255, 255, 255, 0.1) 29px,
            rgba(255, 255, 255, 0.03) 29.5px,
            rgba(255, 255, 255, 0.01) 30px,
            transparent 30px
          )`,
          position: 'absolute',
        }}
      />

      <AbsoluteFill
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px',
        }}
      >
        <BoxReveal>
          <TitleAnimation title={title} />
          <div style={{
            color: 'white',
            fontSize: '67px',
            fontFamily: 'Montserrat',
            fontWeight: 500,
            lineHeight: '1.4',
            textAlign: 'left',
            textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
          }}>
            {items.map((item, index) => (
              <div key={index} style={{ marginBottom: index === items.length - 1 ? 0 : '24px' }}>
                <TypewriterText text={item.text} delay={item.delay} />
              </div>
            ))}
          </div>
        </BoxReveal>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Update TitleAnimation to accept title prop
const TitleAnimation: React.FC<{title: string}> = ({title}) => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();
    
    // Animation duration: 0.2 seconds (6 frames at 30fps)
    const duration = 2 * fps;
    const progress = Math.min(frame / duration, 1);
    
    // Easing function for smoother animation
    const easeOutQuint = 1 - Math.pow(1 - progress, 5);
    
    // Start from -100px above and animate to 0
    const translateY = -100 + (100 * easeOutQuint);
    
    return (
        <div style={{
            backgroundColor: '#00A67E',
            padding: '16px 40px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            position: 'absolute',
            top: '-120px',
            left: '50%',
            transform: `translate(-50%, ${translateY}px)`,
            zIndex: 2,
            opacity: easeOutQuint,
        }}>
            <h1 style={{
                color: 'white',
                fontSize: '77px',
                fontFamily: 'Montserrat',
                fontWeight: 600,
                margin: 0,
                letterSpacing: '2px',
            }}>
                {title}
            </h1>
        </div>
    );
};

export type OverlayConfig = {
	startFrame: number;
	duration: number;
	title: string;
	videoSrc: string;
	items: {
		text: string;
		delay: number;
	}[];
};

export const CaptionedVideo: React.FC<{
	src: string;
	overlays?: OverlayConfig[];
}> = ({src, overlays = []}) => {
	const [subtitles, setSubtitles] = useState<SubtitleProp[]>([]);
	const [handle] = useState(() => delayRender());
	const {fps} = useVideoConfig();

	const subtitlesFile = 'https://hx7mp5wayo6ybdwl.public.blob.vercel-storage.com/stanford_video-lGCdCm0OcnuLhBPHM9f50eS4zyqiV0.json';

	const fetchSubtitles = useCallback(async () => {
		try {
			await Promise.all([loadFont(), loadMontserrat()]);
			const res = await fetch(subtitlesFile);
			const data = await res.json();
			setSubtitles(data.transcription);
			continueRender(handle);
		} catch (e) {
			cancelRender(e);
		}
	}, [handle, subtitlesFile]);

	useEffect(() => {
		fetchSubtitles();

		const c = watchStaticFile(subtitlesFile, () => {
			fetchSubtitles();
		});

		return () => {
			c.cancel();
		};
	}, [fetchSubtitles, src, subtitlesFile]);

	return (
		<AbsoluteFill style={{backgroundColor: 'white'}}>
			<AbsoluteFill>
				<OffthreadVideo
					style={{
						objectFit: 'cover',
					}}
					src={src}
				/>
			</AbsoluteFill>

			{overlays.map((overlay, index) => (
				<Sequence
					key={`overlay-${index}`}
					from={overlay.startFrame}
					durationInFrames={overlay.duration}
				>
					<OverlaySection {...overlay} />
				</Sequence>
			))}

			{subtitles.map((subtitle, index) => {
				const nextSubtitle = subtitles[index + 1] ?? null;
				const subtitleStartFrame = subtitle.startInSeconds * fps;
				const subtitleEndFrame = Math.min(
					nextSubtitle ? nextSubtitle.startInSeconds * fps : Infinity,
					subtitleStartFrame + fps,
				);
				const durationInFrames = subtitleEndFrame - subtitleStartFrame;
				if (durationInFrames <= 0) {
					return null;
				}

				return (
					<Sequence
						key={`subtitle-${index}`}
						from={subtitleStartFrame}
						durationInFrames={durationInFrames}
					>
						<Subtitle key={index} text={subtitle.text} />
					</Sequence>
				);
			})}
		</AbsoluteFill>
	);
};