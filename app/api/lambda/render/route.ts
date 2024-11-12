import { AwsRegion, RenderMediaOnLambdaOutput } from "@remotion/lambda/client";
import {
  renderMediaOnLambda,
  speculateFunctionName,
} from "@remotion/lambda/client";
import { DISK, RAM, REGION, SITE_NAME, TIMEOUT } from "../../../../config.mjs";
import { executeApi } from "../../../../helpers/api-response";
import { RenderRequest } from "../../../../types/schema";

export const POST = executeApi<RenderMediaOnLambdaOutput, typeof RenderRequest>(
  RenderRequest,
  async (req, body) => {
    console.log("Received render request:", JSON.stringify(body, null, 2));

    if (
      !process.env.AWS_ACCESS_KEY_ID &&
      !process.env.REMOTION_AWS_ACCESS_KEY_ID
    ) {
      console.error("AWS Access Key ID not set");
      throw new TypeError(
        "Set up Remotion Lambda to render videos. See the README.md for how to do so.",
      );
    }
    if (
      !process.env.AWS_SECRET_ACCESS_KEY &&
      !process.env.REMOTION_AWS_SECRET_ACCESS_KEY
    ) {
      console.error("AWS Secret Access Key not set");
      throw new TypeError(
        "The environment variable REMOTION_AWS_SECRET_ACCESS_KEY is missing. Add it to your .env file.",
      );
    }

    console.log("Initiating renderMediaOnLambda");
    try {
      const result = await renderMediaOnLambda({
        codec: "h264",
        functionName: speculateFunctionName({
          diskSizeInMb: DISK,
          memorySizeInMb: RAM,
          timeoutInSeconds: TIMEOUT,
        }),
        region: REGION as AwsRegion,
        serveUrl: SITE_NAME,
        composition: body.id,
        inputProps: body.inputProps,
        framesPerLambda: 500,
        downloadBehavior: {
          type: "download",
          fileName: "video.mp4",
        },
      });
      console.log("renderMediaOnLambda result:", JSON.stringify(result, null, 2));
      return result;
    } catch (error) {
      console.error("Error in renderMediaOnLambda:", error);
      throw error;
    }
  },
);
