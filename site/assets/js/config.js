/* ==========================================================================
   The Project Hope — site configuration

   Fill these two values in to connect the forms to your database.
   Until you do, forms validate and tell the visitor honestly that nothing
   was sent, rather than pretending to have delivered a message.

   WHERE TO FIND THEM
     supabase.com → your project → Settings → API
       SUPABASE_URL       = "Project URL"
       SUPABASE_ANON_KEY  = "anon public" key

   IS IT SAFE TO PUT THE KEY HERE?
     Yes — the anon key is designed to ship in the browser and is public by
     nature. Its power comes entirely from the Row Level Security policies in
     supabase/schema.sql, which allow INSERT and nothing else. With this key a
     visitor can submit a form; they cannot read anybody's submission.

     The key that must NEVER appear here is the service_role key. It bypasses
     all security policies. If you ever paste one starting with the word
     "service", stop and rotate it.
   ========================================================================== */
window.HOPE_CONFIG = {
  SUPABASE_URL: "https://cqqhxizsbuasbwdwhwko.supabase.co",

  /* STILL NEEDED — paste the "anon public" key here.
     Supabase dashboard → Settings → API → Project API keys → anon public.
     It is a long string beginning "eyJ". Until this is filled in, forms
     validate and say plainly that nothing was sent. */
  SUPABASE_ANON_KEY: "",

  /* Shown to visitors when a submission fails, so they always have a way through */
  FALLBACK_PHONE: "+92 335 5443660",
  FALLBACK_WHATSAPP: "https://wa.me/923355443660"
};
