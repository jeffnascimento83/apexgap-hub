import { getSession } from '../lib/session'
import { redirect } from 'next/navigation'
import HubShell from '../components/HubShell'

export default async function Page() {
  const session = await getSession()
  if (!session) redirect('/login')
  return <HubShell session={session} />
}
