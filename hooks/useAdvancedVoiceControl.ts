"use client"

import { useState, useEffect, useRef } from 'react'

// Option 1: OpenAI Whisper (Most Accurate)
// You'll need to install: npm install openai
// This sends audio to OpenAI's Whisper API for transcription

interface UseAdvancedVoiceControlProps {
  onCreatePatient?: (data: any) => void
  onDeletePatient?: (patientName: string) => void
  onNavigate?: (path: string) => void
  onSearch?: (query: string) => void
  onCommandProcessed?: () => void
}

export function useAdvancedVoiceControl({
  onCreatePatient,
  onDeletePatient,
  onNavigate,
  onSearch,
  onCommandProcessed
}: UseAdvancedVoiceControlProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  // Check if browser supports MediaRecorder
  useEffect(() => {
    setIsSupported(typeof MediaRecorder !== 'undefined')
  }, [])

  // Process commands using AI-powered NLP
  const processCommandWithAI = async (text: string) => {
    console.log('🤖 Processing with AI:', text)
    
    // Use OpenAI GPT for intent recognition (more accurate than regex)
    try {
      const response = await fetch('/api/process-voice-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })
      
      if (response.ok) {
        const result = await response.json()
        executeCommand(result)
      }
    } catch (error) {
      console.error('AI processing failed, falling back to simple parsing:', error)
      // Fallback to simple text analysis
      parseCommandSimple(text)
    }
  }

  // Simple fallback command parsing
  const parseCommandSimple = (text: string) => {
    const lowerText = text.toLowerCase()
    
    // Create patient
    if (lowerText.includes('create') && lowerText.includes('patient')) {
      const nameMatch = text.match(/(?:patient|named|called)\s+([a-zA-Z\s]+?)(?:\s|$)/i)
      if (nameMatch && onCreatePatient) {
        onCreatePatient({
          name: nameMatch[1].trim(),
          date_of_birth: null,
          metadata: { phone: '', email: '' }
        })
      }
    }
    
    // Delete patient
    else if (lowerText.includes('delete') || lowerText.includes('remove')) {
      const nameMatch = text.match(/(?:delete|remove).*?(?:patient|named|called)?\s+([a-zA-Z\s]+?)(?:\s|$)/i)
      if (nameMatch && onDeletePatient) {
        onDeletePatient(nameMatch[1].trim())
      }
    }
    
    // Navigate
    else if (lowerText.includes('go to') || lowerText.includes('navigate')) {
      if (lowerText.includes('dashboard')) onNavigate?.('/dashboard')
      else if (lowerText.includes('patient')) onNavigate?.('/patients')
      else if (lowerText.includes('upload')) onNavigate?.('/upload')
    }
    
    // Search
    else if (lowerText.includes('search') || lowerText.includes('find')) {
      const nameMatch = text.match(/(?:search|find).*?(?:patient|for)?\s+([a-zA-Z\s]+?)(?:\s|$)/i)
      if (nameMatch && onSearch) {
        onSearch(nameMatch[1].trim())
      }
    }
  }

  const executeCommand = (command: any) => {
    switch (command.intent) {
      case 'create_patient':
        if (onCreatePatient) {
          onCreatePatient({
            name: command.patientName,
            date_of_birth: command.dateOfBirth || null,
            metadata: {
              phone: command.phone || '',
              email: command.email || ''
            }
          })
        }
        break
      case 'delete_patient':
        if (onDeletePatient) {
          onDeletePatient(command.patientName)
        }
        break
      case 'navigate':
        if (onNavigate) {
          onNavigate(command.destination)
        }
        break
      case 'search':
        if (onSearch) {
          onSearch(command.query)
        }
        break
    }
    
    if (onCommandProcessed) {
      setTimeout(onCommandProcessed, 1000)
    }
  }

  // Transcribe audio using OpenAI Whisper
  const transcribeWithWhisper = async (audioBlob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('file', audioBlob, 'audio.wav')
      formData.append('model', 'whisper-1')
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        const result = await response.json()
        setTranscript(result.text)
        processCommandWithAI(result.text)
      }
    } catch (error) {
      console.error('Whisper transcription failed:', error)
    }
  }

  const startListening = async () => {
    if (!isSupported) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        transcribeWithWhisper(audioBlob)
      }

      mediaRecorder.start()
      setIsListening(true)
      
      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopListening()
        }
      }, 10000)
      
    } catch (error) {
      console.error('Failed to start recording:', error)
    }
  }

  const stopListening = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    
    setIsListening(false)
  }

  return {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening
  }
}