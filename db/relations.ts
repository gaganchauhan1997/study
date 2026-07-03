import { relations } from "drizzle-orm";
import {
  users, apiKeys, subjects, flashcards, quizzes,
  quizAttempts, chatHistory, calendarEvents, notes, studySessions,
} from "./schema";

export const usersRelations = relations(users, ({ many, one }) => ({
  apiKeys: one(apiKeys),
  subjects: many(subjects),
  flashcards: many(flashcards),
  quizzes: many(quizzes),
  quizAttempts: many(quizAttempts),
  chatHistory: many(chatHistory),
  calendarEvents: many(calendarEvents),
  notes: many(notes),
  studySessions: many(studySessions),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  user: one(users, { fields: [subjects.userId], references: [users.id] }),
  flashcards: many(flashcards),
  quizzes: many(quizzes),
  calendarEvents: many(calendarEvents),
  notes: many(notes),
}));

export const flashcardsRelations = relations(flashcards, ({ one }) => ({
  user: one(users, { fields: [flashcards.userId], references: [users.id] }),
  subject: one(subjects, { fields: [flashcards.subjectId], references: [subjects.id] }),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  user: one(users, { fields: [quizzes.userId], references: [users.id] }),
  subject: one(subjects, { fields: [quizzes.subjectId], references: [subjects.id] }),
  attempts: many(quizAttempts),
}));

export const quizAttemptsRelations = relations(quizAttempts, ({ one }) => ({
  user: one(users, { fields: [quizAttempts.userId], references: [users.id] }),
  quiz: one(quizzes, { fields: [quizAttempts.quizId], references: [quizzes.id] }),
}));

export const chatHistoryRelations = relations(chatHistory, ({ one }) => ({
  user: one(users, { fields: [chatHistory.userId], references: [users.id] }),
}));

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  user: one(users, { fields: [calendarEvents.userId], references: [users.id] }),
  subject: one(subjects, { fields: [calendarEvents.subjectId], references: [subjects.id] }),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  user: one(users, { fields: [notes.userId], references: [users.id] }),
  subject: one(subjects, { fields: [notes.subjectId], references: [subjects.id] }),
}));

export const studySessionsRelations = relations(studySessions, ({ one }) => ({
  user: one(users, { fields: [studySessions.userId], references: [users.id] }),
}));
