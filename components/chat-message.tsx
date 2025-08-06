"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Bot, FileText } from 'lucide-react'
import { motion } from "framer-motion"

interface Message {
  id: string
  content: string
  role: "user" | "assistant"
  timestamp: Date
  referencedDocument?: string
}

interface ChatMessageProps {
  message: Message
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user"
  const [clientTime, setClientTime] = useState<string | null>(null);

  useEffect(() => {
    setClientTime(message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  }, [message.timestamp]);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`flex items-start space-x-3 max-w-3xl ${isUser ? "flex-row-reverse space-x-reverse" : ""}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}>
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>

        {/* Message Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          className="flex-1"
        >
          <Card className={`shadow-md hover:shadow-lg transition-shadow duration-200 border-2 ${
            isUser 
              ? "bg-primary text-primary-foreground border-primary" 
              : "bg-card text-card-foreground border-secondary/30"
          }`}>
            <CardContent className="p-4">
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
              
              {message.referencedDocument && (
                <div className="mt-3 pt-3 border-t border-border/20">
                  <Badge variant="secondary" className="text-xs shadow-sm bg-secondary text-secondary-foreground">
                    <FileText className="h-3 w-3 mr-1" />
                    {message.referencedDocument}
                  </Badge>
                </div>
              )}
              
              <div className="mt-2 text-xs opacity-70">
                {clientTime}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
