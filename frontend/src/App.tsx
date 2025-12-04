import { Routes, Route, Navigate } from "react-router-dom";
import { Box, CircularProgress } from "@mui/material";
import { useAuth, AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import KeyboardShortcutHandler from "./components/KeyboardShortcutHandler";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import CreateLessonPlan from "./pages/CreateLessonPlan";
import LessonPlanDetail from "./pages/LessonPlanDetail";
import MyDocuments from "./pages/MyDocuments";
import Profile from "./pages/Profile";
import Billing from "./pages/Billing";
import ActivateAccount from "./pages/ActivateAccount";
import AuthCallback from "./pages/AuthCallback";
import HelpCenter from "./pages/HelpCenter";
import ReleaseNotes from "./pages/ReleaseNotes";
import TermsPolicies from "./pages/TermsPolicies";
import KeyboardShortcuts from "./pages/KeyboardShortcuts";
import AdminDashboard from "./pages/admin/AdminDashboard";

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

   // Admin: luôn hiển thị AdminDashboard, không cho truy cập trang khác
  if (user?.isAdmin) {
    // Admin có layout riêng, không dùng Navbar/KeyboardShortcutHandler của user thường
    return <AdminDashboard />;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <KeyboardShortcutHandler />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route
          path="/register"
          element={user ? <Navigate to="/" /> : <Register />}
        />
        <Route
          path="/forgot-password"
          element={user ? <Navigate to="/" /> : <ForgotPassword />}
        />
        <Route
          path="/create"
          element={user ? <CreateLessonPlan /> : <Navigate to="/login" />}
        />
        <Route
          path="/lesson-plan/:id"
          element={user ? <LessonPlanDetail /> : <Navigate to="/login" />}
        />
        <Route
          path="/my-documents"
          element={user ? <MyDocuments /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile"
          element={user ? <Profile /> : <Navigate to="/login" />}
        />
        <Route
          path="/billing"
          element={user ? <Billing /> : <Navigate to="/login" />}
        />
        <Route path="/help-center" element={<HelpCenter />} />
        <Route path="/release-notes" element={<ReleaseNotes />} />
        <Route path="/terms-policies" element={<TermsPolicies />} />
        <Route path="/keyboard-shortcuts" element={<KeyboardShortcuts />} />
        <Route
          path="/admin"
          element={user ? <AdminDashboard /> : <Navigate to="/login" />}
        />
        <Route path="/activate/:token" element={<ActivateAccount />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
