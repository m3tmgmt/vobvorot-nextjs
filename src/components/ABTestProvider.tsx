'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useABTest, AB_TESTS } from '@/lib/ab-testing';

// A/B Test Context
interface ABTestContextType {
  getVariant: (testName: keyof typeof AB_TESTS) => 'control' | 'variant';
  getValue: (testName: keyof typeof AB_TESTS) => any;
  trackConversion: (testName: keyof typeof AB_TESTS, conversionType: string, value?: number) => void;
}

const ABTestContext = createContext<ABTestContextType | undefined>(undefined);

// A/B Test Provider
export function ABTestProvider({ children }: { children: ReactNode }) {
  const getVariant = (testName: keyof typeof AB_TESTS) => {
    return useABTest(testName).variant;
  };

  const getValue = (testName: keyof typeof AB_TESTS) => {
    return useABTest(testName).value;
  };

  const trackConversion = (testName: keyof typeof AB_TESTS, conversionType: string, value?: number) => {
    useABTest(testName).trackConversion(conversionType, value);
  };

  return (
    <ABTestContext.Provider value={{ getVariant, getValue, trackConversion }}>
      {children}
    </ABTestContext.Provider>
  );
}

// Hook to use A/B test context
export function useABTestContext() {
  const context = useContext(ABTestContext);
  if (context === undefined) {
    throw new Error('useABTestContext must be used within an ABTestProvider');
  }
  return context;
}

// Higher-order component for A/B testing
export function withABTest<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  testName: keyof typeof AB_TESTS,
  propMapping?: (value: any, variant: 'control' | 'variant') => Partial<T>
) {
  return function ABTestWrapper(props: T) {
    const { value, variant, trackConversion } = useABTest(testName);
    
    const testProps = propMapping ? propMapping(value, variant) : { [testName]: value };
    const enhancedProps = {
      ...props,
      ...testProps,
      abTestVariant: variant,
      abTestValue: value,
      trackABConversion: (conversionType: string, conversionValue?: number) => 
        trackConversion(conversionType, conversionValue)
    };

    return <Component {...enhancedProps} />;
  };
}