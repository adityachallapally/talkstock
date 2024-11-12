//videorendering.ts
import { getNatsConnection, publishVideoCreationRequest, getVideoResult } from '../utils/nats';
import { StringCodec, JetStreamClient } from 'nats';

export async function renderVideo(audioUrl: string, imageUrls: string[], script: string): Promise<string> {
  const sc = StringCodec();

  try {
    const requestId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`Sending video creation request with ID: ${requestId}`);

    await publishVideoCreationRequest({ 
      audio_url: audioUrl,
      image_urls: imageUrls,
      script_text: script,
      request_id: requestId
    });

    const nc = await getNatsConnection();
    const js = nc.jetstream();
    
    // Get the KV store
    const kv = await js.views.kv('VIDEO_RESULTS');
    
    // Watch for changes in the KV store
    const iter = await kv.watch({ key: requestId });

    for await (const entry of iter) {
      if (entry.operation === 'PUT') {
        console.log(`Received response for request ${requestId}`);
        const response = JSON.parse(sc.decode(entry.value));
        
        if (response.status === 'success') {
          console.log(`Video creation successful for request ${requestId}`);
          await iter.stop();
          // Return the video URL instead of the path
          return response.video_url;
        } else if (response.status === 'error') {
          console.error(`Error in video creation for request ${requestId}: ${response.message}`);
          await iter.stop();
          throw new Error(response.message);
        }
      }
    }

    throw new Error('Watch closed without receiving a response');
  } catch (error) {
    console.error('Error rendering video:', error);
    throw error;
  }
}