import { Metadata } from 'next'
import { Footer } from '@/components/Footer'
import { PageSEO } from '@/components/SEO'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for VobVorot Store. Learn how we collect, use, and protect your personal information and data.',
  robots: {
    index: true,
    follow: true
  }
}

export default function PrivacyPage() {
  return (
    <>
      <PageSEO 
        title="Privacy Policy"
        description="Privacy Policy for VobVorot Store. Learn how we collect, use, and protect your personal information and data."
        canonical="/legal/privacy"
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
                Privacy Policy
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
                  1. Introduction
                </h2>
                <p>
                  VobVorot Store ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
                  explains how we collect, use, disclose, and safeguard your information when you visit our website 
                  and make purchases from us.
                </p>
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem',
                  background: 'rgba(255,107,157,0.1)',
                  border: '1px solid var(--pink-main)',
                  borderRadius: '8px'
                }}>
                  <p><strong>GDPR Compliance:</strong> We are committed to compliance with the General Data Protection Regulation (GDPR) and your rights under Ukrainian and international data protection laws.</p>
                </div>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ 
                  color: 'var(--cyan-accent)', 
                  fontSize: '1.5rem', 
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--cyan-accent)',
                  paddingBottom: '0.5rem'
                }}>
                  2. Information We Collect
                </h2>
                
                <h3 style={{ color: 'var(--pink-main)', fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  Personal Information
                </h3>
                <p>We may collect personal information that you provide directly to us, including:</p>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>Name and contact information (email, phone, address)</li>
                  <li>Payment information (processed securely through third-party providers)</li>
                  <li>Account credentials (username, password)</li>
                  <li>Purchase history and preferences</li>
                  <li>Communication preferences</li>
                  <li>Customer service interactions</li>
                </ul>

                <h3 style={{ color: 'var(--pink-main)', fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  Automatic Information
                </h3>
                <p>We automatically collect certain information when you visit our site:</p>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>IP address and location data</li>
                  <li>Browser type and version</li>
                  <li>Device information</li>
                  <li>Pages visited and time spent</li>
                  <li>Referral sources</li>
                  <li>Cookies and similar tracking technologies</li>
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
                  3. How We Use Your Information
                </h2>
                <p>We use the information we collect for various purposes, including:</p>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li><strong>Order Processing:</strong> To process and fulfill your orders</li>
                  <li><strong>Customer Service:</strong> To respond to your inquiries and provide support</li>
                  <li><strong>Account Management:</strong> To create and manage your account</li>
                  <li><strong>Marketing:</strong> To send promotional emails (with your consent)</li>
                  <li><strong>Analytics:</strong> To improve our website and services</li>
                  <li><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</li>
                  <li><strong>Security:</strong> To protect against fraud and unauthorized access</li>
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
                  4. Information Sharing and Disclosure
                </h2>
                <p>We may share your information in the following circumstances:</p>
                
                <h3 style={{ color: 'var(--pink-main)', fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  Service Providers
                </h3>
                <p>We work with trusted third-party service providers who assist us with:</p>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>Payment processing (stripe, PayPal, etc.)</li>
                  <li>Shipping and logistics</li>
                  <li>Email marketing services</li>
                  <li>Website analytics (Google Analytics)</li>
                  <li>Customer support tools</li>
                </ul>

                <h3 style={{ color: 'var(--pink-main)', fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  Legal Requirements
                </h3>
                <p>We may disclose your information if required by law or in response to:</p>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>Legal processes or government requests</li>
                  <li>Protection of our rights and property</li>
                  <li>Prevention of fraud or illegal activities</li>
                  <li>Protection of user safety</li>
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
                  5. Data Security
                </h2>
                <p>
                  We implement appropriate technical and organizational security measures to protect your personal information:
                </p>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>SSL encryption for data transmission</li>
                  <li>Secure payment processing</li>
                  <li>Regular security audits and updates</li>
                  <li>Access controls and employee training</li>
                  <li>Data backup and recovery procedures</li>
                </ul>
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem',
                  background: 'rgba(255,255,0,0.1)',
                  border: '1px solid var(--yellow-neon)',
                  borderRadius: '8px'
                }}>
                  <p><strong>Important:</strong> No method of transmission over the internet is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.</p>
                </div>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ 
                  color: 'var(--cyan-accent)', 
                  fontSize: '1.5rem', 
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--cyan-accent)',
                  paddingBottom: '0.5rem'
                }}>
                  6. Your Rights (GDPR)
                </h2>
                <p>Under GDPR and other applicable laws, you have the following rights:</p>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li><strong>Right to Access:</strong> Request copies of your personal data</li>
                  <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
                  <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
                  <li><strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
                  <li><strong>Right to Data Portability:</strong> Receive your data in a structured format</li>
                  <li><strong>Right to Object:</strong> Object to processing for marketing purposes</li>
                  <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
                </ul>
                <p style={{ marginTop: '1rem' }}>
                  To exercise these rights, please contact us at privacy@vobvorot.com. We will respond within 30 days.
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
                  7. Cookies and Tracking Technologies
                </h2>
                <p>We use cookies and similar technologies to enhance your experience:</p>
                
                <h3 style={{ color: 'var(--pink-main)', fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  Types of Cookies
                </h3>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li><strong>Essential Cookies:</strong> Required for website functionality</li>
                  <li><strong>Performance Cookies:</strong> Help us analyze website usage</li>
                  <li><strong>Functional Cookies:</strong> Remember your preferences</li>
                  <li><strong>Marketing Cookies:</strong> Used for targeted advertising (with consent)</li>
                </ul>
                
                <h3 style={{ color: 'var(--pink-main)', fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  Cookie Management
                </h3>
                <p>You can control cookies through your browser settings. Note that disabling certain cookies may affect website functionality.</p>
              </section>

              <section style={{ marginBottom: '2rem' }}>
                <h2 style={{ 
                  color: 'var(--cyan-accent)', 
                  fontSize: '1.5rem', 
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--cyan-accent)',
                  paddingBottom: '0.5rem'
                }}>
                  8. Data Retention
                </h2>
                <p>We retain your personal information for as long as necessary to:</p>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>Provide our services to you</li>
                  <li>Comply with legal obligations</li>
                  <li>Resolve disputes and enforce agreements</li>
                  <li>Improve our services and analytics</li>
                </ul>
                <p style={{ marginTop: '1rem' }}>
                  Typical retention periods:
                </p>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li><strong>Account Information:</strong> Until account deletion</li>
                  <li><strong>Order History:</strong> 7 years for tax and legal compliance</li>
                  <li><strong>Marketing Data:</strong> Until consent is withdrawn</li>
                  <li><strong>Analytics Data:</strong> Anonymized after 26 months</li>
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
                  9. International Data Transfers
                </h2>
                <p>
                  As we operate internationally, your data may be transferred to and processed in countries outside your residence. 
                  We ensure appropriate safeguards are in place, including:
                </p>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>Standard Contractual Clauses (SCCs)</li>
                  <li>Adequacy decisions by the European Commission</li>
                  <li>Appropriate technical and organizational measures</li>
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
                  10. Children's Privacy
                </h2>
                <p>
                  Our services are not intended for individuals under 16 years of age. We do not knowingly collect 
                  personal information from children under 16. If we become aware that we have collected personal 
                  information from a child under 16, we will take steps to delete such information.
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
                  11. Changes to This Privacy Policy
                </h2>
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of any material changes by:
                </p>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>Posting the updated policy on our website</li>
                  <li>Sending email notifications for significant changes</li>
                  <li>Displaying prominent notices on our website</li>
                </ul>
                <p style={{ marginTop: '1rem' }}>
                  Your continued use of our services after any changes constitutes acceptance of the updated policy.
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
                  12. Contact Us
                </h2>
                <p>
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem',
                  background: 'rgba(0,245,255,0.1)',
                  border: '1px solid var(--cyan-accent)',
                  borderRadius: '8px'
                }}>
                  <p><strong>Data Protection Officer:</strong> privacy@vobvorot.com</p>
                  <p><strong>General Inquiries:</strong> hello@vobvorot.com</p>
                  <p><strong>Address:</strong> VobVorot Store, Ukraine</p>
                  <p><strong>Response Time:</strong> Within 30 days</p>
                </div>
                
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem',
                  background: 'rgba(255,107,157,0.1)',
                  border: '1px solid var(--pink-main)',
                  borderRadius: '8px'
                }}>
                  <p><strong>Supervisory Authority:</strong> If you believe we have not addressed your privacy concerns, you have the right to lodge a complaint with your local data protection authority.</p>
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