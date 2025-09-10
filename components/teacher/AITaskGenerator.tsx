'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Wand2,
  BookOpen,
  Users,
  User,
  Brain,
  Target,
  FileText,
  CheckCircle,
  RefreshCw,
  Copy,
  Download,
  Settings,
  Lightbulb,
  MessageSquare,
  PlusCircle,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  Save,
  Send
} from 'lucide-react';

interface Book {
  id: string;
  title: string;
  author: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  content?: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  readingLevel: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  className: string;
}

interface GeneratedTask {
  id: string;
  type: 'comprehension' | 'vocabulary' | 'creative' | 'discussion' | 'analysis';
  title: string;
  description: string;
  questions: {
    question: string;
    type: 'multiple_choice' | 'short_answer' | 'essay' | 'true_false';
    options?: string[];
    correctAnswer?: string;
    points: number;
  }[];
  estimatedTime: number; // in minutes
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  bookId?: string;
  targetStudents?: string[];
  createdAt: string;
  isPublished: boolean;
}

interface TaskTemplate {
  type: 'comprehension' | 'vocabulary' | 'creative' | 'discussion' | 'analysis';
  name: string;
  description: string;
  icon: any;
  prompts: string[];
}

export default function AITaskGenerator() {
  const [books, setBooks] = useState<Book[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [generatedTasks, setGeneratedTasks] = useState<GeneratedTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<string>('');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [taskType, setTaskType] = useState<'comprehension' | 'vocabulary' | 'creative' | 'discussion' | 'analysis'>('comprehension');
  const [customPrompt, setCustomPrompt] = useState('');
  const [difficulty, setDifficulty] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('INTERMEDIATE');
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);

  const taskTemplates: TaskTemplate[] = [
    {
      type: 'comprehension',
      name: 'Reading Comprehension',
      description: 'Generate questions to test understanding of the text',
      icon: Brain,
      prompts: [
        'Create comprehension questions about the main themes',
        'Generate questions about character development',
        'Create questions about plot progression and key events',
        'Generate questions about the author\'s writing style and techniques'
      ]
    },
    {
      type: 'vocabulary',
      name: 'Vocabulary Building',
      description: 'Create exercises to expand vocabulary from the text',
      icon: BookOpen,
      prompts: [
        'Identify challenging words and create definition exercises',
        'Create context-based vocabulary questions',
        'Generate synonym and antonym exercises',
        'Create word usage and sentence completion tasks'
      ]
    },
    {
      type: 'creative',
      name: 'Creative Writing',
      description: 'Inspire creative responses and writing exercises',
      icon: Lightbulb,
      prompts: [
        'Create alternative ending writing prompts',
        'Generate character perspective writing exercises',
        'Create story extension prompts',
        'Generate creative response and reflection questions'
      ]
    },
    {
      type: 'discussion',
      name: 'Discussion Starters',
      description: 'Generate thought-provoking discussion questions',
      icon: MessageSquare,
      prompts: [
        'Create open-ended discussion questions about themes',
        'Generate ethical dilemma questions from the story',
        'Create questions that connect the story to real life',
        'Generate debate topics related to the book\'s content'
      ]
    },
    {
      type: 'analysis',
      name: 'Literary Analysis',
      description: 'Create analytical thinking exercises',
      icon: Target,
      prompts: [
        'Generate questions about literary devices and techniques',
        'Create comparative analysis questions',
        'Generate critical thinking questions about author intent',
        'Create questions about historical and cultural context'
      ]
    }
  ];

  useEffect(() => {
    fetchData();
    fetchGeneratedTasks();
  }, []);

  const fetchData = async () => {
    try {
      const [booksRes, studentsRes] = await Promise.all([
        fetch('/api/books'),
        fetch('/api/teacher/students')
      ]);

      if (booksRes.ok && studentsRes.ok) {
        const [booksData, studentsData] = await Promise.all([
          booksRes.json(),
          studentsRes.json()
        ]);

        if (booksData.success) setBooks(booksData.data.books || []);
        if (studentsData.success) setStudents(studentsData.data.students || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const fetchGeneratedTasks = async () => {
    try {
      const response = await fetch('/api/teacher/ai-tasks');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setGeneratedTasks(result.data.tasks || []);
        }
      }
    } catch (err) {
      console.error('Error fetching generated tasks:', err);
    }
  };

  const generateTasks = async () => {
    if (!selectedBook) {
      setError('Please select a book first');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const template = taskTemplates.find(t => t.type === taskType);
      const prompt = customPrompt || (template?.prompts[0] || '');

      const response = await fetch('/api/teacher/ai-tasks/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookId: selectedBook,
          taskType,
          difficulty,
          prompt,
          targetStudents: selectedStudents
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate tasks');
      }

      const result = await response.json();
      
      if (result.success) {
        await fetchGeneratedTasks(); // Refresh the list
        setCustomPrompt('');
      } else {
        throw new Error(result.error || 'Failed to generate tasks');
      }
    } catch (err) {
      console.error('Error generating tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate tasks');
    } finally {
      setLoading(false);
    }
  };

  const publishTask = async (taskId: string) => {
    try {
      setError(null);
      
      const response = await fetch(`/api/teacher/ai-tasks/${taskId}/publish`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to publish task');
      }

      const result = await response.json();
      
      if (result.success) {
        await fetchGeneratedTasks();
      } else {
        throw new Error(result.error || 'Failed to publish task');
      }
    } catch (err) {
      console.error('Error publishing task:', err);
      setError(err instanceof Error ? err.message : 'Failed to publish task');
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      setError(null);
      
      const response = await fetch(`/api/teacher/ai-tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      const result = await response.json();
      
      if (result.success) {
        await fetchGeneratedTasks();
      } else {
        throw new Error(result.error || 'Failed to delete task');
      }
    } catch (err) {
      console.error('Error deleting task:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  const copyTask = async (task: GeneratedTask) => {
    try {
      const taskText = `
${task.title}
${task.description}

Questions:
${task.questions.map((q, idx) => `
${idx + 1}. ${q.question}
${q.type === 'multiple_choice' && q.options ? q.options.map((opt, optIdx) => `   ${String.fromCharCode(65 + optIdx)}. ${opt}`).join('\n') : ''}
${q.type === 'multiple_choice' && q.correctAnswer ? `   Correct Answer: ${q.correctAnswer}` : ''}
Points: ${q.points}
`).join('\n')}
      `.trim();

      await navigator.clipboard.writeText(taskText);
      // Show success notification
      const originalIcon = document.querySelector(`[data-task-id="${task.id}"] .copy-icon`);
      if (originalIcon) {
        originalIcon.classList.add('text-green-500');
        setTimeout(() => originalIcon.classList.remove('text-green-500'), 2000);
      }
    } catch (err) {
      console.error('Failed to copy task:', err);
    }
  };

  const exportTask = (task: GeneratedTask) => {
    const taskData = {
      title: task.title,
      description: task.description,
      type: task.type,
      difficulty: task.difficulty,
      estimatedTime: task.estimatedTime,
      questions: task.questions,
      createdAt: task.createdAt
    };

    const blob = new Blob([JSON.stringify(taskData, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${task.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getTaskTypeIcon = (type: string) => {
    const template = taskTemplates.find(t => t.type === type);
    return template?.icon || FileText;
  };

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'comprehension': return 'bg-blue-100 text-blue-700';
      case 'vocabulary': return 'bg-green-100 text-green-700';
      case 'creative': return 'bg-purple-100 text-purple-700';
      case 'discussion': return 'bg-orange-100 text-orange-700';
      case 'analysis': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER': return 'bg-blue-100 text-blue-700';
      case 'INTERMEDIATE': return 'bg-orange-100 text-orange-700';
      case 'ADVANCED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Task Generator */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <Wand2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AI Task Generator</h2>
            <p className="text-gray-600">Create personalized learning tasks using AI</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configuration Panel */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Book *
              </label>
              <select
                value={selectedBook}
                onChange={(e) => setSelectedBook(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Choose a book...</option>
                {books.map(book => (
                  <option key={book.id} value={book.id}>
                    {book.title} by {book.author} ({book.difficulty})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Task Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {taskTemplates.map((template) => {
                  const Icon = template.icon;
                  return (
                    <button
                      key={template.type}
                      onClick={() => setTaskType(template.type)}
                      className={`p-3 border-2 rounded-lg text-left transition-all ${
                        taskType === template.type
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium">{template.name}</span>
                      </div>
                      <p className="text-xs text-gray-600">{template.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Students (Optional)
              </label>
              <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-lg p-2">
                {students.map(student => (
                  <label key={student.id} className="flex items-center p-1 hover:bg-gray-50 rounded">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudents(prev => [...prev, student.id]);
                        } else {
                          setSelectedStudents(prev => prev.filter(id => id !== student.id));
                        }
                      }}
                      className="mr-2"
                    />
                    <span className="text-sm">{student.name} ({student.readingLevel})</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Custom Prompt Panel */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom Instructions (Optional)
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Provide specific instructions for the AI to generate tasks..."
              />
            </div>

            {/* Quick Prompts */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Prompts
              </label>
              <div className="space-y-2">
                {taskTemplates.find(t => t.type === taskType)?.prompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCustomPrompt(prompt)}
                    className="w-full text-left p-2 text-sm border border-gray-200 rounded hover:bg-gray-50 transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generateTasks}
              disabled={loading || !selectedBook}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Tasks...
                </>
              ) : (
                <>
                  <Star className="w-5 h-5" />
                  Generate AI Tasks
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generated Tasks */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Generated Tasks</h3>
        
        {generatedTasks.length > 0 ? (
          <div className="space-y-4">
            {generatedTasks.map((task, index) => {
              const Icon = getTaskTypeIcon(task.type);
              
              return (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
                  data-task-id={task.id}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-2">
                        <Icon className="w-5 h-5 text-blue-600" />
                        <h4 className="font-semibold text-gray-900">{task.title}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTaskTypeColor(task.type)}`}>
                          {task.type.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(task.difficulty)}`}>
                          {task.difficulty}
                        </span>
                        {task.isPublished && (
                          <CheckCircle className="w-4 h-4 text-green-500" title="Published" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{task.questions.length} questions</span>
                        <span>{task.estimatedTime} minutes</span>
                        <span>Created {new Date(task.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowPreview(showPreview === task.id ? null : task.id)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Preview"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => copyTask(task)}
                        className="p-1 text-gray-400 hover:text-green-600 transition-colors copy-icon"
                        title="Copy"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => exportTask(task)}
                        className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                        title="Export"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      
                      {!task.isPublished && (
                        <button
                          onClick={() => publishTask(task.id)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Publish"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Task Preview */}
                  <AnimatePresence>
                    {showPreview === task.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-gray-100"
                      >
                        <h5 className="font-medium text-gray-900 mb-3">Task Preview</h5>
                        <div className="space-y-3">
                          {task.questions.map((question, qIdx) => (
                            <div key={qIdx} className="bg-gray-50 p-3 rounded">
                              <div className="flex items-start justify-between mb-2">
                                <p className="font-medium text-gray-900">
                                  {qIdx + 1}. {question.question}
                                </p>
                                <span className="text-xs text-gray-500 ml-2">
                                  {question.points} pts
                                </span>
                              </div>
                              
                              {question.type === 'multiple_choice' && question.options && (
                                <div className="space-y-1 ml-4">
                                  {question.options.map((option, optIdx) => (
                                    <div key={optIdx} className="text-sm text-gray-600">
                                      {String.fromCharCode(65 + optIdx)}. {option}
                                    </div>
                                  ))}
                                  {question.correctAnswer && (
                                    <div className="text-xs text-green-600 mt-2">
                                      Correct: {question.correctAnswer}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <div className="mt-2 text-xs text-gray-500">
                                Type: {question.type.replace('_', ' ')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Star className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No AI tasks generated yet</h3>
            <p className="text-gray-600">
              Generate your first AI-powered learning task using the form above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}