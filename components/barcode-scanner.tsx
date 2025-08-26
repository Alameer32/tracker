import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Camera, X, Zap, Search, Loader2 } from "lucide-react"

interface NutritionData {
  name: string
  brand?: string
  servingSize?: string
  calories?: number
  totalFat?: number
  saturatedFat?: number
  cholesterol?: number
  sodium?: number
  totalCarbs?: number
  dietaryFiber?: number
  sugars?: number
  protein?: number
}

interface BarcodeScannerProps {
  isOpen: boolean
  onClose: () => void
  onNutritionFound: (nutrition: NutritionData) => void
}

export function BarcodeScanner({ isOpen, onClose, onNutritionFound }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [manualBarcode, setManualBarcode] = useState("")
  const [showManualEntry, setShowManualEntry] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent)

  const USDA_API_KEY = "MHClEd92PxL31NtrlZSs1G0h4ODve09Pk8gOjJa1"

  // Initialize/cleanup when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      stopScanner()
      setShowManualEntry(false)
      setManualBarcode("")
      return
    }

    setError(null)

    // iOS Safari requires a direct user gesture to call getUserMedia.
    // So we only auto-start on non-iOS devices; iOS users will tap a button.
    if (!isIOS && !showManualEntry) {
      startScanner()
    }

    return () => {
      stopScanner()
    }
  }, [isOpen, isIOS, showManualEntry])

  const lookupNutritionByBarcode = async (barcode: string) => {
    setIsLookingUp(true)
    setError(null)
    
    try {
      console.log("Looking up barcode:", barcode)
      
      // First, try to get product info from Open Food Facts (free barcode database)
      const foodFactsResponse = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
      const foodFactsData = await foodFactsResponse.json()
      
      let productName = ""
      let brandName = ""
      
      if (foodFactsData.status === 1 && foodFactsData.product) {
        productName = foodFactsData.product.product_name || ""
        brandName = foodFactsData.product.brands || ""
        console.log("Found product in Open Food Facts:", productName, brandName)
      }
      
      // If we have a product name, search USDA database
      if (productName) {
        const searchQuery = `${brandName} ${productName}`.trim()
        const usdaResponse = await fetch(
          `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(searchQuery)}&pageSize=5`
        )
        
        if (!usdaResponse.ok) {
          throw new Error(`USDA API error: ${usdaResponse.status}`)
        }
        
        const usdaData = await usdaResponse.json()
        
        if (usdaData.foods && usdaData.foods.length > 0) {
          // Get detailed nutrition info for the first match
          const foodId = usdaData.foods[0].fdcId
          const detailResponse = await fetch(
            `https://api.nal.usda.gov/fdc/v1/food/${foodId}?api_key=${USDA_API_KEY}`
          )
          
          const detailData = await detailResponse.json()
          
          // Parse nutrition data
          const nutritionData: NutritionData = {
            name: detailData.description || productName,
            brand: brandName || undefined
          }
          
          // Extract key nutrients
          if (detailData.foodNutrients) {
            for (const nutrient of detailData.foodNutrients) {
              const nutrientName = nutrient.nutrient?.name?.toLowerCase() || ""
              const amount = nutrient.amount || 0
              
              if (nutrientName.includes("energy") || nutrientName.includes("calorie")) {
                nutritionData.calories = Math.round(amount)
              } else if (nutrientName.includes("total lipid") || nutrientName.includes("fat, total")) {
                nutritionData.totalFat = Math.round(amount * 10) / 10
              } else if (nutrientName.includes("fatty acids, total saturated")) {
                nutritionData.saturatedFat = Math.round(amount * 10) / 10
              } else if (nutrientName.includes("cholesterol")) {
                nutritionData.cholesterol = Math.round(amount)
              } else if (nutrientName.includes("sodium")) {
                nutritionData.sodium = Math.round(amount)
              } else if (nutrientName.includes("carbohydrate")) {
                nutritionData.totalCarbs = Math.round(amount * 10) / 10
              } else if (nutrientName.includes("fiber")) {
                nutritionData.dietaryFiber = Math.round(amount * 10) / 10
              } else if (nutrientName.includes("sugars, total")) {
                nutritionData.sugars = Math.round(amount * 10) / 10
              } else if (nutrientName.includes("protein")) {
                nutritionData.protein = Math.round(amount * 10) / 10
              }
            }
          }
          
          console.log("Nutrition data found:", nutritionData)
          onNutritionFound(nutritionData)
          return
        }
      }
      
      // If no USDA data found but we have Open Food Facts data
      if (foodFactsData.status === 1 && foodFactsData.product) {
        const product = foodFactsData.product
        const nutritionData: NutritionData = {
          name: productName,
          brand: brandName || undefined,
          servingSize: product.serving_size || undefined,
          calories: product.nutriments?.energy_kcal_100g ? Math.round(product.nutriments.energy_kcal_100g) : undefined,
          totalFat: product.nutriments?.fat_100g ? Math.round(product.nutriments.fat_100g * 10) / 10 : undefined,
          saturatedFat: product.nutriments?.["saturated-fat_100g"] ? Math.round(product.nutriments["saturated-fat_100g"] * 10) / 10 : undefined,
          sodium: product.nutriments?.sodium_100g ? Math.round(product.nutriments.sodium_100g * 1000) : undefined,
          totalCarbs: product.nutriments?.carbohydrates_100g ? Math.round(product.nutriments.carbohydrates_100g * 10) / 10 : undefined,
          dietaryFiber: product.nutriments?.fiber_100g ? Math.round(product.nutriments.fiber_100g * 10) / 10 : undefined,
          sugars: product.nutriments?.sugars_100g ? Math.round(product.nutriments.sugars_100g * 10) / 10 : undefined,
          protein: product.nutriments?.proteins_100g ? Math.round(product.nutriments.proteins_100g * 10) / 10 : undefined
        }
        
        console.log("Using Open Food Facts nutrition data:", nutritionData)
        onNutritionFound(nutritionData)
        return
      }
      
      throw new Error("No nutrition data found for this barcode")
      
    } catch (err) {
      console.error("Error looking up nutrition:", err)
      setError(err instanceof Error ? err.message : "Failed to look up nutrition information")
    } finally {
      setIsLookingUp(false)
    }
  }

  const startScanner = async () => {
    try {
      setError(null)
      setIsScanning(true)

      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera access is not supported in this browser")
      }

      // Get camera stream
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      setStream(mediaStream)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play()
        
        console.log("Video started playing")
        
        // Start barcode detection after a short delay
        setTimeout(() => {
          startBarcodeDetection()
        }, 1000)
      }

    } catch (err) {
      console.error("Error starting barcode scanner:", err)
      setError(err instanceof Error ? err.message : "Failed to start barcode scanner")
      setIsScanning(false)
    }
  }

  const startBarcodeDetection = async () => {
    if (!videoRef.current) return
    
    try {
      // Import ZXing library
      const { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } = await import('@zxing/library')
      
      // Create reader with supported formats
      const hints = new Map()
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.CODABAR,
        BarcodeFormat.ITF
      ])
      
      const reader = new BrowserMultiFormatReader(hints)
      
      const scanFrame = async () => {
        if (!isScanning || !videoRef.current) return
        
        try {
          // Use decodeFromVideoElement which is the correct method
          const result = await reader.decodeFromVideoElement(videoRef.current)
          if (result && result.getText()) {
            const barcode = result.getText()
            console.log("Barcode detected:", barcode)
            
            stopScanner()
            await lookupNutritionByBarcode(barcode)
            return
          }
        } catch (error) {
          // No barcode found in this frame, continue scanning
        }
        
        // Continue scanning if still active
        if (isScanning) {
          setTimeout(scanFrame, 300)
        }
      }
      
      // Wait for video to be ready then start scanning
      const video = videoRef.current
      if (video.readyState >= 2) {
        scanFrame()
      } else {
        video.addEventListener('loadedmetadata', scanFrame, { once: true })
      }
      
    } catch (error) {
      console.error("Error setting up barcode detection:", error)
      setError("Failed to initialize barcode detection")
    }
  }

  const stopScanner = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setIsScanning(false)
  }

  const handleClose = () => {
    stopScanner()
    setShowManualEntry(false)
    setManualBarcode("")
    onClose()
  }

  const handleManualLookup = async () => {
    if (!manualBarcode.trim()) return
    
    await lookupNutritionByBarcode(manualBarcode.trim())
  }

  const handleManualEntry = () => {
    stopScanner()
    setShowManualEntry(true)
  }

  const handleBackToScanner = () => {
    setShowManualEntry(false)
    setManualBarcode("")
    if (!isIOS) {
      startScanner()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {showManualEntry ? "Enter Barcode" : "Scan Barcode"}
          </DialogTitle>
          <DialogDescription>
            {showManualEntry 
              ? "Enter the barcode number manually to look up nutrition information"
              : "Point your camera at a food product barcode to scan it"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLookingUp ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Looking up nutrition information...</span>
                </div>
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="border-destructive/50">
              <CardContent className="p-4">
                <div className="text-sm text-destructive">{error}</div>
                <div className="mt-3 space-y-2">
                  {!showManualEntry && (
                    <Button variant="outline" onClick={startScanner} className="w-full">
                      Try Scanning Again
                    </Button>
                  )}
                  <Button variant="outline" onClick={handleManualEntry} className="w-full">
                    Enter Barcode Manually
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : showManualEntry ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Barcode Number</label>
                <input
                  type="text"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  placeholder="Enter barcode number..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && manualBarcode.trim()) {
                      handleManualLookup()
                    }
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleManualLookup}
                  disabled={!manualBarcode.trim()}
                  className="flex-1"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Look Up Nutrition
                </Button>
                <Button variant="outline" onClick={handleBackToScanner} className="flex-1">
                  Back to Scanner
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  autoPlay
                  muted
                />

                {/* Scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-2 border-primary border-dashed rounded-lg w-64 h-32 flex items-center justify-center">
                    <div className="text-white text-sm font-medium bg-black/50 px-2 py-1 rounded">
                      {isScanning ? "Scanning..." : "Position barcode here"}
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

              {/* For iOS or when camera isn't started: show an explicit button */}
              {!error && isOpen && !isScanning && (
                <div className="mt-3">
                  <Button onClick={startScanner} className="w-full">
                    <Camera className="h-4 w-4 mr-2" />
                    Enable Camera
                  </Button>
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {!showManualEntry && !isLookingUp && (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="h-4 w-4" />
                <span>Make sure the barcode is well-lit and clearly visible</span>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleManualEntry} className="flex-1">
                  Enter Manually
                </Button>
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Demo component to show how to use the scanner
export default function BarcodeScannerDemo() {
  const [isOpen, setIsOpen] = useState(false)
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null)

  const handleNutritionFound = (nutrition: NutritionData) => {
    setNutritionData(nutrition)
    setIsOpen(false)
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Food Nutrition Scanner</h1>
        <p className="text-muted-foreground">
          Scan a barcode to get nutritional information
        </p>
      </div>

      <Button onClick={() => setIsOpen(true)} className="w-full" size="lg">
        <Camera className="h-5 w-5 mr-2" />
        Scan Barcode
      </Button>

      {nutritionData && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="font-semibold text-lg">{nutritionData.name}</div>
            {nutritionData.brand && (
              <div className="text-sm text-muted-foreground">
                Brand: {nutritionData.brand}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              {nutritionData.calories !== undefined && (
                <div>
                  <span className="font-medium">Calories:</span> {nutritionData.calories}
                </div>
              )}
              {nutritionData.totalFat !== undefined && (
                <div>
                  <span className="font-medium">Fat:</span> {nutritionData.totalFat}g
                </div>
              )}
              {nutritionData.saturatedFat !== undefined && (
                <div>
                  <span className="font-medium">Sat. Fat:</span> {nutritionData.saturatedFat}g
                </div>
              )}
              {nutritionData.sodium !== undefined && (
                <div>
                  <span className="font-medium">Sodium:</span> {nutritionData.sodium}mg
                </div>
              )}
              {nutritionData.totalCarbs !== undefined && (
                <div>
                  <span className="font-medium">Carbs:</span> {nutritionData.totalCarbs}g
                </div>
              )}
              {nutritionData.dietaryFiber !== undefined && (
                <div>
                  <span className="font-medium">Fiber:</span> {nutritionData.dietaryFiber}g
                </div>
              )}
              {nutritionData.sugars !== undefined && (
                <div>
                  <span className="font-medium">Sugars:</span> {nutritionData.sugars}g
                </div>
              )}
              {nutritionData.protein !== undefined && (
                <div>
                  <span className="font-medium">Protein:</span> {nutritionData.protein}g
                </div>
              )}
            </div>

            <Button 
              variant="outline" 
              onClick={() => setNutritionData(null)} 
              className="w-full mt-3"
            >
              Clear Results
            </Button>
          </CardContent>
        </Card>
      )}

      <BarcodeScanner
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onNutritionFound={handleNutritionFound}
      />
    </div>
  )
}