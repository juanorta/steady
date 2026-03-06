import { Card, CardHeader, CardTitle, CardAction, CardContent } from '@/components/ui/card'

const briefing = `Juan, you hit the gym 3 days in a row — don't stop now. Your mood has been trending up since Monday. Today is pull day. Hit your 185lb row PR and get out.`

export default function MorningBriefing() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Morning Briefing</CardTitle>
        <CardAction>
          <span className="text-xs text-muted-foreground">Generated 6:00 AM</span>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-base leading-relaxed">{briefing}</p>
      </CardContent>
    </Card>
  )
}
