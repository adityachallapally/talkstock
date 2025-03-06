import { AwsRegion, RenderMediaOnLambdaOutput } from "@remotion/lambda/client";
import {
  renderMediaOnLambda,
  speculateFunctionName,
} from "@remotion/lambda/client";
import { DISK, RAM, REGION, SITE_NAME, TIMEOUT } from "@/config.mjs";
import { executeApi } from "@/helpers/api-response";
import { RenderRequest } from "@/types/schema";

export const POST = executeApi<RenderMediaOnLambdaOutput, typeof RenderRequest>(
  RenderRequest,
  async (req, body) => {
    try {
      console.log("🚀 Starting render route handler");
      console.log("📝 Request body:", JSON.stringify(body, null, 2));
      
      console.log("🔍 Environment check:", {
        aws: {
          hasAwsKeyId: !!process.env.AWS_ACCESS_KEY_ID,
          awsKeyIdLength: process.env.AWS_ACCESS_KEY_ID?.length,
          hasAwsSecret: !!process.env.AWS_SECRET_ACCESS_KEY,
          awsSecretLength: process.env.AWS_SECRET_ACCESS_KEY?.length,
        },
        remotion: {
          hasRemotionKeyId: !!process.env.REMOTION_AWS_ACCESS_KEY_ID,
          remotionKeyIdLength: process.env.REMOTION_AWS_ACCESS_KEY_ID?.length,
          hasRemotionSecret: !!process.env.REMOTION_AWS_SECRET_ACCESS_KEY,
          remotionSecretLength: process.env.REMOTION_AWS_SECRET_ACCESS_KEY?.length,
        },
        config: {
          region: REGION,
          siteUrl: SITE_NAME,
          disk: DISK,
          ram: RAM,
          timeout: TIMEOUT
        }
      });

      if (
        !process.env.AWS_ACCESS_KEY_ID &&
        !process.env.REMOTION_AWS_ACCESS_KEY_ID
      ) {
        console.error("❌ AWS Access Key ID not set");
        throw new TypeError(
          "Set up Remotion Lambda to render videos. See the README.md for how to do so.",
        );
      }
      if (
        !process.env.AWS_SECRET_ACCESS_KEY &&
        !process.env.REMOTION_AWS_SECRET_ACCESS_KEY
      ) {
        console.error("❌ AWS Secret Access Key not set");
        throw new TypeError(
          "The environment variable REMOTION_AWS_SECRET_ACCESS_KEY is missing. Add it to your .env file.",
        );
      }

      const functionName = speculateFunctionName({
        diskSizeInMb: DISK,
        memorySizeInMb: RAM,
        timeoutInSeconds: TIMEOUT,
      });
      
      console.log("⚙️ Lambda configuration:", {
        codec: "h264",
        functionName,
        region: REGION,
        serveUrl: SITE_NAME,
        composition: body.id,
        framesPerLambda: 500,
        dimensions: {
          width: body.width || 1080,
          height: body.height || 1920,
        },
        duration: {
          fps: body.fps || 30,
          durationInFrames: body.durationInFrames,
        },
        inputProps: {
          ...body.inputProps,
          hasSource: !!body.inputProps?.src,
          hasOverlays: !!body.inputProps?.overlays?.length,
          hasTranscription: !!body.inputProps?.transcriptionUrl,
        }
      });

      try {
        console.log("🎬 Starting renderMediaOnLambda...");
        const result = await renderMediaOnLambda({
          codec: "h264",
          functionName,
          region: REGION as AwsRegion,
          serveUrl: SITE_NAME,
          composition: body.id,
          inputProps: body.inputProps,
          framesPerLambda: 500,
          timeoutInMilliseconds: TIMEOUT * 1000,
          imageFormat: "jpeg",
          scale: 1,
          muted: false,
          fps: body.fps || 30,
          durationInFrames: body.durationInFrames,
          width: body.width || 1080,
          height: body.height || 1920,
          downloadBehavior: {
            type: "download",
            fileName: "video.mp4",
          },
        });
        console.log("✅ Render completed successfully:", JSON.stringify(result, null, 2));
        return result;
      } catch (error) {
        console.error("❌ Error in renderMediaOnLambda:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
          cause: error.cause,
          ...(error.response && { response: error.response }),
          ...(error.config && { config: error.config }),
        });
        throw error;
      }
    } catch (error) {
      console.error("❌ Error in render route handler:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause,
        ...(error.response && { response: error.response }),
        ...(error.config && { config: error.config }),
      });
      throw error;
    }
  },
);
