"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  User, 
  Target, 
  Settings, 
  BarChart3, 
  Download, 
  Upload, 
  Trash2, 
  Save,
  Edit3,
  X,
  Check,
  Activity,
  Scale,
  Ruler,
  Calendar,
  TrendingUp
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { STATIC_USER_ID } from "@/lib/constants"

interface ProfileData {
  id: string
  name: string
  age: number
  gender: string
  height_cm: number
  weight_kg: number
  activity_level: string
  daily_calories: number
  daily_protein_g: number
  daily_carbs_g: number
  daily_fat_g: number
  daily_fiber_g: number
  daily_sugar_g: number
  daily_sodium_mg: number
  daily_steps_goal: number
}

interface AppSettings {
  darkMode: boolean
  notifications: boolean
  autoSync: boolean
  dataRetention: number
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<AppSettings>({
    darkMode: false,
    notifications: true,
    autoSync: true,
    dataRetention: 365
  })
  const [stats, setStats] = useState({
    totalFoodLogs: 0,
    totalSteps: 0,
    streakDays: 0,
    averageCalories: 0
  })
  
  const router = useRouter()

  useEffect(() => {
    loadProfile()
    loadStats()
  }, [])

  const loadProfile = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', STATIC_USER_ID)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error loading profile:', error)
      // Fallback to localStorage
      const stored = localStorage.getItem('userProfile')
      if (stored) {
        setProfile(JSON.parse(stored))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const supabase = createClient()
      
      // Get food logs count
      const { count: foodCount } = await supabase
        .from('food_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', STATIC_USER_ID)

      // Get steps logs count
      const { count: stepsCount } = await supabase
        .from('steps_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', STATIC_USER_ID)

      setStats({
        totalFoodLogs: foodCount || 0,
        totalSteps: stepsCount || 0,
        streakDays: 7, // Placeholder - would calculate actual streak
        averageCalories: 1850 // Placeholder - would calculate from food logs
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleSaveProfile = async () => {
    if (!profile) return
    
    setIsSaving(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('user_profiles')
        .upsert(profile)

      if (error) throw error

      // Also save to localStorage as backup
      localStorage.setItem('userProfile', JSON.stringify(profile))
      
      setIsEditing(false)
    } catch (error) {
      setError('Failed to save profile')
      console.error('Error saving profile:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const exportData = async () => {
    try {
      const supabase = createClient()
      
      // Export food logs
      const { data: foodLogs } = await supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', STATIC_USER_ID)

      // Export steps logs
      const { data: stepsLogs } = await supabase
        .from('steps_logs')
        .select('*')
        .eq('user_id', STATIC_USER_ID)

      const exportData = {
        profile,
        foodLogs: foodLogs || [],
        stepsLogs: stepsLogs || [],
        exportDate: new Date().toISOString()
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nutritracker-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      setError('Failed to export data')
      console.error('Error exporting data:', error)
    }
  }

  const clearData = async () => {
    if (!confirm('Are you sure you want to clear all your data? This action cannot be undone.')) {
      return
    }

    try {
      const supabase = createClient()
      
      // Clear food logs
      await supabase
        .from('food_logs')
        .delete()
        .eq('user_id', STATIC_USER_ID)

      // Clear steps logs
      await supabase
        .from('steps_logs')
        .delete()
        .eq('user_id', STATIC_USER_ID)

      // Reset profile to defaults
      const defaultProfile = {
        id: STATIC_USER_ID,
        name: 'User',
        age: 30,
        gender: 'other',
        height_cm: 170,
        weight_kg: 70,
        activity_level: 'moderately_active',
        daily_calories: 2000,
        daily_protein_g: 150,
        daily_carbs_g: 250,
        daily_fat_g: 67,
        daily_fiber_g: 25,
        daily_sugar_g: 50,
        daily_sodium_mg: 2300,
        daily_steps_goal: 10000
      }

      await supabase
        .from('user_profiles')
        .upsert(defaultProfile)

      setProfile(defaultProfile)
      localStorage.setItem('userProfile', JSON.stringify(defaultProfile))
      
      router.push('/dashboard')
    } catch (error) {
      setError('Failed to clear data')
      console.error('Error clearing data:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>Please set up your profile first</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/profile/setup')} className="w-full">
              Set Up Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Profile & Settings</h1>
            <p className="text-muted-foreground">Manage your profile, goals, and app preferences</p>
          </div>
          <Button onClick={() => router.push('/dashboard')} variant="outline">
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <CardTitle>Profile Information</CardTitle>
                  </div>
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex space-x-2">
                      <Button onClick={handleSaveProfile} size="sm" disabled={isSaving}>
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? 'Saving...' : 'Save'}
                      </Button>
                      <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    {isEditing ? (
                      <Input
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{profile.name}</p>
                    )}
                  </div>
                  <div>
                    <Label>Age</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={profile.age}
                        onChange={(e) => setProfile({ ...profile, age: parseInt(e.target.value) })}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{profile.age} years</p>
                    )}
                  </div>
                  <div>
                    <Label>Gender</Label>
                    {isEditing ? (
                      <Select value={profile.gender} onValueChange={(value) => setProfile({ ...profile, gender: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-muted-foreground capitalize">{profile.gender}</p>
                    )}
                  </div>
                  <div>
                    <Label>Activity Level</Label>
                    {isEditing ? (
                      <Select value={profile.activity_level} onValueChange={(value) => setProfile({ ...profile, activity_level: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sedentary">Sedentary</SelectItem>
                          <SelectItem value="lightly_active">Lightly Active</SelectItem>
                          <SelectItem value="moderately_active">Moderately Active</SelectItem>
                          <SelectItem value="very_active">Very Active</SelectItem>
                          <SelectItem value="extra_active">Extra Active</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm text-muted-foreground capitalize">{profile.activity_level.replace('_', ' ')}</p>
                    )}
                  </div>
                  <div>
                    <Label>Height</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={profile.height_cm}
                        onChange={(e) => setProfile({ ...profile, height_cm: parseInt(e.target.value) })}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{profile.height_cm} cm</p>
                    )}
                  </div>
                  <div>
                    <Label>Weight</Label>
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.1"
                        value={profile.weight_kg}
                        onChange={(e) => setProfile({ ...profile, weight_kg: parseFloat(e.target.value) })}
                      />
                    ) : (
                      <p className="text-sm text-muted-foreground">{profile.weight_kg} kg</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Nutrition Goals */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <CardTitle>Nutrition Goals</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{profile.daily_calories}</div>
                    <div className="text-sm text-muted-foreground">Calories</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{profile.daily_protein_g}g</div>
                    <div className="text-sm text-muted-foreground">Protein</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{profile.daily_carbs_g}g</div>
                    <div className="text-sm text-muted-foreground">Carbs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{profile.daily_fat_g}g</div>
                    <div className="text-sm text-muted-foreground">Fat</div>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Fiber:</span> {profile.daily_fiber_g}g
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sugar:</span> {profile.daily_sugar_g}g
                  </div>
                  <div>
                    <span className="text-muted-foreground">Sodium:</span> {profile.daily_sodium_mg}mg
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* App Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Settings className="h-5 w-5" />
                  <CardTitle>App Settings</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">Use dark theme</p>
                  </div>
                  <Switch
                    checked={settings.darkMode}
                    onCheckedChange={(checked) => setSettings({ ...settings, darkMode: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive reminders and updates</p>
                  </div>
                  <Switch
                    checked={settings.notifications}
                    onCheckedChange={(checked) => setSettings({ ...settings, notifications: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto Sync</Label>
                    <p className="text-sm text-muted-foreground">Automatically sync data</p>
                  </div>
                  <Switch
                    checked={settings.autoSync}
                    onCheckedChange={(checked) => setSettings({ ...settings, autoSync: checked })}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats */}
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <CardTitle>Your Stats</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{stats.totalFoodLogs}</div>
                  <div className="text-sm text-muted-foreground">Food Entries</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{stats.totalSteps}</div>
                  <div className="text-sm text-muted-foreground">Steps Logged</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{stats.streakDays}</div>
                  <div className="text-sm text-muted-foreground">Day Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">{stats.averageCalories}</div>
                  <div className="text-sm text-muted-foreground">Avg Calories</div>
                </div>
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={exportData} variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button onClick={clearData} variant="outline" className="w-full text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Data
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={() => router.push('/food-log')} variant="outline" className="w-full">
                  <Activity className="h-4 w-4 mr-2" />
                  Log Food
                </Button>
                <Button onClick={() => router.push('/steps')} variant="outline" className="w-full">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Log Steps
                </Button>
                <Button onClick={() => router.push('/analytics')} variant="outline" className="w-full">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {error && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="text-destructive text-sm">{error}</div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
