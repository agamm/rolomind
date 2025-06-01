import { useState, useRef, useCallback } from 'react'

interface UseVoiceRecorderReturn {
  isRecording: boolean
  isPaused: boolean
  recordingTime: number
  audioLevel: number
  startRecording: () => Promise<void>
  stopRecording: () => Promise<Blob | null>
  pauseRecording: () => void
  resumeRecording: () => void
  error: string | null
}

export function useVoiceRecorder(): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number | null>(null)

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      
      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      })
      
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }
      
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
      
      // Setup audio level monitoring
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const analyser = audioContext.createAnalyser()
      const microphone = audioContext.createMediaStreamSource(stream)
      const dataArray = new Uint8Array(analyser.frequencyBinCount)
      
      microphone.connect(analyser)
      analyserRef.current = analyser
      
      // Monitor audio levels
      const checkAudioLevel = () => {
        if (!analyserRef.current) return
        
        analyserRef.current.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length
        setAudioLevel(Math.min(100, (average / 128) * 100))
        
        animationRef.current = requestAnimationFrame(checkAudioLevel)
      }
      checkAudioLevel()
      
    } catch (err) {
      setError('Failed to access microphone. Please ensure microphone permissions are granted.')
      console.error('Error accessing microphone:', err)
    }
  }, [])

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !streamRef.current) {
        resolve(null)
        return
      }

      const mediaRecorder = mediaRecorderRef.current

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        
        // Stop all tracks
        streamRef.current?.getTracks().forEach(track => track.stop())
        
        // Clear timer
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
        
        // Stop audio level monitoring
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
          animationRef.current = null
        }
        
        // Reset state
        setIsRecording(false)
        setIsPaused(false)
        setRecordingTime(0)
        setAudioLevel(0)
        mediaRecorderRef.current = null
        streamRef.current = null
        analyserRef.current = null
        
        resolve(audioBlob)
      }

      mediaRecorder.stop()
    })
  }, [])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      
      // Pause timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [])

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      
      // Resume timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)
    }
  }, [])

  return {
    isRecording,
    isPaused,
    recordingTime,
    audioLevel,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    error
  }
}