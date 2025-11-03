// /js/supabaseClient.js
const SUPABASE_URL = "https://lajqzmlhcsxhpfbhmlxe.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhanF6bWxoY3N4aHBmYmhtbHhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk4MzkzMTksImV4cCI6MjA3NTQxNTMxOX0.3fjdlh2Ozf0Ku7-s2459qYFCzQBBw49tzMFM-vFgmeg"; // NICHT den Service-Key!

window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
