# K9Care

**K9Care** is a React Native (Expo) app for dog owners to track health conditions, log symptoms, manage medications, and share structured reports with veterinarians. Data stays on the device (SQLite).

---

## Features

| Area | What it does |
|------|----------------|
| **Onboarding** | Shown when you have no dogs. Add your first dog (name, breed, birthday, weight, health areas). |
| **Home** | Dashboard for the current dog: weight CTA + mini chart, **Your data** (stats for weight + each tracked condition + meds), vet report link. Dog tabs when you have multiple dogs. |
| **Dogs** | List up to **5 dogs**; tap a card to edit (name, breed, birthday, weight, notes, photo, conditions). Add/remove dogs. |
| **Edit dog** | Photo from library (saved locally), form auto-saves as you edit, **Save** saves and returns to Dogs. |
| **Track** | Tracker shortcuts only for conditions selected for the current dog. |
| **Meds** | Medications per dog; daily reminders via **expo-notifications** (limited in Expo Go — use a dev build for full behaviour). |
| **Condition screens** | Breathing checks, seizures, weight, arthritis/mobility, allergies, digestive, diabetes, kidney, anxiety — all stored in SQLite. |
| **Vet report** | Summary of recent logs for the current dog; **PDF export & share** via expo-print / expo-sharing. |

### Condition tags (per dog, up to 5)

Heart, epilepsy, arthritis, allergy, digestive, diabetes, kidney, anxiety — each unlocks the matching tracker on Home and Track.

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | **Expo ~55** (React 19, React Native 0.83) |
| Navigation | **React Navigation** — bottom tabs (Home, Dogs, Track, Meds) + stack (onboarding, edit dog, trackers, vet report) |
| Storage | **expo-sqlite** — dogs + logs (weight, breathing, seizures, meds, mobility, allergy, stool, insulin, glucose, kidney, anxiety) |
| Media | **expo-image-picker**, **expo-file-system** (photos under app documents) |
| Notifications | **expo-notifications** |
| PDF | **expo-print**, **expo-sharing** |
| Language | **TypeScript** |

---

## Prerequisites

- **Node.js ≥ 20.16.0** (required by Expo 55 / `expo-server`).  
  If you use **nvm**: `nvm install` from the repo root (see `.nvmrc`), or install Node 20.18+ LTS another way.
- npm (or yarn)
- **iOS Simulator** (Mac), **Android emulator**, or **Expo Go** on a phone  
- For reliable notification testing, a **development build** is recommended ([Expo dev client](https://docs.expo.dev/develop/development-builds/introduction/)).

---

## Getting started

All app code is under **`app/`**.

```bash
cd app
npm install
npm start
```

Then:

- **i** — iOS Simulator  
- **a** — Android emulator  
- Or scan the QR code with **Expo Go**

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
├── README.md              # This file
└── app/
    ├── App.tsx             # Entry: DogProvider + navigation
    ├── app.json            # Expo config
    ├── index.ts
    ├── package.json
    └── src/
        ├── components/ui/  # Card, Button
        ├── context/        # DogContext (dogs, currentDogId, CRUD)
        ├── db/             # SQLite schema & migrations
        ├── navigation/     # Tabs + stack, onboarding gate
        ├── screens/        # All feature screens
        ├── services/       # Notifications
        ├── theme/          # colors, spacing
        └── types.ts        # Dog, ConditionTag, log types
```

---

## Design notes

- **Primary blue** `#2F80ED`, **health green** `#27AE60`, **danger** `#EB5757`
- **Background** `#E8EEF7`, cards white, calm medical-friendly UI
- Tracker / stack screens use back chevron + consistent card styling

---

## License

Private. All rights reserved.
