'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePuzzle } from '@/contexts/PuzzleContext';

interface LetterFormData {
  message: string;
  deliveryDate: string;
  senderEmail: string;
  senderName: string;
  subject: string;
}

export default function LettersToFuture() {
  const { data: session } = useSession();
  const { dispatch: puzzleDispatch } = usePuzzle();
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<LetterFormData>({
    message: '',
    deliveryDate: '',
    senderEmail: session?.user?.email || '',
    senderName: session?.user?.name || '',
    subject: ''
  });

  const handleInputChange = (field: keyof LetterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): string | null => {
    if (!formData.message.trim()) {
      return 'Please write your message';
    }
    
    if (!formData.deliveryDate) {
      return 'Please select a delivery date';
    }

    const deliveryDate = new Date(formData.deliveryDate);
    const now = new Date();
    now.setHours(0, 0, 0, 0); // Start of today
    
    if (deliveryDate <= now) {
      return 'Delivery date must be in the future';
    }

    if (!session && !formData.senderEmail) {
      return 'Please provide your email address';
    }

    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setNotification(validationError);
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setIsLoading(true);
    setNotification('Sending to the future... ✨');

    try {
      const response = await fetch('/api/letters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: formData.message,
          deliveryDate: formData.deliveryDate,
          subject: formData.subject || 'Letter from the past',
          senderEmail: formData.senderEmail,
          senderName: formData.senderName || 'Anonymous Time Traveler',
          recipientEmail: formData.senderEmail, // Send to self by default
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setNotification(result.message || 'Letter sent to the future! 💫');
        
        // Reset form
        setFormData({
          message: '',
          deliveryDate: '',
          senderEmail: session?.user?.email || '',
          senderName: session?.user?.name || '',
          subject: ''
        });
        
        // Unlock achievement
        puzzleDispatch({ type: 'UNLOCK_ACHIEVEMENT', payload: 'time-traveler' });
        
        // Close modal after success
        setTimeout(() => {
          setShowModal(false);
          setNotification(null);
        }, 2000);
      } else {
        setNotification(result.error || 'Failed to send letter');
      }
    } catch (error) {
      console.error('Error sending letter:', error);
      setNotification('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  return (
    <>
      {/* Card */}
      <div className="product-card" style={{ 
        textAlign: 'center', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>💌</div>
          <h3 style={{ color: 'var(--pink-main)', marginBottom: '1rem' }}>
            Letters to Future
          </h3>
          <p style={{ marginBottom: '1.5rem', color: 'rgba(255,255,255,0.8)' }}>
            Write a message to your future self and we'll send it when the time is right...
          </p>
        </div>
        
        <button 
          className="add-to-cart-btn"
          onClick={() => setShowModal(true)}
        >
          Write Letter ✨
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            backdropFilter: 'blur(10px)',
            animation: 'modalFadeIn 0.3s ease-out'
          }}
          onClick={() => setShowModal(false)}
        >
          <div 
            style={{
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95) 0%, rgba(255, 107, 157, 0.1) 50%, rgba(0, 0, 0, 0.95) 100%)',
              border: '2px solid var(--pink-main)',
              borderRadius: '20px',
              padding: '2rem',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              boxShadow: '0 20px 60px rgba(255, 107, 157, 0.3)',
              animation: 'modalSlideIn 0.3s ease-out'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowModal(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                color: 'var(--pink-main)',
                fontSize: '1.5rem',
                cursor: 'pointer',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 107, 157, 0.2)';
                e.currentTarget.style.transform = 'rotate(90deg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
                e.currentTarget.style.transform = 'rotate(0deg)';
              }}
            >
              ×
            </button>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💌</div>
              <h2 style={{ 
                color: 'var(--pink-main)', 
                marginBottom: '0.5rem',
                fontSize: '1.8rem',
                fontWeight: '700'
              }}>
                Write Letter to Future
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                Your message will be delivered exactly when you choose ✨
              </p>
            </div>

            {/* Notification */}
            {notification && (
              <div style={{
                background: 'var(--pink-main)',
                color: 'var(--black)',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                fontSize: '0.9rem',
                fontWeight: '600',
                marginBottom: '1.5rem',
                textAlign: 'center',
                boxShadow: '0 5px 15px rgba(255, 107, 157, 0.4)'
              }}>
                {notification}
              </div>
            )}

            {/* Form */}
            <div style={{ textAlign: 'left' }}>
              {/* Subject Field */}
              <input
            type="text"
            placeholder="Subject (optional)"
            value={formData.subject}
            onChange={(e) => handleInputChange('subject', e.target.value)}
            style={{
              width: '100%',
              background: 'rgba(0,0,0,0.3)',
              border: '2px solid var(--cyan-accent)',
              borderRadius: '10px',
              padding: '0.75rem',
              color: 'var(--white)',
              fontSize: '1rem',
              marginBottom: '1rem',
              boxSizing: 'border-box'
            }}
          />

          {/* Message Field */}
          <textarea
            placeholder="Dear future me..."
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            style={{
              width: '100%',
              height: '150px',
              background: 'rgba(0,0,0,0.3)',
              border: '2px solid var(--pink-main)',
              borderRadius: '10px',
              padding: '1rem',
              color: 'var(--white)',
              fontSize: '1rem',
              resize: 'vertical',
              marginBottom: '1rem',
              boxSizing: 'border-box',
              fontFamily: 'inherit'
            }}
          />

          {/* Email field for anonymous users */}
          {!session && (
            <input
              type="email"
              placeholder="Your email address"
              value={formData.senderEmail}
              onChange={(e) => handleInputChange('senderEmail', e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.3)',
                border: '2px solid var(--yellow-neon)',
                borderRadius: '10px',
                padding: '0.75rem',
                color: 'var(--white)',
                fontSize: '1rem',
                marginBottom: '1rem',
                boxSizing: 'border-box'
              }}
            />
          )}

          {/* Name field for anonymous users */}
          {!session && (
            <input
              type="text"
              placeholder="Your name (optional)"
              value={formData.senderName}
              onChange={(e) => handleInputChange('senderName', e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.3)',
                border: '2px solid var(--purple-accent)',
                borderRadius: '10px',
                padding: '0.75rem',
                color: 'var(--white)',
                fontSize: '1rem',
                marginBottom: '1rem',
                boxSizing: 'border-box'
              }}
            />
          )}

          {/* Delivery Date */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              color: 'var(--cyan-accent)',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              Delivery Date:
            </label>
            <input
              type="date"
              value={formData.deliveryDate}
              min={getMinDate()}
              onChange={(e) => handleInputChange('deliveryDate', e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.3)',
                border: '2px solid var(--cyan-accent)',
                borderRadius: '10px',
                padding: '0.75rem',
                color: 'var(--white)',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              className="add-to-cart-btn"
              onClick={handleSubmit}
              disabled={isLoading}
              style={{ 
                fontSize: '0.9rem', 
                padding: '0.75rem 1.5rem',
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? 'Sending...' : 'Send to Future ✨'}
            </button>
            <button 
              className="filter-btn"
              onClick={() => setShowModal(false)}
              disabled={isLoading}
              style={{ fontSize: '0.9rem', padding: '0.75rem 1rem' }}
            >
              Cancel
            </button>
          </div>
        </div>
          </div>
        </div>
      )}
    </>
  );
}