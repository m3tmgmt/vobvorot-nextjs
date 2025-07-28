#!/usr/bin/env node

/**
 * MCP Server для Resend API
 * Позволяет автоматизировать настройку домена и получение API ключей
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');

class ResendMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'resend-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {}
        }
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // Инструмент для проверки статуса домена
    this.server.setRequestHandler('tools/list', async () => {
      return {
        tools: [
          {
            name: 'resend_check_domain',
            description: 'Проверить статус верификации домена в Resend',
            inputSchema: {
              type: 'object',
              properties: {
                domain: {
                  type: 'string',
                  description: 'Домен для проверки (например, vobvorot.com)'
                },
                api_key: {
                  type: 'string',
                  description: 'API ключ Resend (если уже есть)'
                }
              },
              required: ['domain']
            }
          },
          {
            name: 'resend_add_domain',
            description: 'Добавить домен в Resend для верификации',
            inputSchema: {
              type: 'object',
              properties: {
                domain: {
                  type: 'string',
                  description: 'Домен для добавления'
                },
                api_key: {
                  type: 'string',
                  description: 'API ключ Resend'
                }
              },
              required: ['domain', 'api_key']
            }
          },
          {
            name: 'resend_get_dns_records',
            description: 'Получить DNS записи для верификации домена',
            inputSchema: {
              type: 'object',
              properties: {
                domain: {
                  type: 'string',
                  description: 'Домен'
                },
                api_key: {
                  type: 'string',
                  description: 'API ключ Resend'
                }
              },
              required: ['domain', 'api_key']
            }
          },
          {
            name: 'resend_verify_domain',
            description: 'Запустить верификацию домена',
            inputSchema: {
              type: 'object',
              properties: {
                domain: {
                  type: 'string',
                  description: 'Домен для верификации'
                },
                api_key: {
                  type: 'string',
                  description: 'API ключ Resend'
                }
              },
              required: ['domain', 'api_key']
            }
          },
          {
            name: 'resend_send_test_email',
            description: 'Отправить тестовое письмо для проверки настройки',
            inputSchema: {
              type: 'object',
              properties: {
                from: {
                  type: 'string',
                  description: 'Email отправителя'
                },
                to: {
                  type: 'string',
                  description: 'Email получателя'
                },
                subject: {
                  type: 'string',
                  description: 'Тема письма'
                },
                api_key: {
                  type: 'string',
                  description: 'API ключ Resend'
                }
              },
              required: ['from', 'to', 'subject', 'api_key']
            }
          }
        ]
      };
    });

    // Обработчик вызовов инструментов
    this.server.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'resend_check_domain':
            return await this.checkDomain(args.domain, args.api_key);
          
          case 'resend_add_domain':
            return await this.addDomain(args.domain, args.api_key);
          
          case 'resend_get_dns_records':
            return await this.getDNSRecords(args.domain, args.api_key);
          
          case 'resend_verify_domain':
            return await this.verifyDomain(args.domain, args.api_key);
          
          case 'resend_send_test_email':
            return await this.sendTestEmail(args);
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  async makeResendRequest(endpoint, options = {}) {
    const url = `https://api.resend.com${endpoint}`;
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${options.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Resend API Error: ${data.message || response.statusText}`);
    }

    return data;
  }

  async checkDomain(domain, apiKey) {
    if (!apiKey) {
      return {
        content: [
          {
            type: 'text',
            text: `Для проверки домена ${domain} нужен API ключ Resend. Получите его на https://resend.com/api-keys`
          }
        ]
      };
    }

    try {
      const domains = await this.makeResendRequest('/domains', { apiKey });
      const targetDomain = domains.data?.find(d => d.name === domain);

      if (!targetDomain) {
        return {
          content: [
            {
              type: 'text',
              text: `Домен ${domain} не найден в Resend. Сначала добавьте его через resend_add_domain.`
            }
          ]
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `Домен ${domain}:\n` +
                  `- Статус: ${targetDomain.status}\n` +
                  `- ID: ${targetDomain.id}\n` +
                  `- Создан: ${targetDomain.created_at}\n` +
                  `- Регион: ${targetDomain.region || 'us-east-1'}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Ошибка при проверке домена: ${error.message}`
          }
        ]
      };
    }
  }

  async addDomain(domain, apiKey) {
    try {
      const result = await this.makeResendRequest('/domains', {
        method: 'POST',
        apiKey,
        body: {
          name: domain,
          region: 'us-east-1'
        }
      });

      return {
        content: [
          {
            type: 'text',
            text: `✅ Домен ${domain} успешно добавлен в Resend!\n` +
                  `ID: ${result.id}\n` +
                  `Статус: ${result.status}\n\n` +
                  `Теперь используйте resend_get_dns_records для получения DNS записей.`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Ошибка при добавлении домена: ${error.message}`
          }
        ]
      };
    }
  }

  async getDNSRecords(domain, apiKey) {
    try {
      const domains = await this.makeResendRequest('/domains', { apiKey });
      const targetDomain = domains.data?.find(d => d.name === domain);

      if (!targetDomain) {
        return {
          content: [
            {
              type: 'text',
              text: `Домен ${domain} не найден. Сначала добавьте его.`
            }
          ]
        };
      }

      const domainDetails = await this.makeResendRequest(`/domains/${targetDomain.id}`, { apiKey });
      
      let recordsText = `🔧 DNS записи для домена ${domain}:\n\n`;
      
      if (domainDetails.records && domainDetails.records.length > 0) {
        domainDetails.records.forEach((record, index) => {
          recordsText += `${index + 1}. Тип: ${record.type}\n`;
          recordsText += `   Имя: ${record.name}\n`;
          recordsText += `   Значение: ${record.value}\n`;
          if (record.priority) {
            recordsText += `   Приоритет: ${record.priority}\n`;
          }
          recordsText += '\n';
        });
      } else {
        recordsText += 'DNS записи не найдены или домен уже верифицирован.\n';
      }

      recordsText += `\n📋 Инструкция:\n`;
      recordsText += `1. Войдите в панель управления DNS вашего домена\n`;
      recordsText += `2. Добавьте указанные выше записи\n`;
      recordsText += `3. Дождитесь распространения DNS (до 24 часов)\n`;
      recordsText += `4. Используйте resend_verify_domain для проверки`;

      return {
        content: [
          {
            type: 'text',
            text: recordsText
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Ошибка при получении DNS записей: ${error.message}`
          }
        ]
      };
    }
  }

  async verifyDomain(domain, apiKey) {
    try {
      const domains = await this.makeResendRequest('/domains', { apiKey });
      const targetDomain = domains.data?.find(d => d.name === domain);

      if (!targetDomain) {
        return {
          content: [
            {
              type: 'text',
              text: `Домен ${domain} не найден.`
            }
          ]
        };
      }

      const result = await this.makeResendRequest(`/domains/${targetDomain.id}/verify`, {
        method: 'POST',
        apiKey
      });

      return {
        content: [
          {
            type: 'text',
            text: `🔍 Верификация домена ${domain} запущена.\n` +
                  `Статус: ${result.status || 'pending'}\n\n` +
                  `Если статус 'verified' - домен готов к использованию!\n` +
                  `Если 'pending' - повторите проверку через несколько минут.`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Ошибка при верификации: ${error.message}`
          }
        ]
      };
    }
  }

  async sendTestEmail(args) {
    try {
      const result = await this.makeResendRequest('/emails', {
        method: 'POST',
        apiKey: args.api_key,
        body: {
          from: args.from,
          to: args.to,
          subject: args.subject,
          html: '<h1>Тестовое письмо</h1><p>Поздравляем! Resend настроен правильно.</p>'
        }
      });

      return {
        content: [
          {
            type: 'text',
            text: `✅ Тестовое письмо отправлено!\n` +
                  `ID письма: ${result.id}\n` +
                  `От: ${args.from}\n` +
                  `Кому: ${args.to}\n` +
                  `Тема: ${args.subject}`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Ошибка при отправке тестового письма: ${error.message}`
          }
        ]
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

// Запуск сервера
if (require.main === module) {
  const server = new ResendMCPServer();
  server.run().catch(console.error);
}

module.exports = ResendMCPServer;