import {
  speculateFunctionName,
  AwsRegion,
  getRenderProgress,
} from "@remotion/lambda/client";
import { DISK, RAM, REGION, TIMEOUT } from "@/config.mjs";
import { executeApi } from "../../../../helpers/api-response";
import { ProgressRequest, ProgressResponse } from "../../../../types/schema";
import { NextResponse } from "next/server";

// Create a direct handler to bypass executeApi for debugging
export async function POST(req: Request) {
  console.log("🔍 Progress route direct handler started");
  
  try {
    // Parse the request body manually
    const body = await req.json();
    console.log("📝 Request body:", JSON.stringify(body, null, 2));
    
    // Validate required fields
    if (!body.id || !body.bucketName) {
      console.error("❌ Missing required fields in request");
      return NextResponse.json(
        { error: "Missing required fields: id and bucketName are required" },
        { status: 400 }
      );
    }
    
    console.log("⚙️ Lambda configuration:", {
      bucketName: body.bucketName,
      functionName: speculateFunctionName({
        diskSizeInMb: DISK,
        memorySizeInMb: RAM,
        timeoutInSeconds: TIMEOUT,
      }),
      region: REGION,
      renderId: body.id,
    });

    // Check AWS credentials
    console.log("🔑 AWS Credentials check:", {
      hasAwsKeyId: !!process.env.AWS_ACCESS_KEY_ID,
      awsKeyIdLength: process.env.AWS_ACCESS_KEY_ID?.length,
      hasAwsSecret: !!process.env.AWS_SECRET_ACCESS_KEY,
      awsSecretLength: process.env.AWS_SECRET_ACCESS_KEY?.length,
      hasRemotionKeyId: !!process.env.REMOTION_AWS_ACCESS_KEY_ID,
      remotionKeyIdLength: process.env.REMOTION_AWS_ACCESS_KEY_ID?.length,
      hasRemotionSecret: !!process.env.REMOTION_AWS_SECRET_ACCESS_KEY,
      remotionSecretLength: process.env.REMOTION_AWS_SECRET_ACCESS_KEY?.length,
    });

    try {
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

      console.log("✅ Progress data received:", JSON.stringify(renderProgress, null, 2));

      let response: ProgressResponse;

      if (renderProgress.fatalErrorEncountered) {
        console.log("❌ Fatal error encountered:", renderProgress.errors[0].message);
        response = {
          type: "error",
          message: renderProgress.errors[0].message,
        };
      } else if (renderProgress.done) {
        console.log("✅ Render completed:", {
          url: renderProgress.outputFile,
          size: renderProgress.outputSizeInBytes,
        });
        response = {
          type: "done",
          url: renderProgress.outputFile as string,
          size: renderProgress.outputSizeInBytes as number,
        };
      } else {
        console.log("🔄 Render in progress:", {
          progress: Math.max(0.03, renderProgress.overallProgress),
        });
        response = {
          type: "progress",
          progress: Math.max(0.03, renderProgress.overallProgress),
        };
      }

      return NextResponse.json(response);
    } catch (error) {
      console.error("❌ Error in getRenderProgress:", error);
      
      // Log detailed error information
      if (error instanceof Error) {
        console.error({
          name: error.name,
          message: error.message,
          stack: error.stack,
          cause: error.cause,
        });
      } else {
        console.error("Unknown error type:", error);
      }
      
      return NextResponse.json(
        { 
          type: "error", 
          message: error instanceof Error ? error.message : "Unknown error occurred" 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Fatal error in progress route handler:", error);
    
    // Log detailed error information
    if (error instanceof Error) {
      console.error({
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause,
      });
    } else {
      console.error("Unknown error type:", error);
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error occurred" },
      { status: 500 }
    );
  }
}
