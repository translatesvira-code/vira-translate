'use client';

import React from 'react';

export type TabButtonVariant = 'primary' | 'secondary' | 'tertiary';

interface TabButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: TabButtonVariant;
  children: React.ReactNode;
  active?: boolean;
  icon?: React.ReactNode;
}

const TabButton: React.FC<TabButtonProps> = ({
  variant = 'primary',
  children,
  active = false,
  icon,
  className = '',
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

  // تعریف حالت‌های مختلف TabButton
  const getColors = () => {
    if (active) {
      switch (variant) {
        case 'primary':
          return `bg-[${colors.stoneGreen}] text-white border-r-2 border-[${colors.stoneGreen}] shadow-sm`;
        case 'secondary':
          return ` bg-white text-[${colors.stoneGreen}] border-r-2 border-[${colors.stoneGreen}] shadow-sm`;
        case 'tertiary':
          return `text-[${colors.stoneGreen}] bg-transparent border-r-2 border-[${colors.stoneGreen}]`;
        default:
          return '';
      }
    } else {
      switch (variant) {
        case 'primary':
          return `text-[${colors.gray}] hover:bg-[${colors.ashGreen}26] hover:text-[${colors.stoneGreen}] border-r-2 border-transparent`;
        case 'secondary':
          return `text-[${colors.gray}] hover:bg-[${colors.bone}] hover:text-[${colors.stoneGreen}] border-r-2 border-transparent`;
        case 'tertiary':
          return `text-[${colors.gray}] hover:text-[${colors.stoneGreen}] border-r-2 border-transparent`;
        default:
          return '';
      }
    }
  };

  const baseClasses = 'w-full text-right px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer font-medium';
  const colorClasses = getColors();

  const allClasses = `
    ${baseClasses}
    ${colorClasses}
    ${className}
  `.trim();

  return (
    <button
      className={allClasses}
      {...props}
    >
      <div className="flex items-center justify-end gap-2">
        {icon && (
          <span className="w-4 h-4 flex items-center justify-center">
            {icon}
          </span>
        )}
        {children}
      </div>
    </button>
  );
};

export default TabButton;
