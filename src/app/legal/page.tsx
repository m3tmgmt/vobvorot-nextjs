import { Metadata } from 'next'
import Link from 'next/link'
import { Footer } from '@/components/Footer'
import { PageSEO } from '@/components/SEO'

export const metadata: Metadata = {
  title: 'Legal Information',
  description: 'Legal information and policies for VobVorot Store including terms of service, privacy policy, shipping information, and returns policy.',
  robots: {
    index: true,
    follow: true
  }
}

export default function LegalPage() {
  const legalPages = [
    {
      title: 'Terms of Service',
      description: 'Our terms and conditions for using VobVorot Store and making purchases.',
      href: '/legal/terms',
      icon: '📋',
      color: 'var(--pink-main)'
    },
    {
      title: 'Privacy Policy',
      description: 'How we collect, use, and protect your personal information.',
      href: '/legal/privacy',
      icon: '🔒',
      color: 'var(--cyan-accent)'
    },
    {
      title: 'Shipping Policy',
      description: 'Information about shipping methods, costs, and delivery worldwide.',
      href: '/legal/shipping',
      icon: '🚚',
      color: 'var(--purple-accent)'
    },
    {
      title: 'Returns & Exchanges',
      description: 'Our hassle-free return and exchange policy for your satisfaction.',
      href: '/legal/returns',
      icon: '🔄',
      color: 'var(--green-neon)'
    }
  ]

  return (
    <>
      <PageSEO 
        title="Legal Information"
        description="Legal information and policies for VobVorot Store including terms of service, privacy policy, shipping information, and returns policy."
        canonical="/legal"
      />
      
      <div style={{ minHeight: '100vh', padding: '2rem' }}>
        <div className="container">
          <div style={{
            maxWidth: '1000px',
            margin: '2rem auto'
          }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <h1 style={{
                color: 'var(--pink-main)',
                fontSize: '3.5rem',
                fontWeight: '700',
                marginBottom: '1rem',
                textShadow: '0 0 20px var(--pink-main)'
              }}>
                Legal Information
              </h1>
              <p style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '1.2rem',
                lineHeight: '1.6',
                maxWidth: '600px',
                margin: '0 auto'
              }}>
                Everything you need to know about shopping with VobVorot Store. 
                We believe in transparency and want you to feel confident and informed.
              </p>
            </div>

            {/* Legal Pages Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
              gap: '2rem',
              marginBottom: '4rem'
            }}>
              {legalPages.map((page, index) => (
                <Link
                  key={page.href}
                  href={page.href}
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    display: 'block'
                  }}
                >
                  <div
                    style={{
                      background: 'rgba(0,0,0,0.6)',
                      border: `2px solid ${page.color}`,
                      borderRadius: '16px',
                      padding: '2rem',
                      backdropFilter: 'blur(20px)',
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      height: '100%'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginBottom: '1rem'
                    }}>
                      <span style={{
                        fontSize: '2rem',
                        marginRight: '1rem'
                      }}>
                        {page.icon}
                      </span>
                      <h2 style={{
                        color: page.color,
                        fontSize: '1.5rem',
                        fontWeight: '600',
                        margin: 0
                      }}>
                        {page.title}
                      </h2>
                    </div>
                    <p style={{
                      color: 'rgba(255,255,255,0.8)',
                      fontSize: '1rem',
                      lineHeight: '1.6',
                      margin: 0
                    }}>
                      {page.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Additional Information */}
            <div style={{
              background: 'rgba(0,0,0,0.6)',
              border: '2px solid var(--cyan-accent)',
              borderRadius: '16px',
              padding: '2rem',
              backdropFilter: 'blur(20px)',
              marginBottom: '2rem'
            }}>
              <h2 style={{
                color: 'var(--cyan-accent)',
                fontSize: '1.8rem',
                marginBottom: '1rem',
                textAlign: 'center'
              }}>
                🛡️ Your Rights & Our Responsibilities
              </h2>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '2rem',
                marginTop: '2rem'
              }}>
                <div>
                  <h3 style={{ color: 'var(--pink-main)', marginBottom: '0.5rem' }}>
                    🇪🇺 GDPR Compliant
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    We fully comply with the General Data Protection Regulation and respect your privacy rights.
                  </p>
                </div>
                
                <div>
                  <h3 style={{ color: 'var(--purple-accent)', marginBottom: '0.5rem' }}>
                    🔒 Secure Shopping
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    Your personal and payment information is protected with industry-standard encryption.
                  </p>
                </div>
                
                <div>
                  <h3 style={{ color: 'var(--green-neon)', marginBottom: '0.5rem' }}>
                    💕 Customer First
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                    Our policies are designed with your satisfaction and peace of mind as the top priority.
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div style={{
              background: 'rgba(0,0,0,0.6)',
              border: '2px solid var(--pink-main)',
              borderRadius: '16px',
              padding: '2rem',
              backdropFilter: 'blur(20px)',
              textAlign: 'center'
            }}>
              <h2 style={{
                color: 'var(--pink-main)',
                fontSize: '1.8rem',
                marginBottom: '1rem'
              }}>
                📞 Questions About Our Policies?
              </h2>
              <p style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: '1rem',
                lineHeight: '1.6',
                marginBottom: '1.5rem'
              }}>
                We're here to help! If you have any questions about our terms, privacy practices, 
                shipping, or returns, don't hesitate to reach out.
              </p>
              
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <a
                  href="mailto:legal@vobvorot.com"
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'linear-gradient(45deg, var(--pink-main), var(--cyan-accent))',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'var(--white)',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  📧 Legal Questions
                </a>
                
                <a
                  href="mailto:hello@vobvorot.com"
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'rgba(0,245,255,0.2)',
                    border: '1px solid var(--cyan-accent)',
                    borderRadius: '8px',
                    color: 'var(--cyan-accent)',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease'
                  }}
                >
                  💬 General Support
                </a>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  )
}