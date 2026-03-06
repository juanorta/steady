import WorkoutDashboard from './components/WorkoutDashboard'

const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
})

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="flex items-center justify-between px-8 py-4 border-b border-border">
        <span className="text-xl font-bold tracking-tight">
          ste<span className="text-primary">a</span>dy
        </span>
        <span className="text-sm text-muted-foreground">{today}</span>
      </header>
      <main className="flex-1 p-8 max-w-6xl w-full mx-auto">
        <WorkoutDashboard />
      </main>
    </div>
  )
}
