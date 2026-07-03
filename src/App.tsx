import { Routes, Route } from "react-router";
import { Layout } from "./components/Layout";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Dashboard from "./pages/Dashboard";
import Tutor from "./pages/Tutor";
import Flashcards from "./pages/Flashcards";
import Quizzes from "./pages/Quizzes";
import ResourceHub from "./pages/ResourceHub";
import CalendarPage from "./pages/CalendarPage";
import Analytics from "./pages/Analytics";
import ChatHistory from "./pages/ChatHistory";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/tutor" element={<Tutor />} />
        <Route path="/flashcards" element={<Flashcards />} />
        <Route path="/quizzes" element={<Quizzes />} />
        <Route path="/resources" element={<ResourceHub />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/history" element={<ChatHistory />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
