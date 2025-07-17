import { getPresentation } from "@/app/actions";
import { PresentationEditor } from "@/components/editor/PresentationEditor";
import { notFound } from "next/navigation";

interface PresentationPageProps {
  params: { id: string };
  searchParams: { editKey?: string };
}

export default async function PresentationPage({
  params,
  searchParams,
}: PresentationPageProps) {
  const presentation = await getPresentation(params.id);

  if (!presentation) {
    notFound();
  }

  return (
    <PresentationEditor
      presentation={presentation}
      editKeyFromUrl={searchParams.editKey}
    />
  );
}
