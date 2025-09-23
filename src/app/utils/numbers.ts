/**
 * تبدیل اعداد انگلیسی به فارسی
 */
export const toPersianNumbers = (str: string | number): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  return str.toString().replace(/[0-9]/g, (digit) => {
    return persianDigits[englishDigits.indexOf(digit)];
  });
};

/**
 * تبدیل اعداد فارسی به انگلیسی
 */
export const toEnglishNumbers = (str: string): string => {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  
  return str.replace(/[۰-۹]/g, (digit) => {
    return englishDigits[persianDigits.indexOf(digit)];
  });
};

/**
 * فرمت کردن اعداد با جداکننده هزارگان فارسی
 */
export const formatPersianNumber = (num: number): string => {
  const persianNum = toPersianNumbers(num.toString());
  return persianNum.replace(/\B(?=(\d{3})+(?!\d))/g, '،');
};

/**
 * فرمت کردن تاریخ فارسی
 */
export const formatPersianDate = (date: string): string => {
  const persianDate = toPersianNumbers(date);
  return persianDate.replace(/-/g, '/');
};
