/**
 * تبدیل ساده اعداد انگلیسی به فارسی
 */

const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * تبدیل اعداد انگلیسی به فارسی
 */
export const toPersianNumbers = (str: string | number): string => {
  return str.toString().replace(/[0-9]/g, (digit) => {
    return persianDigits[englishDigits.indexOf(digit)];
  });
};

/**
 * تبدیل خودکار اعداد در متن
 */
export const convertTextNumbers = (text: string): string => {
  return text.replace(/[0-9]+/g, (match) => {
    return toPersianNumbers(match);
  });
};

/**
 * تبدیل اعداد در DOM
 */
export const convertDOMNumbers = (): void => {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    null
  );

  const textNodes: Text[] = [];
  let node: Node | null = walker.nextNode();
  
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) {
      textNodes.push(node as Text);
    }
    node = walker.nextNode();
  }

  textNodes.forEach(textNode => {
    const text = textNode.textContent || '';
    if (text && /[0-9]/.test(text)) {
      textNode.textContent = convertTextNumbers(text);
    }
  });
};

/**
 * اجرای تبدیل اعداد بعد از بارگذاری صفحه
 */
export const initPersianNumbers = (): void => {
  // Convert immediately
  convertDOMNumbers();
  
  // Convert after a short delay to catch dynamic content
  setTimeout(convertDOMNumbers, 100);
  setTimeout(convertDOMNumbers, 500);
  setTimeout(convertDOMNumbers, 1000);
  
  // Watch for dynamic content changes
  const observer = new MutationObserver(() => {
    convertDOMNumbers();
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
};
