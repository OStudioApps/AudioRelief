# AudioRelief

A tinnitus relief app: sound therapy shaped around the sound a person actually
hears, rather than a generic noise library.

Built with Expo (SDK 57) and React Native, targeting iOS and Android.

## What it does

Onboarding asks seven short questions — what the tinnitus sounds like, roughly
what pitch, how much it interferes, and when it is hardest. The home screen
uses those answers to suggest sounds whose spectrum sits closer to the
person's own pitch, and to say why each one is being suggested.

## Running it

```bash
npm install
npx expo start
```

Then open the project in Expo Go on a device, or press `w` for web.

Note: on machines where antivirus or a proxy intercepts HTTPS, Metro can fail
to reach Expo's servers. If the manifest returns a certificate error, start
with `NODE_OPTIONS=--use-system-ca`.

## How it is put together

- `app/` — routes (expo-router). `(onboarding)` is the seven-step profile
  flow; `(tabs)` is the main app.
- `src/data/recommend.ts` — the reasoning that turns onboarding answers into
  suggestions. The limits of what it may claim are written at the top of the
  file; read that before changing it.
- `src/audio/` — playback engine and the hearing-safety ceiling.
- `assets/audio/noise/` — the colour noises, generated mathematically rather
  than recorded, so they are licence-free and loop without a seam.

## Claims and safety

This is a sound tool, not a medical device, and the copy is written to stay
inside that line:

- Output is capped below full scale (`OUTPUT_CEILING`), because loud masking
  played for hours risks hearing damage, which makes tinnitus worse.
- The app plays broadband noise. It does **not** implement the notched-music
  therapy some of the cited research describes, and nothing in the UI should
  imply that it does.
- Research cited in-app is real and was checked against the sources; full
  references are in the comments of `src/data/tinnitus.ts`. It is shown as
  text only and never links out.

## Asset licensing

- Mix card photography: Unsplash, bundled. See `assets/mixes/README.md`.
- Colour noise: generated in-repo, no third-party rights.
- Icons: Phosphor.

## Status

Pre-release. Known gaps: no notched audio, the stats screen behind the home
header is still a placeholder sleep report, and the legal copy carries
`[BRACKETED]` placeholders that need filling and a lawyer's review before
launch.
