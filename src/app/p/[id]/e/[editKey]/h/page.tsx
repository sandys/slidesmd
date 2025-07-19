// src/app/p/[id]/e/[editKey]/h/page.tsx
import { getPresentation } from "@/app/actions";
import { DecryptionWrapper } from "@/components/editor/DecryptionWrapper";

interface EditPageProps {
  params: Promise<{
    id: string;
    editKey: string;
  }>;
}

export default async function EditPage({ params }: EditPageProps) {
  const { id, editKey } = await params;
  const presentation = await getPresentation(id);

  if (!presentation) {
    return <div>Presentation not found</div>;
  }

  return (
    <DecryptionWrapper
      presentation={presentation}
      editKeyFromUrl={editKey}
    />
  );
}
