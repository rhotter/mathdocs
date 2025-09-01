"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect, useState } from "react";
import MathBlock from "../../components/MathBlock";
import MathInline from "../../components/MathInline";
import { MathProvider } from "../../contexts/MathContext";
import { useSearchParams } from "next/navigation";
import { use } from "react";

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
          `<h1>Welcome to Mathdocs</h1><p>Write markdown and press ${modifier}+E for inline math, or ${modifier}+SHIFT+E for block math.</p>`
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
        <EditorContent editor={editor} />
      </div>
    </MathProvider>
  );
}
