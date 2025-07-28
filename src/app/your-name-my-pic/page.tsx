'use client'

import { useState, useEffect } from 'react'
import { Footer } from '@/components/Footer'

export default function YourNameMyPicPage() {
  const [formData, setFormData] = useState({
    signName: '',
    email: '',
    phone: '',
    extraNotes: ''
  })
  const [paymentMethod, setPaymentMethod] = useState<'westernbid_stripe' | 'westernbid_paypal'>('westernbid_stripe')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [videos, setVideos] = useState<string[]>([])
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)

  // Функция для загрузки видео галереи с предзагрузкой первого видео
  const loadVideosGallery = () => {
    console.log('Fetching sign videos gallery from API...')
    fetch('/api/admin/site/sign-videos')
      .then(res => {
        console.log('Sign videos API response status:', res.status)
        return res.json()
      })
      .then(data => {
        console.log('Sign videos API data:', data)
        if (data.videos && data.videos.length > 0) {
          const videoUrls = data.videos.map((video: any) => video.url)
          console.log('Setting sign videos to:', videoUrls)
          
          // Предзагружаем первое видео
          if (videoUrls[0]) {
            const firstVideo = document.createElement('video')
            firstVideo.preload = 'auto'
            firstVideo.src = videoUrls[0]
            firstVideo.load()
            console.log('Preloading first video:', videoUrls[0])
          }
          
          setVideos(videoUrls) // Обновляем массив всех видео
          console.log('Sign videos gallery loaded. Total videos:', videoUrls.length)
        } else {
          console.log('No videos in gallery, showing empty state')
          setVideos([]) // Пустой массив - нет видео для показа
        }
      })
      .catch(err => console.error('Failed to fetch sign videos:', err))
  }

  // Загружаем галерею видео с API и обновляем каждые 30 секунд (аналогично главной странице)
  useEffect(() => {
    loadVideosGallery()
    const interval = setInterval(loadVideosGallery, 30000) // Обновляем каждые 30 секунд
    return () => clearInterval(interval)
  }, [])

  // Автопереключение видео каждые 8 секунд с предзагрузкой
  useEffect(() => {
    if (videos.length > 1) {
      const interval = setInterval(() => {
        setCurrentVideoIndex((prev) => {
          const nextIndex = (prev + 1) % videos.length
          
          // Предзагружаем следующее видео
          if (videos[nextIndex]) {
            const nextVideo = document.createElement('video')
            nextVideo.preload = 'auto'
            nextVideo.src = videos[nextIndex]
            nextVideo.load()
            console.log('Preloading next sign video:', videos[nextIndex])
          }
          
          return nextIndex
        })
      }, 8000)
      return () => clearInterval(interval)
    }
  }, [videos.length])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Send order data to API
      const response = await fetch('/api/sign-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          signName: formData.signName,
          email: formData.email,
          phone: formData.phone,
          extraNotes: formData.extraNotes,
          paymentMethod: paymentMethod
        })
      })

      const result = await response.json()

      if (response.ok) {
        console.log('Sign order created successfully:', result)
        console.log('Payment URL:', result.paymentUrl)
        
        // If form data is provided, create and submit form directly to WesternBid
        if (result.formData && result.targetUrl) {
          console.log('Creating direct payment form for:', result.paymentGateway)
          console.log('Form data:', result.formData)
          
          // Create form element
          const form = document.createElement('form')
          form.method = 'POST'
          form.action = result.targetUrl
          form.style.display = 'none'
          
          // Add all form fields
          Object.entries(result.formData).forEach(([key, value]) => {
            const input = document.createElement('input')
            input.type = 'hidden'
            input.name = key
            input.value = String(value)
            form.appendChild(input)
          })
          
          // Add form to page and submit
          document.body.appendChild(form)
          console.log('Submitting form directly to payment gateway...')
          form.submit()
          
        } else if (result.paymentUrl) {
          console.log('Redirecting to payment URL:', result.paymentUrl)
          window.location.href = result.paymentUrl
        } else {
          console.log('No payment URL provided, showing success page')
          // Fallback to success page
          setIsSubmitted(true)
        }
      } else {
        const errorData = result.error ? result : await response.json()
        console.error('Sign order creation failed:', errorData)
        
        // Show more user-friendly error messages
        if (errorData.error === 'Missing required order data') {
          alert('Please fill in all required fields')
        } else if (errorData.error === 'Payment gateway is currently disabled') {
          alert('Payment system is temporarily unavailable. Please try again later.')
        } else {
          alert(errorData.error || 'Unable to process your order. Please try again.')
        }
      }
    } catch (error) {
      console.error('Order submission failed:', error)
      alert('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          flex: 1,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          padding: '2rem' 
        }}>
          <div style={{
            textAlign: 'center',
            background: 'rgba(0,0,0,0.8)',
            border: '2px solid var(--pink-main)',
            borderRadius: '20px',
            padding: '3rem',
            maxWidth: '500px',
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>✨</div>
            <h2 style={{
              color: 'var(--pink-main)',
              fontSize: '2rem',
              marginBottom: '1.5rem',
              fontWeight: '700'
            }}>
              Thanks, babe. It's cooking.
            </h2>
            <p style={{
              color: 'rgba(255,255,255,0.9)',
              fontSize: '1.2rem',
              lineHeight: '1.6'
            }}>
              Your sign pic drops in 2–7 days. Stay golden, stay chill.
            </p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero Section with Video (Full structure like home page) */}
      <section className="hero-section">
        {/* Video Background */}
        {videos.length > 0 ? (
          videos.map((video, index) => (
            <video
              key={`${video}-${index}`}
              className={`hero-video-container ${index === currentVideoIndex ? 'active' : ''}`}
              style={{ zIndex: 8 }}
              autoPlay
              muted
              loop
              playsInline
              preload={index === currentVideoIndex ? "auto" : "none"}
              onError={() => console.error('Video failed to load:', video)}
              onLoadStart={() => console.log('Video loading started:', video)}
              onCanPlay={() => {
                console.log('Video can play:', video)
                if (index === 0) {
                  console.log('First video ready to play immediately')
                }
              }}
            >
              <source src={video} type="video/mp4" />
            </video>
          ))
        ) : (
          // Dark placeholder when no videos are available
          <div 
            className="hero-video-container active"
            style={{
              background: 'linear-gradient(135deg, rgba(0,0,0,0.8), rgba(25,25,25,0.9))',
              zIndex: 8
            }}
          />
        )}
        
        <div className="hero-overlay" style={{ background: 'linear-gradient(135deg, rgba(255,107,157,0.8), rgba(157,78,221,0.6))' }}></div>
        
        <div className="hero-content" style={{ textAlign: 'center', position: 'relative' }}>
          <h1 className="hero-title glitch" data-logo style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>
            Your Name, My Pic
          </h1>
          <p className="hero-subtitle" style={{ fontSize: '1.3rem', marginBottom: '2rem' }}>
            Custom Sign Photos ✍️
          </p>
          <p style={{ 
            fontSize: '1.1rem', 
            maxWidth: '600px', 
            margin: '0 auto', 
            color: 'rgba(255,255,255,0.9)', 
            lineHeight: '1.6' 
          }}>
            Snag your custom sign pic — your name, handwritten and held by me.<br />
            Unique vibes only. Rare, personal, one-of-a-kind.
          </p>
        </div>
        
        {/* Video Pagination Dots */}
        {videos.length > 1 && (
          <div className="hero-pagination">
            {videos.map((_, index) => (
              <button
                key={index}
                className={`hero-pagination-dot ${index === currentVideoIndex ? 'active' : ''}`}
                onClick={() => setCurrentVideoIndex(index)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Order Form Section */}
      <section className="products-section section-spacing-medium">
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {/* Pricing Info */}
          <div style={{
            background: 'rgba(0,0,0,0.6)',
            border: '2px solid var(--cyan-accent)',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '3rem',
            textAlign: 'center',
            backdropFilter: 'blur(20px)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
              <div>
                <div style={{ color: 'var(--yellow-neon)', fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                  💸 $50
                </div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem' }}>
                  Price
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--green-neon)', fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
                  ⏳ 2–7 days
                </div>
                <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1rem' }}>
                  Processing time
                </div>
              </div>
            </div>
          </div>

          {/* Order Form */}
          <div style={{
            background: 'rgba(0,0,0,0.6)',
            border: '2px solid var(--pink-main)',
            borderRadius: '16px',
            padding: '2rem',
            backdropFilter: 'blur(20px)'
          }}>
            <h2 style={{
              color: 'var(--pink-main)',
              fontSize: '1.8rem',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              ✍️ Order Form:
            </h2>

            <form onSubmit={handleSubmit}>
              {/* Name for sign */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  color: 'var(--white)',
                  marginBottom: '0.5rem',
                  fontSize: '1.1rem',
                  fontWeight: '600'
                }}>
                  1. Name for the sign
                </label>
                <p style={{ 
                  color: 'rgba(255,255,255,0.7)', 
                  fontSize: '0.9rem', 
                  marginBottom: '1rem' 
                }}>
                  What should I write?
                </p>
                <input
                  type="text"
                  name="signName"
                  value={formData.signName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter the name for your sign..."
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid var(--cyan-accent)',
                    borderRadius: '8px',
                    color: 'var(--white)',
                    fontSize: '1rem'
                  }}
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  color: 'var(--white)',
                  marginBottom: '0.5rem',
                  fontSize: '1.1rem',
                  fontWeight: '600'
                }}>
                  2. Your email
                </label>
                <p style={{ 
                  color: 'rgba(255,255,255,0.7)', 
                  fontSize: '0.9rem', 
                  marginBottom: '1rem' 
                }}>
                  That's where you'll receive the photo.
                </p>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="your.email@example.com"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid var(--cyan-accent)',
                    borderRadius: '8px',
                    color: 'var(--white)',
                    fontSize: '1rem'
                  }}
                />
              </div>

              {/* Phone */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  color: 'var(--white)',
                  marginBottom: '0.5rem',
                  fontSize: '1.1rem',
                  fontWeight: '600'
                }}>
                  3. Your phone number
                </label>
                <p style={{ 
                  color: 'rgba(255,255,255,0.7)', 
                  fontSize: '0.9rem', 
                  marginBottom: '1rem' 
                }}>
                  Required for payment processing.
                </p>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  maxLength={16}
                  onChange={(e) => {
                    let value = e.target.value
                    
                    // Remove any non-digit characters except + and spaces/hyphens/parentheses for formatting
                    value = value.replace(/[^\d\+\s\-\(\)]/g, '')
                    
                    // Auto-add + if user starts typing a number without it
                    if (value.length > 0 && !value.startsWith('+') && /^\d/.test(value)) {
                      value = '+' + value
                    }
                    
                    // Limit to 16 characters
                    if (value.length > 16) {
                      value = value.substring(0, 16)
                    }
                    
                    setFormData(prev => ({
                      ...prev,
                      phone: value
                    }))
                  }}
                  required
                  placeholder="+1 (555) 123-4567"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid var(--cyan-accent)',
                    borderRadius: '8px',
                    color: 'var(--white)',
                    fontSize: '1rem'
                  }}
                />
                <p style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontSize: '0.8rem',
                  marginTop: '0.25rem'
                }}>
                  Include country code (e.g., +1 for US, +44 for UK)
                </p>
              </div>

              {/* Extra notes */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  color: 'var(--white)',
                  marginBottom: '0.5rem',
                  fontSize: '1.1rem',
                  fontWeight: '600'
                }}>
                  4. Extra notes (optional)
                </label>
                <p style={{ 
                  color: 'rgba(255,255,255,0.7)', 
                  fontSize: '0.9rem', 
                  marginBottom: '1rem' 
                }}>
                  Mood, styling, special requests...
                </p>
                <textarea
                  name="extraNotes"
                  value={formData.extraNotes}
                  onChange={handleInputChange}
                  placeholder="Any special requests or style preferences..."
                  rows={4}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid var(--cyan-accent)',
                    borderRadius: '8px',
                    color: 'var(--white)',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Payment section */}
              <div style={{ marginBottom: '2rem' }}>
                <label style={{
                  display: 'block',
                  color: 'var(--white)',
                  marginBottom: '1rem',
                  fontSize: '1.1rem',
                  fontWeight: '600'
                }}>
                  5. Payment Method
                </label>
                
                {/* Payment method selection */}
                <div style={{ marginBottom: '1rem' }}>
                  {[
                    { 
                      id: 'westernbid_stripe', 
                      name: 'Credit/Debit Card', 
                      description: 'Pay securely with STRIPE',
                      icon: '💳'
                    },
                    { 
                      id: 'westernbid_paypal', 
                      name: 'PayPal', 
                      description: 'Pay with PayPal account',
                      icon: '💰'
                    }
                  ].map((method) => (
                    <div
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id as any)}
                      style={{
                        padding: '1.5rem',
                        background: paymentMethod === method.id 
                          ? 'rgba(0,245,255,0.2)' 
                          : 'rgba(255,255,255,0.1)',
                        border: `2px solid ${paymentMethod === method.id 
                          ? 'var(--cyan-accent)' 
                          : 'rgba(255,255,255,0.2)'}`,
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        marginBottom: '1rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '2rem' }}>{method.icon}</span>
                        <div>
                          <h3 style={{ 
                            color: 'var(--white)', 
                            fontSize: '1.2rem',
                            marginBottom: '0.5rem' 
                          }}>
                            {method.name}
                          </h3>
                          <p style={{ 
                            color: 'rgba(255,255,255,0.7)', 
                            fontSize: '0.9rem' 
                          }}>
                            {method.id === 'westernbid_stripe' ? (
                              <>Pay securely with <strong>STRIPE</strong></>
                            ) : (
                              method.description
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading || !formData.signName || !formData.email || !formData.phone}
                style={{
                  width: '100%',
                  background: isLoading 
                    ? 'rgba(255,255,255,0.2)' 
                    : 'linear-gradient(45deg, var(--pink-main), var(--purple-accent))',
                  border: 'none',
                  color: 'var(--white)',
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  padding: '1.2rem',
                  borderRadius: '12px',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: isLoading || !formData.signName || !formData.email || !formData.phone ? 0.7 : 1
                }}
              >
                {isLoading ? 'Creating Order...' : '🔒 Proceed to Secure Payment'}
              </button>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}