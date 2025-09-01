'use client'

import { Node } from '@tiptap/core'
import { ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react'
import { useEffect, useRef, useCallback, useMemo } from 'react'
import 'mathlive'
import { useMath } from '../contexts/MathContext'
import katex from 'katex'

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

  useEffect(() => {
    updateExpression(id, props.node.attrs.latex)
  }, [])

  const handleInput = useCallback((evt: any) => {
    const newLatex = evt.target.value
    updateExpression(id, newLatex)
    // Only update latex to reduce transactions; results are rendered via context
    props.updateAttributes({ latex: newLatex })
  }, [id, updateExpression, props.updateAttributes])

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
    if (
      props.selected &&
      props.editor.state.selection.from === props.getPos() &&
      props.editor.state.selection.to === props.getPos() + props.node.nodeSize
    ) {
      const ae = (typeof document !== 'undefined' ? document.activeElement : null) as HTMLElement | null
      // If another math-field already has focus, don't steal it
      if (ae && ae.tagName?.toLowerCase() === 'math-field' && ae !== mathFieldRef.current) {
        return
      }
      mathFieldRef.current?.focus()
    }
  }, [props.selected, props.editor.state.selection])

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

  const handleKeyDown = useCallback((evt: KeyboardEvent) => {
    // Handle Enter key to exit math block and create new paragraph
    if (evt.key === 'Enter' && !evt.isComposing) {
      const insertPos = props.getPos() + props.node.nodeSize
      props.editor
        .chain()
        .focus()
        .insertContentAt(insertPos, { type: 'paragraph' })
        .setTextSelection(insertPos + 1)
        .run()
      evt.preventDefault()
      evt.stopPropagation()
    }
  }, [props.editor, props.getPos, props.node.nodeSize])

  useEffect(() => {
    if (mathFieldRef.current) {
      mathFieldRef.current.addEventListener('input', handleInput)
      mathFieldRef.current.addEventListener('move-out', handleMoveOut)
      mathFieldRef.current.addEventListener('beforeinput', handleBeforeInput)
      // Capture to intercept before MathLive handles Enter
      mathFieldRef.current.addEventListener('keydown', handleKeyDown, true)
      return () => {
        mathFieldRef.current?.removeEventListener('input', handleInput)
        mathFieldRef.current?.removeEventListener('move-out', handleMoveOut)
        mathFieldRef.current?.removeEventListener('beforeinput', handleBeforeInput)
        mathFieldRef.current?.removeEventListener('keydown', handleKeyDown, true)
      }
    }
  }, [handleInput, handleMoveOut, handleBeforeInput, handleKeyDown])

  // Avoid auto-focusing on mount to prevent focus jumping to last block
  // Focus is handled when the node is actually selected (see effect above).
  
  const renderedResult = useMemo(() => {
    const r = results[id]
    if (!r || r === '\\mathrm{Nothing}') return null
    try {
      // Prefix with equals for display
      return katex.renderToString(`= ${r}`, { throwOnError: false })
    } catch {
      return null
    }
  }, [results, id])

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    mathFieldRef.current?.focus()
  }

  return (
    <NodeViewWrapper>
      <div className="my-4 relative">
        <div
          className="p-4 bg-gray-50 rounded-lg cursor-text"
          onMouseDown={handleClick}
        >
          <div className="flex items-center">
            <div className="flex-1 text-center">
              <math-field
                ref={mathFieldRef}
                value={props.node.attrs.latex}
                default-mode="math"
                virtual-keyboard-mode="manual"
                menu-editor="none"
                className="border-none shadow-none"
              ></math-field>
            </div>
          </div>
          {renderedResult && (
            <div className="absolute bottom-0 right-0 px-2 py-1 bg-gray-800 text-gray-100 border border-gray-700 text-sm rounded-br-lg">
              <span
                className="katex-block"
                // KaTeX renders safe HTML for math; avoid focus entirely
                dangerouslySetInnerHTML={{ __html: renderedResult }}
              />
            </div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export default MathBlock
