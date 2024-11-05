'use client'

import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useEffect, useRef, useCallback } from 'react'
import 'mathlive'
import { useMath } from '../contexts/MathContext'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'math-field': any
    }
  }
}

const MathInline = Node.create({
  name: 'mathInline',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      latex: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="math-inline"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', { 'data-type': 'math-inline', ...HTMLAttributes }]
  },

  addCommands() {
    return {
      insertMathInline:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: { latex: '' },
          })
        },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathInlineView)
  },
})

function MathInlineView(props: any) {
  const mathFieldRef = useRef<any>(null)
  const { updateExpression } = useMath()
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
    <NodeViewWrapper className="inline">
      <span 
        className="align-middle cursor-text" 
        onClick={handleClick}
      >
        <math-field
          ref={mathFieldRef}
          default-mode="math"
          virtual-keyboard-mode="manual"
          menu-editor="none"
          className="inline-math"
        ></math-field>
      </span>
    </NodeViewWrapper>
  )
}

export default MathInline 