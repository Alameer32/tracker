import { DashboardLayout } from "@/components/dashboard-layout"
import { StepsInterface } from "@/components/steps-interface"
import { createClient } from "@/lib/supabase/client"
import { STATIC_USER_ID } from "@/lib/constants"

export default async function StepsPage() {
  const supabase = createClient()

  // Get user profile
  const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", STATIC_USER_ID).single()

  // Get steps logs for the last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const { data: stepsLogs } = await supabase
    .from("steps_logs")
    .select("*")
    .eq("user_id", STATIC_USER_ID)
    .gte("logged_date", thirtyDaysAgo.toISOString().split("T")[0])
    .order("logged_date", { ascending: false })

  // Get today's steps
  const today = new Date().toISOString().split("T")[0]
  const { data: todaySteps } = await supabase
    .from("steps_logs")
    .select("*")
    .eq("user_id", STATIC_USER_ID)
    .eq("logged_date", today)
    .single()

  // Use fallback data if no profile exists yet
  const defaultProfile = {
    name: "User",
    daily_steps_goal: 10000,
  }

  return (
    <DashboardLayout>
      <StepsInterface
        userId={STATIC_USER_ID}
        profile={profile || defaultProfile}
        stepsLogs={stepsLogs || []}
        todaySteps={todaySteps}
      />
    </DashboardLayout>
  )
}
