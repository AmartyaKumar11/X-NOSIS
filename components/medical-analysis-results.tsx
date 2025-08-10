"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  AlertTriangle, 
  Activity, 
  Pill, 
  Stethoscope, 
  TestTube, 
  User, 
  Heart, 
  Brain, 
  Eye,
  FileText,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  Users
} from 'lucide-react'
import React from 'react'

interface MedicalEntity {
  id: number
  text: string
  label: string
  start_pos: number
  end_pos: number
  confidence: number
  source?: string
}

interface CriticalFinding {
  text: string
  category: string
  severity: string
  reason: string
}

interface DifferentialDiagnosis {
  condition: string
  confidence: number
  reasoning: string
}

interface AnalysisResults {
  extracted_text: string
  medical_entities: MedicalEntity[]
  categorized_entities: {
    symptoms: MedicalEntity[]
    conditions: MedicalEntity[]
    medications: MedicalEntity[]
    vital_signs: MedicalEntity[]
    lab_values: MedicalEntity[]
    anatomy: MedicalEntity[]
    procedures: MedicalEntity[]
    allergies: MedicalEntity[]
    family_history: MedicalEntity[]
    social_history: MedicalEntity[]
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
  summary: string
  critical_findings: CriticalFinding[]
  differential_diagnosis: DifferentialDiagnosis[]
  confidence_score: number
  processing_metadata: {
    text_length: number
    entities_found: number
    categories_detected: number
    has_critical_findings: boolean
  }
}

interface MedicalAnalysisResultsProps {
  results: AnalysisResults
  fileName?: string
}

const categoryIcons = {
  symptoms: Activity,
  conditions: AlertCircle,
  medications: Pill,
  vital_signs: Heart,
  lab_values: TestTube,
  anatomy: User,
  procedures: Stethoscope,
  allergies: AlertTriangle,
  family_history: Users,
  social_history: FileText
}

const categoryColors = {
  symptoms: "bg-red-100 text-red-800 border-red-200",
  conditions: "bg-orange-100 text-orange-800 border-orange-200",
  medications: "bg-blue-100 text-blue-800 border-blue-200",
  vital_signs: "bg-green-100 text-green-800 border-green-200",
  lab_values: "bg-purple-100 text-purple-800 border-purple-200",
  anatomy: "bg-gray-100 text-gray-800 border-gray-200",
  procedures: "bg-teal-100 text-teal-800 border-teal-200",
  allergies: "bg-yellow-100 text-yellow-800 border-yellow-200",
  family_history: "bg-indigo-100 text-indigo-800 border-indigo-200",
  social_history: "bg-pink-100 text-pink-800 border-pink-200"
}

export function MedicalAnalysisResults({ results, fileName }: MedicalAnalysisResultsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "text-green-600"
    if (confidence >= 0.6) return "text-yellow-600"
    return "text-red-600"
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-100 text-green-800"
    if (confidence >= 0.6) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-card text-card-foreground border-2 border-black rounded-md shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center">
                  <Brain className="h-6 w-6 mr-2 text-primary" />
                  Medical Analysis Results
                </CardTitle>
                {fileName && (
                  <p className="text-sm text-muted-foreground mt-1">File: {fileName}</p>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{results.entity_counts.total_entities}</div>
                  <div className="text-xs text-muted-foreground">Entities Found</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getConfidenceColor(results.confidence_score)}`}>
                    {Math.round(results.confidence_score * 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Confidence</div>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Summary
              </h4>
              <p className="text-sm leading-relaxed">{results.summary}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Critical Findings Alert */}
      {results.critical_findings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-red-50 border-2 border-red-200 rounded-md shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center text-red-800">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Critical Findings Detected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {results.critical_findings.map((finding, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border border-red-200">
                    <div>
                      <span className="font-medium text-red-900">{finding.text}</span>
                      <p className="text-sm text-red-700">{finding.reason}</p>
                    </div>
                    <Badge className="bg-red-100 text-red-800">{finding.severity}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Category Overview Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
      >
        {Object.entries(results.entity_counts).filter(([key]) => key !== 'total_entities').map(([category, count]) => {
          if (count === 0) return null
          
          const IconComponent = categoryIcons[category as keyof typeof categoryIcons] || FileText
          const colorClass = categoryColors[category as keyof typeof categoryColors] || "bg-gray-100 text-gray-800"
          
          return (
            <Card 
              key={category}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                selectedCategory === category ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
            >
              <CardContent className="p-4 text-center">
                <IconComponent className="h-8 w-8 mx-auto mb-2 text-primary" />
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {category.replace('_', ' ')}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </motion.div>

      {/* Detailed Entity Display */}
      {selectedCategory && results.categorized_entities[selectedCategory as keyof typeof results.categorized_entities]?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-card text-card-foreground border-2 border-black rounded-md shadow-lg">
            <CardHeader>
              <CardTitle className="capitalize flex items-center">
                {React.createElement(categoryIcons[selectedCategory as keyof typeof categoryIcons] || FileText, {
                  className: "h-5 w-5 mr-2"
                })}
                {selectedCategory.replace('_', ' ')} Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {results.categorized_entities[selectedCategory as keyof typeof results.categorized_entities].map((entity, index) => (
                  <div 
                    key={entity.id}
                    className={`p-3 rounded-lg border-2 ${categoryColors[selectedCategory as keyof typeof categoryColors]}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{entity.text}</span>
                      <Badge className={getConfidenceBadge(entity.confidence)}>
                        {Math.round(entity.confidence * 100)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Differential Diagnosis */}
      {results.differential_diagnosis.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="bg-card text-card-foreground border-2 border-black rounded-md shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Differential Diagnosis Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {results.differential_diagnosis.map((diagnosis, index) => (
                  <div key={index} className="p-4 bg-muted/50 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{diagnosis.condition}</h4>
                      <Badge className={getConfidenceBadge(diagnosis.confidence)}>
                        {Math.round(diagnosis.confidence * 100)}% match
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{diagnosis.reasoning}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Processing Metadata */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="bg-muted/30 border border-muted">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold">{results.processing_metadata.text_length}</div>
                <div className="text-xs text-muted-foreground">Characters Analyzed</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{results.processing_metadata.entities_found}</div>
                <div className="text-xs text-muted-foreground">Medical Terms Found</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{results.processing_metadata.categories_detected}</div>
                <div className="text-xs text-muted-foreground">Categories Detected</div>
              </div>
              <div>
                <div className={`text-lg font-semibold ${results.processing_metadata.has_critical_findings ? 'text-red-600' : 'text-green-600'}`}>
                  {results.processing_metadata.has_critical_findings ? 'Yes' : 'No'}
                </div>
                <div className="text-xs text-muted-foreground">Critical Findings</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}