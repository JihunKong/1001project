'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import QuizQuestion from '@/components/quiz/QuizQuestion';
import QuizResults from '@/components/quiz/QuizResults';

interface QuizQuestionData {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizData {
  id: string;
  bookId: string;
  title: string;
  description: string;
  questions: QuizQuestionData[];
  passingScore: number;
  timeLimit: number | null;
  book: {
    id: string;
    title: string;
    coverImage: string | null;
  };
}

interface UserStats {
  attemptCount: number;
  bestScore: number | null;
  passed: boolean;
  lastAttempt: {
    score: number;
    passed: boolean;
    completedAt: string;
  } | null;
}

interface SubmitResult {
  attempt: {
    score: number;
    passed: boolean;
    correctCount: number;
    totalQuestions: number;
    answers: {
      questionIndex: number;
      selectedAnswer: number;
      isCorrect: boolean;
      correctAnswer: number;
      explanation: string;
    }[];
    timeSpent?: number;
  };
  stats: {
    attemptCount: number;
    bestScore: number;
    isNewBest: boolean;
  };
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = params.bookId as string;

  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [showReview, setShowReview] = useState(false);

  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    fetchQuiz();
  }, [bookId]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0 || result) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, result]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/quizzes/${bookId}`);

      if (res.status === 404) {
        setError('Quiz not found for this book.');
        return;
      }

      if (!res.ok) {
        throw new Error('Failed to fetch quiz');
      }

      const data = await res.json();
      setQuiz(data.quiz);
      setUserStats(data.userStats);
      setAnswers(new Array(data.quiz.questions.length).fill(null));

      if (data.quiz.timeLimit) {
        setTimeRemaining(data.quiz.timeLimit * 60);
      }
      setStartTime(Date.now());
    } catch (err) {
      console.error('Error fetching quiz:', err);
      setError('Failed to load quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = useCallback(async () => {
    if (!quiz || isSubmitting) return;

    const unansweredCount = answers.filter((a) => a === null).length;
    if (unansweredCount > 0 && timeRemaining !== 0) {
      const confirm = window.confirm(
        `You have ${unansweredCount} unanswered question(s). Submit anyway?`
      );
      if (!confirm) return;
    }

    setIsSubmitting(true);

    try {
      const timeSpent = startTime
        ? Math.floor((Date.now() - startTime) / 1000)
        : undefined;

      const res = await fetch('/api/quizzes/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizId: quiz.id,
          answers: answers.map((selectedAnswer, questionIndex) => ({
            questionIndex,
            selectedAnswer: selectedAnswer ?? 0,
          })),
          timeSpent,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to submit quiz');
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Error submitting quiz:', err);
      setError('Failed to submit quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [quiz, answers, isSubmitting, startTime, timeRemaining]);

  const handleRetry = () => {
    setResult(null);
    setShowReview(false);
    setCurrentQuestionIndex(0);
    setAnswers(new Array(quiz?.questions.length || 0).fill(null));
    if (quiz?.timeLimit) {
      setTimeRemaining(quiz.timeLimit * 60);
    }
    setStartTime(Date.now());
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {error || 'Quiz Not Found'}
          </h1>
          <p className="text-gray-600 mb-6">
            This book may not have a quiz yet, or there was an error loading it.
          </p>
          <Link
            href={`/dashboard/learner/read/${bookId}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Book
          </Link>
        </div>
      </div>
    );
  }

  if (result && !showReview) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-lg mx-auto">
          <QuizResults
            score={result.attempt.score}
            passed={result.attempt.passed}
            correctCount={result.attempt.correctCount}
            totalQuestions={result.attempt.totalQuestions}
            passingScore={quiz.passingScore}
            timeSpent={result.attempt.timeSpent}
            bestScore={result.stats.bestScore}
            isNewBest={result.stats.isNewBest}
            bookId={bookId}
            bookTitle={quiz.book.title}
            onRetry={handleRetry}
          />

          <div className="mt-4 text-center">
            <button
              onClick={() => setShowReview(true)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Review Your Answers
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const answeredCount = answers.filter((a) => a !== null).length;
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              href={`/dashboard/learner/read/${bookId}`}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back to Book</span>
            </Link>

            <div className="flex items-center gap-4">
              {timeRemaining !== null && (
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                  timeRemaining < 60 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  <Clock className="w-4 h-4" />
                  <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
                </div>
              )}

              <div className="text-sm text-gray-500">
                {answeredCount}/{quiz.questions.length} answered
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          {quiz.book.coverImage && (
            <div className="relative w-12 h-16 flex-shrink-0">
              <Image
                src={quiz.book.coverImage}
                alt={quiz.book.title}
                fill
                className="object-cover rounded"
              />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">{quiz.title}</h1>
            <p className="text-sm text-gray-500">{quiz.book.title}</p>
          </div>
        </div>

        <QuizQuestion
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={quiz.questions.length}
          question={currentQuestion.question}
          options={currentQuestion.options}
          selectedAnswer={answers[currentQuestionIndex]}
          correctAnswer={showReview ? result?.attempt.answers[currentQuestionIndex]?.correctAnswer : undefined}
          explanation={showReview ? result?.attempt.answers[currentQuestionIndex]?.explanation : undefined}
          isSubmitted={showReview}
          onSelectAnswer={handleSelectAnswer}
        />

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          {!showReview && isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Quiz'
              )}
            </button>
          ) : (
            <button
              onClick={() =>
                setCurrentQuestionIndex((prev) =>
                  Math.min(quiz.questions.length - 1, prev + 1)
                )
              }
              disabled={currentQuestionIndex === quiz.questions.length - 1}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {quiz.questions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestionIndex(index)}
              className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                currentQuestionIndex === index
                  ? 'bg-blue-500 text-white'
                  : answers[index] !== null
                  ? showReview
                    ? result?.attempt.answers[index]?.isCorrect
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-red-100 text-red-700 border border-red-300'
                    : 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {showReview && (
          <div className="mt-8 text-center">
            <button
              onClick={() => setShowReview(false)}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
            >
              Back to Results
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
