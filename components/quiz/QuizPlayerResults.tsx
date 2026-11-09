"use client";

import React from "react";
import { CheckCircle2, XCircle, Trophy } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface QuestionResultItem {
  id: string;
  orderNum: number;
  prompt: string;
  options: string[];
  chosenOption: number | null;
  correctOption: number;
  isCorrect: boolean;
  explanation?: string | null;
}

interface QuizPlayerResultsProps {
  mode: "practice" | "contest";
  score: number;
  totalQuestions: number;
  totalSeconds: number;
  message?: string;
  results?: QuestionResultItem[];
  onClose: () => void;
}

export function QuizPlayerResults({
  mode,
  score,
  totalQuestions,
  totalSeconds,
  message,
  results,
  onClose,
}: QuizPlayerResultsProps) {
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* Score Header Card */}
      <div className="p-6 text-center bg-[var(--bg-inset)]/60 rounded-[var(--radius-card)] border border-[var(--border-hairline)] space-y-2">
        <div className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-hairline)] flex items-center justify-center mx-auto text-[#d97706]">
          <Trophy className="w-6 h-6" />
        </div>

        <h3 className="font-serif text-2xl font-normal text-[var(--text-primary)]">
          {mode === "contest" ? "Contest Finished" : percentage >= 70 ? "Well done!" : "Practice Complete"}
        </h3>

        <div className="text-3xl font-mono font-bold text-[#d97706]">
          {score} / {totalQuestions} ({percentage}%)
        </div>

        <p className="font-mono text-xs text-[var(--text-secondary)]">
          Total time: {minutes > 0 ? `${minutes}m ` : ""}{seconds}s
        </p>

        {message && (
          <p className="font-sans text-xs text-[var(--text-secondary)] max-w-md mx-auto pt-2">
            {message}
          </p>
        )}
      </div>

      {/* Question by question results (Practice mode or post-contest window) */}
      {results && results.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-mono text-xs uppercase tracking-wider text-[var(--text-secondary)]">
            Detailed Review
          </h4>

          {results.map((q) => (
            <div
              key={q.id}
              className={`p-4 rounded-[var(--radius-card)] border text-xs space-y-3 ${
                q.isCorrect
                  ? "bg-[var(--bg-inset)]/40 border-[var(--border-hairline)]"
                  : "bg-[var(--accent-live-wash)]/20 border-[#e5484d]/30"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-[var(--text-primary)]">
                  {q.orderNum}. {q.prompt}
                </span>
                {q.isCorrect ? (
                  <CheckCircle2 className="w-4 h-4 text-[#d97706] shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-[#e5484d] shrink-0" />
                )}
              </div>

              <div className="space-y-1.5 pl-2">
                {q.options.map((opt, optIdx) => {
                  const isUserPick = q.chosenOption === optIdx;
                  const isRealCorrect = q.correctOption === optIdx;

                  let optClass = "text-[var(--text-secondary)]";
                  if (isRealCorrect) {
                    optClass = "text-[#d97706] font-semibold";
                  } else if (isUserPick) {
                    optClass = "text-[#e5484d] line-through";
                  }

                  return (
                    <div key={optIdx} className={`flex items-center gap-2 ${optClass}`}>
                      <span className="font-mono w-4">
                        {String.fromCharCode(65 + optIdx)}.
                      </span>
                      <span>{opt}</span>
                      {isRealCorrect && (
                        <span className="text-[0.625rem] font-mono px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-hairline)]">
                          Correct
                        </span>
                      )}
                      {isUserPick && !isRealCorrect && (
                        <span className="text-[0.625rem] font-mono px-1.5 py-0.5 rounded bg-[#e5484d]/10 text-[#e5484d]">
                          Your Answer
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {q.explanation && (
                <div className="p-2.5 rounded-[var(--radius-button)] bg-[var(--bg-elevated)] border border-[var(--border-hairline)] text-[0.6875rem] text-[var(--text-secondary)]">
                  <span className="font-semibold text-[var(--text-primary)] block mb-0.5">
                    Explanation:
                  </span>
                  {q.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-end pt-4 border-t border-[var(--border-hairline)]">
        <Button variant="primary" size="md" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>
  );
}
