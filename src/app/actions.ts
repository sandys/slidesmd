"use server";

import { db } from "@/db";
import { presentations, slides } from "@/db/schema";
import { nanoid } from "nanoid";
import bcrypt from "bcrypt";
import { redirect } from "next/navigation";
import { and, eq, inArray } from "drizzle-orm";

export async function createPresentation(initialEncryptedContent: string) {
  const publicId = nanoid(8);
  const editKey = nanoid(12);
  const hashedEditKey = await bcrypt.hash(editKey, 10);

  await db.transaction(async (tx) => {
    const presentationInsertResult = await tx
      .insert(presentations)
      .values({
        publicId,
        hashedEditKey,
      })
      .run();

    const newPresentationId = presentationInsertResult.lastInsertRowid;

    if (newPresentationId === null || newPresentationId === undefined) {
      tx.rollback();
      throw new Error("Failed to create presentation.");
    }

    const presentationIdAsNumber = Number(newPresentationId);

    await tx
      .insert(slides)
      .values({
        presentationId: presentationIdAsNumber,
        content: initialEncryptedContent,
        order: 1,
      })
      .run();
  });

  return { publicId, editKey };
}

export async function getPresentation(publicId: string) {
    const presentation = await db.query.presentations.findFirst({
        where: eq(presentations.publicId, publicId),
        with: {
            slides: {
                orderBy: (slides, { asc }) => [asc(slides.order)],
            },
        },
    });

    return presentation;
}

type Slide = {
    id?: number;
    content: string;
    order: number;
};

export async function updatePresentation(publicId: string, editKey: string, newSlides: Slide[]) {
    const presentation = await db.query.presentations.findFirst({
        where: eq(presentations.publicId, publicId),
    });

    if (!presentation) {
        throw new Error("Presentation not found");
    }

    const isValid = await bcrypt.compare(editKey, presentation.hashedEditKey);

    if (!isValid) {
        throw new Error("Invalid edit key");
    }

    await db.transaction(async (tx) => {
        const slideIdsToKeep = newSlides.map((s) => s.id).filter(Boolean) as number[];
        if (slideIdsToKeep.length > 0) {
            await tx
                .delete(slides)
                .where(
                    and(
                        eq(slides.presentationId, presentation.id),
                        inArray(slides.id, slideIdsToKeep)
                    )
                );
        } else {
            await tx.delete(slides).where(eq(slides.presentationId, presentation.id));
        }

        for (const slide of newSlides) {
            if (slide.id) {
                await tx
                    .update(slides)
                    .set({ content: slide.content, order: slide.order })
                    .where(eq(slides.id, slide.id));
            } else {
                await tx.insert(slides).values({
                    presentationId: presentation.id,
                    content: slide.content,
                    order: slide.order,
                });
            }
        }
    });
}

export async function verifyEditKey(publicId: string, editKey: string): Promise<boolean> {
    const presentation = await db.query.presentations.findFirst({
        where: eq(presentations.publicId, publicId),
    });

    if (!presentation) {
        return false;
    }

    const isValid = await bcrypt.compare(editKey, presentation.hashedEditKey);
    return isValid;
}
