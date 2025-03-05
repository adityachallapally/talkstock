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
import {parseMedia} from '@remotion/media-parser';
import {loadFont, loadMontserrat} from '../load-font';
import {NoCaptionFile} from './NoCaptionFile';
import { TitleBullets } from './TitleBullets';
import { TemplateType, OverlayItem, OverlayConfig } from '../types';
import { TitleSwap } from './TitleSwap';
import { NumberHighlight } from './NumberHighlight';
import { StockVideo } from './StockVideo';
import LottieOverlay from './LottieOverlay';
import { overlayStyles } from './styles';

export type SubtitleProp = {
	startMs: number;
	endMs: number;
	text: string;
};

export const captionedVideoSchema = z.object({
	src: z.string(),
	overlays: z.array(z.any()).optional(),
	transcriptionUrl: z.string().optional(),
	showCaptions: z.boolean().optional(),
});

export const calculateCaptionedVideoMetadata: CalculateMetadataFunction<
	z.infer<typeof captionedVideoSchema>
> = async ({props}) => {
	const fps = 30;
	
	// Use static dimensions for portrait mode videos
	const width = 1080;
	const height = 1920;
	
	try {
		const { slowDurationInSeconds } = await parseMedia({
			src: props.src,
			fields: {
				slowDurationInSeconds: true
			},
			acknowledgeRemotionLicense: true
		});
		
		return {
			fps,
			durationInFrames: Math.floor(slowDurationInSeconds * fps),
			width,
			height
		};
	} catch (error) {
		console.error('Error getting video metadata:', error);
		// Fallback to a reasonable duration if metadata retrieval fails
		const fallbackDurationInSeconds = 30;
		return {
			fps,
			durationInFrames: Math.floor(fallbackDurationInSeconds * fps),
			width,
			height
		};
	}
};

const getFileExists = (file: string) => {
	const files = getStaticFiles();
	const fileExists = files.find((f) => {
		return f.src === file;
	});
	return Boolean(fileExists);
};

export const TypewriterText: React.FC<{
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
			{showCursor && <span style={{ opacity: 0.1 }}>|</span>}
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
export const BoxReveal: React.FC<{children: React.ReactNode}> = ({children}) => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();
    
    const progress = Math.min(frame / fps, 1);
    const easeOutProgress = 1 - Math.pow(1 - progress, 2);
    
    return (
        <div style={{
            ...overlayStyles.container,
            padding: `40px ${50 * easeOutProgress}px`,
            width: `${80 * easeOutProgress}%`,
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


const OverlayRouter: React.FC<OverlayConfig> = (props) => {

  switch (props.type) {
    case TemplateType.STOCK_VIDEO:
      return <StockVideo {...props} />;
    case TemplateType.BULLET_LIST:
      return <TitleBullets {...props} />;
    case TemplateType.WORD_SWAP:
      return <TitleSwap {...props} />;
    case TemplateType.NUMBER_HIGHLIGHT:
      return <NumberHighlight {...props} />;
    default:
      return <TitleBullets {...props} />;
  }
};

// Update TitleAnimation to accept title prop
export const TitleAnimation: React.FC<{title: string}> = ({title}) => {
    const frame = useCurrentFrame();
    const {fps} = useVideoConfig();
    
    const duration = 2 * fps;
    const progress = Math.min(frame / duration, 1);
    const easeOutQuint = 1 - Math.pow(1 - progress, 5);
    const translateY = -100 + (100 * easeOutQuint);
    
    return (
        <div style={{
            ...overlayStyles.title,
            transform: `translateY(${translateY}px)`,
            opacity: easeOutQuint,
            position: 'relative',
            zIndex: 2,
        }}>
            <h1 style={{
                margin: 0,
                color: 'white',
                fontFamily: 'Montserrat',
                fontSize: overlayStyles.title.fontSize,
                fontWeight: 600,
                letterSpacing: '2px',
                textShadow: '3px 3px 6px rgba(0,0,0,0.4), 0px 0px 10px rgba(0,0,0,0.2)',
                whiteSpace: 'nowrap'
            }}>
                {title}
            </h1>
        </div>
    );
};

export const CaptionedVideo: React.FC<{
	src: string;
	overlays?: OverlayConfig[];
	transcriptionUrl?: string;
	showCaptions?: boolean;
}> = ({src, overlays = [], transcriptionUrl, showCaptions = true}) => {
	const [subtitles, setSubtitles] = useState<SubtitleProp[]>([]);
	const [handle] = useState(() => delayRender());
	const {fps} = useVideoConfig();

	const fetchSubtitles = useCallback(async () => {
		try {
			await Promise.all([loadFont(), loadMontserrat()]);
			if (!transcriptionUrl) {
				setSubtitles([]);
				continueRender(handle);
				return;
			}
			const res = await fetch(transcriptionUrl);
			const data = await res.json();
			setSubtitles(data.transcription);
			continueRender(handle);
		} catch (e) {
			cancelRender(e);
		}
	}, [handle, transcriptionUrl]);

	useEffect(() => {
		fetchSubtitles();

		if (transcriptionUrl) {
			const c = watchStaticFile(transcriptionUrl, () => {
				fetchSubtitles();
			});
			return () => {
				c.cancel();
			};
		}
	}, [fetchSubtitles, src, transcriptionUrl]);

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
					<OverlayRouter {...overlay} />
				</Sequence>
			))}

			{showCaptions && subtitles.map((subtitle, index) => {
				const nextSubtitle = subtitles[index + 1] ?? null;
				const subtitleStartFrame = Math.round((subtitle.startMs / 1000) * fps);
				const subtitleEndFrame = Math.round((subtitle.endMs / 1000) * fps);
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