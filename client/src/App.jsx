import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AppShell from "./layouts/AppShell";
import ProtectedRoute from "./routes/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminCoursesPage from "./pages/admin/AdminCoursesPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminLiveClassesPage from "./pages/admin/AdminLiveClassesPage";
import AdminQuestionsPage from "./pages/admin/AdminQuestionsPage";
import AdminReviewsPage from "./pages/admin/AdminReviewsPage";
import InstructorDashboardPage from "./pages/instructor/InstructorDashboardPage";
import InstructorLiveClassesPage from "./pages/instructor/InstructorLiveClassesPage";
import InstructorCourseResourcesPage from "./pages/instructor/InstructorCourseResourcesPage";
import InstructorQuestionsPage from "./pages/instructor/InstructorQuestionsPage";
import LearnerDashboardPage from "./pages/learner/LearnerDashboardPage";
import CourseViewerPage from "./pages/learner/CourseViewerPage";
import LiveRoomPage from "./pages/shared/LiveRoomPage";
import NotFoundPage from "./pages/shared/NotFoundPage";

const HomeRedirect = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/${user.role}`} replace />;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/live/:roomId"
        element={
          <ProtectedRoute roles={["admin", "instructor", "learner"]}>
            <LiveRoomPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={["admin"]}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="courses" element={<AdminCoursesPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="live-classes" element={<AdminLiveClassesPage />} />
        <Route path="questions" element={<AdminQuestionsPage />} />
        <Route path="reviews" element={<AdminReviewsPage />} />
      </Route>

      <Route
        path="/instructor"
        element={
          <ProtectedRoute roles={["instructor"]}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<InstructorDashboardPage />} />
        <Route path="resources" element={<InstructorCourseResourcesPage />} />
        <Route path="live-classes" element={<InstructorLiveClassesPage />} />
        <Route path="questions" element={<InstructorQuestionsPage />} />
      </Route>

      <Route
        path="/learner"
        element={
          <ProtectedRoute roles={["learner"]}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<LearnerDashboardPage />} />
        <Route path="courses/:enrollmentId" element={<CourseViewerPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
