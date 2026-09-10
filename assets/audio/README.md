# Onboarding music

Put the licensed track here as `onboarding.mp3`, then enable it in
`src/audio/track.ts` by swapping the two lines at the bottom of the file.

Requirements for whatever you use:

- Cleared for **commercial use in a shipped app** (CC0 or an equivalent
  royalty-free licence). YouTube-only or "free for personal use" licences
  are not enough.
- Loops without an obvious seam — onboarding can last a couple of minutes.
- Keep the licence text and the source URL in this folder, next to the file.

The app plays it at 32% volume, fades in over 1.4s, and fades out the moment
you leave the first-run flow.
