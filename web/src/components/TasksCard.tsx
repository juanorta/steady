import { Card, CardHeader, CardTitle, CardAction, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

const tasks = [
  { id: 1, title: 'Book physio appointment', completed: false },
  { id: 2, title: 'Review Q1 goals', completed: false },
  { id: 3, title: 'Order protein powder', completed: true },
]

export default function TasksCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tasks</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm">Add task</Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center gap-3">
              <Checkbox id={`task-${task.id}`} defaultChecked={task.completed} />
              <label
                htmlFor={`task-${task.id}`}
                className={`cursor-pointer text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}
              >
                {task.title}
              </label>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
