import Papa from 'papaparse'
import rawCsv from './strong_steady-alpha.csv?raw'

// Epley estimated 1RM formula
function epley(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0
  if (reps === 1) return weight
  const r = Math.min(reps, 15) // less accurate above 15
  return Math.round(weight * (1 + r / 30))
}

interface RawRow {
  Date: string
  'Workout Name': string
  Duration: string
  'Exercise Name': string
  'Set Order': string
  Weight: string
  Reps: string
}

export interface WorkoutSet {
  date: string
  workoutName: string
  exercise: string
  weight: number
  reps: number
  e1RM: number
  isWarmup: boolean
}

export interface WorkoutSession {
  date: string
  name: string
  duration: string
  exercises: string[]
  totalVolume: number
  totalSets: number
}

export interface ExercisePR {
  exercise: string
  bestE1RM: number
  bestWeight: number
  bestReps: number
  bestDate: string
}

export interface WeeklyVolume {
  week: string
  volume: number
  sessions: number
}

export interface MonthlyFrequency {
  month: string
  label: string
  count: number
}

// ── Parse ─────────────────────────────────────────────────────────────────────

const parsed = Papa.parse<RawRow>(rawCsv, {
  header: true,
  skipEmptyLines: true,
})

export const allSets: WorkoutSet[] = parsed.data
  .filter((r: RawRow) => r['Exercise Name'] && r.Date)
  .map((r: RawRow) => {
    const weight = parseFloat(r.Weight) || 0
    const reps = parseFloat(r.Reps) || 0
    const isWarmup = r['Set Order']?.toUpperCase() === 'W'
    return {
      date: r.Date.split(' ')[0],
      workoutName: r['Workout Name'] || '',
      exercise: r['Exercise Name'] || '',
      weight,
      reps,
      e1RM: isWarmup ? 0 : epley(weight, reps),
      isWarmup,
    }
  })

// ── Sessions ──────────────────────────────────────────────────────────────────

const sessionMap = new Map<string, WorkoutSession>()
const durationMap = new Map<string, string>()

for (const r of parsed.data) {
  if (!r.Date) continue
  const key = `${r.Date.split(' ')[0]}|${r['Workout Name']}`
  if (!durationMap.has(key)) durationMap.set(key, r.Duration || '')
}

for (const set of allSets) {
  const key = `${set.date}|${set.workoutName}`
  if (!sessionMap.has(key)) {
    sessionMap.set(key, {
      date: set.date,
      name: set.workoutName,
      duration: durationMap.get(key) || '',
      exercises: [],
      totalVolume: 0,
      totalSets: 0,
    })
  }
  const s = sessionMap.get(key)!
  if (!s.exercises.includes(set.exercise)) s.exercises.push(set.exercise)
  s.totalVolume += set.weight * set.reps
  s.totalSets++
}

export const sessions: WorkoutSession[] = Array.from(sessionMap.values()).sort(
  (a, b) => a.date.localeCompare(b.date),
)

// ── PRs ───────────────────────────────────────────────────────────────────────

const prMap = new Map<string, ExercisePR>()
for (const set of allSets) {
  if (set.isWarmup || set.e1RM <= 0) continue
  const ex = prMap.get(set.exercise)
  if (!ex || set.e1RM > ex.bestE1RM) {
    prMap.set(set.exercise, {
      exercise: set.exercise,
      bestE1RM: set.e1RM,
      bestWeight: set.weight,
      bestReps: set.reps,
      bestDate: set.date,
    })
  }
}

export const exercisePRs: ExercisePR[] = Array.from(prMap.values()).sort(
  (a, b) => b.bestE1RM - a.bestE1RM,
)

// ── Exercise history (best e1RM per date) ─────────────────────────────────────

export const KEY_EXERCISES = [
  'Bench Press (Barbell)',
  'Squat (Barbell)',
  'Deadlift (Barbell)',
  'Bent Over Row (Barbell)',
  'Overhead Press (Barbell)',
]

export type ExerciseHistoryPoint = {
  date: string
  e1RM: number
  weight: number
  reps: number
}

function buildExerciseHistory(exercise: string): ExerciseHistoryPoint[] {
  const dateMap = new Map<string, ExerciseHistoryPoint>()
  for (const set of allSets) {
    if (set.exercise !== exercise || set.isWarmup || set.e1RM <= 0) continue
    const ex = dateMap.get(set.date)
    if (!ex || set.e1RM > ex.e1RM) {
      dateMap.set(set.date, {
        date: set.date,
        e1RM: set.e1RM,
        weight: set.weight,
        reps: set.reps,
      })
    }
  }
  return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date))
}

export const exerciseHistory: Record<string, ExerciseHistoryPoint[]> = {}
for (const ex of KEY_EXERCISES) {
  exerciseHistory[ex] = buildExerciseHistory(ex)
}

// ── Reps by weight (best reps at each weight for a given exercise) ─────────────

export function getRepsByWeight(exercise: string): { weight: number; maxReps: number }[] {
  const map = new Map<number, number>()
  for (const set of allSets) {
    if (set.exercise !== exercise || set.isWarmup || set.weight <= 0) continue
    const cur = map.get(set.weight)
    if (cur === undefined || set.reps > cur) map.set(set.weight, set.reps)
  }
  return Array.from(map.entries())
    .map(([weight, maxReps]) => ({ weight, maxReps }))
    .sort((a, b) => a.weight - b.weight)
}

// ── Weekly volume ─────────────────────────────────────────────────────────────

function getMondayStr(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().split('T')[0]
}

const weekMap = new Map<string, { volume: number; sessions: Set<string> }>()
for (const set of allSets) {
  const week = getMondayStr(set.date)
  if (!weekMap.has(week)) weekMap.set(week, { volume: 0, sessions: new Set() })
  const w = weekMap.get(week)!
  w.volume += set.weight * set.reps
  w.sessions.add(`${set.date}|${set.workoutName}`)
}

export const weeklyVolume: WeeklyVolume[] = Array.from(weekMap.entries())
  .map(([week, d]) => ({ week, volume: Math.round(d.volume), sessions: d.sessions.size }))
  .sort((a, b) => a.week.localeCompare(b.week))

// ── Monthly frequency ─────────────────────────────────────────────────────────

const monthMap = new Map<string, Set<string>>()
for (const s of sessions) {
  const m = s.date.substring(0, 7)
  if (!monthMap.has(m)) monthMap.set(m, new Set())
  monthMap.get(m)!.add(`${s.date}|${s.name}`)
}

export const monthlyFrequency: MonthlyFrequency[] = Array.from(monthMap.entries())
  .map(([month, set]) => ({
    month,
    label: new Date(month + '-02').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
    count: set.size,
  }))
  .sort((a, b) => a.month.localeCompare(b.month))

// ── Accessory categories ──────────────────────────────────────────────────────

const CATEGORY_PATTERNS: [string, RegExp][] = [
  ['Biceps',         /curl/i],
  ['Triceps',        /tricep|pushdown|push.?down|skull|skullcrusher/i],
  ['Shoulders',      /lateral.?raise|face.?pull|shoulder.?press/i],
  ['Lats',           /lat.?pull|pulldown/i],
  ['Rows',           /row/i],
  ['Chest',          /chest|fly|press/i],
  ['Legs',           /leg.?curl|leg.?ext|leg.?press|hack.?squat|lunge|split.?squat|calf|supercat/i],
  ['Posterior Chain',/romanian|back.?ext|glute|reverse.?hyper/i],
  ['Other',          /.*/],
]

function categorizeExercise(name: string): string {
  if ((KEY_EXERCISES as readonly string[]).includes(name)) return '__main__'
  for (const [cat, re] of CATEGORY_PATTERNS) {
    if (re.test(name)) return cat
  }
  return 'Other'
}

const _allExercises = Array.from(new Set(allSets.map((s) => s.exercise))).sort()

export const accessoryCategories: Record<string, string[]> = {}
for (const ex of _allExercises) {
  const cat = categorizeExercise(ex)
  if (cat === '__main__') continue
  if (!accessoryCategories[cat]) accessoryCategories[cat] = []
  accessoryCategories[cat].push(ex)
}

// ── Per-exercise session data ─────────────────────────────────────────────────

export interface ExerciseSession {
  date: string
  volume: number
  maxWeight: number
  totalReps: number
  sets: number
  avgWeight: number
}

export function getExerciseSessionData(exercise: string): ExerciseSession[] {
  const map = new Map<string, ExerciseSession>()
  for (const set of allSets) {
    if (set.exercise !== exercise || set.isWarmup || set.weight <= 0) continue
    if (!map.has(set.date)) {
      map.set(set.date, { date: set.date, volume: 0, maxWeight: 0, totalReps: 0, sets: 0, avgWeight: 0 })
    }
    const s = map.get(set.date)!
    s.volume += set.weight * set.reps
    s.maxWeight = Math.max(s.maxWeight, set.weight)
    s.totalReps += set.reps
    s.sets++
  }
  return Array.from(map.values())
    .map((s) => ({ ...s, volume: Math.round(s.volume), avgWeight: s.totalReps > 0 ? Math.round(s.volume / s.totalReps) : 0 }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function getExerciseSummary(exercise: string) {
  const data = getExerciseSessionData(exercise)
  const pr = exercisePRs.find((p) => p.exercise === exercise)
  const totalVolume = data.reduce((s, r) => s + r.volume, 0)
  const totalReps = data.reduce((s, r) => s + r.totalReps, 0)
  const totalSets = data.reduce((s, r) => s + r.sets, 0)
  const maxWeight = data.reduce((m, r) => Math.max(m, r.maxWeight), 0)
  const months = new Set(data.map((s) => s.date.substring(0, 7))).size
  return {
    sessionCount: data.length,
    totalVolume: Math.round(totalVolume),
    totalSets,
    totalReps,
    avgWeight: totalReps > 0 ? Math.round(totalVolume / totalReps) : 0,
    maxWeight,
    bestE1RM: pr?.bestE1RM ?? 0,
    bestSet: pr ? `${pr.bestWeight} × ${pr.bestReps}` : '—',
    sessionsPerMonth: months > 0 ? (data.length / months).toFixed(1) : '0',
  }
}

// ── Summary stats ─────────────────────────────────────────────────────────────

export const stats = {
  totalSessions: sessions.length,
  firstDate: sessions[0]?.date ?? '',
  lastDate: sessions[sessions.length - 1]?.date ?? '',
  totalVolumeLbs: Math.round(allSets.reduce((s, r) => s + r.weight * r.reps, 0)),
  uniqueExercises: new Set(allSets.map((s) => s.exercise)).size,
  recentSessions: sessions.slice(-8).reverse(),
}
