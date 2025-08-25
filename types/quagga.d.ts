declare module 'quagga' {
  interface QuaggaConfig {
    inputStream: {
      name?: string
      type?: string
      constraints?: {
        width?: number | { min?: number; ideal?: number; max?: number }
        height?: number | { min?: number; ideal?: number; max?: number }
        facingMode?: string
      }
      area?: {
        top?: string
        right?: string
        left?: string
        bottom?: string
      }
    }
    locator: {
      patchSize?: string
      halfSample?: boolean
    }
    numOfWorkers?: number
    frequency?: number
    decoder: {
      readers?: string[]
    }
    locate?: boolean
  }

  interface QuaggaResult {
    codeResult: {
      code: string
      format: string
    }
    line: Array<{ x: number; y: number }>
    angle: number
    pattern: number[]
    box: Array<{ x: number; y: number }>
    boxes: Array<Array<{ x: number; y: number }>>
  }

  const Quagga: {
    init(config: QuaggaConfig, callback?: (err: any) => void): Promise<void>
    start(): void
    stop(): void
    decodeSingle(config: QuaggaConfig, callback: (result: QuaggaResult) => void): void
    onDetected(callback: (result: QuaggaResult) => void): void
    offDetected(callback: (result: QuaggaResult) => void): void
  }

  export default Quagga
}
