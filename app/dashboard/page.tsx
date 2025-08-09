"use client"

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, MessageSquare, TrendingUp, Clock, Users, Bot } from 'lucide-react';
import { Sidebar } from "@/components/sidebar";
import Link from "next/link";
import { auth } from "@/lib/firebase";

export default function DashboardPage() {
  const stats = [
    {
      title: "Documents Uploaded",
      value: "12",
      icon: FileText,
      change: "+3 this week"
    },
    {
      title: "Chat Sessions",
      value: "28",
      icon: MessageSquare,
      change: "+8 this week"
    },
    {
      title: "AI Insights Generated",
      value: "156",
      icon: TrendingUp,
      change: "+24 this week"
    },
    {
      title: "Hours Saved",
      value: "42",
      icon: Clock,
      change: "+12 this week"
    }
  ]

  const recentChats = [
    {
      id: "1",
      title: "Diabetes Management Guidelines",
      timestamp: "2 hours ago",
      preview: "What are the latest recommendations for Type 2 diabetes..."
    },
    {
      id: "2",
      title: "Hypertension Treatment",
      timestamp: "5 hours ago",
      preview: "Can you explain the first-line treatments for hypertension..."
    },
    {
      id: "3",
      title: "Medication Interactions",
      timestamp: "1 day ago",
      preview: "Are there any known interactions between metformin and..."
    }
  ];

  const router = useRouter();
  const handleSignOut = async () => {
    if (auth?.signOut) {
      await auth.signOut();
    }
    router.push("/");
  };

  const insights = [
    {
      title: "Most Discussed Topic",
      content: "Cardiovascular Health",
      description: "Based on your recent conversations"
    },
    {
      title: "Document Usage",
      content: "Clinical Guidelines PDF",
      description: "Most referenced document this week"
    },
    {
      title: "Peak Usage Time",
      content: "2:00 PM - 4:00 PM",
      description: "When you're most active"
    }
  ];

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 p-6 overflow-auto">
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="border-2 border-black rounded-md shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Sign Out
          </Button>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's your medical AI assistant overview.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="bg-card text-card-foreground border-2 border-black rounded-md shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-card-foreground/70">{stat.title}</p>
                        <p className="text-3xl font-bold text-card-foreground">{stat.value}</p>
                        <p className="text-xs text-secondary">{stat.change}</p>
                      </div>
                      <div className="bg-secondary/20 rounded-full p-3">
                        <stat.icon className="h-6 w-6 text-secondary-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="bg-card text-card-foreground border-2 border-black rounded-md shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col gap-8">
                    <Link href="/chat">
                      <Button className="w-full justify-start py-6 text-lg border-2 border-black rounded-md shadow-lg hover:shadow-xl transition-all duration-300" variant="outline">
                        <Bot className="mr-2 h-4 w-4" />
                        Ask AI Assistant
                      </Button>
                    </Link>
                    <Link href="/patients">
                      <Button className="w-full justify-start py-6 text-lg border-2 border-black rounded-md shadow-lg hover:shadow-xl transition-all duration-300" variant="outline">
                        <Users className="mr-2 h-4 w-4" />
                        Manage Patients
                      </Button>
                    </Link>
                    <Link href="/history">
                      <Button className="w-full justify-start py-6 text-lg border-2 border-black rounded-md shadow-lg hover:shadow-xl transition-all duration-300" variant="outline">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        View Chat History
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* AI Insights */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card className="bg-card text-card-foreground border-2 border-black rounded-md shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle>AI Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {insights.map((insight, index) => (
                    <div key={index} className="border-l-4 border-primary pl-4">
                      <h4 className="font-medium">{insight.title}</h4>
                      <p className="text-sm font-semibold text-primary">{insight.content}</p>
                      <p className="text-xs text-muted-foreground">{insight.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Recent Chats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="bg-card text-card-foreground border-2 border-black rounded-md shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <CardTitle>Recent Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentChats.map((chat, index) => (
                    <div
                      key={chat.id}
                      className="flex items-start space-x-4 p-4 border-2 border-black rounded-md shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer bg-card"
                    >
                      <div className="bg-primary/10 rounded-full p-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{chat.title}</h4>
                        <p className="text-sm text-muted-foreground truncate">{chat.preview}</p>
                        <p className="text-xs text-muted-foreground mt-1">{chat.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
