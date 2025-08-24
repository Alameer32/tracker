import { redirect } from "next/navigation"

export default async function HomePage() {
  // For now, redirect to profile setup - in a real app you might check localStorage or a cookie
  // to determine if the user has completed setup
  redirect("/profile/setup")
}
