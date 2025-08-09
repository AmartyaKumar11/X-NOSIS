"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Search, User, Calendar, FileText, Clock } from 'lucide-react'
import { Sidebar } from "@/components/sidebar"
import Link from "next/link"

interface Patient {
  id: string
  name: string
  date_of_birth?: string
  created_at: string
  updated_at: string
  document_count: number
  last_activity?: string
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [newPatient, setNewPatient] = useState({
    name: "",
    date_of_birth: "",
    phone: "",
    email: ""
  })

  // Fetch patients on component mount
  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('http://localhost:8000/patients')
      if (response.ok) {
        const data = await response.json()
        setPatients(data.patients || [])
      } else {
        console.error('Failed to fetch patients')
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createPatient = async () => {
    try {
      const patientData = {
        name: newPatient.name,
        date_of_birth: newPatient.date_of_birth || null,
        metadata: {
          phone: newPatient.phone,
          email: newPatient.email
        }
      }

      const response = await fetch('http://localhost:8000/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData)
      })

      if (response.ok) {
        setIsCreateModalOpen(false)
        setNewPatient({ name: "", date_of_birth: "", phone: "", email: "" })
        fetchPatients() // Refresh the list
      } else {
        console.error('Failed to create patient')
      }
    } catch (error) {
      console.error('Error creating patient:', error)
    }
  }

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return "No activity"
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return formatDate(dateString)
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Patient Management</h1>
              <p className="text-muted-foreground">Organize and manage patient records with AI-powered analysis</p>
            </div>
            
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="border-2 border-black rounded-md shadow-lg hover:shadow-xl transition-all duration-300">
                  <Plus className="mr-2 h-4 w-4" />
                  New Patient
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Patient</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Patient Name *</Label>
                    <Input
                      id="name"
                      value={newPatient.name}
                      onChange={(e) => setNewPatient({...newPatient, name: e.target.value})}
                      placeholder="Enter patient name"
                      className="border-2 border-border rounded-md"
                    />
                  </div>
                  <div>
                    <Label htmlFor="dob">Date of Birth</Label>
                    <Input
                      id="dob"
                      type="date"
                      value={newPatient.date_of_birth}
                      onChange={(e) => setNewPatient({...newPatient, date_of_birth: e.target.value})}
                      className="border-2 border-border rounded-md"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={newPatient.phone}
                      onChange={(e) => setNewPatient({...newPatient, phone: e.target.value})}
                      placeholder="Enter phone number"
                      className="border-2 border-border rounded-md"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newPatient.email}
                      onChange={(e) => setNewPatient({...newPatient, email: e.target.value})}
                      placeholder="Enter email address"
                      className="border-2 border-border rounded-md"
                    />
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={createPatient}
                      disabled={!newPatient.name.trim()}
                      className="border-2 border-black rounded-md shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Create Patient
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-2 border-border rounded-md shadow-sm"
              />
            </div>
          </div>

          {/* Patients Grid */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading patients...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <Card className="bg-card text-card-foreground border-2 border-black rounded-md shadow-lg">
              <CardContent className="text-center py-12">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery ? "No patients found" : "No patients yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? `No patients match "${searchQuery}"`
                    : "Create your first patient to get started with organized medical record management"
                  }
                </p>
                {!searchQuery && (
                  <Button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="border-2 border-black rounded-md shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Patient
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPatients.map((patient, index) => (
                <motion.div
                  key={patient.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Link href={`/patients/${patient.id}`}>
                    <Card className="bg-card text-card-foreground border-2 border-black rounded-md shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="flex items-center space-x-3">
                          <div className="bg-primary/10 rounded-full p-2">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">{patient.name}</CardTitle>
                            {patient.date_of_birth && (
                              <p className="text-sm text-muted-foreground flex items-center mt-1">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatDate(patient.date_of_birth)}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center text-muted-foreground">
                              <FileText className="h-3 w-3 mr-1" />
                              Documents
                            </span>
                            <span className="font-medium">{patient.document_count}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center text-muted-foreground">
                              <Clock className="h-3 w-3 mr-1" />
                              Last Activity
                            </span>
                            <span className="font-medium">{getTimeAgo(patient.last_activity)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}