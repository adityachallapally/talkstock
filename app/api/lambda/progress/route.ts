import {
  speculateFunctionName,
  AwsRegion,
  getRenderProgress,
} from "@remotion/lambda/client";
import { DISK, RAM, REGION, TIMEOUT } from "../../../../config.mjs";
import { executeApi } from "../../../../helpers/api-response";
import { ProgressRequest, ProgressResponse } from "../../../../types/schema";

export const POST = executeApi<ProgressResponse, typeof ProgressRequest>(
  ProgressRequest,
  async (req, body) => {
    console.log("Received progress request:", JSON.stringify(body, null, 2));

    try {
      console.log("Fetching render progress");
      const renderProgress = await getRenderProgress({
        bucketName: body.bucketName,
        functionName: speculateFunctionName({
          diskSizeInMb: DISK,
          memorySizeInMb: RAM,
          timeoutInSeconds: TIMEOUT,
        }),
        region: REGION as AwsRegion,
        renderId: body.id,
      });
      console.log("Raw render progress:", JSON.stringify(renderProgress, null, 2));

      if (renderProgress.fatalErrorEncountered) {
        console.error("Fatal error encountered:", renderProgress.errors[0].message);
        return {
          type: "error",
          message: renderProgress.errors[0].message,
        };
      }

      if (renderProgress.done) {
        console.log("Render completed successfully");
        console.log("Output file:", renderProgress.outputFile);
        console.log("Output size:", renderProgress.outputSizeInBytes, "bytes");
        return {
          type: "done",
          url: renderProgress.outputFile as string,
          size: renderProgress.outputSizeInBytes as number,
        };
      }

      const progress = Math.max(0.03, renderProgress.overallProgress);
      console.log(`Render in progress: ${(progress * 100).toFixed(2)}%`);
      return {
        type: "progress",
        progress: progress,
      };
    } catch (error) {
      console.error("Error fetching render progress:", error);
      throw error;
    }
  },
);
