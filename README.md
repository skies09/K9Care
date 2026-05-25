# K9Care

**K9Care** is a React Native (Expo) app for dog owners to track health conditions, log symptoms, manage medications, and share structured reports with veterinarians. Data stays on the device (SQLite).

---

## Features

| Area | What it does |
|------|----------------|
| **Onboarding** | Shown when you have no dogs. Step-by-step setup: name, breed, partial birthday (year only is fine), weight (optional / skip), up to **3** health areas, then a summary. |
| **Home** | Dashboard for the current dog: weight CTA + mini chart, **Your data** (stats for weight + each tracked condition + meds), vet report link, seizure quick access when epilepsy is tracked. Dog tabs when you have multiple dogs. |
| **Dogs** | List up to **5 dogs**; tap a card to edit (name, breed, birthday, weight, notes, photo, conditions). Add/remove dogs. |
| **Edit dog** | Photo from library (saved locally), form auto-saves as you edit, **Save** at the bottom (same style as onboarding) saves and returns to Dogs. |
| **Track** | Tracker shortcuts only for conditions selected for the current dog (consistent teal action buttons). |
| **Meds** | Medications per dog; daily reminders via **expo-notifications** (limited in Expo Go — use a dev build for full behaviour). |
| **Condition screens** | Breathing checks, seizures (timer **or manual entry**), weight, arthritis/mobility, allergies, digestive, diabetes, kidney, anxiety — all stored in SQLite. |
| **Vet report** | Summary of recent logs for the current dog; **PDF export & share** via expo-print / expo-sharing (per section or full report). |

### Condition tags (per dog)

Heart, epilepsy, arthritis, allergy, digestive, diabetes, kidney, anxiety — each unlocks the matching tracker on Home and Track. **Onboarding:** up to 3; **edit dog:** up to 5.

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | **Expo SDK 55** (React 19, React Native 0.83) |
| Navigation | **React Navigation** — bottom tabs (Home, Dogs, Track, Meds) + stack (onboarding, edit dog, trackers, vet report) |
| Storage | **expo-sqlite** — dogs + logs (weight, breathing, seizures, meds, mobility, allergy, stool, insulin, glucose, kidney, anxiety) |
| UI | **Poppins** + **Inter** (`@expo-google-fonts/*`, `expo-font`); shared `Button`, `Card`, theme tokens |
| Media | **expo-image-picker**, **expo-file-system** (photos under app documents) |
| Notifications | **expo-notifications** |
| PDF | **expo-print**, **expo-sharing** |
| Language | **TypeScript** |

---

## Prerequisites

- **Node.js ≥ 20.16.0** (required by Expo 55). From repo root: `nvm install` (see `.nvmrc`), or use Node 20.18+ LTS.
- npm (or yarn)
- **iOS Simulator** (Mac), **Android emulator**, or **Expo Go** on a phone (SDK must match the project — currently **SDK 55**)
- For reliable notification testing, a **development build** is recommended ([Expo dev client](https://docs.expo.dev/develop/development-builds/introduction/)).

---

## Getting started

All app code lives under **`app/`**. Run commands from that folder:

```bash
cd app
npm install
npx expo start
```

Then:

- **i** — iOS Simulator  
- **a** — Android emulator  
- Or scan the QR code with **Expo Go** (open the project from inside Expo Go on the same Wi‑Fi)

Use **`npx expo start`**, not `npx expo cli`. Check login with `npx expo whoami` if the QR bundle fails to load.

Native runs (after prebuild if needed):

```bash
cd app
npm run ios
npm run android
```

Optional web:

```bash
cd app
npm run web
```

---

## Project layout

```
k9care/
├── .nvmrc                 # Suggested Node version (≥20.16)
└── app/
    ├── README.md           # This file
    ├── App.tsx             # Entry: fonts, DogProvider, navigation
    ├── app.json            # Expo config (EAS project id in extra.eas)
    ├── eas.json            # EAS Build profiles
    ├── index.ts
    ├── package.json
    └── src/
        ├── components/
        │   ├── PartialDobPicker.tsx
        │   └── ui/         # Button, Card
        ├── context/        # DogContext (dogs, currentDogId, CRUD)
        ├── db/             # SQLite schema & migrations
        ├── navigation/     # Tabs + stack, onboarding gate
        ├── screens/        # Feature screens (16)
        ├── services/       # Notifications
        ├── theme/          # colors, typography, spacing, layout
        ├── utils/          # dobFormat (partial birthdays)
        └── types.ts        # Dog, ConditionTag, log types
```

---

## Design notes

Veterinary healthcare brand palette (calm, approachable):

| Token | Color | Use |
|-------|-------|-----|
| Primary | `#1F6F78` | Teal — buttons, headings, accents |
| Secondary | `#9BC4B5` | Sage — disabled states, success |
| Background | `#F7F3EF` | Sand |
| Cards | `#FFFFFF` | On mint-tint panels (`#F4FAF8`) in onboarding |

- **Typography:** Poppins (headings), Inter (body)
- Onboarding and edit flows use full-width teal **Next** / **Save** buttons (`Button` variant `onboarding`)
- Stack screens use a back chevron and white/sand cards

---

## License

Private. All rights reserved.
