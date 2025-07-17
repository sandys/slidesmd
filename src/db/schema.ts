import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { relations, sql } from 'drizzle-orm';

export const presentations = sqliteTable('presentations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  publicId: text('public_id').notNull().unique(),
  hashedEditKey: text('hashed_edit_key').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(strftime('%s', 'now'))`),
  theme: text('theme').notNull().default('black.css'),
});

export const slides = sqliteTable('slides', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  content: text('content').notNull().default(''),
  order: integer('order').notNull(),
  presentationId: integer('presentation_id').notNull().references(() => presentations.id, { onDelete: 'cascade' }),
});

export const presentationRelations = relations(presentations, ({ many }) => ({
  slides: many(slides),
}));

export const slideRelations = relations(slides, ({ one }) => ({
  presentation: one(presentations, {
    fields: [slides.presentationId],
    references: [presentations.id],
  }),
}));
