import React from 'react';

interface LabelProps {
  children: React.ReactNode;
  htmlFor?: string;
  className?: string;
}

export const Label = ({ children, htmlFor, className = '' }: LabelProps) => (
  <label 
    htmlFor={htmlFor}
    className={`block text-sm font-medium text-gray-700 ${className}`}
  >
    {children}
  </label>
);