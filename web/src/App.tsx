import WorkoutDashboard from './components/WorkoutDashboard'

const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
})

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {/*
        Header
        - Mobile: tight padding (px-4 py-3)
        - Desktop: more breathing room (md:px-8 md:py-4)
      */}
      <header className="flex items-center justify-between px-4 py-3 md:px-8 md:py-4 border-b border-border">
        <span className="text-xl font-bold tracking-tight">
          ste<span className="text-primary">a</span>dy
        </span>
        {/* Hide full date on very small screens, show short version */}
        <span className="text-sm text-muted-foreground hidden sm:block">{today}</span>
        <span className="text-sm text-muted-foreground sm:hidden">
          {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      </header>

      {/*
        Main content
        - Mobile: p-4 (tight, maximise chart space)
        - Desktop: p-8 (more padding, wider max-width)
      */}
      <main className="flex-1 p-4 md:p-8 max-w-6xl w-full mx-auto">
        <WorkoutDashboard />
      </main>
    </div>
  )
}
