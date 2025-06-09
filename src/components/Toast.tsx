'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearAll: () => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

/**
 * Toast Provider component that manages toast notifications globally
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000
    }
    
    setToasts(prev => [...prev, newToast])

    // Auto remove toast after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearAll }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

/**
 * Toast Container component that renders all active toasts
 */
function ToastContainer({ 
  toasts, 
  onRemove 
}: { 
  toasts: Toast[]
  onRemove: (id: string) => void 
}) {
  if (toasts.length === 0) return null

  return (
    <div
      className="toast-container"
      style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        maxWidth: '400px'
      }}
    >
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onRemove={() => onRemove(toast.id)}
        />
      ))}
    </div>
  )
}

/**
 * Individual Toast Item component
 */
function ToastItem({ 
  toast, 
  onRemove 
}: { 
  toast: Toast
  onRemove: () => void 
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // Trigger enter animation
    setTimeout(() => setIsVisible(true), 10)
  }, [])

  const handleClose = useCallback(() => {
    setIsExiting(true)
    setTimeout(onRemove, 300) // Animation duration
  }, [onRemove])

  const getToastStyles = () => {
    const baseStyles = {
      padding: '1rem',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem',
      minWidth: '300px',
      transform: isVisible && !isExiting ? 'translateX(0)' : 'translateX(100%)',
      opacity: isVisible && !isExiting ? 1 : 0,
      transition: 'all 0.3s ease-in-out',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)'
    }

    const typeStyles = {
      success: {
        background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(21, 128, 61, 0.9))',
        borderColor: 'rgba(34, 197, 94, 0.3)'
      },
      error: {
        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(185, 28, 28, 0.9))',
        borderColor: 'rgba(239, 68, 68, 0.3)'
      },
      warning: {
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.9), rgba(180, 83, 9, 0.9))',
        borderColor: 'rgba(245, 158, 11, 0.3)'
      },
      info: {
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(29, 78, 216, 0.9))',
        borderColor: 'rgba(59, 130, 246, 0.3)'
      }
    }

    return { ...baseStyles, ...typeStyles[toast.type] }
  }

  const getIcon = () => {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    }
    return icons[toast.type]
  }

  return (
    <div style={getToastStyles()}>
      <div style={{
        fontSize: '1.2rem',
        fontWeight: 'bold',
        color: 'white',
        flexShrink: 0
      }}>
        {getIcon()}
      </div>
      
      <div style={{ flex: 1, color: 'white' }}>
        <div style={{
          fontWeight: '600',
          fontSize: '0.9rem',
          marginBottom: toast.message ? '0.25rem' : 0
        }}>
          {toast.title}
        </div>
        
        {toast.message && (
          <div style={{
            fontSize: '0.8rem',
            opacity: 0.9,
            lineHeight: 1.4
          }}>
            {toast.message}
          </div>
        )}
        
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: 'white',
              padding: '0.25rem 0.5rem',
              borderRadius: '4px',
              fontSize: '0.8rem',
              marginTop: '0.5rem',
              cursor: 'pointer'
            }}
          >
            {toast.action.label}
          </button>
        )}
      </div>
      
      <button
        onClick={handleClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255, 255, 255, 0.7)',
          cursor: 'pointer',
          fontSize: '1.2rem',
          lineHeight: 1,
          padding: '0',
          flexShrink: 0
        }}
      >
        ×
      </button>
    </div>
  )
}

/**
 * Utility hooks for common toast patterns
 */
export function useToastActions() {
  const { addToast } = useToast()

  return {
    success: useCallback((title: string, message?: string) => {
      addToast({ type: 'success', title, message })
    }, [addToast]),

    error: useCallback((title: string, message?: string) => {
      addToast({ type: 'error', title, message })
    }, [addToast]),

    warning: useCallback((title: string, message?: string) => {
      addToast({ type: 'warning', title, message })
    }, [addToast]),

    info: useCallback((title: string, message?: string) => {
      addToast({ type: 'info', title, message })
    }, [addToast])
  }
}