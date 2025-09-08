// ESL Learning Platform Types

// ===== Core Types =====

export interface LearningProgress {
  id: string;
  userId: string;
  bookId: string;
  pagesRead: number;
  totalPages: number;
  readingTime: number; // in seconds
  lastPageRead: number;
  startedAt: Date;
  completedAt?: Date;
  isCompleted: boolean;
  metrics?: {
    wordsLearned: number;
    quizScore: number;
    comprehension: number;
  };
}

export interface Vocabulary {
  id: string;
  userId: string;
  word: string;
  definition: string;
  translations?: {
    ko?: string;
    es?: string;
    zh?: string;
  };
  pronunciation?: string;
  partOfSpeech?: string;
  contexts: Array<{
    sentence: string;
    bookId: string;
    pageNumber: number;
  }>;
  bookId?: string;
  masteryLevel: number; // 0-5
  timesSeen: number;
  timesCorrect: number;
  lastSeen: Date;
}

export interface Quiz {
  id: string;
  bookId: string;
  title: string;
  description?: string;
  type: 'COMPREHENSION' | 'VOCABULARY' | 'GRAMMAR' | 'MIXED';
  difficulty?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  questions: QuizQuestion[];
  passingScore: number;
  timeLimit?: number; // in minutes
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer';
  options?: string[];
  correctAnswer: string | number;
  explanation?: string;
  points: number;
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  answers: Record<string, any>;
  timeSpent?: number; // in seconds
  passed: boolean;
  feedback?: string;
  attemptNumber: number;
  completedAt: Date;
}

export interface BookClub {
  id: string;
  bookId: string;
  creatorId: string;
  name: string;
  description?: string;
  isActive: boolean;
  isPublic: boolean;
  maxMembers?: number;
  language?: string;
  level?: string; // CEFR level
  memberCount?: number;
  members?: BookClubMember[];
  posts?: BookClubPost[];
}

export interface BookClubMember {
  id: string;
  clubId: string;
  userId: string;
  role: 'MEMBER' | 'MODERATOR' | 'ADMIN';
  joinedAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
}

export interface BookClubPost {
  id: string;
  clubId: string;
  userId: string;
  content: string;
  parentId?: string;
  likes: number;
  likedByUser?: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string;
    image?: string;
  };
  replies?: BookClubPost[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon?: string;
  category: 'READING' | 'VOCABULARY' | 'QUIZ' | 'SOCIAL' | 'STREAK';
  criteria: any; // JSON criteria
  xpValue: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  progress: number; // For progressive achievements
  earnedAt: Date;
  achievement?: Achievement;
}

export interface UserStats {
  id: string;
  userId: string;
  totalXP: number;
  level: number;
  streak: number;
  lastActive: Date;
  booksRead: number;
  wordsLearned: number;
  quizzesPassed: number;
  totalReadingTime: number; // in minutes
  postsCreated: number;
  likesReceived: number;
}

export interface ReadingSession {
  id: string;
  userId: string;
  bookId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  pagesRead: number;
  wordsClicked: string[];
  highlights: Array<{
    text: string;
    page: number;
    position: number;
  }>;
  notes: Array<{
    text: string;
    page: number;
    timestamp: Date;
  }>;
}

// ===== UI State Types =====

export interface LearningState {
  // Current session
  currentBookId?: string;
  currentLevel?: string;
  currentPage: number;
  sessionStartTime?: Date;
  
  // Progress
  learningProgress: LearningProgress[];
  progress?: LearningProgress;
  sessionData?: ReadingSession;
  
  // Vocabulary
  vocabulary: Vocabulary[];
  highlightedWords: string[];
  selectedWord?: {
    word: string;
    definition: string;
    position: { x: number; y: number };
  };
  
  // Quiz
  currentQuiz?: Quiz;
  quizAttempt?: Partial<QuizAttempt>;
  showQuizModal: boolean;
  
  // Book Club
  currentClub?: BookClub;
  clubPosts: BookClubPost[];
  bookClubDiscussions: BookClubDiscussion[];
  showBookClub: boolean;
  
  // Gamification
  userStats?: UserStats;
  recentAchievements: UserAchievement[];
  leaderboard: Array<{
    userId: string;
    name: string;
    xp: number;
    level: number;
  }>;
  
  // UI State
  isLoading: boolean;
  error?: string;
}

// ===== API Response Types =====

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ===== XP and Level System =====

export const XP_REWARDS = {
  PAGE_READ: 10,
  WORD_LEARNED: 5,
  QUIZ_PASSED: 50,
  QUIZ_PERFECT: 100,
  POST_CREATED: 20,
  POST_LIKED: 5,
  DAILY_STREAK: 25,
  BOOK_COMPLETED: 200,
} as const;

export const LEVELS = [
  { level: 1, name: 'Seedling', minXP: 0, maxXP: 500 },
  { level: 2, name: 'Sprout', minXP: 501, maxXP: 1500 },
  { level: 3, name: 'Sapling', minXP: 1501, maxXP: 3000 },
  { level: 4, name: 'Tree', minXP: 3001, maxXP: 5000 },
  { level: 5, name: 'Forest', minXP: 5001, maxXP: Infinity },
] as const;

export function getLevelInfo(xp: number) {
  return LEVELS.find(l => xp >= l.minXP && xp <= l.maxXP) || LEVELS[0];
}

export function getXPForNextLevel(currentXP: number) {
  const currentLevel = getLevelInfo(currentXP);
  const nextLevel = LEVELS[currentLevel.level];
  return nextLevel ? nextLevel.minXP - currentXP : 0;
}