const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const db = require('../server/db');

console.log('🚀 Running name uniqueness migration script...');

async function runMigration() {
  try {
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'migrations', 'add_name_uniqueness.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Applying name uniqueness constraint...');
    
    // Execute the migration
    await db.query(migrationSQL);
    
    console.log('✅ Migration applied successfully!');
    console.log('✅ Case names are now enforced to be unique.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('If this is due to existing duplicates, they need to be resolved first.');
    
    if (error.message.includes('duplicate key value violates unique constraint')) {
      console.log('\n🔍 Finding duplicate case names...');
      
      try {
        // Query to find duplicates
        const duplicatesResult = await db.query(`
          SELECT first_name, last_name, COUNT(*) 
          FROM cases 
          GROUP BY LOWER(first_name), LOWER(last_name) 
          HAVING COUNT(*) > 1
        `);
        
        if (duplicatesResult.rows.length > 0) {
          console.log('\n❗ The following duplicates were found:');
          duplicatesResult.rows.forEach(row => {
            console.log(`- "${row.first_name} ${row.last_name}" (${row.count} instances)`);
          });
          
          console.log('\n💡 Suggestions to fix:');
          console.log('1. Manually update the duplicate cases with distinct names');
          console.log('2. Run the script again after updating the duplicates');
        }
      } catch (err) {
        console.error('Error while looking for duplicates:', err.message);
      }
    }
  } finally {
    // No need to close the connection since db.js handles that
    console.log('✨ Migration script finished.');
  }
}

// Run the migration
runMigration(); 