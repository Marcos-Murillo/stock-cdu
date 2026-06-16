"use client"

import * as React from "react"

interface DropdownMenuProps {
  trigger: React.ReactNode
  children: React.ReactNode
}

export function DropdownMenu({ trigger, children }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1" onClick={() => setIsOpen(false)}>
            {children}
          </div>
        </div>
      )}
    </div>
  )
}

interface DropdownMenuItemProps {
  onClick: () => void
  children: React.ReactNode
  variant?: "default" | "destructive"
}

export function DropdownMenuItem({ onClick, children, variant = "default" }: DropdownMenuItemProps) {
  const baseClasses = "flex items-center w-full px-4 py-2 text-sm text-left hover:bg-gray-100 cursor-pointer"
  const variantClasses = variant === "destructive" ? "text-red-600 hover:bg-red-50" : "text-gray-700"

  return (
    <button className={`${baseClasses} ${variantClasses}`} onClick={onClick}>
      {children}
    </button>
  )
}

export function DropdownMenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
      {children}
    </div>
  )
}

export function DropdownMenuSeparator() {
  return <div className="my-1 border-t border-gray-100" />
}
