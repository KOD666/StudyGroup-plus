export interface QuestionSetItem {
  id: string;
  groupId: string;
  creatorId: string;
  title: string;
  description: string | null;
  source: "manual" | "import" | "ai";
  status: "draft" | "published";
  createdAt: string;
  updatedAt: string;
  creatorName: string | null;
  creatorAvatar: string | null;
  questionCount: number;
}

export interface QuestionItem {
  id: string;
  orderNum: number;
  prompt: string;
  options: string[];
  correctOption?: number;
  explanation?: string | null;
}

export interface ContestItem {
  id: string;
  groupId: string;
  setId: string;
  creatorId: string;
  title: string;
  startTime: string;
  durationMinutes: number;
  createdAt: string;
  setTitle: string;
  creatorName: string | null;
  creatorAvatar: string | null;
  questionCount: number;
  participantCount: number;
  userAttempt?: {
    id: string;
    score: number | null;
    totalSeconds: number | null;
    startedAt: string;
    submittedAt: string | null;
  } | null;
}

export interface ContestLeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar: string | null;
  score: number;
  totalSeconds: number;
  submittedAt: string;
  isCurrentUser: boolean;
}

export interface LoungeStandingEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar: string | null;
  totalPoints: number;
  totalSeconds: number;
  contestsPlayed: number;
  isCurrentUser: boolean;
}
