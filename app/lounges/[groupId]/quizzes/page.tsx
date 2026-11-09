"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { AppHeader } from "@/components/layout/AppHeader";
import { LoungeSubNav } from "@/components/lounge/LoungeSubNav";
import { RouteTransition } from "@/components/motion/RouteTransition";
import { QuizHeader } from "@/components/quiz/QuizHeader";
import { QuestionSetsList } from "@/components/quiz/QuestionSetsList";
import { ContestsList } from "@/components/quiz/ContestsList";
import { LoungeLeaderboardView } from "@/components/quiz/LoungeLeaderboardView";
import {
  QuizModalsContainer,
  ActivePlayerState,
} from "@/components/quiz/QuizModalsContainer";
import { QuestionSetItem, ContestItem } from "@/components/quiz/types";

export default function LoungeQuizzesPage() {
  const params = useParams();
  const groupId = params?.groupId as string;
  const { user } = useUser();
  const currentUserId = user?.id;

  const [activeTab, setActiveTab] = useState<"sets" | "contests" | "leaderboard">("sets");
  const [group, setGroup] = useState<{ id: string; name: string } | null>(null);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [isLoungeOwner, setIsLoungeOwner] = useState(false);

  const [sets, setSets] = useState<QuestionSetItem[]>([]);
  const [contests, setContests] = useState<ContestItem[]>([]);
  const [isLoadingSets, setIsLoadingSets] = useState(true);
  const [isLoadingContests, setIsLoadingContests] = useState(true);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isAiDraftOpen, setIsAiDraftOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [playerConfig, setPlayerConfig] = useState<ActivePlayerState | null>(null);
  const [viewingContestId, setViewingContestId] = useState<string | null>(null);

  const fetchGroupMeta = useCallback(async () => {
    if (!groupId) return;
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      if (res.ok) {
        const data = await res.json();
        setGroup(data.group);
        setMemberCount(data.members?.length || 0);
        setIsLoungeOwner(data.callerRole === "creator");
      }
    } catch (e) {
      console.error("Failed to load group:", e);
    }
  }, [groupId]);

  const fetchSets = useCallback(async () => {
    if (!groupId) return;
    setIsLoadingSets(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/quizzes/sets`);
      if (res.ok) {
        const data = await res.json();
        setSets(data.sets || []);
      }
    } catch (e) {
      console.error("Failed to load sets:", e);
    } finally {
      setIsLoadingSets(false);
    }
  }, [groupId]);

  const fetchContests = useCallback(async () => {
    if (!groupId) return;
    setIsLoadingContests(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/quizzes/contests`);
      if (res.ok) {
        const data = await res.json();
        setContests(data.contests || []);
      }
    } catch (e) {
      console.error("Failed to load contests:", e);
    } finally {
      setIsLoadingContests(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchGroupMeta();
    fetchSets();
    fetchContests();
  }, [fetchGroupMeta, fetchSets, fetchContests]);

  const handleStartPractice = async (set: QuestionSetItem) => {
    try {
      const res = await fetch(
        `/api/groups/${groupId}/quizzes/sets/${set.id}/practice`,
        { method: "POST" }
      );
      if (res.ok) {
        const data = await res.json();
        setPlayerConfig({
          attemptId: data.attempt.id,
          title: set.title,
          mode: "practice",
          questions: data.questions || [],
        });
      }
    } catch (e) {
      console.error("Failed to start practice:", e);
    }
  };

  const handleStartContest = async (contest: ContestItem) => {
    try {
      const res = await fetch(
        `/api/groups/${groupId}/quizzes/contests/${contest.id}/start`,
        { method: "POST" }
      );
      const data = await res.json();
      if (res.ok) {
        setPlayerConfig({
          attemptId: data.attempt.id,
          title: contest.title,
          mode: "contest",
          deadline: data.attempt.deadline,
          questions: data.questions || [],
          savedAnswers: data.savedAnswers || {},
        });
      } else {
        alert(data.error || "Unable to enter contest");
      }
    } catch (e) {
      console.error("Failed to enter contest:", e);
    }
  };

  const handleDeleteSet = async (setId: string) => {
    if (!confirm("Are you sure you want to delete this question set?")) return;
    try {
      const res = await fetch(
        `/api/groups/${groupId}/quizzes/sets/${setId}`,
        { method: "DELETE" }
      );
      if (res.ok) fetchSets();
    } catch (e) {
      console.error("Failed to delete set:", e);
    }
  };

  const handlePublishSet = async (set: QuestionSetItem) => {
    try {
      const res = await fetch(
        `/api/groups/${groupId}/quizzes/sets/${set.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "published" }),
        }
      );
      if (res.ok) fetchSets();
    } catch (e) {
      console.error("Failed to publish set:", e);
    }
  };

  return (
    <RouteTransition className="bg-[var(--bg-primary)] flex flex-col font-sans min-h-screen text-[var(--text-primary)]">
      <AppHeader />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 pb-4 text-xs text-[var(--text-secondary)]">
          <Link href="/lounges" className="hover:text-[var(--text-primary)] transition-colors">
            Study Groups
          </Link>
          <span className="text-[var(--text-disabled)]">/</span>
          <Link
            href={`/lounges/${groupId}`}
            className="hover:text-[var(--text-primary)] transition-colors"
          >
            {group?.name || "Lounge"}
          </Link>
          <span className="text-[var(--text-disabled)]">/</span>
          <span className="text-[var(--text-primary)] font-medium">Quizzes</span>
        </div>

        {/* Lounge Sub-Navigation */}
        <LoungeSubNav groupId={groupId} memberCount={memberCount} />

        <div className="space-y-6">
          <QuizHeader
            activeTab={activeTab}
            onTabChange={setActiveTab}
            setsCount={sets.length}
            contestsCount={contests.length}
            onOpenAiDraft={() => setIsAiDraftOpen(true)}
            onOpenImport={() => setIsImportOpen(true)}
            onOpenSchedule={() => setIsScheduleOpen(true)}
            onOpenCreate={() => setIsCreateOpen(true)}
          />

          {/* Tab View Content */}
          {activeTab === "sets" && (
            <QuestionSetsList
              sets={sets}
              isLoading={isLoadingSets}
              currentUserId={currentUserId}
              isLoungeOwner={isLoungeOwner}
              onPractice={handleStartPractice}
              onEdit={handlePublishSet}
              onDelete={handleDeleteSet}
              onCreateNew={() => setIsCreateOpen(true)}
            />
          )}

          {activeTab === "contests" && (
            <ContestsList
              contests={contests}
              isLoading={isLoadingContests}
              onStartContest={handleStartContest}
              onViewLeaderboard={(c) => setViewingContestId(c.id)}
              onScheduleNew={() => setIsScheduleOpen(true)}
            />
          )}

          {activeTab === "leaderboard" && (
            <LoungeLeaderboardView groupId={groupId} />
          )}
        </div>
      </main>

      {/* Modals Container */}
      <QuizModalsContainer
        groupId={groupId}
        sets={sets}
        isCreateOpen={isCreateOpen}
        isImportOpen={isImportOpen}
        isAiDraftOpen={isAiDraftOpen}
        isScheduleOpen={isScheduleOpen}
        playerConfig={playerConfig}
        viewingContestId={viewingContestId}
        onCloseCreate={() => setIsCreateOpen(false)}
        onCloseImport={() => setIsImportOpen(false)}
        onCloseAiDraft={() => setIsAiDraftOpen(false)}
        onCloseSchedule={() => setIsScheduleOpen(false)}
        onClosePlayer={() => setPlayerConfig(null)}
        onCloseLeaderboard={() => setViewingContestId(null)}
        onRefreshSets={fetchSets}
        onRefreshContests={fetchContests}
      />
    </RouteTransition>
  );
}
