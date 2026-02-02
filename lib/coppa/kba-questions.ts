import crypto from 'crypto';

export interface KBAQuestion {
  id: string;
  category: KBAQuestionCategory;
  question: string;
  questionKo?: string;
  options: string[];
  optionsKo?: string[];
  correctAnswerIndex: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export type KBAQuestionCategory =
  | 'financial'
  | 'identity'
  | 'historical'
  | 'geographic'
  | 'legal';

const KBA_QUESTION_POOL: KBAQuestion[] = [
  {
    id: 'fin_001',
    category: 'financial',
    question: 'What is the typical credit score range in the United States?',
    questionKo: '미국에서 일반적인 신용 점수 범위는 무엇입니까?',
    options: ['100-500', '300-850', '0-1000', '500-1500'],
    optionsKo: ['100-500', '300-850', '0-1000', '500-1500'],
    correctAnswerIndex: 1,
    difficulty: 'medium',
  },
  {
    id: 'fin_002',
    category: 'financial',
    question: 'What does APR stand for in financial terms?',
    questionKo: '금융 용어에서 APR은 무엇을 의미합니까?',
    options: [
      'Annual Percentage Rate',
      'Applied Payment Return',
      'Automatic Payment Reduction',
      'Account Processing Rate',
    ],
    optionsKo: [
      '연간 이자율 (Annual Percentage Rate)',
      '적용 지불 반환',
      '자동 지불 감소',
      '계정 처리율',
    ],
    correctAnswerIndex: 0,
    difficulty: 'easy',
  },
  {
    id: 'fin_003',
    category: 'financial',
    question: 'What is the standard term length for a typical US mortgage?',
    questionKo: '미국 일반 주택담보대출의 표준 기간은 얼마입니까?',
    options: ['10 years', '15 years', '30 years', '50 years'],
    optionsKo: ['10년', '15년', '30년', '50년'],
    correctAnswerIndex: 2,
    difficulty: 'medium',
  },
  {
    id: 'id_001',
    category: 'identity',
    question: 'How many digits are in a US Social Security Number?',
    questionKo: '미국 사회보장번호는 몇 자리입니까?',
    options: ['7', '9', '11', '13'],
    optionsKo: ['7자리', '9자리', '11자리', '13자리'],
    correctAnswerIndex: 1,
    difficulty: 'easy',
  },
  {
    id: 'id_002',
    category: 'identity',
    question: 'What document is typically required to open a bank account in the US?',
    questionKo: '미국에서 은행 계좌를 개설할 때 일반적으로 필요한 서류는 무엇입니까?',
    options: [
      'Birth certificate only',
      'Government-issued photo ID',
      'High school diploma',
      'Library card',
    ],
    optionsKo: ['출생증명서만', '정부 발급 사진 ID', '고등학교 졸업장', '도서관 카드'],
    correctAnswerIndex: 1,
    difficulty: 'easy',
  },
  {
    id: 'id_003',
    category: 'identity',
    question: 'What is the minimum age to get a driver license in most US states?',
    questionKo: '대부분의 미국 주에서 운전면허를 취득할 수 있는 최소 연령은?',
    options: ['14', '16', '18', '21'],
    optionsKo: ['14세', '16세', '18세', '21세'],
    correctAnswerIndex: 1,
    difficulty: 'medium',
  },
  {
    id: 'hist_001',
    category: 'historical',
    question: 'In what year did the United States declare independence?',
    questionKo: '미국이 독립을 선언한 해는?',
    options: ['1765', '1776', '1789', '1812'],
    optionsKo: ['1765년', '1776년', '1789년', '1812년'],
    correctAnswerIndex: 1,
    difficulty: 'easy',
  },
  {
    id: 'hist_002',
    category: 'historical',
    question: 'Who was the first President of the United States?',
    questionKo: '미국의 초대 대통령은 누구입니까?',
    options: [
      'Thomas Jefferson',
      'Abraham Lincoln',
      'George Washington',
      'John Adams',
    ],
    optionsKo: ['토머스 제퍼슨', '에이브러햄 링컨', '조지 워싱턴', '존 애덤스'],
    correctAnswerIndex: 2,
    difficulty: 'easy',
  },
  {
    id: 'geo_001',
    category: 'geographic',
    question: 'What is the capital of the United States?',
    questionKo: '미국의 수도는 어디입니까?',
    options: ['New York', 'Los Angeles', 'Washington D.C.', 'Chicago'],
    optionsKo: ['뉴욕', '로스앤젤레스', '워싱턴 D.C.', '시카고'],
    correctAnswerIndex: 2,
    difficulty: 'easy',
  },
  {
    id: 'geo_002',
    category: 'geographic',
    question: 'How many states are in the United States?',
    questionKo: '미국에는 몇 개의 주가 있습니까?',
    options: ['48', '50', '51', '52'],
    optionsKo: ['48개', '50개', '51개', '52개'],
    correctAnswerIndex: 1,
    difficulty: 'easy',
  },
  {
    id: 'legal_001',
    category: 'legal',
    question: 'What is the minimum voting age in the United States?',
    questionKo: '미국의 최소 투표 연령은?',
    options: ['16', '18', '21', '25'],
    optionsKo: ['16세', '18세', '21세', '25세'],
    correctAnswerIndex: 1,
    difficulty: 'easy',
  },
  {
    id: 'legal_002',
    category: 'legal',
    question: 'What is the legal drinking age in the United States?',
    questionKo: '미국의 법정 음주 연령은?',
    options: ['16', '18', '19', '21'],
    optionsKo: ['16세', '18세', '19세', '21세'],
    correctAnswerIndex: 3,
    difficulty: 'easy',
  },
  {
    id: 'legal_003',
    category: 'legal',
    question: 'What is typically required to serve on a jury in the US?',
    questionKo: '미국에서 배심원으로 봉사하기 위해 일반적으로 필요한 것은?',
    options: [
      'US citizenship and minimum age 18',
      'College degree',
      'Home ownership',
      'Military service',
    ],
    optionsKo: ['미국 시민권 및 최소 18세', '대학 학위', '주택 소유', '군 복무'],
    correctAnswerIndex: 0,
    difficulty: 'medium',
  },
  {
    id: 'fin_004',
    category: 'financial',
    question: 'What is a W-2 form used for in the United States?',
    questionKo: '미국에서 W-2 양식은 무엇에 사용됩니까?',
    options: [
      'Applying for a passport',
      'Reporting wages and taxes withheld',
      'Registering a vehicle',
      'Voting registration',
    ],
    optionsKo: ['여권 신청', '임금 및 원천징수 세금 신고', '차량 등록', '유권자 등록'],
    correctAnswerIndex: 1,
    difficulty: 'medium',
  },
  {
    id: 'fin_005',
    category: 'financial',
    question: 'What is the FDIC insurance limit per depositor per bank?',
    questionKo: 'FDIC 보험의 예금자당 은행당 한도는 얼마입니까?',
    options: ['$100,000', '$150,000', '$250,000', '$500,000'],
    optionsKo: ['$100,000', '$150,000', '$250,000', '$500,000'],
    correctAnswerIndex: 2,
    difficulty: 'hard',
  },
];

export interface KBASession {
  sessionId: string;
  questions: KBAQuestion[];
  answers: Map<string, number>;
  startedAt: Date;
  expiresAt: Date;
  attempts: number;
}

export interface KBAVerificationResult {
  passed: boolean;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  passThreshold: number;
  sessionId: string;
  completedAt: Date;
}

const PASS_THRESHOLD = 0.7;
const SESSION_EXPIRY_MINUTES = 15;
const MAX_ATTEMPTS = 3;
const QUESTIONS_PER_SESSION = 5;

const activeSessions = new Map<string, KBASession>();

export function generateKBASession(
  language: 'en' | 'ko' = 'en'
): { sessionId: string; questions: Array<{ id: string; question: string; options: string[] }> } {
  const sessionId = crypto.randomBytes(32).toString('hex');

  const selectedQuestions = selectRandomQuestions(QUESTIONS_PER_SESSION);

  const session: KBASession = {
    sessionId,
    questions: selectedQuestions,
    answers: new Map(),
    startedAt: new Date(),
    expiresAt: new Date(Date.now() + SESSION_EXPIRY_MINUTES * 60 * 1000),
    attempts: 0,
  };

  activeSessions.set(sessionId, session);

  const publicQuestions = selectedQuestions.map((q) => ({
    id: q.id,
    question: language === 'ko' && q.questionKo ? q.questionKo : q.question,
    options: language === 'ko' && q.optionsKo ? q.optionsKo : q.options,
  }));

  return { sessionId, questions: publicQuestions };
}

function selectRandomQuestions(count: number): KBAQuestion[] {
  const categories: KBAQuestionCategory[] = [
    'financial',
    'identity',
    'historical',
    'geographic',
    'legal',
  ];

  const selectedCategories = shuffleArray(categories).slice(0, count);
  const selected: KBAQuestion[] = [];

  for (const category of selectedCategories) {
    const categoryQuestions = KBA_QUESTION_POOL.filter((q) => q.category === category);
    if (categoryQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * categoryQuestions.length);
      selected.push(categoryQuestions[randomIndex]);
    }
  }

  while (selected.length < count) {
    const remaining = KBA_QUESTION_POOL.filter((q) => !selected.includes(q));
    if (remaining.length === 0) break;
    const randomIndex = Math.floor(Math.random() * remaining.length);
    selected.push(remaining[randomIndex]);
  }

  return shuffleArray(selected);
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function verifyKBAAnswers(
  sessionId: string,
  answers: Record<string, number>
): KBAVerificationResult | { error: string; code: string } {
  const session = activeSessions.get(sessionId);

  if (!session) {
    return { error: 'Session not found or expired', code: 'SESSION_NOT_FOUND' };
  }

  if (new Date() > session.expiresAt) {
    activeSessions.delete(sessionId);
    return { error: 'Session has expired', code: 'SESSION_EXPIRED' };
  }

  session.attempts++;
  if (session.attempts > MAX_ATTEMPTS) {
    activeSessions.delete(sessionId);
    return { error: 'Maximum attempts exceeded', code: 'MAX_ATTEMPTS_EXCEEDED' };
  }

  let correctCount = 0;
  const totalQuestions = session.questions.length;

  for (const question of session.questions) {
    const userAnswer = answers[question.id];
    if (userAnswer === question.correctAnswerIndex) {
      correctCount++;
    }
  }

  const score = correctCount / totalQuestions;
  const passed = score >= PASS_THRESHOLD;

  if (passed) {
    activeSessions.delete(sessionId);
  }

  return {
    passed,
    score: Math.round(score * 100),
    totalQuestions,
    correctAnswers: correctCount,
    passThreshold: Math.round(PASS_THRESHOLD * 100),
    sessionId,
    completedAt: new Date(),
  };
}

export function getSessionStatus(sessionId: string): {
  valid: boolean;
  expiresAt?: Date;
  attempts?: number;
  maxAttempts: number;
} {
  const session = activeSessions.get(sessionId);

  if (!session) {
    return { valid: false, maxAttempts: MAX_ATTEMPTS };
  }

  if (new Date() > session.expiresAt) {
    activeSessions.delete(sessionId);
    return { valid: false, maxAttempts: MAX_ATTEMPTS };
  }

  return {
    valid: true,
    expiresAt: session.expiresAt,
    attempts: session.attempts,
    maxAttempts: MAX_ATTEMPTS,
  };
}

export function cleanupExpiredSessions(): number {
  const now = new Date();
  let cleaned = 0;

  for (const [sessionId, session] of activeSessions.entries()) {
    if (now > session.expiresAt) {
      activeSessions.delete(sessionId);
      cleaned++;
    }
  }

  return cleaned;
}

setInterval(
  () => {
    cleanupExpiredSessions();
  },
  5 * 60 * 1000
);
