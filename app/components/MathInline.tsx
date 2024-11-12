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

  // This effectively lets you move into the math field with arrow keys
  useEffect(() => {
    if (props.selected && props.editor.state.selection.from === props.getPos() && 
        props.editor.state.selection.to === props.getPos() + props.node.nodeSize) {
      mathFieldRef.current?.focus()
    }
  }, [props.selected, props.editor.state.selection])

  const handleInput = useCallback((evt: any) => {
    const newLatex = evt.target.value
    updateExpression(id, newLatex)
    props.updateAttributes({ latex: newLatex })
  }, [id, updateExpression, props.updateAttributes])

  // Moving out of the math field with arrow keys
  const handleMoveOut = useCallback((evt: any) => {
    if (evt.detail.direction === 'forward' || evt.detail.direction === 'downward') {
      const pos = props.getPos() + props.node.nodeSize
      props.editor.chain().focus().setTextSelection(pos).run()
    } else if (evt.detail.direction === 'backward' || evt.detail.direction === 'upward') {
      const pos = props.getPos()
      props.editor.chain().focus().setTextSelection(pos).run()
    }
    evt.preventDefault()
  }, [props])

  const handleBeforeInput = useCallback((evt: any) => {
    // If trying to delete backward and the field is empty
    if (evt.inputType === 'deleteContentBackward' && mathFieldRef.current?.value === '') {
      // Delete the block
      const pos = props.getPos()
      props.editor.commands.deleteRange({ from: pos, to: pos + props.node.nodeSize })
      // Move cursor to previous node
      props.editor.commands.focus(pos - 1)
      evt.preventDefault()
    }
  }, [props.editor, props.getPos, props.node.nodeSize])

  useEffect(() => {
    if (mathFieldRef.current) {
      mathFieldRef.current.addEventListener('input', handleInput)
      mathFieldRef.current.addEventListener('move-out', handleMoveOut)
      mathFieldRef.current.addEventListener('beforeinput', handleBeforeInput)
      return () => {
        mathFieldRef.current?.removeEventListener('input', handleInput)
        mathFieldRef.current?.removeEventListener('move-out', handleMoveOut)
        mathFieldRef.current?.removeEventListener('beforeinput', handleBeforeInput)
      }
    }
  }, [handleInput, handleMoveOut, handleBeforeInput])

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
    <NodeViewWrapper className="inline">
      <span 
        className="align-middle cursor-text" 
      >
        <math-field
          ref={mathFieldRef}
          value={props.node.attrs.latex}
          default-mode="math"
          virtual-keyboard-mode="manual"
          menu-editor="none"
          className="inline-math"
          onMouseDown={handleClick}
        />
      </span>
    </NodeViewWrapper>
  )
}

export default MathInline 