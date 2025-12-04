import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth, AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreateLessonPlan from "./pages/CreateLessonPlan";
import LessonPlanDetail from "./pages/LessonPlanDetail";
import MyDocuments from "./pages/MyDocuments";
import Profile from "./pages/Profile";
import Billing from "./pages/Billing";
import ActivateAccount from "./pages/ActivateAccount";
import AuthCallback from "./pages/AuthCallback";

function AppContent() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route
          path="/register"
          element={user ? <Navigate to="/" /> : <Register />}
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
