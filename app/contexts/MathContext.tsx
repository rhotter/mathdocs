import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { BoxedExpression, ComputeEngine } from '@cortex-js/compute-engine'

type MathContextType = {
  expressions: Record<string, string>
  results: Record<string, string>
  updateExpression: (id: string, expr: string | null) => void
}

const MathContext = createContext<MathContextType | null>(null)

export function MathProvider({ children }: { children: ReactNode }) {
  const [expressions, setExpressions] = useState<Record<string, string>>({})
  const [results, setResults] = useState<Record<string, string>>({})
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

    // Clean up results when expression is removed
    setResults(prev => {
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
    
    // Map from variable name to expression
    const exprs = new Map<string, string>()
    // Map from variable name back to ID
    const varToId = new Map<string, string>()
    
    // Modified to handle both equations and direct expressions
    Object.entries(expressionsArg).forEach(([id, expr]) => {
      const parts = expr.split('=').map(x => x.trim())
      if (parts.length === 2 && parts[0] && parts[1]) {
        // Equation case: "x = 5" or "y = x + 3"
        exprs.set(parts[0], parts[1])
        varToId.set(parts[0], id)
      } else {
        // Direct expression case: "4+5" or "b+3"
        const varName = `_expr_${id}` // Create a valid variable name
        exprs.set(varName, expr)
        varToId.set(varName, id)
      }
    })

    // Set to track variables being evaluated (for cycle detection)
    const evaluating = new Set<string>()
    
    // Function to evaluate a single variable
    const evaluateVar = (varName: string): BoxedExpression | null => {
      // Check for cycles
      if (evaluating.has(varName)) {
        console.warn(`Circular dependency detected for variable ${varName}`)
        return null
      }

      // Get the expression for this variable
      const expr = exprs.get(varName)
      if (!expr) return null

      // Mark this variable as being evaluated
      evaluating.add(varName)

      try {
        // Parse the expression
        const parsedExpr = ce.parse(expr)
        
        // Get all variables this expression depends on
        const deps = Array.from(parsedExpr.freeVariables)
        
        // Recursively evaluate all dependencies first
        for (const dep of deps) {
          if (exprs.has(dep)) {
            const depResult = evaluateVar(dep)
            if (depResult === null) {
              return null // Propagate evaluation failure
            }
          }
        }

        // Now evaluate this expression
        const result = parsedExpr.evaluate()
        
        // Store the result
        ce.assign(varName, result)
        
        return result
      } finally {
        // Always remove from evaluating set
        evaluating.delete(varName)
      }
    }

    // Evaluate all variables
    for (const varName of exprs.keys()) {
      try {
        const result = evaluateVar(varName)
        if (result) {
          const id = varToId.get(varName)
          if (id) {
            // Store the result using the original ID
            newResults[id] = result.latex
          }
        }
      } catch (error) {
        console.error(`Error evaluating ${varName}:`, error)
      }
    }

    setResults(newResults)
  }

  return (
    <MathContext.Provider value={{ 
      expressions,
      results,
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