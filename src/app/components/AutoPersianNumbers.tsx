'use client';

import { useEffect } from 'react';
import { initPersianNumbers } from '../utils/simplePersianNumbers';

const AutoPersianNumbers: React.FC = () => {
  useEffect(() => {
    // Initialize Persian numbers conversion
    initPersianNumbers();
  }, []);

  return null; // This component doesn't render anything
};

export default AutoPersianNumbers;
