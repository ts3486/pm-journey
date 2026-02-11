import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { HomePage } from "@/routes/home/HomePage";
import { HistoryPage } from "@/routes/history/HistoryPage";
import { HistoryDetailPage } from "@/routes/history/HistoryDetailPage";
import { SettingsPage } from "@/routes/settings/SettingsPage";
import { ScenarioPage } from "@/routes/scenario/ScenarioPage";
import { AchievementsPage } from "@/routes/achievements/AchievementsPage";
import { ErrorPage } from "@/routes/ErrorPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "history",
        element: <HistoryPage />,
      },
      {
        path: "history/:sessionId",
        element: <HistoryDetailPage />,
      },
      {
        path: "achievements",
        element: <AchievementsPage />,
      },
      {
        path: "scenario",
        element: <ScenarioPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
    ],
  },
]);
