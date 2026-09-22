"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useUser, SignInButton } from "@clerk/nextjs";
import { CheckCircle2, AlertCircle, ArrowRight, BookOpen } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";
import { RouteTransition } from "@/components/motion/RouteTransition";

export default function JoinGroupPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const rawCode = (params.code as string) || "";
  const code = rawCode.trim().toUpperCase();

  const [status, setStatus] = useState<"loading" | "success" | "already_member" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [joinedGroup, setJoinedGroup] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setStatus("loading");
      return;
    }

    async function attemptJoin() {
      if (!code) {
        setStatus("error");
        setErrorMessage("Invalid invite code");
        return;
      }

      try {
        const res = await fetch("/api/groups/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        const data = await res.json();

        if (res.status === 201) {
          setStatus("success");
          setJoinedGroup(data.group);
          setTimeout(() => {
            router.push(`/lounges/${data.group.id}`);
          }, 1500);
          return;
        }

        if (res.status === 409) {
          setStatus("already_member");
          setJoinedGroup({
            id: data.groupId || "",
            name: data.groupName || "this study group",
          });
          return;
        }

        setStatus("error");
        setErrorMessage(data.error || "Failed to join study group with this code.");
      } catch (err: unknown) {
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Network error");
      }
    }

    attemptJoin();
  }, [isLoaded, isSignedIn, code, router]);

  return (
    <RouteTransition className="min-h-screen bg-[var(--bg-primary)] flex flex-col font-sans text-[var(--text-primary)] selection:bg-[var(--invert-bg)] selection:text-[var(--invert-text)]">
      <AppHeader />

      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-16 flex items-center justify-center">
        <Card variant="elevated" className="w-full">
          <CardHeader className="text-center pb-2">
            <div className="w-12 h-12 rounded-[var(--radius-button)] bg-[var(--bg-inset)] border border-[var(--border-hairline)] mx-auto mb-3 flex items-center justify-center text-[var(--text-primary)]">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="font-mono text-[0.6875rem] uppercase tracking-[0.08em] text-[var(--text-secondary)] block mb-1">
              Study Group Invitation
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[var(--text-primary)]">
              Invite Code #{code}
            </h1>
          </CardHeader>

          <CardContent className="pt-4 text-center">
            {/* Unauthenticated View */}
            {isLoaded && !isSignedIn && (
              <div className="space-y-4">
                <p className="font-sans text-sm text-[var(--text-secondary)] leading-relaxed">
                  Please sign in to your StudyGroup+ account to accept this invitation and join the group.
                </p>
                <div className="pt-2">
                  <SignInButton mode="modal">
                    <Button variant="primary" size="md" className="w-full">
                      Sign In to Join Group
                    </Button>
                  </SignInButton>
                </div>
              </div>
            )}

            {/* Loading / Joining View */}
            {isLoaded && isSignedIn && status === "loading" && (
              <div className="py-6 space-y-3">
                <div className="flex items-center justify-center gap-1.5 py-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--text-primary)] animate-busy-dot-1" />
                  <span className="w-2 h-2 rounded-full bg-[var(--text-primary)] animate-busy-dot-2" />
                  <span className="w-2 h-2 rounded-full bg-[var(--text-primary)] animate-busy-dot-3" />
                </div>
                <p className="font-sans font-medium text-sm text-[var(--text-primary)]">
                  Joining study group...
                </p>
                <p className="font-mono text-xs text-[var(--text-secondary)]">
                  Verifying invitation code #{code}
                </p>
              </div>
            )}

            {/* Success View */}
            {status === "success" && joinedGroup && (
              <div className="py-4 space-y-4">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-inset)] border border-[var(--border-hairline)] text-[var(--text-primary)] mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-normal text-[var(--text-primary)] mb-1">
                    Welcome to {joinedGroup.name}!
                  </h3>
                  <p className="font-sans text-xs text-[var(--text-secondary)]">
                    You have successfully joined the group. Redirecting to workspace...
                  </p>
                </div>
                <div className="pt-2">
                  <Link href={`/lounges/${joinedGroup.id}`}>
                    <Button variant="primary" size="md" className="w-full" icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">
                      Enter Study Group Now
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* Already Member View */}
            {status === "already_member" && (
              <div className="py-4 space-y-4">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-inset)] border border-[var(--border-hairline)] text-[var(--text-primary)] mx-auto flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-normal text-[var(--text-primary)] mb-1">
                    Already Enrolled
                  </h3>
                  <p className="font-sans text-xs text-[var(--text-secondary)] leading-relaxed">
                    You are already enrolled in {joinedGroup?.name || "this study group"}.
                  </p>
                </div>
                <div className="pt-2 flex flex-col gap-2">
                  {joinedGroup?.id ? (
                    <Link href={`/lounges/${joinedGroup.id}`}>
                      <Button variant="primary" size="md" className="w-full" icon={<ArrowRight className="w-4 h-4" />} iconPosition="right">
                        Go to Study Group
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/lounges">
                      <Button variant="primary" size="md" className="w-full">
                        View Your Study Groups
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* Error View */}
            {status === "error" && (
              <div className="py-4 space-y-4">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-inset)] border border-[var(--border-focus)] text-[var(--text-primary)] mx-auto flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-normal text-[var(--text-primary)] mb-1">
                    Unable to Join Group
                  </h3>
                  <p className="font-sans text-xs text-[var(--text-secondary)] leading-relaxed">
                    {errorMessage || "No active study group found matching this invite code."}
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row gap-2 justify-center">
                  <Link href="/join">
                    <Button variant="secondary" size="md">
                      Try Another Code
                    </Button>
                  </Link>
                  <Link href="/lounges">
                    <Button variant="primary" size="md">
                      Go to Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="border-t border-[var(--border-hairline)] justify-center text-xs font-mono text-[var(--text-secondary)]">
            StudyGroup+ • Academic Collaboration Workspace
          </CardFooter>
        </Card>
      </main>
    </RouteTransition>
  );
}
