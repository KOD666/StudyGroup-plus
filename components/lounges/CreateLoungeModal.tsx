"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, Plus, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface CreateLoungeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoungeCreated: (groupId: string) => void;
  initialTab?: "create" | "join";
}

export function CreateLoungeModal({
  isOpen,
  onClose,
  onLoungeCreated,
  initialTab = "create",
}: CreateLoungeModalProps) {
  const [tab, setTab] = useState<"create" | "join">(initialTab);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  React.useEffect(() => {
    if (isOpen && initialTab) {
      setTab(initialTab);
      setError(null);
    }
  }, [isOpen, initialTab]);

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
          className="relative bg-[var(--bg-elevated)] w-full max-w-lg rounded-[var(--radius-modal)] border border-[var(--border-hairline)] overflow-hidden font-sans text-[var(--text-primary)] shadow-none z-10"
        >
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-[var(--border-hairline)] flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl font-normal text-[var(--text-primary)]">
                {tab === "create" ? "Convene Study Group" : "Join Study Group"}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-sans mt-0.5">
                {tab === "create"
                  ? "Set up a shared workspace with live video, documents, and notes."
                  : "Enter the 6-character invite code shared by the group creator."}
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

          {/* Tab Toggle */}
          <div className="px-6 pt-4 flex gap-4 border-b border-[var(--border-hairline)] text-xs font-mono uppercase tracking-[0.06em]">
            <button
              type="button"
              onClick={() => {
                setTab("create");
                setError(null);
              }}
              className={`pb-2.5 transition-colors duration-[var(--dur-fast)] border-b-2 flex items-center gap-1.5 cursor-pointer ${
                tab === "create"
                  ? "border-[var(--text-primary)] text-[var(--text-primary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <Plus className="w-3.5 h-3.5" /> Convene New
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("join");
                setError(null);
              }}
              className={`pb-2.5 transition-colors duration-[var(--dur-fast)] border-b-2 flex items-center gap-1.5 cursor-pointer ${
                tab === "join"
                  ? "border-[var(--text-primary)] text-[var(--text-primary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" /> Join with Code
            </button>
          </div>

          {/* Body */}
          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-[var(--bg-inset)] border border-[var(--border-focus)] rounded-[var(--radius-card)] text-xs text-[var(--text-primary)]">
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
                    className="font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-[var(--text-secondary)]"
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
                    className="w-full bg-[var(--bg-inset)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] text-xs p-3 outline-none focus:border-[var(--border-focus)] focus:ring-1 focus:ring-[var(--border-focus)] resize-none transition-all duration-[var(--dur-fast)]"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-[var(--border-hairline)]">
                  <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
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

                <p className="font-mono text-xs text-[var(--text-secondary)]">
                  Ask the group host for their 6-character code (found in the group header).
                </p>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-[var(--border-hairline)]">
                  <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm" isLoading={isLoading}>
                    Join Group
                  </Button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
