import { getPresentation } from "@/app/actions";
import { DecryptionWrapper } from "@/components/editor/DecryptionWrapper";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ViewPageProps {
  params: Promise<{ id: string }>;
}

export default async function ViewPage({ params: paramsPromise }: ViewPageProps) {
  const params = await paramsPromise;
  const presentation = await getPresentation(params.id);

  if (!presentation) {
    return notFound();
  }

  return <DecryptionWrapper presentation={presentation} mode="view" />;
}

