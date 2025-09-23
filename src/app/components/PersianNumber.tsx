'use client';

import React from 'react';
import { toPersianNumbers } from '../utils/numbers';

interface PersianNumberProps {
  value: string | number;
  className?: string;
  children?: React.ReactNode;
}

const PersianNumber: React.FC<PersianNumberProps> = ({ 
  value, 
  className = '', 
  children 
}) => {
  const persianValue = toPersianNumbers(value);
  
  return (
    <span className={`persian-digits ${className}`}>
      {children ? children : persianValue}
    </span>
  );
};

export default PersianNumber;
