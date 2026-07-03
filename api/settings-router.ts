import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { apiKeys } from "@db/schema";
import { eq } from "drizzle-orm";
import { validateGeminiKey, validateGroqKey } from "./ai-service";

export const settingsRouter = createRouter({
  getApiKeys: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const row = await db.select().from(apiKeys).where(eq(apiKeys.userId, ctx.user.id)).limit(1);
    return row[0] || null;
  }),

  saveApiKeys: authedQuery
    .input(
      z.object({
        geminiKey: z.string().nullable().optional(),
        groqKey: z.string().nullable().optional(),
        preferredModel: z.enum(["gemini", "groq"]).default("gemini"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();

      if (input.geminiKey) {
        const valid = await validateGeminiKey(input.geminiKey);
        if (!valid) throw new Error("Invalid Gemini API key");
      }
      if (input.groqKey) {
        const valid = await validateGroqKey(input.groqKey);
        if (!valid) throw new Error("Invalid Groq API key");
      }

      const existing = await db
        .select()
        .from(apiKeys)
        .where(eq(apiKeys.userId, ctx.user.id))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(apiKeys)
          .set({
            geminiKey: input.geminiKey || existing[0].geminiKey,
            groqKey: input.groqKey || existing[0].groqKey,
            preferredModel: input.preferredModel,
          })
          .where(eq(apiKeys.userId, ctx.user.id));
      } else {
        await db.insert(apiKeys).values({
          userId: ctx.user.id,
          geminiKey: input.geminiKey || null,
          groqKey: input.groqKey || null,
          preferredModel: input.preferredModel,
        });
      }

      return { success: true };
    }),

  validateKey: authedQuery
    .input(z.object({ provider: z.enum(["gemini", "groq"]), key: z.string() }))
    .mutation(async ({ input }) => {
      if (input.provider === "gemini") {
        const valid = await validateGeminiKey(input.key);
        return { valid };
      }
      const valid = await validateGroqKey(input.key);
      return { valid };
    }),
});
