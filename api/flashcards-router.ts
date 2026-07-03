import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { flashcards, apiKeys } from "@db/schema";
import { eq, and, lte } from "drizzle-orm";
import { generateFlashcards } from "./ai-service";

function calculateNextReview(repetitions: number, easeFactor: number, quality: number) {
  let newRepetitions = repetitions;
  let newEaseFactor = easeFactor;

  if (quality >= 3) {
    if (newRepetitions === 0) newRepetitions = 1;
    else if (newRepetitions === 1) newRepetitions = 2;
    else newRepetitions += 1;
    newEaseFactor = Math.max(130, easeFactor + (10 * (5 - quality)));
  } else {
    newRepetitions = 0;
    newEaseFactor = Math.max(130, easeFactor + (10 * (5 - quality)));
  }

  let interval: number;
  if (newRepetitions === 0) interval = 1;
  else if (newRepetitions === 1) interval = 1;
  else if (newRepetitions === 2) interval = 6;
  else interval = Math.round(6 * (newEaseFactor / 100));

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return { repetitions: newRepetitions, easeFactor: newEaseFactor, interval, nextReview };
}

export const flashcardsRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.select().from(flashcards).where(eq(flashcards.userId, ctx.user.id));
  }),

  dueForReview: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(flashcards)
      .where(and(eq(flashcards.userId, ctx.user.id), lte(flashcards.nextReview, new Date())));
  }),

  create: authedQuery
    .input(z.object({ front: z.string().min(1), back: z.string().min(1), subjectId: z.number().nullable().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(flashcards).values({ userId: ctx.user.id, front: input.front, back: input.back, subjectId: input.subjectId || null }).returning();
      return result[0];
    }),

  update: authedQuery
    .input(z.object({ id: z.number(), front: z.string().min(1).optional(), back: z.string().min(1).optional(), subjectId: z.number().nullable().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const { id, ...data } = input;
      const result = await db.update(flashcards).set(data).where(and(eq(flashcards.id, id), eq(flashcards.userId, ctx.user.id))).returning();
      return result[0];
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.delete(flashcards).where(and(eq(flashcards.id, input.id), eq(flashcards.userId, ctx.user.id)));
      return { success: true };
    }),

  review: authedQuery
    .input(z.object({ id: z.number(), quality: z.number().min(0).max(5) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const card = await db.select().from(flashcards).where(and(eq(flashcards.id, input.id), eq(flashcards.userId, ctx.user.id))).limit(1);
      if (!card[0]) throw new Error("Flashcard not found");
      const result = calculateNextReview(card[0].repetitions, card[0].easeFactor, input.quality);
      const updated = await db.update(flashcards).set({ repetitions: result.repetitions, easeFactor: result.easeFactor, interval: result.interval, nextReview: result.nextReview }).where(eq(flashcards.id, input.id)).returning();
      return updated[0];
    }),

  generateWithAI: authedQuery
    .input(z.object({ topic: z.string().min(1), count: z.number().min(1).max(30).default(10), subjectId: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const keys = await db.select().from(apiKeys).where(eq(apiKeys.userId, ctx.user.id)).limit(1);
      if (!keys[0]) throw new Error("No API keys configured. Please add your API keys in Settings.");
      const provider = keys[0].preferredModel as "gemini" | "groq";
      const apiKey = provider === "gemini" ? keys[0].geminiKey : keys[0].groqKey;
      if (!apiKey) throw new Error(`No ${provider} API key configured`);
      const generated = await generateFlashcards(apiKey, provider, input.topic, input.count);
      const inserted = [];
      for (const card of generated) {
        const result = await db.insert(flashcards).values({ userId: ctx.user.id, front: card.front, back: card.back, subjectId: input.subjectId || null }).returning();
        inserted.push(result[0]);
      }
      return inserted;
    }),
});
