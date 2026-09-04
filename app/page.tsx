import { redirect } from "next/navigation"
import { getCurrentMember } from "@/lib/session"
import Onboarding from "@/components/onboarding"

export default async function HomePage() {
  const member = await getCurrentMember()
  if (member) redirect("/space")
  return <Onboarding />
}
