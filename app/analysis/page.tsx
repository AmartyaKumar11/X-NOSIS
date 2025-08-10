"use client"

import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText, Brain, Stethoscope, Pill, Activity, AlertTriangle, CheckCircle, Clock, Zap } from 'lucide-react'
import { Sidebar } from "@/components/sidebar"
import { VoiceControl } from "@/components/voice-control"
import { MedicalAnalysisResults } from "@/components/medical-analysis-results"
import { useDropzone } from "react-dropzone"
import { useRouter } from "next/navigation"

interface AnalysisResult {
  success: boolean
  analysis_id?: number
  results?: {
    extracted_text: string
    medical_entities: Array<{
      id: number
      text: string
      label: string
      confidence: number
      start_pos: number
      end_pos: number
    }>
    categorized_entities: {
      symptoms: Array<any>
      conditions: Array<any>
      medications: Array<any>
      vital_signs: Array<any>
      lab_values: Array<any>
      anatomy: Array<any>
      procedures: Array<any>
      allergies: Array<any>
      family_history: Array<any>
      social_history: Array<any>
    }
    entity_counts: {
      symptoms: number
      conditions: number
      medications: number
      vital_signs: number
      lab_values: number
      procedures: number
      allergies: number
      family_history: number
      social_history: number
      total_entities: number
    }
    critical_findings: Array<{
      text: string
      category: string
      severity: string
      reason: string
    }>
    differential_diagnosis: Array<{
      condition: string
      confidence: number
      reasoning: string
    }>
    summary: string
    confidence_score: number
    processing_time: number
    processing_metadata: {
      text_length: number
      entities_found: number
      categories_detected: number
      has_critical_findings: boolean
    }
  }
  error?: string
}

export default function AnalysisPage() {
  const router = useRouter()
  const [analysisText, setAnalysisText] = useState("")
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string>("")
  const [analysisProgress, setAnalysisProgress] = useState(0)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setUploadedFile(file)
      setUploadedFileName(file.name)
      setAnalysisResult(null) // Clear previous results
      // Read file content for text files
      if (file.type.startsWith('text/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setAnalysisText(e.target?.result as string || "")
        }
        reader.readAsText(file)
      }
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1
  })

  const analyzeText = async () => {
    if (!analysisText.trim() && !uploadedFile) {
      return
    }

    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setAnalysisResult(null)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + 10
      })
    }, 200)

    try {
      let response: Response

      if (uploadedFile) {
        // File upload analysis
        const formData = new FormData()
        formData.append("file", uploadedFile)
        
        response = await fetch("http://localhost:8000/analyze/text", {
          method: "POST",
          body: formData,
        })
      } else {
        // Direct text analysis
        setUploadedFileName("Direct Text Input")
        response = await fetch("http://localhost:8000/analyze/text-direct", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: analysisText }),
        })
      }

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Analysis failed: ${errorText}`)
      }

      const data = await response.json()
      setAnalysisResult(data)
      setAnalysisProgress(100)

    } catch (error) {
      console.error("Analysis error:", error)
      setAnalysisResult({
        success: false,
        error: String(error)
      })
    } finally {
      clearInterval(progressInterval)
      setIsAnalyzing(false)
    }
  }

  const clearAnalysis = () => {
    setAnalysisText("")
    setAnalysisResult(null)
    setUploadedFile(null)
    setAnalysisProgress(0)
  }

  const handleVoiceAnalyze = () => {
    if (analysisText.trim() || uploadedFile) {
      analyzeText()
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance("Starting medical text analysis")
        speechSynthesis.speak(utterance)
      }
    }
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
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-primary/10 rounded-full p-3">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">AI Medical Text Analysis</h1>
                <p className="text-muted-foreground">
                  Advanced medical document analysis using Bio_ClinicalBERT and medical NER
                </p>
              </div>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-card text-card-foreground border-2 border-black rounded-md shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Stethoscope className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium">Medical Entities</p>
                      <p className="text-xs text-muted-foreground">Symptoms, Conditions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card text-card-foreground border-2 border-black rounded-md shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Pill className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium">Medications</p>
                      <p className="text-xs text-muted-foreground">Drug Recognition</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card text-card-foreground border-2 border-black rounded-md shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium">Differential Diagnosis</p>
                      <p className="text-xs text-muted-foreground">AI Suggestions</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card text-card-foreground border-2 border-black rounded-md shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Zap className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium">95%+ Accuracy</p>
                      <p className="text-xs text-muted-foreground">Clinical Validation</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Section */}
            <div className="space-y-6">
              <Card className="bg-card text-card-foreground border-2 border-black rounded-md shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Medical Text Input</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* File Upload */}
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      isDragActive 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    {uploadedFile ? (
                      <div>
                        <p className="font-medium">{uploadedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(uploadedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium">Drop medical documents here</p>
                        <p className="text-sm text-muted-foreground">
                          Supports PDF, TXT, DOC files (max 10MB)
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="text-center text-sm text-muted-foreground">
                    — OR —
                  </div>

                  {/* Text Input */}
                  <div>
                    <Textarea
                      placeholder="Paste medical text here for analysis...

Example:
Patient presents with chest pain, shortness of breath, and fatigue. History of hypertension and diabetes. Current medications include metformin and lisinopril. Vital signs show elevated blood pressure and heart rate."
                      value={analysisText}
                      onChange={(e) => setAnalysisText(e.target.value)}
                      className="min-h-[200px] border-2 border-border rounded-md"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button
                      onClick={analyzeText}
                      disabled={isAnalyzing || (!analysisText.trim() && !uploadedFile)}
                      className="flex-1 border-2 border-black rounded-md shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {isAnalyzing ? (
                        <>
                          <Clock className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Brain className="mr-2 h-4 w-4" />
                          Analyze Text
                        </>
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={clearAnalysis}
                      className="border-2 border-black rounded-md shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      Clear
                    </Button>
                  </div>

                  {/* Progress Bar */}
                  {isAnalyzing && (
                    <div className="space-y-2">
                      <Progress value={analysisProgress} className="w-full" />
                      <p className="text-sm text-center text-muted-foreground">
                        Processing medical text with Bio_ClinicalBERT...
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Results Section */}
            <div className="space-y-6">
              {analysisResult ? (
                <Card className="bg-card text-card-foreground border-2 border-black rounded-md shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      {analysisResult.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      )}
                      <span>Analysis Results</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analysisResult.success && analysisResult.results ? (
                      <MedicalAnalysisResults 
                        results={analysisResult.results} 
                        fileName={uploadedFileName}
                      />
                    ) : (
                      <div className="text-center py-8">
                        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Analysis Failed</h3>
                        <p className="text-muted-foreground">
                          {analysisResult.error || "An error occurred during analysis"}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-card text-card-foreground border-2 border-black rounded-md shadow-lg">
                  <CardContent className="text-center py-12">
                    <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Ready for Analysis</h3>
                    <p className="text-muted-foreground">
                      Upload a medical document or paste text to begin AI analysis
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Voice Control */}
      <VoiceControl
        onNavigate={(path) => router.push(path)}
        onAnalyze={handleVoiceAnalyze}
      />
    </div>
  )
}