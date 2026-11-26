# Heart Archery Birthday Surprise

## Run it
1. Extract the ZIP file.
2. Open `index.html` in Chrome, Edge, or Firefox.
3. The countdown is configured for **29 November 2026 at 12:00 AM India Standard Time (IST)**.
4. After the countdown, enter a name and age. Hit the heart targets, then hit the final green heart.
5. The birthday melody is an original Web Audio instrumental and starts after the final action (or when the music button is pressed).

## Customize
- Countdown: edit `TARGET_TIME` near the top of `script.js`.
- Messages: edit the `cheers` array in `script.js`.
- Birthday wish: edit `.birthday-message` in `index.html`.
- Colors and visual styling: edit `style.css`.

## Notes
- No build tools, npm, or React are required.
- The game is mouse- and touch-friendly.
- The melody is synthesized in the browser; no external music file is required. Browser audio policies require a user interaction before sound can play.
- Google Fonts are loaded online; if offline, the page falls back to system fonts.
