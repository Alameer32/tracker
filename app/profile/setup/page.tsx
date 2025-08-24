"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { STATIC_USER_ID } from "@/lib/constants"

interface ProfileData {
  name: string
  age: string
  gender: string
  height_cm: string
  weight_kg: string
  activity_level: string
  daily_steps_goal: string
}

export default function ProfileSetupPage() {
  const [formData, setFormData] = useState<ProfileData>({
    name: "",
    age: "",
    gender: "",
    height_cm: "",
    weight_kg: "",
    activity_level: "moderately_active",
    daily_steps_goal: "10000",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const calculateNutritionGoals = (data: ProfileData) => {
    const age = Number.parseInt(data.age)
    const height = Number.parseInt(data.height_cm)
    const weight = Number.parseFloat(data.weight_kg)
    const isMale = data.gender === "male"

    // Calculate BMR using Mifflin-St Jeor Equation
    let bmr: number
    if (isMale) {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161
    }

    // Apply activity multiplier
    const activityMultipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725,
      extra_active: 1.9,
    }

    const tdee = bmr * activityMultipliers[data.activity_level as keyof typeof activityMultipliers]

    // Calculate macros (standard ratios)
    const calories = Math.round(tdee)
    const protein = Math.round((calories * 0.25) / 4) // 25% of calories from protein
    const carbs = Math.round((calories * 0.45) / 4) // 45% of calories from carbs
    const fat = Math.round((calories * 0.3) / 9) // 30% of calories from fat

    return {
      daily_calories: calories,
      daily_protein_g: protein,
      daily_carbs_g: carbs,
      daily_fat_g: fat,
      daily_fiber_g: Math.round((calories / 1000) * 14), // 14g per 1000 calories
      daily_sugar_g: Math.round((calories * 0.1) / 4), // 10% of calories from sugar
      daily_sodium_mg: 2300, // Standard recommendation
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const nutritionGoals = calculateNutritionGoals(formData)

      const profileData = {
        id: STATIC_USER_ID, // Use static UUID instead of "user-1"
        name: formData.name,
        age: Number.parseInt(formData.age),
        gender: formData.gender,
        height_cm: Number.parseInt(formData.height_cm),
        weight_kg: Number.parseFloat(formData.weight_kg),
        activity_level: formData.activity_level,
        daily_steps_goal: Number.parseInt(formData.daily_steps_goal),
        ...nutritionGoals,
      }

      // Store profile in localStorage for now (in production, you'd still use Supabase but without auth)
      localStorage.setItem("userProfile", JSON.stringify(profileData))

      router.push("/dashboard")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (field: keyof ProfileData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-primary">Welcome to NutriTracker</CardTitle>
          <CardDescription className="text-lg">
            Let's set up your profile to calculate your personalized nutrition goals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => updateFormData("age", e.target.value)}
                  placeholder="Enter your age"
                  min="13"
                  max="120"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={formData.gender} onValueChange={(value) => updateFormData("gender", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={formData.height_cm}
                  onChange={(e) => updateFormData("height_cm", e.target.value)}
                  placeholder="170"
                  min="100"
                  max="250"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  value={formData.weight_kg}
                  onChange={(e) => updateFormData("weight_kg", e.target.value)}
                  placeholder="70.0"
                  min="30"
                  max="300"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity">Activity Level</Label>
              <Select
                value={formData.activity_level}
                onValueChange={(value) => updateFormData("activity_level", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary (little/no exercise)</SelectItem>
                  <SelectItem value="lightly_active">Lightly Active (light exercise 1-3 days/week)</SelectItem>
                  <SelectItem value="moderately_active">Moderately Active (moderate exercise 3-5 days/week)</SelectItem>
                  <SelectItem value="very_active">Very Active (hard exercise 6-7 days/week)</SelectItem>
                  <SelectItem value="extra_active">Extra Active (very hard exercise, physical job)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="steps_goal">Daily Steps Goal</Label>
              <Input
                id="steps_goal"
                type="number"
                value={formData.daily_steps_goal}
                onChange={(e) => updateFormData("daily_steps_goal", e.target.value)}
                placeholder="10000"
                min="1000"
                max="50000"
                required
              />
            </div>

            {error && (
              <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 border border-destructive/20 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? "Setting up your profile..." : "Complete Setup"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
