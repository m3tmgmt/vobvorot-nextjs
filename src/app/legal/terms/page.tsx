import { Metadata } from 'next'
import { Footer } from '@/components/Footer'
import { PageSEO } from '@/components/SEO'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for VobVorot Store. Read our terms and conditions for shopping, shipping, returns, and user responsibilities.',
  robots: {
    index: true,
    follow: true
  }
}

export default function TermsPage() {
  return (
    <>
      <PageSEO 
        title="Terms of Service"
        description="Terms of Service for VobVorot Store. Read our terms and conditions for shopping, shipping, returns, and user responsibilities."
        canonical="/legal/terms"
      />
      
      <div style={{ minHeight: '100vh', padding: '2rem' }}>
        <div className="container">
          <div style={{
            maxWidth: '800px',
            margin: '2rem auto',
            background: 'rgba(0,0,0,0.6)',
            border: '2px solid var(--pink-main)',
            borderRadius: '16px',
            padding: '3rem',
            backdropFilter: 'blur(20px)',
            color: 'var(--white)',
            lineHeight: '1.6'
          }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h1 style={{
                color: 'var(--pink-main)',
                fontSize: '3rem',
                fontWeight: '700',
                marginBottom: '1rem',
                textShadow: '0 0 20px var(--pink-main)'
              }}>
                Terms of Service
              </h1>
              <p style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '1.1rem'
              }}>
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>

            {/* Content */}
            <div style={{ fontSize: '1rem', lineHeight: '1.8' }}>
              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ 
                  color: 'var(--cyan-accent)', 
                  fontSize: '1.5rem', 
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--cyan-accent)',
                  paddingBottom: '0.5rem'
                }}>
                  1. Acceptance of Terms
                </h2>
                <p>
                  By accessing and using VobVorot Store, you accept and agree to be bound by the terms and provision of this agreement. 
                  If you do not agree to abide by the above, please do not use this service.
                </p>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ 
                  color: 'var(--cyan-accent)', 
                  fontSize: '1.5rem', 
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--cyan-accent)',
                  paddingBottom: '0.5rem'
                }}>
                  2. Products and Services
                </h2>
                <p>
                  VobVorot Store specializes in Y2K fashion, vintage-inspired clothing, and unique Ukrainian design pieces. 
                  All products are carefully curated and described to the best of our ability. Product images are for illustration purposes and may vary slightly from actual items.
                </p>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>All prices are in USD unless otherwise specified</li>
                  <li>Product availability is subject to change without notice</li>
                  <li>We reserve the right to limit quantities per customer</li>
                  <li>Custom items are made to order and may take additional time</li>
                </ul>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ 
                  color: 'var(--cyan-accent)', 
                  fontSize: '1.5rem', 
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--cyan-accent)',
                  paddingBottom: '0.5rem'
                }}>
                  3. Orders and Payment
                </h2>
                <p>
                  By placing an order, you represent that you are authorized to use the payment method and that all information provided is accurate.
                </p>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>Orders are processed within 1-3 business days</li>
                  <li>Payment is required at the time of order</li>
                  <li>We accept major credit cards and secure payment methods</li>
                  <li>Order confirmation will be sent via email</li>
                  <li>We reserve the right to cancel orders for any reason</li>
                </ul>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ 
                  color: 'var(--cyan-accent)', 
                  fontSize: '1.5rem', 
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--cyan-accent)',
                  paddingBottom: '0.5rem'
                }}>
                  4. Shipping and Delivery
                </h2>
                <p>
                  We offer worldwide shipping with various delivery options. Shipping times may vary based on location and customs processing.
                </p>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>Shipping costs are calculated at checkout</li>
                  <li>International orders may be subject to customs duties</li>
                  <li>Delivery times are estimates and not guaranteed</li>
                  <li>Risk of loss transfers to buyer upon delivery</li>
                </ul>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ 
                  color: 'var(--cyan-accent)', 
                  fontSize: '1.5rem', 
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--cyan-accent)',
                  paddingBottom: '0.5rem'
                }}>
                  5. Returns and Exchanges
                </h2>
                <p>
                  We want you to be completely satisfied with your purchase. Returns and exchanges are accepted within 30 days of delivery.
                </p>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>Items must be in original condition with tags attached</li>
                  <li>Custom items and sale items are final sale</li>
                  <li>Return shipping costs are the responsibility of the customer</li>
                  <li>Refunds will be processed within 5-10 business days</li>
                  <li>Exchanges are subject to availability</li>
                </ul>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ 
                  color: 'var(--cyan-accent)', 
                  fontSize: '1.5rem', 
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--cyan-accent)',
                  paddingBottom: '0.5rem'
                }}>
                  6. User Accounts
                </h2>
                <p>
                  Creating an account allows you to track orders, save preferences, and enjoy a faster checkout experience.
                </p>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>You are responsible for maintaining account security</li>
                  <li>Provide accurate and current information</li>
                  <li>Notify us immediately of unauthorized access</li>
                  <li>One account per person</li>
                  <li>We may suspend accounts for violations</li>
                </ul>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ 
                  color: 'var(--cyan-accent)', 
                  fontSize: '1.5rem', 
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--cyan-accent)',
                  paddingBottom: '0.5rem'
                }}>
                  7. Intellectual Property
                </h2>
                <p>
                  All content on VobVorot Store, including designs, text, graphics, logos, and images, is protected by intellectual property laws.
                </p>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>Unauthorized use of our content is prohibited</li>
                  <li>VobVorot™ is a trademark of VobVorot Store</li>
                  <li>Product images may not be used without permission</li>
                  <li>User-generated content may be used for promotional purposes</li>
                </ul>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ 
                  color: 'var(--cyan-accent)', 
                  fontSize: '1.5rem', 
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--cyan-accent)',
                  paddingBottom: '0.5rem'
                }}>
                  8. Prohibited Uses
                </h2>
                <p>You may not use our service:</p>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>For any unlawful purpose or to solicit unlawful acts</li>
                  <li>To violate any international, federal, provincial, or state regulations or laws</li>
                  <li>To transmit or procure the sending of any advertising or promotional material</li>
                  <li>To impersonate or attempt to impersonate another person</li>
                  <li>To engage in any form of automated data collection</li>
                </ul>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ 
                  color: 'var(--cyan-accent)', 
                  fontSize: '1.5rem', 
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--cyan-accent)',
                  paddingBottom: '0.5rem'
                }}>
                  9. Disclaimer and Limitation of Liability
                </h2>
                <p>
                  VobVorot Store provides our service on an "as is" and "as available" basis. We make no warranties, 
                  expressed or implied, and hereby disclaim all other warranties.
                </p>
                <p style={{ marginTop: '1rem' }}>
                  In no case shall VobVorot Store be liable for any direct, indirect, punitive, incidental, special, 
                  or consequential damages arising from your use of our service.
                </p>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ 
                  color: 'var(--cyan-accent)', 
                  fontSize: '1.5rem', 
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--cyan-accent)',
                  paddingBottom: '0.5rem'
                }}>
                  10. Governing Law
                </h2>
                <p>
                  These Terms shall be interpreted and governed by the laws of Ukraine. Any disputes relating to these terms 
                  will be resolved through binding arbitration in accordance with Ukrainian law.
                </p>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ 
                  color: 'var(--cyan-accent)', 
                  fontSize: '1.5rem', 
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--cyan-accent)',
                  paddingBottom: '0.5rem'
                }}>
                  11. Changes to Terms
                </h2>
                <p>
                  We reserve the right to update these terms at any time. Changes will be effective immediately upon posting. 
                  Your continued use of the service constitutes acceptance of the revised terms.
                </p>
              </section>

              <section>
                <h2 style={{ 
                  color: 'var(--cyan-accent)', 
                  fontSize: '1.5rem', 
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--cyan-accent)',
                  paddingBottom: '0.5rem'
                }}>
                  12. Contact Information
                </h2>
                <p>
                  For questions about these Terms of Service, please contact us at:
                </p>
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem',
                  background: 'rgba(0,245,255,0.1)',
                  border: '1px solid var(--cyan-accent)',
                  borderRadius: '8px'
                }}>
                  <p><strong>Email:</strong> support@vobvorot.com</p>
                  <p><strong>Address:</strong> VobVorot Store, Ukraine</p>
                  <p><strong>Phone:</strong> Available upon request</p>
                </div>
              </section>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  )
}