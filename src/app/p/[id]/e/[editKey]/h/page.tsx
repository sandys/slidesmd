// src/app/p/[id]/e/[editKey]/h/page.tsx
import { getPresentation } from "@/app/actions";
import { DecryptionWrapper } from "@/components/editor/DecryptionWrapper";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface EditPageProps {
  params: Promise<{
    id: string;
    editKey: string;
  }>;
}

export default async function EditPage({ params: paramsPromise }: EditPageProps) {
  const params = await paramsPromise;
  const presentation = await getPresentation(params.id);

  if (!presentation) {
    return <div>Presentation not found</div>;
  }

  return (
    <DecryptionWrapper
      presentation={presentation}
      mode="edit"
      editKeyFromUrl={params.editKey}
    />
  );
}
