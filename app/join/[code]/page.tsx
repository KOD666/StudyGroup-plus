"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useUser, SignInButton } from "@clerk/nextjs";
import { CheckCircle2, AlertCircle, ArrowRight, BookOpen, Loader2 } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/Card";

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
      // User is not signed in
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
          // Automatically redirect after 1.5s
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
    <div className="min-h-screen bg-[#fdf8f6] flex flex-col font-sans selection:bg-[#ffdbc9] selection:text-[#171615]">
      <AppHeader />

      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-16 flex items-center justify-center">
        <Card variant="ivory" className="w-full shadow-paper-floating border-[#ddd8cc]">
          <CardHeader className="text-center pb-2">
            <div className="w-12 h-12 rounded-[0.25rem] bg-[#faf9f6] border border-[#e5e2d9] mx-auto mb-3 flex items-center justify-center text-[#ba5d1a]">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.12em] text-[#78746d] block mb-1">
              Study Group Invitation
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-normal text-[#171615]">
              Invite Code #{code}
            </h1>
          </CardHeader>

          <CardContent className="pt-4 text-center">
            {/* Unauthenticated View */}
            {isLoaded && !isSignedIn && (
              <div className="space-y-4">
                <p className="text-sm text-[#5e5a54] leading-relaxed">
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
                <Loader2 className="w-8 h-8 text-[#ba5d1a] animate-spin mx-auto" />
                <p className="font-medium text-sm text-[#171615]">
                  Joining study group...
                </p>
                <p className="text-xs text-[#78746d]">
                  Verifying invitation code #{code}
                </p>
              </div>
            )}

            {/* Success View */}
            {status === "success" && joinedGroup && (
              <div className="py-4 space-y-4">
                <div className="w-10 h-10 rounded-full bg-[#c4e8d8]/60 text-[#234338] mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-[#171615] mb-1">
                    Welcome to {joinedGroup.name}!
                  </h3>
                  <p className="text-xs text-[#78746d]">
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
                <div className="w-10 h-10 rounded-full bg-[#faf9f6] border border-[#ddd8cc] text-[#ba5d1a] mx-auto flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-[#171615] mb-1">
                    Already a Member
                  </h3>
                  <p className="text-xs text-[#78746d] leading-relaxed">
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
                <div className="w-10 h-10 rounded-full bg-[#ffdad6]/60 text-[#ba1a1a] mx-auto flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-[#171615] mb-1">
                    Unable to Join Group
                  </h3>
                  <p className="text-xs text-[#5e5a54] leading-relaxed">
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

          <CardFooter className="bg-[#faf9f6] border-t border-[#e5e2d9] justify-center text-xs text-[#78746d]">
            StudyGroup+ • Academic Collaboration Workspace
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
