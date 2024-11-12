//helpers/use-rendering.ts
import { z } from "zod";
import { useCallback, useMemo, useState } from "react";
import { getProgress, renderVideo } from "../lambda/api";
import { CompositionProps } from "../types/constants";

export type State =
  | {
      status: "init";
    }
  | {
      status: "invoking";
    }
  | {
      renderId: string;
      bucketName: string;
      progress: number;
      status: "rendering";
    }
  | {
      renderId: string | null;
      status: "error";
      error: Error;
    }
  | {
      url: string;
      size: number;
      status: "done";
    };

const wait = async (milliSeconds: number) => {
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, milliSeconds);
  });
};

export const useRendering = (
  id: string,
  inputProps: z.infer<typeof CompositionProps>,
) => {
  const [state, setState] = useState<State>({
    status: "init",
  });

  const renderMedia = useCallback(async () => {
    console.log("Starting renderMedia function");
    console.log("Render ID:", id);
    console.log("Input Props:", JSON.stringify(inputProps, null, 2));

    setState({
      status: "invoking",
    });

    try {
      console.log("Calling renderVideo function");
      const { renderId, bucketName } = await renderVideo({ id, inputProps });
      console.log("Render initiated. Render ID:", renderId, "Bucket Name:", bucketName);

      setState({
        status: "rendering",
        renderId: renderId,
        bucketName: bucketName,
        progress: 0,
      });

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
            setState({
              status: "error",
              renderId: renderId,
              error: new Error(result.message),
            });
            pending = false;
            break;
          case "done":
            console.log("Render completed successfully");
            console.log("Final result:", JSON.stringify(result, null, 2));
            setState({
              size: result.size,
              url: result.url,
              status: "done",
            });
            pending = false;
            break;
          case "progress":
            console.log(`Render progress: ${(result.progress * 100).toFixed(2)}%`);
            setState({
              status: "rendering",
              bucketName: bucketName,
              progress: result.progress,
              renderId: renderId,
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (err) {
      console.error("Error in renderMedia:", err);
      setState({
        status: "error",
        renderId: null,
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }

    console.log("Final state:", JSON.stringify(state, null, 2));
  }, [id, inputProps]);

  const undo = useCallback(() => {
    setState({ status: "init" });
  }, []);

  return useMemo(() => {
    return {
      renderMedia,
      state,
      undo,
    };
  }, [renderMedia, state, undo]);
};
