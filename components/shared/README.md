# Universal Text Submission Form

A comprehensive, reusable React component for story text submissions across all dashboard roles in the 1001 Stories platform.

## Overview

The `TextSubmissionForm` component provides a unified interface for submitting text-based stories with rich metadata, validation, auto-save functionality, and preview capabilities. It's designed to work seamlessly across Teacher, Learner, and Volunteer dashboards.

## Features

### Core Functionality
- ✅ **Story metadata fields**: Title, summary, age range, language, category, tags
- ✅ **Rich text editor integration**: Uses existing StoryEditor component
- ✅ **Form validation**: Zod schema validation with React Hook Form
- ✅ **Preview mode**: Toggle between edit and preview views
- ✅ **Auto-save**: Debounced draft saving (2-second delay)
- ✅ **Manual save**: Explicit draft saving with loading states
- ✅ **File upload**: Image attachment support with preview
- ✅ **Character/word counting**: Real-time counters for content and summary

### Role-Based Features
- ✅ **Individual submissions**: Standard single-author submissions
- ✅ **Classroom submissions**: Teacher-managed group submissions
- ✅ **Draft management**: Save and resume functionality
- ✅ **Edit mode**: Modify existing submissions

### UI/UX Features
- ✅ **Mobile responsive**: Tailwind CSS with mobile-first design
- ✅ **Smooth animations**: Framer Motion for transitions
- ✅ **Loading states**: Visual feedback for async operations
- ✅ **Error handling**: Clear validation messages and error states
- ✅ **Auto-save status**: Visual indicators for save states

## File Structure

```
components/shared/
├── TextSubmissionForm.tsx           # Main form component
├── TextSubmissionFormExample.tsx    # Usage examples for each role
└── README.md                       # This documentation

types/
└── submission.ts                   # TypeScript interfaces and constants
```

## Installation & Setup

The component uses the following dependencies (already installed in the project):

```json
{
  "react-hook-form": "^7.62.0",
  "@hookform/resolvers": "^5.2.1",
  "zod": "^4.0.17",
  "framer-motion": "^12.23.12",
  "lucide-react": "^0.539.0",
  "lodash": "^4.17.21"
}
```

## Basic Usage

### 1. Import the Component

```tsx
import TextSubmissionForm from '@/components/shared/TextSubmissionForm';
import type { TextSubmissionData } from '@/types/submission';
```

### 2. Implement Handler Functions

```tsx
const handleSaveDraft = async (data: TextSubmissionData) => {
  // Save draft to your API
  await fetch('/api/submissions/draft', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

const handleSubmit = async (data: TextSubmissionData) => {
  // Submit for review
  await fetch('/api/submissions/submit', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};
```

### 3. Use the Component

```tsx
<TextSubmissionForm
  userRole="TEACHER"
  allowClassroomSubmission={true}
  onSaveDraft={handleSaveDraft}
  onSubmit={handleSubmit}
/>
```

## Props API

### Required Props

| Prop | Type | Description |
|------|------|-------------|
| `onSubmit` | `(data: TextSubmissionData) => Promise<void>` | Called when user submits form for review |
| `userRole` | `'LEARNER' \| 'TEACHER' \| 'VOLUNTEER'` | Current user's role (affects UI behavior) |

### Optional Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialData` | `Partial<TextSubmissionData>` | `undefined` | Pre-populate form with existing data |
| `onSaveDraft` | `(data: TextSubmissionData) => Promise<void>` | `undefined` | Called for draft saves (enables auto-save) |
| `allowClassroomSubmission` | `boolean` | `false` | Show classroom vs individual submission toggle |
| `isLoading` | `boolean` | `false` | Show loading state on submit button |
| `draftId` | `string` | `undefined` | ID of existing draft being edited |
| `mode` | `'create' \| 'edit'` | `'create'` | Form mode (affects header text) |

## Data Schema

The form uses Zod validation with the following schema:

```tsx
interface TextSubmissionData {
  title: string;                    // 3-100 characters, required
  summary?: string;                 // 0-500 characters, optional
  ageGroup: string;                 // Required, from predefined list
  language: string;                 // Required, defaults to 'en'
  category: string;                 // Required, from predefined list
  tags?: string[];                  // Optional array of custom tags
  content: string;                  // Required, minimum 50 characters
  submissionType: 'individual' | 'classroom';
  isClassroomSubmission?: boolean;
  attachments?: File[];             // Optional image files
}
```

### Predefined Options

```tsx
// Categories
const CATEGORIES = [
  'adventure', 'friendship', 'family', 'education',
  'fantasy', 'real-life', 'cultural', 'inspirational'
];

// Age Groups
const AGE_GROUPS = [
  '3-6', '7-9', '10-12', '13-15', '16-18'
];

// Languages
const LANGUAGES = [
  'en', 'es', 'fr', 'ko', 'zh', 'ar', 'hi', 'pt'
];
```

## Role-Specific Examples

### Teacher Dashboard

```tsx
<TextSubmissionForm
  userRole="TEACHER"
  allowClassroomSubmission={true}
  onSaveDraft={handleSaveDraft}
  onSubmit={handleSubmit}
  initialData={{
    submissionType: 'classroom',
    language: 'en'
  }}
/>
```

### Student/Learner Dashboard

```tsx
<TextSubmissionForm
  userRole="LEARNER"
  allowClassroomSubmission={false}
  onSaveDraft={handleSaveDraft}
  onSubmit={handleSubmit}
  initialData={{
    submissionType: 'individual'
  }}
/>
```

### Volunteer Dashboard

```tsx
<TextSubmissionForm
  userRole="VOLUNTEER"
  allowClassroomSubmission={false}
  onSaveDraft={handleSaveDraft}
  onSubmit={handleSubmit}
/>
```

### Edit Existing Submission

```tsx
<TextSubmissionForm
  mode="edit"
  userRole="TEACHER"
  draftId="submission-123"
  initialData={{
    title: "Existing Story Title",
    content: "Existing story content...",
    category: "adventure",
    ageGroup: "7-9",
    language: "en"
  }}
  onSaveDraft={handleUpdateDraft}
  onSubmit={handleResubmit}
/>
```

## Auto-Save Behavior

The component includes intelligent auto-save functionality:

1. **Trigger**: Auto-save activates when form data changes and `onSaveDraft` is provided
2. **Debouncing**: 2-second delay after last change before saving
3. **Visual Feedback**: Status indicators show saving/saved/error states
4. **Error Handling**: Failed saves show error messages without blocking user

### Auto-Save States

- `idle`: No recent activity
- `saving`: Save operation in progress
- `saved`: Recently saved (shows timestamp)
- `error`: Save failed (shows error message)

## Validation

### Client-Side Validation

Real-time validation using Zod schema:
- **Title**: Required, 3-100 characters
- **Summary**: Optional, max 500 characters with live counter
- **Content**: Required, minimum 50 characters with word counter
- **Metadata**: Required selections for category, age group
- **File uploads**: Images only, with preview and removal

### Error Display

- Field-level errors appear below inputs
- Icon indicators for error states
- Form-level validation prevents submission of invalid data

## Styling & Theming

The component uses Tailwind CSS with the project's design system:

### Color Palette
- **Primary**: Blue (buttons, focus states)
- **Success**: Green (saved states)
- **Error**: Red (validation errors)
- **Warning**: Yellow (edit mode)
- **Info**: Various role-based colors

### Responsive Design
- **Mobile**: Stacked layout, larger touch targets
- **Tablet**: 2-column metadata grid
- **Desktop**: Full 3-column metadata grid

### Animations
- **Smooth transitions**: 200ms duration for state changes
- **Preview toggle**: Slide animations between edit/preview
- **Auto-save indicators**: Fade in/out with scale effects

## Integration Notes

### API Integration

The component expects async functions for `onSaveDraft` and `onSubmit`. These should:

1. **Handle HTTP requests** to your backend API
2. **Manage file uploads** for attachments
3. **Return promises** that resolve on success or reject on error
4. **Provide meaningful error messages** for user feedback

### Database Schema Mapping

Map form data to your database schema:

```tsx
// Example mapping for StorySubmission model
const mapFormToSubmission = (formData: TextSubmissionData) => ({
  title: formData.title,
  content: formData.content,
  summary: formData.summary || null,
  language: formData.language,
  category: formData.category,
  ageGroup: formData.ageGroup,
  tags: formData.tags || [],
  attachments: formData.attachments?.map(file => file.name) || [],
  status: 'DRAFT' // or 'SUBMITTED' based on action
});
```

### File Upload Handling

The component handles file selection and preview, but you need to implement:

1. **File upload endpoint** for storing images
2. **File validation** (size, type restrictions)
3. **File cleanup** for removed attachments

## Accessibility

The component includes accessibility features:

- **Semantic HTML**: Proper form elements and labels
- **ARIA labels**: Screen reader support
- **Keyboard navigation**: Full keyboard support
- **Focus management**: Logical tab order
- **Color contrast**: WCAG compliant color combinations

## Performance

### Optimizations

- **Debounced auto-save**: Prevents excessive API calls
- **Lazy validation**: Only validates on change after first interaction
- **Efficient re-renders**: React Hook Form minimizes re-renders
- **Image preview**: Uses object URLs for local file preview

### Bundle Size Impact

The component adds approximately:
- **Zod**: ~13KB
- **React Hook Form**: ~27KB
- **Framer Motion**: ~32KB (already used in project)
- **Component code**: ~8KB

## Troubleshooting

### Common Issues

1. **Auto-save not working**
   - Ensure `onSaveDraft` prop is provided
   - Check network requests in browser dev tools
   - Verify async function returns promise

2. **Validation not showing**
   - Check Zod schema matches data structure
   - Ensure form mode is set to 'onChange'
   - Verify error messages are displayed in UI

3. **File upload issues**
   - Check file type restrictions (images only)
   - Verify file input accept attribute
   - Ensure object URLs are properly cleaned up

### Debug Mode

Enable debug logging:

```tsx
// Add to component props during development
const handleSaveDraft = async (data) => {
  console.log('Saving draft:', data);
  // ... save logic
};
```

## Future Enhancements

Planned improvements:

1. **Rich text editor**: Replace textarea with full WYSIWYG editor
2. **Collaborative editing**: Real-time collaboration features
3. **Version history**: Track and restore previous versions
4. **AI assistance**: Content suggestions and improvements
5. **Offline support**: Local storage and sync when online

## Contributing

When contributing to this component:

1. **Follow TypeScript**: Use strict typing
2. **Test all roles**: Verify behavior for each user role
3. **Mobile testing**: Ensure responsive design works
4. **Accessibility**: Test with screen readers
5. **Performance**: Monitor bundle size and runtime performance

## Support

For issues or questions about the TextSubmissionForm component:

1. Check the examples in `TextSubmissionFormExample.tsx`
2. Review the type definitions in `types/submission.ts`
3. Test with the provided role-specific examples
4. Check browser console for validation errors