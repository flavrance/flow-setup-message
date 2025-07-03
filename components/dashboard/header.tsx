"use client"

import { UserButton, useUser } from "@clerk/nextjs"
import { Bell, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function Header() {
  const { user } = useUser()

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-semibold text-gray-900">Welcome back, {user?.firstName || "Admin"}</h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input type="search" placeholder="Search..." className="pl-10 w-64" />
          </div>

          <Button variant="ghost" size="sm">
            <Bell className="h-5 w-5" />
          </Button>

          <UserButton afterSignOutUrl="/" />
        </div>
      </div>
    </header>
  )
}
