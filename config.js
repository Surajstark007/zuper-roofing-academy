/* Zuper Roofing Academy — site configuration.
   Fill in the two Supabase values from: Supabase dashboard → Project Settings → API. */
window.ACADEMY_CONFIG = {
  // Your project URL, e.g. "https://abcdefghijkl.supabase.co"
  SUPABASE_URL: "https://kyzoiajdidvqbamgfthz.supabase.co",

  // The project's public "anon" (publishable) key. It is safe in a web page:
  // the row-level security rules in supabase/schema.sql protect the data.
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5em9pYWpkaWR2cWJhbWdmdGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ4NDA3MTYsImV4cCI6MjExMDQxNjcxNn0.YHmhYiH2uLADzS1LsqG5Xkp62FAAVhiI-IKs8E_9Qx8",

  // Only these email domains can use the Academy. Keep in step with
  // public.allowed_email() in supabase/schema.sql.
  ALLOWED_DOMAINS: ["zuper.co"],

  // Sign-in methods to show: email + password, and/or Google. Enable the matching providers in
  // Supabase → Authentication → Providers.
  AUTH: { google: false, password: true },

  // Link for "Slide deck" in the header. Leave "" to hide it.
  DECK_URL: "https://claude.ai/artifact/8ZqwWuvMtyYwyAfTWGGeUQ",

  // Path to your logo, e.g. "assets/zuper-logo.svg". Leave "" to show the placeholder.
  LOGO_SRC: "assets/zuper-logo.webp"
};
