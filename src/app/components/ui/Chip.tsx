'use client';

import React from 'react';

export type ChipVariant = 'primary' | 'secondary' | 'tertiary';
export type ChipSize = 'sm' | 'md';

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ChipVariant;
  size?: ChipSize;
  children: React.ReactNode;
  icon?: React.ReactNode;
  removable?: boolean;
  onRemove?: () => void;
}

const Chip: React.FC<ChipProps> = ({
  variant = 'primary',
  size = 'sm',
  children,
  icon,
  removable = false,
  onRemove,
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

  // تعریف حالت‌های مختلف چیپ
  const getColors = () => {
    switch (variant) {
      case 'primary':
        return {
          default: `bg-[${colors.stoneGreen}] text-white`,
          hover: `hover:bg-[${colors.verde}] hover:text-white`,
          disabled: `bg-[${colors.lightGray}] text-[${colors.gray}] cursor-not-allowed`,
          error: `bg-[${colors.vermillion}] text-white`,
          pressed: `active:bg-[${colors.darkGray}] active:text-white`
        };
      
      case 'secondary':
        return {
          default: `bg-white border border-[${colors.stoneGreen}] text-[${colors.stoneGreen}]`,
          hover: `hover:bg-[${colors.ashGreen}26] hover:border-[${colors.stoneGreen}] hover:text-[${colors.stoneGreen}]`,
          disabled: `border-[${colors.lightGray}] text-[${colors.lightGray}] cursor-not-allowed`,
          error: `border-[${colors.vermillion}] text-[${colors.vermillion}]`,
          pressed: `active:bg-[${colors.bone}] active:border-[${colors.stoneGreen}] active:text-[${colors.stoneGreen}]`
        };
      
      case 'tertiary':
        return {
          default: `text-[${colors.stoneGreen}] bg-transparent`,
          hover: `hover:text-[${colors.verde}] hover:bg-transparent`,
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
        return 'px-3 py-1.5 text-xs';
      case 'md':
        return 'px-4 py-2 text-sm';
      default:
        return 'px-3 py-1.5 text-xs';
    }
  };

  const stateColors = getColors();
  const baseClasses = 'inline-flex items-center justify-center gap-1 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-full cursor-pointer';
  const sizeClasses = getSizeClasses();
  
  // ترکیب رنگ‌ها
  const defaultColors = stateColors.default || '';
  const hoverColors = stateColors.hover || '';
  const disabledColors = disabled ? stateColors.disabled || '' : '';
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
      disabled={disabled}
      {...props}
    >
      {icon && (
        <span className="w-3 h-3 flex items-center justify-center">
          {icon}
        </span>
      )}
      {children}
      {removable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          className={`ml-1 w-4 h-4 rounded-full flex items-center justify-center transition-colors duration-200 ${
            variant === 'primary' 
              ? 'hover:bg-white hover:bg-opacity-20' 
              : 'hover:bg-gray-200 hover:bg-opacity-50'
          }`}
          type="button"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </button>
  );
};

export default Chip;
