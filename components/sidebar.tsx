"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Home, MessageSquare, Upload, BarChart3, History, Settings, Stethoscope, Menu, X } from 'lucide-react'
import Link from "next/link"
import { usePathname } from "next/navigation"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Chat", href: "/chat", icon: MessageSquare },
  { name: "Upload", href: "/upload", icon: Upload },
  { name: "History", href: "/history", icon: History },
  { name: "Profile", href: "/profile", icon: Stethoscope },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const [trayOpen, setTrayOpen] = useState(false)

  // Detect cursor at left edge for desktop tray
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientX <= 10 && !trayOpen) {
        setTrayOpen(true)
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [trayOpen])
  const pathname = usePathname()

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link href="/" className="flex items-center space-x-2">
          <Stethoscope className="h-8 w-8 text-sidebar-primary" />
          <span className="text-xl font-bold">X-NOSIS</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="flex flex-col gap-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link key={item.name} href={item.href}>
                <motion.div
                  whileHover={{ boxShadow: "0 0 8px 2px #e75480" }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="rounded-lg"
                >
                  <Button
                    variant={isActive ? "default" : "outline"}
                    className={`w-full flex items-center justify-start border-2 border-black rounded-md shadow-lg hover:shadow-xl transition-all duration-300 ${
                      isActive 
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md" 
                        : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <span className="mr-3">
                      <item.icon className="h-5 w-5 text-sidebar-primary" />
                    </span>
                    {item.name}
                  </Button>
                </motion.div>
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <Card className="p-4 bg-sidebar-accent/50 border-sidebar-border shadow-sm">
          <p className="text-sm font-medium mb-1 text-sidebar-accent-foreground">AI Medical Assistant</p>
          <p className="text-xs text-sidebar-accent-foreground/70">
            Always consult with healthcare professionals for medical decisions.
          </p>
        </Card>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Desktop Sidebar Tray */}
      <div className="hidden md:block">
        <motion.div
          initial={{ x: -300 }}
          animate={{ x: trayOpen ? 0 : -300 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="fixed top-0 left-0 h-screen w-64 z-50 border-r border-sidebar-border shadow-2xl bg-white"
          onMouseLeave={() => setTrayOpen(false)}
        >
          <SidebarContent />
        </motion.div>
        {/* Shadow overlay when tray is open */}
        {trayOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 ml-64 bg-black z-40"
            onClick={() => setTrayOpen(false)}
          />
        )}
      </div>

      {/* Mobile Sidebar */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 md:hidden"
        >
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute left-0 top-0 h-full w-64 border-r border-sidebar-border shadow-2xl"
          >
            <SidebarContent />
          </motion.div>
        </motion.div>
      )}
    </>
  )
}
