'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useCallback, useEffect } from 'react'
import MathBlock from './components/MathBlock'
import MathInline from './components/MathInline'
import { MathProvider } from './contexts/MathContext'

export default function Home() {
  const editor = useEditor({
    extensions: [
      StarterKit,
      MathBlock,
      MathInline,
    ],
    content: '<h1>Welcome to Mathdocs</h1><p>Write markdown and press CMD+E for inline math, or CMD+SHIFT+E for block math.</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none',
      },
    },
    immediatelyRender: false,
  })

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.metaKey && !event.shiftKey && event.key === 'e') {
      event.preventDefault()
      editor?.commands.insertMathInline()
    } else if (event.metaKey && event.shiftKey && event.key === 'e') {
      event.preventDefault()
      editor?.commands.insertMathBlock()
    }
  }, [editor])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <MathProvider>
      <div className="max-w-3xl mx-auto p-8">
        <EditorContent editor={editor} />
      </div>
    </MathProvider>
  )
}
