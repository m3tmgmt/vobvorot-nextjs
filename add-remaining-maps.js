// Скрипт для добавления оставшихся @map директив
const fs = require('fs');

// Читаем файл
let schema = fs.readFileSync('./prisma/schema.prisma', 'utf8');

// Функция для преобразования camelCase в snake_case
function toSnakeCase(str) {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
}

// Список полей для добавления @map
const fieldsToMap = [
  // Payment
  { pattern: /  createdAt    DateTime      @default\(now\(\)\)\n/, replacement: '  createdAt    DateTime      @default(now()) @map("created_at")\n', model: 'Payment' },
  { pattern: /  updatedAt    DateTime      @updatedAt\n/, replacement: '  updatedAt    DateTime      @updatedAt @map("updated_at")\n', model: 'Payment' },
  
  // OrderLog
  { pattern: /model OrderLog {\n  id        String   @id @default\(cuid\(\)\)\n  orderId   String\n/, replacement: 'model OrderLog {\n  id        String   @id @default(cuid())\n  orderId   String   @map("order_id")\n' },
  { pattern: /  userId    String\?\n  createdAt DateTime @default\(now\(\)\)\n/, replacement: '  userId    String?  @map("user_id")\n  createdAt DateTime @default(now()) @map("created_at")\n' },
  
  // SignOrder
  { pattern: /model SignOrder {\n  id          String    @id @default\(cuid\(\)\)\n  orderId     String    @unique\n/, replacement: 'model SignOrder {\n  id          String    @id @default(cuid())\n  orderId     String    @unique @map("order_id")\n' },
  { pattern: /  signName    String\n/, replacement: '  signName    String    @map("sign_name")\n' },
  { pattern: /  extraNotes  String\?\n/, replacement: '  extraNotes  String?   @map("extra_notes")\n' },
  { pattern: /  photoUrl    String\?\n/, replacement: '  photoUrl    String?   @map("photo_url")\n' },
  { pattern: /  deliveredAt DateTime\?\n/, replacement: '  deliveredAt DateTime? @map("delivered_at")\n' },
  
  // Review
  { pattern: /  userId    String\n  productId String\n/, replacement: '  userId    String     @map("user_id")\n  productId String     @map("product_id")\n' },
  
  // WishlistItem
  { pattern: /  userId    String\n  productId String\n  createdAt/, replacement: '  userId    String     @map("user_id")\n  productId String     @map("product_id")\n  createdAt' },
  
  // UserAddress
  { pattern: /  userId       String\n/, replacement: '  userId       String         @map("user_id")\n' },
  { pattern: /  firstName    String\?\n/, replacement: '  firstName    String?        @map("first_name")\n' },
  { pattern: /  lastName     String\?\n/, replacement: '  lastName     String?        @map("last_name")\n' },
  { pattern: /  zipCode      String\n/, replacement: '  zipCode      String         @map("zip_code")\n' },
  { pattern: /  isDefault    Boolean        @default\(false\)\n/, replacement: '  isDefault    Boolean        @default(false) @map("is_default")\n' },
  
  // FutureLetter
  { pattern: /  userId           String\?\n  senderEmail      String\n/, replacement: '  userId           String?        @map("user_id")\n  senderEmail      String         @map("sender_email")\n' },
  { pattern: /  senderName       String\n/, replacement: '  senderName       String         @map("sender_name")\n' },
  { pattern: /  recipientEmail   String\n/, replacement: '  recipientEmail   String         @map("recipient_email")\n' },
  { pattern: /  deliveryDate     DateTime\n/, replacement: '  deliveryDate     DateTime       @map("delivery_date")\n' },
  { pattern: /  deliveredAt      DateTime\?\n/, replacement: '  deliveredAt      DateTime?      @map("delivered_at")\n' },
  { pattern: /  failureReason    String\?\n/, replacement: '  failureReason    String?        @map("failure_reason")\n' },
  { pattern: /  isAnonymous      Boolean        @default\(false\)\n/, replacement: '  isAnonymous      Boolean        @default(false) @map("is_anonymous")\n' },
];

// Применяем замены
let updatedSchema = schema;
let changesCount = 0;

fieldsToMap.forEach(({ pattern, replacement }) => {
  if (updatedSchema.match(pattern)) {
    updatedSchema = updatedSchema.replace(pattern, replacement);
    changesCount++;
  }
});

// Добавляем @map для всех createdAt и updatedAt которые еще не имеют @map
updatedSchema = updatedSchema.replace(/  createdAt\s+DateTime\s+@default\(now\(\)\)(?!\s+@map)/g, '  createdAt DateTime @default(now()) @map("created_at")');
updatedSchema = updatedSchema.replace(/  updatedAt\s+DateTime\s+@updatedAt(?!\s+@map)/g, '  updatedAt DateTime @updatedAt @map("updated_at")');

// Записываем обратно
fs.writeFileSync('./prisma/schema.prisma', updatedSchema);

console.log(`✅ Добавлено ${changesCount} @map директив`);
console.log('✅ Все поля createdAt и updatedAt обновлены');