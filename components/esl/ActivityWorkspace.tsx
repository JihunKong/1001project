'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Clock, 
  FileText, 
  Save, 
  Send,
  AlertCircle,
  Star,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { ActivityTemplate, CompletedActivity, ActivitySection } from './ActivityTemplates';

interface ActivityWorkspaceProps {
  template: ActivityTemplate;
  bookId: string;
  studentId: string;
  existingActivity?: CompletedActivity;
  onSave?: (activity: CompletedActivity) => void;
  onSubmit?: (activity: CompletedActivity) => void;
}

export default function ActivityWorkspace({
  template,
  bookId,
  studentId,
  existingActivity,
  onSave,
  onSubmit
}: ActivityWorkspaceProps) {
  const [activity, setActivity] = useState<CompletedActivity>(
    existingActivity || {
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
  );

  const [currentSection, setCurrentSection] = useState(0);
  const [startTime] = useState(Date.now());
  const [sectionContent, setSectionContent] = useState<Record<string, any>>({});

  useEffect(() => {
    // Initialize section content from existing activity
    if (existingActivity?.content) {
      setSectionContent(existingActivity.content);
    }
  }, [existingActivity]);

  const updateSectionContent = (sectionId: string, value: any) => {
    const newContent = { ...sectionContent, [sectionId]: value };
    setSectionContent(newContent);
    
    // Update activity content
    setActivity(prev => ({
      ...prev,
      content: newContent,
      timeSpent: Math.round((Date.now() - startTime) / 60000) // minutes
    }));
  };

  const handleSave = () => {
    const updatedActivity = {
      ...activity,
      status: 'draft' as const,
      timeSpent: Math.round((Date.now() - startTime) / 60000)
    };
    setActivity(updatedActivity);
    onSave?.(updatedActivity);
  };

  const handleSubmit = () => {
    const updatedActivity = {
      ...activity,
      status: 'submitted' as const,
      timeSpent: Math.round((Date.now() - startTime) / 60000),
      completedAt: new Date()
    };
    setActivity(updatedActivity);
    onSubmit?.(updatedActivity);
  };

  const isCurrentSectionComplete = () => {
    const section = template.structure.sections[currentSection];
    if (!section.required) return true;
    
    const content = sectionContent[section.id];
    if (!content) return false;
    
    if (section.type === 'text' && typeof content === 'string') {
      const wordCount = content.trim().split(/\s+/).length;
      return wordCount >= (section.constraints?.minWords || 1);
    }
    
    if (section.type === 'checklist' && Array.isArray(content)) {
      return content.length > 0;
    }
    
    if (section.type === 'multiple_choice') {
      return content !== undefined;
    }
    
    return true;
  };

  const canProceed = () => {
    return isCurrentSectionComplete();
  };

  const canSubmit = () => {
    return template.structure.sections.every((section, index) => {
      if (!section.required) return true;
      const content = sectionContent[section.id];
      return content !== undefined && content !== '';
    });
  };

  const renderSection = (section: ActivitySection) => {
    const content = sectionContent[section.id];

    switch (section.type) {
      case 'text':
        return (
          <div className="space-y-4">
            {section.prompts.map((prompt, index) => (
              <div key={index} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {prompt}
                  {section.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <textarea
                  value={content || ''}
                  onChange={(e) => updateSectionContent(section.id, e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Type your answer here..."
                />
                {section.constraints && (
                  <div className="text-xs text-gray-500">
                    {section.constraints.minWords && (
                      <span>Minimum {section.constraints.minWords} words. </span>
                    )}
                    {section.constraints.maxWords && (
                      <span>Maximum {section.constraints.maxWords} words. </span>
                    )}
                    {content && (
                      <span>Current: {content.trim().split(/\s+/).length} words</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      case 'multiple_choice':
        return (
          <div className="space-y-4">
            {section.prompts.map((prompt, promptIndex) => (
              <div key={promptIndex} className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  {prompt}
                  {section.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <div className="space-y-2">
                  {section.options?.map((option, optionIndex) => (
                    <label key={optionIndex} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="radio"
                        name={`${section.id}-${promptIndex}`}
                        value={option}
                        checked={content === option}
                        onChange={(e) => updateSectionContent(section.id, e.target.value)}
                        className="mt-1"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      case 'checklist':
        return (
          <div className="space-y-4">
            {section.prompts.map((prompt, promptIndex) => (
              <div key={promptIndex} className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  {prompt}
                  {section.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <div className="space-y-2">
                  {section.options?.map((option, optionIndex) => (
                    <label key={optionIndex} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(content || []).includes(option)}
                        onChange={(e) => {
                          const currentSelections = content || [];
                          const newSelections = e.target.checked
                            ? [...currentSelections, option]
                            : currentSelections.filter((item: string) => item !== option);
                          updateSectionContent(section.id, newSelections);
                        }}
                        className="mt-1"
                      />
                      <span className="text-sm text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
                {content && content.length > 0 && (
                  <div className="text-xs text-gray-500">
                    Selected: {content.length} item{content.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        );

      case 'fill_blank':
        return (
          <div className="space-y-4">
            {section.prompts.map((prompt, index) => (
              <div key={index} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">{prompt}</label>
                <div className="space-y-3">
                  {section.options?.map((option, optionIndex) => (
                    <div key={optionIndex} className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 flex-1">{option.split('______')[0]}</span>
                      <input
                        type="text"
                        value={(content && content[optionIndex]) || ''}
                        onChange={(e) => {
                          const currentAnswers = content || {};
                          updateSectionContent(section.id, {
                            ...currentAnswers,
                            [optionIndex]: e.target.value
                          });
                        }}
                        className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Your answer"
                      />
                      <span className="text-sm text-gray-700">{option.split('______')[1]}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return <div>Unsupported section type: {section.type}</div>;
    }
  };

  const currentSectionData = template.structure.sections[currentSection];
  const progress = ((currentSection + 1) / template.structure.sections.length) * 100;

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <span className="text-2xl">{template.icon}</span>
              {template.title}
            </h2>
            <p className="text-gray-600 mt-1">{template.description}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <Clock className="w-4 h-4" />
              ~{template.estimatedTime} min
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {template.difficulty.charAt(0).toUpperCase() + template.difficulty.slice(1)} level
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{currentSection + 1} of {template.structure.sections.length}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-blue-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Learning Objectives */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Learning Objectives:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            {template.learningObjectives.map((objective, index) => (
              <li key={index} className="flex items-start gap-2">
                <Star className="w-3 h-3 mt-0.5 flex-shrink-0" />
                {objective}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Current Section */}
      <div className="p-6">
        <motion.div
          key={currentSection}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {currentSectionData.title}
              {currentSectionData.required && (
                <span className="text-red-500 text-sm ml-2">Required</span>
              )}
            </h3>
          </div>

          {renderSection(currentSectionData)}
        </motion.div>
      </div>

      {/* Navigation */}
      <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
        </div>

        <div className="flex items-center gap-2">
          {currentSection > 0 && (
            <button
              onClick={() => setCurrentSection(prev => prev - 1)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
          )}

          {currentSection < template.structure.sections.length - 1 ? (
            <button
              onClick={() => setCurrentSection(prev => prev + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit()}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
              Submit Activity
            </button>
          )}
        </div>
      </div>

      {/* Validation Messages */}
      {!canProceed() && currentSectionData.required && (
        <div className="px-6 pb-4">
          <div className="flex items-center gap-2 text-amber-600 text-sm">
            <AlertCircle className="w-4 h-4" />
            Please complete all required fields before proceeding.
          </div>
        </div>
      )}
    </div>
  );
}