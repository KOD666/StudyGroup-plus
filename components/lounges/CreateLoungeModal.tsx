"use client";

import React, { useState } from "react";
import { X, Plus, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface CreateLoungeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoungeCreated: (groupId: string) => void;
}

export function CreateLoungeModal({
  isOpen,
  onClose,
  onLoungeCreated,
}: CreateLoungeModalProps) {
  const [tab, setTab] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Group name is required.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || undefined }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create study group");
      }

      setName("");
      setDescription("");
      onClose();
      onLoungeCreated(data.group.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || code.trim().length !== 6) {
      setError("Please enter a valid 6-character invite code.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to join study group");
      }

      setCode("");
      onClose();
      onLoungeCreated(data.group.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171615]/50 backdrop-blur-xs transition-opacity duration-200">
      <div className="bg-[#ffffff] w-full max-w-lg rounded-[0.25rem] border border-[#ddd8cc] shadow-paper-floating overflow-hidden font-sans transition-transform duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#faf9f6] border-b border-[#e5e2d9] flex items-center justify-between">
          <div>
            <h3 className="font-serif text-xl font-normal text-[#171615]">
              {tab === "create" ? "Create a Study Group" : "Join a Study Group"}
            </h3>
            <p className="text-xs text-[#78746d] font-sans mt-0.5">
              {tab === "create"
                ? "Set up a shared workspace with live video, documents, and notes."
                : "Enter the 6-character invite code shared by the group creator."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#78746d] hover:text-[#171615] rounded-[0.25rem] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="px-6 pt-4 flex gap-4 border-b border-[#e5e2d9]/60 text-xs font-semibold uppercase tracking-[0.08em]">
          <button
            type="button"
            onClick={() => {
              setTab("create");
              setError(null);
            }}
            className={`pb-2.5 transition-colors duration-150 border-b-2 flex items-center gap-1.5 ${
              tab === "create"
                ? "border-[#ba5d1a] text-[#ba5d1a]"
                : "border-transparent text-[#78746d] hover:text-[#171615]"
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> Create New
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("join");
              setError(null);
            }}
            className={`pb-2.5 transition-colors duration-150 border-b-2 flex items-center gap-1.5 ${
              tab === "join"
                ? "border-[#ba5d1a] text-[#ba5d1a]"
                : "border-transparent text-[#78746d] hover:text-[#171615]"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" /> Join with Code
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-[#ffdad6]/40 border border-[#ba1a1a]/30 rounded-[0.25rem] text-xs text-[#93000a] font-medium">
              {error}
            </div>
          )}

          {tab === "create" ? (
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Group Name or Course Title"
                placeholder="e.g. PHIL 302: Ethics & Agency"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
              />

              <div className="flex flex-col gap-1 w-full">
                <label
                  htmlFor="group-desc"
                  className="font-sans text-xs font-semibold uppercase tracking-[0.08em] text-[#5e5a54]"
                >
                  Description (Optional)
                </label>
                <textarea
                  id="group-desc"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isLoading}
                  placeholder="e.g. Weekly seminar reviewing Aristotle's Nicomachean Ethics and modern action theory."
                  className="w-full bg-[#ffffff] text-[#171615] placeholder:text-[#78746d] border border-[#ddd8cc] rounded-[0.25rem] text-sm p-3 outline-none focus:border-[#ba5d1a] focus:ring-1 focus:ring-[#ba5d1a] resize-none transition-all duration-150"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#e5e2d9]">
                <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isLoading}>
                  Create Group
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="space-y-4">
              <Input
                label="6-Character Invite Code"
                placeholder="e.g. A9B2X7"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                maxLength={6}
                disabled={isLoading}
                className="tracking-widest font-mono text-center uppercase text-base"
                required
              />

              <p className="text-xs text-[#78746d]">
                Ask the group creator for their 6-character code (found in the group header).
              </p>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#e5e2d9]">
                <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" isLoading={isLoading}>
                  Join Group
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
