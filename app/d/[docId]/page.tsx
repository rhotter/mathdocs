"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect, useState } from "react";
import MathBlock from "../../components/MathBlock";
import MathInline from "../../components/MathInline";
import { MathProvider } from "../../contexts/MathContext";
import { useSearchParams } from "next/navigation";
import { use } from "react";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default function DocPage({
  params,
}: {
  params: Promise<{ docId: string }>;
}) {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode") || "edit";
  const { docId } = use(params);
  const isMac =
    typeof window !== "undefined" && /Macintosh/.test(navigator.userAgent);

  const editor = useEditor({
    extensions: [
      StarterKit,
      MathBlock,
      MathInline,
    ],
    editable: mode === "edit",
    editorProps: {
      attributes: {
        class: "prose prose-slate max-w-none",
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      // Ensure first node is always an H1
      const firstNode = editor.state.doc.firstChild;
      if (!firstNode || firstNode.type.name !== 'heading' || firstNode.attrs.level !== 1) {
        // Use a timeout to avoid infinite loops
        setTimeout(() => {
          const currentFirstNode = editor.state.doc.firstChild;
          if (!currentFirstNode || currentFirstNode.type.name !== 'heading' || currentFirstNode.attrs.level !== 1) {
            editor.chain().focus().insertContentAt(0, '<h1></h1>').run();
          }
        }, 0);
      }
    },
  });

  useEffect(() => {
    if (editor) {
      const storageKey = `mathdocs-${docId}`;
      const savedContent = localStorage.getItem(storageKey);

      if (savedContent) {
        editor.commands.setContent(savedContent);
      } else {
        const modifier = isMac ? "CMD" : "CTRL";
        editor.commands.setContent(
          `<h1>Welcome to Mathdocs</h1><p>Write markdown and press <code>${modifier}+E</code> for inline math, or <code>${modifier}+SHIFT+E</code> for block math.</p>`
        );
      }

      const saveContent = () => {
        localStorage.setItem(storageKey, editor.getHTML());
      };

      editor.on('update', saveContent);

      return () => {
        editor.off('update', saveContent);
      };
    }
  }, [editor, docId, isMac]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!editor?.isEditable) return;

      const isModifierPressed = isMac ? event.metaKey : event.ctrlKey;

      if (isModifierPressed && !event.shiftKey && event.key === "e") {
        event.preventDefault();
        editor?.commands.insertMathInline();
      } else if (isModifierPressed && event.shiftKey && event.key === "e") {
        event.preventDefault();
        editor?.commands.insertMathBlock();
      }
    },
    [editor]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <MathProvider>
      <div className="max-w-3xl mx-auto p-8">
        <Link
          href="/"
          className="fixed top-6 left-6 p-2 text-gray-600 bg-gray-100 opacity-30 hover:opacity-100 hover:text-gray-700 transition-all duration-200 rounded-full hover:bg-gray-200"
          title="Back to documents"
        >
          <ArrowLeftIcon className="w-4 h-4" />
        </Link>
        <EditorContent editor={editor} />
      </div>
    </MathProvider>
  );
}
