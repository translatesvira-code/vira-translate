import { useMemo } from 'react';
import { toPersianNumbers } from '../utils/numbers';

/**
 * Hook برای تبدیل خودکار اعداد به فارسی
 */
export const usePersianNumbers = (value: string | number) => {
  return useMemo(() => toPersianNumbers(value), [value]);
};

/**
 * Hook برای تبدیل آرایه اعداد به فارسی
 */
export const usePersianNumbersArray = (values: (string | number)[]) => {
  return useMemo(() => values.map(toPersianNumbers), [values]);
};
