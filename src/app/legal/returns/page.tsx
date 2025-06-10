import { Metadata } from 'next'
import { Footer } from '@/components/Footer'
import { PageSEO } from '@/components/SEO'

export const metadata: Metadata = {
  title: 'Returns & Exchanges',
  description: 'Returns and exchanges policy for VobVorot Store. Learn about our return process, timelines, and how to exchange your Y2K fashion items.',
  robots: {
    index: true,
    follow: true
  }
}

export default function ReturnsPage() {
  return (
    <>
      <PageSEO 
        title="Returns & Exchanges"
        description="Returns and exchanges policy for VobVorot Store. Learn about our return process, timelines, and how to exchange your Y2K fashion items."
        canonical="/legal/returns"
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
                Returns & Exchanges
              </h1>
              <p style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '1.1rem'
              }}>
                Love it or return it - We want you to be happy! 💕
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
                  💕 Our Promise to You
                </h2>
                <p>
                  At VobVorot Store, we want you to absolutely love your Y2K fashion pieces. If you're not 
                  completely satisfied with your purchase, we're here to make it right. We offer hassle-free 
                  returns and exchanges within 30 days of delivery.
                </p>
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem',
                  background: 'rgba(0,245,255,0.1)',
                  border: '1px solid var(--cyan-accent)',
                  borderRadius: '8px'
                }}>
                  <p><strong>Quick Returns:</strong> Most returns are processed within 3-5 business days of receipt!</p>
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
                  📋 Return Eligibility
                </h2>
                
                <h3 style={{ color: 'var(--pink-main)', fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  ✅ What Can Be Returned
                </h3>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>Items in original condition with all tags attached</li>
                  <li>Unworn, unwashed, and unaltered items</li>
                  <li>Items in original packaging (if applicable)</li>
                  <li>Regular priced items within 30 days of delivery</li>
                  <li>Sale items within 14 days of delivery (store credit only)</li>
                </ul>

                <h3 style={{ color: 'var(--pink-main)', fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  ❌ What Cannot Be Returned
                </h3>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>Custom or personalized items</li>
                  <li>Intimate apparel and swimwear (for hygiene reasons)</li>
                  <li>Items damaged by normal wear and tear</li>
                  <li>Items without original tags or packaging</li>
                  <li>Items returned after 30 days</li>
                  <li>Final sale items (clearly marked at purchase)</li>
                </ul>

                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem',
                  background: 'rgba(255,255,0,0.1)',
                  border: '1px solid var(--yellow-neon)',
                  borderRadius: '8px'
                }}>
                  <p><strong>Not Sure?</strong> Contact us at support@vobvorot.com before returning to confirm eligibility!</p>
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
                  🔄 How to Return Items
                </h2>
                
                <h3 style={{ color: 'var(--pink-main)', fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  Step 1: Start Your Return
                </h3>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>Log into your VobVorot account and go to "Order History"</li>
                  <li>Click "Return Items" next to your order</li>
                  <li>Select items and reason for return</li>
                  <li>Print your prepaid return label (free for most returns)</li>
                </ul>

                <h3 style={{ color: 'var(--pink-main)', fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  Step 2: Package Your Items
                </h3>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>Place items in original packaging or a secure box</li>
                  <li>Include the return form (printed from your account)</li>
                  <li>Remove or cover old shipping labels</li>
                  <li>Attach the new return label securely</li>
                </ul>

                <h3 style={{ color: 'var(--pink-main)', fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  Step 3: Ship It Back
                </h3>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>Drop off at any authorized carrier location</li>
                  <li>Keep your tracking receipt until refund is processed</li>
                  <li>Returns typically arrive at our facility within 7-14 days</li>
                  <li>You'll receive email updates throughout the process</li>
                </ul>

                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem',
                  background: 'rgba(255,107,157,0.1)',
                  border: '1px solid var(--pink-main)',
                  borderRadius: '8px'
                }}>
                  <p><strong>No Account?</strong> Email support@vobvorot.com with your order number to start a return!</p>
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
                  🔄 Exchanges
                </h2>
                <p>
                  Need a different size or color? We make exchanges easy!
                </p>
                
                <h3 style={{ color: 'var(--pink-main)', fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  Size Exchanges
                </h3>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>Free size exchanges within 30 days</li>
                  <li>Original item must be in perfect condition</li>
                  <li>New size must be available in stock</li>
                  <li>Processing time: 3-5 business days after we receive your return</li>
                </ul>

                <h3 style={{ color: 'var(--pink-main)', fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  Color/Style Exchanges
                </h3>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>Available for items of equal or lesser value</li>
                  <li>Price difference refunded as store credit</li>
                  <li>Subject to availability</li>
                  <li>Same return conditions apply</li>
                </ul>

                <h3 style={{ color: 'var(--pink-main)', fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  Express Exchange
                </h3>
                <p>
                  Need your new item faster? We offer express exchange for a small fee:
                </p>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>We ship your new item immediately</li>
                  <li>Return original item within 14 days</li>
                  <li>Additional shipping fee applies</li>
                  <li>Available for in-stock items only</li>
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
                  💰 Refunds
                </h2>
                
                <h3 style={{ color: 'var(--pink-main)', fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  Refund Methods
                </h3>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li><strong>Original Payment Method:</strong> Full refund for regular priced items</li>
                  <li><strong>Store Credit:</strong> Sale items and items returned after 14 days</li>
                  <li><strong>Gift Card:</strong> Items purchased with gift cards</li>
                </ul>

                <h3 style={{ color: 'var(--pink-main)', fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  Refund Timeline
                </h3>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li><strong>Processing:</strong> 3-5 business days after we receive your return</li>
                  <li><strong>Credit Cards:</strong> 5-10 business days to appear on statement</li>
                  <li><strong>PayPal:</strong> 3-5 business days</li>
                  <li><strong>Store Credit:</strong> Immediate (issued as email voucher)</li>
                </ul>

                <h3 style={{ color: 'var(--pink-main)', fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  What's Refunded
                </h3>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>Full item price for accepted returns</li>
                  <li>Original shipping (if entire order is returned)</li>
                  <li>Taxes paid (as applicable)</li>
                </ul>

                <h3 style={{ color: 'var(--pink-main)', fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  What's Not Refunded
                </h3>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>Return shipping costs (unless item was defective)</li>
                  <li>International customs/duties</li>
                  <li>Express shipping fees</li>
                  <li>Gift wrapping charges</li>
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
                  🌍 International Returns
                </h2>
                <p>
                  We accept returns from our international customers with a few special considerations:
                </p>
                
                <h3 style={{ color: 'var(--pink-main)', fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  Return Process
                </h3>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>Contact support@vobvorot.com before shipping</li>
                  <li>We'll provide return instructions and address</li>
                  <li>Return shipping costs are customer's responsibility</li>
                  <li>Use trackable shipping method for protection</li>
                </ul>

                <h3 style={{ color: 'var(--pink-main)', fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  Important Notes
                </h3>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>Mark package as "RETURNED GOODS" to avoid customs fees</li>
                  <li>Include copy of original invoice</li>
                  <li>Extended processing time due to international shipping</li>
                  <li>Customs duties on returns are non-refundable</li>
                </ul>

                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem',
                  background: 'rgba(0,245,255,0.1)',
                  border: '1px solid var(--cyan-accent)',
                  borderRadius: '8px'
                }}>
                  <p><strong>EU Customers:</strong> You have 14 days to return items under EU consumer protection laws. We honor this requirement!</p>
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
                  ⚠️ Defective or Damaged Items
                </h2>
                <p>
                  If you receive a defective or damaged item, we'll make it right immediately:
                </p>
                
                <h3 style={{ color: 'var(--pink-main)', fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  Immediate Actions
                </h3>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>Contact us within 7 days of delivery</li>
                  <li>Email photos of the damage to support@vobvorot.com</li>
                  <li>Include your order number and description</li>
                  <li>Keep all original packaging for investigation</li>
                </ul>

                <h3 style={{ color: 'var(--pink-main)', fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  Resolution Options
                </h3>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li><strong>Replacement:</strong> Send new item immediately (free shipping)</li>
                  <li><strong>Refund:</strong> Full refund including original shipping</li>
                  <li><strong>Partial Refund:</strong> For minor defects you choose to keep</li>
                  <li><strong>Store Credit:</strong> 110% value for future purchases</li>
                </ul>

                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem',
                  background: 'rgba(255,107,157,0.1)',
                  border: '1px solid var(--pink-main)',
                  borderRadius: '8px'
                }}>
                  <p><strong>Our Promise:</strong> Defective items are always our responsibility. We'll cover all return shipping and make it right!</p>
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
                  📞 Return Support
                </h2>
                <p>
                  Need help with your return? We're here for you:
                </p>
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem',
                  background: 'rgba(0,245,255,0.1)',
                  border: '1px solid var(--cyan-accent)',
                  borderRadius: '8px'
                }}>
                  <p><strong>Returns Team:</strong> support@vobvorot.com</p>
                  <p><strong>General Support:</strong> support@vobvorot.com</p>
                  <p><strong>Response Time:</strong> Within 24 hours</p>
                  <p><strong>Live Chat:</strong> Available on website during business hours</p>
                </div>

                <h3 style={{ color: 'var(--pink-main)', fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  What to Include in Your Email
                </h3>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>Order number</li>
                  <li>Item(s) you want to return</li>
                  <li>Reason for return</li>
                  <li>Photos (if damaged/defective)</li>
                  <li>Preferred resolution (refund/exchange)</li>
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
                  💡 Return Tips
                </h2>
                
                <h3 style={{ color: 'var(--pink-main)', fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  Before You Buy
                </h3>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>Check our size guide carefully</li>
                  <li>Read product descriptions and materials</li>
                  <li>Look at multiple product photos</li>
                  <li>Read customer reviews for fit insights</li>
                </ul>

                <h3 style={{ color: 'var(--pink-main)', fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  Before You Return
                </h3>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>Try styling the item differently</li>
                  <li>Check if alterations could help</li>
                  <li>Consider if you might wear it for special occasions</li>
                  <li>Remember that Y2K fashion is meant to be bold!</li>
                </ul>

                <h3 style={{ color: 'var(--pink-main)', fontSize: '1.2rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>
                  Faster Processing
                </h3>
                <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                  <li>Use the return form from your account</li>
                  <li>Pack items securely to prevent damage</li>
                  <li>Use trackable shipping methods</li>
                  <li>Keep tags attached and items clean</li>
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
                  ✨ Our Commitment
                </h2>
                <div style={{ 
                  padding: '1rem',
                  background: 'rgba(255,107,157,0.1)',
                  border: '1px solid var(--pink-main)',
                  borderRadius: '8px'
                }}>
                  <p>
                    <strong>At VobVorot Store, your satisfaction is our priority.</strong> We believe in the quality of our Y2K fashion 
                    and want you to love every piece you purchase. If something isn't right, we're here to make it right. 
                    Your happiness and confidence in our brand matter more than any single sale.
                  </p>
                </div>
                
                <div style={{ 
                  marginTop: '1rem',
                  padding: '1rem',
                  background: 'rgba(0,245,255,0.1)',
                  border: '1px solid var(--cyan-accent)',
                  borderRadius: '8px'
                }}>
                  <p>
                    <strong>Questions about this policy?</strong> We're always happy to clarify any details or help you understand 
                    your options. Reach out to us anytime - we're here to help make your VobVorot experience amazing! ✨
                  </p>
                </div>

                <div style={{ 
                  marginTop: '1rem',
                  padding: '1rem',
                  background: 'rgba(255,255,0,0.1)',
                  border: '1px solid var(--yellow-neon)',
                  borderRadius: '8px'
                }}>
                  <p><strong>Last Updated:</strong> {new Date().toLocaleDateString()} - We regularly review and update our return policy to serve you better!</p>
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