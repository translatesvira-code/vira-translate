'use client';

import React, { forwardRef } from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
  size?: 'sm' | 'md' | 'lg';
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'default',
  size = 'md',
  className = '',
  disabled = false,
  ...props
}, ref) => {
  const baseClasses = `
    w-full border rounded-lg transition-all duration-200 focus:outline-none
    ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-text'}
  `;

  const variantClasses = {
    default: `
      ${disabled 
        ? 'bg-gray-100 border-gray-200 text-gray-500 placeholder-gray-400' 
        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#687B69] focus:ring-1 focus:ring-[#687B69] hover:border-gray-400'
      }
    `,
    filled: `
      ${disabled 
        ? 'bg-gray-100 border-gray-200 text-gray-500 placeholder-gray-400' 
        : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-500 focus:bg-white focus:border-[#687B69] focus:ring-1 focus:ring-[#687B69] hover:bg-gray-100'
      }
    `,
    outlined: `
      ${disabled 
        ? 'bg-transparent border-2 border-gray-200 text-gray-500 placeholder-gray-400' 
        : 'bg-transparent border-2 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#687B69] focus:ring-1 focus:ring-[#687B69] hover:border-gray-400'
      }
    `
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-sm',
    lg: 'px-4 py-4 text-base'
  };

  const errorClasses = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '';

  const inputClasses = `
    ${baseClasses}
    ${variantClasses[variant]}
    ${sizeClasses[size]}
    ${errorClasses}
    ${leftIcon ? 'pl-10' : ''}
    ${rightIcon ? 'pr-10' : ''}
    ${className}
  `.trim();

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {props.required && <span className="text-red-500 mr-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          className={inputClasses}
          disabled={disabled}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {rightIcon}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
