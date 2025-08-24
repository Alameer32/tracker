import { DashboardLayout } from "@/components/dashboard-layout"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { createClient } from "@/lib/supabase/client"
import { STATIC_USER_ID } from "@/lib/constants"

export default async function AnalyticsPage() {
  const supabase = createClient()

  // Get user profile
  const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", STATIC_USER_ID).single()

  // Get food logs for the last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const { data: foodLogs } = await supabase
    .from("food_logs")
    .select(`
      *,
      food_items (
        id,
        name,
        brand,
        serving_size,
        calories,
        protein_g,
        carbs_g,
        fat_g,
        fiber_g,
        sugar_g,
        sodium_mg,
        category
      )
    `)
    .eq("user_id", STATIC_USER_ID)
    .gte("logged_date", thirtyDaysAgo.toISOString().split("T")[0])
    .order("logged_date", { ascending: false })

  // Get steps logs for the last 30 days
  const { data: stepsLogs } = await supabase
    .from("steps_logs")
    .select("*")
    .eq("user_id", STATIC_USER_ID)
    .gte("logged_date", thirtyDaysAgo.toISOString().split("T")[0])
    .order("logged_date", { ascending: false })

  // Use fallback data if no profile exists yet
  const defaultProfile = {
    name: "User",
    daily_calories: 2000,
    daily_protein_g: 125,
    daily_carbs_g: 225,
    daily_fat_g: 67,
    daily_steps_goal: 10000,
  }

  return (
    <DashboardLayout>
      <AnalyticsDashboard profile={profile || defaultProfile} foodLogs={foodLogs || []} stepsLogs={stepsLogs || []} />
    </DashboardLayout>
  )
}
