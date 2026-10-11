import { createClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_URL = 'https://efgulsgqbkqzcdmuycgg.supabase.co';
export const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmZ3Vsc2dxYmtxemNkbXV5Y2dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1NTYwODksImV4cCI6MjEwNzEzMjA4OX0.o1Cl_d-uuwEHyLsW-BZr6ONzbN2LGYQRmbt7xhDqqVg';

export const normalizeSupabaseUrl = (inputUrl) => {
  if (!inputUrl) return '';
  let url = inputUrl.trim();
  // Strip trailing slash
  url = url.replace(/\/+$/, '');
  // Strip /rest/v1 if included
  url = url.replace(/\/rest\/v1\/?$/, '');
  return url;
};

// Default / Cached Supabase credentials or environment variables
export const getStoredConfig = () => {
  try {
    const rawUrl = localStorage.getItem('SYMVIAN_SUPABASE_URL') || import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const key = localStorage.getItem('SYMVIAN_SUPABASE_KEY') || import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;
    const url = normalizeSupabaseUrl(rawUrl);
    return { url, key };
  } catch (e) {
    return { url: DEFAULT_SUPABASE_URL, key: DEFAULT_SUPABASE_KEY };
  }
};

let supabaseInstance = null;

export const initSupabaseClient = (rawUrl, rawKey) => {
  const url = normalizeSupabaseUrl(rawUrl || DEFAULT_SUPABASE_URL);
  const key = (rawKey || DEFAULT_SUPABASE_KEY).trim();

  if (url && key) {
    try {
      supabaseInstance = createClient(url, key);
      return supabaseInstance;
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return null;
};

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    const { url, key } = getStoredConfig();
    if (url && key) {
      initSupabaseClient(url, key);
    }
  }
  return supabaseInstance;
};

export const testSupabaseConnection = async (rawUrl, rawKey) => {
  try {
    const url = normalizeSupabaseUrl(rawUrl || DEFAULT_SUPABASE_URL);
    const key = (rawKey || DEFAULT_SUPABASE_KEY).trim();
    const testClient = createClient(url, key);

    // Light test on public schema (users table)
    const { error } = await testClient.from('users').select('user_id', { head: true });
    if (error && error.code !== 'PGRST116') {
      // Check lowercase venue fallback
      const { error: vErr } = await testClient.from('venue').select('count', { count: 'exact', head: true });
      if (vErr && vErr.code !== 'PGRST116') {
        return { success: false, message: error.message || vErr.message };
      }
    }
    return { success: true, message: 'Connected successfully to Supabase PostgreSQL!' };
  } catch (err) {
    return { success: false, message: err.message || 'Connection failed' };
  }
};

