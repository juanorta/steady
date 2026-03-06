# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Steady — Juan's personal life command center. Not a product, a personal tool. Tracks gym workouts, nutrition, mood/energy, steps, and tasks. Uses Claude AI to generate a personalized daily morning briefing that surfaces patterns across all tracked data.

Core insight: mood, energy, gym performance, and nutrition are deeply connected. This app tracks all of them together.

---

## Tech Stack

### Backend
- Node.js with Express or Fastify
- REST API, JWT auth (single user — keep it simple)
- PostgreSQL database
- Cron job for daily morning briefing generation

### Frontend (Web)
- React + Vite + TypeScript
- SCSS for styling (partials in `web/src/styles/`)
- Recharts (data visualization)
- React Query (data fetching)

### Mobile
- React Native + Expo
- iOS-first; shares business logic with web where possible
- HealthKit integration via `react-native-health` (steps, workouts from Strong via Apple Health)

### AI
- Anthropic Claude API — model: `claude-haiku-4-5` (cost-efficient)
- Used for: daily morning briefing, pattern summarization
- API key: `ANTHROPIC_API_KEY` env var
- Briefing generated once/day via cron, result cached in `daily_briefings` table

---

## Database Schema

```sql
users (id, name, email, created_at)
workouts (id, user_id, date, duration_minutes, notes, created_at)
exercises (id, name, muscle_group, equipment)
workout_sets (id, workout_id, exercise_id, set_number, weight_lbs, reps, is_pr)
nutrition_logs (id, user_id, date, food_name, calories, protein_g, carbs_g, fat_g)
mood_logs (id, user_id, date, mood_score, energy_score, notes)
tasks (id, user_id, title, completed, created_at)
daily_briefings (id, user_id, date, content, generated_at)
```

---

## Development Priorities

1. Backend API + database schema
2. Web frontend (React) — faster to iterate
3. Mobile (Expo) — after web is stable
4. AI briefing — add once data logging is working

---

## Key Integrations

### Strong App → Apple Health → Steady
- Strong syncs workouts to Apple Health automatically
- Steady reads from HealthKit on iOS (`react-native-health` package)
- Fallback: CSV import from Strong's manual export

### Apple HealthKit (iOS)
- Required permissions: `HKQuantityTypeIdentifierStepCount`, `HKWorkoutType`, `HKQuantityTypeIdentifierActiveEnergyBurned`
- Sync on app open + daily background fetch (before morning briefing)
- Declare all data types in `Info.plist`

---

## AI Briefing Tone

The morning briefing should be direct, context-aware, and honest — not generic or corporate. It knows Juan by name and references actual recent data (e.g., "You skipped Monday and your mood dropped to 4/10"). No generic motivational quotes.

---

## What NOT to Build (yet)

- Social features, sharing, or export
- Complex meal planning
- Android Health Connect integration
- Monetization features
