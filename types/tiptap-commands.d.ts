import { Command } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mathBlock: {
      insertMathBlock: () => ReturnType
    }
  }
}
