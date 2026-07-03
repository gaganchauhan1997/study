import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { calendarEvents } from "@db/schema";
import { eq, and, gte, lte } from "drizzle-orm";

export const calendarRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.select().from(calendarEvents).where(eq(calendarEvents.userId, ctx.user.id));
  }),

  listByRange: authedQuery
    .input(z.object({ start: z.string(), end: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      return db.select().from(calendarEvents).where(and(eq(calendarEvents.userId, ctx.user.id), gte(calendarEvents.eventDate, new Date(input.start)), lte(calendarEvents.eventDate, new Date(input.end))));
    }),

  create: authedQuery
    .input(z.object({ title: z.string().min(1), description: z.string().nullable().optional(), eventDate: z.string(), eventType: z.string().default("study"), reminder: z.boolean().default(false), subjectId: z.number().nullable().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(calendarEvents).values({ userId: ctx.user.id, title: input.title, description: input.description || null, eventDate: new Date(input.eventDate), eventType: input.eventType, reminder: input.reminder, subjectId: input.subjectId || null }).returning();
      return result[0];
    }),

  update: authedQuery
    .input(z.object({ id: z.number(), title: z.string().min(1).optional(), description: z.string().nullable().optional(), eventDate: z.string().optional(), eventType: z.string().optional(), reminder: z.boolean().optional(), subjectId: z.number().nullable().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...rawData } = input;
      const data: Record<string, unknown> = { ...rawData };
      if (data.eventDate) data.eventDate = new Date(data.eventDate as string);
      if (data.subjectId === undefined) delete data.subjectId;
      const result = await db.update(calendarEvents).set(data as any).where(and(eq(calendarEvents.id, id), eq(calendarEvents.userId, ctx.user.id))).returning();
      return result[0];
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.delete(calendarEvents).where(and(eq(calendarEvents.id, input.id), eq(calendarEvents.userId, ctx.user.id)));
      return { success: true };
    }),
});
