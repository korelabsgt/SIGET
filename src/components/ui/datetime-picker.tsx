"use client"

import * as React from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface DateTimePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Seleccione fecha y hora",
  disabled,
  className,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [timeValue, setTimeValue] = React.useState<string>("00:00")

  // Sync internal time state when external value changes
  React.useEffect(() => {
    if (value) {
      const hours = value.getHours().toString().padStart(2, "0")
      const minutes = value.getMinutes().toString().padStart(2, "0")
      setTimeValue(`${hours}:${minutes}`)
    }
  }, [value])

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      onChange?.(undefined)
      return
    }

    // Apply currently selected time to the new date
    const [hours, minutes] = timeValue.split(":").map(Number)
    const newDateTime = new Date(selectedDate)
    if (!isNaN(hours) && !isNaN(minutes)) {
      newDateTime.setHours(hours, minutes, 0, 0)
    }
    onChange?.(newDateTime)
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value
    setTimeValue(newTime)
    
    if (value) {
      const [hours, minutes] = newTime.split(":").map(Number)
      const newDateTime = new Date(value)
      if (!isNaN(hours) && !isNaN(minutes)) {
        newDateTime.setHours(hours, minutes, 0, 0)
        onChange?.(newDateTime)
      }
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal bg-white dark:bg-zinc-950",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-[#00A3FF]" />
          {value ? (
            format(value, "PPP - HH:mm", { locale: es })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" align="start">
        <div className="bg-white dark:bg-zinc-950 rounded-md border border-border overflow-hidden">
          {/* Base Calendar without its own wrapper styling to avoid double borders */}
          <Calendar
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
            initialFocus
            className="border-none"
            onClear={() => {
              onChange?.(undefined)
              setIsOpen(false)
            }}
            onToday={() => {
              const now = new Date()
              setTimeValue(`${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`)
              onChange?.(now)
            }}
          />
          
          {/* Time Picker Section */}
          <div className="border-t border-border p-3 flex items-center justify-between gap-4 bg-muted/20">
            <div className="flex items-center text-sm font-medium text-muted-foreground">
              <Clock className="mr-2 h-4 w-4" />
              Hora
            </div>
            <Input
              type="time"
              value={timeValue}
              onChange={handleTimeChange}
              className="w-[110px] h-8 text-sm"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
