const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config();
// Also try loading from the backend directory specifically for monorepo structures
require('dotenv').config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('placeholder')) {
  console.warn('[AUTH CONFIG] WARNING: Supabase URL or Service Key is missing or using placeholder!');
} else {
  console.log(`[AUTH CONFIG] Initializing Supabase with URL: ${supabaseUrl.substring(0, 15)}...`);
}

const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseKey || 'placeholder_key'
);

module.exports = supabase;
