'use client';

import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  icon?: React.ReactNode;
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  icon,
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  // تعریف color palette
  const colors = {
    ashGreen: '#A5B8A3',
    stoneGreen: '#687B69',
    bone: '#EDECE6',
    sage: '#E4D8C7',
    white: '#F5F4F1',
    lightestGray: '#EDE9DF',
    lighterGray: '#DAD3C9',
    lightGray: '#C0B8AC',
    gray: '#A6A499',
    darkGray: '#817D6D',
    darkestGray: '#656051',
    coalBlack: '#48453F',
    noir: '#323028',
    vermillion: '#A43E2F',
    verde: '#2B593E'
  };

  // تعریف حالت‌های مختلف دکمه
  const getColors = () => {
    switch (variant) {
      case 'primary':
        return {
          default: `bg-[#a5b1a3] text-white`,
          hover: `hover:bg-[#6b7869] hover:text-white`,
          disabled: `bg-[${colors.lightGray}] text-[${colors.gray}] cursor-not-allowed`,
          error: `bg-[${colors.vermillion}] text-white`,
          pressed: `active:bg-[${colors.darkGray}] active:text-white`
        };
      
      case 'secondary':
        return {
          default: `bg-white border border-[#a5b1a3] text-[#a5b1a3]`,
          hover: `hover:bg-[#6b7869] hover:border-[#6b7869] hover:text-white`,
          disabled: `border-[${colors.lightGray}] text-[${colors.lightGray}] cursor-not-allowed`,
          error: `border-[${colors.vermillion}] text-[${colors.vermillion}]`,
          pressed: `active:bg-[${colors.bone}] active:border-[#6b7869] active:text-white`
        };
      
      case 'tertiary':
        return {
          default: `text-[#a5b1a3] bg-transparent border-transparent`,
          hover: `hover:text-[#6b7869] hover:bg-transparent`,
          disabled: `text-[${colors.lightGray}] cursor-not-allowed`,
          error: `text-[${colors.vermillion}]`,
          pressed: `active:text-[${colors.darkGray}]`
        };
      
      default:
        return {};
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1 text-sm';
      case 'md':
        return 'px-4 py-2 text-sm';
      case 'lg':
        return 'px-6 py-3 text-base';
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  const stateColors = getColors();
  const baseClasses = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg';
  const sizeClasses = getSizeClasses();
  
  // ترکیب رنگ‌ها
  const defaultColors = stateColors.default || '';
  const hoverColors = stateColors.hover || '';
  const disabledColors = disabled || loading ? stateColors.disabled || '' : '';
  const pressedColors = stateColors.pressed || '';
  
  // اتصال همه کلاس‌ها
  const allClasses = `
    ${baseClasses}
    ${sizeClasses}
    ${defaultColors}
    ${hoverColors}
    ${disabledColors}
    ${pressedColors}
    ${className}
  `.trim();

  return (
    <button
      className={allClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {icon && !loading && (
        <span className="w-4 h-4 flex items-center justify-center">
          {icon}
        </span>
      )}
      {children}
    </button>
  );
};

export default Button;
