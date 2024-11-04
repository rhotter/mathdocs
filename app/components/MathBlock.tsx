'use client'

import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useEffect, useRef, useState, useCallback } from 'react'
import 'mathlive'
import { useMath } from '../contexts/MathContext'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': any
    }
  }
}

const MathBlock = Node.create({
  name: 'mathBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      latex: {
        default: '',
      },
      result: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="math-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { 'data-type': 'math-block', ...HTMLAttributes }]
  },

  addCommands() {
    return {
      insertMathBlock:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { latex: '', result: '' },
          })
        },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathBlockView)
  },
})

function MathBlockView(props: any) {
  const mathFieldRef = useRef<any>(null)
  const [result, setResult] = useState('')
  const { variables, ce, updateVariable } = useMath()
  useEffect(() => {
    console.log('variables', variables)
  }, [variables])

  const calculateResult = useCallback((latex: string) => {
    try {
      // If latex is empty, don't try to calculate
      if (!latex.trim()) {
        setResult('')
        return
      }

      const expr = ce.parse(latex)

      Object.entries(variables).forEach(([name, value]) => {
        ce.assign(name, value)
      })

      const evaluated = expr.evaluate()
      setResult(evaluated.latex)

      // Only update variables if this is an assignment expression
      if (latex.includes('=')) {
        const [varName, assignedValue] = latex.split('=').map(s => s.trim())
        // If the right side is empty, remove the variable
        if (!assignedValue.trim()) {
          updateVariable(varName, null)
        } else {
          const value = ce.parse(assignedValue).evaluate().value
          if (typeof value === 'number') {
            updateVariable(varName, value)
          } else {
            updateVariable(varName, null)
          }
        }
      }
    } catch (error) {
      console.error('Calculation error:', error)
      setResult('')
    }
  }, [variables, ce, updateVariable])

  useEffect(() => {
    const handleInput = (evt: any) => {
      calculateResult(evt.target.value)
    }

    if (mathFieldRef.current) {
      mathFieldRef.current.addEventListener('input', handleInput)
      return () => {
        mathFieldRef.current?.removeEventListener('input', handleInput)
      }
    }
  }, [calculateResult])

  useEffect(() => {
    setTimeout(() => {
      mathFieldRef.current?.focus()
    }, 0)
  }, [])

  // Add a separate effect for variable changes that doesn't trigger updates
  useEffect(() => {
    if (mathFieldRef.current && !mathFieldRef.current.value.includes('=')) {
      const currentLatex = mathFieldRef.current.value
      calculateResult(currentLatex)
    }
  }, [variables, calculateResult])

  const handleClick = () => {
    mathFieldRef.current?.focus()
  }

  return (
    <NodeViewWrapper>
      <div 
        className="my-4 p-4 bg-gray-50 rounded-lg text-center cursor-text" 
        onClick={handleClick}
      >
        <math-field
          ref={mathFieldRef}
          default-mode="math"
          virtual-keyboard-mode="manual"
          menu-editor="none"
          className="border-none shadow-none"
        ></math-field>
        {result && result !== '\\mathrm{Nothing}' && (
          <div className="mt-2 text-gray-600 flex justify-end">
            <math-field
              read-only
              className="border-none shadow-none"
            >{`= ${result}`}</math-field>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}

export default MathBlock