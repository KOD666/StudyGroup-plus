"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { QuestionItem } from "./types";
import { QuizPlayerResults, QuestionResultItem } from "./QuizPlayerResults";
import { QuizPlayerQuestion } from "./QuizPlayerQuestion";

interface QuizPlayerModalProps {
  groupId: string;
  attemptId: string;
  title: string;
  mode: "practice" | "contest";
  deadline?: string | null;
  questions: QuestionItem[];
  initialAnswers?: Record<string, number>;
  isOpen: boolean;
  onClose: () => void;
  onFinish?: () => void;
}

export function QuizPlayerModal({
  groupId,
  attemptId,
  title,
  mode,
  deadline,
  questions,
  initialAnswers = {},
  isOpen,
  onClose,
  onFinish,
}: QuizPlayerModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>(initialAnswers);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionData, setSubmissionData] = useState<{
    score: number;
    totalQuestions: number;
    totalSeconds: number;
    message?: string;
    results?: QuestionResultItem[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Countdown timer for contest mode
  useEffect(() => {
    if (!deadline || mode !== "contest") return;

    const deadlineMs = new Date(deadline).getTime();
    const updateCountdown = () => {
      const diff = Math.max(0, Math.floor((deadlineMs - Date.now()) / 1000));
      setTimeLeftSeconds(diff);
      if (diff <= 0) {
        handleAutoSubmit();
      }
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deadline, mode]);

  const handleSelectOption = async (questionId: string, optIdx: number) => {
    if (isSubmitting || submissionData) return;

    // Optimistic local state update
    setAnswers((prev) => ({ ...prev, [questionId]: optIdx }));

    // Background autosave to server
    try {
      await fetch(
        `/api/groups/${groupId}/quizzes/attempts/${attemptId}/answer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId, chosenOption: optIdx }),
        }
      );
    } catch (err) {
      console.error("Autosave failed:", err);
    }
  };

  const handleSubmit = useCallback(async () => {
    if (isSubmitting || submissionData) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/groups/${groupId}/quizzes/attempts/${attemptId}/submit`,
        {
          method: "POST",
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit attempt");
      }

      setSubmissionData({
        score: data.score,
        totalQuestions: data.totalQuestions || questions.length,
        totalSeconds: data.totalSeconds || 0,
        message: data.message,
        results: data.results,
      });

      if (onFinish) onFinish();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error submitting quiz");
      setIsSubmitting(false);
    }
  }, [groupId, attemptId, questions.length, isSubmitting, submissionData, onFinish]);

  const handleAutoSubmit = useCallback(() => {
    handleSubmit();
  }, [handleSubmit]);

  if (!isOpen) return null;

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progressPercent =
    questions.length > 0
      ? Math.round(((currentIndex + 1) / questions.length) * 100)
      : 0;

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-[var(--bg-elevated)] border border-[var(--border-hairline)] rounded-[var(--radius-card)] text-[var(--text-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-3">
            <div>
              <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-[var(--text-secondary)]">
                {mode === "contest" ? "Contest Window" : "Solo Practice"}
              </span>
              <h2 className="font-serif text-lg sm:text-xl font-normal truncate max-w-md">
                {title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {mode === "contest" && timeLeftSeconds !== null && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-button)] bg-[var(--bg-inset)] border border-[var(--border-hairline)] font-mono text-xs">
                <Clock className="w-3.5 h-3.5 text-[#d97706]" />
                <span
                  className={
                    timeLeftSeconds < 120
                      ? "text-[#e5484d] font-bold animate-pulse"
                      : "text-[var(--text-primary)]"
                  }
                >
                  {formatTimer(timeLeftSeconds)}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-[var(--radius-button)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-inset)] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {!submissionData && (
          <div className="w-full bg-[var(--bg-inset)] h-1 relative">
            <div
              className="h-full bg-[#d97706] transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* If completed, display score & results */}
        {submissionData ? (
          <QuizPlayerResults
            mode={mode}
            score={submissionData.score}
            totalQuestions={submissionData.totalQuestions}
            totalSeconds={submissionData.totalSeconds}
            message={submissionData.message}
            results={submissionData.results}
            onClose={onClose}
          />
        ) : (
          /* Active Question View */
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {error && (
              <div className="p-3 rounded-[var(--radius-button)] bg-[var(--accent-live-wash)] border border-[var(--accent-live)]/40 text-xs text-[var(--text-primary)] flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#e5484d] shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {currentQuestion ? (
              <QuizPlayerQuestion
                question={currentQuestion}
                questionIndex={currentIndex}
                totalQuestions={questions.length}
                answeredCount={answeredCount}
                selectedOption={answers[currentQuestion.id]}
                onSelectOption={handleSelectOption}
              />
            ) : null}

            {/* Navigation & Submit footer */}
            <div className="flex items-center justify-between pt-4 border-t border-[var(--border-hairline)]">
              <Button
                variant="secondary"
                size="sm"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                icon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Previous
              </Button>

              <div className="flex items-center gap-2">
                {currentIndex < questions.length - 1 ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      setCurrentIndex((prev) =>
                        Math.min(questions.length - 1, prev + 1)
                      )
                    }
                    icon={<ChevronRight className="w-3.5 h-3.5" />}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={handleSubmit}
                    icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Answers"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
