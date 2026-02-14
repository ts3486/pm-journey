import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "@/layouts/AppLayout";
import { HomePage } from "@/routes/home/HomePage";
import { HistoryPage } from "@/routes/history/HistoryPage";
import { HistoryDetailPage } from "@/routes/history/HistoryDetailPage";
import { SettingsPage } from "@/routes/settings/SettingsPage";
import { AccountSettingsPage } from "@/routes/settings/AccountSettingsPage";
import { BillingSettingsPage } from "@/routes/settings/BillingSettingsPage";
import { TeamManagementPage } from "@/routes/settings/TeamManagementPage";
import { TeamMemberCompletedSessionsPage } from "@/routes/settings/TeamMemberCompletedSessionsPage";
import { ScenarioPage } from "@/routes/scenario/ScenarioPage";
import { AchievementsPage } from "@/routes/achievements/AchievementsPage";
import { PricingPage } from "@/routes/pricing/PricingPage";
import { TeamOnboardingPage } from "@/routes/team/TeamOnboardingPage";
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
      {
        path: "settings/account",
        element: <AccountSettingsPage />,
      },
      {
        path: "settings/billing",
        element: <BillingSettingsPage />,
      },
      {
        path: "settings/team",
        element: <TeamManagementPage />,
      },
      {
        path: "settings/team/members/:memberId/completed",
        element: <TeamMemberCompletedSessionsPage />,
      },
      {
        path: "pricing",
        element: <PricingPage />,
      },
      {
        path: "team/onboarding",
        element: <TeamOnboardingPage />,
      },
    ],
  },
]);
