"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, Copy, Check, Share2, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface InviteModalProps {
  groupName: string;
  groupCode: string;
  isOpen: boolean;
  onClose: () => void;
  onPostToChat: (message: string) => void;
}

export function InviteModal({
  groupName,
  groupCode,
  isOpen,
  onClose,
  onPostToChat,
}: InviteModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [postedToChat, setPostedToChat] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  if (!isOpen) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const inviteLink = `${origin}/join/${groupCode}`;

  function handleCopyLink() {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1200);
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(groupCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1200);
  }

  function handlePostInviteToChat() {
    const inviteMsg = `Join our study group "${groupName}"! Use invite code #${groupCode} or open: ${inviteLink}`;
    onPostToChat(inviteMsg);
    setPostedToChat(true);
    setTimeout(() => setPostedToChat(false), 2000);
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop: fades to --bg-primary at 60% opacity */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.1 : 0.2 }}
          onClick={onClose}
          className="absolute inset-0 bg-[rgba(10,10,10,0.6)] backdrop-blur-xs"
        />

        {/* Modal: scale 0.96 -> 1 + fade, --dur-slow (450ms), --ease-out-expo */}
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
          {/* Header */}
          <div className="px-6 py-4 border-b border-[var(--border-hairline)] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Share2 className="w-4 h-4 text-[var(--text-secondary)]" />
              <div>
                <h3 className="font-serif text-xl font-normal text-[var(--text-primary)]">
                  Invite to Study Group
                </h3>
                <p className="text-xs text-[var(--text-secondary)] font-sans mt-0.5">
                  {groupName}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-button)] hover:bg-[var(--bg-overlay)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-5">
            {/* Invite Code Section */}
            <div className="space-y-1.5">
              <label className="font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-[var(--text-secondary)]">
                Invite Code
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-[var(--bg-inset)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] px-4 py-2.5 font-mono text-lg font-bold text-[var(--text-primary)] tracking-widest text-center select-all">
                  #{groupCode}
                </div>
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleCopyCode}
                  icon={
                    copiedCode ? (
                      <Check className="w-4 h-4 text-[var(--text-primary)]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )
                  }
                >
                  {copiedCode ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>

            {/* Shareable Link Section */}
            <div className="space-y-1.5">
              <label className="font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-[var(--text-secondary)]">
                Direct Join Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="flex-1 bg-[var(--bg-inset)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] text-xs px-3 py-2 text-[var(--text-secondary)] font-mono outline-none select-all"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCopyLink}
                  icon={
                    copiedLink ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {copiedLink ? "Copied" : "Copy Link"}
                </Button>
              </div>
            </div>

            {/* Quick Post to Chat Action */}
            <div className="pt-3 border-t border-[var(--border-hairline)]">
              <div className="p-3.5 bg-[var(--bg-inset)] border border-[var(--border-hairline)] rounded-[var(--radius-card)] space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-primary)]">
                  <MessageSquare className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                  <span>Post into Group Chat</span>
                </div>
                <p className="font-sans text-xs text-[var(--text-secondary)] leading-relaxed">
                  Broadcast this invite code and link directly into the study group chat for current members.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  onClick={handlePostInviteToChat}
                  icon={
                    postedToChat ? (
                      <Check className="w-3.5 h-3.5 text-[var(--text-primary)]" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {postedToChat ? "Posted to Group Chat!" : "Post Invite into Chat"}
                </Button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-[var(--border-hairline)] flex justify-end">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Done
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
