"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface LoungeAssetOption {
  id: string;
  title: string;
  fileType: string;
}

interface AiDraftModalProps {
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AiDraftModal({
  groupId,
  isOpen,
  onClose,
  onSuccess,
}: AiDraftModalProps) {
  const [mode, setMode] = useState<"asset" | "text">("asset");
  const [assets, setAssets] = useState<LoungeAssetOption[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  const [rawText, setRawText] = useState("");
  const [numQuestions, setNumQuestions] = useState(5);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !groupId) return;
    setIsLoadingAssets(true);
    fetch(`/api/groups/${groupId}/files?page=1&type=all`)
      .then((res) => res.json())
      .then((data) => {
        const files: LoungeAssetOption[] = (data.files || []).filter(
          (f: LoungeAssetOption) => f.fileType === "pdf" || f.fileType === "md"
        );
        setAssets(files);
        if (files[0]) setSelectedAssetId(files[0].id);
      })
      .catch((err) => console.error("Failed to load lounge documents:", err))
      .finally(() => setIsLoadingAssets(false));
  }, [isOpen, groupId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "asset" && !selectedAssetId) {
      setError("Please select a document from the lounge.");
      return;
    }
    if (mode === "text" && !rawText.trim()) {
      setError("Please paste lecture notes or study text.");
      return;
    }

    setIsDrafting(true);
    setError(null);

    try {
      const payload: {
        assetId?: string;
        rawText?: string;
        numQuestions: number;
      } = { numQuestions };
      if (mode === "asset") payload.assetId = selectedAssetId;
      else payload.rawText = rawText;

      const res = await fetch(`/api/groups/${groupId}/quizzes/ai-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate draft questions");
      }

      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error generating questions");
    } finally {
      setIsDrafting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-xl max-h-[90vh] flex flex-col bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[var(--radius-card)] text-[var(--text-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#d97706]" />
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-normal">
                Draft Questions with AI
              </h2>
              <p className="font-sans text-xs text-[var(--text-secondary)] mt-0.5">
                Generate practice questions from existing lounge documents or pasted notes.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-button)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-inset)] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Mode Selector */}
          <div className="flex items-center gap-2 p-1 bg-[var(--bg-inset)] rounded-[var(--radius-button)] border border-[var(--border-hairline)] text-xs font-mono">
            <button
              type="button"
              onClick={() => setMode("asset")}
              className={`flex-1 py-1.5 rounded-[calc(var(--radius-button)-2px)] transition-colors cursor-pointer ${
                mode === "asset"
                  ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Lounge Document (PDF / Notes)
            </button>
            <button
              type="button"
              onClick={() => setMode("text")}
              className={`flex-1 py-1.5 rounded-[calc(var(--radius-button)-2px)] transition-colors cursor-pointer ${
                mode === "text"
                  ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Paste Text Directly
            </button>
          </div>

          {mode === "asset" ? (
            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                Select Document from Lounge
              </label>
              {isLoadingAssets ? (
                <div className="text-xs font-mono text-[var(--text-secondary)] py-2">
                  Loading files...
                </div>
              ) : assets.length === 0 ? (
                <div className="p-4 bg-[var(--bg-inset)] rounded-[var(--radius-card)] border border-[var(--border-hairline)] text-xs text-[var(--text-secondary)]">
                  No PDF or Markdown notes found in this lounge. You can switch to &quot;Paste Text Directly&quot; above.
                </div>
              ) : (
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  className="w-full px-3 py-2 rounded-[var(--radius-button)] bg-[var(--bg-inset)] border border-[var(--border-hairline)] text-xs text-[var(--text-primary)] focus:border-[#d97706] focus:outline-none cursor-pointer"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.title} ({a.fileType.toUpperCase()})
                    </option>
                  ))}
                </select>
              )}
              <p className="text-[0.6875rem] text-[var(--text-secondary)] mt-1.5">
                Note: Scanned PDFs without a selectable text layer are not supported (no OCR).
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                Paste Study Notes or Reading Text
              </label>
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste key concepts, lecture notes, or chapter excerpt here..."
                rows={8}
                className="w-full px-3 py-2 rounded-[var(--radius-button)] bg-[var(--bg-inset)] border border-[var(--border-hairline)] text-xs text-[var(--text-primary)] focus:border-[#d97706] focus:outline-none font-mono"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
              Number of Questions to Generate
            </label>
            <select
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-[var(--radius-button)] bg-[var(--bg-inset)] border border-[var(--border-hairline)] text-xs text-[var(--text-primary)] focus:border-[#d97706] focus:outline-none cursor-pointer"
            >
              <option value={3}>3 questions</option>
              <option value={5}>5 questions (Recommended)</option>
              <option value={8}>8 questions</option>
              <option value={10}>10 questions</option>
            </select>
          </div>

          <div className="p-3 bg-[var(--bg-inset)]/60 rounded-[var(--radius-card)] border border-[var(--border-hairline)] text-[0.6875rem] text-[var(--text-secondary)] space-y-1">
            <span className="font-semibold text-[var(--text-primary)] block">
              Draft Set Notice:
            </span>
            <p>
              AI-generated questions are automatically saved as a private draft. You must review and edit each question before publishing it to other lounge members.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-[var(--radius-button)] bg-[var(--accent-live-wash)] border border-[var(--accent-live)]/40 text-xs text-[var(--text-primary)] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#e5484d] shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-hairline)]">
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isDrafting}
              icon={<Sparkles className="w-4 h-4 text-[#d97706]" />}
            >
              {isDrafting ? "Drafting Questions..." : "Generate Draft"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
