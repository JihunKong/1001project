// Writer's Flow MVP Components
export { default as FlowProgressIndicator } from './FlowProgressIndicator';
export { default as StoryStatusCard } from './StoryStatusCard';
export { default as ActionButtons } from './ActionButtons';
export { default as WorkflowNavigation } from './WorkflowNavigation';

// Hooks
export { useWorkflowUpdates } from './useWorkflowUpdates';

// Types
export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  status: string;
}

export interface WorkflowSubmission {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  authorAlias?: string | null;
  summary?: string;
  wordCount?: number | null;
  category?: string[];
  tags?: string[];
  storyFeedback?: string | null;
  bookDecision?: string | null;
  finalNotes?: string | null;
  publishedAt?: string | null;
  createdAt: string;
}