"use client";

import React, { useState } from "react";
import { X, ShieldCheck, ShieldAlert, Check } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171615]/50 backdrop-blur-xs transition-opacity duration-200">
      <div className="bg-[#ffffff] w-full max-w-2xl rounded-[0.25rem] border border-[#ddd8cc] shadow-paper-floating overflow-hidden font-sans transition-all duration-200">
        <div className="px-6 py-4 bg-[#faf9f6] border-b border-[#e5e2d9] flex items-center justify-between">
          <div>
            <h3 className="font-serif text-xl font-normal text-[#171615]">
              Member Roster &amp; File Access
            </h3>
            <p className="text-xs text-[#78746d] font-sans mt-0.5">
              {isCreator
                ? "Manage file access and permissions for study group members."
                : "Active members in this study group."}
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

        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          {error && (
            <div className="p-3 bg-[#ffdad6]/40 border border-[#ba1a1a]/30 rounded-[0.25rem] text-xs text-[#93000a]">
              {error}
            </div>
          )}

          {/* Members Table */}
          <div className="space-y-4">
            {members.map((member) => (
              <div
                key={member.userId}
                className="p-4 bg-[#fdf8f6] border border-[#e5e2d9] rounded-[0.25rem] space-y-3 transition-colors hover:border-[#ddd8cc]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#234338] text-[#faf9f6] flex items-center justify-center font-bold text-xs">
                      {member.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-[#171615]">{member.name}</h4>
                      <p className="text-xs text-[#78746d]">{member.email}</p>
                    </div>
                  </div>
                  <Badge variant={member.role === "creator" ? "ochre" : "parchment"}>
                    {member.role === "creator" ? "Owner" : "Member"}
                  </Badge>
                </div>

                {/* Per-asset Access Matrix */}
                {assets.length > 0 && (
                  <div className="pt-2 border-t border-[#e5e2d9]/60">
                    <span className="font-sans text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-[#78746d] block mb-2">
                      Document Access Permissions:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {assets.map((asset) => {
                        const hasAccess =
                          member.role === "creator" ||
                          (member.assetAccess && member.assetAccess.includes(asset.id));
                        const isUpdating = updatingKey === `${member.userId}-${asset.id}`;

                        return (
                          <button
                            key={asset.id}
                            type="button"
                            disabled={!isCreator || member.role === "creator" || isUpdating}
                            onClick={() => handleToggleAccess(member.userId, asset.id)}
                            className={`px-2.5 py-1 rounded-[0.125rem] border text-xs font-sans flex items-center gap-1.5 transition-all duration-150 ${
                              hasAccess
                                ? "bg-[#c4e8d8]/40 border-[#234338]/30 text-[#234338]"
                                : "bg-[#ffffff] border-[#ddd8cc] text-[#78746d] hover:border-[#ba5d1a]"
                            } ${!isCreator || member.role === "creator" ? "cursor-default" : "cursor-pointer"}`}
                          >
                            {hasAccess ? (
                              <ShieldCheck className="w-3 h-3 text-[#234338]" />
                            ) : (
                              <ShieldAlert className="w-3 h-3 text-[#78746d]" />
                            )}
                            <span className="truncate max-w-[12rem]">{asset.title}</span>
                            {hasAccess && <Check className="w-2.5 h-2.5" />}
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

        <div className="px-6 py-3 bg-[#faf9f6] border-t border-[#e5e2d9] flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
