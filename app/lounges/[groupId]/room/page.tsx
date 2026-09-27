"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  BookOpen,
  Pin,
  X,
  Clock,
  Plus,
  Volume2,
  Share2,
  Layers,
  Sparkles,
  Users,
  Copy,
  Check,
  MessageSquare,
  Send,
  AlertCircle,
  Download,
  Image as ImageIcon,
  Upload,
  Ban,
} from "lucide-react";
import {
  Room,
  RoomEvent,
  Track,
  RemoteParticipant,
  RemoteTrackPublication,
  ParticipantEvent,
  LocalVideoTrack,
} from "livekit-client";
import type {
  BackgroundProcessorWrapper,
  SwitchBackgroundProcessorOptions,
} from "@livekit/track-processors";
import { Button } from "@/components/ui/Button";

interface BackgroundPreset {
  id: string;
  name: string;
  description: string;
  type: "none" | "blur" | "image";
  src?: string;
}

const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: "none",
    name: "None",
    description: "Standard camera video feed",
    type: "none",
  },
  {
    id: "blur",
    name: "Blur",
    description: "Subtle depth-of-field background blur",
    type: "blur",
  },
  {
    id: "library",
    name: "The Grand Library",
    description: "Classical reading room with cathedral stacks",
    type: "image",
    src: "/backgrounds/library.jpg",
  },
  {
    id: "loft",
    name: "Minimalist Loft",
    description: "Clean study space with soft natural daylight",
    type: "image",
    src: "/backgrounds/loft.jpg",
  },
  {
    id: "archive",
    name: "Rare Archive",
    description: "Historic manuscripts & scholar study desk",
    type: "image",
    src: "/backgrounds/archive.jpg",
  },
  {
    id: "studio",
    name: "Academic Studio",
    description: "Modern architectural drafting studio",
    type: "image",
    src: "/backgrounds/studio.jpg",
  },
];

interface Asset {
  id: string;
  title: string;
  fileType: string;
  sizeBytes: number;
  canAccess: boolean;
}

/**
 * Word-by-word reveal for live captioning simulation (§6.3)
 */
function WordByWordTranscript({
  text,
  shouldReduceMotion,
}: {
  text: string;
  shouldReduceMotion: boolean | null;
}) {
  const words = text.split(" ");
  if (shouldReduceMotion) {
    return <span>&ldquo;{text}&rdquo;</span>;
  }
  return (
    <span>
      &ldquo;
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15, delay: i * 0.04 }}
          className="inline-block mr-1"
        >
          {word}
        </motion.span>
      ))}
      &rdquo;
    </span>
  );
}

/**
 * Remote Participant Video Tile (§6.3)
 * FLIP-style layout animation, active speaker brightness + 1.02 scale
 */
function RemoteParticipantTile({
  participant,
  isMainSpeaker = false,
  shouldReduceMotion = false,
}: {
  participant: RemoteParticipant;
  isMainSpeaker?: boolean;
  shouldReduceMotion?: boolean | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const participantName =
    participant.name || participant.identity || "Study Member";
  const initials = participantName.substring(0, 2).toUpperCase();

  useEffect(() => {
    function syncTracks() {
      const videoPub =
        participant.getTrackPublication(Track.Source.Camera) ||
        participant.getTrackPublication(Track.Source.ScreenShare);
      const audioPub = participant.getTrackPublication(Track.Source.Microphone);

      if (videoPub?.track && !videoPub.isMuted) {
        if (videoRef.current) {
          videoPub.track.attach(videoRef.current);
        }
        setHasVideo(true);
      } else {
        if (videoRef.current && videoPub?.track) {
          videoPub.track.detach(videoRef.current);
        }
        setHasVideo(false);
      }

      setIsMuted(Boolean(!audioPub || audioPub.isMuted));
    }

    syncTracks();

    const onSpeakingChange = (speaking: boolean) => {
      setIsSpeaking(speaking);
    };

    participant.on(ParticipantEvent.TrackSubscribed, syncTracks);
    participant.on(ParticipantEvent.TrackPublished, syncTracks);
    participant.on(ParticipantEvent.TrackUnsubscribed, syncTracks);
    participant.on(ParticipantEvent.TrackUnpublished, syncTracks);
    participant.on(ParticipantEvent.TrackMuted, syncTracks);
    participant.on(ParticipantEvent.TrackUnmuted, syncTracks);
    participant.on(ParticipantEvent.IsSpeakingChanged, onSpeakingChange);

    return () => {
      participant.off(ParticipantEvent.TrackSubscribed, syncTracks);
      participant.off(ParticipantEvent.TrackPublished, syncTracks);
      participant.off(ParticipantEvent.TrackUnsubscribed, syncTracks);
      participant.off(ParticipantEvent.TrackUnpublished, syncTracks);
      participant.off(ParticipantEvent.TrackMuted, syncTracks);
      participant.off(ParticipantEvent.TrackUnmuted, syncTracks);
      participant.off(ParticipantEvent.IsSpeakingChanged, onSpeakingChange);
    };
  }, [participant]);

  return (
    <motion.div
      layout={!shouldReduceMotion}
      layoutId={`tile-${participant.identity}`}
      animate={{
        scale: isSpeaking && !shouldReduceMotion ? 1.02 : 1,
        borderColor: isSpeaking
          ? "var(--text-primary)"
          : "var(--border-hairline)",
      }}
      transition={{
        layout: { duration: 0.45, ease: [0.65, 0, 0.35, 1] },
        duration: 0.2,
        ease: [0.25, 1, 0.5, 1],
      }}
      className={`relative overflow-hidden rounded-[var(--radius-card)] border bg-[var(--bg-elevated)] flex flex-col justify-end ${
        isMainSpeaker ? "w-full h-full" : "min-h-[9.5rem] flex-1 p-3"
      }`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`absolute inset-0 w-full h-full object-cover ${
          hasVideo ? "block" : "hidden"
        }`}
      />

      {/* Fallback Avatar when Video Off */}
      {!hasVideo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--bg-inset)] p-4 text-center">
          <div
            className={`rounded-full bg-[var(--bg-elevated)] border border-[var(--border-hairline)] flex items-center justify-center font-mono font-bold text-[var(--text-primary)] ${
              isMainSpeaker
                ? "w-24 h-24 text-3xl mb-3"
                : "w-12 h-12 text-sm mb-1.5"
            }`}
          >
            {initials}
          </div>
          <span className="font-sans font-medium text-xs text-[var(--text-primary)] truncate max-w-xs">
            {participantName}
          </span>
          <span className="font-mono text-[0.6875rem] text-[var(--text-secondary)]">
            {isSpeaking ? "Speaking" : "Camera off"}
          </span>
        </div>
      )}

      {/* Gradient Overlay for Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)]/80 via-transparent to-transparent pointer-events-none" />

      {/* Tag Overlay */}
      <div className="relative z-10 flex items-center justify-between p-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-sans font-medium text-[var(--text-primary)] truncate max-w-[10rem]">
            {participantName}
          </span>
          {isSpeaking && (
            <span className="flex items-center gap-1 font-mono text-[0.625rem] text-[var(--text-primary)] uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-primary)] animate-pulse" />
              Speaking
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {isMuted ? (
            <div
              className="p-1 rounded-[var(--radius-button)] bg-[var(--bg-inset)]/80 text-[var(--text-secondary)] border border-[var(--border-hairline)]"
              title="Muted"
            >
              <MicOff className="w-3.5 h-3.5" />
            </div>
          ) : (
            <div
              className="p-1 rounded-[var(--radius-button)] bg-[var(--bg-inset)]/80 text-[var(--text-primary)] border border-[var(--border-hairline)]"
              title="Audio Active"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function MeetingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const groupId = params.groupId as string;
  const shouldReduceMotion = useReducedMotion();

  // Media & Room state
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [roomMode, setRoomMode] = useState<"discussion" | "quiet">(
    "discussion"
  );
  const [isReferenceDeskOpen, setIsReferenceDeskOpen] = useState(false);
  const [callDuration, setCallDuration] = useState("00:00:00");
  const [groupName, setGroupName] = useState<string>("Study Group");
  const [groupCode, setGroupCode] = useState<string>("");
  const [isLeaving, setIsLeaving] = useState(false);

  // Real data state
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [pinnedNotes, setPinnedNotes] = useState<string[]>([]);
  const [newNoteInput, setNewNoteInput] = useState("");
  const [activeTab, setActiveTab] = useState<
    "chat" | "manuscript" | "notes" | "citations"
  >("chat");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCitations, setCopiedCitations] = useState(false);

  // In-call WebRTC Data-Channel Chat state
  interface InCallMessage {
    id: string;
    senderName: string;
    senderId?: string;
    text: string;
    time: string;
    isSelf: boolean;
  }
  const [inCallMessages, setInCallMessages] = useState<InCallMessage[]>([]);
  const [inCallInput, setInCallInput] = useState("");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionTargetUrl, setConnectionTargetUrl] = useState<string | null>(null);
  const [connectionRetryCount, setConnectionRetryCount] = useState(0);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Live transcript & Pin Animation state (§6.3)
  interface TranscriptItem {
    id: string;
    time: string;
    speaker: string;
    text: string;
  }
  const [transcript, setTranscript] = useState<string | null>(null);
  const [transcriptTime, setTranscriptTime] = useState<string>("");
  const [transcriptLog, setTranscriptLog] = useState<TranscriptItem[]>([]);
  const [isPinFlashing, setIsPinFlashing] = useState(false);
  const [showTravelingPin, setShowTravelingPin] = useState(false);
  const [hasDownloadedConversation, setHasDownloadedConversation] = useState(false);

  // Virtual Photo Background & Blur state (Feature 1)
  const [activeBackgroundId, setActiveBackgroundId] = useState<string>("none");
  const [customBgUrl, setCustomBgUrl] = useState<string | null>(null);
  const [isBgPickerOpen, setIsBgPickerOpen] = useState(false);
  const [isApplyingBg, setIsApplyingBg] = useState(false);
  const [bgError, setBgError] = useState<string | null>(null);
  const bgProcessorRef = useRef<BackgroundProcessorWrapper | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // LiveKit Room reference & Participants
  const roomRef = useRef<Room | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const stageVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContainerRef = useRef<HTMLDivElement>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<
    RemoteParticipant[]
  >([]);
  const [isConnected, setIsConnected] = useState(false);

  // Load group details & assets
  useEffect(() => {
    async function loadLoungeDetails() {
      try {
        const [groupRes, assetsRes] = await Promise.all([
          fetch(`/api/groups/${groupId}`),
          fetch(`/api/assets?groupId=${groupId}`),
        ]);

        if (groupRes.ok) {
          const gData = await groupRes.json();
          setGroupName(gData.group.name);
          setGroupCode(gData.group.code);
        }

        if (assetsRes.ok) {
          const aData = await assetsRes.json();
          setAssets(aData.assets || []);
          if (aData.assets?.length > 0) {
            setSelectedAsset(aData.assets[0]);
          }
        }
      } catch (err) {
        console.warn("Failed to load study group metadata:", err);
      }
    }
    loadLoungeDetails();
  }, [groupId]);

  // Close Virtual Background picker on Escape key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isBgPickerOpen) {
        setIsBgPickerOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isBgPickerOpen]);

  // Connect to LiveKit Room and initialize local media with cancellation protection
  useEffect(() => {
    let isCancelled = false;
    let localRoom: Room | null = null;
    let localStream: MediaStream | null = null;

    async function initializeAndConnect() {
      try {
        if (
          typeof navigator !== "undefined" &&
          navigator.mediaDevices?.getUserMedia
        ) {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          });

          if (isCancelled) {
            stream.getTracks().forEach((track) => track.stop());
            return;
          }

          localStream = stream;
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          if (stageVideoRef.current) {
            stageVideoRef.current.srcObject = stream;
          }
        }
      } catch (mediaErr) {
        console.warn("Could not acquire initial camera/mic permissions:", mediaErr);
      }

      if (isCancelled) return;

      try {
        // Start or join the active session record in DB
        try {
          const sessionRes = await fetch(`/api/groups/${groupId}/sessions/start`, {
            method: "POST",
          });
          if (sessionRes.ok) {
            const sData = await sessionRes.json();
            if (sData.session?.id && !isCancelled) {
              setActiveSessionId(sData.session.id);
            }
          }
        } catch (sessionErr) {
          console.warn("Could not register active session:", sessionErr);
        }

        if (isCancelled) return;

        const tokenRes = await fetch("/api/livekit/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ groupId }),
        });

        if (!tokenRes.ok) {
          const errData = await tokenRes.json().catch(() => ({}));
          throw new Error(errData.error || "Unable to obtain live room token");
        }

        const tokenData = await tokenRes.json();
        const token = tokenData.token;
        const wsUrl = tokenData.url || tokenData.livekitUrl;
        if (wsUrl) {
          setConnectionTargetUrl(wsUrl);
        }

        if (!wsUrl || !token) {
          throw new Error("LiveKit URL or token is missing from token response");
        }

        if (isCancelled) return;

        const room = new Room({
          adaptiveStream: true,
          dynacast: true,
        });
        localRoom = room;
        roomRef.current = room;

        const updateParticipants = () => {
          if (!isCancelled) {
            setRemoteParticipants(Array.from(room.remoteParticipants.values()));
          }
        };

        room.on(RoomEvent.ParticipantConnected, updateParticipants);
        room.on(RoomEvent.ParticipantDisconnected, (participant) => {
          const audios = audioContainerRef.current?.querySelectorAll(
            `[id^="audio-${participant.identity}"]`
          );
          audios?.forEach((el) => el.remove());
          updateParticipants();
        });

        room.on(
          RoomEvent.TrackSubscribed,
          (
            track: Track,
            _pub: RemoteTrackPublication,
            participant: RemoteParticipant
          ) => {
            if (track.kind === Track.Kind.Audio) {
              const el = track.attach();
              el.id = `audio-${participant.identity}-${track.sid}`;
              audioContainerRef.current?.appendChild(el);
            }
            updateParticipants();
          }
        );

        room.on(RoomEvent.TrackUnsubscribed, (track: Track) => {
          if (track.kind === Track.Kind.Audio) {
            track.detach().forEach((el) => el.remove());
          }
          updateParticipants();
        });

        room.on(RoomEvent.TrackMuted, updateParticipants);
        room.on(RoomEvent.TrackUnmuted, updateParticipants);

        room.on(
          RoomEvent.DataReceived,
          (payload: Uint8Array, participant?: RemoteParticipant) => {
            if (isCancelled) return;
            try {
              const text = new TextDecoder().decode(payload);
              const data = JSON.parse(text);
              if (data.type === "transcript") {
                setTranscript(data.text);
                const now = new Date();
                const timeStr =
                  data.time ||
                  now.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  });
                setTranscriptTime(timeStr);
                setTranscriptLog((prev) => [
                  ...prev,
                  {
                    id:
                      data.id ||
                      `transcript-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    time: timeStr,
                    speaker: data.speaker || "AI Transcript",
                    text: data.text,
                  },
                ]);
              } else if (data.type === "chat" && data.text) {
                const now = new Date();
                const timeStr =
                  data.time ||
                  now.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                const sender =
                  data.senderName ||
                  participant?.name ||
                  participant?.identity ||
                  "Member";
                setInCallMessages((prev) => [
                  ...prev,
                  {
                    id:
                      data.id ||
                      `incall-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    senderName: sender,
                    senderId: data.senderId || participant?.identity,
                    text: data.text,
                    time: timeStr,
                    isSelf: false,
                  },
                ]);
              }
            } catch {
              // ignore non-json data
            }
          }
        );

        await room.connect(wsUrl, token);

        if (isCancelled) {
          room.disconnect();
          return;
        }

        setIsConnected(true);
        setConnectionError(null);
        updateParticipants();

        try {
          await room.localParticipant.enableCameraAndMicrophone();
          const camTrack = room.localParticipant.getTrackPublication(
            Track.Source.Camera
          );
          if (camTrack?.track && !isCancelled) {
            if (localVideoRef.current) {
              camTrack.track.attach(localVideoRef.current);
            }
            if (stageVideoRef.current) {
              camTrack.track.attach(stageVideoRef.current);
            }
          }
        } catch (mediaErr) {
          console.warn("Could not enable LiveKit camera/microphone:", mediaErr);
        }
      } catch (err: unknown) {
        if (isCancelled) return;
        console.error("LiveKit connection failure:", err);
        const errMsg =
          err instanceof Error ? err.message : "Failed to connect to LiveKit room";
        setConnectionError(errMsg);
        setIsConnected(false);
      }
    }

    initializeAndConnect();

    return () => {
      isCancelled = true;
      if (bgProcessorRef.current) {
        try {
          bgProcessorRef.current.destroy?.();
        } catch {}
        bgProcessorRef.current = null;
      }
      if (localRoom) {
        localRoom.disconnect();
      } else if (roomRef.current) {
        roomRef.current.disconnect();
      }
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      } else if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [groupId, connectionRetryCount]);

  // Duration Timer (from 00:00:00)
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
      const hrs = String(Math.floor(elapsedSec / 3600)).padStart(2, "0");
      const mins = String(Math.floor((elapsedSec % 3600) / 60)).padStart(
        2,
        "0"
      );
      const secs = String(elapsedSec % 60).padStart(2, "0");
      setCallDuration(`${hrs}:${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  async function handleToggleMic() {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }

    if (roomRef.current?.localParticipant) {
      try {
        await roomRef.current.localParticipant.setMicrophoneEnabled(!nextMuted);
      } catch (err) {
        console.warn("Failed to toggle LiveKit microphone:", err);
      }
    }
  }

  async function handleToggleVideo() {
    const nextVideoOff = !isVideoOff;
    setIsVideoOff(nextVideoOff);

    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !nextVideoOff;
      });

      if (
        !nextVideoOff &&
        localStreamRef.current.getVideoTracks().length === 0
      ) {
        try {
          const vStream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          const newTrack = vStream.getVideoTracks()[0];
          if (newTrack) {
            localStreamRef.current.addTrack(newTrack);
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = localStreamRef.current;
            }
            if (stageVideoRef.current) {
              stageVideoRef.current.srcObject = localStreamRef.current;
            }
          }
        } catch (camErr) {
          console.warn("Failed to re-enable camera stream:", camErr);
        }
      }
    } else if (!nextVideoOff) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: !isMuted,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        if (stageVideoRef.current) {
          stageVideoRef.current.srcObject = stream;
        }
      } catch (camErr) {
        console.warn("Failed to acquire camera stream:", camErr);
      }
    }

    if (roomRef.current?.localParticipant) {
      try {
        await roomRef.current.localParticipant.setCameraEnabled(!nextVideoOff);
        if (!nextVideoOff) {
          const camTrack = roomRef.current.localParticipant.getTrackPublication(
            Track.Source.Camera
          );
          if (camTrack?.track) {
            if (localVideoRef.current) {
              camTrack.track.attach(localVideoRef.current);
            }
            if (stageVideoRef.current) {
              camTrack.track.attach(stageVideoRef.current);
            }
            if (activeBackgroundId !== "none") {
              setTimeout(() => {
                applyBackground(activeBackgroundId);
              }, 100);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to toggle LiveKit camera:", err);
      }
    }
  }

  async function handleToggleScreenShare() {
    if (!roomRef.current?.localParticipant) return;
    const nextScreenSharing = !isScreenSharing;
    try {
      await roomRef.current.localParticipant.setScreenShareEnabled(
        nextScreenSharing
      );
      setIsScreenSharing(nextScreenSharing);
    } catch (err) {
      console.warn("Failed to toggle screen share:", err);
      setIsScreenSharing(false);
    }
  }

  // Leave Call (§6.3 - deliberate 250ms closing fade to --bg-primary before route transition)
  async function handleLeave() {
    setIsLeaving(true);
    if (bgProcessorRef.current) {
      try {
        bgProcessorRef.current.destroy?.();
      } catch {}
      bgProcessorRef.current = null;
    }
    if (activeSessionId && roomRef.current && roomRef.current.remoteParticipants.size === 0) {
      try {
        await fetch(`/api/groups/${groupId}/sessions/${activeSessionId}/end`, {
          method: "POST",
        });
      } catch (endErr) {
        console.warn("Could not mark session ended:", endErr);
      }
    }
    setTimeout(() => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
      router.push(`/lounges/${groupId}`);
    }, 250);
  }

  // Virtual Photo Background & Blur Logic (Feature 1)
  async function applyBackground(
    bgId: string,
    customUrlOverride?: string | null
  ) {
    setIsApplyingBg(true);
    setBgError(null);
    setActiveBackgroundId(bgId);

    const customUrlToUse =
      customUrlOverride !== undefined ? customUrlOverride : customBgUrl;

    try {
      const camPub = roomRef.current?.localParticipant?.getTrackPublication(
        Track.Source.Camera
      );
      const camTrack = camPub?.track as LocalVideoTrack | undefined;

      if (!camTrack) {
        // Camera is not currently on; state is recorded and will apply when enabled
        setIsApplyingBg(false);
        return;
      }

      if (bgId === "none") {
        if (bgProcessorRef.current) {
          try {
            await bgProcessorRef.current.switchTo({ mode: "disabled" });
          } catch {
            await camTrack.stopProcessor().catch(() => {});
          }
          await camTrack.stopProcessor().catch(() => {});
          bgProcessorRef.current = null;
        } else {
          await camTrack.stopProcessor().catch(() => {});
        }
        setIsApplyingBg(false);
        return;
      }

      const { BackgroundProcessor, supportsBackgroundProcessors } = await import(
        "@livekit/track-processors"
      );

      if (
        typeof supportsBackgroundProcessors === "function" &&
        !supportsBackgroundProcessors()
      ) {
        setBgError("Virtual backgrounds are not supported in your current browser.");
        setIsApplyingBg(false);
        return;
      }

      let modeOptions: SwitchBackgroundProcessorOptions;
      if (bgId === "blur") {
        modeOptions = { mode: "background-blur", blurRadius: 10 };
      } else {
        let imagePath = "";
        if (bgId === "custom") {
          if (!customUrlToUse) {
            setBgError("Please upload an image first.");
            setIsApplyingBg(false);
            return;
          }
          imagePath = customUrlToUse;
        } else {
          const preset = BACKGROUND_PRESETS.find((p) => p.id === bgId);
          if (!preset?.src) {
            setIsApplyingBg(false);
            return;
          }
          imagePath = preset.src;
        }
        modeOptions = { mode: "virtual-background", imagePath };
      }

      if (bgProcessorRef.current) {
        await bgProcessorRef.current.switchTo(modeOptions);
      } else {
        const processor = BackgroundProcessor(modeOptions);
        await camTrack.setProcessor(processor);
        bgProcessorRef.current = processor;
      }
    } catch (err: unknown) {
      console.error("Failed to apply background processor:", err);
      setBgError(
        err instanceof Error ? err.message : "Failed to apply background effect"
      );
    } finally {
      setIsApplyingBg(false);
    }
  }

  function handleCustomFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setBgError("Please select a valid image file (JPEG, PNG, WebP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setBgError("Image file size exceeds the 10MB limit.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCustomBgUrl(dataUrl);
        applyBackground("custom", dataUrl);
      }
    };
    reader.onerror = () => {
      setBgError("Failed to read the selected image file.");
    };
    reader.readAsDataURL(file);
  }

  // Download Conversation as Markdown (Feature 2)
  function handleDownloadConversation() {
    const now = new Date();
    const dateFormatted = now.toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const timeFormatted = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const participantsList = [
      user?.fullName || "You",
      ...remoteParticipants.map((p) => p.name || p.identity || "Study Member"),
    ].filter(Boolean);

    let md = `# Meeting Conversation — ${groupName || "Study Group"}\n\n`;
    md += `**Date:** ${dateFormatted} at ${timeFormatted}  \n`;
    md += `**Call Duration:** ${callDuration}  \n`;
    md += `**Participants:** ${participantsList.join(", ")}  \n`;
    md += `**Room Mode:** ${roomMode === "quiet" ? "Silent Study" : "Active Discussion"}  \n\n`;
    md += `---\n\n`;

    // 1. In-Call Chat Section
    md += `## In-Call Chat\n\n`;
    if (inCallMessages.length === 0) {
      md += `*No in-call chat messages were recorded in this session.*\n\n`;
    } else {
      inCallMessages.forEach((msg) => {
        md += `### ${msg.senderName} — ${msg.time}\n\n`;
        md += `${msg.text}\n\n`;
      });
    }

    // 2. Transcript Section (if transcripts exist)
    if (transcriptLog.length > 0 || transcript) {
      md += `---\n\n`;
      md += `## Session Transcript\n\n`;
      if (transcriptLog.length > 0) {
        transcriptLog.forEach((t) => {
          md += `> **[${t.time}] ${t.speaker}:**\n> ${t.text}\n\n`;
        });
      } else if (transcript) {
        md += `> **[${transcriptTime}] AI Transcript:**\n> ${transcript}\n\n`;
      }
    }

    // 3. Pinned Notes Section (if any exist)
    if (pinnedNotes.length > 0) {
      md += `---\n\n`;
      md += `## Pinned Notes\n\n`;
      pinnedNotes.forEach((note) => {
        md += `- ${note}\n`;
      });
      md += `\n`;
    }

    md += `---\n`;
    md += `*Exported from StudyGroup+ Lounge on ${new Date().toISOString()}*\n`;

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, "");
    const timeStamp = now.toTimeString().slice(0, 8).replace(/:/g, "");
    const safeGroupName = (groupName || "studygroup")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
    a.download = `${safeGroupName}_conversation_${dateStamp}_${timeStamp}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setHasDownloadedConversation(true);
    setTimeout(() => setHasDownloadedConversation(false), 2500);
  }

  async function handleSendInCallMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = inCallInput.trim();
    if (!text || !roomRef.current) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const msgId = `incall-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const sender = user?.fullName || user?.firstName || "You";

    const payload = {
      type: "chat",
      id: msgId,
      senderName: sender,
      senderId: user?.id,
      text,
      time: timeStr,
    };

    try {
      const encoder = new TextEncoder();
      await roomRef.current.localParticipant.publishData(
        encoder.encode(JSON.stringify(payload)),
        { reliable: true }
      );
    } catch (publishErr) {
      console.warn("Failed to publish in-call chat:", publishErr);
    }

    setInCallMessages((prev) => [
      ...prev,
      {
        id: msgId,
        senderName: sender,
        senderId: user?.id,
        text,
        time: timeStr,
        isSelf: true,
      },
    ]);
    setInCallInput("");
  }

  function handleCopyInviteLink() {
    const inviteUrl = `${window.location.origin}/join/${groupCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  function handleAddMeetingNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNoteInput.trim()) return;
    setPinnedNotes((prev) => [newNoteInput.trim(), ...prev]);
    setNewNoteInput("");
  }

  // Pin to Notes (§6.3 - transcript line flashes background, travel icon translates toward Notes tab)
  function handlePinTranscript() {
    if (!transcript) return;
    setIsPinFlashing(true);
    setShowTravelingPin(true);

    if (!pinnedNotes.includes(transcript)) {
      setPinnedNotes((prev) => [transcript, ...prev]);
    }

    setTimeout(() => {
      setIsPinFlashing(false);
    }, 450);

    setTimeout(() => {
      setShowTravelingPin(false);
    }, 650);
  }

  function handleCopyCitations() {
    if (assets.length === 0) return;
    const citationsText = assets
      .map((a) => `"${a.title}." StudyGroup+ Repository, ${groupName}.`)
      .join("\n");
    navigator.clipboard.writeText(citationsText);
    setCopiedCitations(true);
    setTimeout(() => setCopiedCitations(false), 2000);
  }

  const scholarInitials = user?.firstName
    ? user.firstName.substring(0, 2).toUpperCase()
    : "ME";

  if (connectionError) {
    return (
      <div className="h-screen w-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col font-sans items-center justify-center p-4">
        <div className="max-w-md w-full bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[var(--radius-card)] p-6 sm:p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[rgba(229,72,77,0.1)] border border-[rgba(229,72,77,0.3)] flex items-center justify-center mx-auto text-[#e5484d]">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-2xl font-normal text-[var(--text-primary)]">
            Live Room Connection Error
          </h2>
          <p className="font-sans text-xs text-[var(--text-secondary)] leading-relaxed">
            {connectionError}
          </p>
          {connectionTargetUrl && (
            <p className="font-mono text-[0.6875rem] text-[var(--text-secondary)] break-all border border-[var(--border-hairline)] p-2.5 rounded-[var(--radius-button)] bg-[var(--bg-inset)]">
              Target Server: {connectionTargetUrl}
            </p>
          )}
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link href={`/lounges/${groupId}`}>
              <Button variant="secondary" size="md">
                Back to Workspace
              </Button>
            </Link>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setConnectionError(null);
                setConnectionRetryCount((c) => c + 1);
              }}
            >
              Retry Connection
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col font-sans overflow-hidden select-none relative selection:bg-[var(--invert-bg)] selection:text-[var(--invert-text)]">
      {/* Hidden Audio Container for LiveKit remote tracks */}
      <div ref={audioContainerRef} className="hidden" aria-hidden="true" />

      {/* Leave Call 250ms Closing Beat Overlay (§6.3) */}
      <motion.div
        initial={false}
        animate={{ opacity: isLeaving ? 1 : 0 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="fixed inset-0 bg-[var(--bg-primary)] pointer-events-none z-50"
      />

      {/* Top Header Bar */}
      <header className="h-14 border-b border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 z-20">
        {/* Brand & Room Breadcrumb + Sanctioned Live Badge (§6.3 #2) */}
        <div className="flex items-center gap-3">
          <Link
            href="/lounges"
            className="font-serif text-lg font-normal text-[var(--text-primary)] flex items-baseline hover:opacity-80 transition-opacity"
          >
            StudyGroup<span className="italic font-normal">+</span>
          </Link>
          <span className="text-[var(--text-disabled)]">/</span>
          <Link
            href={`/lounges/${groupId}`}
            className="font-mono text-xs uppercase tracking-[0.06em] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors hidden sm:inline"
          >
            {groupName}
          </Link>
          <span className="text-[var(--text-disabled)] hidden sm:inline">/</span>

          {/* Second Sanctioned Accent-Live Indicator (§6.3 REC • LIVE matching Reference Photo) */}
          <div
            className="flex items-center gap-2 px-2.5 py-1 rounded-[var(--radius-button)] border border-[#e5484d] bg-[rgba(229,72,77,0.15)] text-[#e5484d] font-mono text-xs uppercase tracking-wider font-semibold"
            title={isConnected ? "Room connected" : "Connecting..."}
          >
            <span className="w-2 h-2 rounded-full bg-[#e5484d] animate-live-breathe" />
            <span>{isConnected ? "REC • LIVE" : "CONNECTING..."}</span>
          </div>
        </div>

        {/* Center: Mode Switcher (§6.3 Segmented Control) & Duration */}
        <div className="hidden md:flex items-center gap-4">
          <div className="p-1 bg-[var(--bg-inset)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] flex items-center gap-1 text-xs font-mono">
            <button
              type="button"
              onClick={() => setRoomMode("quiet")}
              className={`relative px-3 py-1 rounded-[calc(var(--radius-button)-2px)] transition-colors duration-[var(--dur-fast)] cursor-pointer ${
                roomMode === "quiet"
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {roomMode === "quiet" && (
                <motion.div
                  layoutId="activeRoomMode"
                  transition={{
                    duration: shouldReduceMotion ? 0.1 : 0.3,
                    ease: [0.25, 1, 0.5, 1],
                  }}
                  className="absolute inset-0 rounded-[calc(var(--radius-button)-2px)] bg-[var(--bg-elevated)] border border-[var(--border-hairline)]"
                />
              )}
              <span className="relative z-10">Silent Study</span>
            </button>
            <button
              type="button"
              onClick={() => setRoomMode("discussion")}
              className={`relative px-3 py-1 rounded-[calc(var(--radius-button)-2px)] transition-colors duration-[var(--dur-fast)] cursor-pointer ${
                roomMode === "discussion"
                  ? "text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {roomMode === "discussion" && (
                <motion.div
                  layoutId="activeRoomMode"
                  transition={{
                    duration: shouldReduceMotion ? 0.1 : 0.3,
                    ease: [0.25, 1, 0.5, 1],
                  }}
                  className="absolute inset-0 rounded-[calc(var(--radius-button)-2px)] bg-[var(--bg-elevated)] border border-[var(--border-hairline)]"
                />
              )}
              <span className="relative z-10">Discussion</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-[var(--text-secondary)] bg-[var(--bg-inset)] px-3 py-1 rounded-[var(--radius-button)] border border-[var(--border-hairline)]">
            <Clock className="w-3.5 h-3.5 text-[var(--text-primary)]" />
            <span>{callDuration}</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Download Conversation Button */}
          <Button
            variant="secondary"
            size="sm"
            icon={
              hasDownloadedConversation ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )
            }
            onClick={handleDownloadConversation}
            className="text-xs hidden sm:flex"
            title="Export in-call chat & transcripts as Markdown (.md)"
          >
            {hasDownloadedConversation ? "Exported" : "Download Chat (.md)"}
          </Button>

          <Button
            variant={isReferenceDeskOpen ? "primary" : "secondary"}
            size="sm"
            icon={<BookOpen className="w-3.5 h-3.5" />}
            onClick={() => setIsReferenceDeskOpen(!isReferenceDeskOpen)}
            className="text-xs"
          >
            Study Notes{" "}
            <span className="ml-1 px-1.5 py-0.5 rounded-[calc(var(--radius-button)-2px)] bg-[var(--bg-inset)] font-mono text-[0.625rem]">
              {assets.length}
            </span>
          </Button>

          <div className="w-8 h-8 rounded-full bg-[var(--bg-inset)] border border-[var(--border-hairline)] flex items-center justify-center font-mono text-xs font-semibold text-[var(--text-primary)]">
            {scholarInitials}
          </div>
        </div>
      </header>

      {/* Main Content Area: Stage + Side Panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Stage Grid with FLIP layout transitions (§6.3) */}
        <main className="flex-1 p-4 lg:p-6 flex flex-col justify-between overflow-hidden relative">
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch overflow-hidden">
            {/* Left Large Speaker / Stage Tile */}
            <motion.div
              layout={!shouldReduceMotion}
              className="lg:col-span-8 bg-[var(--bg-elevated)] rounded-[var(--radius-card)] border border-[var(--border-hairline)] relative overflow-hidden flex flex-col justify-between"
            >
              {remoteParticipants.length > 0 && remoteParticipants[0] ? (
                /* Primary Remote Participant on Stage */
                <RemoteParticipantTile
                  participant={remoteParticipants[0]}
                  isMainSpeaker={true}
                  shouldReduceMotion={shouldReduceMotion}
                />
              ) : (
                /* Single User / Stage View */
                <div className="absolute inset-0 bg-[var(--bg-inset)] flex flex-col items-center justify-center overflow-hidden">
                  <video
                    ref={stageVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`absolute inset-0 w-full h-full object-cover ${
                      isVideoOff ? "hidden" : "block"
                    }`}
                  />

                  {/* Fallback Display when Camera Off */}
                  {isVideoOff && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[var(--bg-elevated)]">
                      <div className="relative w-28 h-28 rounded-full bg-[var(--bg-inset)] border border-[var(--border-hairline)] flex items-center justify-center font-mono text-3xl text-[var(--text-primary)] mb-4">
                        {scholarInitials}
                        <span
                          className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-[var(--bg-overlay)] border border-[var(--border-hairline)] ring-2 ring-[var(--bg-elevated)]"
                          title="Camera Off"
                        />
                      </div>

                      <h3 className="font-serif text-2xl font-normal text-[var(--text-primary)] mb-1">
                        {user?.fullName || "You"}
                      </h3>
                      <p className="font-sans text-xs text-[var(--text-secondary)] max-w-sm mb-6 leading-relaxed">
                        Your camera is currently muted. Turn it on with the tray
                        button below, or invite study peers to this lounge.
                      </p>
                    </div>
                  )}

                  {/* Top Stage Badges */}
                  <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-[var(--radius-button)] bg-[var(--bg-inset)]/90 backdrop-blur-sm border border-[var(--border-hairline)] text-xs font-mono text-[var(--text-primary)] flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isVideoOff ? "bg-[var(--text-disabled)]" : "bg-[var(--text-primary)]"
                        }`}
                      />
                      {user?.fullName || "You"} (Stage)
                    </span>
                    {isMuted && (
                      <span className="px-2.5 py-1 rounded-[var(--radius-button)] bg-[var(--bg-inset)]/90 border border-[var(--border-hairline)] text-[var(--text-secondary)] text-xs font-mono flex items-center gap-1.5">
                        <MicOff className="w-3 h-3" /> Muted
                      </span>
                    )}
                  </div>

                  {/* Bottom Invite Floating Bar */}
                  <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
                    <div className="pointer-events-auto bg-[var(--bg-elevated)]/90 backdrop-blur-md px-4 py-2 rounded-[var(--radius-card)] border border-[var(--border-hairline)] flex items-center gap-3">
                      <span className="font-sans text-xs text-[var(--text-secondary)] hidden sm:inline">
                        Waiting for members to join
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyInviteLink}
                        className="px-3 py-1.5 bg-[var(--invert-bg)] hover:bg-white text-[var(--invert-text)] text-xs font-semibold rounded-[var(--radius-button)] flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Link Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" /> Copy Invite Link
                          </>
                        )}
                      </button>
                      {groupCode && (
                        <span className="font-mono text-xs text-[var(--text-secondary)] hidden md:inline">
                          #{groupCode}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Live Transcript Panel (§6.3 word-by-word reveal, 4px rise, Pin-to-notes travel animation) */}
              {transcript && (
                <motion.div
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 4 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    backgroundColor: isPinFlashing ? "var(--bg-overlay)" : "rgba(10, 10, 10, 0.92)",
                  }}
                  transition={{ duration: shouldReduceMotion ? 0.1 : 0.2 }}
                  className="relative z-20 m-4 p-4 rounded-[var(--radius-card)] backdrop-blur-md border border-[var(--border-hairline)] max-w-2xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[var(--text-primary)]" />
                      <span className="font-mono text-[0.625rem] font-medium uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                        Live Transcript • {transcriptTime}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[#e5484d] font-mono text-[0.625rem] font-semibold uppercase tracking-wider ml-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#e5484d] animate-live-breathe inline-block" />
                        STREAMING
                      </span>
                    </div>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={handlePinTranscript}
                        className="font-mono text-xs text-[var(--text-primary)] hover:underline transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Pin className="w-3 h-3" /> Pin to Notes
                      </button>

                      {/* Traveling Pin Icon Animation (§6.3) */}
                      {showTravelingPin && !shouldReduceMotion && (
                        <motion.div
                          initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                          animate={{ opacity: 0, x: 180, y: -40, scale: 0.4 }}
                          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                          className="absolute -top-1 left-0 pointer-events-none text-[var(--text-primary)]"
                        >
                          <Pin className="w-4 h-4" />
                        </motion.div>
                      )}
                    </div>
                  </div>

                  <p className="font-serif text-sm sm:text-base leading-relaxed text-[var(--text-primary)]">
                    <WordByWordTranscript text={transcript} shouldReduceMotion={shouldReduceMotion} />
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* Right Column: Local User + Additional Remote Participants (FLIP-animated) */}
            <div className="lg:col-span-4 flex flex-col gap-4 justify-between overflow-y-auto">
              {/* Local Participant Feed */}
              <motion.div
                layout={!shouldReduceMotion}
                className="flex-1 min-h-[9.5rem] bg-[var(--bg-elevated)] rounded-[var(--radius-card)] border border-[var(--border-hairline)] relative overflow-hidden flex flex-col justify-end p-3 group hover:border-[var(--border-hover)] transition-colors"
              >
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute inset-0 w-full h-full object-cover ${
                    isVideoOff ? "hidden" : "block"
                  }`}
                />

                {isVideoOff && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-inset)]">
                    <div className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-hairline)] flex items-center justify-center font-mono font-bold text-xs text-[var(--text-primary)]">
                      {scholarInitials}
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-primary)]/80 via-transparent to-transparent z-10 pointer-events-none" />

                <div className="relative z-20 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-sans font-medium text-[var(--text-primary)] block">
                      {user?.fullName || "You"} (You)
                    </span>
                    <span className="font-mono text-[0.6875rem] text-[var(--text-secondary)]">
                      {isScreenSharing ? "Sharing Screen" : "Member"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {isMuted ? (
                      <div
                        className="p-1 rounded-[var(--radius-button)] bg-[var(--bg-inset)]/80 text-[var(--text-secondary)] border border-[var(--border-hairline)]"
                        title="Microphone muted"
                      >
                        <MicOff className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div
                        className="p-1 rounded-[var(--radius-button)] bg-[var(--bg-inset)]/80 text-[var(--text-primary)] border border-[var(--border-hairline)]"
                        title="Microphone active"
                      >
                        <Mic className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Additional Remote Participants */}
              {remoteParticipants.slice(1).map((participant) => (
                <RemoteParticipantTile
                  key={participant.identity}
                  participant={participant}
                  shouldReduceMotion={shouldReduceMotion}
                />
              ))}

              {/* If only local user, show Waiting Status tile */}
              {remoteParticipants.length === 0 && (
                <div className="flex-1 min-h-[9.5rem] bg-[var(--bg-inset)] rounded-[var(--radius-card)] border border-dashed border-[var(--border-hairline)] flex flex-col items-center justify-center p-4 text-center">
                  <Users className="w-6 h-6 text-[var(--text-secondary)] mb-2 opacity-50" />
                  <span className="font-sans text-xs text-[var(--text-primary)] font-medium mb-1">
                    Room Ready
                  </span>
                  <span className="font-mono text-[0.6875rem] text-[var(--text-secondary)] max-w-xs leading-relaxed">
                    1 participant connected. Share invite link to add others.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Floating Bottom Media Control Bar (§6.3 mic/cam cross-fade glyph swaps) */}
          <div className="pt-4 flex justify-center z-30">
            <div className="px-5 py-2.5 rounded-[var(--radius-card)] bg-[var(--bg-elevated)] border border-[var(--border-hairline)] flex items-center gap-3 font-sans">
              {/* Mic Toggle with 150ms Icon Cross-fade */}
              <motion.button
                whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                type="button"
                onClick={handleToggleMic}
                className={`p-2.5 rounded-[var(--radius-button)] border transition-colors duration-[var(--dur-fast)] cursor-pointer ${
                  isMuted
                    ? "bg-[var(--bg-inset)] text-[var(--text-secondary)] border-[var(--border-focus)]"
                    : "bg-[var(--bg-overlay)] text-[var(--text-primary)] border-[var(--border-hairline)] hover:border-[var(--border-hover)]"
                }`}
                title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={isMuted ? "mic-off" : "mic-on"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center justify-center"
                  >
                    {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </motion.span>
                </AnimatePresence>
              </motion.button>

              {/* Video Toggle with 150ms Icon Cross-fade */}
              <motion.button
                whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }}
                type="button"
                onClick={handleToggleVideo}
                className={`p-2.5 rounded-[var(--radius-button)] border transition-colors duration-[var(--dur-fast)] cursor-pointer ${
                  isVideoOff
                    ? "bg-[var(--bg-inset)] text-[var(--text-secondary)] border-[var(--border-focus)]"
                    : "bg-[var(--bg-overlay)] text-[var(--text-primary)] border-[var(--border-hairline)] hover:border-[var(--border-hover)]"
                }`}
                title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={isVideoOff ? "video-off" : "video-on"}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-center justify-center"
                  >
                    {isVideoOff ? (
                      <VideoOff className="w-4 h-4" />
                    ) : (
                      <Video className="w-4 h-4" />
                    )}
                  </motion.span>
                </AnimatePresence>
              </motion.button>

              {/* Screen Share Toggle */}
              <button
                type="button"
                onClick={handleToggleScreenShare}
                className={`px-3.5 py-2 rounded-[var(--radius-button)] border text-xs font-mono flex items-center gap-2 transition-colors duration-[var(--dur-fast)] cursor-pointer ${
                  isScreenSharing
                    ? "bg-[var(--invert-bg)] text-[var(--invert-text)] border-[var(--invert-bg)]"
                    : "bg-[var(--bg-overlay)] text-[var(--text-primary)] border-[var(--border-hairline)] hover:border-[var(--border-hover)]"
                }`}
                title="Toggle Screen Share"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{isScreenSharing ? "Stop Sharing" : "Screen Share"}</span>
              </button>

              {/* Virtual Background Picker Toggle */}
              <button
                type="button"
                onClick={() => setIsBgPickerOpen(true)}
                className={`px-3.5 py-2 rounded-[var(--radius-button)] border text-xs font-mono flex items-center gap-2 transition-colors duration-[var(--dur-fast)] cursor-pointer ${
                  activeBackgroundId !== "none"
                    ? "bg-[var(--invert-bg)] text-[var(--invert-text)] border-[var(--invert-bg)]"
                    : "bg-[var(--bg-overlay)] text-[var(--text-primary)] border-[var(--border-hairline)] hover:border-[var(--border-hover)]"
                }`}
                title="Virtual Video Background & Blur"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {activeBackgroundId === "none"
                    ? "Background"
                    : activeBackgroundId === "blur"
                    ? "Blur"
                    : activeBackgroundId === "custom"
                    ? "Custom Bg"
                    : BACKGROUND_PRESETS.find((p) => p.id === activeBackgroundId)?.name || "Background"}
                </span>
                <span className="sm:hidden">Bg</span>
              </button>

              {/* In-Call Chat Toggle */}
              <button
                type="button"
                onClick={() => {
                  setActiveTab("chat");
                  setIsReferenceDeskOpen(true);
                }}
                className={`px-3.5 py-2 rounded-[var(--radius-button)] border text-xs font-mono flex items-center gap-2 transition-colors duration-[var(--dur-fast)] cursor-pointer ${
                  isReferenceDeskOpen && activeTab === "chat"
                    ? "bg-[var(--invert-bg)] text-[var(--invert-text)] border-[var(--invert-bg)]"
                    : "bg-[var(--bg-overlay)] text-[var(--text-primary)] border-[var(--border-hairline)] hover:border-[var(--border-hover)]"
                }`}
                title="Toggle In-Call Chat Panel"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat{inCallMessages.length > 0 ? ` (${inCallMessages.length})` : ""}</span>
              </button>

              {/* Study Notes Toggle */}
              <button
                type="button"
                onClick={() => {
                  if (isReferenceDeskOpen && activeTab !== "chat") {
                    setIsReferenceDeskOpen(false);
                  } else {
                    setActiveTab("notes");
                    setIsReferenceDeskOpen(true);
                  }
                }}
                className={`px-3.5 py-2 rounded-[var(--radius-button)] border text-xs font-mono flex items-center gap-2 transition-colors duration-[var(--dur-fast)] cursor-pointer ${
                  isReferenceDeskOpen && activeTab !== "chat"
                    ? "bg-[var(--invert-bg)] text-[var(--invert-text)] border-[var(--invert-bg)]"
                    : "bg-[var(--bg-overlay)] text-[var(--text-primary)] border-[var(--border-hairline)] hover:border-[var(--border-hover)]"
                }`}
                title="Toggle Study Notes Panel"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Study Notes</span>
              </button>

              <div className="w-[1px] h-6 bg-[var(--border-hairline)]" />

              {/* Leave Button: 250ms deliberate closing fade */}
              <button
                type="button"
                onClick={handleLeave}
                className="px-4 py-2 rounded-[var(--radius-button)] bg-[rgba(229,72,77,0.1)] hover:bg-[rgba(229,72,77,0.22)] border border-[rgba(229,72,77,0.35)] hover:border-[#e5484d] text-[#e5484d] text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Leave Meeting Room"
              >
                <PhoneOff className="w-3.5 h-3.5" /> Leave Call
              </button>
            </div>
          </div>
        </main>

        {/* Collapsible Reference Desk Side Panel (§6.3 Monochrome restyle) */}
        {isReferenceDeskOpen && (
          <aside className="w-96 md:w-[26rem] bg-[var(--bg-elevated)] text-[var(--text-primary)] border-l border-[var(--border-hairline)] flex flex-col shrink-0 z-30 font-sans">
            {/* Panel Header */}
            <div className="p-4 border-b border-[var(--border-hairline)] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {activeTab === "chat" ? (
                  <MessageSquare className="w-4 h-4 text-[var(--text-secondary)]" />
                ) : (
                  <BookOpen className="w-4 h-4 text-[var(--text-secondary)]" />
                )}
                <div>
                  <h3 className="font-serif text-base font-normal text-[var(--text-primary)]">
                    {activeTab === "chat" ? "In-Call Group Chat" : "Study Notes & Documents"}
                  </h3>
                  <p className="font-mono text-[0.625rem] uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                    {groupName} Materials
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReferenceDeskOpen(false)}
                className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-button)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs (§5 segmented layout transition) */}
            <div className="px-4 pt-3 flex gap-2 border-b border-[var(--border-hairline)] text-xs font-mono">
              {[
                { key: "chat", label: `Chat (${inCallMessages.length})` },
                { key: "manuscript", label: `Docs (${assets.length})` },
                { key: "notes", label: `Notes (${pinnedNotes.length})` },
                { key: "citations", label: "Citations" },
              ].map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key as typeof activeTab)}
                    className={`relative pb-2.5 px-2 transition-colors duration-[var(--dur-fast)] cursor-pointer ${
                      isActive
                        ? "text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeRoomNotesTab"
                        transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--text-primary)]"
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Panel Body */}
            <div className="flex-1 p-5 overflow-y-auto space-y-6">
              {activeTab === "chat" && (
                <div className="flex flex-col h-[calc(100vh-17rem)]">
                  {/* Chat Tab Header Bar with Export Button */}
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--border-hairline)] text-xs">
                    <span className="font-mono text-[0.625rem] uppercase tracking-wider text-[var(--text-secondary)]">
                      Live WebRTC Data Channel
                    </span>
                    <button
                      type="button"
                      onClick={handleDownloadConversation}
                      className="font-mono text-[0.6875rem] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Download in-call chat and session transcripts as Markdown (.md)"
                    >
                      {hasDownloadedConversation ? (
                        <>
                          <Check className="w-3 h-3 text-[var(--text-primary)]" />
                          <span className="text-[var(--text-primary)]">Exported!</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3 h-3" />
                          <span>Export .md</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {inCallMessages.length === 0 ? (
                      <div className="h-full min-h-[14rem] flex flex-col items-center justify-center text-center p-6 border border-dashed border-[var(--border-hairline)] rounded-[var(--radius-card)]">
                        <MessageSquare className="w-8 h-8 text-[var(--text-secondary)] opacity-40 mb-2" />
                        <span className="font-serif text-sm text-[var(--text-primary)]">In-Call Room Chat</span>
                        <p className="font-sans text-[0.6875rem] text-[var(--text-secondary)] mt-1 max-w-[200px] leading-relaxed">
                          Messages sent here are broadcast over WebRTC data channels to all connected participants.
                        </p>
                      </div>
                    ) : (
                      inCallMessages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`p-3 rounded-[var(--radius-card)] border text-xs ${
                            msg.isSelf
                              ? "bg-[var(--bg-overlay)] border-[var(--border-hover)] ml-4"
                              : "bg-[var(--bg-inset)] border-[var(--border-hairline)] mr-4"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-mono text-[0.625rem] font-semibold text-[var(--text-primary)]">
                              {msg.isSelf ? "You" : msg.senderName}
                            </span>
                            <span className="font-mono text-[0.5625rem] text-[var(--text-secondary)]">
                              {msg.time}
                            </span>
                          </div>
                          <p className="font-sans text-xs text-[var(--text-primary)] leading-relaxed break-words">
                            {msg.text}
                          </p>
                        </motion.div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleSendInCallMessage} className="pt-3 border-t border-[var(--border-hairline)] mt-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={inCallInput}
                        onChange={(e) => setInCallInput(e.target.value)}
                        placeholder="Type in-call message..."
                        className="flex-1 bg-[var(--bg-inset)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] px-3 py-2 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--text-primary)] transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={!inCallInput.trim()}
                        className="p-2 rounded-[var(--radius-button)] bg-[var(--invert-bg)] text-[var(--invert-text)] hover:bg-white disabled:opacity-30 transition-colors cursor-pointer"
                        title="Send Message"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === "manuscript" && (
                <div>
                  <div className="mb-4 pb-3 border-b border-[var(--border-hairline)]">
                    <span className="font-mono text-[0.625rem] font-medium uppercase tracking-[0.1em] text-[var(--text-secondary)]">
                      GROUP DOCUMENTS
                    </span>
                    <h4 className="font-serif text-lg font-normal text-[var(--text-primary)] mt-1">
                      {selectedAsset ? selectedAsset.title : "No Document Selected"}
                    </h4>
                  </div>

                  {assets.length === 0 ? (
                    <div className="p-6 bg-[var(--bg-inset)] border border-dashed border-[var(--border-hairline)] rounded-[var(--radius-card)] text-center text-xs text-[var(--text-secondary)]">
                      <p>No documents uploaded to this study group yet.</p>
                      <Link
                        href={`/lounges/${groupId}`}
                        className="text-[var(--text-primary)] hover:underline mt-2 inline-block font-mono"
                      >
                        Upload files in Group Workspace
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {assets.map((a) => (
                        <div
                          key={a.id}
                          onClick={() => setSelectedAsset(a)}
                          className={`p-3 rounded-[var(--radius-button)] border cursor-pointer transition-all ${
                            selectedAsset?.id === a.id
                              ? "bg-[var(--bg-overlay)] border-[var(--border-hover)]"
                              : "bg-[var(--bg-inset)] border-[var(--border-hairline)] hover:border-[var(--border-hover)]"
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-sans font-medium text-[var(--text-primary)] truncate max-w-[14rem]">
                              {a.title}
                            </span>
                            <span className="font-mono text-[0.6875rem] px-2 py-0.5 rounded-[var(--radius-button)] bg-[var(--bg-elevated)] border border-[var(--border-hairline)] text-[var(--text-secondary)]">
                              {a.fileType.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "notes" && (
                <div className="space-y-3">
                  <h4 className="font-serif text-sm font-normal text-[var(--text-primary)]">
                    Session Notes
                  </h4>
                  {pinnedNotes.length === 0 ? (
                    <div className="p-4 bg-[var(--bg-inset)] border border-dashed border-[var(--border-hairline)] rounded-[var(--radius-card)] text-center text-xs text-[var(--text-secondary)] font-mono">
                      No notes pinned yet. Use &ldquo;Pin to Notes&rdquo; on transcripts or add below.
                    </div>
                  ) : (
                    pinnedNotes.map((note, i) => (
                      <div
                        key={i}
                        className="p-3 bg-[var(--bg-inset)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] text-xs font-serif italic text-[var(--text-primary)] leading-relaxed"
                      >
                        &ldquo;{note}&rdquo;
                      </div>
                    ))
                  )}

                  {/* Add Note Form */}
                  <form onSubmit={handleAddMeetingNote} className="pt-2">
                    <input
                      type="text"
                      placeholder="+ Add a study note..."
                      value={newNoteInput}
                      onChange={(e) => setNewNoteInput(e.target.value)}
                      className="w-full bg-[var(--bg-inset)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] text-xs p-2.5 text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--border-focus)] transition-colors font-sans"
                    />
                  </form>
                </div>
              )}

              {activeTab === "citations" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif text-sm font-normal text-[var(--text-primary)]">
                      Meeting Citations
                    </h4>
                    {assets.length > 0 && (
                      <button
                        type="button"
                        onClick={handleCopyCitations}
                        className="font-mono text-xs text-[var(--text-primary)] hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {copiedCitations ? (
                          <>
                            <Check className="w-3 h-3" /> Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy All
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {assets.length === 0 ? (
                    <div className="p-4 bg-[var(--bg-inset)] border border-dashed border-[var(--border-hairline)] rounded-[var(--radius-card)] text-center text-xs text-[var(--text-secondary)] font-mono">
                      Citations generate automatically when study documents are uploaded.
                    </div>
                  ) : (
                    assets.map((a) => (
                      <div
                        key={a.id}
                        className="p-3 bg-[var(--bg-inset)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] text-xs"
                      >
                        <p className="font-serif italic text-[var(--text-primary)]">
                          &ldquo;{a.title}&rdquo;
                        </p>
                        <span className="font-mono text-[0.625rem] text-[var(--text-secondary)] mt-1 block">
                          StudyGroup+ Repository • {groupName}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Side Panel Footer Actions */}
            <div className="p-3 border-t border-[var(--border-hairline)] flex items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setActiveTab("notes")}
              >
                Add Note
              </Button>
              <Link
                href={`/lounges/${groupId}`}
                className="font-mono text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Back to Workspace
              </Link>
            </div>
          </aside>
        )}
      </div>
      {/* Virtual Photo Background Modal Dialog (Feature 1) */}
      <AnimatePresence>
        {isBgPickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop (§5: fades to --bg-primary at 60% opacity) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsBgPickerOpen(false)}
              className="absolute inset-0 bg-[var(--bg-primary)] backdrop-blur-sm cursor-pointer"
            />

            {/* Modal Box (§5: scale 0.96 -> 1 + fade, ease-out-expo) */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 w-full max-w-2xl bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[var(--radius-card)] shadow-2xl p-6 overflow-hidden flex flex-col max-h-[90vh] font-sans"
            >
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-[var(--border-hairline)]">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[var(--text-primary)]" />
                    <h3 className="font-serif text-lg font-normal text-[var(--text-primary)]">
                      Virtual Video Background
                    </h3>
                  </div>
                  <p className="font-sans text-xs text-[var(--text-secondary)] mt-1">
                    Select a background effect or upload a photo. Changes apply immediately to your video feed.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBgPickerOpen(false)}
                  className="p-1.5 rounded-[var(--radius-button)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-inset)] transition-colors cursor-pointer"
                  title="Close Background Picker"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Error Alert */}
              {bgError && (
                <div className="mt-4 p-3 rounded-[var(--radius-card)] bg-[var(--bg-inset)] border border-[var(--border-hairline)] text-xs text-[var(--text-secondary)] flex items-center gap-2 font-mono">
                  <AlertCircle className="w-4 h-4 text-[var(--text-primary)] shrink-0" />
                  <span>{bgError}</span>
                </div>
              )}

              {/* Camera Off Notice */}
              {isVideoOff && (
                <div className="mt-4 p-3 rounded-[var(--radius-card)] bg-[var(--bg-inset)] border border-[var(--border-hairline)] text-xs text-[var(--text-secondary)] flex items-center justify-between font-sans">
                  <span>Your camera is currently off. The selected background will activate when camera is turned on.</span>
                </div>
              )}

              {/* Options Grid */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto max-h-[50vh] pr-1 py-1">
                {/* Built-in Presets */}
                {BACKGROUND_PRESETS.map((preset) => {
                  const isSelected = activeBackgroundId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => applyBackground(preset.id)}
                      className={`relative group flex flex-col rounded-[var(--radius-card)] border overflow-hidden text-left transition-all duration-[var(--dur-fast)] cursor-pointer ${
                        isSelected
                          ? "border-[var(--text-primary)] ring-2 ring-[var(--text-primary)]/20"
                          : "border-[var(--border-hairline)] hover:border-[var(--border-hover)] hover:-translate-y-0.5"
                      }`}
                    >
                      <div className="w-full aspect-video bg-[var(--bg-inset)] relative flex items-center justify-center overflow-hidden">
                        {preset.type === "none" && (
                          <div className="flex flex-col items-center justify-center">
                            <Ban className="w-6 h-6 text-[var(--text-secondary)] opacity-50 mb-1" />
                            <span className="font-mono text-[0.625rem] text-[var(--text-secondary)]">No Effect</span>
                          </div>
                        )}

                        {preset.type === "blur" && (
                          <div className="w-full h-full bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center relative">
                            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center">
                              <Sparkles className="w-4 h-4 text-white/90" />
                            </div>
                          </div>
                        )}

                        {preset.type === "image" && preset.src && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={preset.src}
                            alt={preset.name}
                            className="w-full h-full object-cover"
                          />
                        )}

                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--invert-bg)] text-[var(--invert-text)] flex items-center justify-center shadow-md">
                            <Check className="w-3 h-3 stroke-[2.5]" />
                          </div>
                        )}
                      </div>

                      <div className="p-2.5 bg-[var(--bg-elevated)] border-t border-[var(--border-hairline)] flex-1 flex flex-col justify-between">
                        <div className="font-sans text-xs font-medium text-[var(--text-primary)]">
                          {preset.name}
                        </div>
                        <div className="font-mono text-[0.625rem] text-[var(--text-secondary)] truncate mt-0.5">
                          {preset.description}
                        </div>
                      </div>
                    </button>
                  );
                })}

                {/* Custom Photo Upload Card */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative group flex flex-col rounded-[var(--radius-card)] border overflow-hidden text-left transition-all duration-[var(--dur-fast)] cursor-pointer ${
                    activeBackgroundId === "custom"
                      ? "border-[var(--text-primary)] ring-2 ring-[var(--text-primary)]/20"
                      : "border-[var(--border-hairline)] hover:border-[var(--border-hover)] hover:-translate-y-0.5"
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleCustomFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="w-full aspect-video bg-[var(--bg-inset)] relative flex items-center justify-center overflow-hidden">
                    {customBgUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={customBgUrl}
                        alt="Custom Background"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-3 text-center">
                        <Upload className="w-5 h-5 text-[var(--text-secondary)] opacity-60 mb-1" />
                        <span className="font-mono text-[0.625rem] text-[var(--text-secondary)]">
                          Upload Photo
                        </span>
                      </div>
                    )}

                    {activeBackgroundId === "custom" && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--invert-bg)] text-[var(--invert-text)] flex items-center justify-center shadow-md">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </div>
                    )}
                  </div>

                  <div className="p-2.5 bg-[var(--bg-elevated)] border-t border-[var(--border-hairline)] flex-1 flex flex-col justify-between">
                    <div className="font-sans text-xs font-medium text-[var(--text-primary)] flex items-center justify-between">
                      <span>{customBgUrl ? "Custom Photo" : "Upload Custom"}</span>
                      <span className="font-mono text-[0.5625rem] text-[var(--text-secondary)]">PNG/JPG</span>
                    </div>
                    <div className="font-mono text-[0.625rem] text-[var(--text-secondary)] truncate mt-0.5">
                      {customBgUrl ? "Click to change photo" : "Choose your own file"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="mt-4 pt-4 border-t border-[var(--border-hairline)] flex items-center justify-between">
                <span className="font-mono text-[0.6875rem] text-[var(--text-secondary)]">
                  {isApplyingBg ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-primary)] animate-ping" />
                      Applying background effect...
                    </span>
                  ) : (
                    `Active: ${
                      activeBackgroundId === "none"
                        ? "Standard Camera"
                        : activeBackgroundId === "blur"
                        ? "Background Blur"
                        : activeBackgroundId === "custom"
                        ? "Custom Photo"
                        : BACKGROUND_PRESETS.find((p) => p.id === activeBackgroundId)?.name || "Preset"
                    }`
                  )}
                </span>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsBgPickerOpen(false)}
                  className="text-xs"
                >
                  Done
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
