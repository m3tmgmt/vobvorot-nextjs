/**
 * Phone number validation and normalization utilities
 */

export interface PhoneValidationResult {
  isValid: boolean
  normalized: string
  error?: string
}

/**
 * Normalize phone number by removing non-digit characters and ensuring proper + prefix
 * @param phone Raw phone number input
 * @returns Normalized phone number or original if invalid
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return ''
  }

  // Remove all non-digit characters except +
  let normalized = phone.replace(/[^\d\+]/g, '')
  
  // If it starts with digits and doesn't have +, add it
  if (normalized.match(/^\d/) && !normalized.startsWith('+')) {
    // Check if it looks like a US number (starts with 1 and has 11 digits)
    if (normalized.startsWith('1') && normalized.length === 11) {
      normalized = '+' + normalized
    } else if (normalized.length >= 10) {
      // For other numbers, assume they need country code
      normalized = '+' + normalized
    }
  }

  // Remove duplicate + signs
  normalized = normalized.replace(/\+{2,}/g, '+')
  
  return normalized
}

/**
 * Validate phone number format
 * @param phone Phone number to validate
 * @returns Validation result with normalized number
 */
export function validatePhoneNumber(phone: string): PhoneValidationResult {
  if (!phone || typeof phone !== 'string') {
    return {
      isValid: false,
      normalized: '',
      error: 'Phone number is required'
    }
  }

  const normalized = normalizePhoneNumber(phone)
  
  // Basic validation: should start with + and have at least 10 digits total
  const digitCount = (normalized.match(/\d/g) || []).length
  
  if (!normalized.startsWith('+')) {
    return {
      isValid: false,
      normalized,
      error: 'Phone number should start with country code (e.g., +1 for US)'
    }
  }
  
  if (digitCount < 10) {
    return {
      isValid: false,
      normalized,
      error: 'Phone number should have at least 10 digits'
    }
  }
  
  if (digitCount > 15) {
    return {
      isValid: false,
      normalized,
      error: 'Phone number should not exceed 15 digits'
    }
  }

  return {
    isValid: true,
    normalized
  }
}

/**
 * Format phone number for display (add spaces/dashes)
 * @param phone Normalized phone number
 * @returns Formatted phone number for display
 */
export function formatPhoneForDisplay(phone: string): string {
  if (!phone) return ''
  
  const normalized = normalizePhoneNumber(phone)
  
  // US/Canada format: +1 (123) 456-7890
  if (normalized.startsWith('+1') && normalized.length === 12) {
    const digits = normalized.substring(2)
    return `+1 (${digits.substring(0, 3)}) ${digits.substring(3, 6)}-${digits.substring(6)}`
  }
  
  // International format: +44 20 1234 5678 (example)
  if (normalized.startsWith('+') && normalized.length > 8) {
    const countryAndNumber = normalized.substring(1)
    // Simple formatting: add space after country code (first 1-3 digits)
    if (countryAndNumber.length <= 3) {
      return normalized
    }
    
    // Try to detect country code length and format accordingly
    const countryCode = countryAndNumber.substring(0, 2)
    const number = countryAndNumber.substring(2)
    
    // Add spaces every 3-4 digits for better readability
    let formatted = '+' + countryCode + ' '
    for (let i = 0; i < number.length; i += 3) {
      formatted += number.substring(i, i + 3)
      if (i + 3 < number.length) {
        formatted += ' '
      }
    }
    
    return formatted
  }
  
  return normalized
}

/**
 * Get country code from phone number
 * @param phone Normalized phone number
 * @returns Country code or null if not detected
 */
export function getCountryCodeFromPhone(phone: string): string | null {
  if (!phone || !phone.startsWith('+')) {
    return null
  }
  
  const digits = phone.substring(1)
  
  // Common country codes
  if (digits.startsWith('1')) return 'US' // US/Canada
  if (digits.startsWith('44')) return 'GB' // UK
  if (digits.startsWith('49')) return 'DE' // Germany
  if (digits.startsWith('33')) return 'FR' // France
  if (digits.startsWith('39')) return 'IT' // Italy
  if (digits.startsWith('34')) return 'ES' // Spain
  if (digits.startsWith('380')) return 'UA' // Ukraine
  if (digits.startsWith('7')) return 'RU' // Russia
  if (digits.startsWith('86')) return 'CN' // China
  if (digits.startsWith('91')) return 'IN' // India
  
  return null
}