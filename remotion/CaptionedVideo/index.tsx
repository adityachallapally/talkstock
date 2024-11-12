import React, { useCallback, useEffect, useState } from "react";
import {
  AbsoluteFill,
  CalculateMetadataFunction,
  cancelRender,
  continueRender,
  delayRender,
  getStaticFiles,
  Sequence,
  useVideoConfig,
  watchStaticFile,
  Audio,
  Img,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { linearTiming } from "@remotion/transitions";
import { z } from "zod";
import Subtitle from "./Subtitle";
import { getAudioDurationInSeconds } from "@remotion/media-utils";
import { loadFont } from "../load-font";
import { NoCaptionFile } from "./NoCaptionFile";
import { none } from "@remotion/transitions/none";

export type SubtitleProp = {
  startMs: number;
  endMs: number;
  text: string;
};

export const captionedVideoSchema = z.object({
  audioSrc: z.string(),
  imageUrls: z.array(z.string()),
  durationInFrames: z.number(),
});

export const calculateCaptionedVideoMetadata: CalculateMetadataFunction<
  z.infer<typeof captionedVideoSchema>
> = async ({ props }) => {
  const fps = 30;
  const metadata = await getAudioDurationInSeconds(props.audioSrc);
  return {
    fps,
    durationInFrames: Math.floor(metadata * fps),
  };
};


const effects = [
  'static',
  'zoomInSlow',
  'zoomOutSlow',
  'zoomInPanRight',
  'zoomInPanLeft',
  'zoomInPanUp',
  'zoomInPanDown',
];

const getRandomEffect = (seed: number) => {
  return effects[Math.floor((seed * 13) % effects.length)];
};

const getImageTransform = (effect: string, progress: number) => {
  const startScale = 1.0;
  const maxZoomScale = 1.3;

  const easeInOut = (t: number) => t < .5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

  switch (effect) {
    case 'static':
      return `scale(${startScale})`;
    case 'zoomInSlow':
      const zoomProgress = easeInOut(progress);
      return `scale(${startScale + (maxZoomScale - startScale) * zoomProgress})`;
    case 'zoomOutSlow':
      return `scale(${maxZoomScale - (maxZoomScale - startScale) * easeInOut(progress)})`;
    case 'zoomInPanRight':
      const scaleRight = startScale + (maxZoomScale - startScale) * easeInOut(progress);
      const translateRight = 5 * easeInOut(progress);
      return `scale(${scaleRight}) translateX(${translateRight}%)`;
    case 'zoomInPanLeft':
      const scaleLeft = startScale + (maxZoomScale - startScale) * easeInOut(progress);
      const translateLeft = -5 * easeInOut(progress);
      return `scale(${scaleLeft}) translateX(${translateLeft}%)`;
    case 'zoomInPanUp':
      const scaleUp = startScale + (maxZoomScale - startScale) * easeInOut(progress);
      const translateUp = -5 * easeInOut(progress);
      return `scale(${scaleUp}) translateY(${translateUp}%)`;
    case 'zoomInPanDown':
      const scaleDown = startScale + (maxZoomScale - startScale) * easeInOut(progress);
      const translateDown = 5 * easeInOut(progress);
      return `scale(${scaleDown}) translateY(${translateDown}%)`;
    default:
      return `scale(${startScale})`;
  }
};

const ImageWithEffect: React.FC<{
  imageUrl: string;
  effect: string;
  durationInFrames: number;
}> = ({ imageUrl, effect, durationInFrames }) => {
  const frame = useCurrentFrame();
  const progress = frame / durationInFrames;
  const transform = getImageTransform(effect, progress);

  return (
    <Img
      src={imageUrl}
      style={{
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform,
        transformOrigin: 'center center',
      }}
    />
  );
};

const getFileExists = (file: string) => {
  console.log("Checking if file exists:", file);
  const files = getStaticFiles();
  console.log("All static files:", files);
  const fileExists = files.find((f) => {
    console.log("Comparing:", f.src, "with", file);
    return f.src === file;
  });
  console.log("File exists?", Boolean(fileExists));
  return Boolean(fileExists);
};

export const CaptionedVideo: React.FC<{
  audioSrc: string;
  images: string[];
  subtitlesSrc: string;
  durationInFrames: number;
}> = ({ audioSrc, images, subtitlesSrc, durationInFrames }) => {
  const [subtitles, setSubtitles] = useState<SubtitleProp[]>([]);
  const [handle] = useState(() => delayRender());
  const [audioDuration, setAudioDuration] = useState(0);
  const { fps} = useVideoConfig();

  console.log("Subtitle URL:", subtitlesSrc);

  const fetchSubtitles = useCallback(async () => {
    console.log("Fetching subtitles...");
    try {
      await loadFont();
      console.log("Font loaded successfully");

      console.log("Attempting to fetch:", subtitlesSrc);
      const res = await fetch(subtitlesSrc);
      console.log("Fetch response:", res);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      console.log("Parsed subtitle data:", data);

      setSubtitles(data);
      console.log("Subtitles set in state");

      const duration = await getAudioDurationInSeconds(audioSrc);
      console.log("Audio duration:", duration);
      setAudioDuration(duration);

    } catch (e) {
      console.error("Error fetching subtitles:", e);
      setSubtitles([]); // Set empty subtitles array in case of error
    } finally {
      continueRender(handle); // Always continue render, even if there's an error
      console.log("Render continued");
    }
  }, [handle, subtitlesSrc, audioSrc, fps]);

  useEffect(() => {
    fetchSubtitles();
  }, [fetchSubtitles]);

  console.log("Current subtitles state:", subtitles);

  const ImageSequences: React.FC<{ images: string[] }> = ({ images }) => {
    if (!audioDuration) return null;

    const imageDuration = audioDuration / images.length;

    return (
      <>
        {images.map((imageUrl, index) => {
          const startTime = index * imageDuration;
          const startFrame = Math.floor(startTime * fps);
          const durationInFrames = Math.floor(imageDuration * fps);
          const videoEffect = getRandomEffect(index);

          return (
            <Sequence key={index} from={startFrame} durationInFrames={durationInFrames}>
              <ImageWithEffect
                imageUrl={imageUrl}
                effect={videoEffect}
                durationInFrames={durationInFrames}
              />
            </Sequence>
          );
        })}
      </>
    );
  };

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      <Audio src={audioSrc} />
      <Audio
        src={staticFile("Mesmerizing Galaxy Loop.mp3")}
        volume={0.03}
      />
      <ImageSequences images={images} />
      {subtitles.map((subtitle, index) => {
        const startFrame = Math.floor(subtitle.startMs / 1000 * fps);
        const endFrame = Math.floor(subtitle.endMs / 1000 * fps);
        const duration = endFrame - startFrame;

        return (
          <Sequence key={index} from={startFrame} durationInFrames={duration}>
            <Subtitle text={subtitle.text} />
          </Sequence>
        );
      })}

      {subtitles.length === 0 && (
        <>
          <NoCaptionFile />
          <div style={{ color: 'white', position: 'absolute', top: '10px', left: '10px' }}>
            Debug: No subtitles loaded. URL: {subtitlesSrc}
          </div>
        </>
      )}

      {/* Add the watermark */}
      <Img
        src={staticFile("Craftclipswatermark.png")}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          width: '400px',  // Adjust size as needed
          opacity: 0.8,    // Adjust opacity as needed
        }}
      />
    </AbsoluteFill>
  );
};

export default CaptionedVideo;
