'use client'

import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useEffect, useRef, useState, useCallback } from 'react'
import 'mathlive'
import { useMath } from '../contexts/MathContext'
import { BoxedExpression } from '@cortex-js/compute-engine'

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
  const { updateExpression, results } = useMath()
  const id = props.node.attrs.id || props.getPos()

  const handleInput = useCallback((evt: any) => {
    const newLatex = evt.target.value
    updateExpression(id, newLatex)
  }, [id, updateExpression])

  useEffect(() => {
    if (mathFieldRef.current) {
      mathFieldRef.current.addEventListener('input', handleInput)
      return () => {
        mathFieldRef.current?.removeEventListener('input', handleInput)
      }
    }
  }, [handleInput])

  useEffect(() => {
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
        {results[id] && results[id] !== '\\mathrm{Nothing}' && (
          <div className="mt-2 text-gray-600 flex justify-end">
            <math-field
              read-only
              className="border-none shadow-none"
            >{`= ${results[id]}`}</math-field>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}

export default MathBlock