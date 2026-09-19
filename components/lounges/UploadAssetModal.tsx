"use client";

import React, { useState, useRef } from "react";
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

  if (!isOpen) return null;

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      if (!title) {
        // Strip extension for title suggestion
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

    // Client-side size check (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5MB limit.");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      // 1. Request presigned upload URL from backend
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

      // 2. Upload file directly to S3 / local storage fallback
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

      // 3. Register asset record in database
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171615]/50 backdrop-blur-xs transition-opacity duration-200">
      <div className="bg-[#ffffff] w-full max-w-md rounded-[0.25rem] border border-[#ddd8cc] shadow-paper-floating overflow-hidden font-sans transition-all duration-200">
        <div className="px-6 py-4 bg-[#faf9f6] border-b border-[#e5e2d9] flex items-center justify-between">
          <div>
            <h3 className="font-serif text-xl font-normal text-[#171615]">
              Upload Study Document
            </h3>
            <p className="text-xs text-[#78746d] font-sans mt-0.5">
              Upload notes (.md), PDFs, or slide decks (.pptx).
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#78746d] hover:text-[#171615] rounded-[0.25rem] transition-colors duration-150"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleUpload} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-[#ffdad6]/40 border border-[#ba1a1a]/30 rounded-[0.25rem] text-xs text-[#93000a] flex items-start gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-[#c4e8d8]/50 border border-[#234338]/30 rounded-[0.25rem] text-xs text-[#234338] flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Document uploaded successfully.</span>
            </div>
          )}

          {/* Drag & Drop Box */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`p-6 border-2 border-dashed rounded-[0.25rem] text-center cursor-pointer transition-all duration-200 ${
              file
                ? "border-[#234338] bg-[#c4e8d8]/10"
                : "border-[#ddd8cc] hover:border-[#ba5d1a] bg-[#faf9f6]"
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
                <FileText className="w-8 h-8 text-[#234338]" />
                <span className="font-sans text-sm font-semibold text-[#171615] truncate max-w-xs">
                  {file.name}
                </span>
                <span className="font-sans text-xs text-[#78746d]">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • Click to replace
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-[#ba5d1a]" />
                <span className="font-sans text-sm font-medium text-[#171615]">
                  Choose a file to upload
                </span>
                <span className="font-sans text-xs text-[#78746d]">
                  PDF, Markdown (.md), or PowerPoint (.pptx) up to 5MB
                </span>
              </div>
            )}
          </div>

          {/* Title Field */}
          <div className="flex flex-col gap-1 w-full">
            <label className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-[#5e5a54]">
              Document Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 3 Notes & Summary"
              className="w-full bg-[#ffffff] text-[#171615] placeholder:text-[#78746d] border border-[#ddd8cc] rounded-[0.25rem] text-sm py-2 px-3 outline-none focus:border-[#ba5d1a] focus:ring-1 focus:ring-[#ba5d1a] transition-all duration-150"
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#e5e2d9]">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isUploading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isUploading} disabled={!file}>
              Upload Document
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
