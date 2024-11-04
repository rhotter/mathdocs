import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { ComputeEngine } from '@cortex-js/compute-engine'

type MathContextType = {
  variables: Record<string, number>
  ce: ComputeEngine
  updateVariable: (name: string, value: number | null) => void
}

const MathContext = createContext<MathContextType | null>(null)

export function MathProvider({ children }: { children: ReactNode }) {
  const [variables, setVariables] = useState<Record<string, number>>({})
  const ce = new ComputeEngine()

  const updateVariable = (name: string, value: number | null) => {
    setVariables(prev => {
      if (value === null) {
        const { [name]: _, ...rest } = prev
        return rest
      }
      return {
        ...prev,
        [name]: value
      }
    })
  }

  return (
    <MathContext.Provider value={{ variables, ce, updateVariable }}>
      {children}
    </MathContext.Provider>
  )
}

export function useMath() {
  const context = useContext(MathContext)
  if (!context) {
    throw new Error('useMath must be used within a MathProvider')
  }
  return context
}