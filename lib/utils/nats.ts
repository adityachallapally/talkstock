// utils/nats.ts
import { connect, NatsConnection, JetStreamClient, KV } from 'nats';

let natsConnection: NatsConnection | null = null;
let jetStream: JetStreamClient | null = null;
let kvStore: KV | null = null;

export async function getNatsConnection(): Promise<NatsConnection> {
  if (!natsConnection || natsConnection.isClosed()) {
    try {
      console.log('Attempting to connect to NATS server...');
      const natsUrl = process.env.NATS_URL;
      natsConnection = await connect({ 
        servers: natsUrl,
        timeout: 5000,
        reconnect: true,
        reconnectTimeWait: 1000,
        maxReconnectAttempts: 5,
      });
      console.log('Successfully connected to NATS server');
      
      jetStream = natsConnection.jetstream();

      // Initialize the KV store
      kvStore = await jetStream.views.kv('VIDEO_RESULTS');
    } catch (error) {
      console.error('Failed to connect to NATS server:', error);
      throw error;
    }
  }
  return natsConnection;
}

export async function publishVideoCreationRequest(data: any): Promise<void> {
  if (!jetStream) {
    await getNatsConnection();
  }

  if (!jetStream) {
    throw new Error('JetStream is not initialized');
  }

  try {
    await jetStream.publish('video.create', JSON.stringify(data));
    console.log('Video creation request published');
  } catch (error) {
    console.error('Error publishing video creation request:', error);
    throw error;
  }
}

export async function getVideoResult(requestId: string): Promise<any | null> {
  if (!kvStore) {
    await getNatsConnection();
  }

  if (!kvStore) {
    throw new Error('KV store is not initialized');
  }

  try {
    const entry = await kvStore.get(requestId);
    if (entry) {
      return JSON.parse(new TextDecoder().decode(entry.value));
    }
    return null;
  } catch (error) {
    if (error.code === 'NO_KEY') {
      // Result not found, return null
      return null;
    }
    console.error('Error getting video result:', error);
    throw error;
  }
}