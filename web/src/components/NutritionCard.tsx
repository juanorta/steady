import { Card, CardHeader, CardTitle, CardAction, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

const goal = 2400
const consumed = 1840
const macros = [
  { label: 'Protein', value: '182g' },
  { label: 'Carbs', value: '210g' },
  { label: 'Fat', value: '58g' },
]

export default function NutritionCard() {
  const pct = Math.min((consumed / goal) * 100, 100)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nutrition</CardTitle>
        <CardAction>
          <Button variant="ghost" size="sm">Log food</Button>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <span className="text-3xl font-bold">{consumed.toLocaleString()}</span>
          <span className="text-sm text-muted-foreground"> / {goal.toLocaleString()} kcal</span>
        </div>
        <Progress value={pct} className="h-1.5" />
        <div className="flex gap-6">
          {macros.map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5">
              <span className="font-semibold">{value}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
