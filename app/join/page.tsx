"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, ArrowRight, Hash } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import { RouteTransition } from "@/components/motion/RouteTransition";

export default function EnterInviteCodePage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clean = code.trim().toUpperCase().replace(/^#/, "");
    if (!clean) {
      setError("Please enter a valid invite code");
      return;
    }
    router.push(`/join/${clean}`);
  }

  return (
    <RouteTransition className="min-h-screen bg-[var(--bg-primary)] flex flex-col font-sans text-[var(--text-primary)] selection:bg-[var(--invert-bg)] selection:text-[var(--invert-text)]">
      <AppHeader />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-16 flex items-center justify-center">
        <Card variant="elevated" className="w-full">
          <CardHeader className="text-center pb-2">
            <div className="w-12 h-12 rounded-[var(--radius-button)] bg-[var(--bg-inset)] border border-[var(--border-hairline)] mx-auto mb-3 flex items-center justify-center text-[var(--text-primary)]">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-[var(--text-secondary)] block mb-1">
              Enroll in Workspace
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[var(--text-primary)]">
              Enter Invite Code
            </h1>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-[var(--bg-inset)] border border-[var(--border-focus)] rounded-[var(--radius-card)] text-xs text-[var(--text-primary)]">
                  {error}
                </div>
              )}

              <p className="font-sans text-xs text-[var(--text-secondary)] text-center leading-relaxed">
                Enter the 6-character invite code provided by your study group host to enroll in the workspace.
              </p>

              <div className="relative">
                <Hash className="w-4 h-4 text-[var(--text-secondary)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={code}
                  maxLength={10}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  placeholder="e.g. 7X9K2A"
                  className="w-full bg-[var(--bg-inset)] text-[var(--text-primary)] placeholder:text-[var(--text-disabled)] border border-[var(--border-hairline)] rounded-[var(--radius-button)] text-base font-mono tracking-widest pl-9 pr-3 py-2.5 outline-none focus:border-[var(--border-focus)] transition-colors"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                disabled={!code.trim()}
                icon={<ArrowRight className="w-4 h-4" />}
                iconPosition="right"
              >
                Join Study Group
              </Button>
            </form>
          </CardContent>

          <CardFooter className="border-t border-[var(--border-hairline)] justify-between text-xs font-mono text-[var(--text-secondary)]">
            <Link href="/lounges" className="hover:text-[var(--text-primary)] transition-colors">
              ← Dashboard
            </Link>
            <span>StudyGroup+</span>
          </CardFooter>
        </Card>
      </main>
    </RouteTransition>
  );
}
