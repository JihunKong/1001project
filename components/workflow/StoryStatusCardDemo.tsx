'use client';

import React, { useState } from 'react';
import StoryStatusCard from './StoryStatusCard';

// Demo data showcasing different story states
const demoStories = [
  {
    id: '1',
    title: 'The Little Elephant Who Learned to Fly',
    authorAlias: 'Maya Chen',
    summary: 'A heartwarming tale about a young elephant named Kavi who dreams of soaring through the clouds like the birds. With the help of his forest friends, he discovers that sometimes the impossible becomes possible through courage and friendship.',
    status: 'DRAFT',
    wordCount: 1250,
    category: ['Adventure', 'Friendship'],
    tags: ['elephants', 'flying', 'dreams'],
    language: 'English',
    ageRange: '6-10',
    createdAt: '2024-12-15T10:30:00Z',
    updatedAt: '2024-12-16T14:20:00Z'
  },
  {
    id: '2',
    title: 'The Magic Garden of Wishes',
    authorAlias: 'Ahmed Hassan',
    summary: 'In a small village in Morocco, a young girl discovers a secret garden where every seed planted grows into something magical. But she must learn the responsibility that comes with such power.',
    status: 'NEEDS_REVISION',
    wordCount: 1800,
    category: ['Fantasy', 'Moral Tales'],
    tags: ['garden', 'magic', 'responsibility'],
    language: 'English',
    ageRange: '8-12',
    storyFeedback: 'Beautiful story concept! The magical elements are engaging, but we need more cultural details about Moroccan traditions. Consider adding more sensory descriptions of the garden. The character development is strong.',
    createdAt: '2024-12-10T09:15:00Z',
    updatedAt: '2024-12-18T16:45:00Z'
  },
  {
    id: '3',
    title: 'The Boy Who Painted Rainbows',
    authorAlias: 'Isabella Rodriguez',
    summary: 'A young artist in Guatemala discovers that his paintings can bring color back to his drought-stricken village. Through art and community cooperation, they restore both their land and their hope.',
    status: 'STORY_APPROVED',
    wordCount: 2100,
    category: ['Community', 'Art'],
    tags: ['painting', 'drought', 'community'],
    language: 'English',
    ageRange: '10-14',
    bookDecision: 'Approved for illustrated book format. The visual elements in this story would translate beautifully to full-page illustrations. Recommended for our cultural heritage series.',
    createdAt: '2024-11-25T11:00:00Z',
    updatedAt: '2024-12-20T13:30:00Z'
  },
  {
    id: '4',
    title: 'The Dancing Fireflies of Kerala',
    authorAlias: 'Priya Nair',
    summary: 'During monsoon season in Kerala, India, a young girl learns the ancient dance of her grandmother while magical fireflies guide her through a journey of cultural discovery and family bonds.',
    status: 'PUBLISHED',
    wordCount: 1950,
    category: ['Cultural', 'Family'],
    tags: ['india', 'dance', 'fireflies', 'tradition'],
    language: 'English',
    ageRange: '8-12',
    finalNotes: 'Excellent representation of Kerala culture. The book has been well-received by our educational partners and is being used in cultural studies programs.',
    publishedAt: '2024-12-01T12:00:00Z',
    createdAt: '2024-10-15T08:20:00Z',
    updatedAt: '2024-11-28T10:15:00Z'
  },
  {
    id: '5',
    title: 'The Incomplete Adventure',
    authorAlias: 'James Wilson',
    summary: 'A story about a young explorer who...',
    status: 'REJECTED',
    wordCount: 450,
    category: ['Adventure'],
    tags: ['exploration', 'incomplete'],
    language: 'English',
    ageRange: '6-10',
    storyFeedback: 'Unfortunately, this submission appears to be incomplete and doesn\'t meet our minimum word count requirements. We encourage you to finish the story and resubmit. The opening concept shows promise.',
    createdAt: '2024-12-20T15:30:00Z',
    updatedAt: '2024-12-21T09:45:00Z'
  }
];

export default function StoryStatusCardDemo() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleContinueWriting = async (id: string) => {
    setLoading(id);
    setError(null);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Continuing to write story ${id}`);
      // Navigate to editor...
    } catch (err) {
      setError('Failed to open story editor. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleViewFeedback = async (id: string) => {
    setLoading(id);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      console.log(`Viewing feedback for story ${id}`);
      // Open feedback modal...
    } catch (err) {
      setError('Failed to load feedback. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleShare = async (id: string) => {
    setLoading(id);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      console.log(`Sharing story ${id}`);
      // Open share dialog...
    } catch (err) {
      setError('Failed to share story. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleView = async (id: string) => {
    setLoading(id);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log(`Viewing story ${id}`);
      // Navigate to story view...
    } catch (err) {
      setError('Failed to load story. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleEdit = async (id: string) => {
    setLoading(id);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      console.log(`Editing story ${id}`);
      // Navigate to editor...
    } catch (err) {
      setError('Failed to open editor. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this story?')) return;

    setLoading(id);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Deleting story ${id}`);
      // Delete story...
    } catch (err) {
      setError('Failed to delete story. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Enhanced StoryStatusCard Demo
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Showcasing the new Writer's Flow features with SOE brand colors, accessibility compliance,
            and enhanced user experience for different story states.
          </p>
        </div>

        <div className="space-y-8">
          {demoStories.map((story) => (
            <StoryStatusCard
              key={story.id}
              story={story}
              onContinueWriting={handleContinueWriting}
              onViewFeedback={handleViewFeedback}
              onShare={handleShare}
              onView={handleView}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isLoading={loading === story.id}
              error={error}
            />
          ))}
        </div>

        {/* Usage Example */}
        <div className="mt-16 bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Key Features Demonstrated</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-soe-purple-700 mb-4">✨ Enhanced Features</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-soe-purple-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span><strong>Progress Visualization:</strong> Dynamic progress bars showing workflow completion</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-soe-purple-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span><strong>Smart CTAs:</strong> Context-aware call-to-action buttons for each status</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-soe-purple-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span><strong>Loading States:</strong> Visual feedback during actions</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-soe-purple-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span><strong>Error Handling:</strong> Clear error messages and recovery options</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-soe-green-700 mb-4">♿ Accessibility Features</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-soe-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span><strong>WCAG 2.1 Compliance:</strong> All interactive elements meet minimum touch targets</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-soe-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span><strong>Screen Reader Support:</strong> Comprehensive ARIA labels and semantic HTML</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-soe-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span><strong>Keyboard Navigation:</strong> Full keyboard support with focus indicators</span>
                </li>
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-soe-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                  <span><strong>Color Contrast:</strong> All text meets 4.5:1 contrast ratio requirements</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 p-4 bg-gradient-to-r from-soe-purple-50 to-soe-green-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">SOE Brand Integration</h4>
            <p className="text-sm text-gray-700">
              This component now uses the official SOE brand colors: Purple (#874FFF) for Writer's Flow elements
              and Green (#9fcc40) for success states and progress indicators, creating a cohesive brand experience.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}