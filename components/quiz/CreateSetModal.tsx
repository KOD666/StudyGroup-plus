"use client";

import React, { useState } from "react";
import { X, Plus, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { QuestionFormCard, QuestionFormItem } from "./QuestionFormCard";

interface CreateSetModalProps {
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateSetModal({
  groupId,
  isOpen,
  onClose,
  onSuccess,
}: CreateSetModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"published" | "draft">("published");
  const [questions, setQuestions] = useState<QuestionFormItem[]>([
    {
      prompt: "",
      options: ["", "", "", ""],
      correctOption: 0,
      explanation: "",
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddQuestion = () => {
    if (questions.length >= 200) return;
    setQuestions([
      ...questions,
      {
        prompt: "",
        options: ["", "", "", ""],
        correctOption: 0,
        explanation: "",
      },
    ]);
  };

  const handleUpdateQuestion = (qIdx: number, updated: QuestionFormItem) => {
    const list = [...questions];
    list[qIdx] = updated;
    setQuestions(list);
  };

  const handleRemoveQuestion = (qIdx: number) => {
    if (questions.length <= 1) return;
    setQuestions(questions.filter((_, idx) => idx !== qIdx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a title for the question set.");
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q || !q.prompt.trim()) {
        setError(`Question ${i + 1} prompt cannot be empty.`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        const opt = q.options[j];
        if (!opt || !opt.trim()) {
          setError(`Question ${i + 1}, Option ${j + 1} cannot be empty.`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/groups/${groupId}/quizzes/sets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || null,
          source: "manual",
          status,
          questions,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create question set");
      }

      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error creating set");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[var(--radius-card)] text-[var(--text-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border-hairline)]">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-normal">
              Create Question Set
            </h2>
            <p className="font-sans text-xs text-[var(--text-secondary)] mt-0.5">
              Add multiple choice questions for solo practice or group contests.
            </p>
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
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-[var(--radius-button)] bg-[var(--accent-live-wash)] border border-[var(--accent-live)]/40 text-xs text-[var(--text-primary)] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#e5484d] shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Set metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Chapter 4: Distributed Consensus"
                className="w-full px-3 py-2 rounded-[var(--radius-button)] bg-[var(--bg-inset)] border border-[var(--border-hairline)] text-xs text-[var(--text-primary)] focus:border-[#d97706] focus:outline-none"
                maxLength={255}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                Visibility
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as "published" | "draft")}
                className="w-full px-3 py-2 rounded-[var(--radius-button)] bg-[var(--bg-inset)] border border-[var(--border-hairline)] text-xs text-[var(--text-primary)] focus:border-[#d97706] focus:outline-none cursor-pointer"
              >
                <option value="published">Published (Lounge can view)</option>
                <option value="draft">Draft (Creator only)</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
                Description (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief notes about topics covered..."
                rows={2}
                className="w-full px-3 py-2 rounded-[var(--radius-button)] bg-[var(--bg-inset)] border border-[var(--border-hairline)] text-xs text-[var(--text-primary)] focus:border-[#d97706] focus:outline-none"
              />
            </div>
          </div>

          {/* Questions list */}
          <div className="space-y-6 pt-2">
            <div className="flex items-center justify-between border-b border-[var(--border-hairline)] pb-2">
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-secondary)]">
                Questions ({questions.length} / 200)
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={handleAddQuestion}
              >
                Add Question
              </Button>
            </div>

            {questions.map((q, qIdx) => (
              <QuestionFormCard
                key={qIdx}
                index={qIdx}
                question={q}
                canRemove={questions.length > 1}
                onUpdate={(updated) => handleUpdateQuestion(qIdx, updated)}
                onRemove={() => handleRemoveQuestion(qIdx)}
              />
            ))}
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-hairline)]">
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              {isSubmitting ? "Creating Set..." : "Save Question Set"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
