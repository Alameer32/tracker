import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardOverview } from "@/components/dashboard-overview"
import { createClient } from "@/lib/supabase/client"
import { STATIC_USER_ID } from "@/lib/constants"

export default async function DashboardPage() {
  const supabase = createClient()

  // Get user profile
  const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", STATIC_USER_ID).single()

  // Get today's food logs
  const today = new Date().toISOString().split("T")[0]
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
    .eq("logged_date", today)
    .order("created_at", { ascending: false })

  // Get today's steps log
  const { data: stepsLog } = await supabase
    .from("steps_logs")
    .select("*")
    .eq("user_id", STATIC_USER_ID)
    .eq("logged_date", today)
    .single()

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
      <DashboardOverview profile={profile || defaultProfile} foodLogs={foodLogs || []} stepsLog={stepsLog} />
    </DashboardLayout>
  )
}
