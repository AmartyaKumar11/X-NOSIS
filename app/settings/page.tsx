"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Key, Palette, User, LogOut, Save } from 'lucide-react'
import { Sidebar } from "@/components/sidebar"

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState("")
  const [email, setEmail] = useState("user@example.com")
  const [bubblegumTheme, setBubblegumTheme] = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [autoSave, setAutoSave] = useState(true)

  const handleSaveSettings = () => {
    // Save settings logic here
    console.log("Settings saved")
  }

  const handleLogout = () => {
    // Logout logic here
    console.log("Logging out")
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 p-6 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">Manage your account and application preferences.</p>
          </div>

          <div className="space-y-6">
            {/* API Configuration */}
            <Card className="bg-card text-card-foreground border-2 border-secondary/30">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Key className="h-5 w-5 mr-2" />
                  API Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="api-key">OpenRouter API Key</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Enter your OpenRouter API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Your API key is encrypted and stored securely. It's used to access AI models for medical assistance.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Account Settings */}
            <Card className="bg-card text-card-foreground border-2 border-secondary/30">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Account Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2"
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about your medical consultations
                    </p>
                  </div>
                  <Switch
                    checked={notifications}
                    onCheckedChange={setNotifications}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-save Conversations</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically save your chat history
                    </p>
                  </div>
                  <Switch
                    checked={autoSave}
                    onCheckedChange={setAutoSave}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Theme Settings */}
            <Card className="bg-card text-card-foreground border-2 border-secondary/30">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="h-5 w-5 mr-2" />
                  Appearance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Bubblegum Theme</Label>
                    <p className="text-sm text-muted-foreground">
                      Use the vibrant Bubblegum color scheme
                    </p>
                  </div>
                  <Switch
                    checked={bubblegumTheme}
                    onCheckedChange={setBubblegumTheme}
                  />
                </div>
                
                <div className="p-4 border-2 border-secondary/30 rounded-lg bg-card/80">
                  <p className="text-sm font-medium mb-2 text-card-foreground">Theme Preview</p>
                  <div className="flex space-x-2">
                    <div className="w-4 h-4 rounded-full bg-primary"></div>
                    <div className="w-4 h-4 rounded-full bg-secondary"></div>
                    <div className="w-4 h-4 rounded-full bg-card border border-card-foreground"></div>
                    <div className="w-4 h-4 rounded-full bg-muted"></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={handleSaveSettings} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </Button>
              <Button variant="outline" onClick={handleLogout} className="flex-1">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
