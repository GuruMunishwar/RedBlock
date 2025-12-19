
/**
 * REDDBLOCK CONTENT SCRIPT
 * This script runs in the context of Reddit pages.
 * It monitors the DOM for post elements and hides those matching user keywords.
 */

// Declare chrome to resolve compilation errors in content script context
declare const chrome: any;

interface FilterKeyword {
  text: string;
  enabled: boolean;
}

interface StorageData {
  keywords: FilterKeyword[];
  blockedCount: number;
}

const STORAGE_KEY = 'reddbock_settings';

let activeKeywords: string[] = [];
let localBlockedCount = 0;

// Load keywords from storage
const refreshKeywords = () => {
  chrome.storage.local.get([STORAGE_KEY], (result: any) => {
    const data: StorageData = result[STORAGE_KEY] || { keywords: [], blockedCount: 0 };
    activeKeywords = data.keywords
      .filter(k => k.enabled)
      .map(k => k.text.toLowerCase());
    localBlockedCount = data.blockedCount;
  });
};

// Listen for storage changes
chrome.storage.onChanged.addListener((changes: any) => {
  if (changes[STORAGE_KEY]) {
    refreshKeywords();
  }
});

/**
 * Modern Reddit (Shreddit) uses custom elements like <shreddit-post>
 * Older versions use various div containers.
 */
const POST_SELECTORS = [
  'shreddit-post',
  'div[data-testid="post-container"]',
  '.Post',
  '.link'
];

const checkAndHide = (element: HTMLElement) => {
  if (element.hasAttribute('data-reddbock-checked')) return;
  
  const content = element.innerText?.toLowerCase() || '';
  const shouldHide = activeKeywords.some(keyword => content.includes(keyword));

  if (shouldHide) {
    element.style.display = 'none';
    element.style.visibility = 'hidden';
    element.style.height = '0';
    element.style.margin = '0';
    element.style.padding = '0';
    element.style.overflow = 'hidden';
    
    // Increment global count (throttled/batched ideally)
    localBlockedCount++;
    chrome.storage.local.get([STORAGE_KEY], (result: any) => {
      const data = result[STORAGE_KEY] || { keywords: [], blockedCount: 0 };
      chrome.storage.local.set({ 
        [STORAGE_KEY]: { ...data, blockedCount: (data.blockedCount || 0) + 1 } 
      });
    });
  }

  element.setAttribute('data-reddbock-checked', 'true');
};

const scanFeed = () => {
  if (activeKeywords.length === 0) return;
  
  POST_SELECTORS.forEach(selector => {
    document.querySelectorAll(selector).forEach(post => {
      checkAndHide(post as HTMLElement);
    });
  });
};

// Initial scan
refreshKeywords();
setTimeout(scanFeed, 2000);

// Watch for infinite scroll / dynamic content
const observer = new MutationObserver((mutations) => {
  let shouldScan = false;
  for (const mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      shouldScan = true;
      break;
    }
  }
  if (shouldScan) scanFeed();
});

observer.observe(document.body, { childList: true, subtree: true });

// Periodic safety scan
setInterval(scanFeed, 5000);
