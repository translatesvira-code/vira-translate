'use client';

import React from 'react';

interface RadioButtonProps {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}

const RadioButton: React.FC<RadioButtonProps> = ({
  name,
  value,
  checked,
  onChange,
  label,
  disabled = false,
  className = ''
}) => {
  return (
    <label className={`
      flex items-center cursor-pointer group transition-all duration-200 p-3 rounded-lg border
      ${checked 
        ? 'border-[#687B69] bg-[#687B69]/5' 
        : 'border-gray-200 bg-white hover:border-[#a5b1a3] hover:bg-gray-50'
      }
      ${disabled ? 'cursor-not-allowed opacity-50 border-gray-100 bg-gray-50' : ''}
      ${className}
    `}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => !disabled && onChange(value)}
        disabled={disabled}
        className="ml-3 w-4 h-4 text-[#687B69] accent-[#687B69] focus:outline-none"
      />
      
      <span className={`
        text-sm font-medium transition-colors duration-200
        ${checked 
          ? 'text-[#687B69]' 
          : 'text-gray-700 group-hover:text-gray-900'
        }
        ${disabled ? 'text-gray-400' : ''}
      `}>
        {label}
      </span>
    </label>
  );
};

export default RadioButton;
