import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { BoxedExpression, ComputeEngine } from '@cortex-js/compute-engine'

type MathContextType = {
  expressions: Record<string, string>
  results: Record<string, string>
  errors: Record<string, string>
  updateExpression: (id: string, expr: string | null) => void
}

const MathContext = createContext<MathContextType | null>(null)

export function MathProvider({ children }: { children: ReactNode }) {
  const [expressions, setExpressions] = useState<Record<string, string>>({})
  const [results, setResults] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const ce = new ComputeEngine()

  useEffect(() => {
    evaluateAll(expressions)
  }, [expressions])

  const updateExpression = (id: string, expr: string | null) => {
    setExpressions(prev => {
      if (expr === null) {
        const { [id]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [id]: expr }
    })

    // Clean up results and errors when expression is removed
    setResults(prev => {
      if (expr === null) {
        const { [id]: _, ...rest } = prev
        return rest
      }
      return prev
    })

    setErrors(prev => {
      if (expr === null) {
        const { [id]: _, ...rest } = prev
        return rest
      }
      return prev
    })
  }

  /* Traverse the expression tree and evaluate all expressions

  1. Represent Variables and Their Expressions: Store each variable along with its parsed expression tree. This tree represents the computation needed to obtain the variable's value.

  2. Initialize Data Structures:
    - values Dictionary: To store the computed values of variables.
    - evaluating Set: To keep track of variables currently being evaluated, helping to detect cycles in dependencies.
  
  3. Define an Evaluation Function:
    - The function eval_var(var) computes the value of var.
    - If var is already in values, return the stored value (memoization).
    - If var is in evaluating, you've detected a cycle (e.g., a = a + 1), and you should raise an error.
    - Add var to evaluating to mark it as currently being evaluated.
    - Recursively evaluate any variables that var depends on by traversing its expression tree.
    - After computing, store the value in values and remove var from evaluating.
    - Return the computed value.
  
  4. Evaluate All Variables:
    - Call eval_var(var) for each variable you need to compute.
    - Ensure that all variables are eventually evaluated, respecting their dependencies.
  */
  const evaluateAll = (expressionsArg: Record<string, string>) => {
    const newResults: Record<string, string> = {}
    const newErrors: Record<string, string> = {}
    
    // Map from variable name to expression
    const exprs = new Map<string, string>()
    // Map from variable name back to ID
    const varToId = new Map<string, string>()
    
    // Helper function to convert LaTeX symbols to valid variable names
    const sanitizeVarName = (name: string): string => {
      return name.replace(/[\\{}]/g, '')
    }
    
    // Modified to handle both equations and direct expressions
    Object.entries(expressionsArg).forEach(([id, expr]) => {
      const parts = expr.split('=').map(x => x.trim())
      if (parts.length === 2 && parts[0] && parts[1]) {
        // Equation case: "x = 5" or "y = x + 3"
        const varName = sanitizeVarName(parts[0])
        exprs.set(varName, parts[1])
        varToId.set(varName, id)
      } else {
        // Direct expression case: "4+5" or "b+3"
        const varName = `_expr_${id}`
        exprs.set(varName, expr)
        varToId.set(varName, id)
      }
    })

    // Set to track variables being evaluated (for cycle detection)
    const evaluating = new Set<string>()
    
    // Function to evaluate a single variable
    const evaluateVar = (varName: string): BoxedExpression | null => {
      if (evaluating.has(varName)) {
        const id = varToId.get(varName)
        if (id) {
          newErrors[id] = `Circular dependency detected for variable ${varName}`
        }
        return null
      }

      const expr = exprs.get(varName)
      if (!expr) return null

      evaluating.add(varName)

      try {
        const parsedExpr = ce.parse(expr)
        
        // Check if parsing resulted in an error
        if (parsedExpr.isValid === false) {
          const id = varToId.get(varName)
          if (id) {
            newErrors[id] = parsedExpr.toString()
          }
          return null
        }
        
        // Get all variables this expression depends on
        const deps = Array.from(parsedExpr.freeVariables)
        
        // Recursively evaluate all dependencies first
        for (const dep of deps) {
          if (exprs.has(dep)) {
            const depResult = evaluateVar(dep)
            if (depResult === null) {
              return null
            }
          }
        }

        const result = parsedExpr.N()
        
        // Store the result
        ce.assign(varName, result)
        
        return result
      } catch (error) {
        const id = varToId.get(varName)
        if (id) {
          newErrors[id] = error instanceof Error ? error.message : String(error)
        }
        return null
      } finally {
        evaluating.delete(varName)
      }
    }

    // Evaluate all variables
    for (const varName of exprs.keys()) {
      const id = varToId.get(varName)
      if (!id) continue

      try {
        const result = evaluateVar(varName)
        if (result) {
          newResults[id] = result.toLatex({
            fractionalDigits: 5,
            notation: 'engineering',
            avoidExponentsInRange: [-3, 4]
          })
        }
      } catch (error) {
        console.error(`Error evaluating ${varName}:`, error)
        newErrors[id] = error instanceof Error ? error.message : String(error)
      }
    }

    setResults(newResults)
    setErrors(newErrors)
  }

  return (
    <MathContext.Provider value={{ 
      expressions,
      results,
      errors,
      updateExpression,
    }}>
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