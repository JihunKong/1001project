import { Page, expect } from '@playwright/test';

export class StudentDashboard {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/dashboard/learner');
    await this.page.waitForLoadState('networkidle');
  }

  async verifyDashboardLoaded() {
    await expect(this.page).toHaveURL(/\/dashboard\/learner/);
    const dashboardElements = [
      'text=My Learning',
      'text=Library',
      'text=Progress',
      'h1:has-text("Dashboard")'
    ];

    for (const element of dashboardElements) {
      const el = await this.page.$(element);
      if (el) {
        await expect(el).toBeVisible();
        return;
      }
    }
  }

  async viewLibrary() {
    await this.page.click('button:has-text("Library"), a:has-text("Library"), [data-testid="library-link"]');
    await this.page.waitForSelector('[data-testid="book-grid"], .books-container', { timeout: 10000 });
  }

  async selectBook(bookTitle: string) {
    await this.viewLibrary();
    await this.page.click(`[data-testid="book-card"]:has-text("${bookTitle}"), .book-card:has-text("${bookTitle}")`);
    await this.page.waitForLoadState('networkidle');
  }

  async startReading(bookId: string) {
    await this.page.goto(`/books/${bookId}/read`);
    await this.page.waitForSelector('[data-testid="pdf-viewer"], .pdf-container, canvas', { timeout: 15000 });
  }

  async highlightVocabulary(word: string) {
    await this.page.dblclick(`text=${word}`);
    await this.page.waitForSelector('[data-testid="vocabulary-popup"], .vocabulary-definition', { timeout: 5000 });
  }

  async getVocabularyDefinition(): Promise<string> {
    const definition = await this.page.textContent('[data-testid="vocabulary-definition"], .definition-text');
    return definition || '';
  }

  async saveVocabularyWord() {
    await this.page.click('button:has-text("Save Word"), button:has-text("Add to Vocabulary")');
    await this.page.waitForSelector('text=Word saved', { timeout: 5000 });
  }

  async changeDifficultyLevel(level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2') {
    await this.page.click('[data-testid="difficulty-selector"], button:has-text("Level")');
    await this.page.click(`button:has-text("${level}"), [data-level="${level}"]`);
    await this.page.waitForSelector(`text=Level changed to ${level}`, { timeout: 5000 });
  }

  async simplifyText() {
    await this.page.click('button:has-text("Simplify"), button[aria-label="Simplify text"]');
    await this.page.waitForSelector('[data-testid="simplified-text"]', { timeout: 10000 });
  }

  async openAITutor() {
    await this.page.click('button:has-text("AI Tutor"), button[aria-label="Open AI Tutor"], [data-testid="ai-tutor-button"]');
    await this.page.waitForSelector('[data-testid="ai-tutor-chat"], .ai-tutor-panel', { timeout: 10000 });
  }

  async askAITutor(question: string): Promise<string> {
    await this.openAITutor();
    await this.page.fill('[data-testid="ai-tutor-input"], textarea[placeholder*="Ask"]', question);
    await this.page.click('button:has-text("Send"), button[aria-label="Send message"]');
    await this.page.waitForSelector('[data-testid="ai-response"]', { timeout: 15000 });
    
    const response = await this.page.textContent('[data-testid="ai-response"]:last-child');
    return response || '';
  }

  async viewProgress() {
    await this.page.click('button:has-text("Progress"), a:has-text("Progress"), [data-testid="progress-link"]');
    await this.page.waitForSelector('[data-testid="progress-chart"], .progress-container');
  }

  async getReadingProgress(): Promise<number> {
    await this.viewProgress();
    const progressText = await this.page.textContent('[data-testid="reading-progress"], .reading-percentage');
    const match = progressText?.match(/(\d+)%/);
    return match ? parseInt(match[1]) : 0;
  }

  async getVocabularyCount(): Promise<number> {
    await this.viewProgress();
    const vocabText = await this.page.textContent('[data-testid="vocabulary-count"], .vocab-learned');
    const match = vocabText?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  async takeQuiz(bookId: string) {
    await this.page.goto(`/books/${bookId}/quiz`);
    await this.page.waitForSelector('[data-testid="quiz-container"]');
  }

  async answerQuizQuestion(questionIndex: number, answerIndex: number) {
    const question = await this.page.$(`[data-testid="quiz-question-${questionIndex}"]`);
    if (question) {
      await question.click(`[data-testid="answer-${answerIndex}"]`);
    }
  }

  async submitQuiz() {
    await this.page.click('button:has-text("Submit Quiz"), button:has-text("Finish")');
    await this.page.waitForSelector('[data-testid="quiz-results"]', { timeout: 10000 });
  }

  async getQuizScore(): Promise<number> {
    const scoreText = await this.page.textContent('[data-testid="quiz-score"], .score');
    const match = scoreText?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  async viewAssignments() {
    await this.page.click('button:has-text("Assignments"), a:has-text("Assignments")');
    await this.page.waitForSelector('[data-testid="assignments-list"]');
  }

  async completeAssignment(assignmentTitle: string) {
    await this.viewAssignments();
    await this.page.click(`[data-testid="assignment"]:has-text("${assignmentTitle}") button:has-text("Start")`);
    await this.page.waitForLoadState('networkidle');
  }

  async viewTeacherFeedback() {
    await this.page.click('button:has-text("Feedback"), [data-testid="feedback-tab"]');
    await this.page.waitForSelector('[data-testid="feedback-list"]');
  }

  async getLatestFeedback(): Promise<string> {
    await this.viewTeacherFeedback();
    const feedback = await this.page.textContent('[data-testid="feedback-item"]:first-child');
    return feedback || '';
  }

  async navigateToNextPage() {
    await this.page.click('button:has-text("Next"), button[aria-label="Next page"]');
    await this.page.waitForTimeout(1000);
  }

  async navigateToPreviousPage() {
    await this.page.click('button:has-text("Previous"), button[aria-label="Previous page"]');
    await this.page.waitForTimeout(1000);
  }

  async getCurrentPageNumber(): Promise<number> {
    const pageText = await this.page.textContent('[data-testid="page-number"], .page-indicator');
    const match = pageText?.match(/(\d+)/);
    return match ? parseInt(match[1]) : 1;
  }

  async bookmarkCurrentPage() {
    await this.page.click('button[aria-label="Bookmark"], [data-testid="bookmark-button"]');
    await this.page.waitForSelector('text=Page bookmarked', { timeout: 5000 });
  }
}