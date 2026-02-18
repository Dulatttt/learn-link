import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Rooms from "./pages/Rooms";
import RoomDetail from "./pages/RoomDetail";
import Forum from "./pages/Forum";
import ForumDetail from "./pages/ForumDetail";
import Tests from "./pages/Tests";
import TestTaking from "./pages/TestTaking";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/rooms/:id" element={<RoomDetail />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/forum/:id" element={<ForumDetail />} />
          <Route path="/tests" element={<Tests />} />
          <Route path="/tests/:id" element={<TestTaking />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
