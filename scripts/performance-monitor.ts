#!/usr/bin/env tsx

/**
 * Database Performance Monitor
 * 
 * Monitors database performance and provides insights:
 * - Query performance analysis
 * - Index usage statistics
 * - Table size analysis
 * - Slow query identification
 * - Connection pool monitoring
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface PerformanceMetrics {
  queryStats: QueryStats[]
  indexUsage: IndexUsage[]
  tableSizes: TableSize[]
  slowQueries: SlowQuery[]
  connectionInfo: ConnectionInfo
}

interface QueryStats {
  query: string
  calls: number
  totalTime: number
  avgTime: number
  minTime: number
  maxTime: number
}

interface IndexUsage {
  tableName: string
  indexName: string
  indexScans: number
  tupleReads: number
  tuplesFetched: number
}

interface TableSize {
  tableName: string
  sizeBytes: number
  sizeHuman: string
  rowCount: number
}

interface SlowQuery {
  query: string
  duration: number
  timestamp: Date
}

interface ConnectionInfo {
  activeConnections: number
  maxConnections: number
  idleConnections: number
  totalConnections: number
}

class PerformanceMonitor {
  private startTime: Date

  constructor() {
    this.startTime = new Date()
  }

  private log(message: string) {
    console.log(`[${new Date().toISOString()}] ${message}`)
  }

  async getQueryStats(): Promise<QueryStats[]> {
    this.log('Gathering query statistics...')
    
    try {
      const stats = await prisma.$queryRaw`
        SELECT 
          query,
          calls,
          total_exec_time as total_time,
          mean_exec_time as avg_time,
          min_exec_time as min_time,
          max_exec_time as max_time
        FROM pg_stat_statements 
        WHERE query NOT LIKE '%pg_stat_statements%'
        ORDER BY total_exec_time DESC 
        LIMIT 20
      ` as QueryStats[]

      return stats
    } catch (error) {
      this.log('pg_stat_statements extension not available. Install with: CREATE EXTENSION pg_stat_statements;')
      return []
    }
  }

  async getIndexUsage(): Promise<IndexUsage[]> {
    this.log('Analyzing index usage...')
    
    try {
      const usage = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename as table_name,
          indexname as index_name,
          idx_scan as index_scans,
          idx_tup_read as tuple_reads,
          idx_tup_fetch as tuples_fetched
        FROM pg_stat_user_indexes 
        ORDER BY idx_scan DESC
      ` as any[]

      return usage.map(u => ({
        tableName: u.table_name,
        indexName: u.index_name,
        indexScans: parseInt(u.index_scans) || 0,
        tupleReads: parseInt(u.tuple_reads) || 0,
        tuplesFetched: parseInt(u.tuples_fetched) || 0
      }))
    } catch (error) {
      this.log(`Error getting index usage: ${(error as Error).message}`)
      return []
    }
  }

  async getTableSizes(): Promise<TableSize[]> {
    this.log('Calculating table sizes...')
    
    try {
      const sizes = await prisma.$queryRaw`
        SELECT 
          tablename as table_name,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size_human
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
      ` as any[]

      // Get row counts
      const tableSizes: TableSize[] = []
      
      for (const table of sizes) {
        try {
          const countResult = await prisma.$queryRawUnsafe(`
            SELECT COUNT(*) as row_count FROM "${table.table_name}"
          `) as any[]
          
          tableSizes.push({
            tableName: table.table_name,
            sizeBytes: parseInt(table.size_bytes),
            sizeHuman: table.size_human,
            rowCount: parseInt(countResult[0].row_count)
          })
        } catch (error) {
          tableSizes.push({
            tableName: table.table_name,
            sizeBytes: parseInt(table.size_bytes),
            sizeHuman: table.size_human,
            rowCount: 0
          })
        }
      }

      return tableSizes
    } catch (error) {
      this.log(`Error getting table sizes: ${(error as Error).message}`)
      return []
    }
  }

  async getSlowQueries(): Promise<SlowQuery[]> {
    this.log('Identifying slow queries...')
    
    try {
      const slowQueries = await prisma.$queryRaw`
        SELECT 
          query,
          mean_exec_time as duration,
          NOW() as timestamp
        FROM pg_stat_statements 
        WHERE mean_exec_time > 100  -- Queries slower than 100ms
        AND query NOT LIKE '%pg_stat_statements%'
        ORDER BY mean_exec_time DESC 
        LIMIT 10
      ` as any[]

      return slowQueries.map(q => ({
        query: q.query,
        duration: parseFloat(q.duration),
        timestamp: new Date(q.timestamp)
      }))
    } catch (error) {
      this.log('Slow query analysis requires pg_stat_statements extension')
      return []
    }
  }

  async getConnectionInfo(): Promise<ConnectionInfo> {
    this.log('Checking connection information...')
    
    try {
      const connections = await prisma.$queryRaw`
        SELECT 
          (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
          (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections,
          (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'idle') as idle_connections,
          (SELECT COUNT(*) FROM pg_stat_activity) as total_connections
      ` as any[]

      const conn = connections[0]
      return {
        activeConnections: parseInt(conn.active_connections),
        maxConnections: parseInt(conn.max_connections),
        idleConnections: parseInt(conn.idle_connections),
        totalConnections: parseInt(conn.total_connections)
      }
    } catch (error) {
      this.log(`Error getting connection info: ${(error as Error).message}`)
      return {
        activeConnections: 0,
        maxConnections: 0,
        idleConnections: 0,
        totalConnections: 0
      }
    }
  }

  async checkUnusedIndexes(): Promise<string[]> {
    this.log('Checking for unused indexes...')
    
    try {
      const unusedIndexes = await prisma.$queryRaw`
        SELECT 
          schemaname,
          tablename,
          indexname
        FROM pg_stat_user_indexes 
        WHERE idx_scan = 0
        AND indexname NOT LIKE '%_pkey'  -- Exclude primary keys
        ORDER BY tablename, indexname
      ` as any[]

      return unusedIndexes.map(idx => `${idx.tablename}.${idx.indexname}`)
    } catch (error) {
      this.log(`Error checking unused indexes: ${(error as Error).message}`)
      return []
    }
  }

  async getMissingIndexSuggestions(): Promise<string[]> {
    this.log('Analyzing potential missing indexes...')
    
    // This is a simplified analysis - in production you'd want more sophisticated tools
    const suggestions: string[] = []

    try {
      // Check for foreign keys without indexes (PostgreSQL automatically creates them, but good to verify)
      const fkWithoutIndex = await prisma.$queryRaw`
        SELECT 
          conrelid::regclass AS table_name,
          confrelid::regclass AS referenced_table,
          pg_get_constraintdef(oid) AS constraint_def
        FROM pg_constraint 
        WHERE contype = 'f'
        AND NOT EXISTS (
          SELECT 1 FROM pg_index 
          WHERE indrelid = conrelid 
          AND indkey::text LIKE '%' || conkey[1]::text || '%'
        )
      ` as any[]

      fkWithoutIndex.forEach(fk => {
        suggestions.push(`Consider index on ${fk.table_name} for foreign key constraint`)
      })

      // Suggest composite indexes for common query patterns
      suggestions.push('Consider composite index on orders(user_id, status) for user order history')
      suggestions.push('Consider composite index on products(category_id, is_active) for category browsing')
      suggestions.push('Consider composite index on product_skus(product_id, is_active) for active SKUs')

    } catch (error) {
      this.log(`Error analyzing missing indexes: ${(error as Error).message}`)
    }

    return suggestions
  }

  async generateReport(): Promise<PerformanceMetrics> {
    this.log('🔍 Starting performance analysis...')

    const [
      queryStats,
      indexUsage,
      tableSizes,
      slowQueries,
      connectionInfo
    ] = await Promise.all([
      this.getQueryStats(),
      this.getIndexUsage(),
      this.getTableSizes(),
      this.getSlowQueries(),
      this.getConnectionInfo()
    ])

    const unusedIndexes = await this.checkUnusedIndexes()
    const missingSuggestions = await this.getMissingIndexSuggestions()

    // Print comprehensive report
    console.log('\n' + '='.repeat(60))
    console.log('📊 DATABASE PERFORMANCE REPORT')
    console.log('='.repeat(60))

    // Connection Info
    console.log('\n🔗 CONNECTION STATUS:')
    console.log(`   Active: ${connectionInfo.activeConnections}`)
    console.log(`   Idle: ${connectionInfo.idleConnections}`)
    console.log(`   Total: ${connectionInfo.totalConnections}/${connectionInfo.maxConnections}`)
    
    const connectionUsage = (connectionInfo.totalConnections / connectionInfo.maxConnections) * 100
    if (connectionUsage > 80) {
      console.log('   ⚠️  High connection usage detected!')
    }

    // Table Sizes
    console.log('\n📈 TABLE SIZES:')
    tableSizes.slice(0, 10).forEach(table => {
      console.log(`   ${table.tableName.padEnd(20)} ${table.sizeHuman.padEnd(10)} (${table.rowCount.toLocaleString()} rows)`)
    })

    // Index Usage
    console.log('\n📊 INDEX USAGE (Top 10):')
    indexUsage.slice(0, 10).forEach(idx => {
      console.log(`   ${idx.tableName}.${idx.indexName.padEnd(25)} ${idx.indexScans.toLocaleString()} scans`)
    })

    // Unused Indexes
    if (unusedIndexes.length > 0) {
      console.log('\n⚠️  UNUSED INDEXES:')
      unusedIndexes.forEach(idx => {
        console.log(`   ${idx}`)
      })
    }

    // Query Performance
    if (queryStats.length > 0) {
      console.log('\n⏱️  TOP QUERIES BY TOTAL TIME:')
      queryStats.slice(0, 5).forEach(stat => {
        const shortQuery = stat.query.substring(0, 60) + (stat.query.length > 60 ? '...' : '')
        console.log(`   ${shortQuery}`)
        console.log(`      Calls: ${stat.calls}, Avg: ${stat.avgTime.toFixed(2)}ms, Total: ${stat.totalTime.toFixed(2)}ms`)
      })
    }

    // Slow Queries
    if (slowQueries.length > 0) {
      console.log('\n🐌 SLOW QUERIES (>100ms):')
      slowQueries.forEach(query => {
        const shortQuery = query.query.substring(0, 60) + (query.query.length > 60 ? '...' : '')
        console.log(`   ${shortQuery}`)
        console.log(`      Duration: ${query.duration.toFixed(2)}ms`)
      })
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:')
    if (missingSuggestions.length > 0) {
      missingSuggestions.forEach(suggestion => {
        console.log(`   • ${suggestion}`)
      })
    }

    // Performance health score
    let healthScore = 100
    if (connectionUsage > 80) healthScore -= 20
    if (slowQueries.length > 5) healthScore -= 15
    if (unusedIndexes.length > 3) healthScore -= 10

    console.log(`\n🎯 PERFORMANCE HEALTH SCORE: ${healthScore}/100`)
    
    if (healthScore >= 90) {
      console.log('   ✅ Excellent performance!')
    } else if (healthScore >= 70) {
      console.log('   ⚠️  Good performance with room for improvement')
    } else {
      console.log('   ❌ Performance issues detected - optimization recommended')
    }

    console.log('\n' + '='.repeat(60))

    return {
      queryStats,
      indexUsage,
      tableSizes,
      slowQueries,
      connectionInfo
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)
  const format = args.includes('--json') ? 'json' : 'console'
  const continuous = args.includes('--continuous')
  const interval = args.includes('--interval') ? parseInt(args[args.indexOf('--interval') + 1]) : 60

  const monitor = new PerformanceMonitor()

  try {
    if (continuous) {
      console.log(`🔄 Starting continuous monitoring (${interval}s intervals)...`)
      
      while (true) {
        const metrics = await monitor.generateReport()
        
        if (format === 'json') {
          console.log(JSON.stringify(metrics, null, 2))
        }
        
        await new Promise(resolve => setTimeout(resolve, interval * 1000))
      }
    } else {
      const metrics = await monitor.generateReport()
      
      if (format === 'json') {
        console.log(JSON.stringify(metrics, null, 2))
      }
    }
  } catch (error) {
    console.error('❌ Performance monitoring failed:', error)
    process.exit(1)
  } finally {
    if (!continuous) {
      await prisma.$disconnect()
    }
  }
}

if (require.main === module) {
  main()
}

export { PerformanceMonitor }