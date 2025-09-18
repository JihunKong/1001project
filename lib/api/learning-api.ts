import type {
  ApiResponse,
  LearningProgress,
  Vocabulary,
  Quiz,
  QuizAttempt,
  BookClub,
  BookClubPost,
  UserStats,
  UserAchievement,
  ReadingSession,
  PaginatedResponse,
} from '@/types/learning';

const API_BASE = '/api/learn';

// Helper function for API calls
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      return { success: false, error: error.error || response.statusText };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Network error' 
    };
  }
}

// ===== Progress APIs =====

export async function getProgress(bookId: string) {
  return fetchAPI<LearningProgress>(`/progress/${bookId}`);
}

export async function createProgress(bookId: string) {
  return fetchAPI<LearningProgress>('/progress', {
    method: 'POST',
    body: JSON.stringify({ bookId }),
  });
}

export async function updateProgress(
  bookId: string,
  updates: Partial<LearningProgress>
) {
  return fetchAPI<LearningProgress>(`/progress/${bookId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function markAsCompleted(bookId: string) {
  return fetchAPI<LearningProgress>(`/progress/${bookId}/complete`, {
    method: 'POST',
  });
}

export async function completeBook(bookId: string) {
  return fetchAPI<LearningProgress>(`/progress/${bookId}/complete`, {
    method: 'POST',
  });
}

export async function createLearningProgress(bookId: string) {
  return fetchAPI<LearningProgress>('/progress', {
    method: 'POST',
    body: JSON.stringify({ bookId }),
  });
}

// ===== Session APIs =====

export async function createSession(bookId: string) {
  return fetchAPI<ReadingSession>('/sessions', {
    method: 'POST',
    body: JSON.stringify({ bookId }),
  });
}

export async function updateSession(
  sessionId: string,
  updates: Partial<ReadingSession>
) {
  return fetchAPI<ReadingSession>(`/sessions/${sessionId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function endSession(sessionId: string) {
  return fetchAPI<ReadingSession>(`/sessions/${sessionId}/end`, {
    method: 'POST',
  });
}

// ===== Vocabulary APIs =====

export async function getVocabulary(bookId?: string) {
  const params = bookId ? `?bookId=${bookId}` : '';
  return fetchAPI<Vocabulary[]>(`/vocabulary${params}`);
}

export async function addVocabulary(word: Omit<Vocabulary, 'id'>) {
  return fetchAPI<Vocabulary>('/vocabulary', {
    method: 'POST',
    body: JSON.stringify(word),
  });
}

export async function updateVocabularyMastery(
  wordId: string,
  correct: boolean
) {
  return fetchAPI<Vocabulary>(`/vocabulary/${wordId}/mastery`, {
    method: 'PUT',
    body: JSON.stringify({ correct }),
  });
}

export async function analyzeText(text: string, level?: string) {
  return fetchAPI<{ difficultWords: string[] }>('/vocabulary/analyze', {
    method: 'POST',
    body: JSON.stringify({ text, level }),
  });
}

// ===== Quiz APIs =====

export async function generateQuiz(bookId: string, type?: string) {
  return fetchAPI<Quiz>('/quiz/generate', {
    method: 'POST',
    body: JSON.stringify({ bookId, type }),
  });
}

export async function submitQuiz(
  quizId: string,
  answers: Record<string, any>
) {
  return fetchAPI<QuizAttempt>('/quiz/submit', {
    method: 'POST',
    body: JSON.stringify({ quizId, answers }),
  });
}

export async function getQuizHistory(bookId?: string) {
  const params = bookId ? `?bookId=${bookId}` : '';
  return fetchAPI<QuizAttempt[]>(`/quiz/history${params}`);
}

// ===== Book Club APIs =====

export async function getBookClubs(bookId?: string) {
  const params = bookId ? `?bookId=${bookId}` : '';
  return fetchAPI<BookClub[]>(`/bookclub${params}`);
}

export async function createBookClub(club: Omit<BookClub, 'id'>) {
  return fetchAPI<BookClub>('/bookclub', {
    method: 'POST',
    body: JSON.stringify(club),
  });
}

export async function createDiscussion(bookId: string, title: string, content: string) {
  return fetchAPI<BookClub>('/bookclub', {
    method: 'POST',
    body: JSON.stringify({ 
      bookId, 
      title, 
      description: content,
      teacherId: 'system', // Will be replaced with actual teacher ID
      members: [],
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: true
    }),
  });
}

export async function joinBookClub(clubId: string) {
  return fetchAPI<{ success: boolean }>(`/bookclub/${clubId}/join`, {
    method: 'POST',
  });
}

export async function getClubPosts(
  clubId: string,
  page = 1,
  pageSize = 20
) {
  return fetchAPI<PaginatedResponse<BookClubPost>>(
    `/bookclub/${clubId}/posts?page=${page}&pageSize=${pageSize}`
  );
}

export async function createPost(
  clubId: string,
  content: string,
  parentId?: string
) {
  return fetchAPI<BookClubPost>(`/bookclub/${clubId}/posts`, {
    method: 'POST',
    body: JSON.stringify({ content, parentId }),
  });
}

export async function addComment(
  clubId: string,
  postId: string,
  content: string
) {
  return fetchAPI<BookClubPost>(`/bookclub/${clubId}/posts`, {
    method: 'POST',
    body: JSON.stringify({ content, parentId: postId }),
  });
}

export async function likePost(clubId: string, postId: string) {
  return fetchAPI<{ likes: number; likedByUser: boolean }>(
    `/bookclub/${clubId}/posts/${postId}/like`,
    { method: 'POST' }
  );
}

// ===== Gamification APIs =====

export async function getUserStats() {
  return fetchAPI<UserStats>('/gamification/stats');
}

export async function addXP(amount: number, reason: string) {
  return fetchAPI<{ newXP: number; levelUp?: boolean }>('/gamification/xp', {
    method: 'POST',
    body: JSON.stringify({ amount, reason }),
  });
}

export async function getAchievements() {
  return fetchAPI<UserAchievement[]>('/gamification/achievements');
}

export async function checkAchievements() {
  return fetchAPI<UserAchievement[]>('/gamification/achievements/check', {
    method: 'POST',
  });
}

export async function getLeaderboard(
  type: 'class' | 'global' = 'class',
  timeframe: 'daily' | 'weekly' | 'monthly' | 'all' = 'weekly'
) {
  return fetchAPI<Array<{
    userId: string;
    name: string;
    xp: number;
    level: number;
    rank: number;
  }>>(`/leaderboard?type=${type}&timeframe=${timeframe}`);
}

// ===== Utility Functions =====

export function calculateReadingTime(text: string): number {
  // Average reading speed: 200-250 words per minute
  const wordsPerMinute = 225;
  const wordCount = text.split(/\s+/).length;
  return Math.ceil(wordCount / wordsPerMinute);
}

export function getWordDifficulty(word: string, level: string): 'easy' | 'medium' | 'hard' {
  // This is a simplified version - in production, use a proper word frequency database
  const wordLength = word.length;
  
  if (level === 'A1' || level === 'A2') {
    if (wordLength <= 5) return 'easy';
    if (wordLength <= 8) return 'medium';
    return 'hard';
  } else if (level === 'B1' || level === 'B2') {
    if (wordLength <= 6) return 'easy';
    if (wordLength <= 10) return 'medium';
    return 'hard';
  } else {
    if (wordLength <= 8) return 'easy';
    if (wordLength <= 12) return 'medium';
    return 'hard';
  }
}