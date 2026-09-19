"use client";

import React, { useState } from "react";
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

  if (!isOpen) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const inviteLink = `${origin}/join/${groupCode}`;

  function handleCopyLink() {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(groupCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  function handlePostInviteToChat() {
    const inviteMsg = `Join our study group "${groupName}"! Use invite code #${groupCode} or open: ${inviteLink}`;
    onPostToChat(inviteMsg);
    setPostedToChat(true);
    setTimeout(() => setPostedToChat(false), 2500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171615]/50 backdrop-blur-xs transition-opacity duration-200">
      <div className="bg-[#ffffff] w-full max-w-md rounded-[0.25rem] border border-[#ddd8cc] shadow-paper-floating overflow-hidden font-sans transition-all duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-[#faf9f6] border-b border-[#e5e2d9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#ba5d1a]" />
            <div>
              <h3 className="font-serif text-xl font-normal text-[#171615]">
                Invite to Study Group
              </h3>
              <p className="text-xs text-[#78746d] font-sans mt-0.5">
                {groupName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[#78746d] hover:text-[#171615] rounded-[0.25rem] transition-colors duration-150"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Invite Code Section */}
          <div className="space-y-1.5">
            <label className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[#78746d]">
              Invite Code
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#fdf8f6] border border-[#e5e2d9] rounded-[0.25rem] px-4 py-2.5 font-mono text-lg font-bold text-[#171615] tracking-widest text-center select-all">
                #{groupCode}
              </div>
              <Button
                variant="secondary"
                size="md"
                onClick={handleCopyCode}
                icon={copiedCode ? <Check className="w-4 h-4 text-[#234338]" /> : <Copy className="w-4 h-4" />}
              >
                {copiedCode ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          {/* Shareable Link Section */}
          <div className="space-y-1.5">
            <label className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-[#78746d]">
              Direct Join Link
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={inviteLink}
                className="flex-1 bg-[#fdf8f6] border border-[#ddd8cc] rounded-[0.25rem] text-xs px-3 py-2 text-[#5e5a54] outline-none select-all"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={handleCopyLink}
                icon={copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              >
                {copiedLink ? "Copied Link" : "Copy Link"}
              </Button>
            </div>
          </div>

          {/* Quick Post to Chat Action */}
          <div className="pt-3 border-t border-[#e5e2d9]">
            <div className="p-3.5 bg-[#faf9f6] border border-[#e5e2d9] rounded-[0.25rem] space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#171615]">
                <MessageSquare className="w-4 h-4 text-[#234338]" />
                <span>Post into Group Chat</span>
              </div>
              <p className="text-[0.6875rem] text-[#78746d] leading-relaxed">
                Share this invite link directly in the study group chat for connected members.
              </p>
              <Button
                variant={postedToChat ? "forest" : "secondary"}
                size="sm"
                className="w-full"
                onClick={handlePostInviteToChat}
                icon={postedToChat ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
              >
                {postedToChat ? "Posted to Group Chat!" : "Post Invite into Chat"}
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#faf9f6] border-t border-[#e5e2d9] flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
