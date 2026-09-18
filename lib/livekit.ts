import { AccessToken } from "livekit-server-sdk";

export interface GenerateLiveKitTokenParams {
  roomName: string;
  identity: string;
  name?: string;
  metadata?: string;
  ttlSeconds?: number;
}

export function getLiveKitConfig() {
  const url = process.env.LIVEKIT_URL || "http://localhost:7880";
  const apiKey = process.env.LIVEKIT_API_KEY || "devkey";
  const apiSecret = process.env.LIVEKIT_API_SECRET || "secret";

  return { url, apiKey, apiSecret };
}

/**
 * Creates a signed JWT AccessToken for a LiveKit room
 * Scoped to roomJoin, publishing audio/video, subscribing, and data-channel chat.
 */
export async function createLiveKitToken(
  params: GenerateLiveKitTokenParams
): Promise<string> {
  const { apiKey, apiSecret } = getLiveKitConfig();

  const token = new AccessToken(apiKey, apiSecret, {
    identity: params.identity,
    name: params.name,
    metadata: params.metadata,
    ttl: params.ttlSeconds ?? 3600,
  });

  token.addGrant({
    roomJoin: true,
    room: params.roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true, // Enables in-call chat over WebRTC data channels
  });

  return await token.toJwt();
}
