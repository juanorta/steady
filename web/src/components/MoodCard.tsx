import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'

export default function MoodCard() {
  const [mood, setMood] = useState(7)
  const [energy, setEnergy] = useState(6)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mood & Energy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="w-14 text-sm text-muted-foreground">Mood</span>
            <Slider min={1} max={10} value={[mood]} onValueChange={([v]) => setMood(v)} className="flex-1" />
            <span className="w-4 text-right text-sm font-semibold">{mood}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="w-14 text-sm text-muted-foreground">Energy</span>
            <Slider min={1} max={10} value={[energy]} onValueChange={([v]) => setEnergy(v)} className="flex-1" />
            <span className="w-4 text-right text-sm font-semibold">{energy}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button size="sm">Save</Button>
      </CardFooter>
    </Card>
  )
}
