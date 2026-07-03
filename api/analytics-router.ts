import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { quizAttempts, studySessions, flashcards } from "@db/schema";
import { eq, desc } from "drizzle-orm";

export const analyticsRouter = createRouter({
  getStats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user.id;
    const attempts = await db.select().from(quizAttempts).where(eq(quizAttempts.userId, userId)).orderBy(desc(quizAttempts.createdAt));
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sessions = await db.select().from(studySessions).where(eq(studySessions.userId, userId)).orderBy(desc(studySessions.date));
    const recentSessions = sessions.filter((s) => s.date >= thirtyDaysAgo);
    const studyDates = new Set(sessions.map((s) => s.date.toISOString().split("T")[0]));
    let currentStreak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      if (studyDates.has(dateStr)) {
        currentStreak++;
      } else if (i === 0) {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (!studyDates.has(yesterday.toISOString().split("T")[0])) currentStreak = 0;
        break;
      } else {
        break;
      }
    }
    const cards = await db.select().from(flashcards).where(eq(flashcards.userId, userId));
    const totalCards = cards.length;
    const masteredCards = cards.filter((c) => c.repetitions >= 3).length;
    const weakTopics: Record<string, number> = {};
    for (const attempt of attempts) {
      const topics = (attempt.weakTopics || []) as string[];
      for (const topic of topics) weakTopics[topic] = (weakTopics[topic] || 0) + 1;
    }
    const sortedWeakTopics = Object.entries(weakTopics).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([topic, count]) => ({ topic, count }));
    const avgScore = attempts.length > 0 ? Math.round((attempts.reduce((sum, a) => sum + (a.score / a.totalQuestions) * 100, 0) / attempts.length) * 10) / 10 : 0;
    const scoreOverTime = attempts.slice(0, 10).reverse().map((a, idx) => ({ attempt: idx + 1, score: Math.round((a.score / a.totalQuestions) * 100), date: a.createdAt.toISOString().split("T")[0] }));
    return { currentStreak, totalStudySessions: sessions.length, totalFlashcards: totalCards, masteredFlashcards: masteredCards, totalQuizAttempts: attempts.length, averageScore: avgScore, weakTopics: sortedWeakTopics, scoreOverTime, recentSessions: recentSessions.slice(0, 30) };
  }),

  logSession: authedQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    await db.insert(studySessions).values({ userId: ctx.user.id, date: new Date(), duration: 0, activityType: "study" });
    return { success: true };
  }),
});
