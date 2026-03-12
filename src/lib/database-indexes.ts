import mongoose from 'mongoose'
import User from '@/models/User'
import Poll from '@/models/Poll'
import Vote from '@/models/Vote'
import Session from '@/models/Session'
import Export from '@/models/Export'

/**
 * Database indexes setup for optimal performance
 * This file ensures all critical indexes are created for the PulsePoll platform
 */

export async function ensureIndexes() {
  try {
    console.log('Setting up database indexes...')

    // Users Collection Indexes
    await User.collection.createIndex({ email: 1 }, { unique: true })
    await User.collection.createIndex({ createdAt: -1 })
    await User.collection.createIndex({ role: 1 })
    await User.collection.createIndex({ emailVerified: 1 })
    console.log('✓ User indexes created')

    // Polls Collection Indexes
    await Poll.collection.createIndex({ creatorId: 1, createdAt: -1 })
    await Poll.collection.createIndex({ privacy: 1, status: 1, createdAt: -1 })
    await Poll.collection.createIndex({ 'metadata.totalVotes': -1 })
    await Poll.collection.createIndex({ 'settings.expiresAt': 1 })
    await Poll.collection.createIndex({ status: 1, 'settings.expiresAt': 1 })
    
    // Text search index for poll discovery
    await Poll.collection.createIndex(
      { title: 'text', description: 'text' },
      { 
        weights: { title: 10, description: 5 },
        name: 'poll_text_search'
      }
    )
    console.log('✓ Poll indexes created')

    // Votes Collection Indexes
    await Vote.collection.createIndex({ pollId: 1, createdAt: -1 })
    await Vote.collection.createIndex({ pollId: 1, 'voterInfo.ipAddress': 1 })
    await Vote.collection.createIndex({ pollId: 1, 'voterInfo.sessionId': 1 })
    await Vote.collection.createIndex({ pollId: 1, voterId: 1 })
    await Vote.collection.createIndex({ pollId: 1, 'voterInfo.fingerprint': 1 })
    
    // Compound index for comprehensive duplicate checking
    await Vote.collection.createIndex({
      pollId: 1,
      'voterInfo.ipAddress': 1,
      'voterInfo.sessionId': 1,
      'voterInfo.fingerprint': 1
    }, { name: 'vote_duplicate_check' })
    
    // Analytics indexes
    await Vote.collection.createIndex({ createdAt: -1 }) // For timeline analytics
    await Vote.collection.createIndex({ 'voterInfo.location.country': 1 }) // For geographic analytics
    console.log('✓ Vote indexes created')

    // Sessions Collection Indexes
    await Session.collection.createIndex({ pollId: 1, sessionId: 1 }, { unique: true })
    await Session.collection.createIndex({ pollId: 1, ipAddress: 1 })
    await Session.collection.createIndex({ pollId: 1, fingerprint: 1 })
    await Session.collection.createIndex({ pollId: 1, userId: 1 })
    
    // TTL index for automatic session cleanup
    await Session.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
    console.log('✓ Session indexes created')

    // Exports Collection Indexes
    await Export.collection.createIndex({ pollId: 1, userId: 1, createdAt: -1 })
    await Export.collection.createIndex({ status: 1, createdAt: -1 })
    await Export.collection.createIndex({ userId: 1, createdAt: -1 })
    
    // TTL index for automatic export cleanup
    await Export.collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
    console.log('✓ Export indexes created')

    console.log('✅ All database indexes created successfully')
    
    return true
  } catch (error) {
    console.error('❌ Error creating database indexes:', error)
    throw error
  }
}

/**
 * Get index information for all collections
 */
export async function getIndexInfo() {
  try {
    const collections = ['users', 'polls', 'votes', 'sessions', 'exports']
    const indexInfo: Record<string, any[]> = {}

    if (!mongoose.connection.db) {
      throw new Error('Database connection not established')
    }

    for (const collectionName of collections) {
      const collection = mongoose.connection.db.collection(collectionName)
      const indexes = await collection.indexes()
      indexInfo[collectionName] = indexes
    }

    return indexInfo
  } catch (error) {
    console.error('Error getting index information:', error)
    throw error
  }
}

/**
 * Analyze query performance for common operations
 */
export async function analyzeQueryPerformance() {
  try {
    console.log('Query performance analysis would be performed here')
    
    // TODO: Implement proper query performance analysis
    // This would require proper explain() method usage with MongoDB driver
    
    return [
      {
        operation: 'User lookup by email',
        note: 'Performance analysis not implemented yet'
      },
      {
        operation: 'Polls by creator',
        note: 'Performance analysis not implemented yet'
      },
      {
        operation: 'Public polls by popularity',
        note: 'Performance analysis not implemented yet'
      },
      {
        operation: 'Vote duplicate check',
        note: 'Performance analysis not implemented yet'
      }
    ]
  } catch (error) {
    console.error('Error analyzing query performance:', error)
    throw error
  }
}

/**
 * Database maintenance operations
 */
export async function performMaintenance() {
  try {
    console.log('Performing database maintenance...')

    // Clean up expired sessions (manual cleanup in addition to TTL)
    const expiredSessions = await Session.deleteMany({
      expiresAt: { $lt: new Date() }
    })
    console.log(`✓ Cleaned up ${expiredSessions.deletedCount} expired sessions`)

    // Clean up expired exports
    const expiredExports = await Export.deleteMany({
      expiresAt: { $lt: new Date() },
      status: { $in: ['completed', 'failed'] }
    })
    console.log(`✓ Cleaned up ${expiredExports.deletedCount} expired exports`)

    // Update poll status for expired polls
    const expiredPolls = await Poll.updateMany(
      {
        status: 'active',
        'settings.expiresAt': { $lt: new Date() }
      },
      { status: 'expired' }
    )
    console.log(`✓ Updated ${expiredPolls.modifiedCount} expired polls`)

    // Recalculate poll vote counts (data integrity check)
    const polls = await Poll.find({ status: { $in: ['active', 'expired'] } })
    let recalculatedPolls = 0

    for (const poll of polls) {
      const voteCount = await Vote.countDocuments({ pollId: poll._id })
      if (poll.metadata.totalVotes !== voteCount) {
        poll.metadata.totalVotes = voteCount
        await poll.save()
        recalculatedPolls++
      }
    }
    console.log(`✓ Recalculated vote counts for ${recalculatedPolls} polls`)

    console.log('✅ Database maintenance completed successfully')
    
    return {
      expiredSessionsRemoved: expiredSessions.deletedCount,
      expiredExportsRemoved: expiredExports.deletedCount,
      expiredPollsUpdated: expiredPolls.modifiedCount,
      pollsRecalculated: recalculatedPolls
    }
  } catch (error) {
    console.error('❌ Error during database maintenance:', error)
    throw error
  }
}

export default {
  ensureIndexes,
  getIndexInfo,
  analyzeQueryPerformance,
  performMaintenance
}