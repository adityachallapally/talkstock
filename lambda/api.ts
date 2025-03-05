//lambda/api.ts
import { z } from "zod";
import type { RenderMediaOnLambdaOutput } from "@remotion/lambda/client";
import {
  ProgressRequest,
  ProgressResponse,
  RenderRequest,
} from "../types/schema";
import { CompositionProps } from "../types/constants";
import { ApiResponse } from "../helpers/api-response";

const makeRequest = async <Res>(
  endpoint: string,
  body: unknown,
): Promise<Res> => {
  // Get the base URL from an environment variable or use a default
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  
  // Construct the full URL
  const fullUrl = new URL(endpoint, baseUrl).toString();

  console.log(`Making request to: ${fullUrl}`);

  const result = await fetch(fullUrl, {
    method: "post",
    body: JSON.stringify(body),
    headers: {
      "content-type": "application/json",
    },
  });

  if (!result.ok) {
    throw new Error(`Request failed with status ${result.status}`);
  }

  const json = await result.json();
  if (json.type === "error") {
    throw new Error(json.message);
  } else if (json.type === "success") {
    return json.data;
  }

  // For backward compatibility, if response is not wrapped
  return json as Res;
};

export const renderVideo = async ({
  id,
  inputProps,
}: {
  id: string;
  inputProps: z.infer<typeof CompositionProps>;
}) => {
  console.log('Starting renderVideo function');
  console.log('Composition ID:', id);
  console.log('Input Props:', JSON.stringify(inputProps, null, 2));

  const body: z.infer<typeof RenderRequest> = {
    id,
    inputProps,
  };

  try {
    console.log('Sending request to /api/lambda/render');
    const result = await makeRequest<RenderMediaOnLambdaOutput>("/api/lambda/render", body);
    console.log('Received response from /api/lambda/render:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error in renderVideo function:', error);
    throw error;
  }
};

export const getProgress = async ({
  id,
  bucketName,
}: {
  id: string;
  bucketName: string;
}) => {
  const body: z.infer<typeof ProgressRequest> = {
    id,
    bucketName,
  };

  return makeRequest<ProgressResponse>("/api/lambda/progress", body);
};
