"use client";

import { createPresentation } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { generateNewKeyString, encrypt, importKey } from "@/lib/crypto";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function Home() {
  const router = useRouter();
  const [isCreating, startCreateTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"error" | null>(null);

  const handleCreate = () => {
    startCreateTransition(async () => {
      setStatus(null);
      try {
        const decryptionKey = await generateNewKeyString();
        const key = await importKey(decryptionKey);
        const initialContent = "# Welcome to your presentation!";
        const encryptedContent = await encrypt(initialContent, key);

        const { publicId, editKey } = await createPresentation(encryptedContent);

        router.push(`/p/${publicId}/e/${editKey}/h#${decryptionKey}`);
      } catch (error) {
        setStatus(
          `Error creating presentation: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        setStatusType("error");
      }
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="flex flex-col items-center gap-2">
        <Button onClick={handleCreate} disabled={isCreating} className="gap-2">
          {isCreating && <Spinner />}
          Create New Presentation
        </Button>
        {status && (
          <p
            className={cn(
              "text-sm",
              statusType === "error" ? "text-red-600" : "text-green-600"
            )}
          >
            {status}
          </p>
        )}
      </div>
    </main>
  );
}
