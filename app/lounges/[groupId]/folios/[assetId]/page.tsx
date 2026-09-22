"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
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
import { RouteTransition } from "@/components/motion/RouteTransition";

export interface HighlightItem {
  id: string;
  text: string;
  color: "yellow" | "green" | "rose" | "ochre"; // Mapped to Concept, Evidence, Exam, Question
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
 * Lightweight Markdown Parser and Renderer (§6.4)
 * High-contrast monochrome typography with drop cap and hairline rules
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
        <p
          key={elements.length}
          className="font-serif text-base sm:text-lg leading-[1.85] text-[var(--text-primary)]"
        >
          <span className="float-left text-5xl font-serif pr-3 pt-1 text-[var(--text-primary)] leading-none font-normal">
            {firstChar}
          </span>
          {renderInlineFormatting(rest)}
        </p>
      );
    } else {
      elements.push(
        <p
          key={elements.length}
          className="font-serif text-base sm:text-lg leading-[1.85] text-[var(--text-primary)]"
        >
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
        className="p-4 bg-[var(--bg-inset)] text-[var(--text-primary)] rounded-[var(--radius-button)] font-mono text-xs overflow-x-auto my-4 border border-[var(--border-hairline)]"
      >
        <code>{code}</code>
      </pre>
    );
  }

  function renderInlineFormatting(raw: string): React.ReactNode {
    const parts = raw.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-semibold text-[var(--text-primary)]">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return (
          <em key={i} className="italic text-[var(--text-primary)]">
            {part.slice(1, -1)}
          </em>
        );
      }
      return part;
    });
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const trimmed = line.trim();

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

    if (!trimmed) {
      flushParagraph();
      continue;
    }

    if (trimmed.startsWith("### ")) {
      flushParagraph();
      elements.push(
        <h3
          key={elements.length}
          className="font-serif text-xl font-normal text-[var(--text-primary)] mt-6 mb-2"
        >
          {trimmed.replace(/^###\s+/, "")}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushParagraph();
      elements.push(
        <h2
          key={elements.length}
          className="font-serif text-2xl font-normal text-[var(--text-primary)] mt-8 mb-3 pb-2 border-b border-[var(--border-hairline)]"
        >
          {trimmed.replace(/^##\s+/, "")}
        </h2>
      );
      continue;
    }
    if (trimmed.startsWith("# ")) {
      flushParagraph();
      elements.push(
        <h1
          key={elements.length}
          className="font-serif text-3xl sm:text-4xl font-normal text-[var(--text-primary)] mt-6 mb-4"
        >
          {trimmed.replace(/^#\s+/, "")}
        </h1>
      );
      continue;
    }

    if (trimmed.startsWith("> ")) {
      flushParagraph();
      elements.push(
        <blockquote
          key={elements.length}
          className="p-4 bg-[var(--bg-inset)] border-l-2 border-[var(--text-primary)] border-y border-r border-[var(--border-hairline)] rounded-[var(--radius-button)] font-serif italic text-base sm:text-lg text-[var(--text-secondary)] my-4"
        >
          {renderInlineFormatting(trimmed.replace(/^>\s+/, ""))}
        </blockquote>
      );
      continue;
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      flushParagraph();
      elements.push(
        <li
          key={elements.length}
          className="font-serif text-base text-[var(--text-primary)] ml-6 list-disc mb-1.5"
        >
          {renderInlineFormatting(trimmed.replace(/^[-*]\s+/, ""))}
        </li>
      );
      continue;
    }

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
    <div className="mt-2.5 pt-2 border-t border-[var(--border-hairline)] space-y-2">
      <div className="flex items-center justify-between text-[0.6875rem] font-mono">
        <span className="text-[var(--text-secondary)] flex items-center gap-1">
          <BookOpen className="w-3 h-3 text-[var(--text-primary)]" />
          Solution &amp; Study Notes
        </span>
        {isSaved && <span className="text-[var(--text-primary)]">✓ Saved</span>}
      </div>
      <textarea
        rows={2}
        placeholder="Draft your answer, solution notes, or key takeaway here..."
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="w-full bg-[var(--bg-inset)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] text-xs p-2 text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--border-focus)] resize-none transition-colors font-sans"
      />
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="px-2.5 py-1 text-[0.6875rem] font-mono font-medium text-[var(--invert-text)] bg-[var(--invert-bg)] hover:bg-white rounded-[var(--radius-button)] transition-colors cursor-pointer"
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
  const shouldReduceMotion = useReducedMotion();

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

  // Highlighting state & tools (§6.4)
  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  const [isHighlightModalOpen, setIsHighlightModalOpen] = useState(false);
  const [highlightText, setHighlightText] = useState("");
  const [highlightColor, setHighlightColor] = useState<"yellow" | "green" | "rose" | "ochre">("yellow");
  const [highlightPage, setHighlightPage] = useState("1");
  const [highlightNote, setHighlightNote] = useState("");
  const [copiedHighlightId, setCopiedHighlightId] = useState<string | null>(null);
  const [activeHighlightFilter, setActiveHighlightFilter] = useState<string>("all");

  // Selection toolbar state (§6.4)
  const [selectionToolbar, setSelectionToolbar] = useState<{
    text: string;
    x: number;
    y: number;
  } | null>(null);

  const articleRef = useRef<HTMLElement>(null);

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
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.18);
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
    setTimerSecondsLeft(sec);
    setTimerInitialSeconds(sec);
  }

  function handleResetTimer() {
    setIsTimerRunning(false);
    setTimerJustFinished(false);
    if (timerMode === "stopwatch") {
      setTimerSecondsLeft(0);
    } else {
      setTimerSecondsLeft(timerInitialSeconds);
    }
  }

  function handleSetCustomTimer(e: React.FormEvent) {
    e.preventDefault();
    const mins = parseInt(customTimerMinutes, 10);
    if (!isNaN(mins) && mins > 0) {
      setIsTimerRunning(false);
      setTimerJustFinished(false);
      const totalSec = mins * 60;
      setTimerSecondsLeft(totalSec);
      setTimerInitialSeconds(totalSec);
    }
  }

  function formatTime(totalSeconds: number): string {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  // Load asset metadata & text content
  const fetchAssetData = useCallback(async () => {
    if (!groupId || !assetId) return;
    setIsLoading(true);
    setError(null);

    try {
      const [groupRes, assetsRes] = await Promise.all([
        fetch(`/api/groups/${groupId}`),
        fetch(`/api/assets?groupId=${groupId}`),
      ]);

      if (groupRes.ok) {
        const groupData = await groupRes.json();
        setGroupName(groupData.group?.name || "Study Group");
      }

      if (!assetsRes.ok) {
        throw new Error("Failed to load document metadata");
      }

      const assetsData = await assetsRes.json();
      const currentAsset: AssetData | undefined = assetsData.assets?.find(
        (a: AssetData) => a.id === assetId
      );

      if (!currentAsset) {
        throw new Error("Document not found in this study group");
      }

      setAsset(currentAsset);

      // Fetch download URL
      const dlRes = await fetch(`/api/assets/${assetId}/download`);
      if (dlRes.ok) {
        const dlData = await dlRes.json();
        setDownloadUrl(dlData.downloadUrl);

        if (currentAsset.fileType === "md" || currentAsset.fileType === "transcript") {
          setIsLoadingContent(true);
          try {
            const textRes = await fetch(dlData.downloadUrl);
            if (textRes.ok) {
              const text = await textRes.text();
              setTextContent(text);
            }
          } catch (fetchErr) {
            console.warn("Could not read text content directly from URL:", fetchErr);
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
  }, [groupId, assetId]);

  useEffect(() => {
    fetchAssetData();
  }, [fetchAssetData]);

  // Selection toolbar listener (§6.4)
  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      const text = selection.toString().trim();
      if (text.length > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectionToolbar({
          text,
          x: rect.left + rect.width / 2,
          y: rect.top - 12,
        });
        return;
      }
    }
    setSelectionToolbar(null);
  };

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

    let detectedType = newTodoType;
    const trimmed = newTaskTitle.trim();
    if (
      trimmed.endsWith("?") ||
      /^(what|how|why|explain|define|derive|compare|does|is|can|describe)\b/i.test(trimmed)
    ) {
      detectedType = "question";
    }

    const authorName = user?.fullName || user?.firstName || "You";
    const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      title: trimmed,
      type: detectedType,
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
      <RouteTransition className="min-h-screen bg-[var(--bg-primary)] flex flex-col font-sans text-[var(--text-primary)]">
        <AppHeader />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
          <div className="h-6 w-1/4 rounded-[var(--radius-button)] skeleton-shimmer" />
          <div className="h-10 w-2/3 rounded-[var(--radius-button)] skeleton-shimmer" />
          <div className="h-[70vh] rounded-[var(--radius-card)] skeleton-shimmer" />
        </main>
      </RouteTransition>
    );
  }

  if (error || !asset) {
    return (
      <RouteTransition className="min-h-screen bg-[var(--bg-primary)] flex flex-col font-sans text-[var(--text-primary)]">
        <AppHeader />
        <main className="flex-1 max-w-2xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="w-12 h-12 text-[var(--text-primary)] mx-auto mb-4" />
          <h2 className="font-serif text-2xl font-normal text-[var(--text-primary)] mb-2">
            Document Notice
          </h2>
          <p className="font-sans text-xs text-[var(--text-secondary)] mb-6">
            {error || "The requested document could not be loaded."}
          </p>
          <div className="flex justify-center gap-3">
            <Link href={`/lounges/${groupId}`}>
              <Button variant="secondary" size="md">
                Return to Group Workspace
              </Button>
            </Link>
            <Button variant="primary" size="md" onClick={fetchAssetData}>
              Try Again
            </Button>
          </div>
        </main>
      </RouteTransition>
    );
  }

  const formattedDate = new Date(asset.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const citationText = `"${asset.title}." StudyGroup+ Repository, ${groupName}, ${new Date(asset.createdAt).getFullYear()}.`;

  const filteredHighlights = highlights.filter((hl) => {
    if (activeHighlightFilter === "all") return true;
    return hl.color === activeHighlightFilter;
  });

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
    <RouteTransition className="min-h-screen bg-[var(--bg-primary)] flex flex-col font-sans text-[var(--text-primary)] selection:bg-[var(--invert-bg)] selection:text-[var(--invert-text)]">
      {!isFocusMode && <AppHeader />}

      {/* Top Secondary Navigation Bar */}
      <div className="w-full bg-[var(--bg-elevated)] border-b border-[var(--border-hairline)] px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 font-sans text-xs shrink-0 z-20">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[var(--text-secondary)] font-mono">
          <Link
            href={`/lounges/${groupId}`}
            className="hover:text-[var(--text-primary)] transition-colors flex items-center gap-1 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {groupName}
          </Link>
          <span className="text-[var(--text-disabled)]">/</span>
          <span>Documents</span>
          <span className="text-[var(--text-disabled)]">/</span>
          <span className="text-[var(--text-primary)] font-sans font-medium truncate max-w-xs">
            {asset.title}
          </span>
        </div>

        {/* Center Controls: Zoom, File Type & Quick Study Timer */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Zoom (§6.4 Centered scaling) */}
          <div className="flex items-center gap-1 bg-[var(--bg-inset)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] px-2 py-0.5 text-[0.6875rem] font-mono">
            <button
              type="button"
              onClick={() => setZoomLevel(Math.max(75, zoomLevel - 10))}
              className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="font-medium text-[var(--text-primary)]">{zoomLevel}%</span>
            <button
              type="button"
              onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))}
              className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          <Badge variant="neutral">
            {asset.fileType.toUpperCase()}
          </Badge>

          {/* Quick Study Timer in Navigation Bar */}
          <div className="flex items-center gap-1.5 bg-[var(--bg-inset)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] px-2.5 py-0.5 text-[0.6875rem] text-[var(--text-primary)]">
            <button
              type="button"
              onClick={() => {
                if (!isSidebarOpen) setIsSidebarOpen(true);
                setIsTimerExpanded(true);
              }}
              className="flex items-center gap-1.5 hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title="View Focus Timer in Study Tools"
            >
              <Timer className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
              <span className="font-mono font-medium">{formatTime(timerSecondsLeft)}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="p-0.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              title={isTimerRunning ? "Pause timer" : "Start timer"}
            >
              {isTimerRunning ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5 fill-current" />}
            </button>
            <button
              type="button"
              onClick={handleResetTimer}
              className="p-0.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
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
            className="px-2.5 py-1 text-xs text-[var(--invert-text)] bg-[var(--invert-bg)] hover:bg-white rounded-[var(--radius-button)] transition-colors flex items-center gap-1.5 font-medium cursor-pointer shadow-none"
            title="Highlight passage in document"
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span>Highlight</span>
            {highlights.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-[var(--bg-primary)]/20 font-mono text-[0.625rem]">
                {highlights.length}
              </span>
            )}
          </button>

          {/* Full Screen / Focus Mode Toggle */}
          <button
            type="button"
            onClick={() => setIsFocusMode(!isFocusMode)}
            className={`p-1.5 rounded-[var(--radius-button)] border transition-colors cursor-pointer ${
              isFocusMode
                ? "bg-[var(--invert-bg)] text-[var(--invert-text)] border-[var(--invert-bg)]"
                : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-hairline)]"
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
              className="px-2.5 py-1 text-xs text-[var(--text-primary)] hover:border-[var(--border-hover)] rounded-[var(--radius-button)] border border-[var(--border-hairline)] bg-[var(--bg-elevated)] transition-colors flex items-center gap-1.5 font-mono cursor-pointer"
              title="Download file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </a>
          )}

          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-1.5 rounded-[var(--radius-button)] border transition-colors cursor-pointer ${
              isSidebarOpen
                ? "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-hairline)]"
                : "bg-[var(--bg-overlay)] text-[var(--text-primary)] border-[var(--border-hover)]"
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
          data-inertia-scroll
          className={`flex-1 flex flex-col overflow-hidden ${
            asset.fileType === "pdf"
              ? "p-0 m-0 w-full h-full bg-[var(--bg-inset)]"
              : "overflow-y-auto px-4 sm:px-8 py-8 flex justify-center"
          }`}
        >
          {/* PDF Document View */}
          {asset.fileType === "pdf" ? (
            <div className="w-full h-full flex-1 flex flex-col overflow-hidden">
              <div className="px-4 py-2 bg-[var(--bg-elevated)] border-b border-[var(--border-hairline)] flex items-center justify-between gap-4 text-xs text-[var(--text-primary)] shrink-0">
                <div className="flex items-center gap-3">
                  <span className="font-serif font-normal text-sm text-[var(--text-primary)] truncate max-w-md">
                    {asset.title}
                  </span>
                  <Badge variant="neutral" className="hidden sm:inline-flex">
                    PDF • {(asset.sizeBytes / 1024 / 1024).toFixed(2)} MB
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsHighlightModalOpen(true)}
                    className="px-2.5 py-1 rounded-[var(--radius-button)] bg-[var(--invert-bg)] text-[var(--invert-text)] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Highlight text or passage from PDF"
                  >
                    <Highlighter className="w-3.5 h-3.5" />
                    <span>Highlight Passage</span>
                    {highlights.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.2 rounded-full bg-[var(--bg-primary)]/20 font-mono text-[0.625rem]">
                        {highlights.length}
                      </span>
                    )}
                  </button>

                  {downloadUrl && (
                    <a
                      href={downloadUrl}
                      download={asset.title}
                      className="px-2.5 py-1 bg-[var(--bg-inset)] hover:bg-[var(--bg-overlay)] text-[var(--text-primary)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] transition-colors flex items-center gap-1.5 font-mono"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Download PDF</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Edge-to-Edge Full Height PDF Viewer */}
              {downloadUrl ? (
                <div className="w-full flex-1 h-full min-h-[calc(100vh-7.5rem)] relative bg-[var(--bg-inset)]">
                  <iframe
                    src={`${downloadUrl}${downloadUrl.includes("?") ? "&" : "?"}inline=true#view=FitH&toolbar=1`}
                    className="w-full h-full border-0 absolute inset-0"
                    title={asset.title}
                  />
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-xs text-[var(--text-secondary)]">
                  <FileText className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-3 opacity-60" />
                  <p className="font-serif text-base text-[var(--text-primary)] mb-2">PDF Document Ready</p>
                  <p className="max-w-md mb-4 text-[var(--text-secondary)]">The document is stored in the repository. Please download to view.</p>
                </div>
              )}
            </div>
          ) : (
            /* Markdown Document View with Centered Scaling (§6.4) */
            <div
              style={{
                zoom: `${zoomLevel}%`,
                transformOrigin: "center center",
              }}
              className={`w-full ${isFocusMode ? "max-w-6xl" : "max-w-4xl"} transition-all duration-[var(--dur-base)] ease-[var(--ease-out-quart)]`}
            >
              {/* Reading Column Entrance (§6.4 - fades up 12px over 600ms) */}
              <motion.article
                ref={articleRef}
                onMouseUp={handleMouseUp}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: shouldReduceMotion ? 0.15 : 0.6,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="w-full bg-[var(--bg-elevated)] rounded-[var(--radius-card)] border border-[var(--border-hairline)] p-8 sm:p-14 relative"
              >
                {/* Header Metadata */}
                <div className="border-b border-[var(--border-hairline)] pb-6 mb-8 flex items-center justify-between text-xs text-[var(--text-secondary)] font-mono">
                  <span className="uppercase tracking-[0.08em]">
                    {groupName} • Study Document
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[var(--text-secondary)]">
                      Added {formattedDate}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsHighlightModalOpen(true)}
                      className="px-2 py-0.5 rounded-[var(--radius-button)] bg-[var(--bg-inset)] hover:bg-[var(--bg-overlay)] border border-[var(--border-hairline)] text-[var(--text-primary)] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Highlighter className="w-3 h-3" />
                      <span>Highlight</span>
                    </button>
                  </div>
                </div>

                {/* Document Title */}
                <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[var(--text-primary)] mb-3 leading-tight">
                  {asset.title}
                </h1>
                <p className="font-mono text-xs text-[var(--text-secondary)] mb-10 pb-6 border-b border-[var(--border-hairline)]">
                  {(asset.sizeBytes / 1024).toFixed(1)} KB • Markdown Document
                </p>

                {/* Real Markdown Content */}
                {isLoadingContent ? (
                  <div className="space-y-4">
                    <div className="h-4 rounded-[var(--radius-button)] skeleton-shimmer w-full" />
                    <div className="h-4 rounded-[var(--radius-button)] skeleton-shimmer w-5/6" />
                    <div className="h-4 rounded-[var(--radius-button)] skeleton-shimmer w-4/6" />
                  </div>
                ) : textContent ? (
                  <MarkdownRenderer content={textContent} />
                ) : (
                  <div className="p-8 bg-[var(--bg-inset)] border border-dashed border-[var(--border-hairline)] rounded-[var(--radius-card)] text-center text-xs text-[var(--text-secondary)]">
                    <FileText className="w-8 h-8 text-[var(--text-secondary)] mx-auto mb-2 opacity-50" />
                    <p className="font-medium text-[var(--text-primary)] mb-1">Document Content Unavailable</p>
                    <p>The text content could not be read from storage. Please re-upload this document.</p>
                  </div>
                )}
              </motion.article>

              {/* PPTX Slide Deck View */}
              {asset.fileType === "pptx" && (
                <div className="w-full bg-[var(--bg-elevated)] rounded-[var(--radius-card)] border border-[var(--border-hairline)] p-8 sm:p-12 text-center">
                  <Presentation className="w-16 h-16 text-[var(--text-secondary)] mx-auto mb-4" />
                  <h2 className="font-serif text-2xl font-normal text-[var(--text-primary)] mb-2">{asset.title}</h2>
                  <p className="font-mono text-xs text-[var(--text-secondary)] mb-6">
                    Microsoft PowerPoint Slide Deck • {(asset.sizeBytes / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <p className="font-sans text-xs text-[var(--text-secondary)] max-w-md mx-auto mb-8 leading-relaxed">
                    Slide presentations can be downloaded directly to open in PowerPoint, Keynote, or Google Slides.
                  </p>
                  {downloadUrl && (
                    <a
                      href={downloadUrl}
                      download={asset.title}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--invert-bg)] hover:bg-white text-[var(--invert-text)] text-sm font-semibold rounded-[var(--radius-button)] transition-colors shadow-none"
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

        {/* Selection Toolbar (§6.4 8px rise + fade above selection) */}
        <AnimatePresence>
          {selectionToolbar && (
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              transition={{ duration: 0.2, ease: [0.25, 1, 0.5, 1] }}
              style={{
                position: "fixed",
                left: selectionToolbar.x,
                top: selectionToolbar.y,
                transform: "translate(-50%, -100%)",
                zIndex: 40,
              }}
              className="flex items-center gap-1.5 p-1.5 rounded-[var(--radius-button)] bg-[var(--bg-elevated)] border border-[var(--border-hairline)] shadow-none font-mono text-xs"
            >
              <button
                type="button"
                onClick={() => {
                  setHighlightText(selectionToolbar.text);
                  setIsHighlightModalOpen(true);
                  setSelectionToolbar(null);
                }}
                className="px-2.5 py-1 rounded-[calc(var(--radius-button)-2px)] bg-[var(--invert-bg)] text-[var(--invert-text)] font-semibold hover:bg-white transition-colors cursor-pointer"
              >
                Highlight
              </button>
              <button
                type="button"
                onClick={() => {
                  setNewTaskTitle(selectionToolbar.text);
                  setNewTodoType("question");
                  if (!isSidebarOpen) setIsSidebarOpen(true);
                  setSidebarTab("checklist");
                  setSelectionToolbar(null);
                }}
                className="px-2.5 py-1 rounded-[calc(var(--radius-button)-2px)] bg-[var(--bg-inset)] border border-[var(--border-hairline)] text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-colors cursor-pointer"
              >
                + Question
              </button>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(`"${selectionToolbar.text}"`);
                  setSelectionToolbar(null);
                }}
                className="px-2 py-1 rounded-[calc(var(--radius-button)-2px)] bg-[var(--bg-inset)] border border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                Copy
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Sidebar ("Study Tools" Monochrome System) */}
        {isSidebarOpen && (
          <aside className="w-96 bg-[var(--bg-elevated)] border-l border-[var(--border-hairline)] flex flex-col shrink-0 font-sans overflow-hidden">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-[var(--border-hairline)]">
              <h3 className="font-serif text-lg font-normal text-[var(--text-primary)]">
                Study Tools
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-mono mt-0.5 truncate">
                {groupName} • {asset.title}
              </p>
            </div>

            {/* Study Focus Timer Widget */}
            <div className="border-b border-[var(--border-hairline)] bg-[var(--bg-elevated)]">
              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-[var(--radius-button)] transition-colors ${
                      isTimerRunning
                        ? "bg-[var(--invert-bg)] text-[var(--invert-text)]"
                        : "bg-[var(--bg-inset)] text-[var(--text-primary)] border border-[var(--border-hairline)]"
                    }`}
                  >
                    <Timer className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xl font-bold tracking-tight text-[var(--text-primary)]">
                        {formatTime(timerSecondsLeft)}
                      </span>
                      <span className="font-mono text-[0.625rem] uppercase tracking-wider px-1.5 py-0.5 rounded-[var(--radius-button)] bg-[var(--bg-inset)] border border-[var(--border-hairline)] text-[var(--text-secondary)]">
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
                    className="px-2.5 py-1 rounded-[var(--radius-button)] text-xs font-mono font-medium flex items-center gap-1 transition-colors bg-[var(--invert-bg)] text-[var(--invert-text)] hover:bg-white cursor-pointer"
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
                    className="p-1.5 rounded-[var(--radius-button)] border border-[var(--border-hairline)] bg-[var(--bg-inset)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    title="Reset timer"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsTimerExpanded(!isTimerExpanded)}
                    className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    title={isTimerExpanded ? "Collapse timer presets" : "Expand timer presets"}
                  >
                    {isTimerExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Finished Alert */}
              {timerJustFinished && (
                <div className="mx-3.5 mb-3 p-2.5 bg-[var(--bg-inset)] border border-[var(--border-hover)] rounded-[var(--radius-card)] flex items-center justify-between text-xs text-[var(--text-primary)]">
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
                    className="px-2 py-0.5 text-[0.625rem] font-mono bg-[var(--invert-bg)] text-[var(--invert-text)] rounded-[var(--radius-button)] transition-colors cursor-pointer"
                  >
                    Take 5m Break
                  </button>
                </div>
              )}

              {/* Expanded Presets & Custom Duration */}
              {isTimerExpanded && (
                <div className="px-3.5 pb-3.5 pt-2 space-y-3 border-t border-[var(--border-hairline)] bg-[var(--bg-inset)]">
                  <div>
                    <span className="block font-mono text-[0.625rem] font-medium uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                      Session Presets
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
                      <button
                        type="button"
                        onClick={() => handleSetPreset("focus")}
                        className={`px-2 py-1.5 rounded-[var(--radius-button)] border text-left flex items-center gap-1.5 transition-colors cursor-pointer ${
                          timerMode === "focus"
                            ? "bg-[var(--bg-elevated)] border-[var(--border-focus)] text-[var(--text-primary)]"
                            : "bg-[var(--bg-inset)] border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        <span>🍅</span>
                        <span>25m Focus</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetPreset("deep")}
                        className={`px-2 py-1.5 rounded-[var(--radius-button)] border text-left flex items-center gap-1.5 transition-colors cursor-pointer ${
                          timerMode === "deep"
                            ? "bg-[var(--bg-elevated)] border-[var(--border-focus)] text-[var(--text-primary)]"
                            : "bg-[var(--bg-inset)] border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        <BookOpen className="w-3 h-3" />
                        <span>50m Deep</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetPreset("shortBreak")}
                        className={`px-2 py-1.5 rounded-[var(--radius-button)] border text-left flex items-center gap-1.5 transition-colors cursor-pointer ${
                          timerMode === "shortBreak"
                            ? "bg-[var(--bg-elevated)] border-[var(--border-focus)] text-[var(--text-primary)]"
                            : "bg-[var(--bg-inset)] border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        <Coffee className="w-3 h-3" />
                        <span>5m Break</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetPreset("stopwatch")}
                        className={`px-2 py-1.5 rounded-[var(--radius-button)] border text-left flex items-center gap-1.5 transition-colors cursor-pointer ${
                          timerMode === "stopwatch"
                            ? "bg-[var(--bg-elevated)] border-[var(--border-focus)] text-[var(--text-primary)]"
                            : "bg-[var(--bg-inset)] border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        <Timer className="w-3 h-3" />
                        <span>Stopwatch</span>
                      </button>
                    </div>
                  </div>

                  {/* Custom duration input */}
                  <form onSubmit={handleSetCustomTimer} className="flex items-center gap-2 pt-1 font-mono text-xs">
                    <span className="text-[0.6875rem] text-[var(--text-secondary)] whitespace-nowrap">Custom:</span>
                    <input
                      type="number"
                      min={1}
                      max={180}
                      value={customTimerMinutes}
                      onChange={(e) => setCustomTimerMinutes(e.target.value)}
                      placeholder="Mins"
                      className="w-16 bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] text-xs px-2 py-1 text-[var(--text-primary)] outline-none focus:border-[var(--border-focus)]"
                    />
                    <span className="text-[0.6875rem] text-[var(--text-secondary)]">min</span>
                    <button
                      type="submit"
                      className="px-2.5 py-1 text-xs bg-[var(--bg-elevated)] border border-[var(--border-hairline)] hover:border-[var(--border-hover)] text-[var(--text-primary)] rounded-[var(--radius-button)] transition-colors cursor-pointer"
                    >
                      Set
                    </button>
                  </form>

                  {/* Progress & Stats */}
                  <div className="flex items-center justify-between text-[0.6875rem] pt-1 border-t border-[var(--border-hairline)] text-[var(--text-secondary)] font-mono">
                    <div className="flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-[var(--text-primary)]" />
                      <span>{pomodorosCompleted} focus session{pomodorosCompleted === 1 ? "" : "s"} done</span>
                    </div>
                    {timerMode !== "stopwatch" && timerInitialSeconds > 0 && (
                      <span>
                        {Math.round(((timerInitialSeconds - timerSecondsLeft) / timerInitialSeconds) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Tabs (§5 layout transition) */}
            <div className="px-4 pt-2 flex gap-2 border-b border-[var(--border-hairline)] text-xs font-mono">
              {[
                { key: "highlights", label: `Highlights (${highlights.length})` },
                { key: "notes", label: `Notes (${marginalNotes.length})` },
                { key: "checklist", label: `Tasks (${checklist.length})` },
              ].map((tab) => {
                const isActive = sidebarTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setSidebarTab(tab.key as typeof sidebarTab)}
                    className={`relative pb-2 px-1 transition-colors duration-[var(--dur-fast)] cursor-pointer ${
                      isActive
                        ? "text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeReaderSidebarTab"
                        transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--text-primary)]"
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Sidebar Body */}
            <div className="flex-1 p-5 overflow-y-auto space-y-6">
              {/* Highlights Tab (§6.4 Clip-path sweep, monochrome classification) */}
              {sidebarTab === "highlights" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                      Key Highlights
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsHighlightModalOpen(true)}
                      className="text-[var(--text-primary)] hover:underline font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Highlight
                    </button>
                  </div>

                  {/* Highlight Classification Filter */}
                  {highlights.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[0.6875rem] font-mono">
                      {[
                        { key: "all", label: `All (${highlights.length})` },
                        { key: "yellow", label: "[CONCEPT]" },
                        { key: "green", label: "[EVIDENCE]" },
                        { key: "rose", label: "[EXAM NOTE]" },
                        { key: "ochre", label: "[QUESTION]" },
                      ].map((f) => (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() => setActiveHighlightFilter(f.key)}
                          className={`px-2 py-0.5 rounded-[var(--radius-button)] border transition-colors cursor-pointer ${
                            activeHighlightFilter === f.key
                              ? "bg-[var(--invert-bg)] text-[var(--invert-text)] border-[var(--invert-bg)]"
                              : "bg-[var(--bg-inset)] text-[var(--text-secondary)] border-[var(--border-hairline)] hover:text-[var(--text-primary)]"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Highlights List with clip-path sweep reveal */}
                  {filteredHighlights.length === 0 ? (
                    <div className="p-5 bg-[var(--bg-inset)] border border-dashed border-[var(--border-hairline)] rounded-[var(--radius-card)] text-center text-xs text-[var(--text-secondary)]">
                      <Highlighter className="w-6 h-6 text-[var(--text-secondary)] mx-auto mb-2 opacity-60" />
                      <p className="font-medium text-[var(--text-primary)] mb-1">No highlights yet</p>
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
                        const categoryLabel =
                          hl.color === "yellow"
                            ? "CONCEPT"
                            : hl.color === "green"
                            ? "EVIDENCE"
                            : hl.color === "rose"
                            ? "EXAM NOTE"
                            : "QUESTION";

                        return (
                          <div
                            key={hl.id}
                            className="p-3.5 rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--bg-inset)] space-y-2 animate-highlight-sweep"
                          >
                            <div className="flex items-center justify-between text-[0.6875rem] font-mono">
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded-[calc(var(--radius-button)-2px)] border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium text-[0.625rem]">
                                  [{categoryLabel}]
                                </span>
                                {hl.pageNumber && (
                                  <span className="text-[var(--text-secondary)]">
                                    Pg {hl.pageNumber}
                                  </span>
                                )}
                              </div>
                              <span className="text-[var(--text-secondary)] text-[0.625rem]">{hl.createdAt}</span>
                            </div>

                            <p className="font-serif italic text-xs leading-relaxed text-[var(--text-primary)]">
                              &ldquo;{hl.text}&rdquo;
                            </p>

                            {hl.note && (
                              <p className="text-[0.6875rem] text-[var(--text-secondary)] bg-[var(--bg-elevated)] p-1.5 rounded-[var(--radius-button)] border border-[var(--border-hairline)] font-sans">
                                <span className="font-medium text-[var(--text-primary)]">Note:</span> {hl.note}
                              </p>
                            )}

                            <div className="pt-2 border-t border-[var(--border-hairline)] flex items-center justify-between text-[0.6875rem] font-mono">
                              <span className="text-[var(--text-secondary)] text-[0.625rem]">{hl.author}</span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleCopyHighlightQuote(hl)}
                                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center gap-1 font-medium transition-colors cursor-pointer"
                                  title="Copy formatted quotation"
                                >
                                  {copiedHighlightId === hl.id ? (
                                    <>
                                      <Check className="w-3 h-3 text-[var(--text-primary)]" />
                                      <span className="text-[var(--text-primary)]">Copied</span>
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
                                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
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

              {/* Tasks & Questions Tab (§6.4) */}
              {sidebarTab === "checklist" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                      Tasks &amp; Questions
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsQuestionModalOpen(true)}
                        className="px-2 py-0.5 rounded-[var(--radius-button)] bg-[var(--bg-inset)] hover:bg-[var(--bg-overlay)] border border-[var(--border-hairline)] text-[var(--text-primary)] text-[0.6875rem] flex items-center gap-1 transition-colors cursor-pointer"
                        title="Import list of questions from syllabus or problem set"
                      >
                        <ListPlus className="w-3 h-3" />
                        <span>Import</span>
                      </button>
                      <span className="font-mono text-[0.6875rem] text-[var(--text-secondary)]">
                        {completedCount}/{checklist.length} Done
                      </span>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  {checklist.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[0.6875rem] font-mono">
                      {[
                        { key: "all", label: `All (${checklist.length})` },
                        { key: "question", label: `Questions (${questionCount})` },
                        { key: "reading", label: `Reading (${readingCount})` },
                        { key: "task", label: `Tasks (${taskCount})` },
                        { key: "pending", label: `In Progress (${checklist.length - completedCount})` },
                        { key: "completed", label: `Done (${completedCount})` },
                      ].map((tf) => (
                        <button
                          key={tf.key}
                          type="button"
                          onClick={() => setActiveTodoFilter(tf.key as typeof activeTodoFilter)}
                          className={`px-2 py-0.5 rounded-[var(--radius-button)] border transition-colors cursor-pointer ${
                            activeTodoFilter === tf.key
                              ? "bg-[var(--invert-bg)] text-[var(--invert-text)] border-[var(--invert-bg)]"
                              : "bg-[var(--bg-inset)] text-[var(--text-secondary)] border-[var(--border-hairline)] hover:text-[var(--text-primary)]"
                          }`}
                        >
                          {tf.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Question & Todo Cards List */}
                  {filteredChecklist.length === 0 ? (
                    <div className="p-5 bg-[var(--bg-inset)] border border-dashed border-[var(--border-hairline)] rounded-[var(--radius-card)] text-center text-xs text-[var(--text-secondary)] space-y-2 font-mono">
                      <HelpCircle className="w-6 h-6 text-[var(--text-secondary)] mx-auto opacity-50" />
                      <p className="text-[var(--text-primary)]">No items in this view</p>
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
                            className={`p-3.5 rounded-[var(--radius-card)] border space-y-2.5 transition-all duration-[var(--dur-fast)] ${
                              item.completed
                                ? "bg-[var(--bg-inset)] border-[var(--border-hairline)] opacity-70"
                                : "bg-[var(--bg-inset)] border-[var(--border-hairline)] hover:border-[var(--border-hover)]"
                            }`}
                          >
                            <div className="flex items-center justify-between text-[0.6875rem] font-mono">
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded-[calc(var(--radius-button)-2px)] border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium text-[0.625rem] uppercase">
                                  {isQuestion ? "QUESTION" : isReading ? "READING" : "TASK"}
                                </span>
                                {item.createdAt && (
                                  <span className="text-[var(--text-secondary)]">{item.createdAt}</span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDeleteTask(item.id)}
                                className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors p-0.5 cursor-pointer"
                                title="Delete task"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>

                            <div>
                              <p
                                className={`text-xs leading-relaxed ${
                                  isQuestion ? "font-serif text-sm font-normal text-[var(--text-primary)]" : "font-sans text-[var(--text-primary)]"
                                } ${item.completed ? "line-through opacity-70" : ""}`}
                              >
                                {item.title}
                              </p>
                            </div>

                            {isQuestion ? (
                              <div className="pt-1">
                                {item.completed ? (
                                  <div className="p-2 bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] flex items-center justify-between text-xs text-[var(--text-primary)]">
                                    <div className="flex items-center gap-1.5 font-mono text-[0.6875rem]">
                                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--text-primary)] shrink-0" />
                                      <span>
                                        Checked out {item.completedAt ? `at ${item.completedAt}` : ""}
                                      </span>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleChecklist(item.id)}
                                      className="text-[0.625rem] font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline transition-colors cursor-pointer"
                                    >
                                      Reopen
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleChecklist(item.id)}
                                    className="w-full py-1.5 px-3 bg-[var(--bg-elevated)] hover:bg-[var(--bg-overlay)] border border-[var(--border-hairline)] hover:border-[var(--border-hover)] text-[var(--text-primary)] rounded-[var(--radius-button)] text-xs font-mono flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
                                    <span className="text-xs text-[var(--text-secondary)] font-mono">
                                      {item.completed ? `Checked out (${item.assignee})` : `Mark completed`}
                                    </span>
                                  }
                                />
                              </div>
                            )}

                            {isQuestion && (
                              <div className="pt-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setExpandedAnswerTodoId(
                                      expandedAnswerTodoId === item.id ? null : item.id
                                    )
                                  }
                                  className="text-[0.6875rem] font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1 cursor-pointer"
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
                                  <p className="mt-1.5 text-[0.6875rem] font-serif italic text-[var(--text-secondary)] bg-[var(--bg-elevated)] p-2 rounded-[var(--radius-button)] border border-[var(--border-hairline)] line-clamp-2">
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
                    className="p-3.5 bg-[var(--bg-inset)] border border-[var(--border-hairline)] rounded-[var(--radius-card)] space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[0.625rem] font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                        New Item Type
                      </span>
                      <div className="flex items-center gap-1 font-mono">
                        <button
                          type="button"
                          onClick={() => setNewTodoType("question")}
                          className={`px-2 py-0.5 rounded-[var(--radius-button)] text-[0.625rem] transition-colors cursor-pointer ${
                            newTodoType === "question"
                              ? "bg-[var(--invert-bg)] text-[var(--invert-text)] font-medium"
                              : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-hairline)] hover:text-[var(--text-primary)]"
                          }`}
                        >
                          Question
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewTodoType("reading")}
                          className={`px-2 py-0.5 rounded-[var(--radius-button)] text-[0.625rem] transition-colors cursor-pointer ${
                            newTodoType === "reading"
                              ? "bg-[var(--invert-bg)] text-[var(--invert-text)] font-medium"
                              : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-hairline)] hover:text-[var(--text-primary)]"
                          }`}
                        >
                          Reading
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewTodoType("task")}
                          className={`px-2 py-0.5 rounded-[var(--radius-button)] text-[0.625rem] transition-colors cursor-pointer ${
                            newTodoType === "task"
                              ? "bg-[var(--invert-bg)] text-[var(--invert-text)] font-medium"
                              : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-hairline)] hover:text-[var(--text-primary)]"
                          }`}
                        >
                          Task
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
                        className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] text-xs p-2 text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--border-focus)] transition-colors font-sans"
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
                  </form>
                </div>
              )}

              {/* Marginal Notes Tab (§6.4 spring pop-in) */}
              {sidebarTab === "notes" && (
                <div className="space-y-4">
                  {marginalNotes.length === 0 ? (
                    <div className="p-4 bg-[var(--bg-inset)] border border-dashed border-[var(--border-hairline)] rounded-[var(--radius-card)] text-center text-xs text-[var(--text-secondary)] font-mono">
                      <p className="text-[var(--text-primary)] mb-0.5">No notes saved</p>
                      <p>Jot down reflections or discussion points below.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {marginalNotes.map((note) => (
                        <motion.div
                          key={note.id}
                          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 25,
                            duration: 0.25,
                          }}
                          className="p-3 bg-[var(--bg-inset)] border border-[var(--border-hairline)] rounded-[var(--radius-card)] space-y-1.5"
                        >
                          <div className="flex items-center justify-between text-[0.625rem] font-mono text-[var(--text-secondary)]">
                            <span className="text-[var(--text-primary)] font-medium">{note.author}</span>
                            <span>{note.timeAgo}</span>
                          </div>
                          <p className="font-serif italic text-xs text-[var(--text-primary)] leading-relaxed">
                            &ldquo;{note.text}&rdquo;
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {/* Append Marginal Note Form */}
                  <form onSubmit={handlePublishNote} className="p-4 bg-[var(--bg-inset)] border border-[var(--border-hairline)] rounded-[var(--radius-card)] space-y-3">
                    <span className="block font-mono text-[0.625rem] font-medium uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                      Add Note to Document
                    </span>

                    <textarea
                      rows={3}
                      placeholder="Write a note or observation..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      className="w-full bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] text-xs p-2.5 text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--border-focus)] resize-none transition-colors font-sans"
                    />

                    <div className="flex items-center justify-end pt-1">
                      <Button type="submit" variant="primary" size="sm" disabled={!newNoteText.trim()}>
                        Save Note
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              {/* Standard Citation Reference Card (§6.4 confirm morph) */}
              <div className="p-4 bg-[var(--bg-inset)] border border-[var(--border-hairline)] rounded-[var(--radius-card)] space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                    Citation Reference
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCitation}
                    className="text-xs text-[var(--text-primary)] hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    {copiedCitation ? (
                      <>
                        <Check className="w-3 h-3 text-[var(--text-primary)]" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy
                      </>
                    )}
                  </button>
                </div>
                <p className="font-serif italic text-xs leading-relaxed text-[var(--text-primary)]">
                  {citationText}
                </p>
              </div>
            </div>

            {/* Sidebar Footer */}
            <div className="p-3 border-t border-[var(--border-hairline)] flex items-center justify-between text-xs font-mono text-[var(--text-secondary)]">
              <button
                type="button"
                onClick={handleCopyCitation}
                className="hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" /> Copy Citation
              </button>
              <Link
                href={`/lounges/${groupId}`}
                className="hover:text-[var(--text-primary)] transition-colors flex items-center gap-1.5"
              >
                <Settings className="w-3.5 h-3.5" /> Workspace
              </Link>
            </div>
          </aside>
        )}
      </div>

      {/* Bottom Ribbon */}
      {!isFocusMode && (
        <footer className="h-10 bg-[var(--bg-elevated)] border-t border-[var(--border-hairline)] px-4 sm:px-6 flex items-center justify-between text-xs text-[var(--text-secondary)] font-mono shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-primary)]" />
              <span className="text-[var(--text-primary)]">{groupName}</span>
            </div>
            <span className="text-[var(--text-disabled)] hidden sm:inline">|</span>
            <span className="hidden sm:inline truncate max-w-sm">
              {asset.title}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[0.6875rem]">
            <span>Uploaded {formattedDate}</span>
            <span className="text-[var(--text-disabled)]">•</span>
            <span className="text-[var(--text-primary)] uppercase tracking-wider">
              Repository Synced
            </span>
            <span className="text-[var(--text-disabled)]">•</span>
            <span className="flex items-center gap-1.5 text-[#e5484d] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e5484d] animate-live-breathe" />
              <span>3 VIEWERS ACTIVE</span>
            </span>
          </div>
        </footer>
      )}

      {/* Add Highlight Modal (§5 Modal animation + Monochrome classification) */}
      <AnimatePresence>
        {isHighlightModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0.1 : 0.2 }}
              onClick={() => setIsHighlightModalOpen(false)}
              className="absolute inset-0 bg-[rgba(10,10,10,0.6)] backdrop-blur-xs"
            />
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              transition={{
                duration: shouldReduceMotion ? 0.15 : 0.45,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative bg-[var(--bg-elevated)] rounded-[var(--radius-modal)] border border-[var(--border-hairline)] max-w-lg w-full p-6 text-[var(--text-primary)] space-y-4 z-10 font-sans shadow-none"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-[var(--radius-button)] bg-[var(--bg-inset)] border border-[var(--border-hairline)] text-[var(--text-primary)]">
                    <Highlighter className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-normal text-[var(--text-primary)]">
                      Highlight Document Passage
                    </h3>
                    <p className="font-mono text-xs text-[var(--text-secondary)] truncate max-w-xs">
                      {asset.title}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHighlightModalOpen(false)}
                  className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-button)] transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddHighlight} className="space-y-4">
                <div>
                  <label className="block font-mono text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                    Highlighted Quote / Passage *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Paste or enter the passage from the document..."
                    value={highlightText}
                    onChange={(e) => setHighlightText(e.target.value)}
                    className="w-full bg-[var(--bg-inset)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] text-xs p-3 text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--border-focus)] resize-none font-serif italic transition-colors"
                  />
                </div>

                {/* Monochrome Classification Selector (Gate Resolution) */}
                <div>
                  <label className="block font-mono text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                    Category Tag (Monochrome System)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
                    {[
                      { key: "yellow", label: "Concept", tag: "[CONCEPT]" },
                      { key: "green", label: "Evidence", tag: "[EVIDENCE]" },
                      { key: "rose", label: "Exam Note", tag: "[EXAM NOTE]" },
                      { key: "ochre", label: "Question", tag: "[QUESTION]" },
                    ].map((cat) => (
                      <button
                        key={cat.key}
                        type="button"
                        onClick={() => setHighlightColor(cat.key as typeof highlightColor)}
                        className={`p-2 rounded-[var(--radius-button)] border text-xs flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          highlightColor === cat.key
                            ? "bg-[var(--invert-bg)] text-[var(--invert-text)] border-[var(--invert-bg)] font-medium"
                            : "bg-[var(--bg-inset)] border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                        }`}
                      >
                        <span className="text-[0.625rem] tracking-wider">{cat.tag}</span>
                        <span className="font-sans text-[0.6875rem]">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                  <div className="sm:col-span-1">
                    <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                      Page Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1, 14"
                      value={highlightPage}
                      onChange={(e) => setHighlightPage(e.target.value)}
                      className="w-full bg-[var(--bg-inset)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] text-xs p-2 text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--border-focus)] font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                      Study Note (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Essential theorem for exam"
                      value={highlightNote}
                      onChange={(e) => setHighlightNote(e.target.value)}
                      className="w-full bg-[var(--bg-inset)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] text-xs p-2 text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--border-focus)] font-sans"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-hairline)]">
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bulk Question / Tasks Import Modal */}
      <AnimatePresence>
        {isQuestionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: shouldReduceMotion ? 0.1 : 0.2 }}
              onClick={() => setIsQuestionModalOpen(false)}
              className="absolute inset-0 bg-[rgba(10,10,10,0.6)] backdrop-blur-xs"
            />
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              transition={{
                duration: shouldReduceMotion ? 0.15 : 0.45,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="relative bg-[var(--bg-elevated)] rounded-[var(--radius-modal)] border border-[var(--border-hairline)] max-w-lg w-full p-6 text-[var(--text-primary)] space-y-4 z-10 font-sans shadow-none"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-[var(--radius-button)] bg-[var(--bg-inset)] border border-[var(--border-hairline)] text-[var(--text-primary)]">
                    <ListPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-normal text-[var(--text-primary)]">
                      Import Questions to Study Todos
                    </h3>
                    <p className="font-mono text-xs text-[var(--text-secondary)]">
                      Convert a list of questions into actionable study todos.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-button)] transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleImportBulkQuestions} className="space-y-4">
                <div>
                  <label className="block font-mono text-xs text-[var(--text-secondary)] uppercase tracking-wider mb-1.5">
                    Item Category
                  </label>
                  <div className="grid grid-cols-3 gap-2 font-mono">
                    <button
                      type="button"
                      onClick={() => setBulkQuestionsType("question")}
                      className={`p-2 rounded-[var(--radius-button)] border text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        bulkQuestionsType === "question"
                          ? "bg-[var(--invert-bg)] text-[var(--invert-text)] border-[var(--invert-bg)] font-medium"
                          : "bg-[var(--bg-inset)] border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <HelpCircle className="w-3 h-3" />
                      <span>Questions</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBulkQuestionsType("reading")}
                      className={`p-2 rounded-[var(--radius-button)] border text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        bulkQuestionsType === "reading"
                          ? "bg-[var(--invert-bg)] text-[var(--invert-text)] border-[var(--invert-bg)] font-medium"
                          : "bg-[var(--bg-inset)] border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>Reading</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setBulkQuestionsType("task")}
                      className={`p-2 rounded-[var(--radius-button)] border text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        bulkQuestionsType === "task"
                          ? "bg-[var(--invert-bg)] text-[var(--invert-text)] border-[var(--invert-bg)] font-medium"
                          : "bg-[var(--bg-inset)] border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      <CheckSquare className="w-3 h-3" />
                      <span>Tasks</span>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5 font-mono">
                    <label className="block text-xs text-[var(--text-secondary)] uppercase tracking-wider">
                      Paste Questions (One per line) *
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setBulkQuestionsInput(
                          "1. What is the fundamental theorem of calculus and how is it proven?\n2. Explain the intuition behind Euler-Lagrange equations.\n3. How do we derive Bayes' rule from conditional probability?"
                        )
                      }
                      className="text-[0.625rem] text-[var(--text-primary)] hover:underline cursor-pointer"
                    >
                      Insert Sample
                    </button>
                  </div>
                  <textarea
                    rows={5}
                    required
                    placeholder={"1. What are the key properties of eigenvalues?\n2. How does gradient descent converge on convex surfaces?\n3. Explain the bias-variance tradeoff with an example."}
                    value={bulkQuestionsInput}
                    onChange={(e) => setBulkQuestionsInput(e.target.value)}
                    className="w-full bg-[var(--bg-inset)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] text-xs p-3 text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] outline-none focus:border-[var(--border-focus)] resize-none font-mono transition-colors"
                  />
                  <div className="flex items-center justify-between mt-1 text-[0.6875rem] text-[var(--text-secondary)] font-mono">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-[var(--text-primary)]" />
                      <span>
                        {parseQuestionsList(bulkQuestionsInput).length} item
                        {parseQuestionsList(bulkQuestionsInput).length === 1 ? "" : "s"} detected
                      </span>
                    </span>
                    <span className="italic text-[0.625rem]">
                      Numbered or bulleted lines are cleanly parsed
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-hairline)]">
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
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </RouteTransition>
  );
}
