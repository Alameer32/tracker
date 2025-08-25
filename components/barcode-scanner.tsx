"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, X, Zap } from "lucide-react"

interface BarcodeScannerProps {
  isOpen: boolean
  onClose: () => void
  onBarcodeDetected: (barcode: string) => void
}

export function BarcodeScanner({ isOpen, onClose, onBarcodeDetected }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Initialize camera when dialog opens
  useEffect(() => {
    if (isOpen) {
      startCamera()
    } else {
      stopCamera()
    }

    return () => {
      stopCamera()
    }
  }, [isOpen])

  const startCamera = async () => {
    try {
      setError(null)
      setIsScanning(true)

      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera access is not supported in this browser")
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
      }

    } catch (err) {
      console.error("Error accessing camera:", err)
      setError(err instanceof Error ? err.message : "Failed to access camera")
      setIsScanning(false)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setIsScanning(false)
  }

  const handleClose = () => {
    stopCamera()
    onClose()
  }

  const handleManualBarcode = () => {
    // For now, just close the scanner and let user enter manually
    // In a real implementation, you'd integrate with a barcode detection library
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Scan Barcode
          </DialogTitle>
          <DialogDescription>Point your camera at a food product barcode to scan it</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error ? (
            <Card className="border-destructive/50">
              <CardContent className="p-4">
                <div className="text-sm text-destructive">{error}</div>
                <div className="mt-3 space-y-2">
                  <Button variant="outline" onClick={startCamera} className="w-full bg-transparent">
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={handleManualBarcode} className="w-full bg-transparent">
                    Enter Barcode Manually
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="relative">
              <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                  style={{ transform: "scaleX(-1)" }} // Mirror the video for better UX
                />

                {/* Scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-primary border-dashed rounded-lg w-64 h-32 flex items-center justify-center">
                    <div className="text-white text-sm font-medium bg-black/50 px-2 py-1 rounded">
                      {isScanning ? "Camera Active" : "Position barcode here"}
                    </div>
                  </div>
                </div>

                {/* Scanning animation */}
                {isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-64 h-32 relative overflow-hidden rounded-lg">
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary animate-pulse" />
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-pulse" />
                    </div>
                  </div>
                )}
              </div>

              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="h-4 w-4" />
            <span>Make sure the barcode is well-lit and clearly visible</span>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleManualBarcode} className="flex-1">
              Enter Manually
            </Button>
            <Button variant="outline" onClick={handleClose} className="flex-1">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
