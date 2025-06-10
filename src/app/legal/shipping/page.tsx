import { Metadata } from 'next'
import { Footer } from '@/components/Footer'
import { PageSEO } from '@/components/SEO'

export const metadata: Metadata = {
  title: 'Shipping Policy',
  description: 'Shipping and delivery information for VobVorot Store. Learn about our shipping methods, costs, delivery times, and international shipping.',
  robots: {
    index: true,
    follow: true
  }
}

export default function ShippingPage() {
  return (
    <>
      <PageSEO 
        title="Shipping Policy"
        description="Shipping and delivery information for VobVorot Store. Learn about our shipping methods, costs, delivery times, and international shipping."
        canonical="/legal/shipping"
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
                Shipping & Delivery
              </h1>
              <p style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '1.1rem'
              }}>
                We ship Y2K fashion worldwide ✨
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
                  🌍 Worldwide Shipping
                </h2>
                <p>
                  VobVorot Store ships to customers worldwide! We're passionate about bringing Y2K fashion 
                  and Ukrainian design to fashion lovers everywhere. Whether you're in New York, Tokyo, 
                  London, or anywhere in between, we'll get your order to you.
                </p>
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem',
                  background: 'rgba(0,245,255,0.1)',
                  border: '1px solid var(--cyan-accent)',
                  borderRadius: '8px'
                }}>
                  <p><strong>Free Shipping:</strong> Available on orders over $150 USD to most destinations!</p>
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
                  📦 Shipping Methods & Times
                </h2>
                
                <h3 style={{ color: 'var(--pink-main)', fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  Standard Shipping
                </h3>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li><strong>Europe:</strong> 7-14 business days</li>
                  <li><strong>North America:</strong> 10-21 business days</li>
                  <li><strong>Asia-Pacific:</strong> 10-21 business days</li>
                  <li><strong>Rest of World:</strong> 14-28 business days</li>
                </ul>

                <h3 style={{ color: 'var(--pink-main)', fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  Express Shipping
                </h3>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li><strong>Europe:</strong> 3-7 business days</li>
                  <li><strong>North America:</strong> 5-10 business days</li>
                  <li><strong>Asia-Pacific:</strong> 5-10 business days</li>
                  <li><strong>Select Cities:</strong> 2-5 business days</li>
                </ul>

                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem',
                  background: 'rgba(255,255,0,0.1)',
                  border: '1px solid var(--yellow-neon)',
                  borderRadius: '8px'
                }}>
                  <p><strong>Note:</strong> Delivery times are estimates and may vary due to customs processing, local holidays, or unforeseen circumstances. We'll keep you updated throughout the journey!</p>
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
                  💰 Shipping Costs
                </h2>
                <p>Shipping costs are calculated at checkout based on your location and chosen method:</p>
                
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '1rem',
                  marginTop: '1rem'
                }}>
                  <div style={{ 
                    padding: '1rem',
                    background: 'rgba(255,107,157,0.1)',
                    border: '1px solid var(--pink-main)',
                    borderRadius: '8px'
                  }}>
                    <h4 style={{ color: 'var(--pink-main)', marginBottom: '0.5rem' }}>Europe</h4>
                    <p>Standard: €8-15</p>
                    <p>Express: €20-35</p>
                  </div>
                  
                  <div style={{ 
                    padding: '1rem',
                    background: 'rgba(0,245,255,0.1)',
                    border: '1px solid var(--cyan-accent)',
                    borderRadius: '8px'
                  }}>
                    <h4 style={{ color: 'var(--cyan-accent)', marginBottom: '0.5rem' }}>North America</h4>
                    <p>Standard: $12-25</p>
                    <p>Express: $30-50</p>
                  </div>
                  
                  <div style={{ 
                    padding: '1rem',
                    background: 'rgba(255,107,157,0.1)',
                    border: '1px solid var(--pink-main)',
                    borderRadius: '8px'
                  }}>
                    <h4 style={{ color: 'var(--pink-main)', marginBottom: '0.5rem' }}>Asia-Pacific</h4>
                    <p>Standard: $15-30</p>
                    <p>Express: $35-60</p>
                  </div>
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
                  🏭 Order Processing
                </h2>
                <p>Your Y2K fashion journey starts here:</p>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li><strong>Order Confirmation:</strong> Immediate email confirmation</li>
                  <li><strong>Processing Time:</strong> 1-3 business days (excluding weekends)</li>
                  <li><strong>Quality Check:</strong> Every item is inspected before shipping</li>
                  <li><strong>Packaging:</strong> Eco-friendly materials with VobVorot branding</li>
                  <li><strong>Dispatch:</strong> Tracking information sent via email</li>
                </ul>
                
                <h3 style={{ color: 'var(--pink-main)', fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  Custom Orders
                </h3>
                <p>
                  Custom and made-to-order items require additional processing time:
                </p>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>Custom sizing: 5-10 business days</li>
                  <li>Special requests: 7-14 business days</li>
                  <li>Limited edition items: 3-7 business days</li>
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
                  🛃 Customs & Duties
                </h2>
                <p>
                  International orders may be subject to customs duties and taxes imposed by your country. 
                  These fees are not included in your order total and are the customer's responsibility.
                </p>
                
                <h3 style={{ color: 'var(--pink-main)', fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  What to Expect
                </h3>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>Duties/taxes vary by country (typically 0-25% of order value)</li>
                  <li>Customs may inspect packages, causing delays</li>
                  <li>We mark all packages as "Merchandise" with actual value</li>
                  <li>You'll be contacted by local customs/courier if payment is required</li>
                </ul>

                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem',
                  background: 'rgba(0,245,255,0.1)',
                  border: '1px solid var(--cyan-accent)',
                  borderRadius: '8px'
                }}>
                  <p><strong>EU Customers:</strong> Orders over €22 may be subject to VAT. Orders over €150 may incur additional customs duties.</p>
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
                  📍 Order Tracking
                </h2>
                <p>Stay updated on your Y2K fashion delivery:</p>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li><strong>Tracking Email:</strong> Sent within 24 hours of dispatch</li>
                  <li><strong>Real-time Updates:</strong> Track through carrier websites</li>
                  <li><strong>Account Dashboard:</strong> View all orders in your VobVorot account</li>
                  <li><strong>SMS Updates:</strong> Optional notifications for key milestones</li>
                </ul>

                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem',
                  background: 'rgba(255,107,157,0.1)',
                  border: '1px solid var(--pink-main)',
                  borderRadius: '8px'
                }}>
                  <p><strong>Can't Find Your Package?</strong> Contact us at support@vobvorot.com with your order number, and we'll investigate immediately!</p>
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
                  🚚 Delivery Information
                </h2>
                
                <h3 style={{ color: 'var(--pink-main)', fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  Delivery Requirements
                </h3>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>Someone must be available to receive the package</li>
                  <li>Valid address with apartment/unit numbers</li>
                  <li>Contact number for delivery coordination</li>
                  <li>ID may be required for high-value orders</li>
                </ul>

                <h3 style={{ color: 'var(--pink-main)', fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  Delivery Attempts
                </h3>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>Up to 3 delivery attempts will be made</li>
                  <li>Failed deliveries held at local facility for 7-14 days</li>
                  <li>Unclaimed packages returned to VobVorot (shipping charges apply)</li>
                  <li>Redelivery fees may apply</li>
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
                  🌿 Sustainable Packaging
                </h2>
                <p>
                  We're committed to protecting our planet while delivering your Y2K fashion:
                </p>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>Recycled and recyclable packaging materials</li>
                  <li>Minimal packaging without compromising protection</li>
                  <li>Biodegradable packaging peanuts and bubble wrap</li>
                  <li>Reusable VobVorot branded mailer bags</li>
                  <li>Carbon-neutral shipping options available</li>
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
                  ⚠️ Shipping Restrictions
                </h2>
                <p>Unfortunately, we cannot ship to certain locations due to various restrictions:</p>
                
                <h3 style={{ color: 'var(--pink-main)', fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  Currently Restricted
                </h3>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>Countries under international sanctions</li>
                  <li>Remote islands with unreliable postal service</li>
                  <li>Military bases (APO/FPO addresses)</li>
                  <li>P.O. Boxes for certain high-value items</li>
                </ul>

                <p style={{ marginTop: '1rem' }}>
                  If your location isn't supported at checkout, contact us at support@vobvorot.com 
                  to explore alternative shipping solutions.
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
                  📞 Shipping Support
                </h2>
                <p>
                  Our shipping team is here to help with any questions or concerns:
                </p>
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem',
                  background: 'rgba(0,245,255,0.1)',
                  border: '1px solid var(--cyan-accent)',
                  borderRadius: '8px'
                }}>
                  <p><strong>Email:</strong> support@vobvorot.com</p>
                  <p><strong>Response Time:</strong> Within 24 hours</p>
                  <p><strong>Live Chat:</strong> Available during business hours</p>
                  <p><strong>Order Issues:</strong> support@vobvorot.com</p>
                </div>

                <h3 style={{ color: 'var(--pink-main)', fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  When Contacting Us
                </h3>
                <p>Please include:</p>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>Order number</li>
                  <li>Tracking number (if available)</li>
                  <li>Detailed description of the issue</li>
                  <li>Photos (for damaged packages)</li>
                  <li>Your contact information</li>
                </ul>
              </section>

              <section>
                <h2 style={{ 
                  color: 'var(--cyan-accent)', 
                  fontSize: '1.5rem', 
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--cyan-accent)',
                  paddingBottom: '0.5rem'
                }}>
                  ✨ Special Notes
                </h2>
                <div style={{ 
                  padding: '1rem',
                  background: 'rgba(255,107,157,0.1)',
                  border: '1px solid var(--pink-main)',
                  borderRadius: '8px'
                }}>
                  <p><strong>Holiday Seasons:</strong> Expect longer processing and shipping times during peak seasons (Black Friday, Christmas, Valentine's Day). We recommend ordering early!</p>
                </div>
                
                <div style={{ 
                  marginTop: '1rem',
                  padding: '1rem',
                  background: 'rgba(0,245,255,0.1)',
                  border: '1px solid var(--cyan-accent)',
                  borderRadius: '8px'
                }}>
                  <p><strong>Weather Delays:</strong> Severe weather conditions may cause shipping delays. We'll keep you informed of any significant impacts to your order.</p>
                </div>

                <div style={{ 
                  marginTop: '1rem',
                  padding: '1rem',
                  background: 'rgba(255,255,0,0.1)',
                  border: '1px solid var(--yellow-neon)',
                  borderRadius: '8px'
                }}>
                  <p><strong>Updates:</strong> This shipping policy was last updated on {new Date().toLocaleDateString()}. Check back regularly for the most current information!</p>
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