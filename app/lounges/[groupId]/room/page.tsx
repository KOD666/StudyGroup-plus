"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
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
  Radio,
} from "lucide-react";
import {
  Room,
  RoomEvent,
  Track,
  RemoteParticipant,
  RemoteTrackPublication,
  ParticipantEvent,
} from "livekit-client";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface Asset {
  id: string;
  title: string;
  fileType: string;
  sizeBytes: number;
  canAccess: boolean;
}

/**
 * Remote Participant Video Tile
 * Automatically attaches remote camera or screen share video tracks to the DOM
 */
function RemoteParticipantTile({
  participant,
  isMainSpeaker = false,
}: {
  participant: RemoteParticipant;
  isMainSpeaker?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const participantName = participant.name || participant.identity || "Study Member";
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
    participant.on(ParticipantEvent.TrackUnsubscribed, syncTracks);
    participant.on(ParticipantEvent.TrackMuted, syncTracks);
    participant.on(ParticipantEvent.TrackUnmuted, syncTracks);
    participant.on(ParticipantEvent.IsSpeakingChanged, onSpeakingChange);

    return () => {
      participant.off(ParticipantEvent.TrackSubscribed, syncTracks);
      participant.off(ParticipantEvent.TrackUnsubscribed, syncTracks);
      participant.off(ParticipantEvent.TrackMuted, syncTracks);
      participant.off(ParticipantEvent.TrackUnmuted, syncTracks);
      participant.off(ParticipantEvent.IsSpeakingChanged, onSpeakingChange);
    };
  }, [participant]);

  return (
    <div
      className={`relative overflow-hidden rounded-[0.25rem] border transition-all duration-200 bg-[#211f1e] flex flex-col justify-end ${
        isSpeaking ? "border-[#ba5d1a] ring-1 ring-[#ba5d1a]" : "border-[#32302f]"
      } ${isMainSpeaker ? "w-full h-full" : "min-h-[9rem] flex-1 p-3"}`}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`absolute inset-0 w-full h-full object-cover ${hasVideo ? "block" : "hidden"}`}
      />

      {/* Fallback Avatar when Video Off */}
      {!hasVideo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#242220] p-4 text-center">
          <div
            className={`rounded-full bg-[#2d2a28] border border-[#554339] flex items-center justify-center font-serif font-bold text-[#faf9f6] ${
              isMainSpeaker ? "w-24 h-24 text-3xl mb-3" : "w-12 h-12 text-base mb-1.5"
            }`}
          >
            {initials}
          </div>
          <span className="font-sans font-medium text-xs text-[#faf9f6] truncate max-w-xs">
            {participantName}
          </span>
          <span className="font-sans text-[0.625rem] text-[#78746d]">
            {isSpeaking ? "Speaking" : "Camera off"}
          </span>
        </div>
      )}

      {/* Gradient Overlay for Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

      {/* Tag Overlay */}
      <div className="relative z-10 flex items-center justify-between p-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-sans font-medium text-[#faf9f6] truncate max-w-[10rem]">
            {participantName}
          </span>
          {isSpeaking && (
            <span className="flex items-center gap-1 text-[0.625rem] text-[#ba5d1a] font-semibold uppercase">
              <Radio className="w-2.5 h-2.5 animate-pulse" /> Speaking
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {isMuted ? (
            <div className="p-1 rounded bg-black/60 text-[#ba1a1a]" title="Muted">
              <MicOff className="w-3.5 h-3.5" />
            </div>
          ) : (
            <div className="p-1 rounded bg-black/60 text-[#c4e8d8]" title="Audio Active">
              <Volume2 className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MeetingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const groupId = params.groupId as string;

  // Media & Room state
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [roomMode, setRoomMode] = useState<"discussion" | "quiet">("discussion");
  const [isReferenceDeskOpen, setIsReferenceDeskOpen] = useState(false);
  const [callDuration, setCallDuration] = useState("00:00:00");
  const [groupName, setGroupName] = useState<string>("Study Group");
  const [groupCode, setGroupCode] = useState<string>("");

  // Real data state
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [pinnedNotes, setPinnedNotes] = useState<string[]>([]);
  const [newNoteInput, setNewNoteInput] = useState("");
  const [activeTab, setActiveTab] = useState<"manuscript" | "notes" | "citations">("manuscript");
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCitations, setCopiedCitations] = useState(false);

  // Live transcript state
  const [transcript, setTranscript] = useState<string | null>(null);
  const [transcriptTime, setTranscriptTime] = useState<string>("");

  // LiveKit Room reference & Participants
  const roomRef = useRef<Room | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const stageVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContainerRef = useRef<HTMLDivElement>(null);
  const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipant[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionMessage, setConnectionMessage] = useState("Connecting to live room...");

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

  // Connect to LiveKit Room and initialize local media
  const connectLiveKit = useCallback(async () => {
    // 1. Acquire local user media (camera & mic) so user can see themselves immediately and controls work reliably
    try {
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        });
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

    try {
      setConnectionMessage("Joining live meeting room...");
      const tokenRes = await fetch("/api/livekit/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId }),
      });

      if (!tokenRes.ok) {
        throw new Error("Unable to obtain live room token");
      }

      const tokenData = await tokenRes.json();
      const token = tokenData.token;
      const wsUrl = tokenData.url || tokenData.livekitUrl;
      setConnectionMessage("Connecting to audio and video...");

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });
      roomRef.current = room;

      // Update participant lists on connection events
      const updateParticipants = () => {
        setRemoteParticipants(Array.from(room.remoteParticipants.values()));
      };

      room.on(RoomEvent.ParticipantConnected, updateParticipants);
      room.on(RoomEvent.ParticipantDisconnected, (participant) => {
        // Clean up audio elements attached for this participant
        const audios = audioContainerRef.current?.querySelectorAll(
          `[id^="audio-${participant.identity}"]`
        );
        audios?.forEach((el) => el.remove());
        updateParticipants();
      });

      // Handle Tracks Subscribed (Audio transport & video state)
      room.on(
        RoomEvent.TrackSubscribed,
        (track: Track, _pub: RemoteTrackPublication, participant: RemoteParticipant) => {
          if (track.kind === Track.Kind.Audio) {
            const el = track.attach();
            el.id = `audio-${participant.identity}-${track.sid}`;
            audioContainerRef.current?.appendChild(el);
          }
          updateParticipants();
        }
      );

      // Handle Tracks Unsubscribed
      room.on(RoomEvent.TrackUnsubscribed, (track: Track) => {
        if (track.kind === Track.Kind.Audio) {
          track.detach().forEach((el) => el.remove());
        }
        updateParticipants();
      });

      room.on(RoomEvent.TrackMuted, updateParticipants);
      room.on(RoomEvent.TrackUnmuted, updateParticipants);

      // Handle Data Received (Chat & Transcripts)
      room.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
        try {
          const text = new TextDecoder().decode(payload);
          const data = JSON.parse(text);
          if (data.type === "transcript") {
            setTranscript(data.text);
            const now = new Date();
            setTranscriptTime(
              now.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })
            );
          }
        } catch {
          // ignore non-json data
        }
      });

      // Attempt room connection
      if (wsUrl && token) {
        await room.connect(wsUrl, token);
        setIsConnected(true);
        setConnectionMessage("Connected to meeting");
        updateParticipants();

        // Enable local microphone and camera in LiveKit
        try {
          await room.localParticipant.enableCameraAndMicrophone();
          const camTrack = room.localParticipant.getTrackPublication(Track.Source.Camera);
          if (camTrack?.track) {
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
      }
    } catch (err: unknown) {
      console.warn("LiveKit connection notice:", err);
      setConnectionMessage("Meeting active (Local media enabled)");
      setIsConnected(true);
    }
  }, [groupId]);

  useEffect(() => {
    connectLiveKit();
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [connectLiveKit]);

  // Duration Timer (from 00:00:00)
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
      const hrs = String(Math.floor(elapsedSec / 3600)).padStart(2, "0");
      const mins = String(Math.floor((elapsedSec % 3600) / 60)).padStart(2, "0");
      const secs = String(elapsedSec % 60).padStart(2, "0");
      setCallDuration(`${hrs}:${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  async function handleToggleMic() {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    // 1. Toggle hardware audio tracks directly
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }

    // 2. Toggle LiveKit microphone if connected
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

    // 1. Toggle hardware video tracks directly
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !nextVideoOff;
      });

      // If turning video back on and video track was absent or stopped, reacquire
      if (!nextVideoOff && localStreamRef.current.getVideoTracks().length === 0) {
        try {
          const vStream = await navigator.mediaDevices.getUserMedia({ video: true });
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
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: !isMuted });
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

    // 2. Toggle LiveKit camera track if connected
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
      await roomRef.current.localParticipant.setScreenShareEnabled(nextScreenSharing);
      setIsScreenSharing(nextScreenSharing);
    } catch (err) {
      console.warn("Failed to toggle screen share:", err);
      setIsScreenSharing(false);
    }
  }

  function handleLeave() {
    if (roomRef.current) {
      roomRef.current.disconnect();
    }
    router.push(`/lounges/${groupId}`);
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

  return (
    <div className="h-screen w-screen bg-[#171615] text-[#fdf8f6] flex flex-col font-sans overflow-hidden select-none">
      {/* Hidden Audio Container for LiveKit remote tracks */}
      <div ref={audioContainerRef} className="hidden" aria-hidden="true" />

      {/* Top Header Bar */}
      <header className="h-14 border-b border-[#32302f] bg-[#1c1b1a] px-4 sm:px-6 flex items-center justify-between gap-4 shrink-0 z-20">
        {/* Brand & Room Breadcrumb */}
        <div className="flex items-center gap-3">
          <Link
            href="/lounges"
            className="font-serif text-lg font-bold text-[#faf9f6] flex items-baseline hover:opacity-90 transition-opacity duration-150"
          >
            StudyGroup<span className="text-[#ba5d1a] font-normal">+</span>
          </Link>
          <span className="text-[#554339]">/</span>
          <Link
            href={`/lounges/${groupId}`}
            className="font-sans text-xs uppercase tracking-[0.08em] text-[#78746d] hover:text-[#faf9f6] transition-colors hidden sm:inline"
          >
            {groupName}
          </Link>
          <span className="text-[#554339] hidden sm:inline">/</span>
          <span className="font-sans text-xs text-[#e6e2df] font-medium truncate max-w-xs">
            Live Room
          </span>
          <Badge
            variant="forest"
            dot
            className="bg-[#234338]/60 text-[#c4e8d8] border-[#234338]"
            title={connectionMessage}
          >
            {isConnected ? "Live" : "Connecting..."}
          </Badge>
        </div>

        {/* Center: Mode Switcher & Timer */}
        <div className="hidden md:flex items-center gap-4">
          <div className="p-1 bg-[#242220] border border-[#3e3b38] rounded-[0.25rem] flex items-center gap-1 text-xs">
            <button
              type="button"
              onClick={() => setRoomMode("quiet")}
              className={`px-3 py-1 rounded-[0.125rem] transition-colors duration-150 ${
                roomMode === "quiet"
                  ? "bg-[#234338] text-[#ffffff] font-medium"
                  : "text-[#78746d] hover:text-[#faf9f6]"
              }`}
            >
              Silent Study
            </button>
            <button
              type="button"
              onClick={() => setRoomMode("discussion")}
              className={`px-3 py-1 rounded-[0.125rem] transition-colors duration-150 ${
                roomMode === "discussion"
                  ? "bg-[#ba5d1a] text-[#ffffff] font-medium"
                  : "text-[#78746d] hover:text-[#faf9f6]"
              }`}
            >
              Discussion
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono text-[#e6e2df] bg-[#242220] px-2.5 py-1 rounded-[0.125rem] border border-[#3e3b38]">
            <Clock className="w-3.5 h-3.5 text-[#ba5d1a]" />
            <span>{callDuration}</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant={isReferenceDeskOpen ? "primary" : "secondary"}
            size="sm"
            icon={<BookOpen className="w-3.5 h-3.5" />}
            onClick={() => setIsReferenceDeskOpen(!isReferenceDeskOpen)}
            className="text-xs"
          >
            Study Notes <span className="ml-1 px-1.5 py-0.2 rounded bg-black/20 text-[0.625rem]">{assets.length}</span>
          </Button>

          <div className="w-8 h-8 rounded-[0.25rem] bg-[#2d2a28] border border-[#3e3b38] flex items-center justify-center font-serif text-xs font-bold text-[#faf9f6]">
            {scholarInitials}
          </div>
        </div>
      </header>

      {/* Main Content Area: Stage + Side Panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Stage Grid */}
        <main className="flex-1 p-4 lg:p-6 flex flex-col justify-between overflow-hidden relative">
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch overflow-hidden">
            {/* Left Large Speaker / Stage Tile */}
            <div className="lg:col-span-8 bg-[#211f1e] rounded-[0.25rem] border border-[#32302f] relative overflow-hidden flex flex-col justify-between">
              {remoteParticipants.length > 0 && remoteParticipants[0] ? (
                /* Primary Remote Participant on Stage */
                <RemoteParticipantTile participant={remoteParticipants[0]} isMainSpeaker={true} />
              ) : (
                /* Single User / Stage View */
                <div className="absolute inset-0 bg-[#1e1c1b] flex flex-col items-center justify-center overflow-hidden">
                  {/* Stage Video element when local video is active */}
                  <video
                    ref={stageVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`absolute inset-0 w-full h-full object-cover ${isVideoOff ? "hidden" : "block"}`}
                  />

                  {/* Fallback Display when Camera Off */}
                  {isVideoOff && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#282523]">
                      <div className="relative w-28 h-28 rounded-full bg-[#3a3532] border-2 border-[#554339] flex items-center justify-center font-serif text-3xl text-[#dcc1b4] mb-4 shadow-paper-floating">
                        {scholarInitials}
                        <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-[#ba1a1a] ring-2 ring-[#282523]" title="Camera Off" />
                      </div>

                      <h3 className="font-serif text-2xl text-[#faf9f6] mb-1">
                        {user?.fullName || "You"}
                      </h3>
                      <p className="font-sans text-xs text-[#78746d] max-w-sm mb-6 leading-relaxed">
                        Your camera is currently muted. Turn it on with the tray button below, or invite study peers to this lounge.
                      </p>
                    </div>
                  )}

                  {/* Top Stage Badges */}
                  <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-[0.25rem] bg-black/60 backdrop-blur-sm border border-white/10 text-xs font-sans text-[#faf9f6] flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${isVideoOff ? "bg-[#78746d]" : "bg-[#234338]"}`} />
                      {user?.fullName || "You"} (Stage)
                    </span>
                    {isMuted && (
                      <span className="px-2.5 py-1 rounded-[0.25rem] bg-[#ba1a1a]/80 text-white text-xs font-sans flex items-center gap-1">
                        <MicOff className="w-3 h-3" /> Muted
                      </span>
                    )}
                  </div>

                  {/* Bottom Invite Floating Bar */}
                  <div className="absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
                    <div className="pointer-events-auto bg-[#171615]/85 backdrop-blur-md px-4 py-2 rounded-[0.25rem] border border-white/10 flex items-center gap-3">
                      <span className="font-sans text-xs text-[#ddd8cc] hidden sm:inline">
                        Waiting for members to join
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyInviteLink}
                        className="px-3 py-1 bg-[#ba5d1a] hover:bg-[#a24e14] text-white text-xs font-medium rounded-[0.25rem] flex items-center gap-1.5 transition-colors"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="w-3 h-3 text-[#234338]" /> Link Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy Invite Link
                          </>
                        )}
                      </button>
                      {groupCode && (
                        <span className="font-mono text-xs text-[#ffb68c] hidden md:inline">
                          #{groupCode}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Live Transcript Panel if Available */}
              {transcript && (
                <div className="relative z-20 m-4 p-4 rounded-[0.25rem] bg-[#171615]/90 backdrop-blur-md border border-[#3e3b38] max-w-2xl shadow-paper-floating">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#ba5d1a]" />
                      <span className="font-sans text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-[#78746d]">
                        Live Transcript • {transcriptTime}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (transcript && !pinnedNotes.includes(transcript)) {
                          setPinnedNotes((prev) => [transcript, ...prev]);
                        }
                      }}
                      className="font-sans text-[0.6875rem] text-[#ba5d1a] hover:text-[#ffb68c] transition-colors duration-150 flex items-center gap-1 font-medium"
                    >
                      <Pin className="w-3 h-3" /> Pin to Notes
                    </button>
                  </div>
                  <p className="font-editorial italic text-sm sm:text-base leading-relaxed text-[#faf9f6]">
                    &ldquo;{transcript}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* Right Column: Local User + Additional Remote Participants */}
            <div className="lg:col-span-4 flex flex-col gap-4 justify-between overflow-y-auto">
              {/* Local Participant Feed */}
              <div className="flex-1 min-h-[9rem] bg-[#211f1e] rounded-[0.25rem] border border-[#32302f] relative overflow-hidden flex flex-col justify-end p-3 group hover:border-[#554339] transition-colors duration-150">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute inset-0 w-full h-full object-cover ${isVideoOff ? "hidden" : "block"}`}
                />

                {isVideoOff && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#242220]">
                    <div className="w-12 h-12 rounded-full bg-[#2d2a28] border border-[#554339] flex items-center justify-center font-serif font-bold text-sm text-[#faf9f6]">
                      {scholarInitials}
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />

                <div className="relative z-20 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-sans font-medium text-[#faf9f6] block">
                      {user?.fullName || "You"} (You)
                    </span>
                    <span className="font-editorial italic text-[0.6875rem] text-[#ddd8cc]/70">
                      {isScreenSharing ? "Sharing Screen" : "Member"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {isMuted ? (
                      <div className="p-1 rounded bg-black/60 text-[#ba1a1a]" title="Microphone muted">
                        <MicOff className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="p-1 rounded bg-black/60 text-[#c4e8d8]" title="Microphone active">
                        <Mic className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Remote Participants */}
              {remoteParticipants.slice(1).map((participant) => (
                <RemoteParticipantTile key={participant.identity} participant={participant} />
              ))}

              {/* If only local user, show Waiting Status tile */}
              {remoteParticipants.length === 0 && (
                <div className="flex-1 min-h-[9rem] bg-[#1c1b1a] rounded-[0.25rem] border border-dashed border-[#32302f] flex flex-col items-center justify-center p-4 text-center">
                  <Users className="w-6 h-6 text-[#78746d] mb-2 opacity-50" />
                  <span className="font-sans text-xs text-[#faf9f6] font-medium mb-1">
                    Room Ready
                  </span>
                  <span className="font-sans text-[0.6875rem] text-[#78746d] max-w-xs leading-relaxed">
                    1 participant connected. Share invite link to add others.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Floating Bottom Media Control Bar */}
          <div className="pt-4 flex justify-center z-30">
            <div className="px-5 py-2.5 rounded-[0.25rem] bg-[#1c1b1a] border border-[#32302f] shadow-paper-floating flex items-center gap-3 font-sans">
              <button
                type="button"
                onClick={handleToggleMic}
                className={`p-2.5 rounded-[0.25rem] border transition-colors duration-150 ${
                  isMuted
                    ? "bg-[#ffdad6]/10 text-[#ba1a1a] border-[#ba1a1a]"
                    : "bg-[#282624] text-[#faf9f6] border-[#3e3b38] hover:bg-[#32302f]"
                }`}
                title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleToggleVideo}
                className={`p-2.5 rounded-[0.25rem] border transition-colors duration-150 ${
                  isVideoOff
                    ? "bg-[#ffdad6]/10 text-[#ba1a1a] border-[#ba1a1a]"
                    : "bg-[#282624] text-[#faf9f6] border-[#3e3b38] hover:bg-[#32302f]"
                }`}
                title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
              >
                {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={handleToggleScreenShare}
                className={`px-3.5 py-2 rounded-[0.25rem] border text-xs font-medium flex items-center gap-2 transition-colors duration-150 ${
                  isScreenSharing
                    ? "bg-[#ba5d1a] text-[#ffffff] border-[#ba5d1a]"
                    : "bg-[#282624] text-[#faf9f6] border-[#3e3b38] hover:bg-[#32302f]"
                }`}
                title="Toggle Screen Share"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{isScreenSharing ? "Stop Sharing" : "Screen Share"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsReferenceDeskOpen(!isReferenceDeskOpen)}
                className={`px-3.5 py-2 rounded-[0.25rem] border text-xs font-medium flex items-center gap-2 transition-colors duration-150 ${
                  isReferenceDeskOpen
                    ? "bg-[#ba5d1a] text-[#ffffff] border-[#ba5d1a]"
                    : "bg-[#282624] text-[#faf9f6] border-[#3e3b38] hover:bg-[#32302f]"
                }`}
                title="Toggle Study Notes Panel"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Study Notes</span>
              </button>

              <div className="w-[1px] h-6 bg-[#32302f]" />

              <button
                type="button"
                onClick={handleLeave}
                className="px-4 py-2 rounded-[0.25rem] bg-[#ba1a1a] hover:bg-[#93000a] text-[#ffffff] text-xs font-semibold flex items-center gap-1.5 transition-colors duration-150"
                title="Leave Meeting Room"
              >
                <PhoneOff className="w-3.5 h-3.5" /> Leave
              </button>
            </div>
          </div>
        </main>

        {/* Collapsible Reference Desk Side Panel */}
        {isReferenceDeskOpen && (
          <aside className="w-96 md:w-[26rem] bg-[#faf9f6] text-[#171615] border-l border-[#e5e2d9] flex flex-col shrink-0 z-30 font-sans shadow-paper-floating">
            {/* Panel Header */}
            <div className="p-4 bg-[#f4f2eb] border-b border-[#e5e2d9] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#ba5d1a]" />
                <div>
                  <h3 className="font-serif text-base font-normal text-[#171615]">
                    Study Notes &amp; Documents
                  </h3>
                  <p className="font-sans text-[0.625rem] uppercase tracking-[0.08em] text-[#78746d]">
                    {groupName} Materials
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReferenceDeskOpen(false)}
                className="p-1 text-[#78746d] hover:text-[#171615] rounded transition-colors duration-150"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-4 pt-2 flex gap-4 border-b border-[#e5e2d9] text-xs font-semibold uppercase tracking-[0.08em]">
              <button
                type="button"
                onClick={() => setActiveTab("manuscript")}
                className={`pb-2 border-b-2 transition-colors duration-150 ${
                  activeTab === "manuscript"
                    ? "border-[#ba5d1a] text-[#ba5d1a]"
                    : "border-transparent text-[#78746d] hover:text-[#171615]"
                }`}
              >
                Documents ({assets.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("notes")}
                className={`pb-2 border-b-2 transition-colors duration-150 ${
                  activeTab === "notes"
                    ? "border-[#ba5d1a] text-[#ba5d1a]"
                    : "border-transparent text-[#78746d] hover:text-[#171615]"
                }`}
              >
                Notes ({pinnedNotes.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("citations")}
                className={`pb-2 border-b-2 transition-colors duration-150 ${
                  activeTab === "citations"
                    ? "border-[#ba5d1a] text-[#ba5d1a]"
                    : "border-transparent text-[#78746d] hover:text-[#171615]"
                }`}
              >
                Citations
              </button>
            </div>

            {/* Panel Body */}
            <div className="flex-1 p-5 overflow-y-auto space-y-6">
              {activeTab === "manuscript" && (
                <div>
                  <div className="mb-4 pb-3 border-b border-[#e5e2d9]">
                    <span className="font-sans text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-[#78746d]">
                      GROUP DOCUMENTS
                    </span>
                    <h4 className="font-serif text-lg font-normal text-[#171615] mt-1">
                      {selectedAsset ? selectedAsset.title : "No Document Selected"}
                    </h4>
                  </div>

                  {assets.length === 0 ? (
                    <div className="p-6 bg-[#ffffff] border border-dashed border-[#ddd8cc] rounded text-center text-xs text-[#78746d]">
                      <p>No documents uploaded to this study group yet.</p>
                      <Link href={`/lounges/${groupId}`} className="text-[#ba5d1a] hover:underline mt-2 inline-block">
                        Upload files in Group Workspace
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {assets.map((a) => (
                        <div
                          key={a.id}
                          onClick={() => setSelectedAsset(a)}
                          className={`p-3 rounded-[0.25rem] border cursor-pointer transition-all ${
                            selectedAsset?.id === a.id
                              ? "bg-[#fff9f6] border-[#ba5d1a]"
                              : "bg-[#ffffff] border-[#e5e2d9] hover:border-[#ddd8cc]"
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-[#171615] truncate max-w-[14rem]">
                              {a.title}
                            </span>
                            <Badge variant={a.fileType === "pdf" ? "forest" : "ochre"}>
                              {a.fileType.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === "notes" && (
                <div className="space-y-3">
                  <h4 className="font-serif text-sm text-[#171615]">Session Notes</h4>
                  {pinnedNotes.length === 0 ? (
                    <div className="p-4 bg-[#ffffff] border border-dashed border-[#ddd8cc] rounded text-center text-xs text-[#78746d]">
                      No notes taken during this session yet. Use the form below to record notes.
                    </div>
                  ) : (
                    pinnedNotes.map((note, i) => (
                      <div
                        key={i}
                        className="p-3 bg-[#ffffff] border border-[#e5e2d9] rounded text-xs font-editorial italic text-[#171615]"
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
                      className="w-full bg-[#ffffff] border border-dashed border-[#ddd8cc] rounded-[0.25rem] text-xs p-2.5 text-[#171615] placeholder:text-[#78746d] outline-none focus:border-[#ba5d1a] transition-colors"
                    />
                  </form>
                </div>
              )}

              {activeTab === "citations" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-serif text-sm text-[#171615]">Meeting Citations</h4>
                    {assets.length > 0 && (
                      <button
                        type="button"
                        onClick={handleCopyCitations}
                        className="text-xs text-[#ba5d1a] hover:text-[#a24e14] flex items-center gap-1"
                      >
                        {copiedCitations ? (
                          <>
                            <Check className="w-3 h-3 text-[#234338]" /> Copied!
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
                    <div className="p-4 bg-[#ffffff] border border-dashed border-[#ddd8cc] rounded text-center text-xs text-[#78746d]">
                      Citations will be generated automatically when study documents are uploaded.
                    </div>
                  ) : (
                    assets.map((a) => (
                      <div key={a.id} className="p-3 bg-[#ffffff] border border-[#e5e2d9] rounded text-xs">
                        <p className="font-editorial italic text-[#171615]">
                          &ldquo;{a.title}&rdquo;
                        </p>
                        <span className="font-sans text-[0.625rem] text-[#78746d] mt-1 block">
                          StudyGroup+ Repository • {groupName}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Side Panel Footer Actions */}
            <div className="p-3 bg-[#f4f2eb] border-t border-[#e5e2d9] flex items-center justify-between">
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
                className="text-xs text-[#78746d] hover:text-[#171615] transition-colors"
              >
                Back to Workspace
              </Link>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
