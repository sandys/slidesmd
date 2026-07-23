// src/app/present/p/[id]/h/page.tsx
import { getPresentation } from "@/app/actions";
import { DecryptionWrapper } from "@/components/editor/DecryptionWrapper";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PrintPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function PrintPage({ params: paramsPromise }: PrintPageProps) {
  // Await the params promise as required by Next.js 15
  const params = await paramsPromise;
  const presentation = await getPresentation(params.id);

  if (!presentation) {
    return notFound();
  }

  // Pass the server-fetched data to a Client Component
  return <DecryptionWrapper presentation={presentation} mode="present" />;
}
