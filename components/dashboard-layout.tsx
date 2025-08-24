"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Home, Apple, Activity, BarChart3, Settings, Menu, X } from "lucide-react"
import { InstallPrompt } from "@/components/install-prompt"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const profile =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("userProfile") || '{"name": "User"}')
      : { name: "User" }

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Food Log", href: "/food-log", icon: Apple },
    { name: "Steps", href: "/steps", icon: Activity },
    { name: "Analytics", href: "/analytics", icon: BarChart3 },
    { name: "Settings", href: "/settings", icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <div className="lg:hidden bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold text-primary">NutriTracker</h1>
        <Button variant="ghost" size="sm" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-card border-b border-border">
          <div className="px-4 py-2 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      <div className="lg:flex">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
          <div className="flex flex-col flex-grow bg-card border-r border-border">
            <div className="flex items-center h-16 px-6 border-b border-border">
              <h1 className="text-xl font-bold text-primary">NutriTracker</h1>
            </div>

            <div className="flex-1 flex flex-col justify-between p-4">
              <nav className="space-y-2">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Link>
                  )
                })}
              </nav>

              <div className="space-y-4">
                <Card className="p-3">
                  <div className="text-sm font-medium text-foreground">Welcome back!</div>
                  <div className="text-xs text-muted-foreground">{profile.name}</div>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:pl-64 flex flex-col flex-1">
          <main className="flex-1 p-4 lg:p-8">{children}</main>
        </div>
      </div>

      {/* Bottom navigation for mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="grid grid-cols-4 gap-1 p-2">
          {navigation.slice(0, 4).map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex flex-col items-center gap-1 px-2 py-2 text-xs font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <Icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </div>
      </div>

      <InstallPrompt />
    </div>
  )
}
