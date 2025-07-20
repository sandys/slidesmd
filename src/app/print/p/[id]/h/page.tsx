// src/app/print/p/[id]/h/page.tsx
import { getPresentation } from "@/app/actions";
import { PrintWrapper } from "@/components/editor/PrintWrapper";
import { notFound } from "next/navigation";

interface PrintPageProps {
  params: {
    id: string;
  };
}

export default async function PrintPage({ params: paramsPromise }: PrintPageProps) {
  // Await the params promise as required by Next.js 15
  // eslint-disable-next-line @typescript-eslint/await-thenable
  const params = await paramsPromise;
  console.log("Print page server params:", params);
  const presentation = await getPresentation(params.id);

  if (!presentation) {
    return notFound();
  }

  // Pass the server-fetched data to a Client Component
  return <PrintWrapper presentation={presentation} />;
}