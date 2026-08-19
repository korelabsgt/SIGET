"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { es } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  onClear?: () => void;
  onToday?: () => void;
};

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  onClear,
  onToday,
  ...props
}: CalendarProps) {
  return (
    <div className="bg-white dark:bg-zinc-950 rounded-md border border-border">
      <DayPicker
        locale={es}
        showOutsideDays={showOutsideDays}
        className={cn("p-3", className)}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-bold capitalize",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-full"
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] uppercase",
          row: "flex w-full mt-2",
          cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-transparent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn(
            buttonVariants({ variant: "ghost" }),
            "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
          ),
          day_selected:
            "bg-[#00A3FF] text-white hover:bg-[#00A3FF]/90 hover:text-white focus:bg-[#00A3FF] focus:text-white rounded-full font-bold",
          day_today: "bg-accent text-accent-foreground",
          day_outside: "text-muted-foreground opacity-50",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle:
            "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
        components={{
          IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
          IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
        }}
        {...props}
      />
      {(onClear || onToday) && (
        <div className="border-t border-border p-3 flex items-center justify-between">
          {onClear ? (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onClear(); }}
              className="text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              Borrar
            </button>
          ) : <div />}
          
          {onToday ? (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); onToday(); }}
              className="text-sm bg-blue-100 dark:bg-blue-900/30 text-[#00A3FF] px-3 py-1 rounded-full font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            >
              Hoy
            </button>
          ) : <div />}
        </div>
      )}
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
