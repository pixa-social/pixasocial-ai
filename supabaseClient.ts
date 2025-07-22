
import { createClient } from '@supabase/supabase-js';
import { Database } from './types/supabase'; // Assuming this is the type for your DB schema

// Hard-coded Supabase credentials as per user request to fix the environment variable error.
// In a production environment, these should be handled more securely.
export const supabaseUrl = 'https://vaufpdurfushdvscbqro.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhdWZwZHVyZnVzaGR2c2NicXJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4Njg4NzIsImV4cCI6MjA2NjQ0NDg3Mn0.scUGnUx7DgQVnwSxa6nsIqSrE-7LZ1hATy4DjVrYzLk';

// Create a single supabase client for interacting with your database
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);