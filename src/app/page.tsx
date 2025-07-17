import { createPresentation } from "@/app/actions";
import { SubmitButton } from "@/components/SubmitButton";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <form action={createPresentation}>
        <SubmitButton />
      </form>
    </main>
  );
}