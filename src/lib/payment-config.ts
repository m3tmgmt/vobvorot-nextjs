// Payment Gateway Configuration Management
// This module handles environment-specific configurations for payment processing

export interface PaymentEnvironmentConfig {
  name: 'development' | 'staging' | 'production'
  westernbid: {
    enabled: boolean
    apiUrl: string
    merchantId: string
    secretKey: string
    webhookSecret: string
    environment: 'sandbox' | 'production'
    timeout: number
    retryAttempts: number
    enableLogging: boolean
    enableMockMode: boolean
    mockSuccessRate: number // Percentage (0-100) for mock payments
  }
  security: {
    enableSignatureVerification: boolean
    enableRateLimiting: boolean
    enableIpWhitelisting: boolean
    allowedIPs: string[]
    webhookSecretRequired: boolean
  }
  features: {
    enableRefunds: boolean
    enablePartialRefunds: boolean
    enableWebhooks: boolean
    enableStatusTracking: boolean
    enablePaymentRetries: boolean
    maxRefundDays: number
  }
  logging: {
    enableFileLogging: boolean
    enableConsoleLogging: boolean
    logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
    enableSensitiveDataMasking: boolean
    logDirectory: string
  }
  notifications: {
    enableTelegram: boolean
    enableEmail: boolean
    enableSlack: boolean
    notifyOnSuccess: boolean
    notifyOnFailure: boolean
    notifyOnRefund: boolean
  }
}

// Default configurations for different environments
const developmentConfig: PaymentEnvironmentConfig = {
  name: 'development',
  westernbid: {
    enabled: true,
    apiUrl: 'https://sandbox-api.westernbid.com',
    merchantId: process.env.WESTERNBID_MERCHANT_ID || 'dev_merchant_123',
    secretKey: process.env.WESTERNBID_SECRET_KEY || 'dev_secret_key',
    webhookSecret: process.env.WESTERNBID_WEBHOOK_SECRET || 'dev_webhook_secret',
    environment: 'sandbox',
    timeout: 30000,
    retryAttempts: 3,
    enableLogging: true,
    enableMockMode: true,
    mockSuccessRate: 80
  },
  security: {
    enableSignatureVerification: false, // Relaxed for development
    enableRateLimiting: false,
    enableIpWhitelisting: false,
    allowedIPs: [],
    webhookSecretRequired: false
  },
  features: {
    enableRefunds: true,
    enablePartialRefunds: true,
    enableWebhooks: true,
    enableStatusTracking: true,
    enablePaymentRetries: true,
    maxRefundDays: 365 // Generous for testing
  },
  logging: {
    enableFileLogging: false,
    enableConsoleLogging: true,
    logLevel: 'DEBUG',
    enableSensitiveDataMasking: false, // Show full data in dev
    logDirectory: './logs/payments'
  },
  notifications: {
    enableTelegram: true,
    enableEmail: false, // Avoid spam in dev
    enableSlack: false,
    notifyOnSuccess: false,
    notifyOnFailure: true,
    notifyOnRefund: true
  }
}

const stagingConfig: PaymentEnvironmentConfig = {
  name: 'staging',
  westernbid: {
    enabled: true,
    apiUrl: 'https://staging-api.westernbid.com',
    merchantId: process.env.WESTERNBID_MERCHANT_ID || '',
    secretKey: process.env.WESTERNBID_SECRET_KEY || '',
    webhookSecret: process.env.WESTERNBID_WEBHOOK_SECRET || '',
    environment: 'sandbox',
    timeout: 30000,
    retryAttempts: 3,
    enableLogging: true,
    enableMockMode: false, // Use real API in staging
    mockSuccessRate: 0
  },
  security: {
    enableSignatureVerification: true,
    enableRateLimiting: true,
    enableIpWhitelisting: false,
    allowedIPs: [],
    webhookSecretRequired: true
  },
  features: {
    enableRefunds: true,
    enablePartialRefunds: true,
    enableWebhooks: true,
    enableStatusTracking: true,
    enablePaymentRetries: true,
    maxRefundDays: 30
  },
  logging: {
    enableFileLogging: true,
    enableConsoleLogging: true,
    logLevel: 'INFO',
    enableSensitiveDataMasking: true,
    logDirectory: './logs/payments'
  },
  notifications: {
    enableTelegram: true,
    enableEmail: true,
    enableSlack: false,
    notifyOnSuccess: false,
    notifyOnFailure: true,
    notifyOnRefund: true
  }
}

const productionConfig: PaymentEnvironmentConfig = {
  name: 'production',
  westernbid: {
    enabled: true,
    apiUrl: process.env.WESTERNBID_API_URL || 'https://api.westernbid.com',
    merchantId: process.env.WESTERNBID_MERCHANT_ID || '',
    secretKey: process.env.WESTERNBID_SECRET_KEY || '',
    webhookSecret: process.env.WESTERNBID_WEBHOOK_SECRET || '',
    environment: 'production',
    timeout: 45000, // Longer timeout for production
    retryAttempts: 5, // More retries for production
    enableLogging: true,
    enableMockMode: false,
    mockSuccessRate: 0
  },
  security: {
    enableSignatureVerification: true,
    enableRateLimiting: true,
    enableIpWhitelisting: true,
    allowedIPs: [
      // WesternBid webhook IPs (example - replace with actual IPs)
      '52.89.214.238',
      '52.89.214.239',
      '52.89.214.240'
    ],
    webhookSecretRequired: true
  },
  features: {
    enableRefunds: true,
    enablePartialRefunds: true,
    enableWebhooks: true,
    enableStatusTracking: true,
    enablePaymentRetries: false, // Disable auto-retries in production
    maxRefundDays: 14 // Strict refund policy
  },
  logging: {
    enableFileLogging: true,
    enableConsoleLogging: false, // Reduce console noise in production
    logLevel: 'WARN',
    enableSensitiveDataMasking: true,
    logDirectory: '/var/log/payments'
  },
  notifications: {
    enableTelegram: true,
    enableEmail: true,
    enableSlack: true,
    notifyOnSuccess: false, // Too noisy in production
    notifyOnFailure: true,
    notifyOnRefund: true
  }
}

// Configuration selector
export class PaymentConfigManager {
  private static instance: PaymentConfigManager
  private config: PaymentEnvironmentConfig

  private constructor() {
    this.config = this.loadConfig()
  }

  public static getInstance(): PaymentConfigManager {
    if (!PaymentConfigManager.instance) {
      PaymentConfigManager.instance = new PaymentConfigManager()
    }
    return PaymentConfigManager.instance
  }

  private loadConfig(): PaymentEnvironmentConfig {
    const environment = process.env.NODE_ENV || 'development'
    const paymentEnv = process.env.PAYMENT_ENVIRONMENT || environment

    switch (paymentEnv) {
      case 'staging':
        return { ...stagingConfig, ...this.loadEnvironmentOverrides() }
      case 'production':
        return { ...productionConfig, ...this.loadEnvironmentOverrides() }
      default:
        return { ...developmentConfig, ...this.loadEnvironmentOverrides() }
    }
  }

  private loadEnvironmentOverrides(): Partial<PaymentEnvironmentConfig> {
    const overrides: any = {}

    // WesternBid overrides
    if (process.env.WESTERNBID_ENABLED) {
      overrides.westernbid = {
        ...overrides.westernbid,
        enabled: process.env.WESTERNBID_ENABLED === 'true'
      }
    }

    if (process.env.WESTERNBID_TIMEOUT) {
      overrides.westernbid = {
        ...overrides.westernbid,
        timeout: parseInt(process.env.WESTERNBID_TIMEOUT)
      }
    }

    if (process.env.WESTERNBID_RETRY_ATTEMPTS) {
      overrides.westernbid = {
        ...overrides.westernbid,
        retryAttempts: parseInt(process.env.WESTERNBID_RETRY_ATTEMPTS)
      }
    }

    if (process.env.WESTERNBID_MOCK_MODE) {
      overrides.westernbid = {
        ...overrides.westernbid,
        enableMockMode: process.env.WESTERNBID_MOCK_MODE === 'true'
      }
    }

    if (process.env.WESTERNBID_MOCK_SUCCESS_RATE) {
      overrides.westernbid = {
        ...overrides.westernbid,
        mockSuccessRate: parseInt(process.env.WESTERNBID_MOCK_SUCCESS_RATE)
      }
    }

    // Security overrides
    if (process.env.PAYMENT_SIGNATURE_VERIFICATION) {
      overrides.security = {
        ...overrides.security,
        enableSignatureVerification: process.env.PAYMENT_SIGNATURE_VERIFICATION === 'true'
      }
    }

    if (process.env.PAYMENT_RATE_LIMITING) {
      overrides.security = {
        ...overrides.security,
        enableRateLimiting: process.env.PAYMENT_RATE_LIMITING === 'true'
      }
    }

    if (process.env.PAYMENT_ALLOWED_IPS) {
      overrides.security = {
        ...overrides.security,
        allowedIPs: process.env.PAYMENT_ALLOWED_IPS.split(',').map(ip => ip.trim())
      }
    }

    // Feature overrides
    if (process.env.PAYMENT_ENABLE_REFUNDS) {
      overrides.features = {
        ...overrides.features,
        enableRefunds: process.env.PAYMENT_ENABLE_REFUNDS === 'true'
      }
    }

    if (process.env.PAYMENT_MAX_REFUND_DAYS) {
      overrides.features = {
        ...overrides.features,
        maxRefundDays: parseInt(process.env.PAYMENT_MAX_REFUND_DAYS)
      }
    }

    // Logging overrides
    if (process.env.PAYMENT_LOG_LEVEL) {
      overrides.logging = {
        ...overrides.logging,
        logLevel: process.env.PAYMENT_LOG_LEVEL as any
      }
    }

    if (process.env.PAYMENT_LOG_FILE) {
      overrides.logging = {
        ...overrides.logging,
        enableFileLogging: process.env.PAYMENT_LOG_FILE === 'true'
      }
    }

    if (process.env.PAYMENT_LOG_CONSOLE) {
      overrides.logging = {
        ...overrides.logging,
        enableConsoleLogging: process.env.PAYMENT_LOG_CONSOLE === 'true'
      }
    }

    if (process.env.PAYMENT_LOG_DIR) {
      overrides.logging = {
        ...overrides.logging,
        logDirectory: process.env.PAYMENT_LOG_DIR
      }
    }

    // Notification overrides
    if (process.env.PAYMENT_NOTIFY_TELEGRAM) {
      overrides.notifications = {
        ...overrides.notifications,
        enableTelegram: process.env.PAYMENT_NOTIFY_TELEGRAM === 'true'
      }
    }

    if (process.env.PAYMENT_NOTIFY_EMAIL) {
      overrides.notifications = {
        ...overrides.notifications,
        enableEmail: process.env.PAYMENT_NOTIFY_EMAIL === 'true'
      }
    }

    return overrides
  }

  public getConfig(): PaymentEnvironmentConfig {
    return this.config
  }

  public getWesternBidConfig() {
    return this.config.westernbid
  }

  public getSecurityConfig() {
    return this.config.security
  }

  public getFeatureConfig() {
    return this.config.features
  }

  public getLoggingConfig() {
    return this.config.logging
  }

  public getNotificationConfig() {
    return this.config.notifications
  }

  public isFeatureEnabled(feature: keyof PaymentEnvironmentConfig['features']): boolean {
    return this.config.features[feature] as boolean
  }

  public isSecurityEnabled(security: keyof PaymentEnvironmentConfig['security']): boolean {
    return this.config.security[security] as boolean
  }

  public getEnvironmentName(): string {
    return this.config.name
  }

  public isDevelopment(): boolean {
    return this.config.name === 'development'
  }

  public isProduction(): boolean {
    return this.config.name === 'production'
  }

  public isStaging(): boolean {
    return this.config.name === 'staging'
  }

  // Method to validate configuration
  public validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validate WesternBid configuration
    if (this.config.westernbid.enabled) {
      if (!this.config.westernbid.merchantId) {
        errors.push('WesternBid merchant ID is required when enabled')
      }
      if (!this.config.westernbid.secretKey) {
        errors.push('WesternBid secret key is required when enabled')
      }
      if (this.isProduction() && !this.config.westernbid.webhookSecret) {
        errors.push('WesternBid webhook secret is required in production')
      }
    }

    // Validate security configuration
    if (this.isProduction()) {
      if (!this.config.security.enableSignatureVerification) {
        errors.push('Signature verification should be enabled in production')
      }
      if (!this.config.security.webhookSecretRequired) {
        errors.push('Webhook secret should be required in production')
      }
    }

    // Validate logging configuration
    if (this.config.logging.enableFileLogging && !this.config.logging.logDirectory) {
      errors.push('Log directory is required when file logging is enabled')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Hot reload configuration (useful for development)
  public reloadConfig(): void {
    this.config = this.loadConfig()
  }

  // Export configuration for debugging
  public exportConfig(): Record<string, any> {
    const exported = { ...this.config }
    
    // Mask sensitive data
    if (exported.westernbid.secretKey) {
      exported.westernbid.secretKey = '***' + exported.westernbid.secretKey.slice(-4)
    }
    if (exported.westernbid.webhookSecret) {
      exported.westernbid.webhookSecret = '***' + exported.westernbid.webhookSecret.slice(-4)
    }

    return exported
  }
}

// Export singleton instance
export const paymentConfig = PaymentConfigManager.getInstance()

// Export helper functions
export const getPaymentConfig = () => paymentConfig.getConfig()
export const getWesternBidConfig = () => paymentConfig.getWesternBidConfig()
export const isFeatureEnabled = (feature: keyof PaymentEnvironmentConfig['features']) => 
  paymentConfig.isFeatureEnabled(feature)
export const isSecurityEnabled = (security: keyof PaymentEnvironmentConfig['security']) => 
  paymentConfig.isSecurityEnabled(security)

// Environment helpers
export const isDevelopment = () => paymentConfig.isDevelopment()
export const isProduction = () => paymentConfig.isProduction()
export const isStaging = () => paymentConfig.isStaging()

// Configuration validation
export const validatePaymentConfig = () => paymentConfig.validateConfig()