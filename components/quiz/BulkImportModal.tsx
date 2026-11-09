"use client";

import React, { useState, useRef } from "react";
import { X, Upload, Download, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface BulkImportModalProps {
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface RowError {
  row?: number;
  message: string;
}

const SAMPLE_CSV = `prompt,optionA,optionB,optionC,optionD,correctAnswer,explanation
"What does CAP theorem stand for?",Consistency Availability Partition tolerance,Cache Auth Performance,Compute Access Persistence,Cluster Array Protocol,A,"CAP stands for Consistency, Availability, and Partition Tolerance."
"Which protocol operates at the Transport Layer?",HTTP,TCP,IP,DNS,B,"TCP is a Transport Layer protocol."
"What is the average time complexity of quicksort?",O(n),O(n log n),O(n^2),O(log n),B,"Quicksort has an average time complexity of O(n log n)."`;

const SAMPLE_JSON = JSON.stringify(
  {
    title: "Computer Science Core Concepts",
    description: "Sample test covering distributed systems and algorithms.",
    questions: [
      {
        prompt: "What does CAP theorem stand for?",
        options: [
          "Consistency Availability Partition tolerance",
          "Cache Auth Performance",
          "Compute Access Persistence",
          "Cluster Array Protocol",
        ],
        correctOption: 0,
        explanation: "CAP stands for Consistency, Availability, and Partition Tolerance.",
      },
      {
        prompt: "Which protocol operates at the Transport Layer?",
        options: ["HTTP", "TCP", "IP", "DNS"],
        correctOption: 1,
        explanation: "TCP is a Transport Layer protocol.",
      },
    ],
  },
  null,
  2
);

export function BulkImportModal({
  groupId,
  isOpen,
  onClose,
  onSuccess,
}: BulkImportModalProps) {
  const [content, setContent] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<RowError[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadCsvTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quiz_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJsonTemplate = () => {
    const blob = new Blob([SAMPLE_JSON], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quiz_template.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContent(text || "");
    };
    reader.readAsText(file);
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Please paste question data or upload a CSV / JSON file.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setRowErrors([]);

    const isJson = content.trim().startsWith("{");
    const contentType = isJson ? "application/json" : "text/csv";

    try {
      const res = await fetch(`/api/groups/${groupId}/quizzes/sets/import`, {
        method: "POST",
        headers: { "Content-Type": contentType },
        body: content,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.rowErrors && Array.isArray(data.rowErrors)) {
          setRowErrors(data.rowErrors);
        }
        throw new Error(data.error || "Failed to import questions");
      }

      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error during import");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[var(--radius-card)] text-[var(--text-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border-hairline)]">
          <div>
            <h2 className="font-serif text-xl sm:text-2xl font-normal">
              Bulk Import Questions
            </h2>
            <p className="font-sans text-xs text-[var(--text-secondary)] mt-0.5">
              Upload or paste a CSV or JSON file to create a complete question set at once.
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

        {/* Content */}
        <form onSubmit={handleImport} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Templates Download */}
          <div className="p-3 bg-[var(--bg-inset)] rounded-[var(--radius-card)] border border-[var(--border-hairline)] flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-[var(--text-secondary)]">
              Need a formatting guide? Download standard templates:
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<Download className="w-3 h-3" />}
                onClick={handleDownloadCsvTemplate}
              >
                CSV Template
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<Download className="w-3 h-3" />}
                onClick={handleDownloadJsonTemplate}
              >
                JSON Template
              </Button>
            </div>
          </div>

          {/* Upload Button or File Chosen */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json,text/csv,application/json,text/plain"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<Upload className="w-3.5 h-3.5" />}
              onClick={() => fileInputRef.current?.click()}
            >
              {fileName ? `File: ${fileName}` : "Choose CSV or JSON File"}
            </Button>
          </div>

          {/* Raw Text Area */}
          <div>
            <label className="block text-xs font-mono text-[var(--text-secondary)] mb-1">
              File Content / Paste Raw Text
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste CSV rows (header: prompt,optionA,optionB,...,correctAnswer) or JSON here..."
              rows={9}
              className="w-full px-3 py-2 rounded-[var(--radius-button)] bg-[var(--bg-inset)] border border-[var(--border-hairline)] font-mono text-xs text-[var(--text-primary)] focus:border-[#d97706] focus:outline-none"
            />
          </div>

          {/* Error & Row validation breakdown */}
          {error && (
            <div className="p-3 rounded-[var(--radius-button)] bg-[var(--accent-live-wash)] border border-[var(--accent-live)]/40 text-xs text-[var(--text-primary)] flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-[#e5484d] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold">{error}</span>
                {rowErrors.length > 0 && (
                  <ul className="list-disc list-inside space-y-0.5 font-mono text-[0.6875rem] text-[var(--text-secondary)]">
                    {rowErrors.map((re, idx) => (
                      <li key={idx}>
                        {re.row ? `Row ${re.row}: ` : ""}{re.message}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-hairline)]">
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting || !content.trim()}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              {isSubmitting ? "Importing..." : "Validate & Import"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
