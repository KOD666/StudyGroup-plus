"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface Member {
  membershipId: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: "creator" | "member";
  assetAccess: string[];
  joinedAt: string;
}

interface Asset {
  id: string;
  title: string;
  fileType: string;
}

interface MemberAccessModalProps {
  groupId: string;
  isCreator: boolean;
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  assets: Asset[];
  onAccessUpdated: () => void;
}

export function MemberAccessModal({
  groupId,
  isCreator,
  isOpen,
  onClose,
  members,
  assets,
  onAccessUpdated,
}: MemberAccessModalProps) {
  const [updatingKey, setUpdatingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const shouldReduceMotion = useReducedMotion();

  if (!isOpen) return null;

  async function handleToggleAccess(memberUserId: string, assetId: string) {
    if (!isCreator) return;
    const key = `${memberUserId}-${assetId}`;
    setUpdatingKey(key);
    setError(null);

    try {
      const res = await fetch(`/api/groups/${groupId}/access`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberUserId,
          assetId,
          action: "toggle",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update file access");
      }

      onAccessUpdated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to toggle access");
    } finally {
      setUpdatingKey(null);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop: fades to --bg-primary at 60% opacity per DESIGN.md §5 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceMotion ? 0.1 : 0.2 }}
          onClick={onClose}
          className="absolute inset-0 bg-[rgba(10,10,10,0.6)] backdrop-blur-xs"
        />

        {/* Modal: scale 0.96 -> 1 + fade, --dur-slow (450ms), --ease-out-expo per DESIGN.md §5 */}
        <motion.div
          initial={
            shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }
          }
          animate={{ opacity: 1, scale: 1 }}
          exit={
            shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }
          }
          transition={{
            duration: shouldReduceMotion ? 0.15 : 0.45,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="relative bg-[var(--bg-elevated)] w-full max-w-2xl rounded-[var(--radius-modal)] border border-[var(--border-hairline)] overflow-hidden font-sans text-[var(--text-primary)] shadow-none z-10"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[var(--border-hairline)] flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl font-normal text-[var(--text-primary)]">
                Member Roster &amp; File Access
              </h3>
              <p className="text-xs text-[var(--text-secondary)] font-sans mt-0.5">
                {isCreator
                  ? "Manage file access and permissions for study group members."
                  : "Active members in this study group."}
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

          {/* Modal Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto space-y-5">
            {error && (
              <div className="p-3 bg-[var(--bg-inset)] border border-[var(--border-focus)] rounded-[var(--radius-card)] text-xs text-[var(--text-primary)]">
                {error}
              </div>
            )}

            {/* Members Table */}
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.userId}
                  className="p-4 bg-[var(--bg-inset)] border border-[var(--border-hairline)] rounded-[var(--radius-card)] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-hairline)] text-[var(--text-primary)] flex items-center justify-center font-mono text-xs font-semibold">
                        {member.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-sans text-sm font-medium text-[var(--text-primary)]">
                          {member.name}
                        </h4>
                        <p className="font-mono text-xs text-[var(--text-secondary)]">
                          {member.email}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        member.role === "creator" ? "outline" : "neutral"
                      }
                    >
                      {member.role === "creator" ? "Owner" : "Member"}
                    </Badge>
                  </div>

                  {/* Per-asset Access Matrix with Standard Toggle Switches (§5, §6.2) */}
                  {assets.length > 0 && (
                    <div className="pt-3 border-t border-[var(--border-hairline)]">
                      <span className="font-mono text-[0.6875rem] uppercase tracking-[0.06em] text-[var(--text-secondary)] block mb-2.5">
                        Document Access Permissions:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {assets.map((asset) => {
                          const hasAccess =
                            member.role === "creator" ||
                            (member.assetAccess &&
                              member.assetAccess.includes(asset.id));
                          const isUpdating =
                            updatingKey === `${member.userId}-${asset.id}`;
                          const isToggleDisabled =
                            !isCreator ||
                            member.role === "creator" ||
                            isUpdating;

                          return (
                            <button
                              key={asset.id}
                              type="button"
                              role="switch"
                              aria-checked={hasAccess}
                              disabled={isToggleDisabled}
                              onClick={() =>
                                handleToggleAccess(member.userId, asset.id)
                              }
                              className={`flex items-center justify-between p-2.5 rounded-[var(--radius-button)] bg-[var(--bg-elevated)] border border-[var(--border-hairline)] transition-colors gap-2 text-left ${
                                isToggleDisabled
                                  ? "cursor-default opacity-80"
                                  : "hover:border-[var(--border-hover)] cursor-pointer"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <FileText className="w-3.5 h-3.5 text-[var(--text-secondary)] shrink-0" />
                                <span className="font-sans text-xs text-[var(--text-primary)] truncate">
                                  {asset.title}
                                </span>
                              </div>

                              {/* Monochromatic Switch per DESIGN.md §5:
                                  Thumb slides on --ease-spring, 250ms.
                                  Track: --bg-elevated (off) -> rgba(237,237,237,0.2) (on).
                                  No color change — state communicated by position and track brightness only.
                              */}
                              <div
                                className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-[var(--dur-fast)] relative shrink-0 ${
                                  hasAccess
                                    ? "bg-[rgba(237,237,237,0.25)]"
                                    : "bg-[var(--bg-inset)] border border-[var(--border-hairline)]"
                                }`}
                              >
                                <motion.div
                                  className="w-3.5 h-3.5 rounded-full bg-[var(--text-primary)]"
                                  animate={{ x: hasAccess ? 14 : 0 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 30,
                                  }}
                                />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
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
