import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { quizzes, quizAttempts, apiKeys } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { generateQuiz } from "./ai-service";

export const quizzesRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.select().from(quizzes).where(eq(quizzes.userId, ctx.user.id));
  }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.select().from(quizzes).where(and(eq(quizzes.id, input.id), eq(quizzes.userId, ctx.user.id))).limit(1);
      return result[0] || null;
    }),

  create: authedQuery
    .input(z.object({ title: z.string().min(1), questions: z.array(z.any()), subjectId: z.number().nullable().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(quizzes).values({ userId: ctx.user.id, title: input.title, questions: input.questions, subjectId: input.subjectId || null }).returning();
      return result[0];
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.delete(quizzes).where(and(eq(quizzes.id, input.id), eq(quizzes.userId, ctx.user.id)));
      return { success: true };
    }),

  generateWithAI: authedQuery
    .input(z.object({ topic: z.string().min(1), questionCount: z.number().min(1).max(20).default(5), subjectId: z.number().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const keys = await db.select().from(apiKeys).where(eq(apiKeys.userId, ctx.user.id)).limit(1);
      if (!keys[0]) throw new Error("No API keys configured.");
      const provider = keys[0].preferredModel as "gemini" | "groq";
      const apiKey = provider === "gemini" ? keys[0].geminiKey : keys[0].groqKey;
      if (!apiKey) throw new Error(`No ${provider} API key configured`);
      const generated = await generateQuiz(apiKey, provider, input.topic, input.questionCount);
      const result = await db.insert(quizzes).values({ userId: ctx.user.id, title: generated.title || `Quiz: ${input.topic}`, questions: generated.questions, subjectId: input.subjectId || null }).returning();
      return result[0];
    }),

  submitAttempt: authedQuery
    .input(z.object({ quizId: z.number(), answers: z.array(z.any()), score: z.number(), totalQuestions: z.number(), weakTopics: z.array(z.string()).default([]) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(quizAttempts).values({ userId: ctx.user.id, quizId: input.quizId, score: input.score, totalQuestions: input.totalQuestions, answers: input.answers, weakTopics: input.weakTopics }).returning();
      return result[0];
    }),

  getAttempts: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.select().from(quizAttempts).where(eq(quizAttempts.userId, ctx.user.id));
  }),

  getQuizAttempts: authedQuery
    .input(z.object({ quizId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      return db.select().from(quizAttempts).where(and(eq(quizAttempts.quizId, input.quizId), eq(quizAttempts.userId, ctx.user.id)));
    }),
});
