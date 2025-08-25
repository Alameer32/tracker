import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { STATIC_USER_ID } from "@/lib/constants"

export default async function HomePage() {
  try {
    const supabase = createClient()
    
    // Check if user profile exists in database
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', STATIC_USER_ID)
      .single()

    if (error || !profile) {
      // No profile found, redirect to setup
      redirect('/profile/setup')
    } else {
      // Profile exists, redirect to dashboard
      redirect('/dashboard')
    }
  } catch (error) {
    console.error('Error checking profile:', error)
    // On error, redirect to setup
    redirect('/profile/setup')
  }
}
