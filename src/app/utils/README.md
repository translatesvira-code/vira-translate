# راهنمای استفاده از اعداد فارسی

## تبدیل خودکار اعداد

### 1. CSS خودکار
تمام اعداد در پروژه به صورت خودکار به فارسی تبدیل می‌شوند با استفاده از CSS:

```css
* {
  font-feature-settings: 'lnum' 0, 'pnum' 1, 'tnum' 1;
}
```

### 2. استفاده از کامپوننت PersianNumber

```tsx
import PersianNumber from '../components/PersianNumber';

// استفاده ساده
<PersianNumber value={12345} />

// با استایل سفارشی
<PersianNumber value={12345} className="text-lg font-bold" />
```

### 3. استفاده از Hook

```tsx
import { usePersianNumbers } from '../hooks/usePersianNumbers';

const MyComponent = () => {
  const persianNumber = usePersianNumbers(12345);
  return <span>{persianNumber}</span>;
};
```

### 4. استفاده مستقیم از Utility Functions

```tsx
import { toPersianNumbers, formatPersianNumber } from '../utils/numbers';

// تبدیل ساده
const persian = toPersianNumbers(12345); // "۱۲۳۴۵"

// فرمت با جداکننده هزارگان
const formatted = formatPersianNumber(1234567); // "۱،۲۳۴،۵۶۷"
```

## نکات مهم

- تمام اعداد در جداول، دکمه‌ها و input ها به صورت خودکار فارسی می‌شوند
- برای اعداد خاص می‌توانید از کامپوننت PersianNumber استفاده کنید
- CSS font-feature-settings در تمام عناصر اعمال شده است
