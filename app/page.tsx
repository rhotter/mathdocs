'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useCallback, useEffect } from 'react'
import MathBlock from './components/MathBlock'
import MathInline from './components/MathInline'
import { MathProvider } from './contexts/MathContext'
import * as Y from 'yjs'
import Collaboration from '@tiptap/extension-collaboration'
import { TiptapCollabProvider } from '@hocuspocus/provider'
import { useSearchParams } from 'next/navigation'

export default function Home() {
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode') || 'edit'
  const docName = searchParams.get('doc') || 'default-doc'
  
  const ydoc = new Y.Doc()

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false,
      }),
      MathBlock,
      MathInline,
      Collaboration.configure({
        document: ydoc,
      }),
    ],
    editable: mode === 'edit',
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none',
      },
    },
    immediatelyRender: false,
  })

  useEffect(() => {
    const provider = new TiptapCollabProvider({
      name: docName,
      appId: process.env.NEXT_PUBLIC_TIPTAP_APP_ID!,
      token: process.env.NEXT_PUBLIC_TIPTAP_TOKEN!,
      document: ydoc,

      onSynced() {
        console.log('synced')
        if (!ydoc.getMap('config').get('initialContentLoaded') && editor) {
          ydoc.getMap('config').set('initialContentLoaded', true)
          console.log('synced')

          editor?.commands.setContent(
            '<h1>Welcome to Mathdocs</h1><p>Write markdown and press CMD+E for inline math, or CMD+SHIFT+E for block math.</p>',
          )
        }
      }
    })
  }, [editor])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!editor?.isEditable) return
    
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
