import { getPresentation } from "@/app/actions";
import { ViewWrapper } from "@/components/editor/ViewWrapper";
import { notFound } from "next/navigation";

interface ViewPageProps {
  params: { id: string };
}

export default async function ViewPage({ params: paramsPromise }: ViewPageProps) {
  // eslint-disable-next-line @typescript-eslint/await-thenable
  const params = await paramsPromise;
  const presentation = await getPresentation(params.id);

  if (!presentation) {
    return notFound();
  }

  return <ViewWrapper presentation={presentation} />;
}

