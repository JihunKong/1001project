'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Brain, 
  GraduationCap, 
  Loader2,
  ChevronDown,
  Info
} from 'lucide-react';

interface DifficultyAdjusterProps {
  currentDifficulty: 'beginner' | 'intermediate' | 'advanced';
  onDifficultyChange: (difficulty: 'beginner' | 'intermediate' | 'advanced') => void;
  isLoading?: boolean;
}

const difficultyOptions = [
  {
    level: 'beginner' as const,
    label: 'Beginner',
    icon: Zap,
    description: 'Simple vocabulary and shorter sentences',
    color: 'text-green-600 bg-green-50 border-green-200',
    features: ['Simple words', 'Short sentences', 'Basic grammar', 'Common vocabulary'],
    targetAge: 'Elementary (Ages 6-11)'
  },
  {
    level: 'intermediate' as const,
    label: 'Intermediate',
    icon: Brain,
    description: 'Balanced complexity with moderate vocabulary',
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    features: ['Mixed vocabulary', 'Varied sentences', 'Some idioms', 'Context clues'],
    targetAge: 'Middle School (Ages 12-14)'
  },
  {
    level: 'advanced' as const,
    label: 'Advanced',
    icon: GraduationCap,
    description: 'Original complexity with rich vocabulary',
    color: 'text-red-600 bg-red-50 border-red-200',
    features: ['Complex words', 'Long sentences', 'Advanced grammar', 'Nuanced meaning'],
    targetAge: 'High School+ (Ages 15+)'
  }
];

export default function DifficultyAdjuster({ 
  currentDifficulty, 
  onDifficultyChange, 
  isLoading = false 
}: DifficultyAdjusterProps) {
  const [showDetails, setShowDetails] = useState(false);

  const currentOption = difficultyOptions.find(opt => opt.level === currentDifficulty);

  return (
    <div className="bg-blue-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
            <Brain className="w-4 h-4" />
            Reading Difficulty
          </h3>
          <p className="text-xs text-gray-600 mt-1">
            Adjust text complexity to match your level
          </p>
        </div>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          title="Show difficulty details"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Current Level Display */}
      <div className="mb-4">
        <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border ${currentOption?.color}`}>
          {currentOption && <currentOption.icon className="w-4 h-4" />}
          <span className="font-medium text-sm">{currentOption?.label}</span>
          {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
        </div>
        <p className="text-xs text-gray-600 mt-2">{currentOption?.description}</p>
      </div>

      {/* Level Selector */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {difficultyOptions.map((option) => (
          <button
            key={option.level}
            onClick={() => onDifficultyChange(option.level)}
            disabled={isLoading || option.level === currentDifficulty}
            className={`p-3 rounded-lg border-2 transition-all text-left ${
              option.level === currentDifficulty
                ? option.color + ' border-current'
                : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <option.icon className="w-4 h-4" />
              <span className="font-medium text-sm">{option.label}</span>
            </div>
            <p className="text-xs opacity-75">{option.targetAge}</p>
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-blue-100 rounded-lg p-3 mb-4"
        >
          <div className="flex items-center gap-2 text-blue-700">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Adapting text difficulty...</span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Using AI to adjust vocabulary and sentence complexity
          </p>
        </motion.div>
      )}

      {/* Detailed Information */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-blue-200 pt-3"
        >
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            What each level includes:
          </h4>
          
          <div className="space-y-3">
            {difficultyOptions.map((option) => (
              <div
                key={option.level}
                className={`p-3 rounded-lg border ${
                  option.level === currentDifficulty 
                    ? option.color 
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <option.icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{option.label}</span>
                  <span className="text-xs text-gray-500">({option.targetAge})</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  {option.features.map((feature, index) => (
                    <div key={index} className="text-xs text-gray-600 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-current rounded-full opacity-50"></div>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-amber-50 rounded-lg">
            <h5 className="text-sm font-medium text-amber-800 mb-1">How it works</h5>
            <p className="text-xs text-amber-700">
              Our AI analyzes the text and adjusts vocabulary complexity, sentence length, 
              and grammatical structures while preserving the original meaning and story flow.
            </p>
          </div>
        </motion.div>
      )}

      {/* Progress Indicator */}
      <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
        <span>Reading Level</span>
        <div className="flex items-center gap-1">
          {difficultyOptions.map((option, index) => (
            <div
              key={option.level}
              className={`w-2 h-2 rounded-full transition-colors ${
                difficultyOptions.findIndex(opt => opt.level === currentDifficulty) >= index
                  ? 'bg-blue-600'
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}