import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { notes } from "@db/schema";
import { eq, and } from "drizzle-orm";

export const notesRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.select().from(notes).where(eq(notes.userId, ctx.user.id));
  }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.select().from(notes).where(and(eq(notes.id, input.id), eq(notes.userId, ctx.user.id))).limit(1);
      return result[0] || null;
    }),

  create: authedQuery
    .input(z.object({ title: z.string().min(1), content: z.string().nullable().optional(), link: z.string().nullable().optional(), folder: z.string().default("General"), subjectId: z.number().nullable().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(notes).values({ userId: ctx.user.id, title: input.title, content: input.content || null, link: input.link || null, folder: input.folder, subjectId: input.subjectId || null }).returning();
      return result[0];
    }),

  update: authedQuery
    .input(z.object({ id: z.number(), title: z.string().min(1).optional(), content: z.string().nullable().optional(), link: z.string().nullable().optional(), folder: z.string().optional(), subjectId: z.number().nullable().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const result = await db.update(notes).set(data).where(and(eq(notes.id, id), eq(notes.userId, ctx.user.id))).returning();
      return result[0];
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.delete(notes).where(and(eq(notes.id, input.id), eq(notes.userId, ctx.user.id)));
      return { success: true };
    }),
});
