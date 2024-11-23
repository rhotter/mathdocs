"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCallback, useEffect, useState } from "react";
import MathBlock from "../../components/MathBlock";
import MathInline from "../../components/MathInline";
import { MathProvider } from "../../contexts/MathContext";
import * as Y from "yjs";
import Collaboration from "@tiptap/extension-collaboration";
import { TiptapCollabProvider } from "@hocuspocus/provider";
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
  const [isSynced, setIsSynced] = useState(false); // Add this state

  const ydoc = new Y.Doc();
  const isMac =
    typeof window !== "undefined" && /Macintosh/.test(navigator.userAgent);

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
    editable: mode === "edit",
    editorProps: {
      attributes: {
        class: "prose prose-slate max-w-none",
      },
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    const provider = new TiptapCollabProvider({
      name: docId,
      appId: process.env.NEXT_PUBLIC_TIPTAP_APP_ID!,
      token: process.env.NEXT_PUBLIC_TIPTAP_TOKEN!,
      document: ydoc,

      onSynced() {
        setIsSynced(true); // Set sync state to true
        if (!ydoc.getMap("config").get("initialContentLoaded") && editor) {
          ydoc.getMap("config").set("initialContentLoaded", true);

          const modifier = isMac ? "CMD" : "CTRL";

          editor?.commands.setContent(
            `<h1>Welcome to Mathdocs</h1><p>Write markdown and press ${modifier}+E for inline math, or ${modifier}+SHIFT+E for block math.</p>`
          );
        }
      },
    });
  }, [editor]);

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
        {isSynced ? (
          <EditorContent editor={editor} />
        ) : (
          <div>Loading text...</div>
        )}
      </div>
    </MathProvider>
  );
}
