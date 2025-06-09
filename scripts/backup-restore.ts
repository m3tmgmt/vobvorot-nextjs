#!/usr/bin/env tsx

/**
 * Database Backup and Restore Utilities
 * 
 * Provides functionality to:
 * - Create database backups
 * - Restore from backups
 * - Scheduled backups
 * - Backup verification
 */

import { spawn, exec } from 'child_process'
import { promisify } from 'util'
import { createWriteStream, createReadStream, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { createGzip, createGunzip } from 'zlib'
import { pipeline } from 'stream/promises'

const execAsync = promisify(exec)

interface BackupConfig {
  dbUrl: string
  backupDir: string
  retentionDays: number
  compression: boolean
}

class DatabaseBackup {
  private config: BackupConfig

  constructor(config: Partial<BackupConfig> = {}) {
    this.config = {
      dbUrl: process.env.DATABASE_URL || '',
      backupDir: config.backupDir || join(process.cwd(), 'backups'),
      retentionDays: config.retentionDays || 30,
      compression: config.compression ?? true
    }

    // Ensure backup directory exists
    if (!existsSync(this.config.backupDir)) {
      mkdirSync(this.config.backupDir, { recursive: true })
    }
  }

  private getTimestamp(): string {
    return new Date().toISOString().replace(/[:.]/g, '-').split('.')[0]
  }

  private log(message: string) {
    console.log(`[${new Date().toISOString()}] ${message}`)
  }

  async createBackup(name?: string): Promise<string> {
    const timestamp = this.getTimestamp()
    const backupName = name || `backup-${timestamp}`
    const fileName = this.config.compression ? `${backupName}.sql.gz` : `${backupName}.sql`
    const filePath = join(this.config.backupDir, fileName)

    this.log(`Creating backup: ${fileName}`)

    try {
      // Parse database URL
      const dbUrl = new URL(this.config.dbUrl)
      const dbName = dbUrl.pathname.slice(1)
      const host = dbUrl.hostname
      const port = dbUrl.port || '5432'
      const username = dbUrl.username
      const password = dbUrl.password

      // Set environment variables for pg_dump
      const env = {
        ...process.env,
        PGPASSWORD: password
      }

      // Create pg_dump command
      const dumpCommand = [
        'pg_dump',
        '-h', host,
        '-p', port,
        '-U', username,
        '-d', dbName,
        '--no-password',
        '--verbose',
        '--clean',
        '--if-exists',
        '--create'
      ]

      return new Promise((resolve, reject) => {
        const pgDump = spawn(dumpCommand[0], dumpCommand.slice(1), { env })
        
        let outputStream = createWriteStream(filePath)

        if (this.config.compression) {
          const gzipStream = createGzip()
          pgDump.stdout.pipe(gzipStream).pipe(outputStream)
        } else {
          pgDump.stdout.pipe(outputStream)
        }

        let errorOutput = ''
        pgDump.stderr.on('data', (data) => {
          errorOutput += data.toString()
        })

        pgDump.on('close', (code) => {
          if (code === 0) {
            this.log(`Backup created successfully: ${filePath}`)
            resolve(filePath)
          } else {
            this.log(`Backup failed with code ${code}: ${errorOutput}`)
            reject(new Error(`pg_dump failed: ${errorOutput}`))
          }
        })

        pgDump.on('error', (error) => {
          this.log(`Backup error: ${error.message}`)
          reject(error)
        })
      })
    } catch (error) {
      this.log(`Backup failed: ${(error as Error).message}`)
      throw error
    }
  }

  async restoreBackup(backupPath: string): Promise<void> {
    this.log(`Restoring backup from: ${backupPath}`)

    if (!existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`)
    }

    try {
      // Parse database URL
      const dbUrl = new URL(this.config.dbUrl)
      const dbName = dbUrl.pathname.slice(1)
      const host = dbUrl.hostname
      const port = dbUrl.port || '5432'
      const username = dbUrl.username
      const password = dbUrl.password

      // Set environment variables for psql
      const env = {
        ...process.env,
        PGPASSWORD: password
      }

      // Create psql command
      const restoreCommand = [
        'psql',
        '-h', host,
        '-p', port,
        '-U', username,
        '-d', dbName,
        '--no-password'
      ]

      return new Promise((resolve, reject) => {
        const psql = spawn(restoreCommand[0], restoreCommand.slice(1), { env })
        
        let inputStream = createReadStream(backupPath)

        if (backupPath.endsWith('.gz')) {
          const gunzipStream = createGunzip()
          inputStream.pipe(gunzipStream).pipe(psql.stdin)
        } else {
          inputStream.pipe(psql.stdin)
        }

        let errorOutput = ''
        psql.stderr.on('data', (data) => {
          errorOutput += data.toString()
        })

        psql.on('close', (code) => {
          if (code === 0) {
            this.log('Restore completed successfully')
            resolve()
          } else {
            this.log(`Restore failed with code ${code}: ${errorOutput}`)
            reject(new Error(`psql failed: ${errorOutput}`))
          }
        })

        psql.on('error', (error) => {
          this.log(`Restore error: ${error.message}`)
          reject(error)
        })
      })
    } catch (error) {
      this.log(`Restore failed: ${(error as Error).message}`)
      throw error
    }
  }

  async verifyBackup(backupPath: string): Promise<boolean> {
    this.log(`Verifying backup: ${backupPath}`)

    try {
      // Check if file exists and is readable
      if (!existsSync(backupPath)) {
        this.log('Backup file does not exist')
        return false
      }

      // For gzipped files, try to decompress a small portion
      if (backupPath.endsWith('.gz')) {
        return new Promise((resolve) => {
          const readStream = createReadStream(backupPath, { start: 0, end: 1023 })
          const gunzipStream = createGunzip()
          
          readStream.pipe(gunzipStream)
          
          gunzipStream.on('data', () => {
            this.log('Backup verification successful (gzip format)')
            resolve(true)
          })
          
          gunzipStream.on('error', () => {
            this.log('Backup verification failed (corrupted gzip)')
            resolve(false)
          })
        })
      } else {
        // For SQL files, check if it starts with expected content
        return new Promise((resolve) => {
          const readStream = createReadStream(backupPath, { start: 0, end: 1023 })
          let data = ''
          
          readStream.on('data', (chunk) => {
            data += chunk.toString()
          })
          
          readStream.on('end', () => {
            const isValid = data.includes('--') || data.includes('CREATE') || data.includes('INSERT')
            this.log(`Backup verification ${isValid ? 'successful' : 'failed'} (SQL format)`)
            resolve(isValid)
          })
        })
      }
    } catch (error) {
      this.log(`Backup verification error: ${(error as Error).message}`)
      return false
    }
  }

  async cleanupOldBackups(): Promise<void> {
    this.log('Cleaning up old backups...')

    try {
      const { stdout } = await execAsync(`find "${this.config.backupDir}" -name "backup-*.sql*" -type f`)
      const files = stdout.trim().split('\n').filter(f => f)

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays)

      for (const file of files) {
        const stats = await import('fs/promises').then(fs => fs.stat(file))
        
        if (stats.mtime < cutoffDate) {
          await import('fs/promises').then(fs => fs.unlink(file))
          this.log(`Deleted old backup: ${file}`)
        }
      }
    } catch (error) {
      this.log(`Cleanup error: ${(error as Error).message}`)
    }
  }

  async listBackups(): Promise<string[]> {
    try {
      const { stdout } = await execAsync(`find "${this.config.backupDir}" -name "backup-*.sql*" -type f`)
      return stdout.trim().split('\n').filter(f => f)
    } catch (error) {
      this.log(`List backups error: ${(error as Error).message}`)
      return []
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  const backup = new DatabaseBackup()

  try {
    switch (command) {
      case 'create':
        const name = args[1]
        const backupPath = await backup.createBackup(name)
        console.log(`Backup created: ${backupPath}`)
        break

      case 'restore':
        const restorePath = args[1]
        if (!restorePath) {
          console.error('Please provide backup file path')
          process.exit(1)
        }
        await backup.restoreBackup(restorePath)
        console.log('Restore completed')
        break

      case 'verify':
        const verifyPath = args[1]
        if (!verifyPath) {
          console.error('Please provide backup file path')
          process.exit(1)
        }
        const isValid = await backup.verifyBackup(verifyPath)
        console.log(`Backup is ${isValid ? 'valid' : 'invalid'}`)
        process.exit(isValid ? 0 : 1)

      case 'cleanup':
        await backup.cleanupOldBackups()
        console.log('Cleanup completed')
        break

      case 'list':
        const backups = await backup.listBackups()
        console.log('Available backups:')
        backups.forEach(b => console.log(`  ${b}`))
        break

      default:
        console.log(`
Usage: tsx backup-restore.ts <command> [options]

Commands:
  create [name]     Create a new backup (optional custom name)
  restore <path>    Restore from backup file
  verify <path>     Verify backup integrity
  cleanup           Remove old backups (older than retention period)
  list              List available backups

Examples:
  tsx backup-restore.ts create
  tsx backup-restore.ts create "before-migration"
  tsx backup-restore.ts restore ./backups/backup-2024-01-01T12-00-00.sql.gz
  tsx backup-restore.ts verify ./backups/backup-2024-01-01T12-00-00.sql.gz
  tsx backup-restore.ts cleanup
  tsx backup-restore.ts list
        `)
        process.exit(1)
    }
  } catch (error) {
    console.error('Operation failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { DatabaseBackup }