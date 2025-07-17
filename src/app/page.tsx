"use client";

import { createPresentation } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { generateNewKeyString, encrypt, importKey } from "@/lib/crypto";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function Home() {
  const router = useRouter();
  const [isCreating, startCreateTransition] = useTransition();

  const handleCreate = () => {
    startCreateTransition(async () => {
      try {
        const decryptionKey = await generateNewKeyString();
        const key = await importKey(decryptionKey);
        const initialContent = "# Welcome to your presentation!";
        const encryptedContent = await encrypt(initialContent, key);

        const { publicId, editKey } = await createPresentation(encryptedContent);

        router.push(`/p/${publicId}/e/${editKey}/h#${decryptionKey}`);
      } catch (error) {
        alert(`Error creating presentation: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Button onClick={handleCreate} disabled={isCreating}>
        {isCreating ? "Creating..." : "Create New Presentation"}
      </Button>
    </main>
  );
}
