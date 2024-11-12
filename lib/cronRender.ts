import { renderVideo, getProgress } from "../lambda/api";
import { CompositionProps } from "../types/constants";
import { z } from "zod";

async function cronRender(inputProps: z.infer<typeof CompositionProps>) {
  console.log("Starting cronRender function");
  console.log("Input Props:", JSON.stringify(inputProps, null, 2));

  try {
    console.log("Calling renderVideo function");
    const { renderId, bucketName } = await renderVideo({ id: "captioned-video", inputProps });
    console.log("Render initiated. Render ID:", renderId, "Bucket Name:", bucketName);

    let pending = true;
    while (pending) {
      console.log("Fetching render progress");
      const result = await getProgress({
        id: renderId,
        bucketName: bucketName,
      });
      console.log("Progress result:", JSON.stringify(result, null, 2));

      switch (result.type) {
        case "error":
          console.error("Render error:", result.message);
          throw new Error(result.message);
        case "done":
          console.log("Render completed successfully");
          console.log("Final result:", JSON.stringify(result, null, 2));
          return result.url;
        case "progress":
          console.log(`Render progress: ${(result.progress * 100).toFixed(2)}%`);
          // Wait for a bit before checking again
          await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  } catch (err) {
    console.error("Error in cronRender:", err);
    throw err;
  }
}

export { cronRender };
    