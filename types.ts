// This file is the new type aggregator to avoid circular dependencies.
// We are explicitly NOT re-exporting supabase types to prevent deep type instantiation issues.
// Files needing `Database` or `Json` should import them directly from `./types/supabase`.
export * from './types/app';
export * from './types/ai';
export * from './types/campaign';
export * from './types/chat';
export * from './types/social';
// export * from './types/supabase'; // REMOVED to fix TS errors
export * from './types/user';
