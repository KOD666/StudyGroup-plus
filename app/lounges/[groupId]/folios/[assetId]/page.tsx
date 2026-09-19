"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  ZoomIn,
  ZoomOut,
  Download,
  Copy,
  Share2,
  Settings,
  AlertCircle,
  SidebarClose,
  SidebarOpen,
  FileText,
  Presentation,
  Check,
  ArrowLeft,
  Highlighter,
  Maximize2,
  Minimize2,
  Trash2,
  Plus,
  X,
  Play,
  Pause,
  RotateCcw,
  Timer,
  HelpCircle,
  ListPlus,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Coffee,
  Flame,
  CheckSquare,
} from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export interface HighlightItem {
  id: string;
  text: string;
  color: "yellow" | "green" | "rose" | "ochre";
  pageNumber?: string;
  note?: string;
  author: string;
  createdAt: string;
}

interface AssetData {
  id: string;
  groupId: string;
  uploaderId: string;
  title: string;
  fileType: "pdf" | "md" | "pptx" | "transcript";
  sizeBytes: number;
  r2Key: string;
  mimeType: string | null;
  createdAt: string;
}

interface MarginalNote {
  id: string;
  author: string;
  authorInitials: string;
  timeAgo: string;
  text: string;
}

export type TodoType = "question" | "reading" | "task";

export interface ChecklistItem {
  id: string;
  title: string;
  type?: TodoType;
  completed: boolean;
  assignee: string;
  answerNote?: string;
  createdAt?: string;
  completedAt?: string;
}

/**
 * Lightweight Markdown Parser and Renderer
 * Parses headings (#, ##, ###), blockquotes (>), lists (- / *), code blocks (```), bold/italic, and paragraphs.
 */
function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let paragraphBuffer: string[] = [];
  let isFirstParagraph = true;

  function flushParagraph() {
    if (paragraphBuffer.length === 0) return;
    const text = paragraphBuffer.join(" ").trim();
    paragraphBuffer = [];
    if (!text) return;

    if (isFirstParagraph) {
      isFirstParagraph = false;
      const firstChar = text.charAt(0);
      const rest = text.slice(1);
      elements.push(
        <p key={elements.length} className="font-editorial text-base sm:text-lg leading-[1.85] text-[#171615]">
          <span className="float-left text-5xl font-serif pr-3 pt-1 text-[#171615] leading-none font-bold">
            {firstChar}
          </span>
          {renderInlineFormatting(rest)}
        </p>
      );
    } else {
      elements.push(
        <p key={elements.length} className="font-editorial text-base sm:text-lg leading-[1.85] text-[#171615]">
          {renderInlineFormatting(text)}
        </p>
      );
    }
  }

  function flushCodeBlock() {
    if (codeBlockContent.length === 0) return;
    const code = codeBlockContent.join("\n");
    codeBlockContent = [];
    elements.push(
      <pre
        key={elements.length}
        className="p-4 bg-[#171615] text-[#faf9f6] rounded-[0.25rem] font-mono text-xs overflow-x-auto my-4 border border-[#32302f]"
      >
        <code>{code}</code>
      </pre>
    );
  }

  function renderInlineFormatting(raw: string): React.ReactNode {
    // Process bold **text** and italic *text*
    const parts = raw.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="font-bold text-[#171615]">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return <em key={i} className="italic">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const trimmed = line.trim();

    // Code block fences
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        inCodeBlock = false;
        flushCodeBlock();
      } else {
        flushParagraph();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Empty lines indicate paragraph breaks
    if (!trimmed) {
      flushParagraph();
      continue;
    }

    // Headings
    if (trimmed.startsWith("### ")) {
      flushParagraph();
      elements.push(
        <h3 key={elements.length} className="font-serif text-xl font-medium text-[#171615] mt-6 mb-2">
          {trimmed.replace(/^###\s+/, "")}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushParagraph();
      elements.push(
        <h2 key={elements.length} className="font-serif text-2xl font-normal text-[#171615] mt-8 mb-3 pb-2 border-b border-[#e5e2d9]">
          {trimmed.replace(/^##\s+/, "")}
        </h2>
      );
      continue;
    }
    if (trimmed.startsWith("# ")) {
      flushParagraph();
      elements.push(
        <h1 key={elements.length} className="font-serif text-3xl sm:text-4xl font-normal text-[#171615] mt-6 mb-4">
          {trimmed.replace(/^#\s+/, "")}
        </h1>
      );
      continue;
    }

    // Blockquote
    if (trimmed.startsWith("> ")) {
      flushParagraph();
      elements.push(
        <blockquote
          key={elements.length}
          className="p-4 bg-[#fff2eb] border-l-2 border-[#ba5d1a] border-y border-r border-[#ffdbc9] rounded-[0.25rem] font-editorial italic text-base sm:text-lg text-[#554339] my-4"
        >
          {renderInlineFormatting(trimmed.replace(/^>\s+/, ""))}
        </blockquote>
      );
      continue;
    }

    // Unordered list
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      flushParagraph();
      elements.push(
        <li key={elements.length} className="font-editorial text-base text-[#171615] ml-6 list-disc mb-1.5">
          {renderInlineFormatting(trimmed.replace(/^[-*]\s+/, ""))}
        </li>
      );
      continue;
    }

    // Regular line -> paragraph buffer
    paragraphBuffer.push(line);
  }

  flushParagraph();
  flushCodeBlock();

  return <div className="space-y-5">{elements}</div>;
}

function QuestionAnswerEditor({
  item,
  onSave,
}: {
  item: ChecklistItem;
  onSave: (id: string, note: string) => void;
}) {
  const [draft, setDraft] = useState(item.answerNote || "");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setDraft(item.answerNote || "");
  }, [item.answerNote]);

  function handleSave() {
    onSave(item.id, draft);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  }

  return (
    <div className="mt-2.5 pt-2 border-t border-[#e5e2d9] space-y-2">
      <div className="flex items-center justify-between text-[0.6875rem]">
        <span className="font-semibold text-[#5e5a54] flex items-center gap-1">
          <BookOpen className="w-3 h-3 text-[#ba5d1a]" />
          Solution &amp; Study Notes
        </span>
        {isSaved && <span className="text-[#234338] font-medium text-[0.625rem]">✓ Saved</span>}
      </div>
      <textarea
        rows={2}
        placeholder="Draft your answer, solution notes, or key takeaway here..."
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="w-full bg-[#fdf8f6] border border-[#ddd8cc] rounded-[0.25rem] text-xs p-2 text-[#171615] placeholder:text-[#78746d] outline-none focus:border-[#ba5d1a] resize-none transition-colors"
      />
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="px-2 py-0.5 text-[0.6875rem] font-medium text-[#ffffff] bg-[#ba5d1a] hover:bg-[#a24e14] rounded transition-colors"
        >
          Save Notes
        </button>
      </div>
    </div>
  );
}

export default function FolioReaderPage() {
  const params = useParams();
  const { user } = useUser();
  const groupId = params.groupId as string;
  const assetId = params.assetId as string;

  const [asset, setAsset] = useState<AssetData | null>(null);
  const [groupName, setGroupName] = useState("Study Group");
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<"checklist" | "highlights" | "notes">("checklist");
  const [copiedCitation, setCopiedCitation] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Study Tools Focus Timer state
  const [timerMode, setTimerMode] = useState<"focus" | "deep" | "shortBreak" | "longBreak" | "stopwatch">("focus");
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(25 * 60);
  const [timerInitialSeconds, setTimerInitialSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [customTimerMinutes, setCustomTimerMinutes] = useState("25");
  const [isTimerExpanded, setIsTimerExpanded] = useState(false);
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0);
  const [timerJustFinished, setTimerJustFinished] = useState(false);

  // Real user tasks and questions state
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTodoType, setNewTodoType] = useState<TodoType>("question");
  const [activeTodoFilter, setActiveTodoFilter] = useState<"all" | "question" | "reading" | "task" | "pending" | "completed">("all");
  const [expandedAnswerTodoId, setExpandedAnswerTodoId] = useState<string | null>(null);

  // Bulk Question Import state
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [bulkQuestionsInput, setBulkQuestionsInput] = useState("");
  const [bulkQuestionsType, setBulkQuestionsType] = useState<TodoType>("question");

  // Real user notes state
  const [marginalNotes, setMarginalNotes] = useState<MarginalNote[]>([]);
  const [newNoteText, setNewNoteText] = useState("");

  // Highlighting state & tools
  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  const [isHighlightModalOpen, setIsHighlightModalOpen] = useState(false);
  const [highlightText, setHighlightText] = useState("");
  const [highlightColor, setHighlightColor] = useState<"yellow" | "green" | "rose" | "ochre">("yellow");
  const [highlightPage, setHighlightPage] = useState("1");
  const [highlightNote, setHighlightNote] = useState("");
  const [copiedHighlightId, setCopiedHighlightId] = useState<string | null>(null);
  const [activeHighlightFilter, setActiveHighlightFilter] = useState<string>("all");

  // Load saved highlights and tasks from localStorage
  useEffect(() => {
    if (!assetId) return;
    try {
      const savedHl = localStorage.getItem(`sg_highlights_${assetId}`);
      if (savedHl) {
        setHighlights(JSON.parse(savedHl));
      }
      const savedTasks = localStorage.getItem(`sg_tasks_${assetId}`);
      if (savedTasks) {
        setChecklist(JSON.parse(savedTasks));
      }
    } catch {
      // ignore storage error
    }
  }, [assetId]);

  // Web Audio API harmonic chime on timer completion
  const playChime = useCallback(() => {
    try {
      if (typeof window === "undefined") return;
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.18); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.9);
    } catch {
      // ignore audio error
    }
  }, []);

  // Ticking effect for timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        if (timerMode === "stopwatch") {
          setTimerSecondsLeft((prev) => prev + 1);
        } else {
          setTimerSecondsLeft((prev) => {
            if (prev <= 1) {
              setIsTimerRunning(false);
              setTimerJustFinished(true);
              playChime();
              if (timerMode === "focus" || timerMode === "deep") {
                setPomodorosCompleted((c) => c + 1);
              }
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timerMode, playChime]);

  function handleSetPreset(preset: "focus" | "deep" | "shortBreak" | "longBreak" | "stopwatch") {
    setIsTimerRunning(false);
    setTimerJustFinished(false);
    setTimerMode(preset);
    let sec = 25 * 60;
    if (preset === "focus") sec = 25 * 60;
    else if (preset === "deep") sec = 50 * 60;
    else if (preset === "shortBreak") sec = 5 * 60;
    else if (preset === "longBreak") sec = 15 * 60;
    else if (preset === "stopwatch") sec = 0;
    setTimerInitialSeconds(sec);
    setTimerSecondsLeft(sec);
  }

  function handleSetCustomTimer(e: React.FormEvent) {
    e.preventDefault();
    const mins = parseInt(customTimerMinutes, 10);
    if (isNaN(mins) || mins <= 0) return;
    setIsTimerRunning(false);
    setTimerJustFinished(false);
    const sec = mins * 60;
    setTimerInitialSeconds(sec);
    setTimerSecondsLeft(sec);
  }

  function handleResetTimer() {
    setIsTimerRunning(false);
    setTimerJustFinished(false);
    setTimerSecondsLeft(timerInitialSeconds);
  }

  function formatTime(seconds: number) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  const loadFolioData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch asset metadata (permission-gated)
      const assetRes = await fetch(`/api/assets/${assetId}`);
      if (!assetRes.ok) {
        if (assetRes.status === 403) {
          throw new Error("Access Denied: The group owner has not granted you access to this document.");
        }
        if (assetRes.status === 404) {
          throw new Error("Document not found: This file may have been moved or removed.");
        }
        const errData = await assetRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to load document");
      }
      const assetData = await assetRes.json();
      const currentAsset: AssetData = assetData.asset;
      setAsset(currentAsset);

      // 2. Fetch group info
      const groupRes = await fetch(`/api/groups/${groupId}`);
      if (groupRes.ok) {
        const gData = await groupRes.json();
        setGroupName(gData.group.name);
      }

      // 3. Fetch presigned download ticket
      const dlRes = await fetch(`/api/assets/${assetId}/download`);
      if (dlRes.ok) {
        const dlData = await dlRes.json();
        setDownloadUrl(dlData.downloadUrl);

        // 4. If Markdown or text document, fetch the actual file content
        if (currentAsset.fileType === "md" || currentAsset.fileType === "transcript") {
          setIsLoadingContent(true);
          try {
            const separator = dlData.downloadUrl.includes("?") ? "&" : "?";
            const contentRes = await fetch(`${dlData.downloadUrl}${separator}inline=true`);
            if (contentRes.ok) {
              const text = await contentRes.text();
              setTextContent(text);
            } else {
              setTextContent(null);
            }
          } catch (fetchErr) {
            console.warn("Could not fetch text content from storage URL:", fetchErr);
          } finally {
            setIsLoadingContent(false);
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load document");
    } finally {
      setIsLoading(false);
    }
  }, [assetId, groupId]);

  useEffect(() => {
    loadFolioData();
  }, [loadFolioData]);

  function handleToggleChecklist(id: string) {
    setChecklist((prev) => {
      const updated = prev.map((item) => {
        if (item.id === id) {
          const nextCompleted = !item.completed;
          return {
            ...item,
            completed: nextCompleted,
            completedAt: nextCompleted
              ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : undefined,
          };
        }
        return item;
      });
      try {
        localStorage.setItem(`sg_tasks_${assetId}`, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }

  function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const authorName = user?.fullName || user?.firstName || "You";
    const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Auto-detect question if title ends with '?' or starts with common question stems
    let determinedType: TodoType = newTodoType;
    const trimmed = newTaskTitle.trim();
    if (
      trimmed.endsWith("?") ||
      /^(what|how|why|explain|define|describe|compare|when|where|which|can|is|does)\b/i.test(trimmed)
    ) {
      determinedType = "question";
    }

    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      title: trimmed,
      type: determinedType,
      completed: false,
      assignee: authorName,
      createdAt: nowStr,
    };

    setChecklist((prev) => {
      const updated = [newItem, ...prev];
      try {
        localStorage.setItem(`sg_tasks_${assetId}`, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    setNewTaskTitle("");
  }

  function parseQuestionsList(rawText: string): string[] {
    return rawText
      .split("\n")
      .map((line) => line.trim())
      .map((line) => line.replace(/^(\d+[\.\)]\s*|Q\d+[:\.]\s*|\[\d+\]\s*|[\-\*•]\s*)/i, "").trim())
      .filter((line) => line.length > 0);
  }

  function handleImportBulkQuestions(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseQuestionsList(bulkQuestionsInput);
    if (parsed.length === 0) return;

    const authorName = user?.fullName || user?.firstName || "You";
    const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newItems: ChecklistItem[] = parsed.map((qText, index) => ({
      id: `${Date.now()}-${index}`,
      title: qText,
      type: bulkQuestionsType,
      completed: false,
      assignee: authorName,
      createdAt: nowStr,
    }));

    setChecklist((prev) => {
      const updated = [...newItems, ...prev];
      try {
        localStorage.setItem(`sg_tasks_${assetId}`, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    setBulkQuestionsInput("");
    setIsQuestionModalOpen(false);
    setSidebarTab("checklist");
  }

  function handleSaveAnswerNote(id: string, note: string) {
    setChecklist((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, answerNote: note } : item));
      try {
        localStorage.setItem(`sg_tasks_${assetId}`, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }

  function handleDeleteTask(id: string) {
    setChecklist((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try {
        localStorage.setItem(`sg_tasks_${assetId}`, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }

  function handlePublishNote(e: React.FormEvent) {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    const authorName = user?.fullName || user?.firstName || "You";
    const authorInitials = authorName.substring(0, 2).toUpperCase();

    const newEntry: MarginalNote = {
      id: Date.now().toString(),
      author: authorName,
      authorInitials,
      timeAgo: "Just now",
      text: newNoteText.trim(),
    };

    setMarginalNotes((prev) => [newEntry, ...prev]);
    setNewNoteText("");
  }

  function handleAddHighlight(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!highlightText.trim()) return;

    const authorName = user?.fullName || user?.firstName || "You";
    const newHighlight: HighlightItem = {
      id: Date.now().toString(),
      text: highlightText.trim(),
      color: highlightColor,
      pageNumber: highlightPage.trim() || "1",
      note: highlightNote.trim() || undefined,
      author: authorName,
      createdAt: new Date().toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const updated = [newHighlight, ...highlights];
    setHighlights(updated);
    try {
      localStorage.setItem(`sg_highlights_${assetId}`, JSON.stringify(updated));
    } catch {
      // ignore
    }

    // Also record in notes feed with color label
    const categoryLabel =
      highlightColor === "yellow"
        ? "Concept"
        : highlightColor === "green"
        ? "Evidence"
        : highlightColor === "rose"
        ? "Exam Note"
        : "Question";

    const newNote: MarginalNote = {
      id: `hl-${newHighlight.id}`,
      author: authorName,
      authorInitials: authorName.substring(0, 2).toUpperCase(),
      timeAgo: "Just now",
      text: `[Highlighted ${categoryLabel}${newHighlight.pageNumber ? ` • Pg ${newHighlight.pageNumber}` : ""}]: "${newHighlight.text}"${newHighlight.note ? ` — Note: ${newHighlight.note}` : ""}`,
    };
    setMarginalNotes((prev) => [newNote, ...prev]);

    setHighlightText("");
    setHighlightNote("");
    setIsHighlightModalOpen(false);
    setIsSidebarOpen(true);
    setSidebarTab("highlights");
  }

  function handleDeleteHighlight(id: string) {
    const updated = highlights.filter((h) => h.id !== id);
    setHighlights(updated);
    try {
      localStorage.setItem(`sg_highlights_${assetId}`, JSON.stringify(updated));
    } catch {
      // ignore
    }
  }

  function handleCopyHighlightQuote(h: HighlightItem) {
    const quote = `"${h.text}" (Page ${h.pageNumber || 1}, ${asset?.title || "Document"})`;
    navigator.clipboard.writeText(quote);
    setCopiedHighlightId(h.id);
    setTimeout(() => setCopiedHighlightId(null), 2000);
  }

  function handleCopyCitation() {
    if (!asset) return;
    const year = new Date(asset.createdAt).getFullYear();
    const citation = `"${asset.title}." StudyGroup+ Document Repository, ${groupName}, ${year}.`;
    navigator.clipboard.writeText(citation);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2000);
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fdf8f6] flex flex-col font-sans">
        <AppHeader />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse space-y-8">
          <div className="h-6 bg-[#e5e2d9]/60 rounded w-1/3" />
          <div className="h-16 bg-[#e5e2d9]/80 rounded w-2/3" />
          <div className="h-96 bg-[#e5e2d9]/40 rounded w-full" />
        </main>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-[#fdf8f6] flex flex-col font-sans">
        <AppHeader />
        <main className="flex-1 max-w-xl mx-auto px-4 py-20 text-center">
          <AlertCircle className="w-12 h-12 text-[#ba5d1a] mx-auto mb-4" />
          <h2 className="font-serif text-2xl text-[#171615] mb-2">
            Unable to Open Document
          </h2>
          <p className="text-sm text-[#5e5a54] mb-8 leading-relaxed">
            {error || "Unable to retrieve this document from storage."}
          </p>
          <div className="flex justify-center gap-3">
            <Link href={`/lounges/${groupId}`}>
              <Button variant="secondary" size="md" icon={<ArrowLeft className="w-4 h-4" />}>
                Back to Study Group
              </Button>
            </Link>
            <Button variant="primary" size="md" onClick={loadFolioData}>
              Try Again
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const formattedDate = new Date(asset.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const citationText = `"${asset.title}." StudyGroup+ Document Repository, ${groupName}, ${new Date(asset.createdAt).getFullYear()}.`;

  const filteredHighlights =
    activeHighlightFilter === "all"
      ? highlights
      : highlights.filter((h) => h.color === activeHighlightFilter);

  const filteredChecklist = checklist.filter((item) => {
    if (activeTodoFilter === "all") return true;
    if (activeTodoFilter === "question") return item.type === "question";
    if (activeTodoFilter === "reading") return item.type === "reading";
    if (activeTodoFilter === "task") return item.type === "task" || !item.type;
    if (activeTodoFilter === "pending") return !item.completed;
    if (activeTodoFilter === "completed") return item.completed;
    return true;
  });

  const questionCount = checklist.filter((item) => item.type === "question").length;
  const readingCount = checklist.filter((item) => item.type === "reading").length;
  const taskCount = checklist.filter((item) => item.type === "task" || !item.type).length;
  const completedCount = checklist.filter((item) => item.completed).length;

  return (
    <div className="min-h-screen bg-[#f4f2eb] flex flex-col font-sans selection:bg-[#ffdbc9] selection:text-[#171615]">
      {!isFocusMode && <AppHeader />}

      {/* Top Secondary Navigation Bar */}
      <div className="w-full bg-[#faf9f6] border-b border-[#e5e2d9] px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 font-sans text-xs shrink-0 z-20">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[#78746d]">
          <Link
            href={`/lounges/${groupId}`}
            className="hover:text-[#171615] transition-colors duration-150 flex items-center gap-1 font-medium"
          >
            <ArrowLeft className="w-3 h-3" />
            {groupName}
          </Link>
          <span>/</span>
          <span>Documents</span>
          <span>/</span>
          <span className="text-[#171615] font-semibold truncate max-w-xs">{asset.title}</span>
        </div>

        {/* Center Controls: Zoom, File Type & Quick Study Timer */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex items-center gap-1 bg-[#ffffff] border border-[#ddd8cc] rounded-[0.25rem] px-2 py-0.5 text-[0.6875rem]">
            <button
              type="button"
              onClick={() => setZoomLevel(Math.max(75, zoomLevel - 10))}
              className="p-1 text-[#78746d] hover:text-[#171615] transition-colors duration-150"
              title="Zoom out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="font-medium text-[#171615]">{zoomLevel}%</span>
            <button
              type="button"
              onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))}
              className="p-1 text-[#78746d] hover:text-[#171615] transition-colors duration-150"
              title="Zoom in"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          <Badge variant={asset.fileType === "pdf" ? "forest" : asset.fileType === "md" ? "ochre" : "neutral"}>
            {asset.fileType.toUpperCase()}
          </Badge>

          {/* Quick Study Timer in Navigation Bar */}
          <div className="flex items-center gap-1.5 bg-[#ffffff] border border-[#ddd8cc] rounded-[0.25rem] px-2 py-0.5 text-[0.6875rem] text-[#171615]">
            <button
              type="button"
              onClick={() => {
                if (!isSidebarOpen) setIsSidebarOpen(true);
                setIsTimerExpanded(true);
              }}
              className="flex items-center gap-1 hover:text-[#ba5d1a] transition-colors"
              title="View Focus Timer in Study Tools"
            >
              <Timer className={`w-3 h-3 ${isTimerRunning ? "text-[#ba5d1a] animate-pulse" : "text-[#78746d]"}`} />
              <span className="font-mono font-semibold">{formatTime(timerSecondsLeft)}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="p-0.5 text-[#ba5d1a] hover:text-[#a24e14] transition-colors"
              title={isTimerRunning ? "Pause timer" : "Start timer"}
            >
              {isTimerRunning ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5 fill-current" />}
            </button>
            <button
              type="button"
              onClick={handleResetTimer}
              className="p-0.5 text-[#78746d] hover:text-[#171615] transition-colors"
              title="Reset timer"
            >
              <RotateCcw className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>

        {/* Right Actions: Highlight, Focus Mode, Download, Sidebar Toggle */}
        <div className="flex items-center gap-2">
          {/* Highlight Tool Button */}
          <button
            type="button"
            onClick={() => setIsHighlightModalOpen(true)}
            className="px-2.5 py-1 text-xs text-[#ffffff] bg-[#ba5d1a] hover:bg-[#a24e14] rounded-[0.25rem] transition-colors duration-150 flex items-center gap-1.5 font-medium shadow-xs"
            title="Highlight passage in document"
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span>Highlight</span>
            {highlights.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-black/20 text-[0.625rem]">
                {highlights.length}
              </span>
            )}
          </button>

          {/* Full Screen / Focus Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsFocusMode(!isFocusMode)}
            className={`p-1.5 rounded-[0.25rem] border transition-colors duration-150 ${
              isFocusMode
                ? "bg-[#ba5d1a] text-[#ffffff] border-[#ba5d1a]"
                : "bg-[#ffffff] text-[#78746d] hover:text-[#171615] border-[#ddd8cc]"
            }`}
            title={isFocusMode ? "Exit Full Screen" : "Full Screen (Cover whole window)"}
          >
            {isFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          {downloadUrl && (
            <a
              href={downloadUrl}
              download={asset.title}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 text-xs text-[#171615] hover:text-[#ba5d1a] rounded border border-[#ddd8cc] bg-[#ffffff] transition-colors duration-150 flex items-center gap-1.5 font-medium shadow-xs"
              title="Download file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </a>
          )}

          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-1.5 rounded-[0.25rem] border transition-colors duration-150 ${
              isSidebarOpen
                ? "bg-[#ffffff] text-[#78746d] hover:text-[#171615] border-[#ddd8cc]"
                : "bg-[#ba5d1a]/10 text-[#ba5d1a] border-[#ba5d1a]/30"
            }`}
            title={isSidebarOpen ? "Collapse Study Tools Sidebar" : "Open Study Tools Sidebar"}
          >
            {isSidebarOpen ? <SidebarClose className="w-4 h-4" /> : <SidebarOpen className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Reader Workspace (Reading Canvas + Sidebar) */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left / Center Document Canvas - Fills full width & height */}
        <div
          className={`flex-1 flex flex-col overflow-hidden ${
            asset.fileType === "pdf"
              ? "p-0 m-0 w-full h-full bg-[#1e1c1b]"
              : "overflow-y-auto px-4 sm:px-8 py-8 flex justify-center"
          }`}
        >
          {/* PDF Document View - Covers the Whole Area Edge-to-Edge */}
          {asset.fileType === "pdf" ? (
            <div className="w-full h-full flex-1 flex flex-col overflow-hidden">
              {/* PDF Compact Control Ribbon */}
              <div className="px-4 py-2 bg-[#2d2a28] border-b border-[#3e3b38] flex items-center justify-between gap-4 text-xs text-[#faf9f6] shrink-0">
                <div className="flex items-center gap-3">
                  <span className="font-serif font-medium text-sm text-[#faf9f6] truncate max-w-md">
                    {asset.title}
                  </span>
                  <Badge variant="forest" className="bg-[#234338] text-[#c4e8d8] border-[#234338] hidden sm:inline-flex">
                    PDF • {(asset.sizeBytes / 1024 / 1024).toFixed(2)} MB
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsHighlightModalOpen(true)}
                    className="px-2.5 py-1 rounded-[0.25rem] bg-[#ba5d1a] hover:bg-[#a24e14] text-[#ffffff] font-medium flex items-center gap-1.5 transition-colors shadow-xs"
                    title="Highlight text or passage from PDF"
                  >
                    <Highlighter className="w-3.5 h-3.5" />
                    <span>Highlight Passage</span>
                    {highlights.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full bg-black/25 text-[0.625rem]">
                        {highlights.length}
                      </span>
                    )}
                  </button>

                  {downloadUrl && (
                    <a
                      href={downloadUrl}
                      download={asset.title}
                      className="px-2.5 py-1 bg-[#242220] hover:bg-[#32302f] text-[#faf9f6] border border-[#3e3b38] rounded-[0.25rem] transition-colors flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Download PDF</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Edge-to-Edge Full Height PDF Viewer */}
              {downloadUrl ? (
                <div className="w-full flex-1 h-full min-h-[calc(100vh-7.5rem)] relative bg-[#171615]">
                  <iframe
                    src={`${downloadUrl}${downloadUrl.includes("?") ? "&" : "?"}inline=true#view=FitH&toolbar=1`}
                    className="w-full h-full border-0 absolute inset-0"
                    title={asset.title}
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-xs text-[#78746d]">
                  <FileText className="w-12 h-12 text-[#ba5d1a] mx-auto mb-3 opacity-60" />
                  <p className="font-serif text-base text-[#faf9f6] mb-2">PDF Document Ready</p>
                  <p className="max-w-md mb-4 text-[#ddd8cc]">The document is stored in the repository. Please download to view.</p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ zoom: `${zoomLevel}%` }} className={`w-full ${isFocusMode ? "max-w-6xl" : "max-w-4xl"} transition-all duration-200`}>
              {/* Markdown Document View */}
              {asset.fileType === "md" || asset.fileType === "transcript" ? (
                <article className="w-full bg-[#ffffff] rounded-[0.25rem] border border-[#e5e2d9] shadow-paper-floating p-8 sm:p-14 transition-all duration-200">
                  {/* Header Metadata */}
                  <div className="border-b border-[#e5e2d9] pb-6 mb-8 flex items-center justify-between text-xs text-[#78746d]">
                    <span className="font-sans uppercase tracking-[0.12em] font-semibold">
                      {groupName} • Study Document
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-editorial italic">
                        Added {formattedDate}
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsHighlightModalOpen(true)}
                        className="px-2 py-0.5 rounded-[0.25rem] bg-[#ba5d1a]/10 hover:bg-[#ba5d1a]/20 text-[#ba5d1a] font-medium flex items-center gap-1 transition-colors"
                      >
                        <Highlighter className="w-3 h-3" />
                        <span>Highlight</span>
                      </button>
                    </div>
                  </div>

                  {/* Document Title */}
                  <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#171615] mb-3 leading-tight">
                    {asset.title}
                  </h1>
                  <p className="font-editorial italic text-sm sm:text-base text-[#5e5a54] mb-10 pb-6 border-b border-[#e5e2d9]">
                    {(asset.sizeBytes / 1024).toFixed(1)} KB • Markdown Document
                  </p>

                  {/* Real Markdown Content */}
                  {isLoadingContent ? (
                    <div className="space-y-4 animate-pulse">
                      <div className="h-4 bg-[#e5e2d9]/60 rounded w-full" />
                      <div className="h-4 bg-[#e5e2d9]/60 rounded w-5/6" />
                      <div className="h-4 bg-[#e5e2d9]/60 rounded w-4/6" />
                    </div>
                  ) : textContent ? (
                    <MarkdownRenderer content={textContent} />
                  ) : (
                    <div className="p-8 bg-[#faf9f6] border border-dashed border-[#ddd8cc] rounded-[0.25rem] text-center text-xs text-[#78746d]">
                      <FileText className="w-8 h-8 text-[#ba5d1a] mx-auto mb-2 opacity-50" />
                      <p className="font-medium text-[#171615] mb-1">Document Content Unavailable</p>
                      <p>The text content could not be read from storage. Please re-upload this document.</p>
                    </div>
                  )}
                </article>
              ) : null}

              {/* PPTX Slide Deck View */}
              {asset.fileType === "pptx" && (
                <div className="w-full bg-[#ffffff] rounded-[0.25rem] border border-[#e5e2d9] shadow-paper-floating p-8 sm:p-12 text-center">
                  <Presentation className="w-16 h-16 text-[#ba5d1a] mx-auto mb-4" />
                  <h2 className="font-serif text-2xl text-[#171615] mb-2">{asset.title}</h2>
                  <p className="font-editorial italic text-sm text-[#5e5a54] mb-6">
                    Microsoft PowerPoint Slide Deck • {(asset.sizeBytes / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <p className="font-sans text-xs text-[#78746d] max-w-md mx-auto mb-8 leading-relaxed">
                    Slide presentations can be downloaded directly to open in PowerPoint, Keynote, or Google Slides.
                  </p>
                  {downloadUrl && (
                    <a
                      href={downloadUrl}
                      download={asset.title}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#ba5d1a] hover:bg-[#a24e14] text-[#ffffff] text-sm font-semibold rounded-[0.25rem] transition-colors shadow-xs"
                    >
                      <Download className="w-4 h-4" />
                      Download Presentation Deck
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar ("Study Tools") */}
        {isSidebarOpen && (
          <aside className="w-96 bg-[#faf9f6] border-l border-[#e5e2d9] flex flex-col shrink-0 font-sans shadow-paper-contact overflow-hidden">
            {/* Sidebar Header */}
            <div className="p-4 bg-[#f4f2eb] border-b border-[#e5e2d9]">
              <h3 className="font-serif text-lg font-normal text-[#171615]">
                Study Tools
              </h3>
              <p className="text-xs text-[#78746d] font-sans mt-0.5 truncate">
                {groupName} • {asset.title}
              </p>
            </div>

            {/* Study Focus Timer Widget */}
            <div className="border-b border-[#e5e2d9] bg-[#faf9f6]">
              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-[0.25rem] transition-colors ${
                      isTimerRunning
                        ? "bg-[#ba5d1a] text-[#ffffff] animate-pulse shadow-xs"
                        : "bg-[#ba5d1a]/10 text-[#ba5d1a]"
                    }`}
                  >
                    <Timer className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xl font-bold tracking-tight text-[#171615]">
                        {formatTime(timerSecondsLeft)}
                      </span>
                      <span className="text-[0.625rem] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-black/5 text-[#78746d]">
                        {timerMode === "focus"
                          ? "Focus"
                          : timerMode === "deep"
                          ? "Deep Work"
                          : timerMode === "shortBreak"
                          ? "Short Break"
                          : timerMode === "longBreak"
                          ? "Long Break"
                          : "Stopwatch"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (timerJustFinished) setTimerJustFinished(false);
                      setIsTimerRunning(!isTimerRunning);
                    }}
                    className={`px-2.5 py-1 rounded-[0.25rem] text-xs font-semibold flex items-center gap-1 transition-colors shadow-2xs ${
                      isTimerRunning
                        ? "bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300"
                        : "bg-[#ba5d1a] text-[#ffffff] hover:bg-[#a24e14]"
                    }`}
                  >
                    {isTimerRunning ? (
                      <>
                        <Pause className="w-3 h-3" />
                        <span>Pause</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current" />
                        <span>Start</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleResetTimer}
                    className="p-1.5 rounded-[0.25rem] border border-[#ddd8cc] bg-[#ffffff] text-[#78746d] hover:text-[#171615] transition-colors"
                    title="Reset timer"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsTimerExpanded(!isTimerExpanded)}
                    className="p-1 text-[#78746d] hover:text-[#171615] transition-colors"
                    title={isTimerExpanded ? "Collapse timer presets" : "Expand timer presets"}
                  >
                    {isTimerExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Finished Alert */}
              {timerJustFinished && (
                <div className="mx-3.5 mb-3 p-2.5 bg-amber-50 border border-amber-300 rounded-[0.25rem] flex items-center justify-between text-xs text-amber-950">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span>🔔</span>
                    <span>Session completed! Time for a short break.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setTimerJustFinished(false);
                      handleSetPreset("shortBreak");
                    }}
                    className="px-2 py-0.5 text-[0.625rem] font-semibold bg-amber-200 hover:bg-amber-300 rounded text-amber-950 transition-colors"
                  >
                    Take 5m Break
                  </button>
                </div>
              )}

              {/* Expanded Presets & Custom Duration */}
              {isTimerExpanded && (
                <div className="px-3.5 pb-3.5 pt-2 space-y-3 border-t border-[#e5e2d9]/70 bg-[#fbf9f4]">
                  {/* Preset Pills */}
                  <div>
                    <span className="block text-[0.625rem] font-semibold uppercase tracking-wider text-[#78746d] mb-1.5">
                      Session Presets
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      <button
                        type="button"
                        onClick={() => handleSetPreset("focus")}
                        className={`px-2 py-1.5 rounded-[0.25rem] border text-left flex items-center gap-1.5 transition-colors ${
                          timerMode === "focus"
                            ? "bg-[#ba5d1a]/10 border-[#ba5d1a] text-[#ba5d1a] font-semibold"
                            : "bg-[#ffffff] border-[#ddd8cc] text-[#5e5a54] hover:border-[#ba5d1a]/50"
                        }`}
                      >
                        <span>🍅</span>
                        <span>25m Focus</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetPreset("deep")}
                        className={`px-2 py-1.5 rounded-[0.25rem] border text-left flex items-center gap-1.5 transition-colors ${
                          timerMode === "deep"
                            ? "bg-[#234338]/10 border-[#234338] text-[#234338] font-semibold"
                            : "bg-[#ffffff] border-[#ddd8cc] text-[#5e5a54] hover:border-[#234338]/50"
                        }`}
                      >
                        <BookOpen className="w-3 h-3 text-[#234338]" />
                        <span>50m Deep</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetPreset("shortBreak")}
                        className={`px-2 py-1.5 rounded-[0.25rem] border text-left flex items-center gap-1.5 transition-colors ${
                          timerMode === "shortBreak"
                            ? "bg-amber-100 border-amber-400 text-amber-950 font-semibold"
                            : "bg-[#ffffff] border-[#ddd8cc] text-[#5e5a54] hover:border-amber-300"
                        }`}
                      >
                        <Coffee className="w-3 h-3 text-amber-700" />
                        <span>5m Break</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetPreset("stopwatch")}
                        className={`px-2 py-1.5 rounded-[0.25rem] border text-left flex items-center gap-1.5 transition-colors ${
                          timerMode === "stopwatch"
                            ? "bg-stone-200 border-stone-400 text-stone-900 font-semibold"
                            : "bg-[#ffffff] border-[#ddd8cc] text-[#5e5a54] hover:border-stone-400"
                        }`}
                      >
                        <Timer className="w-3 h-3 text-stone-700" />
                        <span>Stopwatch</span>
                      </button>
                    </div>
                  </div>

                  {/* Custom duration input */}
                  <form onSubmit={handleSetCustomTimer} className="flex items-center gap-2 pt-1">
                    <span className="text-[0.6875rem] text-[#78746d] whitespace-nowrap">Custom:</span>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={customTimerMinutes}
                      onChange={(e) => setCustomTimerMinutes(e.target.value)}
                      placeholder="Mins"
                      className="w-16 bg-[#ffffff] border border-[#ddd8cc] rounded-[0.25rem] text-xs px-2 py-1 text-[#171615] outline-none focus:border-[#ba5d1a]"
                    />
                    <span className="text-[0.6875rem] text-[#78746d]">min</span>
                    <button
                      type="submit"
                      className="px-2.5 py-1 text-xs bg-[#ffffff] border border-[#ddd8cc] hover:border-[#ba5d1a] text-[#171615] hover:text-[#ba5d1a] rounded-[0.25rem] font-medium transition-colors"
                    >
                      Set
                    </button>
                  </form>

                  {/* Progress & Stats */}
                  <div className="flex items-center justify-between text-[0.6875rem] pt-1 border-t border-[#e5e2d9]/70 text-[#78746d]">
                    <div className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-[#ba5d1a]" />
                      <span>{pomodorosCompleted} focus session{pomodorosCompleted === 1 ? "" : "s"} done</span>
                    </div>
                    {timerMode !== "stopwatch" && timerInitialSeconds > 0 && (
                      <span className="font-mono">
                        {Math.round(((timerInitialSeconds - timerSecondsLeft) / timerInitialSeconds) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Tabs */}
            <div className="px-4 pt-2 flex gap-3 border-b border-[#e5e2d9] text-xs font-semibold uppercase tracking-[0.08em]">
              <button
                type="button"
                onClick={() => setSidebarTab("highlights")}
                className={`pb-2 border-b-2 transition-colors duration-150 flex items-center gap-1 ${
                  sidebarTab === "highlights"
                    ? "border-[#ba5d1a] text-[#ba5d1a]"
                    : "border-transparent text-[#78746d] hover:text-[#171615]"
                }`}
              >
                <Highlighter className="w-3 h-3" />
                Highlights ({highlights.length})
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab("notes")}
                className={`pb-2 border-b-2 transition-colors duration-150 ${
                  sidebarTab === "notes"
                    ? "border-[#ba5d1a] text-[#ba5d1a]"
                    : "border-transparent text-[#78746d] hover:text-[#171615]"
                }`}
              >
                Notes ({marginalNotes.length})
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab("checklist")}
                className={`pb-2 border-b-2 transition-colors duration-150 ${
                  sidebarTab === "checklist"
                    ? "border-[#ba5d1a] text-[#ba5d1a]"
                    : "border-transparent text-[#78746d] hover:text-[#171615]"
                }`}
              >
                Tasks &amp; Questions ({checklist.length})
              </button>
            </div>

            {/* Sidebar Body */}
            <div className="flex-1 p-5 overflow-y-auto space-y-6">
              {/* Highlights Tab */}
              {sidebarTab === "highlights" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold uppercase tracking-[0.08em] text-[#78746d]">
                      Key Highlights
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsHighlightModalOpen(true)}
                      className="text-[#ba5d1a] hover:text-[#a24e14] font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Highlight
                    </button>
                  </div>

                  {/* Highlight Color Filters */}
                  {highlights.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[0.6875rem]">
                      <button
                        type="button"
                        onClick={() => setActiveHighlightFilter("all")}
                        className={`px-2 py-0.5 rounded-[0.25rem] border transition-colors ${
                          activeHighlightFilter === "all"
                            ? "bg-[#171615] text-[#ffffff] border-[#171615]"
                            : "bg-[#ffffff] text-[#78746d] border-[#ddd8cc] hover:text-[#171615]"
                        }`}
                      >
                        All ({highlights.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveHighlightFilter("yellow")}
                        className={`px-2 py-0.5 rounded-[0.25rem] border flex items-center gap-1 transition-colors ${
                          activeHighlightFilter === "yellow"
                            ? "bg-amber-100 border-amber-400 text-amber-950 font-semibold"
                            : "bg-white border-[#ddd8cc] text-[#78746d]"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span>Concept</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveHighlightFilter("green")}
                        className={`px-2 py-0.5 rounded-[0.25rem] border flex items-center gap-1 transition-colors ${
                          activeHighlightFilter === "green"
                            ? "bg-emerald-100 border-emerald-400 text-emerald-950 font-semibold"
                            : "bg-white border-[#ddd8cc] text-[#78746d]"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>Evidence</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveHighlightFilter("rose")}
                        className={`px-2 py-0.5 rounded-[0.25rem] border flex items-center gap-1 transition-colors ${
                          activeHighlightFilter === "rose"
                            ? "bg-rose-100 border-rose-400 text-rose-950 font-semibold"
                            : "bg-white border-[#ddd8cc] text-[#78746d]"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-rose-400" />
                        <span>Exam</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveHighlightFilter("ochre")}
                        className={`px-2 py-0.5 rounded-[0.25rem] border flex items-center gap-1 transition-colors ${
                          activeHighlightFilter === "ochre"
                            ? "bg-orange-100 border-orange-400 text-orange-950 font-semibold"
                            : "bg-white border-[#ddd8cc] text-[#78746d]"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-orange-400" />
                        <span>Question</span>
                      </button>
                    </div>
                  )}

                  {/* Highlights List */}
                  {filteredHighlights.length === 0 ? (
                    <div className="p-5 bg-[#ffffff] border border-dashed border-[#ddd8cc] rounded-[0.25rem] text-center text-xs text-[#78746d]">
                      <Highlighter className="w-6 h-6 text-[#ba5d1a] mx-auto mb-2 opacity-60" />
                      <p className="font-medium text-[#171615] mb-1">No highlights yet</p>
                      <p className="mb-3">Highlight key concepts from this document to save quotes and study notes.</p>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Plus className="w-3.5 h-3.5" />}
                        onClick={() => setIsHighlightModalOpen(true)}
                      >
                        Add Highlight
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredHighlights.map((hl) => {
                        const colorStyles =
                          hl.color === "yellow"
                            ? "border-l-amber-400 bg-amber-50/70 text-amber-950"
                            : hl.color === "green"
                            ? "border-l-emerald-400 bg-emerald-50/70 text-emerald-950"
                            : hl.color === "rose"
                            ? "border-l-rose-400 bg-rose-50/70 text-rose-950"
                            : "border-l-orange-400 bg-orange-50/70 text-orange-950";

                        const badgeStyles =
                          hl.color === "yellow"
                            ? "bg-amber-100 text-amber-900 border-amber-300"
                            : hl.color === "green"
                            ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                            : hl.color === "rose"
                            ? "bg-rose-100 text-rose-900 border-rose-300"
                            : "bg-orange-100 text-orange-900 border-orange-300";

                        const categoryLabel =
                          hl.color === "yellow"
                            ? "Concept"
                            : hl.color === "green"
                            ? "Evidence"
                            : hl.color === "rose"
                            ? "Exam Note"
                            : "Question";

                        return (
                          <div
                            key={hl.id}
                            className={`p-3 rounded-[0.25rem] border border-[#e5e2d9] border-l-4 shadow-paper-contact space-y-2 transition-all duration-150 ${colorStyles}`}
                          >
                            <div className="flex items-center justify-between text-[0.6875rem]">
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 rounded-[0.125rem] border font-semibold text-[0.625rem] uppercase tracking-wider ${badgeStyles}`}>
                                  {categoryLabel}
                                </span>
                                {hl.pageNumber && (
                                  <span className="font-mono text-[0.625rem] text-[#78746d] bg-black/5 px-1.5 py-0.5 rounded">
                                    Pg {hl.pageNumber}
                                  </span>
                                )}
                              </div>
                              <span className="text-[#78746d] text-[0.625rem]">{hl.createdAt}</span>
                            </div>

                            <p className="font-editorial italic text-xs leading-relaxed text-[#171615]">
                              &ldquo;{hl.text}&rdquo;
                            </p>

                            {hl.note && (
                              <p className="text-[0.6875rem] text-[#554339] bg-white/70 p-1.5 rounded border border-[#e5e2d9]/60 font-sans">
                                <span className="font-semibold text-[#171615]">Note:</span> {hl.note}
                              </p>
                            )}

                            <div className="pt-2 border-t border-black/5 flex items-center justify-between text-[0.6875rem]">
                              <span className="text-[#78746d] text-[0.625rem]">{hl.author}</span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleCopyHighlightQuote(hl)}
                                  className="text-[#ba5d1a] hover:text-[#a24e14] flex items-center gap-1 font-medium transition-colors"
                                  title="Copy formatted quotation"
                                >
                                  {copiedHighlightId === hl.id ? (
                                    <>
                                      <Check className="w-3 h-3 text-[#234338]" />
                                      <span className="text-[#234338]">Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteHighlight(hl.id)}
                                  className="text-[#78746d] hover:text-[#ba1a1a] transition-colors"
                                  title="Remove highlight"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {sidebarTab === "checklist" && (
                <div className="space-y-4">
                  {/* Tab Subheader */}
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold uppercase tracking-[0.08em] text-[#78746d]">
                        Tasks &amp; Questions
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsQuestionModalOpen(true)}
                        className="px-2 py-0.5 rounded-[0.25rem] bg-[#ba5d1a]/10 hover:bg-[#ba5d1a]/20 text-[#ba5d1a] font-medium text-[0.6875rem] flex items-center gap-1 transition-colors"
                        title="Import list of questions from syllabus or problem set"
                      >
                        <ListPlus className="w-3 h-3" />
                        <span>Import Questions</span>
                      </button>
                      <Badge variant="forest">
                        {completedCount} of {checklist.length} Done
                      </Badge>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  {checklist.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[0.6875rem]">
                      <button
                        type="button"
                        onClick={() => setActiveTodoFilter("all")}
                        className={`px-2 py-0.5 rounded-[0.25rem] border transition-colors ${
                          activeTodoFilter === "all"
                            ? "bg-[#171615] text-[#ffffff] border-[#171615]"
                            : "bg-[#ffffff] text-[#78746d] border-[#ddd8cc] hover:text-[#171615]"
                        }`}
                      >
                        All ({checklist.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTodoFilter("question")}
                        className={`px-2 py-0.5 rounded-[0.25rem] border flex items-center gap-1 transition-colors ${
                          activeTodoFilter === "question"
                            ? "bg-amber-100 border-amber-400 text-amber-950 font-semibold"
                            : "bg-[#ffffff] border-[#ddd8cc] text-[#78746d] hover:text-[#171615]"
                        }`}
                      >
                        <HelpCircle className="w-2.5 h-2.5 text-amber-600" />
                        <span>Questions ({questionCount})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTodoFilter("reading")}
                        className={`px-2 py-0.5 rounded-[0.25rem] border flex items-center gap-1 transition-colors ${
                          activeTodoFilter === "reading"
                            ? "bg-emerald-100 border-emerald-400 text-emerald-950 font-semibold"
                            : "bg-[#ffffff] border-[#ddd8cc] text-[#78746d] hover:text-[#171615]"
                        }`}
                      >
                        <BookOpen className="w-2.5 h-2.5 text-emerald-600" />
                        <span>Reading ({readingCount})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTodoFilter("task")}
                        className={`px-2 py-0.5 rounded-[0.25rem] border flex items-center gap-1 transition-colors ${
                          activeTodoFilter === "task"
                            ? "bg-stone-200 border-stone-400 text-stone-900 font-semibold"
                            : "bg-[#ffffff] border-[#ddd8cc] text-[#78746d] hover:text-[#171615]"
                        }`}
                      >
                        <CheckSquare className="w-2.5 h-2.5 text-stone-600" />
                        <span>Tasks ({taskCount})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTodoFilter("pending")}
                        className={`px-2 py-0.5 rounded-[0.25rem] border transition-colors ${
                          activeTodoFilter === "pending"
                            ? "bg-[#ba5d1a]/10 border-[#ba5d1a] text-[#ba5d1a] font-semibold"
                            : "bg-[#ffffff] border-[#ddd8cc] text-[#78746d] hover:text-[#171615]"
                        }`}
                      >
                        In Progress ({checklist.length - completedCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTodoFilter("completed")}
                        className={`px-2 py-0.5 rounded-[0.25rem] border transition-colors ${
                          activeTodoFilter === "completed"
                            ? "bg-[#234338]/10 border-[#234338] text-[#234338] font-semibold"
                            : "bg-[#ffffff] border-[#ddd8cc] text-[#78746d] hover:text-[#171615]"
                        }`}
                      >
                        Done ({completedCount})
                      </button>
                    </div>
                  )}

                  {/* Question & Todo Cards List */}
                  {filteredChecklist.length === 0 ? (
                    <div className="p-5 bg-[#ffffff] border border-dashed border-[#ddd8cc] rounded-[0.25rem] text-center text-xs text-[#78746d] space-y-2">
                      <HelpCircle className="w-6 h-6 text-[#ba5d1a] mx-auto opacity-50" />
                      <p className="font-medium text-[#171615]">No items in this view</p>
                      <p className="text-[0.6875rem]">
                        Add questions or import problem sets below to track your study progress.
                      </p>
                      <div className="pt-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<ListPlus className="w-3.5 h-3.5" />}
                          onClick={() => setIsQuestionModalOpen(true)}
                        >
                          Import Questions
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredChecklist.map((item) => {
                        const isQuestion = item.type === "question";
                        const isReading = item.type === "reading";

                        return (
                          <div
                            key={item.id}
                            className={`p-3.5 rounded-[0.25rem] border space-y-2.5 transition-all duration-150 ${
                              item.completed
                                ? "bg-[#f9f8f5] border-[#e5e2d9] opacity-80"
                                : isQuestion
                                ? "bg-[#ffffff] border-[#e8d5c4] shadow-paper-contact"
                                : "bg-[#ffffff] border-[#e5e2d9] shadow-paper-contact"
                            }`}
                          >
                            {/* Card Header: Type Badge & Delete */}
                            <div className="flex items-center justify-between text-[0.6875rem]">
                              <div className="flex items-center gap-1.5">
                                {isQuestion ? (
                                  <span className="px-2 py-0.5 rounded-[0.125rem] border border-amber-300 bg-amber-50 text-amber-900 font-semibold text-[0.625rem] uppercase tracking-wider flex items-center gap-1">
                                    <HelpCircle className="w-2.5 h-2.5 text-amber-700" />
                                    Question
                                  </span>
                                ) : isReading ? (
                                  <span className="px-2 py-0.5 rounded-[0.125rem] border border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold text-[0.625rem] uppercase tracking-wider flex items-center gap-1">
                                    <BookOpen className="w-2.5 h-2.5 text-emerald-700" />
                                    Reading
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-[0.125rem] border border-[#ddd8cc] bg-black/5 text-[#5e5a54] font-semibold text-[0.625rem] uppercase tracking-wider flex items-center gap-1">
                                    <CheckSquare className="w-2.5 h-2.5 text-[#5e5a54]" />
                                    Task
                                  </span>
                                )}

                                {item.createdAt && (
                                  <span className="text-[0.625rem] text-[#78746d]">{item.createdAt}</span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteTask(item.id)}
                                className="text-[#78746d] hover:text-[#ba1a1a] transition-colors p-0.5"
                                title="Delete task"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Card Body: Title / Question Prompt */}
                            <div>
                              <p
                                className={`text-xs leading-relaxed ${
                                  isQuestion ? "font-serif text-sm font-medium" : "font-sans"
                                } ${
                                  item.completed ? "line-through text-[#78746d]" : "text-[#171615]"
                                }`}
                              >
                                {item.title}
                              </p>
                            </div>

                            {/* Checkout Status & Actions */}
                            {isQuestion ? (
                              <div className="pt-1">
                                {item.completed ? (
                                  <div className="p-2 bg-emerald-50/90 border border-emerald-200 rounded-[0.25rem] flex items-center justify-between text-xs text-emerald-900">
                                    <div className="flex items-center gap-1.5 font-medium text-[0.6875rem]">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                      <span>
                                        Checked out {item.completedAt ? `at ${item.completedAt}` : ""}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleChecklist(item.id)}
                                      className="text-[0.625rem] font-semibold text-emerald-700 hover:text-emerald-950 underline transition-colors"
                                    >
                                      Reopen
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleChecklist(item.id)}
                                    className="w-full py-1.5 px-3 bg-[#ffffff] hover:bg-[#234338]/10 border border-[#234338]/40 hover:border-[#234338] text-[#234338] rounded-[0.25rem] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Check Out Question</span>
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="pt-0.5">
                                <Checkbox
                                  checked={item.completed}
                                  onChange={() => handleToggleChecklist(item.id)}
                                  label={
                                    <span className="text-xs text-[#5e5a54]">
                                      {item.completed ? `Checked out (${item.assignee})` : `Mark completed`}
                                    </span>
                                  }
                                />
                              </div>
                            )}

                            {/* Question Answer / Solution Notes Scratchpad */}
                            {isQuestion && (
                              <div className="pt-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedAnswerTodoId(
                                      expandedAnswerTodoId === item.id ? null : item.id
                                    )
                                  }
                                  className="text-[0.6875rem] text-[#ba5d1a] hover:text-[#a24e14] font-medium flex items-center gap-1 transition-colors"
                                >
                                  {expandedAnswerTodoId === item.id ? (
                                    <>
                                      <ChevronUp className="w-3 h-3" />
                                      <span>Hide Solution Notes</span>
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="w-3 h-3" />
                                      <span>
                                        {item.answerNote ? "Edit Solution Notes (1 saved)" : "+ Add Solution Notes"}
                                      </span>
                                    </>
                                  )}
                                </button>

                                {expandedAnswerTodoId === item.id && (
                                  <QuestionAnswerEditor
                                    item={item}
                                    onSave={handleSaveAnswerNote}
                                  />
                                )}

                                {expandedAnswerTodoId !== item.id && item.answerNote && (
                                  <p className="mt-1.5 text-[0.6875rem] font-editorial italic text-[#554339] bg-black/5 p-2 rounded line-clamp-2">
                                    &ldquo;{item.answerNote}&rdquo;
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add Task Form with Todo Type Selector */}
                  <form
                    onSubmit={handleAddTask}
                    className="p-3 bg-[#ffffff] border border-[#e5e2d9] rounded-[0.25rem] space-y-2.5 shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[0.625rem] font-semibold uppercase tracking-wider text-[#78746d]">
                        New Item Type
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setNewTodoType("question")}
                          className={`px-2 py-0.5 rounded text-[0.625rem] font-medium flex items-center gap-1 transition-colors ${
                            newTodoType === "question"
                              ? "bg-amber-100 text-amber-900 font-semibold border border-amber-300"
                              : "bg-[#faf9f6] text-[#78746d] border border-transparent hover:text-[#171615]"
                          }`}
                        >
                          <HelpCircle className="w-2.5 h-2.5" />
                          <span>Question</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewTodoType("reading")}
                          className={`px-2 py-0.5 rounded text-[0.625rem] font-medium flex items-center gap-1 transition-colors ${
                            newTodoType === "reading"
                              ? "bg-emerald-100 text-emerald-900 font-semibold border border-emerald-300"
                              : "bg-[#faf9f6] text-[#78746d] border border-transparent hover:text-[#171615]"
                          }`}
                        >
                          <BookOpen className="w-2.5 h-2.5" />
                          <span>Reading</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewTodoType("task")}
                          className={`px-2 py-0.5 rounded text-[0.625rem] font-medium flex items-center gap-1 transition-colors ${
                            newTodoType === "task"
                              ? "bg-stone-200 text-stone-900 font-semibold border border-stone-400"
                              : "bg-[#faf9f6] text-[#78746d] border border-transparent hover:text-[#171615]"
                          }`}
                        >
                          <CheckSquare className="w-2.5 h-2.5" />
                          <span>Task</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder={
                          newTodoType === "question"
                            ? "e.g. What is the fundamental theorem of calculus?"
                            : newTodoType === "reading"
                            ? "e.g. Read Chapter 3, pages 45–60"
                            : "e.g. Review lecture problem set"
                        }
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="flex-1 bg-[#fdf8f6] border border-[#ddd8cc] rounded-[0.25rem] text-xs p-2 text-[#171615] placeholder:text-[#78746d] outline-none focus:border-[#ba5d1a] transition-colors"
                      />
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        icon={<Plus className="w-3 h-3" />}
                        disabled={!newTaskTitle.trim()}
                      >
                        Add
                      </Button>
                    </div>
                    <p className="text-[0.625rem] text-[#78746d] italic">
                      Tip: Prompts ending with &apos;?&apos; or starting with &apos;What/How/Why&apos; automatically format as questions.
                    </p>
                  </form>
                </div>
              )}

              {sidebarTab === "notes" && (
                <div className="space-y-4">
                  {marginalNotes.length === 0 ? (
                    <div className="p-4 bg-[#ffffff] border border-dashed border-[#ddd8cc] rounded-[0.25rem] text-center text-xs text-[#78746d]">
                      <p className="font-medium text-[#171615] mb-0.5">No notes saved</p>
                      <p>Jot down reflections or discussion points below.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {marginalNotes.map((note) => (
                        <div
                          key={note.id}
                          className="p-3 bg-[#ffffff] border border-[#e5e2d9] rounded-[0.25rem] space-y-1.5 hover:border-[#ddd8cc] transition-colors duration-150"
                        >
                          <div className="flex items-center justify-between text-[0.625rem]">
                            <span className="font-semibold text-[#171615]">{note.author}</span>
                            <span className="text-[#78746d]">{note.timeAgo}</span>
                          </div>
                          <p className="font-editorial italic text-xs text-[#554339]">
                            &ldquo;{note.text}&rdquo;
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Append Marginal Note Form */}
                  <form onSubmit={handlePublishNote} className="p-4 bg-[#ffffff] border border-[#e5e2d9] rounded-[0.25rem] space-y-3">
                    <span className="block font-sans text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-[#78746d]">
                      Add Note to Document
                    </span>

                    <textarea
                      rows={3}
                      placeholder="Write a note or observation..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      className="w-full bg-[#fdf8f6] border border-[#ddd8cc] rounded-[0.25rem] text-xs p-2.5 text-[#171615] placeholder:text-[#78746d] outline-none focus:border-[#ba5d1a] resize-none transition-colors duration-150"
                    />

                    <div className="flex items-center justify-end pt-1">
                      <Button type="submit" variant="primary" size="sm" disabled={!newNoteText.trim()}>
                        Save Note
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Standard Citation Reference Card */}
              <div className="p-4 bg-[#ffffff] border border-[#e5e2d9] rounded-[0.25rem] space-y-2 hover:border-[#ddd8cc] transition-colors duration-150">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold uppercase tracking-[0.08em] text-[#78746d]">
                    Citation Reference
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCitation}
                    className="text-xs text-[#ba5d1a] hover:text-[#a24e14] flex items-center gap-1 font-medium transition-colors duration-150"
                  >
                    {copiedCitation ? (
                      <>
                        <Check className="w-3 h-3 text-[#234338]" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy
                      </>
                    )}
                  </button>
                </div>
                <p className="font-editorial italic text-xs leading-relaxed text-[#5e5a54]">
                  {citationText}
                </p>
              </div>
            </div>

            {/* Sidebar Footer */}
            <div className="p-3 bg-[#f4f2eb] border-t border-[#e5e2d9] flex items-center justify-between text-xs font-sans text-[#5e5a54]">
              <button
                type="button"
                onClick={handleCopyCitation}
                className="hover:text-[#171615] transition-colors duration-150 flex items-center gap-1"
              >
                <Share2 className="w-3.5 h-3.5 text-[#ba5d1a]" /> Copy Citation
              </button>
              <Link
                href={`/lounges/${groupId}`}
                className="hover:text-[#171615] transition-colors duration-150 flex items-center gap-1"
              >
                <Settings className="w-3.5 h-3.5 text-[#78746d]" /> Group Workspace
              </Link>
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Ribbon */}
      {!isFocusMode && (
        <footer className="h-10 bg-[#ffffff] border-t border-[#e5e2d9] px-4 sm:px-6 flex items-center justify-between text-xs text-[#5e5a54] font-sans shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#234338] animate-pulse" />
              <span className="font-medium text-[#171615]">{groupName}</span>
            </div>
            <span className="text-[#ddd8cc] hidden sm:inline">|</span>
            <span className="hidden sm:inline font-editorial italic text-xs truncate max-w-sm">
              {asset.title}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[0.6875rem]">
            <span>Uploaded {formattedDate}</span>
            <span className="text-[#ddd8cc]">•</span>
            <span className="text-[#234338] font-semibold uppercase tracking-wider">
              Repository Synced
            </span>
          </div>
        </footer>
      )}

      {/* Add Highlight Modal */}
      {isHighlightModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans animate-in fade-in duration-150">
          <div className="bg-[#faf9f6] rounded-[0.25rem] border border-[#e5e2d9] max-w-lg w-full p-6 shadow-paper-floating space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded bg-[#ba5d1a]/10 text-[#ba5d1a]">
                  <Highlighter className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-lg text-[#171615]">
                    Highlight Document Passage
                  </h3>
                  <p className="text-xs text-[#78746d] truncate max-w-xs">
                    {asset.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsHighlightModalOpen(false)}
                className="p-1 text-[#78746d] hover:text-[#171615] rounded transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddHighlight} className="space-y-4">
              {/* Text to highlight */}
              <div>
                <label className="block text-xs font-semibold text-[#171615] uppercase tracking-wider mb-1.5">
                  Highlighted Quote / Passage *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Paste or enter the passage from the document..."
                  value={highlightText}
                  onChange={(e) => setHighlightText(e.target.value)}
                  className="w-full bg-[#ffffff] border border-[#ddd8cc] rounded-[0.25rem] text-xs p-3 text-[#171615] placeholder:text-[#78746d] outline-none focus:border-[#ba5d1a] resize-none font-editorial italic transition-colors"
                />
              </div>

              {/* Color & Category Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#171615] uppercase tracking-wider mb-1.5">
                  Highlighter Color &amp; Category
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setHighlightColor("yellow")}
                    className={`p-2 rounded-[0.25rem] border text-xs font-medium flex items-center gap-2 transition-all ${
                      highlightColor === "yellow"
                        ? "bg-amber-100 border-amber-500 text-amber-950 ring-1 ring-amber-400"
                        : "bg-white border-[#ddd8cc] text-[#78746d] hover:bg-amber-50/50"
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
                    <span>Concept</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHighlightColor("green")}
                    className={`p-2 rounded-[0.25rem] border text-xs font-medium flex items-center gap-2 transition-all ${
                      highlightColor === "green"
                        ? "bg-emerald-100 border-emerald-500 text-emerald-950 ring-1 ring-emerald-400"
                        : "bg-white border-[#ddd8cc] text-[#78746d] hover:bg-emerald-50/50"
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-emerald-400 shrink-0" />
                    <span>Evidence</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHighlightColor("rose")}
                    className={`p-2 rounded-[0.25rem] border text-xs font-medium flex items-center gap-2 transition-all ${
                      highlightColor === "rose"
                        ? "bg-rose-100 border-rose-500 text-rose-950 ring-1 ring-rose-400"
                        : "bg-white border-[#ddd8cc] text-[#78746d] hover:bg-rose-50/50"
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-rose-400 shrink-0" />
                    <span>Exam Note</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHighlightColor("ochre")}
                    className={`p-2 rounded-[0.25rem] border text-xs font-medium flex items-center gap-2 transition-all ${
                      highlightColor === "ochre"
                        ? "bg-orange-100 border-orange-500 text-orange-950 ring-1 ring-orange-400"
                        : "bg-white border-[#ddd8cc] text-[#78746d] hover:bg-orange-50/50"
                    }`}
                  >
                    <span className="w-3 h-3 rounded-full bg-orange-400 shrink-0" />
                    <span>Question</span>
                  </button>
                </div>
              </div>

              {/* Page Number & Reflection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-[#171615] uppercase tracking-wider mb-1">
                    Page Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 1, 14"
                    value={highlightPage}
                    onChange={(e) => setHighlightPage(e.target.value)}
                    className="w-full bg-[#ffffff] border border-[#ddd8cc] rounded-[0.25rem] text-xs p-2 text-[#171615] placeholder:text-[#78746d] outline-none focus:border-[#ba5d1a]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#171615] uppercase tracking-wider mb-1">
                    Study Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Essential theorem for exam"
                    value={highlightNote}
                    onChange={(e) => setHighlightNote(e.target.value)}
                    className="w-full bg-[#ffffff] border border-[#ddd8cc] rounded-[0.25rem] text-xs p-2 text-[#171615] placeholder:text-[#78746d] outline-none focus:border-[#ba5d1a]"
                  />
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e5e2d9]">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsHighlightModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  icon={<Check className="w-3.5 h-3.5" />}
                  disabled={!highlightText.trim()}
                >
                  Save Highlight
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Question / Tasks Import Modal */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-sans animate-in fade-in duration-150">
          <div className="bg-[#faf9f6] rounded-[0.25rem] border border-[#e5e2d9] max-w-lg w-full p-6 shadow-paper-floating space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded bg-[#ba5d1a]/10 text-[#ba5d1a]">
                  <ListPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif text-lg text-[#171615]">
                    Import Questions to Study Todos
                  </h3>
                  <p className="text-xs text-[#78746d]">
                    Convert a list of questions or problem sets into actionable study todos.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuestionModalOpen(false)}
                className="p-1 text-[#78746d] hover:text-[#171615] rounded transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleImportBulkQuestions} className="space-y-4">
              {/* Target Type Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#171615] uppercase tracking-wider mb-1.5">
                  Item Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkQuestionsType("question")}
                    className={`p-2 rounded-[0.25rem] border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                      bulkQuestionsType === "question"
                        ? "bg-amber-100 border-amber-500 text-amber-950 ring-1 ring-amber-400 font-semibold"
                        : "bg-white border-[#ddd8cc] text-[#78746d] hover:bg-amber-50/50"
                    }`}
                  >
                    <HelpCircle className="w-3 h-3 text-amber-600" />
                    <span>Questions</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkQuestionsType("reading")}
                    className={`p-2 rounded-[0.25rem] border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                      bulkQuestionsType === "reading"
                        ? "bg-emerald-100 border-emerald-500 text-emerald-950 ring-1 ring-emerald-400 font-semibold"
                        : "bg-white border-[#ddd8cc] text-[#78746d] hover:bg-emerald-50/50"
                    }`}
                  >
                    <BookOpen className="w-3 h-3 text-emerald-600" />
                    <span>Reading List</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBulkQuestionsType("task")}
                    className={`p-2 rounded-[0.25rem] border text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                      bulkQuestionsType === "task"
                        ? "bg-stone-200 border-stone-500 text-stone-950 ring-1 ring-stone-400 font-semibold"
                        : "bg-white border-[#ddd8cc] text-[#78746d] hover:bg-stone-100"
                    }`}
                  >
                    <CheckSquare className="w-3 h-3 text-stone-600" />
                    <span>Tasks</span>
                  </button>
                </div>
              </div>

              {/* Questions Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[#171615] uppercase tracking-wider">
                    Paste Questions (One per line) *
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setBulkQuestionsInput(
                        "1. What is the fundamental theorem of calculus and how is it proven?\n2. Explain the intuition behind Euler-Lagrange equations.\n3. How do we derive Bayes' rule from conditional probability?"
                      )
                    }
                    className="text-[0.625rem] text-[#ba5d1a] hover:underline"
                  >
                    Insert Sample Questions
                  </button>
                </div>
                <textarea
                  rows={5}
                  required
                  placeholder={"1. What are the key properties of eigenvalues?\n2. How does gradient descent converge on convex surfaces?\n3. Explain the bias-variance tradeoff with an example."}
                  value={bulkQuestionsInput}
                  onChange={(e) => setBulkQuestionsInput(e.target.value)}
                  className="w-full bg-[#ffffff] border border-[#ddd8cc] rounded-[0.25rem] text-xs p-3 text-[#171615] placeholder:text-[#78746d] outline-none focus:border-[#ba5d1a] resize-none font-mono transition-colors"
                />
                <div className="flex items-center justify-between mt-1 text-[0.6875rem] text-[#78746d]">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#234338]" />
                    <span>
                      {parseQuestionsList(bulkQuestionsInput).length} item
                      {parseQuestionsList(bulkQuestionsInput).length === 1 ? "" : "s"} detected
                    </span>
                  </span>
                  <span className="italic text-[0.625rem]">
                    Numbered (&apos;1.&apos;), bulleted (&apos;-&apos;), or plain lines are cleanly parsed
                  </span>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e5e2d9]">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsQuestionModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  icon={<ListPlus className="w-3.5 h-3.5" />}
                  disabled={parseQuestionsList(bulkQuestionsInput).length === 0}
                >
                  Convert to {parseQuestionsList(bulkQuestionsInput).length} Todos
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
