export interface ActivityTemplate {
  id: string
  type: 'vocabulary' | 'comprehension' | 'discussion' | 'writing'
  title: string
  description: string
  icon: string
  estimatedTime: number // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  learningObjectives: string[]
  structure: ActivityStructure
  exampleContent?: any
}

export interface ActivityStructure {
  sections: ActivitySection[]
}

export interface ActivitySection {
  id: string
  title: string
  type: 'text' | 'multiple_choice' | 'checklist' | 'word_match' | 'fill_blank'
  required: boolean
  prompts: string[]
  constraints?: {
    minWords?: number
    maxWords?: number
    requiredElements?: string[]
  }
  options?: string[] // For multiple choice
  correctAnswers?: string[] // For exercises with correct answers
}

export interface CompletedActivity {
  id: string
  templateId: string
  activityType: string
  bookId: string
  studentId: string
  title: string
  completedAt: Date
  timeSpent: number // minutes
  content: any
  evaluation?: {
    score?: number
    feedback: string
    strengths: string[]
    improvements: string[]
  }
  status: 'draft' | 'submitted' | 'evaluated'
}

export const eslActivityTemplates: ActivityTemplate[] = [
  {
    id: 'esl-vocabulary-basic',
    type: 'vocabulary',
    title: 'Vocabulary Builder',
    description: 'Learn and practice new words from the story',
    icon: '📚',
    estimatedTime: 15,
    difficulty: 'beginner',
    learningObjectives: [
      'Identify new vocabulary words',
      'Understand word meanings in context',
      'Practice using new words in sentences',
      'Build vocabulary retention'
    ],
    structure: {
      sections: [
        {
          id: 'word_identification',
          title: 'New Words',
          type: 'checklist',
          required: true,
          prompts: [
            'Select the words that are new to you from this story:'
          ],
          options: [
            'adventure', 'curious', 'explore', 'journey', 'discovery',
            'courage', 'friendship', 'challenge', 'wonder', 'magical'
          ]
        },
        {
          id: 'word_meanings',
          title: 'Word Meanings',
          type: 'word_match',
          required: true,
          prompts: [
            'Match each word with its meaning:'
          ],
          options: [
            'adventure - an exciting or unusual experience',
            'curious - wanting to know or learn about something',
            'explore - to travel through an area to learn about it',
            'journey - an act of traveling from one place to another',
            'courage - the ability to do something that frightens you'
          ]
        },
        {
          id: 'word_usage',
          title: 'Use New Words',
          type: 'text',
          required: true,
          prompts: [
            'Write a sentence using at least 3 of the new words from the story.'
          ],
          constraints: {
            minWords: 10,
            maxWords: 50
          }
        }
      ]
    }
  },
  {
    id: 'esl-comprehension-basic',
    type: 'comprehension',
    title: 'Reading Comprehension',
    description: 'Test your understanding of the story',
    icon: '🤔',
    estimatedTime: 20,
    difficulty: 'intermediate',
    learningObjectives: [
      'Demonstrate story comprehension',
      'Identify main ideas and details',
      'Make inferences from text',
      'Analyze character motivations'
    ],
    structure: {
      sections: [
        {
          id: 'main_idea',
          title: 'Main Idea',
          type: 'multiple_choice',
          required: true,
          prompts: [
            'What is the main idea of this story?'
          ],
          options: [
            'A child learns about friendship through adventure',
            'A magical journey changes someone\'s perspective',
            'Overcoming fears leads to personal growth',
            'Family relationships are the most important'
          ]
        },
        {
          id: 'story_details',
          title: 'Story Details',
          type: 'fill_blank',
          required: true,
          prompts: [
            'Fill in the blanks based on the story:'
          ],
          options: [
            'The main character\'s name is ______.',
            'The story takes place in ______.',
            'The biggest challenge was ______.',
            'The story ended when ______.'
          ]
        },
        {
          id: 'inference',
          title: 'Reading Between the Lines',
          type: 'text',
          required: true,
          prompts: [
            'What do you think the character learned from this experience?',
            'How do you think the character felt at the end of the story?'
          ],
          constraints: {
            minWords: 30,
            maxWords: 100
          }
        }
      ]
    }
  },
  {
    id: 'esl-discussion-intermediate',
    type: 'discussion',
    title: 'Story Discussion',
    description: 'Explore themes and share your thoughts',
    icon: '💬',
    estimatedTime: 25,
    difficulty: 'intermediate',
    learningObjectives: [
      'Express personal opinions about the story',
      'Connect story themes to real life',
      'Practice discussion vocabulary',
      'Develop critical thinking skills'
    ],
    structure: {
      sections: [
        {
          id: 'personal_connection',
          title: 'Personal Connection',
          type: 'text',
          required: true,
          prompts: [
            'Have you ever had an experience similar to the main character?',
            'What would you have done in the same situation?'
          ],
          constraints: {
            minWords: 50,
            maxWords: 150
          }
        },
        {
          id: 'themes',
          title: 'Story Themes',
          type: 'checklist',
          required: true,
          prompts: [
            'Which themes do you see in this story? (Select all that apply)'
          ],
          options: [
            'Friendship and relationships',
            'Growing up and learning',
            'Overcoming challenges',
            'Family and community',
            'Cultural differences',
            'Following your dreams'
          ]
        },
        {
          id: 'opinion',
          title: 'Your Opinion',
          type: 'text',
          required: true,
          prompts: [
            'What is the most important message from this story?',
            'Would you recommend this story to a friend? Why or why not?'
          ],
          constraints: {
            minWords: 40,
            maxWords: 120
          }
        }
      ]
    }
  },
  {
    id: 'esl-writing-creative',
    type: 'writing',
    title: 'Creative Writing',
    description: 'Write your own story inspired by what you read',
    icon: '✍️',
    estimatedTime: 30,
    difficulty: 'advanced',
    learningObjectives: [
      'Practice creative writing skills',
      'Use new vocabulary in writing',
      'Develop story structure understanding',
      'Express ideas clearly in English'
    ],
    structure: {
      sections: [
        {
          id: 'story_planning',
          title: 'Plan Your Story',
          type: 'text',
          required: true,
          prompts: [
            'Who is your main character?',
            'Where does your story take place?',
            'What problem or challenge will your character face?',
            'How will they solve it?'
          ],
          constraints: {
            minWords: 40,
            maxWords: 100
          }
        },
        {
          id: 'vocabulary_check',
          title: 'Vocabulary Challenge',
          type: 'checklist',
          required: true,
          prompts: [
            'Which vocabulary words from today\'s story will you try to use in your writing?'
          ],
          options: [
            'adventure', 'curious', 'explore', 'journey', 'discovery',
            'courage', 'friendship', 'challenge', 'wonder', 'magical'
          ]
        },
        {
          id: 'creative_story',
          title: 'Write Your Story',
          type: 'text',
          required: true,
          prompts: [
            'Now write your short story! Remember to use some of the vocabulary words you selected.'
          ],
          constraints: {
            minWords: 100,
            maxWords: 300,
            requiredElements: ['character', 'setting', 'problem', 'solution']
          }
        }
      ]
    }
  }
]

// Helper function to generate activity from template
export function generateActivityFromTemplate(
  template: ActivityTemplate,
  bookId: string,
  studentId: string
): CompletedActivity {
  return {
    id: `activity-${Date.now()}`,
    templateId: template.id,
    activityType: template.type,
    bookId,
    studentId,
    title: template.title,
    completedAt: new Date(),
    timeSpent: 0,
    content: {},
    status: 'draft'
  }
}

// Calculate activity progress and stats
export function calculateActivityStats(activities: CompletedActivity[]) {
  const totalActivities = activities.length
  const completedActivities = activities.filter(a => a.status === 'evaluated').length
  const totalTimeSpent = activities.reduce((sum, a) => sum + a.timeSpent, 0)
  const averageScore = activities
    .filter(a => a.evaluation?.score)
    .reduce((sum, a, _, arr) => sum + (a.evaluation?.score || 0) / arr.length, 0)
  
  const activityTypeCount = activities.reduce((acc, a) => {
    acc[a.activityType] = (acc[a.activityType] || 0) + 1
    return acc
  }, {} as Record<string, number>)
  
  return {
    totalActivities,
    completedActivities,
    totalTimeSpent,
    averageScore: Math.round(averageScore),
    activityTypeCount,
    completionRate: Math.round((completedActivities / totalActivities) * 100)
  }
}