import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { chatHistory, apiKeys } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";
import { tutorChat } from "./ai-service";

export const chatRouter = createRouter({
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.select().from(chatHistory).where(eq(chatHistory.userId, ctx.user.id)).orderBy(desc(chatHistory.updatedAt));
  }),

  getById: authedQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.select().from(chatHistory).where(and(eq(chatHistory.id, input.id), eq(chatHistory.userId, ctx.user.id))).limit(1);
      return result[0] || null;
    }),

  create: authedQuery
    .input(z.object({ title: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const result = await db.insert(chatHistory).values({ userId: ctx.user.id, title: input.title, messages: [] }).returning();
      return result[0];
    }),

  sendMessage: authedQuery
    .input(z.object({ chatId: z.number(), message: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      const keys = await db.select().from(apiKeys).where(eq(apiKeys.userId, ctx.user.id)).limit(1);
      if (!keys[0]) throw new Error("No API keys configured.");
      const provider = keys[0].preferredModel as "gemini" | "groq";
      const apiKey = provider === "gemini" ? keys[0].geminiKey : keys[0].groqKey;
      if (!apiKey) throw new Error(`No ${provider} API key configured`);
      const chat = await db.select().from(chatHistory).where(and(eq(chatHistory.id, input.chatId), eq(chatHistory.userId, ctx.user.id))).limit(1);
      if (!chat[0]) throw new Error("Chat not found");
      const messages = (chat[0].messages || []) as { role: string; content: string }[];
      messages.push({ role: "user", content: input.message });
      const response = await tutorChat(apiKey, provider, messages);
      messages.push({ role: "assistant", content: response });
      const updated = await db.update(chatHistory).set({ messages, title: chat[0].title === "New Chat" ? input.message.slice(0, 50) : chat[0].title, updatedAt: new Date() }).where(eq(chatHistory.id, input.chatId)).returning();
      return updated[0];
    }),

  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      await db.delete(chatHistory).where(and(eq(chatHistory.id, input.id), eq(chatHistory.userId, ctx.user.id)));
      return { success: true };
    }),

  search: authedQuery
    .input(z.object({ query: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const db = getDb();
      const allChats = await db.select().from(chatHistory).where(eq(chatHistory.userId, ctx.user.id)).orderBy(desc(chatHistory.updatedAt));
      const lowerQuery = input.query.toLowerCase();
      return allChats.filter((chat) => {
        if (chat.title.toLowerCase().includes(lowerQuery)) return true;
        const msgs = (chat.messages || []) as { role: string; content: string }[];
        return msgs.some((m) => m.content.toLowerCase().includes(lowerQuery));
      });
    }),
});
