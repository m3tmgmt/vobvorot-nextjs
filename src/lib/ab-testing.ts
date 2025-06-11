import { analytics } from '@/components/analytics/GoogleAnalytics';

// A/B Test configuration
export interface ABTest {
  name: string;
  variants: {
    control: any;
    variant: any;
  };
  traffic: number; // 0-1, percentage of traffic to include in test
  enabled: boolean;
}

// A/B Test definitions
export const AB_TESTS: Record<string, ABTest> = {
  // Hero section button text
  heroButtonText: {
    name: 'hero_button_text',
    variants: {
      control: 'Explore Collection',
      variant: 'Shop Now - Free Shipping'
    },
    traffic: 0.5, // 50% of users
    enabled: true
  },

  // Product card design
  productCardLayout: {
    name: 'product_card_layout',
    variants: {
      control: 'standard',
      variant: 'enhanced-with-badges'
    },
    traffic: 0.3, // 30% of users
    enabled: true
  },

  // Checkout button color
  checkoutButtonColor: {
    name: 'checkout_button_color',
    variants: {
      control: '#000000', // Black
      variant: '#dc2626'  // Red
    },
    traffic: 0.4, // 40% of users
    enabled: true
  },

  // Price display format
  priceDisplayFormat: {
    name: 'price_display_format',
    variants: {
      control: 'simple', // Just price
      variant: 'with-savings' // Show original + discounted
    },
    traffic: 0.6, // 60% of users
    enabled: true
  },

  // Newsletter popup timing
  newsletterPopupTiming: {
    name: 'newsletter_popup_timing',
    variants: {
      control: 30000, // 30 seconds
      variant: 60000  // 60 seconds
    },
    traffic: 0.5, // 50% of users
    enabled: true
  }
};

// User assignment storage
const AB_STORAGE_KEY = 'vobvorot_ab_tests';

// Get user's A/B test assignments
export function getUserABTests(): Record<string, 'control' | 'variant'> {
  if (typeof window === 'undefined') return {};
  
  try {
    const stored = localStorage.getItem(AB_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Save user's A/B test assignments
function saveUserABTests(assignments: Record<string, 'control' | 'variant'>) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(AB_STORAGE_KEY, JSON.stringify(assignments));
  } catch {
    console.log('Could not save A/B test assignments');
  }
}

// Generate consistent user ID for A/B testing
function getUserId(): string {
  if (typeof window === 'undefined') return 'server';
  
  let userId = localStorage.getItem('vobvorot_user_id');
  if (!userId) {
    userId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('vobvorot_user_id', userId);
  }
  return userId;
}

// Hash function for consistent assignment
function hashUserId(userId: string, testName: string): number {
  let hash = 0;
  const str = userId + testName;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Get variant for a specific test
export function getABTestVariant(testName: keyof typeof AB_TESTS): 'control' | 'variant' {
  const test = AB_TESTS[testName];
  
  // Test disabled or doesn't exist
  if (!test || !test.enabled) {
    return 'control';
  }

  // Check if user already has assignment
  const existingAssignments = getUserABTests();
  if (existingAssignments[testName]) {
    return existingAssignments[testName];
  }

  // Assign user to test
  const userId = getUserId();
  const hash = hashUserId(userId, testName);
  const assignment = (hash % 100) / 100 < test.traffic ? 
    ((hash % 2) === 0 ? 'control' : 'variant') : 'control';

  // Save assignment
  const newAssignments = { ...existingAssignments, [testName]: assignment };
  saveUserABTests(newAssignments);

  // Track assignment in analytics
  analytics.event('ab_test_assignment', {
    test_name: testName,
    variant: assignment,
    user_id: userId
  });

  return assignment;
}

// Get the actual value for a test
export function getABTestValue(testName: keyof typeof AB_TESTS): any {
  const test = AB_TESTS[testName];
  if (!test) return test?.variants.control;
  
  const variant = getABTestVariant(testName);
  return test.variants[variant];
}

// Track A/B test conversion
export function trackABTestConversion(testName: keyof typeof AB_TESTS, conversionType: string, value?: number) {
  const variant = getABTestVariant(testName);
  const userId = getUserId();
  
  analytics.event('ab_test_conversion', {
    test_name: testName,
    variant: variant,
    conversion_type: conversionType,
    value: value,
    user_id: userId
  });
}

// React hook for A/B testing
export function useABTest(testName: keyof typeof AB_TESTS) {
  const variant = getABTestVariant(testName);
  const value = getABTestValue(testName);
  
  const trackConversion = (conversionType: string, conversionValue?: number) => {
    trackABTestConversion(testName, conversionType, conversionValue);
  };
  
  return {
    variant,
    value,
    isControl: variant === 'control',
    isVariant: variant === 'variant',
    trackConversion
  };
}

// Analytics dashboard data
export function getABTestAnalytics() {
  const assignments = getUserABTests();
  return {
    activeTests: Object.keys(assignments),
    assignments,
    userId: getUserId()
  };
}