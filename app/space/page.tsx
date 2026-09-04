import { redirect } from "next/navigation"
import { getSpaceState } from "@/app/actions"
import AppClient from "@/components/app-client"

export const dynamic = "force-dynamic"

export default async function SpacePage() {
  const state = await getSpaceState()
  if (!state) redirect("/")
  return <AppClient initial={state} />
}
