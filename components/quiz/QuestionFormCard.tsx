"use client";

import React from "react";
import { Trash2, X } from "lucide-react";

export interface QuestionFormItem {
  prompt: string;
  options: string[];
  correctOption: number;
  explanation: string;
}

interface QuestionFormCardProps {
  index: number;
  question: QuestionFormItem;
  canRemove: boolean;
  onUpdate: (updated: QuestionFormItem) => void;
  onRemove: () => void;
}

export function QuestionFormCard({
  index,
  question,
  canRemove,
  onUpdate,
  onRemove,
}: QuestionFormCardProps) {
  const handlePromptChange = (prompt: string) => {
    onUpdate({ ...question, prompt });
  };

  const handleOptionChange = (optIdx: number, val: string) => {
    const options = [...question.options];
    options[optIdx] = val;
    onUpdate({ ...question, options });
  };

  const handleAddOption = () => {
    if (question.options.length < 6) {
      onUpdate({ ...question, options: [...question.options, ""] });
    }
  };

  const handleRemoveOption = (optIdx: number) => {
    if (question.options.length > 2) {
      const options = question.options.filter((_, i) => i !== optIdx);
      const correctOption =
        question.correctOption >= options.length ? 0 : question.correctOption;
      onUpdate({ ...question, options, correctOption });
    }
  };

  const handleCorrectChange = (optIdx: number) => {
    onUpdate({ ...question, correctOption: optIdx });
  };

  const handleExplanationChange = (explanation: string) => {
    onUpdate({ ...question, explanation });
  };

  return (
    <div className="p-4 rounded-[var(--radius-card)] bg-[var(--bg-inset)]/50 border border-[var(--border-hairline)] space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-semibold text-[#d97706]">
          Question {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="p-1 text-[var(--text-secondary)] hover:text-[#e5484d] cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <textarea
        value={question.prompt}
        onChange={(e) => handlePromptChange(e.target.value)}
        placeholder="Enter the question prompt..."
        rows={2}
        className="w-full px-3 py-2 rounded-[var(--radius-button)] bg-[var(--bg-inset)] border border-[var(--border-hairline)] text-xs text-[var(--text-primary)] focus:border-[#d97706] focus:outline-none"
        maxLength={1000}
        required
      />

      <div className="space-y-2">
        <span className="block text-[0.6875rem] font-mono uppercase text-[var(--text-secondary)]">
          Options (Select radio for correct answer):
        </span>
        {question.options.map((opt, optIdx) => (
          <div key={optIdx} className="flex items-center gap-2">
            <input
              type="radio"
              name={`correct_${index}`}
              checked={question.correctOption === optIdx}
              onChange={() => handleCorrectChange(optIdx)}
              className="accent-[#d97706] cursor-pointer"
              title="Mark as correct answer"
            />
            <input
              type="text"
              value={opt}
              onChange={(e) => handleOptionChange(optIdx, e.target.value)}
              placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
              className="flex-1 px-3 py-1.5 rounded-[var(--radius-button)] bg-[var(--bg-elevated)] border border-[var(--border-hairline)] text-xs text-[var(--text-primary)] focus:border-[#d97706] focus:outline-none"
              maxLength={300}
              required
            />
            {question.options.length > 2 && (
              <button
                type="button"
                onClick={() => handleRemoveOption(optIdx)}
                className="p-1 text-[var(--text-secondary)] hover:text-[#e5484d] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}

        {question.options.length < 6 && (
          <button
            type="button"
            onClick={handleAddOption}
            className="text-xs font-mono text-[#d97706] hover:underline cursor-pointer pt-1"
          >
            + Add another option
          </button>
        )}
      </div>

      <div>
        <label className="block text-[0.6875rem] font-mono text-[var(--text-secondary)] mb-1">
          Explanation / Solution Notes (Shown after submission)
        </label>
        <input
          type="text"
          value={question.explanation}
          onChange={(e) => handleExplanationChange(e.target.value)}
          placeholder="Why this answer is correct..."
          className="w-full px-3 py-1.5 rounded-[var(--radius-button)] bg-[var(--bg-inset)] border border-[var(--border-hairline)] text-xs text-[var(--text-primary)] focus:border-[#d97706] focus:outline-none"
          maxLength={1000}
        />
      </div>
    </div>
  );
}
