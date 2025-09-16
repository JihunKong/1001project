'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import TextSubmissionForm from './TextSubmissionForm';
import type { TextSubmissionData } from '../../types/submission';

// Example API service functions (implement these according to your API structure)
const submissionService = {
  async saveDraft(data: TextSubmissionData): Promise<void> {
    // Mock API call - replace with your actual API endpoint
    const response = await fetch('/api/submissions/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error('Failed to save draft');
    }
  },

  async submitStory(data: TextSubmissionData): Promise<void> {
    // Mock API call - replace with your actual API endpoint
    const response = await fetch('/api/submissions/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, status: 'SUBMITTED' })
    });
    
    if (!response.ok) {
      throw new Error('Failed to submit story');
    }
  }
};

// Example for Teacher Dashboard
export function TeacherSubmissionForm() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveDraft = async (data: TextSubmissionData) => {
    try {
      await submissionService.saveDraft(data);
      toast.success('Draft saved successfully!');
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast.error('Failed to save draft');
      throw error;
    }
  };

  const handleSubmit = async (data: TextSubmissionData) => {
    setIsLoading(true);
    try {
      await submissionService.submitStory(data);
      toast.success('Story submitted for review!');
      // Redirect to submissions list or dashboard
      // router.push('/dashboard/teacher/submissions');
    } catch (error) {
      console.error('Failed to submit story:', error);
      toast.error('Failed to submit story');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">For Teachers</h3>
        <p className="text-sm text-blue-800">
          Submit stories on behalf of your students or share your own educational content. 
          You can choose between individual and classroom submissions.
        </p>
      </div>
      
      <TextSubmissionForm
        userRole="TEACHER"
        allowClassroomSubmission={true}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}

// Example for Student/Learner Dashboard
export function LearnerSubmissionForm() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveDraft = async (data: TextSubmissionData) => {
    try {
      await submissionService.saveDraft(data);
      toast.success('Draft saved successfully!');
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast.error('Failed to save draft');
      throw error;
    }
  };

  const handleSubmit = async (data: TextSubmissionData) => {
    setIsLoading(true);
    try {
      await submissionService.submitStory(data);
      toast.success('Story submitted! Your teacher will review it soon.');
      // Redirect to student dashboard
      // router.push('/dashboard/learner');
    } catch (error) {
      console.error('Failed to submit story:', error);
      toast.error('Failed to submit story');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-medium text-green-900 mb-2">Share Your Story</h3>
        <p className="text-sm text-green-800">
          Write and share your own story! Your teacher will review it and provide feedback 
          to help you improve your writing skills.
        </p>
      </div>
      
      <TextSubmissionForm
        userRole="LEARNER"
        allowClassroomSubmission={false}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}

// Example for Volunteer Dashboard
export function VolunteerSubmissionForm() {
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveDraft = async (data: TextSubmissionData) => {
    try {
      await submissionService.saveDraft(data);
      toast.success('Draft saved successfully!');
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast.error('Failed to save draft');
      throw error;
    }
  };

  const handleSubmit = async (data: TextSubmissionData) => {
    setIsLoading(true);
    try {
      await submissionService.submitStory(data);
      toast.success('Story submitted for publication review!');
      // Redirect to volunteer dashboard
      // router.push('/dashboard/volunteer/submissions');
    } catch (error) {
      console.error('Failed to submit story:', error);
      toast.error('Failed to submit story');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="font-medium text-purple-900 mb-2">Contribute a Story</h3>
        <p className="text-sm text-purple-800">
          Help expand our library by submitting stories from underserved communities. 
          Your contribution will go through our editorial review process.
        </p>
      </div>
      
      <TextSubmissionForm
        userRole="VOLUNTEER"
        allowClassroomSubmission={false}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}

// Example for editing existing submission
export function EditSubmissionForm({ submissionId }: { submissionId: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [initialData, setInitialData] = useState<Partial<TextSubmissionData> | undefined>();

  // Load existing submission data (implement according to your API)
  const loadSubmissionData = async () => {
    try {
      const response = await fetch(`/api/submissions/${submissionId}`);
      const data = await response.json();
      setInitialData(data);
    } catch (error) {
      console.error('Failed to load submission:', error);
      toast.error('Failed to load submission data');
    }
  };

  const handleSaveDraft = async (data: TextSubmissionData) => {
    try {
      const response = await fetch(`/api/submissions/${submissionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) throw new Error('Failed to update submission');
      
      toast.success('Changes saved successfully!');
    } catch (error) {
      console.error('Failed to save changes:', error);
      toast.error('Failed to save changes');
      throw error;
    }
  };

  const handleSubmit = async (data: TextSubmissionData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/submissions/${submissionId}/resubmit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, status: 'SUBMITTED' })
      });
      
      if (!response.ok) throw new Error('Failed to resubmit story');
      
      toast.success('Story resubmitted for review!');
      // Redirect to submissions list
      // router.push('/dashboard/submissions');
    } catch (error) {
      console.error('Failed to resubmit story:', error);
      toast.error('Failed to resubmit story');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount
  React.useEffect(() => {
    if (submissionId) {
      loadSubmissionData();
    }
  }, [submissionId]);

  if (!initialData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-medium text-yellow-900 mb-2">Edit Submission</h3>
        <p className="text-sm text-yellow-800">
          Make changes to your story and resubmit for review. All previous feedback 
          will be preserved.
        </p>
      </div>
      
      <TextSubmissionForm
        initialData={initialData}
        userRole="TEACHER" // or determine from user context
        allowClassroomSubmission={true}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        draftId={submissionId}
        mode="edit"
      />
    </div>
  );
}