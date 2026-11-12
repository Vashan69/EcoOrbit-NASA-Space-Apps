EcoMeet email codes: setup (about 5 minutes)

1. Install Node.js 18 or newer from nodejs.org.
2. Open a terminal in this folder and run:  npm install
3. Make a Gmail app password: Google Account > Security > turn on 2-Step Verification > App passwords.
4. Set the values from .env.example, then start the server.
   Windows (PowerShell):
     $env:SMTP_USER="you@gmail.com"; $env:SMTP_PASS="your app password"; node server.js
   Mac/Linux:
     SMTP_USER=you@gmail.com SMTP_PASS="your app password" node server.js
   To test without sending email, add MAIL_DRY=1 (codes print in the terminal).
5. In ecomeet.html, find  window.ECO_KYC = { endpoint: "http://localhost:8787" }
   near the top and change the address to where this server runs.
   A live (https) website needs an https server address.

Live translation (optional, better quality)
   Without this, the page uses a free public translator that has daily limits.
   For heavier use set ONE of these before starting the server:
     GOOGLE_TRANSLATE_KEY=your Google Cloud Translation API key
     LIBRETRANSLATE_URL=https://your-libretranslate-server  (and LIBRETRANSLATE_KEY if it needs one)

AI voice for translation (needed so listeners hear a voice in any language)
   Set ONE of these before starting the server:
     GOOGLE_TRANSLATE_KEY=your Google Cloud key. Turn on both "Cloud Translation API" and "Cloud Text-to-Speech API" for it.
     OPENAI_API_KEY=your OpenAI key (optional OPENAI_TTS_MODEL, default tts-1)
   These services charge per use. Without one, listeners hear their own device voice, which may not exist for every language.
