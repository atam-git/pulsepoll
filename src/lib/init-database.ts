import connectDB from './mongodb'
import { ensureIndexes } from './database-indexes'

/**
 * Initialize database connection and setup indexes
 * This should be called when the application starts
 */
export async function initializeDatabase() {
  try {
    console.log('Initializing database connection...')
    
    // Connect to MongoDB
    await connectDB()
    console.log('✅ Database connected successfully')
    
    // Ensure all indexes are created
    await ensureIndexes()
    console.log('✅ Database indexes initialized')
    
    return true
  } catch (error) {
    console.error('❌ Database initialization failed:', error)
    throw error
  }
}

export default initializeDatabase