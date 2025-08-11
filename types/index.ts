export type UserRole = 'learner' | 'teacher' | 'institution' | 'volunteer' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Story {
  id: string;
  title: string;
  author: string;
  authorAge?: number;
  country: string;
  content: string;
  coverImage?: string;
  illustrations?: string[];
  status: 'submitted' | 'reviewing' | 'translating' | 'illustrating' | 'editing' | 'published';
  language: string;
  translations?: Translation[];
  tags: string[];
  createdAt: Date;
  publishedAt?: Date;
}

export interface Translation {
  id: string;
  storyId: string;
  language: string;
  title: string;
  content: string;
  translatorId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'approved';
}

export interface LearnerProgress {
  userId: string;
  storiesRead: number;
  wordsLearned: number;
  timeSpent: number; // in minutes
  currentStreak: number;
  achievements: Achievement[];
  courses: Course[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: Date;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  progress: number; // percentage
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  content: string;
  completed: boolean;
  completedAt?: Date;
}

export interface VolunteerProject {
  id: string;
  title: string;
  description: string;
  skills: string[];
  timeCommitment: string;
  status: 'open' | 'in_progress' | 'completed';
  volunteers: Volunteer[];
}

export interface Volunteer {
  userId: string;
  name: string;
  skills: string[];
  hoursContributed: number;
  projectsCompleted: number;
  certificates: Certificate[];
}

export interface Certificate {
  id: string;
  title: string;
  description: string;
  issuedAt: Date;
  pdfUrl: string;
}