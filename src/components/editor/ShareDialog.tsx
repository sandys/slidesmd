// src/components/editor/ShareDialog.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  publicId: string;
  editKey?: string;
}

export function ShareDialog({ isOpen, onClose, publicId, editKey }: ShareDialogProps) {
  const [decryptionKey, setDecryptionKey] = useState("");
  const [copied, setCopied] = useState<"edit" | "view" | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDecryptionKey(window.location.hash.substring(1));
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const baseUrl = window.location.origin;
  const viewUrl = `${baseUrl}/p/${publicId}/h#${decryptionKey}`;
  const editUrl = editKey ? `${baseUrl}/p/${publicId}/e/${editKey}/h#${decryptionKey}` : "";

  const copyToClipboard = (text: string, type: "edit" | "view") => {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md text-black">
        <h2 className="text-2xl font-bold mb-4">Share Presentation</h2>
        
        <div className="space-y-4">
          {editKey && (
            <div>
              <Label className="block text-sm font-medium text-gray-700">Your Private Edit Link (Keep this safe!)</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input type="text" readOnly value={editUrl} />
                <Button onClick={() => copyToClipboard(editUrl, "edit")}>Copy</Button>
                {copied === "edit" && <span className="text-sm text-green-600">Copied!</span>}
              </div>
            </div>
          )}

          <div>
            <Label className="block text-sm font-medium text-gray-700">Read-Only Link (For sharing)</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Input type="text" readOnly value={viewUrl} />
              <Button onClick={() => copyToClipboard(viewUrl, "view")}>Copy</Button>
              {copied === "view" && <span className="text-sm text-green-600">Copied!</span>}
            </div>
          </div>
        </div>

        <div className="mt-6 text-right">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

