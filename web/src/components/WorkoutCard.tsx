import { Card, CardHeader, CardTitle, CardAction, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const week = [
  { date: 'Mon', completed: true },
  { date: 'Tue', completed: true },
  { date: 'Wed', completed: false },
  { date: 'Thu', completed: true },
  { date: 'Fri', completed: false },
  { date: 'Sat', completed: false },
  { date: 'Sun', completed: false },
]

export default function WorkoutCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workouts</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm">Log workout</Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold">3</span>
          <span className="text-sm text-muted-foreground">day streak</span>
          <Badge variant="secondary">🔥</Badge>
        </div>
        <div className="flex gap-1">
          {week.map((day) => (
            <div key={day.date} className="flex flex-1 flex-col items-center gap-1.5">
              <div className={`size-2 rounded-full ${day.completed ? 'bg-primary' : 'bg-muted'}`} />
              <span className="text-[11px] text-muted-foreground">{day.date}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
