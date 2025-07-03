"use client"

import type * as React from "react"
import { CalendarDays } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface DatePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  label?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date and time",
  className,
  label,
}: DatePickerProps) {
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value
    onChange?.(newValue)
  }

  const formatDisplayValue = (dateString: string) => {
    if (!dateString) return ""
    try {
      const date = new Date(dateString)
      return date.toISOString().slice(0, 16) // Format for datetime-local input
    } catch {
      return ""
    }
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="relative">
        <CalendarDays className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
        <Input
          type="datetime-local"
          value={formatDisplayValue(value || "")}
          onChange={handleDateChange}
          placeholder={placeholder}
          className={cn("pl-10", className)}
        />
      </div>
    </div>
  )
}
