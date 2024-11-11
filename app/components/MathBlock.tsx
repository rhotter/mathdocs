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
    props.updateAttributes({ 
      latex: newLatex,
      result: results[id] || ''
    })
  }, [id, updateExpression, props.updateAttributes, results])

  // Moving out of the math field with arrow keys
  const handleMoveOut = useCallback((evt: any) => {
    if (evt.detail.direction === 'forward' || evt.detail.direction === 'downward') {
      const pos = props.getPos() + props.node.nodeSize
      props.editor.chain().focus().setTextSelection(pos).run()
    } else if (evt.detail.direction === 'backward' || evt.detail.direction === 'upward') {
      const pos = props.getPos() - 1
      props.editor.chain().focus().setTextSelection(pos).run()
    }
    evt.preventDefault()
  }, [props])

  // This effectively lets you move into the math field with arrow keys
  useEffect(() => {
    if (props.selected && props.editor.state.selection.from === props.getPos() && 
        props.editor.state.selection.to === props.getPos() + props.node.nodeSize) {
      mathFieldRef.current?.focus()
    }
  }, [props.selected, props.editor.state.selection])

  useEffect(() => {
    if (mathFieldRef.current) {
      mathFieldRef.current.addEventListener('input', handleInput)
      mathFieldRef.current.addEventListener('move-out', handleMoveOut)
      return () => {
        mathFieldRef.current?.removeEventListener('input', handleInput)
        mathFieldRef.current?.removeEventListener('move-out', handleMoveOut)
      }
    }
  }, [handleInput, handleMoveOut])

  useEffect(() => {
    setTimeout(() => {
      mathFieldRef.current?.focus()
    }, 0)
  }, [])

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    mathFieldRef.current?.focus()
  }

  return (
    <NodeViewWrapper>
      <div 
        className="my-4 p-4 bg-gray-50 rounded-lg text-center cursor-text" 
        onMouseDown={handleClick}
      >
        <math-field
          ref={mathFieldRef}
          value={props.node.attrs.latex}
          default-mode="math"
          virtual-keyboard-mode="manual"
          menu-editor="none"
          className="border-none shadow-none"
        ></math-field>
        {results[id] && results[id] !== '\\mathrm{Nothing}' && (
          <div className="mt-2 text-gray-600 flex justify-end">
            <math-field
              read-only
              value={`= ${results[id]}`}
              className="border-none shadow-none"
            />
          </div>
        )}
      </div>
    </NodeViewWrapper>
  )
}

export default MathBlock