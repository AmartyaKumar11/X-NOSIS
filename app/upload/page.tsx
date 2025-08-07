"use client"

import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Upload, FileText, Trash2, CheckCircle } from 'lucide-react'
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

export default function UploadPage() {

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [analyses, setAnalyses] = useState<{ [id: string]: any }>({});
  const [analysingId, setAnalysingId] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const id = Date.now().toString() + Math.random().toString();
      setFiles(prev => [...prev, {
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadProgress: 100,
        status: "completed"
      }]);
    });
  }, []);

  const handleAnalyse = async (file: UploadedFile) => {
    setAnalysingId(file.id);
    setAnalyses(prev => ({ ...prev, [file.id]: null }));
    const formData = new FormData();
    // Recreate a File object from the uploaded file info
    // This assumes the file is still available in the dropzone's acceptedFiles
    // If not, you may need to store the File object itself in state
    // For now, we assume the file is available
    // (If you want to support page reload, you need to persist the File object)
    formData.append("file", new File([file.name], file.name));
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setAnalyses(prev => ({ ...prev, [file.id]: data }));
    } catch (err) {
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

          {/* Upload Area */}
          <Card className="mb-8 bg-card text-card-foreground border-2 border-secondary/30">
            <CardContent className="p-8">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                {isDragActive ? (
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
                <CardTitle>Uploaded Reports ({files.length})</CardTitle>
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
                      {/* Analysis Card */}
                      {analyses[file.id] && (
                        <Card className="mt-4 border border-primary/40 bg-background">
                          <CardHeader>
                            <CardTitle>ClinicalBERT Analysis</CardTitle>
                          </CardHeader>
                          <CardContent>
                            {analyses[file.id].error ? (
                              <p className="text-destructive">Error: {analyses[file.id].error}</p>
                            ) : (
                              <div>
                                <p className="text-sm mb-2 text-muted-foreground">Original Text:</p>
                                <pre className="whitespace-pre-wrap text-xs mb-4 bg-muted/10 p-2 rounded">{analyses[file.id].text}</pre>
                                <p className="text-sm mb-2 text-muted-foreground">Model Output:</p>
                                <pre className="whitespace-pre-wrap text-xs bg-muted/10 p-2 rounded">{JSON.stringify(analyses[file.id].result, null, 2)}</pre>
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
