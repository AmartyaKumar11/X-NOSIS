"use client"

import { useState, useEffect, useRef } from 'react'

// Option: Using Vosk for completely offline speech recognition
// Install: npm install vosk-browser
// This runs entirely offline, no internet required after initial model download

interface UseOfflineVoiceControlProps {
    onCreatePatient?: (data: any) => void
    onDeletePatient?: (patientName: string) => void
    onNavigate?: (path: string) => void
    onSearch?: (query: string) => void
    onCommandProcessed?: () => void
}

export function useOfflineVoiceControl({
    onCreatePatient,
    onDeletePatient,
    onNavigate,
    onSearch,
    onCommandProcessed
}: UseOfflineVoiceControlProps) {
    const [isListening, setIsListening] = useState(false)
    const [transcript, setTranscript] = useState('')
    const [isSupported, setIsSupported] = useState(false)
    const [isModelLoaded, setIsModelLoaded] = useState(false)
    const voskRef = useRef<any>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const streamRef = useRef<MediaStream | null>(null)

    // Load Vosk model
    useEffect(() => {
        const loadVosk = async () => {
            try {
                // Dynamic import to avoid SSR issues
                const { createModel, createRecognizer } = await import('vosk-browser')

                // Load small English model (about 40MB)
                const modelUrl = 'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip'

                console.log('Loading Vosk model...')
                const model = await createModel(modelUrl)
                const recognizer = await createRecognizer(model, 16000)

                voskRef.current = recognizer
                setIsModelLoaded(true)
                setIsSupported(true)
                console.log('✅ Vosk model loaded successfully')

            } catch (error) {
                console.error('Failed to load Vosk:', error)
                setIsSupported(false)
            }
        }

        loadVosk()
    }, [])

    // Enhanced command processing (same as free version)
    const processCommand = (text: string) => {
        console.log('🎯 Processing offline command:', text)

        const lowerText = text.toLowerCase()

        // Create patient
        if (lowerText.includes('create') || lowerText.includes('make') || lowerText.includes('add')) {
            if (lowerText.includes('patient')) {
                const namePatterns = [
                    /(?:create|make|add).*?patient.*?(?:named|called)?\s+([a-zA-Z\s]+?)(?:\s|$)/i,
                    /patient\s+([a-zA-Z\s]+?)(?:\s|$)/i,
                    /(?:named|called)\s+([a-zA-Z\s]+?)(?:\s|$)/i
                ]

                for (const pattern of namePatterns) {
                    const match = text.match(pattern)
                    if (match && match[1] && onCreatePatient) {
                        const name = match[1].trim()
                        onCreatePatient({
                            name,
                            date_of_birth: null,
                            metadata: { phone: '', email: '', gender: '', blood_type: '', allergies: '', emergency_contact: '' }
                        })

                        if ('speechSynthesis' in window) {
                            const utterance = new SpeechSynthesisUtterance(`Creating patient ${name}`)
                            speechSynthesis.speak(utterance)
                        }

                        if (onCommandProcessed) setTimeout(onCommandProcessed, 1000)
                        return true
                    }
                }
            }
        }

        // Delete patient
        if (lowerText.includes('delete') || lowerText.includes('remove')) {
            const namePatterns = [
                /(?:delete|remove).*?(?:patient)?\s+(?:named|called)?\s*([a-zA-Z\s]+?)(?:\s+from|\s*$)/i,
                /(?:delete|remove)\s+([a-zA-Z\s]+?)(?:\s+from|\s*$)/i
            ]

            for (const pattern of namePatterns) {
                const match = text.match(pattern)
                if (match && match[1] && onDeletePatient) {
                    let name = match[1].trim()
                    name = name.replace(/^(patient|user|person|the)\s+/i, '')
                    name = name.replace(/\s+(from|in|the|record|records|system|database).*$/i, '')

                    if (name) {
                        onDeletePatient(name)

                        if ('speechSynthesis' in window) {
                            const utterance = new SpeechSynthesisUtterance(`Requesting deletion of patient ${name}`)
                            speechSynthesis.speak(utterance)
                        }

                        if (onCommandProcessed) setTimeout(onCommandProcessed, 1000)
                        return true
                    }
                }
            }
        }

        // Search
        if (lowerText.includes('search') || lowerText.includes('find')) {
            const namePatterns = [
                /(?:search|find).*?(?:patient|for)?\s+(?:named|called)?\s*([a-zA-Z\s]+?)(?:\s*$)/i,
                /(?:search|find)\s+([a-zA-Z\s]+?)(?:\s*$)/i
            ]

            for (const pattern of namePatterns) {
                const match = text.match(pattern)
                if (match && match[1] && onSearch) {
                    const query = match[1].trim()
                    onSearch(query)

                    if ('speechSynthesis' in window) {
                        const utterance = new SpeechSynthesisUtterance(`Searching for ${query}`)
                        speechSynthesis.speak(utterance)
                    }

                    if (onCommandProcessed) setTimeout(onCommandProcessed, 1000)
                    return true
                }
            }
        }

        // Navigation
        const destinations = {
            'dashboard': '/dashboard',
            'patient': '/patients',
            'patients': '/patients',
            'upload': '/upload',
            'chat': '/chat',
            'history': '/history',
            'settings': '/settings'
        }

        if (lowerText.includes('go') || lowerText.includes('navigate') || lowerText.includes('open')) {
            for (const [key, path] of Object.entries(destinations)) {
                if (lowerText.includes(key)) {
                    if (onNavigate) {
                        onNavigate(path)

                        if ('speechSynthesis' in window) {
                            const utterance = new SpeechSynthesisUtterance(`Navigating to ${key}`)
                            speechSynthesis.speak(utterance)
                        }

                        if (onCommandProcessed) setTimeout(onCommandProcessed, 1000)
                        return true
                    }
                }
            }
        }

        console.log('❌ No offline command matched')
        if (onCommandProcessed) setTimeout(onCommandProcessed, 1000)
        return false
    }

    const startListening = async () => {
        if (!isSupported || !isModelLoaded || !voskRef.current) {
            console.error('Vosk not ready')
            return
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            streamRef.current = stream

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            })
            mediaRecorderRef.current = mediaRecorder

            mediaRecorder.ondataavailable = async (event) => {
                if (event.data.size > 0 && voskRef.current) {
                    try {
                        // Convert audio data for Vosk
                        const arrayBuffer = await event.data.arrayBuffer()
                        const audioData = new Float32Array(arrayBuffer)

                        // Process with Vosk
                        const result = await voskRef.current.acceptWaveform(audioData)

                        if (result) {
                            const recognition = JSON.parse(result)
                            if (recognition.text) {
                                setTranscript(recognition.text)
                                processCommand(recognition.text)
                            }
                        }
                    } catch (error) {
                        console.error('Vosk processing error:', error)
                    }
                }
            }

            mediaRecorder.start(1000) // Process every second
            setIsListening(true)

            // Auto-stop after 10 seconds
            setTimeout(() => {
                if (mediaRecorderRef.current?.state === 'recording') {
                    stopListening()
                }
            }, 10000)

        } catch (error) {
            console.error('Failed to start offline recording:', error)
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
        setTranscript('')
    }

    return {
        isListening,
        isSupported,
        isModelLoaded,
        transcript,
        startListening,
        stopListening
    }
}