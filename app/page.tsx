"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

interface Document {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

export default function HomePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDocuments = () => {
    const docs: Document[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("mathdocs-")) {
        const docId = key.replace("mathdocs-", "");
        const content = localStorage.getItem(key) || "";

        const titleMatch = content.match(/<h1[^>]*>([^<]+)<\/h1>/);
        const title = titleMatch ? titleMatch[1] : `Document ${docId}`;

        docs.push({
          id: docId,
          title,
          content,
          updatedAt: Date.now()
        });
      }
    }

    docs.sort((a, b) => b.updatedAt - a.updatedAt);
    setDocuments(docs);
    setIsLoading(false);
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const deleteDocument = (docId: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      localStorage.removeItem(`mathdocs-${docId}`);
      loadDocuments();
    }
  };

  const createNewDocument = () => {
    const docId = Math.random().toString(36).slice(2, 11);
    window.location.href = `/d/${docId}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Mathdocs</h1>
        <button
          onClick={createNewDocument}
          className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          New
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="h-8"></div>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">No documents yet</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              <Link
                href={`/d/${doc.id}`}
                className="flex-1 hover:text-blue-600 transition-colors"
              >
                <h2 className="text-lg font-semibold mb-0.5">{doc.title}</h2>
                <p className="text-gray-500 text-xs">
                  Last updated {new Date(doc.updatedAt).toLocaleDateString()}
                </p>
              </Link>
              <button
                onClick={() => deleteDocument(doc.id)}
                className="ml-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                title="Delete document"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}