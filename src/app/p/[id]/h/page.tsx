// src/app/p/[id]/h/page.tsx
import { getPresentation } from "@/app/actions";
import { DecryptionWrapper } from "@/components/editor/DecryptionWrapper";

interface ViewPageProps {
  params: {
    id: string;
  };
}

export default async function ViewPage({ params }: ViewPageProps) {
  const presentation = await getPresentation(params.id);

  if (!presentation) {
    return <div>Presentation not found</div>;
  }

  return <DecryptionWrapper presentation={presentation} />;
}
