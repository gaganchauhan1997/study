import { authRouter } from "./auth-router";
import { settingsRouter } from "./settings-router";
import { subjectsRouter } from "./subjects-router";
import { flashcardsRouter } from "./flashcards-router";
import { quizzesRouter } from "./quizzes-router";
import { chatRouter } from "./chat-router";
import { calendarRouter } from "./calendar-router";
import { notesRouter } from "./notes-router";
import { analyticsRouter } from "./analytics-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  settings: settingsRouter,
  subjects: subjectsRouter,
  flashcards: flashcardsRouter,
  quizzes: quizzesRouter,
  chat: chatRouter,
  calendar: calendarRouter,
  notes: notesRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
