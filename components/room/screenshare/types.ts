import { Track } from "livekit-client";

export interface ActiveSharer {
  isLocal: boolean;
  participantId: string;
  name: string;
  track?: Track;
}
