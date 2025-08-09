"use client"

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Mic, MicOff, Volume2, X } from 'lucide-react'
import { useFreeVoiceControl } from '@/hooks/useFreeVoiceControl'

interface VoiceControlProps {
  onCreatePatient?: (data: any) => void
  onEditPatient?: (id: string, data: any) => void
  onDeletePatient?: (patientName: string) => void
  onNavigate?: (path: string) => void
  onSearch?: (query: string) => void
  onUploadDocument?: (patientName: string, directoryName: string) => void
}

export function VoiceControl({
  onCreatePatient,
  onEditPatient,
  onDeletePatient,
  onNavigate,
  onSearch,
  onUploadDocument
}: VoiceControlProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [patientToDelete, setPatientToDelete] = useState<string>('')
  
  // Create callback for closing dialog
  const closeVoiceDialog = useCallback(() => {
    setIsDialogOpen(false)
  }, [])

  // Define delete handler before using it in the hook
  const handleDeleteRequest = useCallback((patientName: string) => {
    setPatientToDelete(patientName)
    setIsConfirmDeleteOpen(true)
    // Close the voice dialog
    setIsDialogOpen(false)
  }, [])

  const {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening
  } = useFreeVoiceControl({
    onCreatePatient,
    onEditPatient,
    onDeletePatient: handleDeleteRequest, // Use the confirmation handler
    onNavigate,
    onSearch,
    onUploadDocument,
    onCommandProcessed: closeVoiceDialog
  })

  const openVoiceDialog = () => {
    setIsDialogOpen(true)
    setTimeout(() => {
      startListening()
    }, 500) // Small delay to let dialog open
  }

  const handleCloseDialog = () => {
    stopListening()
    setIsDialogOpen(false)
  }

  const confirmDelete = () => {
    if (patientToDelete && onDeletePatient) {
      onDeletePatient(patientToDelete)
    }
    setIsConfirmDeleteOpen(false)
    setPatientToDelete('')
  }

  const cancelDelete = () => {
    setIsConfirmDeleteOpen(false)
    setPatientToDelete('')
  }

  // Text-to-speech for feedback
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.8
      utterance.pitch = 1
      speechSynthesis.speak(utterance)
    }
  }

  if (!isSupported) {
    return null
  }

  return (
    <>
      {/* Voice Control Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={openVoiceDialog}
          className="w-16 h-16 rounded-full border-2 border-black shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Mic className="h-6 w-6" />
        </Button>
      </div>

      {/* Voice Control Dialog */}
      <AnimatePresence>
        {isDialogOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={handleCloseDialog}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white text-black border-2 border-black rounded-lg p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={handleCloseDialog}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Pulsing Mic Icon */}
              <div className="flex flex-col items-center space-y-6">
                <div className="relative">
                  {/* Pulse rings */}
                  {isListening && (
                    <>
                      <motion.div
                        className="absolute inset-0 rounded-full bg-red-400/30"
                        animate={{
                          scale: [1, 2.5],
                          opacity: [0.6, 0]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          ease: "easeOut"
                        }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-full bg-red-400/20"
                        animate={{
                          scale: [1, 2.5],
                          opacity: [0.4, 0]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: 0.75,
                          ease: "easeOut"
                        }}
                      />
                    </>
                  )}
                  
                  {/* Mic Icon */}
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 border-black ${
                    isListening ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Mic className="h-8 w-8" />
                  </div>
                </div>

                {/* Status Text */}
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">
                    {isListening ? 'Listening...' : 'Starting...'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {isListening ? 'Speak your command clearly' : 'Preparing voice recognition'}
                  </p>
                </div>

                {/* Transcript */}
                {transcript && (
                  <div className="w-full">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Volume2 className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">You said:</span>
                      </div>
                      <p className="text-sm text-gray-800">{transcript}</p>
                    </div>
                  </div>
                )}

                {/* Voice Commands Help */}
                <div className="w-full">
                  <h4 className="font-semibold mb-2 text-sm">Try saying:</h4>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p>• "Can you create a new patient named John Doe"</p>
                    <p>• "Make a patient called Sarah born 6th August"</p>
                    <p>• "Please find patient John"</p>
                    <p>• "Take me to the dashboard"</p>
                    <p>• "Upload a document for John to imaging"</p>
                    <p>• "Help" - for more options</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {isConfirmDeleteOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={cancelDelete}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white text-black border-2 border-black rounded-lg p-6 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={cancelDelete}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Confirmation Content */}
              <div className="flex flex-col items-center space-y-6">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>

                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">Delete Patient?</h3>
                  <p className="text-gray-600 mb-4">
                    Are you sure you want to delete patient <strong>"{patientToDelete}"</strong>?
                  </p>
                  <p className="text-sm text-red-600">
                    This action cannot be undone and will remove all associated data.
                  </p>
                </div>

                <div className="flex space-x-4 w-full">
                  <button
                    onClick={cancelDelete}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 px-4 py-2 bg-red-600 text-white border-2 border-red-600 rounded-md hover:bg-red-700 transition-colors"
                  >
                    Delete Patient
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}