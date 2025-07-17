import { createPresentation } from "@/app/actions";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <form action={createPresentation}>
        <Button type="submit">Create New Presentation</Button>
      </form>
    </main>
  );
}