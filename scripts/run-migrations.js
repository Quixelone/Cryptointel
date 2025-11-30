const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function runMigrations() {
    console.log('🔧 Starting Supabase database migrations...\n');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    if (!supabaseUrl) {
        console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local');
        return;
    }

    // Extract project reference from Supabase URL
    // Format: https://PROJECT_REF.supabase.co
    const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');

    // Construct PostgreSQL connection string
    // Supabase uses port 5432 for direct PostgreSQL connections
    const connectionString = `postgresql://postgres:[YOUR-PASSWORD]@db.${projectRef}.supabase.co:5432/postgres`;

    console.log('⚠️  PostgreSQL Connection Required');
    console.log('   To run migrations, you need the database password.');
    console.log('   Find it in: Supabase Dashboard → Settings → Database → Connection string\n');
    console.log('   Connection format:');
    console.log(`   postgresql://postgres:PASSWORD@db.${projectRef}.supabase.co:5432/postgres\n`);

    console.log('📋 Alternative: Run migrations manually');
    console.log('   1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/sql');
    console.log('   2. Copy and paste the content of each migration file:');
    console.log('      - supabase/migrations/20240101000000_initial_schema.sql');
    console.log('      - supabase/migrations/20240102000000_learning_system.sql');
    console.log('   3. Click "Run" for each file\n');

    // If user provides password as env var, we can run automatically
    const dbPassword = process.env.SUPABASE_DB_PASSWORD;

    if (!dbPassword) {
        console.log('💡 To run migrations automatically, add to .env.local:');
        console.log('   SUPABASE_DB_PASSWORD=your_database_password');
        console.log('   Then run this script again.\n');
        return;
    }

    const fullConnectionString = `postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres`;

    const client = new Client({ connectionString: fullConnectionString });

    try {
        console.log('🔌 Connecting to database...');
        await client.connect();
        console.log('✅ Connected!\n');

        const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');
        const migrationFiles = [
            '20240101000000_initial_schema.sql',
            '20240102000000_learning_system.sql'
        ];

        for (const file of migrationFiles) {
            const filePath = path.join(migrationsDir, file);
            console.log(`📄 Running migration: ${file}`);

            const sql = fs.readFileSync(filePath, 'utf8');

            try {
                await client.query(sql);
                console.log(`   ✅ Success!\n`);
            } catch (error) {
                console.error(`   ❌ Error:`, error.message);
                console.error(`   Continuing with next migration...\n`);
            }
        }

        console.log('✅ All migrations completed!');

    } catch (error) {
        console.error('❌ Connection error:', error.message);
    } finally {
        await client.end();
    }
}

runMigrations();
