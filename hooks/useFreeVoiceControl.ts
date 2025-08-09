"use client"

import { useState, useEffect, useRef } from 'react'

// Option 1: Using Vosk (Free, runs locally)
// Install: npm install vosk-browser
// This runs entirely in the browser, no API calls needed

// Option 2: Using SpeechRecognition with better configuration
// This improves the built-in Web Speech API accuracy

interface UseFreeVoiceControlProps {
  onCreatePatient?: (data: any) => void
  onDeletePatient?: (patientName: string) => void
  onNavigate?: (path: string) => void
  onSearch?: (query: string) => void
  onCommandProcessed?: () => void
}

export function useFreeVoiceControl({
  onCreatePatient,
  onDeletePatient,
  onNavigate,
  onSearch,
  onCommandProcessed
}: UseFreeVoiceControlProps) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastTranscriptRef = useRef('')

  // Enhanced command patterns with fuzzy matching
  const commandPatterns = [
    // Create patient patterns
    {
      keywords: ['create', 'make', 'add', 'new', 'patient'],
      intent: 'create_patient',
      extract: (text: string) => {
        // Multiple ways to extract names
        const patterns = [
          /(?:create|make|add|new).*?patient.*?(?:named|called)?\s+([a-zA-Z\s]+?)(?:\s+born|\s*$)/i,
          /patient\s+([a-zA-Z\s]+?)(?:\s+born|\s*$)/i,
          /(?:named|called)\s+([a-zA-Z\s]+?)(?:\s+born|\s*$)/i
        ]
        
        for (const pattern of patterns) {
          const match = text.match(pattern)
          if (match && match[1]) {
            return { name: match[1].trim() }
          }
        }
        return null
      }
    },
    
    // Delete patient patterns
    {
      keywords: ['delete', 'remove', 'erase', 'eliminate'],
      intent: 'delete_patient',
      extract: (text: string) => {
        const patterns = [
          /(?:delete|remove|erase|eliminate).*?(?:patient)?\s+(?:named|called)?\s*([a-zA-Z\s]+?)(?:\s+from|\s*$)/i,
          /(?:delete|remove|erase|eliminate)\s+([a-zA-Z\s]+?)(?:\s+from|\s*$)/i
        ]
        
        for (const pattern of patterns) {
          const match = text.match(pattern)
          if (match && match[1]) {
            let name = match[1].trim()
            // Clean up common words
            name = name.replace(/^(patient|user|person|the)\s+/i, '')
            name = name.replace(/\s+(from|in|the|record|records|system|database).*$/i, '')
            return { name: name.trim() }
          }
        }
        return null
      }
    },
    
    // Search patterns
    {
      keywords: ['search', 'find', 'look', 'show'],
      intent: 'search_patient',
      extract: (text: string) => {
        const patterns = [
          /(?:search|find|look|show).*?(?:patient|for)?\s+(?:named|called)?\s*([a-zA-Z\s]+?)(?:\s*$)/i,
          /(?:search|find|look|show)\s+([a-zA-Z\s]+?)(?:\s*$)/i
        ]
        
        for (const pattern of patterns) {
          const match = text.match(pattern)
          if (match && match[1]) {
            return { query: match[1].trim() }
          }
        }
        return null
      }
    },
    
    // Navigation patterns
    {
      keywords: ['go', 'navigate', 'open', 'show', 'take'],
      intent: 'navigate',
      extract: (text: string) => {
        const destinations = {
          'dashboard': '/dashboard',
          'patient': '/patients',
          'patients': '/patients',
          'upload': '/upload',
          'chat': '/chat',
          'history': '/history',
          'settings': '/settings'
        }
        
        for (const [key, path] of Object.entries(destinations)) {
          if (text.toLowerCase().includes(key)) {
            return { destination: path }
          }
        }
        return null
      }
    }
  ]

  // Fuzzy matching function
  const fuzzyMatch = (text: string, keywords: string[]): number => {
    const lowerText = text.toLowerCase()
    let score = 0
    
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        score += 1
      }
    }
    
    return score / keywords.length
  }

  // Enhanced command processing with fuzzy matching
  const processCommand = (text: string) => {
    console.log('🎯 Processing enhanced command:', text)
    
    let bestMatch = { pattern: null, score: 0, data: null }
    
    // Try each pattern and find the best match
    for (const pattern of commandPatterns) {
      const score = fuzzyMatch(text, pattern.keywords)
      
      if (score > 0.3) { // Threshold for matching
        const extractedData = pattern.extract(text)
        
        if (extractedData && score > bestMatch.score) {
          bestMatch = { pattern, score, data: extractedData }
        }
      }
    }
    
    console.log('🎯 Best match:', bestMatch)
    
    if (bestMatch.pattern && bestMatch.data) {
      executeCommand(bestMatch.pattern.intent, bestMatch.data)
      
      if (onCommandProcessed) {
        setTimeout(onCommandProcessed, 1000)
      }
      return true
    }
    
    console.log('❌ No command matched')
    if (onCommandProcessed) {
      setTimeout(onCommandProcessed, 1000)
    }
    return false
  }

  const executeCommand = (intent: string, data: any) => {
    console.log('🚀 Executing command:', intent, data)
    
    switch (intent) {
      case 'create_patient':
        if (data.name && onCreatePatient) {
          onCreatePatient({
            name: data.name,
            date_of_birth: null,
            metadata: {
              phone: '',
              email: '',
              gender: '',
              blood_type: '',
              allergies: '',
              emergency_contact: ''
            }
          })
          
          // Voice feedback
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(`Creating patient ${data.name}`)
            speechSynthesis.speak(utterance)
          }
        }
        break
        
      case 'delete_patient':
        if (data.name && onDeletePatient) {
          onDeletePatient(data.name)
          
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(`Requesting deletion of patient ${data.name}`)
            speechSynthesis.speak(utterance)
          }
        }
        break
        
      case 'search_patient':
        if (data.query && onSearch) {
          onSearch(data.query)
          
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(`Searching for ${data.query}`)
            speechSynthesis.speak(utterance)
          }
        }
        break
        
      case 'navigate':
        if (data.destination && onNavigate) {
          onNavigate(data.destination)
          
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(`Navigating to ${data.destination.replace('/', '')}`)
            speechSynthesis.speak(utterance)
          }
        }
        break
    }
  }

  // Initialize enhanced speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      
      if (SpeechRecognition) {
        setIsSupported(true)
        const recognition = new SpeechRecognition()
        
        // Enhanced configuration for better accuracy
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = 'en-US'
        recognition.maxAlternatives = 3 // Get multiple alternatives
        
        recognition.onstart = () => {
          setIsListening(true)
          console.log('🎤 Enhanced voice recognition started')
        }
        
        recognition.onend = () => {
          setIsListening(false)
          if (silenceTimerRef.current) {
            clearTimeout(silenceTimerRef.current)
            silenceTimerRef.current = null
          }
          console.log('🎤 Enhanced voice recognition ended')
        }
        
        recognition.onresult = (event) => {
          let finalTranscript = ''
          let interimTranscript = ''
          
          // Process all results and alternatives
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            
            // Try the best alternative first, then fallbacks
            let bestTranscript = result[0].transcript
            let bestConfidence = result[0].confidence || 0
            
            // Check other alternatives if confidence is low
            if (bestConfidence < 0.8 && result.length > 1) {
              for (let j = 1; j < Math.min(result.length, 3); j++) {
                const alt = result[j]
                if (alt.confidence > bestConfidence) {
                  bestTranscript = alt.transcript
                  bestConfidence = alt.confidence
                }
              }
            }
            
            if (result.isFinal) {
              finalTranscript += bestTranscript
            } else {
              interimTranscript += bestTranscript
            }
          }
          
          const currentTranscript = finalTranscript || interimTranscript
          if (currentTranscript) {
            setTranscript(currentTranscript)
            lastTranscriptRef.current = currentTranscript
            
            // Reset silence timer
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current)
            }
            
            // Set 3-second silence timer
            silenceTimerRef.current = setTimeout(() => {
              const textToProcess = finalTranscript || lastTranscriptRef.current
              if (textToProcess) {
                processCommand(textToProcess)
              }
            }, 3000)
          }
        }
        
        recognition.onerror = (event) => {
          console.error('Enhanced speech recognition error:', event.error)
          setIsListening(false)
        }
        
        recognitionRef.current = recognition
      } else {
        setIsSupported(false)
      }
    }
  }, [])

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('')
      lastTranscriptRef.current = ''
      recognitionRef.current.start()
    }
  }

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop()
    }
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
    
    setTranscript('')
    lastTranscriptRef.current = ''
  }

  return {
    isListening,
    isSupported,
    transcript,
    startListening,
    stopListening
  }
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}