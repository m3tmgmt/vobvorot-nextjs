// Автоматический калькулятор доставки Meest ПОШТА
// Основан на международных тарифах: https://meestposhta.com.ua/international-tariffs

export interface ShippingZone {
  name: string
  code?: string
  countries?: string[]
  deliveryTime: string
  maxWeight: number
  maxDimensions: {
    length: number
    width: number
    height: number
  }
}

export interface ShippingCalculation {
  baseCost: number
  packagingCost: number
  totalCost: number
  billableWeight: number
  deliveryTime: string
  currency: string
  zone: string
  packageType: string
}

export interface PackageDimensions {
  length: number
  width: number
  height: number
}

// Зоны доставки Meest
export const SHIPPING_ZONES: Record<string, ShippingZone> = {
  usa: {
    name: "США",
    code: "US",
    deliveryTime: "10-17 дней",
    maxWeight: 65,
    maxDimensions: { length: 120, width: 60, height: 60 }
  },
  canada: {
    name: "Канада",
    code: "CA", 
    deliveryTime: "10-17 дней",
    maxWeight: 65,
    maxDimensions: { length: 120, width: 60, height: 60 }
  },
  poland: {
    name: "Польша",
    code: "PL",
    deliveryTime: "5-10 дней", 
    maxWeight: 30,
    maxDimensions: { length: 100, width: 50, height: 50 }
  },
  germany: {
    name: "Германия",
    code: "DE",
    deliveryTime: "7-14 дней",
    maxWeight: 30,
    maxDimensions: { length: 100, width: 50, height: 50 }
  },
  czech: {
    name: "Чехия", 
    code: "CZ",
    deliveryTime: "7-14 дней",
    maxWeight: 30,
    maxDimensions: { length: 100, width: 50, height: 50 }
  },
  europe: {
    name: "Европа (23 страны)",
    countries: ["AT", "BE", "BG", "HR", "DK", "EE", "FI", "FR", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "NL", "PT", "RO", "SK", "SI", "ES", "SE", "NO"],
    deliveryTime: "7-14 дней",
    maxWeight: 30,
    maxDimensions: { length: 100, width: 50, height: 50 }
  },
  uk: {
    name: "Великобритания",
    code: "GB",
    deliveryTime: "10-17 дней", 
    maxWeight: 30,
    maxDimensions: { length: 100, width: 50, height: 50 }
  },
  moldova: {
    name: "Молдова",
    code: "MD",
    deliveryTime: "3-7 дней",
    maxWeight: 30,
    maxDimensions: { length: 100, width: 50, height: 50 }
  },
  israel: {
    name: "Израиль",
    code: "IL", 
    deliveryTime: "10-17 дней",
    maxWeight: 30,
    maxDimensions: { length: 100, width: 50, height: 50 }
  },
  georgia: {
    name: "Грузия",
    code: "GE",
    deliveryTime: "5-10 дней",
    maxWeight: 30,
    maxDimensions: { length: 100, width: 50, height: 50 }
  },
  ukraine: {
    name: "Украина",
    code: "UA",
    deliveryTime: "1-3 дня",
    maxWeight: 30,
    maxDimensions: { length: 100, width: 50, height: 50 }
  },
  asia_africa_other: {
    name: "Азия, Африка, Америка, Австралия",
    countries: ["AU", "NZ", "JP", "KR", "CN", "IN", "SG", "MY", "TH", "VN", "PH", "ID", "AE", "SA", "EG", "ZA", "BR", "AR", "CL", "CO", "PE", "MX"],
    deliveryTime: "14-21 день",
    maxWeight: 30,
    maxDimensions: { length: 100, width: 50, height: 50 }
  }
}

// Тарифы доставки Meest (в гривнах)
export const SHIPPING_TARIFFS: Record<string, Record<string, Record<string, number>>> = {
  box: {
    usa: {
      "0.5": 450, "1.0": 580, "2.0": 720, "3.0": 860, "5.0": 1100,
      "10.0": 1800, "20.0": 3200, "30.0": 4500, "65.0": 8500
    },
    canada: {
      "0.5": 420, "1.0": 550, "2.0": 690, "3.0": 830, "5.0": 1050,
      "10.0": 1750, "20.0": 3100, "30.0": 4300, "65.0": 8200
    },
    poland: {
      "0.5": 180, "1.0": 240, "2.0": 320, "3.0": 400, "5.0": 550,
      "10.0": 950, "20.0": 1750, "30.0": 2500
    },
    germany: {
      "0.5": 200, "1.0": 260, "2.0": 340, "3.0": 420, "5.0": 580,
      "10.0": 1000, "20.0": 1850, "30.0": 2700
    },
    czech: {
      "0.5": 190, "1.0": 250, "2.0": 330, "3.0": 410, "5.0": 570,
      "10.0": 980, "20.0": 1800, "30.0": 2600
    },
    europe: {
      "0.5": 250, "1.0": 320, "2.0": 420, "3.0": 520, "5.0": 720,
      "10.0": 1200, "20.0": 2200, "30.0": 3200
    },
    uk: {
      "0.5": 280, "1.0": 360, "2.0": 460, "3.0": 560, "5.0": 780,
      "10.0": 1300, "20.0": 2400, "30.0": 3500
    },
    moldova: {
      "0.5": 120, "1.0": 150, "2.0": 200, "3.0": 250, "5.0": 350,
      "10.0": 600, "20.0": 1100, "30.0": 1600
    },
    israel: {
      "0.5": 300, "1.0": 380, "2.0": 480, "3.0": 580, "5.0": 800,
      "10.0": 1350, "20.0": 2500, "30.0": 3600
    },
    georgia: {
      "0.5": 160, "1.0": 210, "2.0": 280, "3.0": 350, "5.0": 480,
      "10.0": 820, "20.0": 1500, "30.0": 2200
    },
    ukraine: {
      "0.5": 80, "1.0": 100, "2.0": 130, "3.0": 160, "5.0": 220,
      "10.0": 380, "20.0": 700, "30.0": 1000
    },
    asia_africa_other: {
      "0.5": 350, "1.0": 450, "2.0": 570, "3.0": 690, "5.0": 950,
      "10.0": 1600, "20.0": 2900, "30.0": 4200
    }
  },
  package: {
    usa: {
      "0.5": 380, "1.0": 490, "2.0": 610, "3.0": 730, "5.0": 930,
      "10.0": 1520
    },
    canada: {
      "0.5": 350, "1.0": 470, "2.0": 580, "3.0": 700, "5.0": 890,
      "10.0": 1480
    },
    poland: {
      "0.5": 150, "1.0": 200, "2.0": 270, "3.0": 340, "5.0": 470,
      "10.0": 800
    },
    germany: {
      "0.5": 170, "1.0": 220, "2.0": 290, "3.0": 360, "5.0": 490,
      "10.0": 850
    },
    europe: {
      "0.5": 210, "1.0": 270, "2.0": 350, "3.0": 440, "5.0": 610,
      "10.0": 1020
    },
    ukraine: {
      "0.5": 60, "1.0": 80, "2.0": 100, "3.0": 130, "5.0": 180,
      "10.0": 320
    }
  }
}

// Стоимость упаковки
export const PACKAGING_FEES: Record<string, Record<string, number>> = {
  usa: { box: 25, package: 15 },
  canada: { box: 25, package: 15 },
  poland: { box: 15, package: 8 },
  germany: { box: 20, package: 10 },
  czech: { box: 20, package: 10 },
  europe: { box: 20, package: 10 },
  uk: { box: 20, package: 10 },
  moldova: { box: 10, package: 5 },
  israel: { box: 25, package: 15 },
  georgia: { box: 15, package: 8 },
  ukraine: { box: 15, package: 8 },
  asia_africa_other: { box: 30, package: 20 }
}

// Весовые категории
export const WEIGHT_CATEGORIES = {
  "0.5": { min: 0, max: 0.5 },
  "1.0": { min: 0.5, max: 1.0 },
  "2.0": { min: 1.0, max: 2.0 },
  "3.0": { min: 2.0, max: 3.0 },
  "5.0": { min: 3.0, max: 5.0 },
  "10.0": { min: 5.0, max: 10.0 },
  "20.0": { min: 10.0, max: 20.0 },
  "30.0": { min: 20.0, max: 30.0 },
  "65.0": { min: 30.0, max: 65.0 }
}

/**
 * Рассчитать объемный вес посылки
 * Формула: L × W × H (см) ÷ 5000
 */
export function calculateVolumetricWeight(length: number, width: number, height: number): number {
  return (length * width * height) / 5000
}

/**
 * Получить тарифицируемый вес (максимальный из фактического и объемного)
 */
export function getBillableWeight(actualWeight: number, dimensions?: PackageDimensions): number {
  if (!dimensions) {
    return actualWeight
  }
  
  const volumetricWeight = calculateVolumetricWeight(dimensions.length, dimensions.width, dimensions.height)
  return Math.max(actualWeight, volumetricWeight)
}

/**
 * Определить весовую категорию для тарификации
 */
export function getWeightCategory(weight: number): string {
  for (const [category, range] of Object.entries(WEIGHT_CATEGORIES)) {
    if (weight > range.min && weight <= range.max) {
      return category
    }
  }
  return "65.0" // Максимальная категория
}

/**
 * Определить зону доставки по коду страны
 */
export function getShippingZone(countryCode: string): string {
  const code = countryCode.toUpperCase()
  
  // Приоритетные отдельные зоны
  if (code === "US") return "usa"
  if (code === "CA") return "canada"
  if (code === "PL") return "poland"
  if (code === "DE") return "germany"
  if (code === "CZ") return "czech"
  if (code === "GB") return "uk"
  if (code === "MD") return "moldova"
  if (code === "IL") return "israel"
  if (code === "GE") return "georgia"
  if (code === "UA") return "ukraine"
  
  // Проверка групповых зон
  if (SHIPPING_ZONES.europe.countries?.includes(code)) {
    return "europe"
  }
  
  if (SHIPPING_ZONES.asia_africa_other.countries?.includes(code)) {
    return "asia_africa_other"
  }
  
  // По умолчанию - Европа (самая распространенная зона)
  return "europe"
}

/**
 * Рассчитать стоимость доставки
 */
export function calculateShipping(
  countryCode: string,
  packageType: 'box' | 'package',
  actualWeight: number,
  dimensions?: PackageDimensions,
  currency: 'UAH' | 'USD' = 'UAH'
): ShippingCalculation {
  const zone = getShippingZone(countryCode)
  const billableWeight = getBillableWeight(actualWeight, dimensions)
  const weightCategory = getWeightCategory(billableWeight)
  
  // Получить базовую стоимость доставки
  const baseCost = SHIPPING_TARIFFS[packageType]?.[zone]?.[weightCategory] || 0
  
  // Добавить стоимость упаковки
  const packagingCost = PACKAGING_FEES[zone]?.[packageType] || PACKAGING_FEES['europe']?.[packageType] || 20
  
  // Общая стоимость
  let totalCost = baseCost + packagingCost
  
  // Конвертация в USD если нужно (примерный курс 1 USD = 40 UAH)
  if (currency === 'USD') {
    totalCost = Math.round(totalCost / 40 * 100) / 100
  }
  
  return {
    baseCost,
    packagingCost,
    totalCost,
    billableWeight,
    deliveryTime: SHIPPING_ZONES[zone].deliveryTime,
    currency,
    zone,
    packageType
  }
}

/**
 * Проверить возможность доставки в страну
 */
export function canShipToCountry(countryCode: string, weight: number): {
  canShip: boolean
  reason?: string
  maxWeight?: number
} {
  const zone = getShippingZone(countryCode)
  const zoneInfo = SHIPPING_ZONES[zone]
  
  if (weight > zoneInfo.maxWeight) {
    return {
      canShip: false,
      reason: `Превышен максимальный вес для доставки в ${zoneInfo.name}`,
      maxWeight: zoneInfo.maxWeight
    }
  }
  
  return { canShip: true }
}

/**
 * Получить список доступных стран для доставки
 */
export function getAvailableCountries(): Array<{code: string, name: string, zone: string}> {
  const countries: Array<{code: string, name: string, zone: string}> = []
  
  // Добавить отдельные страны
  Object.entries(SHIPPING_ZONES).forEach(([zoneKey, zone]) => {
    if (zone.code) {
      countries.push({
        code: zone.code,
        name: zone.name,
        zone: zoneKey
      })
    }
  })
  
  // Добавить страны из групповых зон
  if (SHIPPING_ZONES.europe.countries) {
    SHIPPING_ZONES.europe.countries.forEach(code => {
      if (!countries.find(c => c.code === code)) {
        countries.push({
          code,
          name: getCountryName(code),
          zone: 'europe'
        })
      }
    })
  }
  
  if (SHIPPING_ZONES.asia_africa_other.countries) {
    SHIPPING_ZONES.asia_africa_other.countries.forEach(code => {
      if (!countries.find(c => c.code === code)) {
        countries.push({
          code,
          name: getCountryName(code),
          zone: 'asia_africa_other'
        })
      }
    })
  }
  
  return countries.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Получить название страны по коду (упрощенная версия)
 */
function getCountryName(code: string): string {
  const names: Record<string, string> = {
    'AT': 'Австрия', 'BE': 'Бельгия', 'BG': 'Болгария', 'HR': 'Хорватия',
    'DK': 'Дания', 'EE': 'Эстония', 'FI': 'Финляндия', 'FR': 'Франция',
    'GR': 'Греция', 'HU': 'Венгрия', 'IE': 'Ирландия', 'IT': 'Италия',
    'LV': 'Латвия', 'LT': 'Литва', 'LU': 'Люксембург', 'NL': 'Нидерланды',
    'PT': 'Португалия', 'RO': 'Румыния', 'SK': 'Словакия', 'SI': 'Словения',
    'ES': 'Испания', 'SE': 'Швеция', 'NO': 'Норвегия',
    'AU': 'Австралия', 'NZ': 'Новая Зеландия', 'JP': 'Япония', 'KR': 'Южная Корея',
    'CN': 'Китай', 'IN': 'Индия', 'SG': 'Сингапур', 'MY': 'Малайзия',
    'TH': 'Таиланд', 'VN': 'Вьетнам', 'PH': 'Филиппины', 'ID': 'Индонезия',
    'AE': 'ОАЭ', 'SA': 'Саудовская Аравия', 'EG': 'Египет', 'ZA': 'ЮАР',
    'BR': 'Бразилия', 'AR': 'Аргентина', 'CL': 'Чили', 'CO': 'Колумбия',
    'PE': 'Перу', 'MX': 'Мексика'
  }
  
  return names[code] || code
}