"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, MessageSquare, Calendar, FileText, Filter } from 'lucide-react'
import { Sidebar } from "@/components/sidebar"

interface ChatHistory {
  id: string
  title: string
  date: string
  messageCount: number
  tags: string[]
  referencedDocument?: string
  preview: string
}

export default function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const chatHistory: ChatHistory[] = [
    {
      id: "1",
      title: "Diabetes Management Guidelines",
      date: "2024-01-15",
      messageCount: 12,
      tags: ["diabetes", "medication", "guidelines"],
      referencedDocument: "diabetes-guidelines.pdf",
      preview: "Discussion about Type 2 diabetes management protocols and medication adjustments..."
    },
    {
      id: "2",
      title: "Hypertension Treatment Options",
      date: "2024-01-14",
      messageCount: 8,
      tags: ["hypertension", "treatment", "medication"],
      referencedDocument: "hypertension-study.pdf",
      preview: "Exploring first-line treatments for hypertension and lifestyle modifications..."
    },
    {
      id: "3",
      title: "Drug Interaction Analysis",
      date: "2024-01-13",
      messageCount: 15,
      tags: ["medication", "interactions", "safety"],
      preview: "Analyzing potential drug interactions between multiple medications..."
    },
    {
      id: "4",
      title: "Cardiac Risk Assessment",
      date: "2024-01-12",
      messageCount: 10,
      tags: ["cardiology", "risk", "assessment"],
      referencedDocument: "cardiac-risk-calculator.pdf",
      preview: "Evaluating cardiovascular risk factors and prevention strategies..."
    },
    {
      id: "5",
      title: "Antibiotic Resistance Patterns",
      date: "2024-01-11",
      messageCount: 6,
      tags: ["antibiotics", "resistance", "microbiology"],
      preview: "Discussion about current antibiotic resistance patterns and treatment alternatives..."
    }
  ]

  const allTags = Array.from(new Set(chatHistory.flatMap(chat => chat.tags)))

  const filteredHistory = chatHistory.filter(chat => {
    const matchesSearch = chat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chat.preview.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         chat.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesTag = !selectedTag || chat.tags.includes(selectedTag)
    
    return matchesSearch && matchesTag
  })

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 p-6 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Chat History</h1>
            <p className="text-muted-foreground">Browse and search through your previous conversations.</p>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6 bg-card text-card-foreground border-2 border-secondary/30">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" className="md:w-auto">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
              
              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedTag === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTag(null)}
                >
                  All
                </Button>
                {allTags.map(tag => (
                  <Button
                    key={tag}
                    variant={selectedTag === tag ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTag(tag)}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* History List */}
          <div className="space-y-4">
            {filteredHistory.map((chat, index) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="hover:shadow-md transition-shadow cursor-pointer bg-card text-card-foreground border-2 border-secondary/20 hover:border-secondary/40">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="bg-primary/10 rounded-full p-2 mt-1">
                          <MessageSquare className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg mb-1">{chat.title}</h3>
                          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                            {chat.preview}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(chat.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              {chat.messageCount} messages
                            </div>
                            {chat.referencedDocument && (
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 mr-1" />
                                {chat.referencedDocument}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {chat.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {filteredHistory.length === 0 && (
            <Card className="bg-card text-card-foreground border-2 border-secondary/30">
              <CardContent className="p-12 text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No conversations found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || selectedTag 
                    ? "Try adjusting your search or filter criteria."
                    : "Start a conversation to see your chat history here."
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  )
}
