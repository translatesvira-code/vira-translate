/**
 * تبدیل خودکار اعداد انگلیسی به فارسی در DOM
 */

const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const englishDigits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * تبدیل اعداد انگلیسی به فارسی در متن
 */
const convertNumbersInText = (text: string): string => {
  return text.replace(/[0-9]/g, (digit) => {
    return persianDigits[englishDigits.indexOf(digit)];
  });
};

/**
 * تبدیل اعداد در یک element
 */
const convertElementNumbers = (element: Element): void => {
  // Skip script and style elements
  if (element.tagName === 'SCRIPT' || element.tagName === 'STYLE') {
    return;
  }

  // Convert text nodes
  if (element.nodeType === Node.TEXT_NODE) {
    const text = element.textContent || '';
    if (text && /[0-9]/.test(text)) {
      element.textContent = convertNumbersInText(text);
    }
    return;
  }

  // Convert attributes that might contain numbers
  const attributes = ['value', 'placeholder', 'title'];
  attributes.forEach(attr => {
    const value = element.getAttribute(attr);
    if (value && /[0-9]/.test(value)) {
      element.setAttribute(attr, convertNumbersInText(value));
    }
  });

  // Recursively process child nodes
  Array.from(element.childNodes).forEach(child => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      convertElementNumbers(child as Element);
    } else if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent || '';
      if (text && /[0-9]/.test(text)) {
        child.textContent = convertNumbersInText(text);
      }
    }
  });
};

/**
 * تبدیل خودکار اعداد در کل صفحه
 */
export const convertAllNumbersToPersian = (): void => {
  // Convert existing content
  convertElementNumbers(document.body);

  // Watch for new content added dynamically
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          convertElementNumbers(node as Element);
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
};

/**
 * تبدیل اعداد در یک element خاص
 */
export const convertElementNumbersToPersian = (element: Element): void => {
  convertElementNumbers(element);
};
