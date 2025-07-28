'use client'

import { Footer } from '@/components/Footer'

export default function TermsPage() {
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
          Terms of Service
        </h1>
        
        <div style={{ 
          color: 'var(--white)', 
          lineHeight: '1.6',
          fontSize: '1rem'
        }}>
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--cyan-accent)', marginBottom: '1rem' }}>
              Welcome to the Digital Playground
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              By accessing and using vobvorot's digital playground, you agree to be bound by these 
              Terms of Service and all applicable laws and regulations. If you do not agree with 
              any of these terms, you are prohibited from using this site.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--cyan-accent)', marginBottom: '1rem' }}>
              Use License
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              Permission is granted to temporarily access vobvorot for personal, non-commercial 
              transitory viewing only. This includes:
            </p>
            <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
              <li>Browsing our vintage and custom collections</li>
              <li>Participating in puzzle games and challenges</li>
              <li>Making purchases through our secure checkout</li>
              <li>Engaging with our Y2K digital community</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--cyan-accent)', marginBottom: '1rem' }}>
              Products and Orders
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              All products are subject to availability. We reserve the right to:
            </p>
            <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
              <li>Limit quantities of any products or services</li>
              <li>Discontinue any product at any time</li>
              <li>Refuse any order placed with us</li>
              <li>Update product information and pricing</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--cyan-accent)', marginBottom: '1rem' }}>
              Puzzle Games & Challenges
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              Our interactive puzzle system is designed for entertainment and engagement. 
              By participating, you agree that:
            </p>
            <ul style={{ marginLeft: '2rem', marginBottom: '1rem' }}>
              <li>Puzzle progress is saved locally in your browser</li>
              <li>Rewards and achievements are for fun and may change</li>
              <li>Cheating or exploiting the system is prohibited</li>
              <li>We may reset progress or update challenges at any time</li>
            </ul>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--cyan-accent)', marginBottom: '1rem' }}>
              Shipping & Returns
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              We ship worldwide from Ukraine. Return policy applies to unused items in 
              original condition within 14 days of delivery. Custom and vintage items 
              may have specific return restrictions.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--cyan-accent)', marginBottom: '1rem' }}>
              Limitation of Liability
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              In no event shall vobvorot or its suppliers be liable for any damages 
              arising out of the use or inability to use the materials on our website, 
              even if vobvorot has been notified of the possibility of such damage.
            </p>
          </section>

          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: 'var(--cyan-accent)', marginBottom: '1rem' }}>
              Contact Information
            </h2>
            <p style={{ marginBottom: '1rem' }}>
              Questions about the Terms of Service should be sent to:
            </p>
            <p style={{ 
              color: 'var(--pink-main)',
              fontFamily: 'JetBrains Mono, monospace'
            }}>
              legal@vobvorot.com
            </p>
          </section>

          <div style={{ 
            marginTop: '3rem', 
            padding: '1rem',
            background: 'rgba(0,245,255,0.1)',
            border: '1px solid var(--cyan-accent)',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p style={{ color: 'var(--yellow-neon)', fontSize: '0.9rem' }}>
              Last updated: December 2024 • Y2K Digital Terms Protocol v3.0
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}