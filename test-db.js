import pkg from 'pg';

const { Pool } = pkg;

// Test using the same config as server
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'steel_tracking',
  user: 'postgres',
  password: 'postgres',
  ssl: false,
});

async function testDB() {
  console.log('=== Testing Database Connection ===\n');
  console.log('Config:');
  console.log('  host: localhost');
  console.log('  port: 5432');
  console.log('  database: steel_tracking');
  console.log('  user: postgres');
  console.log('  password: *****\n');
  
  try {
    const client = await pool.connect();
    console.log('✅ Database connected successfully!\n');

    // Check if users table exists
    const usersCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    
    if (usersCheck.rows.length > 0) {
      console.log('✅ Users table exists');
      const result = await client.query('SELECT id, email, role, is_active FROM users LIMIT 5');
      console.log(`   Found ${result.rows.length} user(s):\n`);
      result.rows.forEach(user => {
        console.log(`   - ID: ${user.id}, Email: ${user.email}, Role: ${user.role}, Active: ${user.is_active}`);
      });
    } else {
      console.log('⚠️  Users table does not exist');
      console.log('   Run the SQL scripts to create tables.\n');
    }

    // Check route_cards table
    const rcCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'route_cards'
    `);
    
    if (rcCheck.rows.length > 0) {
      console.log('✅ Route cards table exists\n');
    } else {
      console.log('⚠️  Route cards table does not exist\n');
    }
    
    client.release();
    await pool.end();
    console.log('✅ Database test completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Database connection failed!\n');
    console.error('Error:', error.message);
    console.error('Code:', error.code);
    await pool.end();
    process.exit(1);
  }
}

testDB();
