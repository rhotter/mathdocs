'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useCallback, useEffect } from 'react'
import MathBlock from './components/MathBlock'

export default function Home() {
  const editor = useEditor({
    extensions: [
      StarterKit,
      MathBlock,
    ],
    content: '<h1>Welcome to the Math Editor</h1><p>Write markdown and press CMD+E to insert math blocks.</p>',
  })

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.metaKey && event.key === 'e') {
      event.preventDefault()
      editor?.commands.insertMathBlock()
    }
  }, [editor])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="max-w-3xl mx-auto p-8">
      <EditorContent editor={editor} className="prose prose-slate max-w-none" />
    </div>
  )
}
