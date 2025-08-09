"use client"

import { useState, useCallback, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, Trash2, CheckCircle, User, Folder } from 'lucide-react'
import { Sidebar } from "@/components/sidebar"
import { useDropzone } from "react-dropzone"

interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  uploadProgress: number
  status: "uploading" | "completed" | "error"
}

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

export default function UploadPage() {

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [analyses, setAnalyses] = useState<{ [id: string]: any }>({});
  const [analysingId, setAnalysingId] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: File}>({});
  
  // Patient management state
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [directories, setDirectories] = useState<Directory[]>([]);
  const [selectedDirectoryId, setSelectedDirectoryId] = useState<string>("");
  const [isLoadingPatients, setIsLoadingPatients] = useState(true);

  // Fetch patients on component mount
  useEffect(() => {
    fetchPatients();
  }, []);

  // Fetch directories when patient is selected
  useEffect(() => {
    if (selectedPatientId) {
      fetchDirectories(selectedPatientId);
    } else {
      setDirectories([]);
      setSelectedDirectoryId("");
    }
  }, [selectedPatientId]);

  const fetchPatients = async () => {
    try {
      setIsLoadingPatients(true);
      const response = await fetch('http://localhost:8000/patients');
      if (response.ok) {
        const data = await response.json();
        setPatients(data.patients || []);
      } else {
        console.error('Failed to fetch patients');
      }
    } catch (error) {
      console.error('Error fetching patients:', error);
    } finally {
      setIsLoadingPatients(false);
    }
  };

  const fetchDirectories = async (patientId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/patients/${patientId}`);
      if (response.ok) {
        const data = await response.json();
        setDirectories(data.patient.directories || []);
        // Auto-select first directory if available
        if (data.patient.directories && data.patient.directories.length > 0) {
          setSelectedDirectoryId(data.patient.directories[0].id);
        }
      } else {
        console.error('Failed to fetch directories');
      }
    } catch (error) {
      console.error('Error fetching directories:', error);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Check if patient and directory are selected
    if (!selectedPatientId || !selectedDirectoryId) {
      alert("Please select a patient and directory before uploading files.");
      return;
    }

    acceptedFiles.forEach((file) => {
      const id = Date.now().toString() + Math.random().toString();
      
      // Store the actual file object
      setUploadedFiles(prev => ({ ...prev, [id]: file }));
      
      setFiles(prev => [...prev, {
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadProgress: 100,
        status: "completed"
      }]);
    });
  }, [selectedPatientId, selectedDirectoryId]);

  const handleAnalyse = async (file: UploadedFile) => {
    setAnalysingId(file.id);
    setAnalyses(prev => ({ ...prev, [file.id]: null }));
    
    // Get the actual uploaded file
    const actualFile = uploadedFiles[file.id];
    if (!actualFile) {
      setAnalyses(prev => ({ ...prev, [file.id]: { error: "File not found. Please re-upload the file." } }));
      setAnalysingId(null);
      return;
    }
    
    const formData = new FormData();
    formData.append("file", actualFile);
    
    try {
      // Call our enhanced backend API
      const res = await fetch("http://localhost:8000/analyze/text", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Analysis failed: ${errorText}`);
      }
      
      const data = await res.json();
      
      // Transform the response to match the expected format
      const transformedData = {
        success: data.success,
        analysis_id: data.analysis_id,
        text: data.results?.extracted_text || testContent,
        result: {
          medical_entities: data.results?.medical_entities || [],
          entity_summary: data.results?.entity_summary || {},
          differential_diagnosis: data.results?.differential_diagnosis || [],
          summary: data.results?.summary || "Analysis completed",
          confidence_score: data.results?.confidence_score || 0,
          processing_time: data.results?.processing_time || 0
        }
      };
      
      setAnalyses(prev => ({ ...prev, [file.id]: transformedData }));
    } catch (err) {
      console.error("Analysis error:", err);
      setAnalyses(prev => ({ ...prev, [file.id]: { error: String(err) } }));
    }
    setAnalysingId(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  })

  const deleteFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    // Also remove from uploaded files
    setUploadedFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[id];
      return newFiles;
    });
    // Remove analysis if exists
    setAnalyses(prev => {
      const newAnalyses = { ...prev };
      delete newAnalyses[id];
      return newAnalyses;
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Ensure no stray characters or comments here
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <div className="flex-1 p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-3xl font-bold mb-8">Analyse Report</h1>

          {/* Patient and Directory Selection */}
          <Card className="mb-6 bg-card text-card-foreground border-2 border-black rounded-md shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Select Patient & Directory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Patient</label>
                  <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                    <SelectTrigger className="border-2 border-border rounded-md">
                      <SelectValue placeholder={isLoadingPatients ? "Loading patients..." : "Select a patient"} />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2" />
                            {patient.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Directory</label>
                  <Select 
                    value={selectedDirectoryId} 
                    onValueChange={setSelectedDirectoryId}
                    disabled={!selectedPatientId}
                  >
                    <SelectTrigger className="border-2 border-border rounded-md">
                      <SelectValue placeholder={selectedPatientId ? "Select a directory" : "Select patient first"} />
                    </SelectTrigger>
                    <SelectContent>
                      {directories.map((directory) => (
                        <SelectItem key={directory.id} value={directory.id}>
                          <div className="flex items-center">
                            <Folder className="h-4 w-4 mr-2" />
                            {directory.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {selectedPatientId && selectedDirectoryId && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <p className="text-sm text-green-800">
                    ✅ Ready to upload to <strong>{directories.find(d => d.id === selectedDirectoryId)?.name}</strong> for patient <strong>{patients.find(p => p.id === selectedPatientId)?.name}</strong>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upload Area */}
          <Card className="mb-8 bg-card text-card-foreground border-2 border-secondary/30">
            <CardContent className="p-8">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  !selectedPatientId || !selectedDirectoryId
                    ? 'border-muted-foreground/25 bg-muted/20 cursor-not-allowed opacity-50'
                    : isDragActive 
                      ? 'border-primary bg-primary/5 cursor-pointer' 
                      : 'border-muted-foreground/25 hover:border-primary/50 cursor-pointer'
                }`}
              >
                <input {...getInputProps()} disabled={!selectedPatientId || !selectedDirectoryId} />
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                {!selectedPatientId || !selectedDirectoryId ? (
                  <div>
                    <p className="text-lg mb-2 text-muted-foreground">Select patient and directory first</p>
                    <p className="text-sm text-muted-foreground">
                      Choose a patient and directory above to enable file upload
                    </p>
                  </div>
                ) : isDragActive ? (
                  <p className="text-lg text-primary">Drop the files here...</p>
                ) : (
                  <div>
                    <p className="text-lg mb-2">Drag & drop files here, or click to select</p>
                    <p className="text-sm text-muted-foreground">
                      Supports PDF, TXT, DOC, DOCX files up to 10MB
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Uploaded Files */}
          {files.length > 0 && (
            <Card className="bg-card text-card-foreground border-2 border-secondary/30">
              <CardHeader>
                <CardTitle>
                  Uploaded Reports ({files.length})
                  {selectedPatientId && selectedDirectoryId && (
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      → {patients.find(p => p.id === selectedPatientId)?.name} / {directories.find(d => d.id === selectedDirectoryId)?.name}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {files.map((file, index) => (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="flex flex-col gap-2 p-4 border-2 border-secondary/20 rounded-lg bg-card/50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <FileText className="h-8 w-8 text-primary" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{file.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteFile(file.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex justify-end mt-4">
        <Button
          variant="default"
          size="default"
          onClick={() => handleAnalyse(file)}
          disabled={analysingId === file.id}
          className="bg-primary text-primary-foreground border border-primary shadow-md font-semibold px-6 py-2 rounded-lg transition-colors hover:bg-primary/90"
        >
          {analysingId === file.id ? "Analysing..." : "Analyse"}
        </Button>
                      </div>
                      {/* Enhanced Analysis Results Card */}
                      {analyses[file.id] && (
                        <Card className="mt-4 border border-primary/40 bg-background">
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              🧠 Medical AI Analysis
                              {analyses[file.id].success && (
                                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                  ✅ Completed
                                </span>
                              )}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {analyses[file.id].error ? (
                              <div className="text-destructive">
                                <p className="font-semibold">❌ Analysis Error:</p>
                                <p className="text-sm mt-1">{analyses[file.id].error}</p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {/* Summary */}
                                <div>
                                  <h4 className="font-semibold text-sm mb-2">📝 Clinical Summary:</h4>
                                  <p className="text-sm bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                                    {analyses[file.id].result?.summary || "Analysis completed"}
                                  </p>
                                </div>

                                {/* Entity Summary */}
                                {analyses[file.id].result?.entity_summary && (
                                  <div>
                                    <h4 className="font-semibold text-sm mb-2">📊 Entities Found:</h4>
                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                      <div className="bg-red-50 p-2 rounded">
                                        <span className="font-medium">Symptoms:</span> {analyses[file.id].result.entity_summary.symptoms || 0}
                                      </div>
                                      <div className="bg-orange-50 p-2 rounded">
                                        <span className="font-medium">Conditions:</span> {analyses[file.id].result.entity_summary.conditions || 0}
                                      </div>
                                      <div className="bg-green-50 p-2 rounded">
                                        <span className="font-medium">Medications:</span> {analyses[file.id].result.entity_summary.medications || 0}
                                      </div>
                                      <div className="bg-purple-50 p-2 rounded">
                                        <span className="font-medium">Total:</span> {analyses[file.id].result.entity_summary.total_entities || 0}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Medical Entities */}
                                {analyses[file.id].result?.medical_entities && analyses[file.id].result.medical_entities.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold text-sm mb-2">🏷️ Medical Entities:</h4>
                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                      {analyses[file.id].result.medical_entities.slice(0, 10).map((entity: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded">
                                          <span className="font-medium">{entity.text}</span>
                                          <div className="flex gap-2">
                                            <span className={`px-2 py-1 rounded text-xs ${
                                              entity.label === 'SYMPTOM' ? 'bg-red-100 text-red-800' :
                                              entity.label === 'CONDITION' ? 'bg-orange-100 text-orange-800' :
                                              entity.label === 'MEDICATION' ? 'bg-green-100 text-green-800' :
                                              'bg-blue-100 text-blue-800'
                                            }`}>
                                              {entity.label}
                                            </span>
                                            <span className="text-gray-600">{(entity.confidence * 100).toFixed(0)}%</span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Differential Diagnosis */}
                                {analyses[file.id].result?.differential_diagnosis && analyses[file.id].result.differential_diagnosis.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold text-sm mb-2">🩺 Differential Diagnosis:</h4>
                                    <div className="space-y-2">
                                      {analyses[file.id].result.differential_diagnosis.slice(0, 3).map((dx: any, idx: number) => (
                                        <div key={idx} className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                                          <div className="flex justify-between items-start">
                                            <span className="font-medium text-sm">{dx.condition}</span>
                                            <span className="text-xs bg-yellow-200 px-2 py-1 rounded">
                                              {(dx.confidence * 100).toFixed(0)}%
                                            </span>
                                          </div>
                                          <p className="text-xs text-gray-600 mt-1">{dx.reasoning}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Analysis Metadata */}
                                <div className="text-xs text-gray-500 border-t pt-2">
                                  <div className="flex justify-between">
                                    <span>Confidence: {((analyses[file.id].result?.confidence_score || 0) * 100).toFixed(0)}%</span>
                                    <span>Processing: {(analyses[file.id].result?.processing_time || 0).toFixed(2)}s</span>
                                    {analyses[file.id].analysis_id && (
                                      <span>ID: #{analyses[file.id].analysis_id}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
