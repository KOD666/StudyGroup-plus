export const MAX_QUESTIONS_PER_SET = 200;
export const MAX_PROMPT_LENGTH = 1000;
export const MAX_OPTION_LENGTH = 300;
export const MAX_EXPLANATION_LENGTH = 1000;
export const MIN_OPTIONS = 2;
export const MAX_OPTIONS = 6;

export interface RawQuestionInput {
  prompt: string;
  options: string[];
  correctOption: number;
  explanation?: string | null;
}

export interface QuestionValidationError {
  row?: number;
  field?: string;
  message: string;
}

export function validateQuestion(
  q: RawQuestionInput,
  index?: number
): QuestionValidationError | null {
  const rowNum = index !== undefined ? index + 1 : undefined;

  if (!q.prompt || typeof q.prompt !== "string" || !q.prompt.trim()) {
    return {
      row: rowNum,
      field: "prompt",
      message: `Question prompt is required and cannot be empty.`,
    };
  }

  if (q.prompt.length > MAX_PROMPT_LENGTH) {
    return {
      row: rowNum,
      field: "prompt",
      message: `Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters.`,
    };
  }

  if (!Array.isArray(q.options) || q.options.length < MIN_OPTIONS || q.options.length > MAX_OPTIONS) {
    return {
      row: rowNum,
      field: "options",
      message: `Question must have between ${MIN_OPTIONS} and ${MAX_OPTIONS} options.`,
    };
  }

  for (let i = 0; i < q.options.length; i++) {
    const opt = q.options[i];
    if (typeof opt !== "string" || !opt.trim()) {
      return {
        row: rowNum,
        field: `options[${i}]`,
        message: `Option ${i + 1} cannot be empty.`,
      };
    }
    if (opt.length > MAX_OPTION_LENGTH) {
      return {
        row: rowNum,
        field: `options[${i}]`,
        message: `Option ${i + 1} exceeds maximum length of ${MAX_OPTION_LENGTH} characters.`,
      };
    }
  }

  if (
    typeof q.correctOption !== "number" ||
    q.correctOption < 0 ||
    q.correctOption >= q.options.length ||
    !Number.isInteger(q.correctOption)
  ) {
    return {
      row: rowNum,
      field: "correctOption",
      message: `Correct option must be an integer index between 0 and ${q.options.length - 1}.`,
    };
  }

  if (q.explanation && q.explanation.length > MAX_EXPLANATION_LENGTH) {
    return {
      row: rowNum,
      field: "explanation",
      message: `Explanation exceeds maximum length of ${MAX_EXPLANATION_LENGTH} characters.`,
    };
  }

  return null;
}
