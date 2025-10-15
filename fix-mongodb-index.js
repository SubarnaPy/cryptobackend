/**
 * Fix MongoDB index to allow multiple null values for stripePaymentIntentId
 * Run with: node fix-mongodb-index.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

async function fixIndex() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/canadian-nexus', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const collection = db.collection('payments');

    console.log('📋 Current indexes on payments collection:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key));
    });

    console.log('\n🔍 Checking for stripePaymentIntentId index...');
    const problematicIndex = indexes.find(idx => 
      idx.key.stripePaymentIntentId && !idx.sparse
    );

    if (problematicIndex) {
      console.log(`❌ Found non-sparse index: ${problematicIndex.name}`);
      console.log('🗑️  Dropping the old index...');
      await collection.dropIndex(problematicIndex.name);
      console.log('✅ Old index dropped');

      console.log('🔨 Creating new sparse index...');
      await collection.createIndex(
        { stripePaymentIntentId: 1 }, 
        { sparse: true, name: 'stripePaymentIntentId_1_sparse' }
      );
      console.log('✅ New sparse index created');
    } else {
      const sparseIndex = indexes.find(idx => 
        idx.key.stripePaymentIntentId && idx.sparse
      );
      if (sparseIndex) {
        console.log('✅ Sparse index already exists:', sparseIndex.name);
      } else {
        console.log('🔨 Creating new sparse index...');
        await collection.createIndex(
          { stripePaymentIntentId: 1 }, 
          { sparse: true, name: 'stripePaymentIntentId_1_sparse' }
        );
        console.log('✅ New sparse index created');
      }
    }

    console.log('\n📋 Updated indexes:');
    const updatedIndexes = await collection.indexes();
    updatedIndexes.forEach(index => {
      console.log(`  - ${index.name}:`, JSON.stringify(index.key), index.sparse ? '(sparse)' : '');
    });

    console.log('\n🎉 Index fix completed successfully!');
    console.log('✅ You can now create multiple payments with null stripePaymentIntentId\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
  }
}

fixIndex();
