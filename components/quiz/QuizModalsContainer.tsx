"use client";

import React from "react";
import { CreateSetModal } from "./CreateSetModal";
import { BulkImportModal } from "./BulkImportModal";
import { AiDraftModal } from "./AiDraftModal";
import { ScheduleContestModal } from "./ScheduleContestModal";
import { QuizPlayerModal } from "./QuizPlayerModal";
import { ContestLeaderboardModal } from "./ContestLeaderboardModal";
import { QuestionSetItem, QuestionItem } from "./types";

export interface ActivePlayerState {
  attemptId: string;
  title: string;
  mode: "practice" | "contest";
  deadline?: string | null;
  questions: QuestionItem[];
  savedAnswers?: Record<string, number>;
}

interface QuizModalsContainerProps {
  groupId: string;
  sets: QuestionSetItem[];
  isCreateOpen: boolean;
  isImportOpen: boolean;
  isAiDraftOpen: boolean;
  isScheduleOpen: boolean;
  playerConfig: ActivePlayerState | null;
  viewingContestId: string | null;
  onCloseCreate: () => void;
  onCloseImport: () => void;
  onCloseAiDraft: () => void;
  onCloseSchedule: () => void;
  onClosePlayer: () => void;
  onCloseLeaderboard: () => void;
  onRefreshSets: () => void;
  onRefreshContests: () => void;
}

export function QuizModalsContainer({
  groupId,
  sets,
  isCreateOpen,
  isImportOpen,
  isAiDraftOpen,
  isScheduleOpen,
  playerConfig,
  viewingContestId,
  onCloseCreate,
  onCloseImport,
  onCloseAiDraft,
  onCloseSchedule,
  onClosePlayer,
  onCloseLeaderboard,
  onRefreshSets,
  onRefreshContests,
}: QuizModalsContainerProps) {
  return (
    <>
      {isCreateOpen && (
        <CreateSetModal
          groupId={groupId}
          isOpen={isCreateOpen}
          onClose={onCloseCreate}
          onSuccess={() => {
            onCloseCreate();
            onRefreshSets();
          }}
        />
      )}

      {isImportOpen && (
        <BulkImportModal
          groupId={groupId}
          isOpen={isImportOpen}
          onClose={onCloseImport}
          onSuccess={() => {
            onCloseImport();
            onRefreshSets();
          }}
        />
      )}

      {isAiDraftOpen && (
        <AiDraftModal
          groupId={groupId}
          isOpen={isAiDraftOpen}
          onClose={onCloseAiDraft}
          onSuccess={() => {
            onCloseAiDraft();
            onRefreshSets();
          }}
        />
      )}

      {isScheduleOpen && (
        <ScheduleContestModal
          groupId={groupId}
          sets={sets}
          isOpen={isScheduleOpen}
          onClose={onCloseSchedule}
          onSuccess={() => {
            onCloseSchedule();
            onRefreshContests();
          }}
        />
      )}

      {playerConfig && (
        <QuizPlayerModal
          groupId={groupId}
          attemptId={playerConfig.attemptId}
          title={playerConfig.title}
          mode={playerConfig.mode}
          deadline={playerConfig.deadline}
          questions={playerConfig.questions}
          initialAnswers={playerConfig.savedAnswers}
          isOpen={!!playerConfig}
          onClose={onClosePlayer}
          onFinish={onRefreshContests}
        />
      )}

      {viewingContestId && (
        <ContestLeaderboardModal
          groupId={groupId}
          contestId={viewingContestId}
          isOpen={!!viewingContestId}
          onClose={onCloseLeaderboard}
        />
      )}
    </>
  );
}
