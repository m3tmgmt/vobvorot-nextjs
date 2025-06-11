'use client'

import { useInView } from '@/hooks/useInView'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  color: string
  requirement: string
  unlocked: boolean
  unlockedAt?: Date
}

interface AchievementCardProps {
  achievement: Achievement
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const { ref, isInView } = useInView({
    threshold: 0.1,
    rootMargin: '100px',
    triggerOnce: true
  })

  // Скелетон для achievement карточки
  if (!isInView) {
    return (
      <div 
        ref={ref}
        className="product-card content-card"
        style={{
          borderColor: 'rgba(255,255,255,0.2)',
          background: 'rgba(255,255,255,0.05)',
          minHeight: '200px',
          textAlign: 'center',
          animation: 'pulse 1.5s ease-in-out infinite alternate'
        }}
      >
        <div style={{ 
          width: '60px', 
          height: '60px', 
          background: 'rgba(255,255,255,0.1)', 
          borderRadius: '50%',
          margin: '0 auto 1rem'
        }} />
        <div style={{ 
          width: '80%', 
          height: '20px', 
          background: 'rgba(255,255,255,0.1)', 
          borderRadius: '4px',
          margin: '0 auto 0.5rem'
        }} />
        <div style={{ 
          width: '100%', 
          height: '40px', 
          background: 'rgba(255,255,255,0.05)', 
          borderRadius: '4px',
          margin: '0 auto'
        }} />
      </div>
    )
  }

  return (
    <div 
      ref={ref}
      className="product-card content-card"
      style={{
        borderColor: achievement.unlocked ? achievement.color : 'rgba(255,255,255,0.2)',
        background: achievement.unlocked 
          ? `linear-gradient(45deg, ${achievement.color}20, ${achievement.color}10)`
          : 'rgba(255,255,255,0.05)',
        opacity: 0,
        animation: 'fadeIn 0.5s ease-out forwards',
        animationDelay: '0.1s',
        textAlign: 'center'
      }}
    >
      <div style={{ 
        fontSize: '3rem', 
        marginBottom: '1rem',
        filter: achievement.unlocked ? `drop-shadow(0 0 20px ${achievement.color})` : 'grayscale(100%)',
        opacity: achievement.unlocked ? 1 : 0.5
      }}>
        {achievement.icon}
      </div>
      <h3 style={{ 
        color: achievement.unlocked ? achievement.color : 'rgba(255,255,255,0.5)', 
        marginBottom: '0.5rem' 
      }}>
        {achievement.name}
      </h3>
      <p style={{ 
        color: 'rgba(255,255,255,0.7)', 
        fontSize: '0.9rem',
        marginBottom: '0.5rem'
      }}>
        {achievement.description}
      </p>
      <p style={{ 
        color: 'var(--cyan-accent)', 
        fontSize: '0.8rem'
      }}>
        {achievement.requirement}
      </p>
      {achievement.unlocked && achievement.unlockedAt && (
        <p style={{ 
          color: 'var(--purple-accent)', 
          fontSize: '0.7rem',
          marginTop: '0.5rem'
        }}>
          Unlocked: {achievement.unlockedAt.toLocaleString()}
        </p>
      )}
    </div>
  )
}