"use client"

import * as React from "react"
import { X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface CustomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

interface CustomDialogContentProps {
  children: React.ReactNode
  className?: string
}

interface CustomDialogHeaderProps {
  children: React.ReactNode
}

interface CustomDialogTitleProps {
  children: React.ReactNode
}

export function CustomDialog({ open, onOpenChange, children }: CustomDialogProps) {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false)
      }
    }

    if (open) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [open, onOpenChange])

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          {children}
        </>
      )}
    </AnimatePresence>
  )
}

export function CustomDialogContent({ children, className = "" }: CustomDialogContentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      className={`fixed inset-0 z-[60] flex items-center justify-center p-4`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={`w-full max-w-lg bg-white text-black border-2 border-black rounded-md p-6 shadow-lg ${className}`}>
        {children}
      </div>
    </motion.div>
  )
}

export function CustomDialogHeader({ children }: CustomDialogHeaderProps) {
  return (
    <div className="flex flex-col space-y-1.5 text-center sm:text-left mb-4">
      {children}
    </div>
  )
}

export function CustomDialogTitle({ children }: CustomDialogTitleProps) {
  return (
    <h2 className="text-lg font-semibold leading-none tracking-tight text-black">
      {children}
    </h2>
  )
}

export function CustomDialogClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-opacity"
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </button>
  )
}