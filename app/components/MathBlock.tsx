'use client'

import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { ComputeEngine } from '@cortex-js/compute-engine'
import { useEffect, useRef, useState } from 'react'
import 'mathlive'

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
  const mathFieldRef = useRef<HTMLElement>(null)
  const [result, setResult] = useState('')
  const ce = new ComputeEngine()

  const calculateResult = (latex: string) => {
    try {
      const expr = ce.parse(latex)
      const evaluated = expr.evaluate()
      setResult(evaluated.latex)
    } catch (error) {
      console.error('Calculation error:', error)
    }
  }

  useEffect(() => {
    if (mathFieldRef.current) {
      mathFieldRef.current.addEventListener('input', (evt: any) => {
        calculateResult(evt.target.value)
      })
    }
  }, [])

  useEffect(() => {
    // Focus the math field when it's created
    setTimeout(() => {
      mathFieldRef.current?.focus()
    }, 0)
  }, [])

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
        {result && (
          <div className="mt-2 text-gray-600">
            = {result}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}

export default MathBlock