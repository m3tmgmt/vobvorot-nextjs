#!/bin/bash

# Создаем новый проект Supabase для Vobvorot
echo "🚀 Создаем новый Supabase проект..."

# Сначала получаем organization ID
ORG_RESPONSE=$(curl -s -X GET https://api.supabase.com/v1/organizations \
  -H "Authorization: Bearer sbp_fe3b7e9d4fd6d017a4441baba0544baab2e44a0d")

echo "Organizations: $ORG_RESPONSE"

# Создаем проект
PROJECT_RESPONSE=$(curl -X POST https://api.supabase.com/v1/projects \
  -H "Authorization: Bearer sbp_fe3b7e9d4fd6d017a4441baba0544baab2e44a0d" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "vobvorot-store",
    "region": "ap-southeast-1",
    "plan": "free",
    "db_pass": "VobvorotDB2025Secure"
  }')

echo -e "\n\nProject response: $PROJECT_RESPONSE"

# Если успешно, сохраняем данные
if [[ $PROJECT_RESPONSE == *"id"* ]]; then
  echo -e "\n✅ Проект создан успешно!"
  echo "$PROJECT_RESPONSE" > supabase-project-info.json
  echo -e "\nДанные сохранены в supabase-project-info.json"
else
  echo -e "\n❌ Ошибка создания проекта"
fi