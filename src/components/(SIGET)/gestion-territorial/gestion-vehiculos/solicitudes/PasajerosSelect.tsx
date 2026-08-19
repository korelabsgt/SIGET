"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { searchProfiles } from "./lib/actions"

interface PasajerosSelectProps {
  value: string
  onChange: (value: string) => void
}

export function PasajerosSelect({ value, onChange }: PasajerosSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [query, setQuery] = React.useState("")
  const [options, setOptions] = React.useState<{ id: string; nombre: string; email: string }[]>([])
  const [loading, setLoading] = React.useState(false)

  // Parse current value string into an array of names
  const selectedNames = value ? value.split(", ").filter(Boolean) : []

  // Debounced search
  React.useEffect(() => {
    if (query.length < 3) {
      setOptions([])
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true)
      try {
        const results = await searchProfiles(query)
        setOptions(results)
      } catch (error) {
        console.error("Error searching profiles", error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [query])

  const handleSelect = (nombre: string) => {
    let newNames = [...selectedNames]
    if (newNames.includes(nombre)) {
      newNames = newNames.filter((n) => n !== nombre)
    } else {
      newNames.push(nombre)
    }
    onChange(newNames.join(", "))
  }

  const handleRemove = (nombreToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newNames = selectedNames.filter((n) => n !== nombreToRemove)
    onChange(newNames.join(", "))
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={open}
          className="flex w-full items-center justify-between rounded-md border border-input bg-white dark:bg-zinc-950 px-3 py-2 text-sm ring-offset-background cursor-pointer h-auto min-h-[40px] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <div className="flex flex-wrap gap-1 items-center overflow-hidden w-full">
            {selectedNames.length > 0 ? (
              selectedNames.map((nombre) => (
                <Badge
                  key={nombre}
                  variant="secondary"
                  className="mr-1 mb-1 font-normal bg-blue-100 text-[#00A3FF] hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50"
                >
                  {nombre}
                  <button
                    type="button"
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleRemove(nombre, e as any);
                      }
                    }}
                    onMouseDown={(e) => handleRemove(nombre, e)}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground font-normal">Buscar acompañantes...</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="flex flex-col bg-white dark:bg-zinc-950 rounded-md border border-border shadow-md z-[200]">
          <div className="flex items-center border-b px-3">
            <Input
              placeholder="Escribe 3 letras para buscar..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 shadow-none rounded-none h-10 px-0"
            />
            {loading && <Loader2 className="h-4 w-4 animate-spin opacity-50" />}
          </div>
          <div className="max-h-[200px] overflow-y-auto p-1">
            {query.length > 0 && query.length < 3 && (
              <p className="p-2 text-sm text-center text-muted-foreground">
                Escribe al menos 3 letras...
              </p>
            )}
            {query.length >= 3 && !loading && options.length === 0 && (
              <p className="p-2 text-sm text-center text-muted-foreground">
                No se encontraron perfiles.
              </p>
            )}
            {options.map((option) => {
              const isSelected = selectedNames.includes(option.nombre)
              return (
                <div
                  key={option.id}
                  onClick={() => handleSelect(option.nombre)}
                  className={cn(
                    "flex items-center px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-accent hover:text-accent-foreground",
                    isSelected ? "bg-accent/50" : ""
                  )}
                >
                  <div
                    className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50 [&_svg]:invisible"
                    )}
                  >
                    <Check className="h-3 w-3" />
                  </div>
                  <span>{option.nombre}</span>
                  <span className="ml-2 text-xs text-muted-foreground truncate">{option.email}</span>
                </div>
              )
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
