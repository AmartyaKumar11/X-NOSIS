"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { CustomDialog, CustomDialogContent, CustomDialogHeader, CustomDialogTitle, CustomDialogClose } from "@/components/ui/custom-dialog"
import { VoiceControl } from "@/components/voice-control"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Plus, Search, FolderPlus, Camera, TestTube, Calendar, FileText, Folder, User, Edit, Trash2 } from 'lucide-react'
import { Sidebar } from "@/components/sidebar"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

interface Patient {
  id: string
  name: string
  date_of_birth?: string
  created_at: string
  updated_at: string
  metadata: any
  directories: Directory[]
}

interface Directory {
  id: string
  name: string
  type: 'default' | 'custom'
  parent_id?: string
  icon: string
  color: string
  sort_order: number
  document_count: number
}

const iconMap: { [key: string]: any } = {
  Camera: Camera,
  TestTube: TestTube,
  Calendar: Calendar,
  FileText: FileText,
  Folder: Folder,
  Heart: TestTube, // Fallback for custom icons
}

const colorMap: { [key: string]: string } = {
  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  orange: "bg-orange-100 text-orange-800",
  purple: "bg-purple-100 text-purple-800",
  red: "bg-red-100 text-red-800",
}

export default function PatientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.patientId as string
  
  const [patient, setPatient] = useState<Patient | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDirModalOpen, setIsCreateDirModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [newDirectory, setNewDirectory] = useState({
    name: "",
    icon: "Folder",
    color: "blue"
  })
  const [editPatient, setEditPatient] = useState({
    name: "",
    date_of_birth: "",
    phone: "",
    email: "",
    gender: "",
    blood_type: "",
    allergies: "",
    emergency_contact: ""
  })

  useEffect(() => {
    if (patientId) {
      fetchPatient()
    }
  }, [patientId])

  const fetchPatient = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`http://localhost:8000/patients/${patientId}`)
      if (response.ok) {
        const data = await response.json()
        setPatient(data.patient)
      } else {
        console.error('Failed to fetch patient')
      }
    } catch (error) {
      console.error('Error fetching patient:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createDirectory = async () => {
    try {
      const directoryData = {
        name: newDirectory.name,
        type: 'custom',
        icon: newDirectory.icon,
        color: newDirectory.color
      }

      const response = await fetch(`http://localhost:8000/patients/${patientId}/directories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(directoryData)
      })

      if (response.ok) {
        setIsCreateDirModalOpen(false)
        setNewDirectory({ name: "", icon: "Folder", color: "blue" })
        fetchPatient() // Refresh the patient data
      } else {
        console.error('Failed to create directory')
      }
    } catch (error) {
      console.error('Error creating directory:', error)
    }
  }

  const updatePatient = async () => {
    try {
      const patientData = {
        name: editPatient.name,
        date_of_birth: editPatient.date_of_birth || null,
        metadata: {
          phone: editPatient.phone,
          email: editPatient.email,
          gender: editPatient.gender,
          blood_type: editPatient.blood_type,
          allergies: editPatient.allergies,
          emergency_contact: editPatient.emergency_contact
        }
      }

      const response = await fetch(`http://localhost:8000/patients/${patientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData)
      })

      if (response.ok) {
        setIsEditModalOpen(false)
        fetchPatient() // Refresh the patient data
      } else {
        console.error('Failed to update patient')
      }
    } catch (error) {
      console.error('Error updating patient:', error)
    }
  }

  const deletePatient = async () => {
    try {
      const response = await fetch(`http://localhost:8000/patients/${patientId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Close the modal first
        setIsDeleteModalOpen(false)
        
        // Use Next.js router to navigate back to patients page
        // This will trigger a proper page refresh and reload the patients list
        router.push('/patients')
        router.refresh() // Force a refresh of the page data
      } else {
        console.error('Failed to delete patient')
      }
    } catch (error) {
      console.error('Error deleting patient:', error)
    }
  }

  const openEditModal = () => {
    if (patient) {
      setEditPatient({
        name: patient.name,
        date_of_birth: patient.date_of_birth || "",
        phone: patient.metadata?.phone || "",
        email: patient.metadata?.email || "",
        gender: patient.metadata?.gender || "",
        blood_type: patient.metadata?.blood_type || "",
        allergies: patient.metadata?.allergies || "",
        emergency_contact: patient.metadata?.emergency_contact || ""
      })
      setIsEditModalOpen(true)
    }
  }

  const filteredDirectories = patient?.directories.filter(directory =>
    directory.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading patient...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="bg-card text-card-foreground border-2 border-black rounded-md shadow-lg">
            <CardContent className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Patient not found</h3>
              <p className="text-muted-foreground mb-4">The requested patient could not be found.</p>
              <Link href="/patients">
                <Button className="border-2 border-black rounded-md shadow-lg hover:shadow-xl transition-all duration-300">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Patients
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
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
          <div className="flex items-center justify-between mb-6">
            <Link href="/patients">
              <Button variant="outline" size="sm" className="border-2 border-black rounded-md shadow-lg hover:shadow-xl transition-all duration-300">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            
            <Dialog open={isCreateDirModalOpen} onOpenChange={setIsCreateDirModalOpen}>
              <DialogTrigger asChild>
                <Button className="border-2 border-black rounded-md shadow-lg hover:shadow-xl transition-all duration-300">
                  <FolderPlus className="mr-2 h-4 w-4" />
                  New Directory
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Directory</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="dirName">Directory Name *</Label>
                    <Input
                      id="dirName"
                      value={newDirectory.name}
                      onChange={(e) => setNewDirectory({...newDirectory, name: e.target.value})}
                      placeholder="e.g., Cardiology, Blood Work, X-Rays"
                      className="border-2 border-border rounded-md"
                    />
                  </div>
                  <div>
                    <Label htmlFor="color">Color</Label>
                    <select
                      id="color"
                      value={newDirectory.color}
                      onChange={(e) => setNewDirectory({...newDirectory, color: e.target.value})}
                      className="w-full border-2 border-border rounded-md p-2"
                    >
                      <option value="blue">Blue</option>
                      <option value="green">Green</option>
                      <option value="orange">Orange</option>
                      <option value="purple">Purple</option>
                      <option value="red">Red</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={() => setIsCreateDirModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={createDirectory}
                      disabled={!newDirectory.name.trim()}
                      className="border-2 border-black rounded-md shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Create Directory
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Patient Information Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <Card className="bg-card text-card-foreground border-2 border-black rounded-md shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-primary/10 rounded-full p-3">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{patient.name}</CardTitle>
                      <p className="text-muted-foreground">Patient ID: {patient.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openEditModal}
                      className="border-2 border-black rounded-md shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsDeleteModalOpen(true)}
                      className="border-2 border-red-500 text-red-600 hover:bg-red-50 rounded-md shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Personal Information</h4>
                    <div className="space-y-1">
                      {patient.date_of_birth ? (
                        <p><span className="font-medium">Date of Birth:</span> {formatDate(patient.date_of_birth)}</p>
                      ) : (
                        <p className="text-muted-foreground">Date of birth not provided</p>
                      )}
                      {patient.metadata?.gender && (
                        <p><span className="font-medium">Gender:</span> {patient.metadata.gender}</p>
                      )}
                      {patient.metadata?.phone && (
                        <p><span className="font-medium">Phone:</span> {patient.metadata.phone}</p>
                      )}
                      {patient.metadata?.email && (
                        <p><span className="font-medium">Email:</span> {patient.metadata.email}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Medical Information</h4>
                    <div className="space-y-1">
                      {patient.metadata?.blood_type && (
                        <p><span className="font-medium">Blood Type:</span> {patient.metadata.blood_type}</p>
                      )}
                      {patient.metadata?.allergies && (
                        <p><span className="font-medium">Allergies:</span> {patient.metadata.allergies}</p>
                      )}
                      {patient.metadata?.emergency_contact && (
                        <p><span className="font-medium">Emergency Contact:</span> {patient.metadata.emergency_contact}</p>
                      )}
                      {!patient.metadata?.blood_type && !patient.metadata?.allergies && !patient.metadata?.emergency_contact && (
                        <p className="text-muted-foreground">No medical information provided</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Account Details</h4>
                    <div className="space-y-1">
                      <p><span className="font-medium">Created:</span> {formatDate(patient.created_at)}</p>
                      <p><span className="font-medium">Last Updated:</span> {formatDate(patient.updated_at)}</p>
                      <p><span className="font-medium">Total Documents:</span> {patient.directories.reduce((sum, dir) => sum + dir.document_count, 0)}</p>
                      <p><span className="font-medium">Directories:</span> {patient.directories.length}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search directories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-2 border-border rounded-md shadow-sm"
              />
            </div>
          </div>

          {/* Directories Grid */}
          {filteredDirectories.length === 0 ? (
            <Card className="bg-card text-card-foreground border-2 border-black rounded-md shadow-lg">
              <CardContent className="text-center py-12">
                <Folder className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery ? "No directories found" : "No directories yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? `No directories match "${searchQuery}"`
                    : "This shouldn't happen - default directories should be created automatically"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDirectories.map((directory, index) => {
                const IconComponent = iconMap[directory.icon] || Folder
                const colorClass = colorMap[directory.color] || "bg-gray-100 text-gray-800"
                
                return (
                  <motion.div
                    key={directory.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Link href={`/patients/${patientId}/directories/${directory.id}`}>
                      <Card className="bg-card text-card-foreground border-2 border-black rounded-md shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                        <CardHeader className="pb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`rounded-full p-2 ${colorClass}`}>
                              <IconComponent className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg truncate">{directory.name}</CardTitle>
                              <p className="text-sm text-muted-foreground capitalize">
                                {directory.type} directory
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Documents</span>
                            <span className="font-medium">{directory.document_count}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Edit Patient Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Patient Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editName">Patient Name *</Label>
                <Input
                  id="editName"
                  value={editPatient.name}
                  onChange={(e) => setEditPatient({...editPatient, name: e.target.value})}
                  placeholder="Enter patient name"
                  className="border-2 border-border rounded-md"
                />
              </div>
              <div>
                <Label htmlFor="editDob">Date of Birth</Label>
                <Input
                  id="editDob"
                  type="date"
                  value={editPatient.date_of_birth}
                  onChange={(e) => setEditPatient({...editPatient, date_of_birth: e.target.value})}
                  className="border-2 border-border rounded-md"
                />
              </div>
              <div>
                <Label htmlFor="editPhone">Phone Number</Label>
                <Input
                  id="editPhone"
                  value={editPatient.phone}
                  onChange={(e) => setEditPatient({...editPatient, phone: e.target.value})}
                  placeholder="Enter phone number"
                  className="border-2 border-border rounded-md"
                />
              </div>
              <div>
                <Label htmlFor="editEmail">Email Address</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editPatient.email}
                  onChange={(e) => setEditPatient({...editPatient, email: e.target.value})}
                  placeholder="Enter email address"
                  className="border-2 border-border rounded-md"
                />
              </div>
              <div>
                <Label htmlFor="editGender">Gender</Label>
                <select
                  id="editGender"
                  value={editPatient.gender}
                  onChange={(e) => setEditPatient({...editPatient, gender: e.target.value})}
                  className="w-full border-2 border-border rounded-md p-2"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <Label htmlFor="editBloodType">Blood Type</Label>
                <select
                  id="editBloodType"
                  value={editPatient.blood_type}
                  onChange={(e) => setEditPatient({...editPatient, blood_type: e.target.value})}
                  className="w-full border-2 border-border rounded-md p-2"
                >
                  <option value="">Select blood type</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>
            <div>
              <Label htmlFor="editAllergies">Allergies</Label>
              <Input
                id="editAllergies"
                value={editPatient.allergies}
                onChange={(e) => setEditPatient({...editPatient, allergies: e.target.value})}
                placeholder="Enter known allergies"
                className="border-2 border-border rounded-md"
              />
            </div>
            <div>
              <Label htmlFor="editEmergencyContact">Emergency Contact</Label>
              <Input
                id="editEmergencyContact"
                value={editPatient.emergency_contact}
                onChange={(e) => setEditPatient({...editPatient, emergency_contact: e.target.value})}
                placeholder="Enter emergency contact information"
                className="border-2 border-border rounded-md"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={updatePatient}
                disabled={!editPatient.name.trim()}
                className="border-2 border-black rounded-md shadow-lg hover:shadow-xl transition-all duration-300"
              >
                Update Patient
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Patient Modal */}
      <CustomDialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <CustomDialogContent>
          <CustomDialogClose onClose={() => setIsDeleteModalOpen(false)} />
          <CustomDialogHeader>
            <CustomDialogTitle>Delete Patient</CustomDialogTitle>
          </CustomDialogHeader>
          <div className="space-y-4">
            <div className="text-center py-4">
              <Trash2 className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-black">Are you sure?</h3>
              <p className="text-gray-600 mb-4">
                This will permanently delete <strong>{patient?.name}</strong> and all associated directories and documents. This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} className="border-2 border-black rounded-md shadow-lg hover:shadow-xl transition-all duration-300">
                Cancel
              </Button>
              <Button 
                onClick={deletePatient}
                className="bg-red-600 hover:bg-red-700 text-white border-2 border-black rounded-md shadow-lg shadow-red-500/50 hover:shadow-2xl hover:shadow-red-600/80 transition-all duration-300"
              >
                Delete Patient
              </Button>
            </div>
          </div>
        </CustomDialogContent>
      </CustomDialog>

      {/* Voice Control */}
      <VoiceControl
        onNavigate={(path) => router.push(path)}
        onSearch={(query) => setSearchQuery(query)}
      />
    </div>
  )
}