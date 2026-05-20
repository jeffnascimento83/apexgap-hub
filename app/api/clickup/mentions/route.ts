import { NextResponse } from 'next/server'

const CLICKUP_TOKEN = process.env.CLICKUP_API_TOKEN!
const TEAM_ID = '9013975152'
const MY_USER_ID = 112021354

async function clickup(path: string) {
  const res = await fetch(`https://api.clickup.com/api/v2${path}`, {
    headers: { Authorization: CLICKUP_TOKEN },
    next: { revalidate: 0 },
  })
  if (!res.ok) return null
  return res.json()
}

function hasMention(comment: any[]): boolean {
  return comment.some((seg: any) => {
    const mention = seg?.attributes?.mention
    return mention?.type === 'user' && Number(mention?.id) === MY_USER_ID
  })
}

export async function GET() {
  const since = Date.now() - 7 * 24 * 60 * 60 * 1000

  const data = await clickup(
    `/team/${TEAM_ID}/task?date_updated_gt=${since}&limit=30&include_closed=true&order_by=updated`
  )
  if (!data) return NextResponse.json([])

  const tasks: any[] = data.tasks ?? []

  const results = await Promise.all(
    tasks.map(async (task: any) => {
      const cd = await clickup(`/task/${task.id}/comment`)
      if (!cd?.comments?.length) return null

      const matching = cd.comments.filter((c: any) =>
        Array.isArray(c.comment) && hasMention(c.comment)
      )
      if (!matching.length) return null

      return matching.map((c: any) => ({
        taskId: task.id,
        taskName: task.name,
        taskUrl: task.url,
        commentId: c.id,
        commentText: c.comment_text,
        author: c.user?.username ?? 'Alguém',
        date: Number(c.date),
      }))
    })
  )

  const mentions = results
    .filter(Boolean)
    .flat()
    .sort((a: any, b: any) => b.date - a.date)
    .slice(0, 20)

  return NextResponse.json(mentions)
}
