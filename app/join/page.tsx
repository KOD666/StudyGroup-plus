"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookOpen, ArrowRight, Hash } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";

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
    <div className="min-h-screen bg-[#fdf8f6] flex flex-col font-sans selection:bg-[#ffdbc9] selection:text-[#171615]">
      <AppHeader />

      <main className="flex-1 max-w-md w-full mx-auto px-4 py-16 flex items-center justify-center">
        <Card variant="ivory" className="w-full shadow-paper-floating border-[#ddd8cc]">
          <CardHeader className="text-center pb-2">
            <div className="w-12 h-12 rounded-[0.25rem] bg-[#faf9f6] border border-[#e5e2d9] mx-auto mb-3 flex items-center justify-center text-[#ba5d1a]">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#78746d] block mb-1">
              Join Study Group
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#171615]">
              Enter Invite Code
            </h1>
          </CardHeader>

          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-[#ffdad6]/40 border border-[#ba1a1a]/30 rounded-[0.25rem] text-xs text-[#93000a]">
                  {error}
                </div>
              )}

              <p className="text-xs text-[#5e5a54] text-center leading-relaxed">
                Enter the 6-character invite code provided by your study group host to enroll in the workspace.
              </p>

              <div className="relative">
                <Hash className="w-4 h-4 text-[#78746d] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={code}
                  maxLength={10}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  placeholder="e.g. 7X9K2A"
                  className="w-full bg-[#ffffff] text-[#171615] placeholder:text-[#78746d] border border-[#ddd8cc] rounded-[0.25rem] text-base font-mono tracking-widest pl-9 pr-3 py-2.5 outline-none focus:border-[#ba5d1a] focus:ring-1 focus:ring-[#ba5d1a] transition-all"
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

          <CardFooter className="bg-[#faf9f6] border-t border-[#e5e2d9] justify-between text-xs text-[#78746d]">
            <Link href="/lounges" className="hover:text-[#171615] transition-colors">
              ← Back to Dashboard
            </Link>
            <span>StudyGroup+</span>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
