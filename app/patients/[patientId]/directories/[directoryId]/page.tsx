"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Search, Upload, FileText, Calendar, Download, Trash2, Eye } from 'lucide-react'
import { Sidebar } from "@/components/sidebar"
import Link from "next/link"
import { useParams } from "next/navigation"

interface Patient {
  id: string
  name: string
  date_of_birth?: string
}

interface Directory {
  id: string
  name: string
  type: 'default' | 'custom'
  icon: string
  color: string
}

interface Document {
  id: string
  name: string
  file_type: string
  file_size: number
  uploaded_at: string
  tags?: string[]
  analysis_id?: number
}

const iconMap: { [key: string]: any } = {
  Camera: Upload,
  TestTube: FileText,
  Calendar: Calendar,
  FileText: FileText,
  Folder: FileText,
}

const colorMap: { [key: string]: string } = {
  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  orange: "bg-orange-100 text-orange-800",
  purple: "bg-purple-100 text-purple-800",
  red: "bg-red-100 text-red-800",
}

export default function DirectoryDetailPage() {
  const params = useParams()
  const patientId = params.patientId as string
  const directoryId = params.directoryId as string
  
  const [patient, setPatient] = useState<Patient | null>(null)
  const [directory, setDirectory] = useState<Directory | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (patientId && directoryId) {
      fetchDirectoryData()
    }
  }, [patientId, directoryId])

  const fetchDirectoryData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch patient info
      const patientResponse = await fetch(`http://localhost:8000/patients/${patientId}`)
      if (patientResponse.ok) {
        const patientData = await patientResponse.json()
        setPatient({
          id: patientData.patient.id,
          name: patientData.patient.name,
          date_of_birth: patientData.patient.date_of_birth
        })
        
        // Find the specific directory
        const foundDirectory = patientData.patient.directories.find((d: any) => d.id === directoryId)
        if (foundDirectory) {
          setDirectory(foundDirectory)
        }
      }
      
      // Fetch documents in this directory
      const documentsResponse = await fetch(`http://localhost:8000/patients/${patientId}/directories/${directoryId}/documents`)
      if (documentsResponse.ok) {
        const documentsData = await documentsResponse.json()
        setDocuments(documentsData.documents || [])
      }
      
    } catch (error) {
      console.error('Error fetching directory data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (isLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading directory...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!patient || !directory) {
    return (
      <div className="flex h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Card className="bg-card text-card-foreground border-2 border-black rounded-md shadow-lg">
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Directory not found</h3>
              <p className="text-muted-foreground mb-4">The requested directory could not be found.</p>
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

  const IconComponent = iconMap[directory.icon] || FileText
  const colorClass = colorMap[directory.color] || "bg-gray-100 text-gray-800"

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
          {/* Breadcrumb Navigation */}
          <div className="flex items-center space-x-2 mb-6 text-sm text-muted-foreground">
            <Link href="/patients" className="hover:text-foreground">Patients</Link>
            <span>/</span>
            <Link href={`/patients/${patientId}`} className="hover:text-foreground">{patient.name}</Link>
            <span>/</span>
            <span className="text-foreground font-medium">{directory.name}</span>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Link href={`/patients/${patientId}`}>
                <Button variant="outline" size="sm" className="border-2 border-black rounded-md shadow-lg hover:shadow-xl transition-all duration-300">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Patient
                </Button>
              </Link>
              
              <div className="flex items-center space-x-3">
                <div className={`rounded-full p-3 ${colorClass}`}>
                  <IconComponent className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{directory.name}</h1>
                  <p className="text-muted-foreground">
                    {patient.name} • {documents.length} documents
                  </p>
                </div>
              </div>
            </div>
            
            <Link href="/upload">
              <Button className="border-2 border-black rounded-md shadow-lg hover:shadow-xl transition-all duration-300">
                <Upload className="mr-2 h-4 w-4" />
                Upload Documents
              </Button>
            </Link>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-2 border-border rounded-md shadow-sm"
              />
            </div>
          </div>

          {/* Documents Grid */}
          {filteredDocuments.length === 0 ? (
            <Card className="bg-card text-card-foreground border-2 border-black rounded-md shadow-lg">
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery ? "No documents found" : "No documents yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery 
                    ? `No documents match "${searchQuery}"`
                    : `Upload documents to the ${directory.name} directory to get started`
                  }
                </p>
                {!searchQuery && (
                  <Link href="/upload">
                    <Button className="border-2 border-black rounded-md shadow-lg hover:shadow-xl transition-all duration-300">
                      <Upload className="mr-2 h-4 w-4" />
                      Upload First Document
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredDocuments.map((document, index) => (
                <motion.div
                  key={document.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <Card className="bg-card text-card-foreground border-2 border-black rounded-md shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary/10 rounded-full p-2">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{document.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {document.file_type.toUpperCase()} • {formatFileSize(document.file_size)}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Uploaded</span>
                          <span className="font-medium">{formatDate(document.uploaded_at)}</span>
                        </div>
                        {document.analysis_id && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Analysis</span>
                            <span className="font-medium text-green-600">✓ Complete</span>
                          </div>
                        )}
                        {document.tags && document.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {document.tags.map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="px-2 py-1 bg-secondary/50 text-secondary-foreground text-xs rounded-md"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-4 pt-3 border-t">
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}