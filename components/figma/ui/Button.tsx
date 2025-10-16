'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = `
      inline-flex items-center justify-center
      font-medium
      rounded-lg
      transition-all duration-200
      focus:outline-none focus:ring-4 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

    const variantClasses = {
      primary: `
        bg-gradient-to-r from-soe-green-500 to-soe-green-600
        hover:from-soe-green-600 hover:to-soe-green-700
        text-white
        shadow-sm hover:shadow-md
        focus:ring-soe-green-300
      `,
      secondary: `
        bg-gradient-to-r from-soe-purple-500 to-soe-purple-600
        hover:from-soe-purple-600 hover:to-soe-purple-700
        text-white
        shadow-sm hover:shadow-md
        focus:ring-soe-purple-300
      `,
      outline: `
        bg-white
        border border-figma-gray-border
        text-figma-black
        hover:bg-gray-50 hover:border-figma-black
        focus:ring-gray-200
      `,
      ghost: `
        bg-transparent
        text-figma-gray-inactive
        hover:bg-gray-50 hover:text-figma-black
        focus:ring-gray-200
      `,
      danger: `
        bg-red-600
        hover:bg-red-700
        text-white
        shadow-sm hover:shadow-md
        focus:ring-red-300
      `
    };

    const sizeClasses = {
      sm: 'h-9 px-4 text-sm gap-2',
      md: 'h-12 px-6 text-base gap-2',
      lg: 'h-14 px-8 text-lg gap-3'
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          ${baseClasses}
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
