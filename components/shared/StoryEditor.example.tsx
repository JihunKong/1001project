// Example usage of the StoryEditor component
// This file demonstrates how to integrate the StoryEditor into your app

'use client';

import React from 'react';
import { StoryEditor } from './StoryEditor';

interface StoryData {
  title: string;
  content: string;
  chapters: Array<{
    id: string;
    title: string;
    content: string;
    wordCount: number;
  }>;
}

export const StoryEditorExample: React.FC = () => {
  // Example save handler - replace with your actual API call
  const handleSave = async (data: StoryData) => {
    console.log('Saving story:', data);
    // Example API call:
    // await fetch('/api/stories/save', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data)
    // });
  };

  // Example submit handler - replace with your actual API call
  const handleSubmit = async (data: StoryData) => {
    console.log('Submitting story for review:', data);
    // Example API call:
    // await fetch('/api/stories/submit', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data)
    // });
  };

  // Example with initial data
  const initialChapters = [
    {
      id: '1',
      title: 'Chapter 1: The Beginning',
      content: '<p>Once upon a time...</p>',
      wordCount: 4
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <StoryEditor
          initialTitle="My New Story"
          initialContent="<p>Start writing your story here...</p>"
          initialChapters={initialChapters}
          onSave={handleSave}
          onSubmit={handleSubmit}
          autoSaveEnabled={true}
          autoSaveInterval={30000} // 30 seconds
          placeholder="Begin your story..."
          maxLength={50000}
          className="shadow-xl"
        />
      </div>
    </div>
  );
};

// Usage in a page component:
// import { StoryEditorExample } from '@/components/shared/StoryEditor.example';
// 
// export default function WritePage() {
//   return <StoryEditorExample />;
// }