import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AppShell from "./layouts/AppShell";
import ProtectedRoute from "./routes/ProtectedRoute";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminBatchesPage from "./pages/admin/AdminBatchesPage";
import AdminMigrationRequestsPage from "./pages/admin/AdminMigrationRequestsPage";
import AdminCoursesPage from "./pages/admin/AdminCoursesPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminLiveClassesPage from "./pages/admin/AdminLiveClassesPage";
import AdminQuestionsPage from "./pages/admin/AdminQuestionsPage";
import AdminReviewsPage from "./pages/admin/AdminReviewsPage";
import AdminAnnouncementsPage from "./pages/admin/AdminAnnouncementsPage";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";
import AdminInstructorPage from "./pages/admin/AdminInstructorPage";
import QuestionBankPage from "./pages/shared/QuestionBankPage";
import MockTestsPage from "./pages/shared/MockTestsPage";
import DoubtVaultManagePage from "./pages/shared/DoubtVaultManagePage";
import AttendanceMarkPage from "./pages/shared/AttendanceMarkPage";
import AttendanceViewPage from "./pages/shared/AttendanceViewPage";
import NotificationsPage from "./pages/shared/NotificationsPage";
import ParentTeacherChatPage from "./pages/shared/ParentTeacherChatPage";
import SecurityAuditPage from "./pages/shared/SecurityAuditPage";
import InstructorDashboardPage from "./pages/instructor/InstructorDashboardPage";
import InstructorBatchesPage from "./pages/instructor/InstructorBatchesPage";
import InstructorMigrationRequestsPage from "./pages/instructor/InstructorMigrationRequestsPage";
import InstructorLiveClassesPage from "./pages/instructor/InstructorLiveClassesPage";
import InstructorCourseResourcesPage from "./pages/instructor/InstructorCourseResourcesPage";
import InstructorQuestionsPage from "./pages/instructor/InstructorQuestionsPage";
import LearnerDashboardPage from "./pages/learner/LearnerDashboardPage";
import LearnerBatchesPage from "./pages/learner/LearnerBatchesPage";
import CourseViewerPage from "./pages/learner/CourseViewerPage";
import ExamCrackerPage from "./pages/learner/ExamCrackerPage";
import ExamLeaderboardsPage from "./pages/learner/ExamLeaderboardsPage";
import ExamAttemptPage from "./pages/learner/ExamAttemptPage";
import ExamResultPage from "./pages/learner/ExamResultPage";
import ExamLeaderboardPage from "./pages/learner/ExamLeaderboardPage";
import LearnerDoubtVaultPage from "./pages/learner/LearnerDoubtVaultPage";
import LearnerMyCoursesPage from "./pages/learner/LearnerMyCoursesPage";
import LearnerStudyMaterialsPage from "./pages/learner/LearnerStudyMaterialsPage";
import ParentDashboardPage from "./pages/parent/ParentDashboardPage";
import ParentReportsPage from "./pages/parent/ParentReportsPage";
import ParentBatchesPage from "./pages/parent/ParentBatchesPage";
import ParentExamPage from "./pages/parent/ParentExamPage";
import ParentLeaderboardsPage from "./pages/parent/ParentLeaderboardsPage";
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
        <Route path="analytics" element={<AdminAnalyticsPage />} />
        <Route path="batches" element={<AdminBatchesPage />} />
        <Route path="migrations" element={<AdminMigrationRequestsPage />} />
        <Route path="exam/questions" element={<QuestionBankPage />} />
        <Route path="exam/tests" element={<MockTestsPage />} />
        <Route path="exam/leaderboards" element={<ExamLeaderboardsPage basePath="/admin/exam" />} />
        <Route path="exam/tests/:testId/leaderboard" element={<ExamLeaderboardPage />} />
        <Route path="doubts" element={<DoubtVaultManagePage />} />
        <Route path="attendance" element={<AttendanceMarkPage />} />
        <Route path="chat" element={<ParentTeacherChatPage />} />
        <Route path="security" element={<SecurityAuditPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="courses" element={<AdminCoursesPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="instructor" element={<AdminInstructorPage />} />
        <Route path="live-classes" element={<AdminLiveClassesPage />} />
        <Route path="questions" element={<AdminQuestionsPage />} />
        <Route path="reviews" element={<AdminReviewsPage />} />
        <Route path="announcements" element={<AdminAnnouncementsPage />} />
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
        <Route path="batches" element={<InstructorBatchesPage />} />
        <Route path="migrations" element={<InstructorMigrationRequestsPage />} />
        <Route path="exam/questions" element={<QuestionBankPage />} />
        <Route path="exam/tests" element={<MockTestsPage />} />
        <Route path="exam/leaderboards" element={<ExamLeaderboardsPage basePath="/instructor/exam" />} />
        <Route path="exam/tests/:testId/leaderboard" element={<ExamLeaderboardPage />} />
        <Route path="doubts" element={<DoubtVaultManagePage />} />
        <Route path="attendance" element={<AttendanceMarkPage />} />
        <Route path="chat" element={<ParentTeacherChatPage />} />
        <Route path="security" element={<SecurityAuditPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
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
        <Route path="batches" element={<LearnerBatchesPage />} />
        <Route path="exam" element={<ExamCrackerPage />} />
        <Route path="exam/leaderboards" element={<ExamLeaderboardsPage />} />
        <Route path="exam/tests/:testId" element={<ExamAttemptPage />} />
        <Route path="exam/results/:attemptId" element={<ExamResultPage />} />
        <Route path="exam/tests/:testId/leaderboard" element={<ExamLeaderboardPage />} />
        <Route path="courses" element={<LearnerMyCoursesPage />} />
        <Route path="study-materials" element={<LearnerStudyMaterialsPage />} />
        <Route path="doubts" element={<LearnerDoubtVaultPage />} />
        <Route path="attendance" element={<AttendanceViewPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="courses/:enrollmentId" element={<CourseViewerPage />} />
      </Route>

      <Route
        path="/parent"
        element={
          <ProtectedRoute roles={["parent"]}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<ParentDashboardPage />} />
        <Route path="reports" element={<ParentReportsPage />} />
        <Route path="batches" element={<ParentBatchesPage />} />
        <Route path="exam" element={<ParentExamPage />} />
        <Route path="exam/leaderboards" element={<ParentLeaderboardsPage />} />
        <Route path="exam/tests/:testId/leaderboard" element={<ExamLeaderboardPage />} />
        <Route path="attendance" element={<AttendanceViewPage />} />
        <Route path="chat" element={<ParentTeacherChatPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
