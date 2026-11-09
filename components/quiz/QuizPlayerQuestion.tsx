"use client";

import React from "react";
import { QuestionItem } from "./types";

interface QuizPlayerQuestionProps {
  question: QuestionItem;
  questionIndex: number;
  totalQuestions: number;
  answeredCount: number;
  selectedOption?: number;
  onSelectOption: (questionId: string, optionIndex: number) => void;
}

export function QuizPlayerQuestion({
  question,
  questionIndex,
  totalQuestions,
  answeredCount,
  selectedOption,
  onSelectOption,
}: QuizPlayerQuestionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between font-mono text-xs text-[var(--text-secondary)]">
        <span>
          Question {questionIndex + 1} of {totalQuestions}
        </span>
        <span>{answeredCount} answered</span>
      </div>

      <h3 className="font-sans text-sm sm:text-base font-medium text-[var(--text-primary)] leading-relaxed">
        {question.prompt}
      </h3>

      <div className="space-y-2.5 pt-2">
        {question.options.map((opt, optIdx) => {
          const isSelected = selectedOption === optIdx;

          return (
            <button
              key={optIdx}
              type="button"
              onClick={() => onSelectOption(question.id, optIdx)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-[var(--radius-card)] border text-left text-xs sm:text-sm font-sans transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#d97706]/10 border-[#d97706] text-[var(--text-primary)] font-medium"
                  : "bg-[var(--bg-inset)]/50 border-[var(--border-hairline)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)]"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs border ${
                  isSelected
                    ? "border-[#d97706] bg-[#d97706] text-black font-bold"
                    : "border-[var(--border-hairline)] bg-[var(--bg-elevated)]"
                }`}
              >
                {String.fromCharCode(65 + optIdx)}
              </span>
              <span className="flex-1">{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
