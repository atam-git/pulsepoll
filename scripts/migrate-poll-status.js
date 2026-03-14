/**
 * Migration script to update poll status values
 * Converts old status values to new simplified active/inactive system
 * 
 * Run with: node scripts/migrate-poll-status.js
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');

// MongoDB connection string from environment
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Error: MONGODB_URI not found in environment variables');
  console.error('Make sure .env.local file exists with MONGODB_URI');
  process.exit(1);
}

async function migratePollStatus() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected successfully!');

    const db = mongoose.connection.db;
    const pollsCollection = db.collection('polls');

    // Get count of polls to migrate
    const totalPolls = await pollsCollection.countDocuments();
    console.log(`\nFound ${totalPolls} polls to check`);

    // Map old statuses to new ones
    const statusMapping = {
      'draft': 'inactive',
      'closed': 'inactive',
      'expired': 'inactive',
      'active': 'active'
    };

    let updatedCount = 0;

    // Update polls with old status values
    for (const [oldStatus, newStatus] of Object.entries(statusMapping)) {
      if (oldStatus !== 'active') { // Skip active as it stays the same
        const result = await pollsCollection.updateMany(
          { status: oldStatus },
          { $set: { status: newStatus } }
        );
        
        if (result.modifiedCount > 0) {
          console.log(`Updated ${result.modifiedCount} polls from '${oldStatus}' to '${newStatus}'`);
          updatedCount += result.modifiedCount;
        }
      }
    }

    // Handle polls with no status (set to active as default)
    const noStatusResult = await pollsCollection.updateMany(
      { status: { $exists: false } },
      { $set: { status: 'active' } }
    );
    
    if (noStatusResult.modifiedCount > 0) {
      console.log(`Set status to 'active' for ${noStatusResult.modifiedCount} polls with no status`);
      updatedCount += noStatusResult.modifiedCount;
    }

    console.log(`\n✅ Migration complete! Updated ${updatedCount} polls`);
    console.log('\nCurrent status distribution:');
    
    const statusCounts = await pollsCollection.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    statusCounts.forEach(({ _id, count }) => {
      console.log(`  ${_id}: ${count} polls`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    process.exit(0);
  }
}

// Run migration
migratePollStatus();
