import { getPresentation } from "@/app/actions";
import { PresentationEditor } from "@/components/editor/PresentationEditor";
import { notFound } from "next/navigation";

interface PresentationPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ editKey?: string }>;
}

export default async function PresentationPage({
  params,
  searchParams,
}: PresentationPageProps) {
  const { id } = await params;
  const { editKey } = await searchParams;

  const presentation = await getPresentation(id);

  if (!presentation) {
    notFound();
  }

  return (
    <PresentationEditor
      presentation={presentation}
      editKeyFromUrl={editKey}
    />
  );
}
