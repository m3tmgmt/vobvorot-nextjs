'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Review {
  id: string
  rating: number
  title: string
  comment: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string
    displayName: string
  }
}

interface ReviewsData {
  reviews: Review[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
  averageRating: number
  totalReviews: number
  ratingDistribution: Array<{
    rating: number
    _count: { rating: number }
  }>
}

interface ProductReviewsProps {
  productId: string
  productName: string
}

export function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const { data: session } = useSession()
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [userReview, setUserReview] = useState<Review | null>(null)
  
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    comment: ''
  })

  useEffect(() => {
    fetchReviews()
  }, [productId])

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/reviews?productId=${productId}`)
      if (response.ok) {
        const data = await response.json()
        setReviewsData(data)
        
        // Check if current user has already reviewed this product
        if (session?.user?.id) {
          const existingReview = data.reviews.find((review: Review) => 
            review.user.id === session.user.id
          )
          setUserReview(existingReview || null)
        }
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const submitReview = async () => {
    if (!session?.user) {
      alert('Please sign in to leave a review')
      return
    }

    if (!newReview.rating) {
      alert('Please select a rating')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId,
          ...newReview
        })
      })

      if (response.ok) {
        const result = await response.json()
        setUserReview(result.review)
        setShowReviewForm(false)
        setNewReview({ rating: 5, title: '', comment: '' })
        fetchReviews() // Refresh reviews
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to submit review')
      }
    } catch (error) {
      console.error('Failed to submit review:', error)
      alert('Failed to submit review')
    } finally {
      setSubmitting(false)
    }
  }

  const renderStars = (rating: number, interactive = false, onRate?: (rating: number) => void) => {
    return (
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && onRate?.(star)}
            disabled={!interactive}
            style={{
              background: 'none',
              border: 'none',
              color: star <= rating ? 'var(--yellow-neon)' : 'rgba(255,255,255,0.3)',
              fontSize: '1.2rem',
              cursor: interactive ? 'pointer' : 'default',
              padding: '2px',
              transition: 'color 0.2s ease'
            }}
          >
            ★
          </button>
        ))}
      </div>
    )
  }

  const renderRatingDistribution = () => {
    if (!reviewsData?.ratingDistribution || reviewsData.totalReviews === 0) return null

    const distribution = [5, 4, 3, 2, 1].map(rating => {
      const found = reviewsData.ratingDistribution.find(r => r.rating === rating)
      return {
        rating,
        count: found?._count.rating || 0,
        percentage: ((found?._count.rating || 0) / reviewsData.totalReviews) * 100
      }
    })

    return (
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{
          color: 'var(--white)',
          fontSize: '1.3rem',
          marginBottom: '1rem'
        }}>
          Rating Distribution
        </h3>
        {distribution.map(({ rating, count, percentage }) => (
          <div
            key={rating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '0.5rem'
            }}
          >
            <span style={{ color: 'var(--white)', width: '40px' }}>
              {rating} ★
            </span>
            <div style={{
              flex: 1,
              height: '8px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${percentage}%`,
                height: '100%',
                background: 'var(--yellow-neon)',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <span style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: '0.9rem',
              width: '50px'
            }}>
              ({count})
            </span>
          </div>
        ))}
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: 'var(--cyan-accent)'
      }}>
        Loading reviews...
      </div>
    )
  }

  return (
    <div style={{
      background: 'rgba(0,0,0,0.6)',
      border: '2px solid var(--cyan-accent)',
      borderRadius: '16px',
      padding: '2rem',
      backdropFilter: 'blur(20px)',
      marginTop: '3rem'
    }}>
      {/* Reviews Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{
          color: 'var(--cyan-accent)',
          fontSize: '2rem',
          marginBottom: '1rem'
        }}>
          Customer Reviews
        </h2>
        
        {reviewsData && reviewsData.totalReviews > 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {renderStars(Math.round(reviewsData.averageRating))}
              <span style={{
                color: 'var(--white)',
                fontSize: '1.2rem',
                fontWeight: '600'
              }}>
                {reviewsData.averageRating.toFixed(1)}
              </span>
            </div>
            <span style={{
              color: 'rgba(255,255,255,0.7)'
            }}>
              ({reviewsData.totalReviews} review{reviewsData.totalReviews !== 1 ? 's' : ''})
            </span>
          </div>
        ) : (
          <p style={{
            color: 'rgba(255,255,255,0.7)',
            marginBottom: '1rem'
          }}>
            No reviews yet. Be the first to review this product!
          </p>
        )}

        {/* Write Review Button */}
        {session?.user && !userReview && (
          <button
            onClick={() => setShowReviewForm(true)}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(45deg, var(--pink-main), var(--cyan-accent))',
              border: 'none',
              borderRadius: '8px',
              color: 'var(--white)',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Write a Review
          </button>
        )}

        {userReview && (
          <div style={{
            background: 'rgba(57,255,20,0.1)',
            border: '1px solid var(--green-neon)',
            borderRadius: '8px',
            padding: '1rem',
            marginTop: '1rem'
          }}>
            <div style={{
              color: 'var(--green-neon)',
              fontSize: '0.9rem',
              marginBottom: '0.5rem'
            }}>
              ✅ You have reviewed this product
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {renderStars(userReview.rating)}
              <span style={{ color: 'var(--white)' }}>
                {userReview.title}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Rating Distribution */}
      {renderRatingDistribution()}

      {/* Review Form */}
      {showReviewForm && (
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid var(--pink-main)',
          borderRadius: '12px',
          padding: '2rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{
            color: 'var(--pink-main)',
            fontSize: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            Write a Review for {productName}
          </h3>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              color: 'var(--white)',
              marginBottom: '0.5rem',
              fontSize: '1rem'
            }}>
              Rating *
            </label>
            {renderStars(newReview.rating, true, (rating) => 
              setNewReview(prev => ({ ...prev, rating }))
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              color: 'var(--white)',
              marginBottom: '0.5rem',
              fontSize: '1rem'
            }}>
              Title (optional)
            </label>
            <input
              type="text"
              value={newReview.title}
              onChange={(e) => setNewReview(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Summary of your review"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid var(--cyan-accent)',
                borderRadius: '8px',
                color: 'var(--white)',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              color: 'var(--white)',
              marginBottom: '0.5rem',
              fontSize: '1rem'
            }}>
              Review (optional)
            </label>
            <textarea
              value={newReview.comment}
              onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
              placeholder="Tell others about your experience with this product"
              rows={4}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid var(--cyan-accent)',
                borderRadius: '8px',
                color: 'var(--white)',
                fontSize: '1rem',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{
            display: 'flex',
            gap: '1rem'
          }}>
            <button
              onClick={submitReview}
              disabled={submitting}
              style={{
                padding: '0.75rem 1.5rem',
                background: submitting 
                  ? 'rgba(255,255,255,0.2)' 
                  : 'linear-gradient(45deg, var(--green-neon), #32cd32)',
                border: 'none',
                borderRadius: '8px',
                color: 'var(--white)',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: submitting ? 'not-allowed' : 'pointer',
                opacity: submitting ? 0.7 : 1
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
            <button
              onClick={() => {
                setShowReviewForm(false)
                setNewReview({ rating: 5, title: '', comment: '' })
              }}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid var(--cyan-accent)',
                borderRadius: '8px',
                color: 'var(--white)',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviewsData && reviewsData.reviews.length > 0 && (
        <div>
          <h3 style={{
            color: 'var(--white)',
            fontSize: '1.3rem',
            marginBottom: '1.5rem'
          }}>
            All Reviews
          </h3>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            {reviewsData.reviews.map((review) => (
              <div
                key={review.id}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '1.5rem'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      {renderStars(review.rating)}
                    </div>
                    {review.title && (
                      <h4 style={{
                        color: 'var(--white)',
                        fontSize: '1.1rem',
                        fontWeight: '600',
                        marginBottom: '0.5rem'
                      }}>
                        {review.title}
                      </h4>
                    )}
                    <div style={{
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '0.9rem'
                    }}>
                      {review.user.displayName} • {new Date(review.createdAt).toLocaleDateString()}
                      {review.updatedAt !== review.createdAt && (
                        <span style={{ fontStyle: 'italic' }}> (edited)</span>
                      )}
                    </div>
                  </div>
                </div>
                
                {review.comment && (
                  <p style={{
                    color: 'var(--white)',
                    lineHeight: '1.6',
                    marginTop: '1rem'
                  }}>
                    {review.comment}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}