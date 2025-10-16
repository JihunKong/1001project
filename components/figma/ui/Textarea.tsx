'use client';

import { forwardRef, TextareaHTMLAttributes, useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  maxLength?: number;
  showCharacterCount?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      maxLength,
      showCharacterCount = false,
      resize = 'vertical',
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const [characterCount, setCharacterCount] = useState(0);
    const textareaId = id || `textarea-${Math.random().toString(36).substring(2, 9)}`;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

    useEffect(() => {
      if (props.value) {
        setCharacterCount(String(props.value).length);
      }
    }, [props.value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharacterCount(e.target.value.length);
      if (props.onChange) {
        props.onChange(e);
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-figma-black mb-2"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
          </label>
        )}

        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            className={cn(
              'w-full px-4 py-3 rounded-lg border transition-all duration-200',
              'text-figma-black placeholder:text-figma-gray-inactive',
              'focus:outline-none focus:ring-2 focus:ring-[#874FFF] focus:ring-offset-2',
              'disabled:bg-gray-50 disabled:text-figma-gray-inactive disabled:cursor-not-allowed',
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-figma-gray-border focus:border-[#874FFF]',
              resize === 'none' && 'resize-none',
              resize === 'vertical' && 'resize-y',
              resize === 'horizontal' && 'resize-x',
              resize === 'both' && 'resize',
              className
            )}
            disabled={disabled}
            maxLength={maxLength}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={cn(
              error && errorId,
              helperText && helperId
            )}
            onChange={handleChange}
            {...props}
          />

          {showCharacterCount && maxLength && (
            <div
              className="absolute bottom-3 right-3 text-xs text-figma-gray-inactive pointer-events-none"
              aria-live="polite"
              aria-atomic="true"
            >
              {characterCount}/{maxLength}
            </div>
          )}
        </div>

        {error && (
          <p
            id={errorId}
            className="mt-2 text-sm text-red-600"
            role="alert"
          >
            {error}
          </p>
        )}

        {helperText && !error && (
          <p
            id={helperId}
            className="mt-2 text-sm text-figma-gray-inactive"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
