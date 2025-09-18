import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  LearningState,
  LearningProgress,
  Vocabulary,
  Quiz,
  QuizAttempt,
  BookClub,
  BookClubPost,
  UserStats,
  UserAchievement,
  ReadingSession,
} from '@/types/learning';

interface LearningActions {
  // Session Management
  startSession: (bookId: string) => void;
  endSession: () => void;
  updatePage: (page: number) => void;
  
  // Progress
  setProgress: (progress: LearningProgress) => void;
  updateProgress: (updates: Partial<LearningProgress>) => void;
  markAsCompleted: () => void;
  
  // Vocabulary
  addVocabulary: (word: Vocabulary) => void;
  updateVocabularyMastery: (wordId: string, correct: boolean) => void;
  setHighlightedWords: (words: string[]) => void;
  selectWord: (word: string, definition: string, position: { x: number; y: number }) => void;
  clearSelectedWord: () => void;
  
  // Quiz
  setCurrentQuiz: (quiz: Quiz) => void;
  updateQuizAnswer: (questionId: string, answer: any) => void;
  submitQuiz: (attempt: QuizAttempt) => void;
  toggleQuizModal: (show?: boolean) => void;
  
  // Book Club
  setCurrentClub: (club: BookClub) => void;
  setClubPosts: (posts: BookClubPost[]) => void;
  addClubPost: (post: BookClubPost) => void;
  updatePostLikes: (postId: string, likes: number, likedByUser: boolean) => void;
  toggleBookClub: (show?: boolean) => void;
  
  // Gamification
  setUserStats: (stats: UserStats) => void;
  updateXP: (amount: number) => void;
  addAchievement: (achievement: UserAchievement) => void;
  setLeaderboard: (leaderboard: LearningState['leaderboard']) => void;
  
  // UI State
  setLoading: (loading: boolean) => void;
  setError: (error?: string) => void;
  reset: () => void;
}

const initialState: LearningState = {
  currentPage: 1,
  currentLevel: 'B1',
  learningProgress: [],
  vocabulary: [],
  highlightedWords: [],
  clubPosts: [],
  bookClubDiscussions: [],
  recentAchievements: [],
  leaderboard: [],
  showQuizModal: false,
  showBookClub: false,
  isLoading: false,
};

export const useLearningStore = create<LearningState & LearningActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // Session Management
        startSession: (bookId) => set((state) => ({
          currentBookId: bookId,
          sessionStartTime: new Date(),
          sessionData: {
            id: crypto.randomUUID(),
            userId: '', // Will be set from session
            bookId,
            startTime: new Date(),
            pagesRead: 0,
            wordsClicked: [],
            highlights: [],
            notes: [],
          } as ReadingSession,
        })),
        
        endSession: () => set((state) => {
          const duration = state.sessionStartTime 
            ? Math.floor((Date.now() - state.sessionStartTime.getTime()) / 1000)
            : 0;
            
          return {
            sessionData: state.sessionData 
              ? { ...state.sessionData, endTime: new Date(), duration }
              : undefined,
            sessionStartTime: undefined,
          };
        }),
        
        updatePage: (page) => set((state) => ({
          currentPage: page,
          sessionData: state.sessionData
            ? { ...state.sessionData, pagesRead: Math.max(state.sessionData.pagesRead, page) }
            : undefined,
        })),
        
        // Progress
        setProgress: (progress) => set({ progress }),
        
        updateProgress: (updates) => set((state) => ({
          progress: state.progress 
            ? { ...state.progress, ...updates }
            : undefined,
        })),
        
        markAsCompleted: () => set((state) => ({
          progress: state.progress
            ? { ...state.progress, isCompleted: true, completedAt: new Date() }
            : undefined,
        })),
        
        // Vocabulary
        addVocabulary: (word) => set((state) => ({
          vocabulary: [...state.vocabulary, word],
          sessionData: state.sessionData
            ? { ...state.sessionData, wordsClicked: [...state.sessionData.wordsClicked, word.word] }
            : undefined,
        })),
        
        updateVocabularyMastery: (wordId, correct) => set((state) => ({
          vocabulary: state.vocabulary.map(v => 
            v.id === wordId
              ? {
                  ...v,
                  timesSeen: v.timesSeen + 1,
                  timesCorrect: correct ? v.timesCorrect + 1 : v.timesCorrect,
                  masteryLevel: correct && v.timesCorrect >= v.timesSeen * 0.8
                    ? Math.min(5, v.masteryLevel + 1)
                    : v.masteryLevel,
                  lastSeen: new Date(),
                }
              : v
          ),
        })),
        
        setHighlightedWords: (words) => set({ highlightedWords: words }),
        
        selectWord: (word, definition, position) => set({
          selectedWord: { word, definition, position },
        }),
        
        clearSelectedWord: () => set({ selectedWord: undefined }),
        
        // Quiz
        setCurrentQuiz: (quiz) => set({ currentQuiz: quiz, quizAttempt: {} }),
        
        updateQuizAnswer: (questionId, answer) => set((state) => ({
          quizAttempt: state.quizAttempt
            ? {
                ...state.quizAttempt,
                answers: { ...state.quizAttempt.answers, [questionId]: answer },
              }
            : { answers: { [questionId]: answer } },
        })),
        
        submitQuiz: (attempt) => set((state) => ({
          quizAttempt: attempt,
          userStats: state.userStats && attempt.passed
            ? { ...state.userStats, quizzesPassed: state.userStats.quizzesPassed + 1 }
            : state.userStats,
        })),
        
        toggleQuizModal: (show) => set((state) => ({
          showQuizModal: show !== undefined ? show : !state.showQuizModal,
        })),
        
        // Book Club
        setCurrentClub: (club) => set({ currentClub: club }),
        
        setClubPosts: (posts) => set({ clubPosts: posts }),
        
        addClubPost: (post) => set((state) => ({
          clubPosts: [post, ...state.clubPosts],
          userStats: state.userStats
            ? { ...state.userStats, postsCreated: state.userStats.postsCreated + 1 }
            : undefined,
        })),
        
        updatePostLikes: (postId, likes, likedByUser) => set((state) => ({
          clubPosts: state.clubPosts.map(p =>
            p.id === postId ? { ...p, likes, likedByUser } : p
          ),
        })),
        
        toggleBookClub: (show) => set((state) => ({
          showBookClub: show !== undefined ? show : !state.showBookClub,
        })),
        
        // Gamification
        setUserStats: (stats) => set({ userStats: stats }),
        
        updateXP: (amount) => set((state) => ({
          userStats: state.userStats
            ? { ...state.userStats, totalXP: state.userStats.totalXP + amount }
            : undefined,
        })),
        
        addAchievement: (achievement) => set((state) => ({
          recentAchievements: [achievement, ...state.recentAchievements].slice(0, 5),
        })),
        
        setLeaderboard: (leaderboard) => set({ leaderboard }),
        
        // UI State
        setLoading: (loading) => set({ isLoading: loading }),
        
        setError: (error) => set({ error }),
        
        reset: () => set(initialState),
      }),
      {
        name: 'learning-storage',
        partialize: (state) => ({
          currentBookId: state.currentBookId,
          currentPage: state.currentPage,
          vocabulary: state.vocabulary,
          userStats: state.userStats,
        }),
      }
    )
  )
);