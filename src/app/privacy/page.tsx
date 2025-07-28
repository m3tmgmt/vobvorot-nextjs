'use client'

import { Footer } from '@/components/Footer'

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', padding: '2rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ 
          color: 'var(--pink-main)', 
          fontSize: '2.5rem', 
          marginBottom: '2rem',
          textAlign: 'center',
          textShadow: '0 0 10px var(--pink-main)'
        }}>
          Privacy Policy
        </h1>
        
        <div style={{ 
          color: 'var(--white)', 
          lineHeight: '1.6',
          fontSize: '1rem'
        }}>
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--cyan-accent)', marginBottom: '1rem' }}>
              Information We Collect
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              At vobvorot, we collect information you provide directly to us, such as when you:
            </p>
            <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
              <li>Create an account or make a purchase</li>
              <li>Subscribe to our newsletter</li>
              <li>Contact us with questions or feedback</li>
              <li>Participate in our puzzle games and challenges</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--cyan-accent)', marginBottom: '1rem' }}>
              How We Use Your Information
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              We use the information we collect to:
            </p>
            <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
              <li>Process and fulfill your orders</li>
              <li>Communicate with you about your account and orders</li>
              <li>Provide customer support</li>
              <li>Improve our website and services</li>
              <li>Send you promotional communications (with your consent)</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--cyan-accent)', marginBottom: '1rem' }}>
              Data Security
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              We implement appropriate security measures to protect your personal information against 
              unauthorized access, alteration, disclosure, or destruction. Our Y2K-inspired security 
              protocols ensure your data remains safe in our digital playground.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--cyan-accent)', marginBottom: '1rem' }}>
              Cookies and Tracking
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              We use cookies and similar tracking technologies to enhance your browsing experience, 
              analyze site traffic, and understand where our visitors are coming from. You can 
              control cookies through your browser settings.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--cyan-accent)', marginBottom: '1rem' }}>
              Contact Us
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p style={{ 
              color: 'var(--pink-main)',
              fontFamily: 'JetBrains Mono, monospace'
            }}>
              privacy@vobvorot.com
            </p>
          </section>

          <div style={{ 
            marginTop: '3rem', 
            padding: '1rem',
            background: 'rgba(255,107,157,0.1)',
            border: '1px solid var(--pink-main)',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p style={{ color: 'var(--yellow-neon)', fontSize: '0.9rem' }}>
              Last updated: December 2024 • Y2K Digital Privacy Protocol v3.0
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}