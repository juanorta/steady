import { useState } from 'react'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  ReferenceLine,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  stats,
  sessions,
  exerciseHistory,
  exercisePRs,
  monthlyFrequency,
  weeklyVolume,
  getRepsByWeight,
  getExerciseSessionData,
  getExerciseSummary,
  accessoryCategories,
  KEY_EXERCISES,
} from '@/data/parseWorkouts'

// ── Chart colour configs ───────────────────────────────────────────────────────
// Each key maps to a CSS variable injected by ChartContainer (var(--color-KEY))

const liftConfig = {
  bench:    { label: 'Bench Press', color: '#818cf8' },
  squat:    { label: 'Squat',       color: '#4ade80' },
  deadlift: { label: 'Deadlift',    color: '#fb923c' },
  row:      { label: 'Barbell Row', color: '#c084fc' },
  ohp:      { label: 'OHP',         color: '#f472b6' },
} satisfies ChartConfig

const freqConfig = { count:   { label: 'Workouts',    color: '#818cf8' } } satisfies ChartConfig
const volConfig  = { volume:  { label: 'Volume (lbs)', color: '#4ade80' } } satisfies ChartConfig
const repsConfig = { maxReps: { label: 'Max Reps',     color: '#fb923c' } } satisfies ChartConfig

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: '2-digit',
  })
}

function fmtVolume(v: number) {
  return v >= 1_000_000
    ? `${(v / 1_000_000).toFixed(1)}M`
    : v >= 1000
    ? `${(v / 1000).toFixed(0)}k`
    : `${v}`
}

// Maps full exercise name → short liftConfig key
const LIFT_KEY: Record<string, keyof typeof liftConfig> = {
  'Bench Press (Barbell)':    'bench',
  'Squat (Barbell)':          'squat',
  'Deadlift (Barbell)':       'deadlift',
  'Bent Over Row (Barbell)':  'row',
  'Overhead Press (Barbell)': 'ohp',
}

// ── Reusable stat card ────────────────────────────────────────────────────────

function StatCard({ title, value, sub }: { title: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardDescription>{title}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Slightly smaller text on mobile so numbers don't overflow */}
        <p className="text-2xl md:text-3xl font-bold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  )
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab() {
  const last24Months = monthlyFrequency.slice(-24)
  const recentSessions = stats.recentSessions

  return (
    <div className="space-y-6">

      {/* Stats: 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard title="Total Workouts" value={stats.totalSessions} sub={`${fmtDate(stats.firstDate)} → now`} />
        <StatCard title="Exercises Tracked" value={stats.uniqueExercises} />
        <StatCard title="Total Volume" value={`${fmtVolume(stats.totalVolumeLbs)} lbs`} sub="all-time" />
        <StatCard
          title="Avg / Week"
          value={(stats.totalSessions / (weeklyVolume.length || 1)).toFixed(1)}
          sub="workouts per week"
        />
      </div>

      {/* Monthly frequency bar chart — full width at all sizes */}
      <Card>
        <CardHeader>
          <CardTitle>Workout Frequency</CardTitle>
          <CardDescription>Workouts per month</CardDescription>
        </CardHeader>
        <CardContent>
          {/* h-40 on mobile, h-48 on desktop */}
          <ChartContainer config={freqConfig} className="h-40 md:h-48 w-full">
            <BarChart data={last24Months} barCategoryGap="20%">
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={20} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Recent workouts list — full width at all sizes */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Workouts</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {recentSessions.map((s) => (
              <li key={`${s.date}|${s.name}`} className="py-3 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {s.exercises.slice(0, 4).join(' · ')}
                    {s.exercises.length > 4 ? ` +${s.exercises.length - 4}` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">{fmtDate(s.date)}</p>
                  <p className="text-xs text-muted-foreground">{s.duration}</p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Big Lifts Tab ─────────────────────────────────────────────────────────────

function BigLiftsTab() {
  const [selected, setSelected] = useState(KEY_EXERCISES[0])
  const repsByWeight = getRepsByWeight(selected)
  const big3 = ['Bench Press (Barbell)', 'Squat (Barbell)', 'Deadlift (Barbell)'] as const

  // Build monthly data points for the combined progression chart
  const allDates = Array.from(
    new Set(KEY_EXERCISES.flatMap((ex) => exerciseHistory[ex]?.map((p) => p.date) ?? []))
  ).sort()

  const monthlyPoints = (() => {
    const seen = new Set<string>()
    return allDates.filter((d) => {
      const m = d.substring(0, 7)
      if (seen.has(m)) return false
      seen.add(m)
      return true
    })
  })()

  const combinedData = monthlyPoints.map((date) => {
    const row: Record<string, string | number | undefined> = { date }
    for (const ex of KEY_EXERCISES) {
      const point = [...(exerciseHistory[ex] ?? [])].reverse().find((p) => p.date <= date)
      row[LIFT_KEY[ex]] = point?.e1RM
    }
    return row
  })

  return (
    <div className="space-y-6">

      {/* Big 3 snapshot: 1 column on mobile, 3 on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {big3.map((ex) => {
          const history = exerciseHistory[ex]
          const latest = history?.[history.length - 1]
          const pr = exercisePRs.find((p) => p.exercise === ex)
          const key = LIFT_KEY[ex]
          return (
            <Card key={ex}>
              <CardHeader className="pb-1">
                <CardDescription style={{ color: liftConfig[key].color }}>
                  {liftConfig[key].label}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-2xl font-bold">
                  {latest?.e1RM ?? '—'}{' '}
                  <span className="text-sm font-normal text-muted-foreground">lbs e1RM</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  PR: {pr?.bestE1RM} lbs ({pr?.bestWeight}×{pr?.bestReps})
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Combined e1RM progression — all 5 lifts on one chart, full width */}
      <Card>
        <CardHeader>
          <CardTitle>Estimated 1RM Progression</CardTitle>
          <CardDescription>All key lifts over time (Epley formula)</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Taller on desktop for readability */}
          <ChartContainer config={liftConfig} className="h-56 md:h-72 w-full">
            <LineChart data={combinedData}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) =>
                  new Date(v + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                }
                interval={Math.floor(combinedData.length / 6)}
              />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={36} unit=" lbs" />
              <ChartTooltip content={<ChartTooltipContent />} />
              {Object.entries(LIFT_KEY).map(([, key]) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={`var(--color-${key})`}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Per-lift detail — exercise selector + e1RM dots + reps by weight */}
      <Card>
        <CardHeader>
          {/*
            On mobile: title and buttons stack vertically
            On desktop: title left, buttons right
          */}
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:justify-between">
            <div>
              <CardTitle>Lift Detail</CardTitle>
              <CardDescription>Every session for selected exercise</CardDescription>
            </div>
            {/* Exercise selector pills — wrap naturally on mobile */}
            <div className="flex gap-2 flex-wrap">
              {KEY_EXERCISES.map((ex) => {
                const key = LIFT_KEY[ex]
                const active = selected === ex
                return (
                  <button
                    key={ex}
                    onClick={() => setSelected(ex)}
                    className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                      active
                        ? 'text-white border-transparent'
                        : 'text-muted-foreground border-border hover:border-foreground/30'
                    }`}
                    style={active ? { backgroundColor: liftConfig[key].color } : {}}
                  >
                    {liftConfig[key].label}
                  </button>
                )
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* e1RM per session dots */}
          <ChartContainer
            config={{ e1RM: { label: 'e1RM (lbs)', color: liftConfig[LIFT_KEY[selected]].color } }}
            className="h-48 md:h-56 w-full"
          >
            <LineChart data={exerciseHistory[selected]}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) =>
                  new Date(v + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                }
                interval={Math.floor((exerciseHistory[selected]?.length ?? 1) / 6)}
              />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={36} unit=" lbs" />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(val, name) => [`${val} lbs`, name === 'e1RM' ? 'e1RM' : name]}
                  />
                }
              />
              <Line
                type="monotone"
                dataKey="e1RM"
                stroke={liftConfig[LIFT_KEY[selected]].color}
                strokeWidth={2}
                dot={{ r: 2 }}
              />
            </LineChart>
          </ChartContainer>

          {/* Max reps at each weight — gives a "strength curve" picture */}
          <div>
            <p className="text-sm font-medium mb-3">Max Reps by Weight</p>
            <ChartContainer config={repsConfig} className="h-36 md:h-40 w-full">
              <BarChart data={repsByWeight} barCategoryGap="15%">
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="weight" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} unit=" lbs" />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={20} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="maxReps" fill="var(--color-maxReps)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Volume Tab ────────────────────────────────────────────────────────────────

function VolumeTab() {
  const last52 = weeklyVolume.slice(-52)

  return (
    <div className="space-y-6">
      {/* Weekly volume — full width at all sizes */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Volume</CardTitle>
          <CardDescription>Total weight lifted per week (lbs)</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={volConfig} className="h-52 md:h-64 w-full">
            <BarChart data={last52} barCategoryGap="10%">
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) =>
                  new Date(v + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                }
                interval={7}
              />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={40} tickFormatter={fmtVolume} />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(val) => [`${Number(val).toLocaleString()} lbs`, 'Volume']}
                  />
                }
              />
              <Bar dataKey="volume" fill="var(--color-volume)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Sessions per week — full width at all sizes */}
      <Card>
        <CardHeader>
          <CardTitle>Sessions per Week</CardTitle>
          <CardDescription>Workout frequency over the last year</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{ sessions: { label: 'Sessions', color: '#c084fc' } }}
            className="h-40 md:h-48 w-full"
          >
            <BarChart data={last52} barCategoryGap="10%">
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) =>
                  new Date(v + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                }
                interval={7}
              />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={20} />
              <ChartTooltip content={<ChartTooltipContent />} />
              {/* Dashed goal line at 3 sessions/week */}
              <ReferenceLine
                y={3}
                stroke="#6b7280"
                strokeDasharray="4 2"
                label={{ value: 'goal', fontSize: 10, fill: '#6b7280' }}
              />
              <Bar dataKey="sessions" fill="var(--color-sessions)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}

// ── PR Board Tab ──────────────────────────────────────────────────────────────

function PRBoardTab() {
  const top = exercisePRs.slice(0, 40)
  return (
    <Card>
      <CardHeader>
        <CardTitle>PR Board</CardTitle>
        <CardDescription>Best estimated 1RM per exercise (Epley)</CardDescription>
      </CardHeader>
      <CardContent>
        {/*
          overflow-x-auto lets the table scroll horizontally on mobile
          instead of breaking the layout
        */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase tracking-wider">
                <th className="text-left py-2 pr-4 font-medium">#</th>
                <th className="text-left py-2 pr-4 font-medium">Exercise</th>
                <th className="text-right py-2 pr-4 font-medium">e1RM</th>
                {/* Hide "Best Set" column on mobile — too cramped */}
                <th className="text-right py-2 pr-4 font-medium hidden sm:table-cell">Best Set</th>
                <th className="text-right py-2 font-medium hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {top.map((pr, i) => (
                <tr key={pr.exercise} className="hover:bg-muted/30 transition-colors">
                  <td className="py-2 pr-4 text-muted-foreground">{i + 1}</td>
                  <td className="py-2 pr-4 font-medium">{pr.exercise}</td>
                  <td className="py-2 pr-4 text-right font-bold">{pr.bestE1RM} lbs</td>
                  <td className="py-2 pr-4 text-right text-muted-foreground hidden sm:table-cell">
                    {pr.bestWeight} × {pr.bestReps}
                  </td>
                  <td className="py-2 text-right text-muted-foreground hidden sm:table-cell">
                    {fmtDate(pr.bestDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Accessories Tab ───────────────────────────────────────────────────────────

function AccessoriesTab() {
  const firstExercise = Object.values(accessoryCategories)[0]?.[0] ?? ''
  const [selected, setSelected] = useState(firstExercise)

  const sessionData = getExerciseSessionData(selected)
  const summary = getExerciseSummary(selected)
  const repsByWeight = getRepsByWeight(selected)
  const last20 = sessionData.slice(-20)

  // Local chart configs (defined here since they're only used in this tab)
  const accVolConfig = { volume:    { label: 'Volume (lbs)',    color: '#4ade80' } } satisfies ChartConfig
  const wtConfig     = { maxWeight: { label: 'Max Weight (lbs)', color: '#fb923c' } } satisfies ChartConfig
  const repsCfg      = { maxReps:   { label: 'Max Reps',         color: '#c084fc' } } satisfies ChartConfig

  return (
    <div className="space-y-6">

      {/*
        Exercise picker
        Mobile:  full-width select + session count below
        Desktop: inline row with select + session count beside it
      */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <Select value={selected} onValueChange={setSelected}>
          {/* Full width on mobile, fixed width on desktop */}
          <SelectTrigger className="w-full sm:w-80">
            <SelectValue placeholder="Pick an exercise" />
          </SelectTrigger>
          <SelectContent className="max-h-96">
            {Object.entries(accessoryCategories).map(([cat, exercises]) => (
              <SelectGroup key={cat}>
                <SelectLabel>{cat}</SelectLabel>
                {exercises.map((ex) => (
                  <SelectItem key={ex} value={ex}>{ex}</SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
        {selected && (
          <span className="text-sm text-muted-foreground">
            {summary.sessionCount} sessions · first logged {sessionData[0]?.date ?? '—'}
          </span>
        )}
      </div>

      {/*
        Accessory stats — 5 cards
        Mobile:  2 per row (col-span-6), last one full width
        Tablet:  3 per row
        Desktop: all 5 in one row
      */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        <StatCard title="Sessions" value={summary.sessionCount} />
        <StatCard title="Total Volume" value={`${fmtVolume(summary.totalVolume)} lbs`} />
        <StatCard title="Total Sets" value={summary.totalSets} />
        <StatCard title="Avg Weight" value={`${summary.avgWeight} lbs`} />
        <StatCard
          title="Best Set"
          value={summary.bestSet}
          sub={summary.bestE1RM ? `${summary.bestE1RM} lbs e1RM` : undefined}
        />
      </div>

      {/*
        Four charts in a 12-column grid
        Mobile:  each chart is full width (col-span-12)
        Desktop: two charts per row (col-span-6)
      */}
      {/* Charts: 1 column on mobile, 2 on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

        {/* Volume per session */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Volume per Session</CardTitle>
              <CardDescription>Last 20 sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={accVolConfig} className="h-44 md:h-48 w-full">
                <BarChart data={last20} barCategoryGap="15%">
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) =>
                      new Date(v + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }
                    interval={Math.floor(last20.length / 5)}
                  />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={36} tickFormatter={fmtVolume} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(v) => [`${Number(v).toLocaleString()} lbs`, 'Volume']}
                      />
                    }
                  />
                  <Bar dataKey="volume" fill="var(--color-volume)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Max weight trend — shows intensity progression over time */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Max Weight Over Time</CardTitle>
              <CardDescription>Heaviest set per session</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={wtConfig} className="h-44 md:h-48 w-full">
                <LineChart data={sessionData}>
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) =>
                      new Date(v + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                    }
                    interval={Math.floor(sessionData.length / 6)}
                  />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={36} unit=" lbs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="maxWeight"
                    stroke="var(--color-maxWeight)"
                    strokeWidth={2}
                    dot={{ r: 2 }}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Sets per session — shows training volume load over time */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Sets per Session</CardTitle>
              <CardDescription>Training volume load</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{ sets: { label: 'Sets', color: '#818cf8' } }}
                className="h-44 md:h-48 w-full"
              >
                <BarChart data={last20} barCategoryGap="15%">
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) =>
                      new Date(v + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }
                    interval={Math.floor(last20.length / 5)}
                  />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={20} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="sets" fill="var(--color-sets)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

        {/* Max reps by weight — the "strength curve" for this exercise */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Max Reps by Weight</CardTitle>
              <CardDescription>Best rep count at each load</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={repsCfg} className="h-44 md:h-48 w-full">
                <BarChart data={repsByWeight} barCategoryGap="15%">
                  <CartesianGrid vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="weight" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} unit=" lbs" />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={20} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="maxReps" fill="var(--color-maxReps)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}

// ── History Tab ───────────────────────────────────────────────────────────────

function HistoryTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>All Workouts</CardTitle>
        <CardDescription>{sessions.length} sessions total</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border max-h-[600px] overflow-y-auto">
          {[...sessions].reverse().map((s) => (
            <li key={`${s.date}|${s.name}`} className="py-3 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm">{s.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {s.exercises.slice(0, 5).join(' · ')}
                  {s.exercises.length > 5 ? ` +${s.exercises.length - 5}` : ''}
                </p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="secondary" className="text-[10px] h-4">{s.totalSets} sets</Badge>
                  <Badge variant="outline" className="text-[10px] h-4">{fmtVolume(Math.round(s.totalVolume))} lbs</Badge>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">{fmtDate(s.date)}</p>
                <p className="text-xs text-muted-foreground">{s.duration}</p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function WorkoutDashboard() {
  return (
    // Single Card wraps everything so TabsList and TabsContent share one parent border/bg
    <Card className="gap-0 py-0 overflow-hidden bg-transparent border-transparent shadow-none">
      <Tabs defaultValue="overview">
        {/* Tab nav sits in its own padded row with a bottom border as a visual divider */}
        <div className="px-4 py-3 md:px-6 md:py-4 border-b border-border overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <TabsList className="flex w-max md:grid md:w-full md:grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="lifts">Big Lifts</TabsTrigger>
            <TabsTrigger value="accessories">Accessories</TabsTrigger>
            <TabsTrigger value="volume">Volume</TabsTrigger>
            <TabsTrigger value="prs">PR Board</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
        </div>

        {/* Tab content sits in a padded area below the nav */}
        <div className="p-4 md:p-6 space-y-6">
          <TabsContent value="overview">     <OverviewTab /></TabsContent>
          <TabsContent value="lifts">       <BigLiftsTab /></TabsContent>
          <TabsContent value="accessories"> <AccessoriesTab /></TabsContent>
          <TabsContent value="volume">      <VolumeTab /></TabsContent>
          <TabsContent value="prs">         <PRBoardTab /></TabsContent>
          <TabsContent value="history">     <HistoryTab /></TabsContent>
        </div>
      </Tabs>
    </Card>
  )
}
