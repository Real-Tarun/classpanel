# 🏫 ClassPanel — Free Interactive Classroom Tools for Teachers

> **The modern, ad-free classroom utilities hub designed for interactive smartboards, projectors, and everyday teaching.**

[![Deploy to Cloudflare Pages](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://pages.cloudflare.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![PWA Ready](https://img.shields.io/badge/PWA-Offline%20Ready-success?style=for-the-badge)](manifest.webmanifest)

---

## 🌟 Overview

**ClassPanel** ([classpanel.online](https://classpanel.online)) is a fast, lightweight, zero-dependency web application engineered specifically for classroom environments. Unlike standard commercial timer websites that bombard classrooms with distracting advertisements and popups, ClassPanel is 100% ad-free, respects student privacy (COPPA & FERPA compliant on-device storage), and features high-contrast visuals optimized for large-scale classroom projection.

---

## 🛠️ Suite of Classroom Tools

1. **⏱️ Classroom Timer** (`/tools/classroom-timer/`)
   - Countdown & Stopwatch modes with visual color-shifting progress bars (Green → Amber → Red).
   - In-place click-to-edit time display (`HH:MM:SS`), quick `+1 Hr` adjustment, and simplified presets.
2. **🎡 Random Name Picker** (`/tools/random-name-picker/`)
   - High-DPI canvas spinning wheel with physics deceleration, "Remove on Pick" mode, and confetti celebration.
3. **👥 Class Group Generator** (`/tools/group-generator/`)
   - Split student lists by group count or group size with color-coded team cards and one-click clipboard export.
4. **📝 Official Exam Timer** (`/tools/exam-timer/`)
   - Standardized exam countdown, live wall clock, reading time phase, visual milestone alerts, and editable whiteboard notes.
5. **🫧 Sensory Calming Timer** (`/tools/sensory-timer/`)
   - 4-4-4-4 Box Breathing visual guide and relaxing fluid bubble dropper for calm-down corners.
6. **🕒 Classroom Clocks** (`/tools/clocks/`)
   - Synchronized analog clock and digital display with "Quiz Mode" (Hide Digital) for teaching time.
7. **🎲 Dice & Chance Games** (`/tools/chance-games/`)
   - 3D animated rolling dice, metallic coin flipper with statistical counters, and Rock-Paper-Scissors generator.
8. **🔢 Random Number Generator** (`/tools/random-number-generator/`)
   - Custom Min/Max ranges, batch rolls, unique number mode, and recent roll history.
9. **🎯 Multi-Team Tally Counter** (`/tools/tally-counter/`)
   - Multi-team scoreboard for review games, table points, and quick classroom competitions.
10. **🚦 Presentation Timer** (`/tools/presentation-timer/`)
    - Traffic light pacing system (Green, Amber, Red) for student presentations and speeches.
11. **🏁 Fun Race Timers** (`/tools/race-timers/`)
    - Gamified 4-character sprint race for clean-up transitions and quick drills.
12. **🎄 Holiday Countdown Timers** (`/tools/holiday-timers/`)
    - Live countdowns to school breaks, winter holidays, and custom milestone dates.

---

## ⚡ Technical Architecture

- **Zero Runtime Dependencies:** Plain Vanilla HTML5, modern CSS3 variables, and ES6 JavaScript.
- **Synthesized Audio:** Built-in Web Audio API synthesizes gentle chimes, school bells, and fanfares on-device with zero audio asset network latency.
- **Offline PWA:** Service worker caching enables full offline functionality when internet connectivity drops in school buildings.
- **Screen Wake Lock API:** Prevents classroom smartboards and projectors from going into sleep mode mid-lesson.
- **Privacy-First (COPPA/FERPA):** Student rosters are strictly stored in local browser storage (`localStorage`); no student names or data ever leave the device.

---

## 🚀 Cloudflare Pages Deployment

### Build Configuration

| Setting | Value |
| :--- | :--- |
| **Framework preset** | `None` (Static HTML) |
| **Build command** | *None* (Leave empty) |
| **Build output directory** | `.` or `/` (Root directory) |
| **Node.js Version** | N/A (Pure static) |

### Automatic Deployments
Every `git push` to your connected GitHub repository triggers an instant production deployment on Cloudflare's global edge network.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
