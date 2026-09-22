"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Upload, X, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface UploadAssetModalProps {
  groupId: string;
  isOpen: boolean;
  onClose: () => void;
  onAssetUploaded: () => void;
}

export function UploadAssetModal({
  groupId,
  isOpen,
  onClose,
  onAssetUploaded,
}: UploadAssetModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const shouldReduceMotion = useReducedMotion();

  if (!isOpen) return null;

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      if (!title) {
        const cleanName = selected.name.replace(/\.[^/.]+$/, "");
        setTitle(cleanName);
      }
      setError(null);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const presignRes = await fetch("/api/assets/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          filename: file.name,
          sizeBytes: file.size,
        }),
      });

      const presignData = await presignRes.json();
      if (!presignRes.ok) {
        throw new Error(presignData.error || "Failed to generate upload URL");
      }

      const { uploadUrl, r2Key, fileType, mimeType } = presignData;

      const uploadRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": mimeType || file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!uploadRes.ok) {
        const errJson = await uploadRes.json().catch(() => ({}));
        throw new Error(
          errJson.error ||
            `Failed to upload file to storage (status ${uploadRes.status})`
        );
      }

      const saveRes = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId,
          title: title.trim() || file.name,
          fileType,
          sizeBytes: file.size,
          r2Key,
          mimeType,
        }),
      });

      const saveData = await saveRes.json();
      if (!saveRes.ok) {
        throw new Error(saveData.error || "Failed to save file to study group");
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setFile(null);
        setTitle("");
        onClose();
        onAssetUploaded();
      }, 800);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.1 : 0.2 }}
          onClick={onClose}
          className="absolute inset-0 bg-[rgba(10,10,10,0.6)] backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
          transition={{
            duration: shouldReduceMotion ? 0.15 : 0.45,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative bg-[var(--bg-elevated)] w-full max-w-md rounded-[var(--radius-modal)] border border-[var(--border-hairline)] overflow-hidden font-sans text-[var(--text-primary)] shadow-none z-10"
        >
          <div className="px-6 py-4 border-b border-[var(--border-hairline)] flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl font-normal text-[var(--text-primary)]">
                Upload Study Document
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-sans mt-0.5">
                Upload notes (.md), PDFs (.pdf), or slide decks (.pptx).
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-button)] hover:bg-[var(--bg-overlay)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleUpload} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-[var(--bg-inset)] border border-[var(--border-focus)] rounded-[var(--radius-card)] text-xs text-[var(--text-primary)] flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-[var(--bg-inset)] border border-[var(--border-hover)] rounded-[var(--radius-card)] text-xs text-[var(--text-primary)] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--text-primary)]" />
                <span>Document uploaded successfully.</span>
              </div>
            )}

            {/* Drag & Drop Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border border-dashed rounded-[var(--radius-card)] text-center cursor-pointer transition-all duration-[var(--dur-fast)] ${
                file
                  ? "border-[var(--border-hover)] bg-[var(--bg-overlay)]"
                  : "border-[var(--border-hairline)] hover:border-[var(--border-hover)] bg-[var(--bg-inset)]"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".pdf,.md,.pptx"
                className="hidden"
              />
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-8 h-8 text-[var(--text-primary)]" />
                  <span className="font-sans text-sm font-medium text-[var(--text-primary)] truncate max-w-xs">
                    {file.name}
                  </span>
                  <span className="font-mono text-xs text-[var(--text-secondary)]">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • Click to replace
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-7 h-7 text-[var(--text-secondary)]" />
                  <span className="font-sans text-sm font-normal text-[var(--text-primary)]">
                    Choose a file to upload
                  </span>
                  <span className="font-mono text-xs text-[var(--text-secondary)]">
                    PDF, Markdown (.md), or PowerPoint (.pptx) up to 5MB
                  </span>
                </div>
              )}
            </div>

            {/* Title Field */}
            <div className="flex flex-col gap-1 w-full">
              <label className="font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-[var(--text-secondary)]">
                Document Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Chapter 3 Notes & Summary"
                className="w-full bg-[var(--bg-inset)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] text-xs py-2 px-3 outline-none focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)] transition-all duration-[var(--dur-fast)]"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-3 border-t border-[var(--border-hairline)]">
              <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isUploading}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isUploading} disabled={!file}>
                Upload Document
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
