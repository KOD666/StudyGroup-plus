"use client";

import React from "react";
import { FolderPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface FilesInviteCardProps {
  onInvite: () => void;
}

export function FilesInviteCard({ onInvite }: FilesInviteCardProps) {
  return (
    <div className="p-8 sm:p-12 text-center bg-[var(--bg-elevated)] rounded-[var(--radius-card)] border border-dashed border-[var(--border-hairline)] max-w-xl mx-auto my-12">
      <div className="w-12 h-12 rounded-full bg-[var(--bg-inset)] border border-[var(--border-hairline)] flex items-center justify-center mx-auto mb-4 text-[#d97706]">
        <FolderPlus className="w-6 h-6" />
      </div>

      <h3 className="font-serif text-2xl font-normal text-[var(--text-primary)] mb-2">
        Invite someone to share files here
      </h3>

      <p className="font-sans text-xs sm:text-sm text-[var(--text-secondary)] mb-6 max-w-md mx-auto leading-relaxed">
        The Files section unlocks once your lounge has 2 or more members. Invite
        a study partner or classmate to start collaborating on notes and documents.
      </p>

      <Button
        variant="primary"
        size="md"
        icon={<Users className="w-4 h-4" />}
        onClick={onInvite}
      >
        Invite Members
      </Button>
    </div>
  );
}
