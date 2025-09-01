import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SetAvatar from "./components/SetAvatar";
import Chat from "./pages/Chat";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ErrorBoundary from "./components/ErrorBoundary";
import PWARegistration from "./components/PWARegistration";
import LogoTest from "./components/LogoTest";

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/setAvatar" element={<SetAvatar />} />
          <Route path="/test" element={<LogoTest />} />
          <Route path="/" element={<Chat />} />
        </Routes>
        <PWARegistration />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
