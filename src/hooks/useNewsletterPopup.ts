'use client';

import { useState, useEffect } from 'react';
import { useABTest } from '@/lib/ab-testing';

export function useNewsletterPopup() {
  const [showPopup, setShowPopup] = useState(false);
  const { value: popupTiming } = useABTest('newsletterPopupTiming');
  
  useEffect(() => {
    // Check if user has already seen the popup
    const hasSeenPopup = localStorage.getItem('newsletter_popup_seen');
    if (hasSeenPopup) return;
    
    // Show popup after the A/B test timing
    const timer = setTimeout(() => {
      setShowPopup(true);
    }, popupTiming);
    
    return () => clearTimeout(timer);
  }, [popupTiming]);
  
  const closePopup = () => {
    setShowPopup(false);
    localStorage.setItem('newsletter_popup_seen', 'true');
  };
  
  const handleSignup = (email: string) => {
    setShowPopup(false);
    localStorage.setItem('newsletter_popup_seen', 'true');
    localStorage.setItem('newsletter_subscribed', 'true');
    
    // Here you would typically call your newsletter signup API
    console.log('Newsletter signup:', email);
  };
  
  return {
    showPopup,
    closePopup,
    handleSignup
  };
}