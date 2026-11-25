import { createBrowserRouter } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";
import { NotFoundPage } from "@/components/layout/NotFoundPage";
import { EventDetailsPage, EventsListPage } from "@/features/events";
import { HomePage } from "@/features/home";
import { MyTicketsPage, OrderPage } from "@/features/tickets";
import {
  CreateEventPage,
  EventPreviewPage,
  ManageEventPage,
  OrganizerDashboardPage,
} from "@/features/organizer";
import { AttendeeDashboardPage } from "@/features/attendee";
import { AdminDashboardPage } from "@/features/admin";
import { CasePage, InboxPage, MyCasesPage } from "@/features/support";
import { AboutPage, HelpPage, OrganizersPage, RefundPolicyPage } from "@/features/static";
import {
  AccountPage,
  GuestOnly,
  LoginPage,
  RegisterPage,
  RequireAuth,
  RequireRole,
  VerifyEmailPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from "@/features/auth";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: "events", element: <EventsListPage /> },
      { path: "events/:key", element: <EventDetailsPage /> },
      { path: "login", element: <GuestOnly><LoginPage /></GuestOnly> },
      { path: "register", element: <GuestOnly redirectTo="/account"><RegisterPage /></GuestOnly> },
      { path: "verify-email", element: <VerifyEmailPage /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "reset-password", element: <ResetPasswordPage /> },
      { path: "account", element: <RequireAuth><AccountPage /></RequireAuth> },
      { path: "tickets", element: <RequireAuth><MyTicketsPage /></RequireAuth> },
      { path: "orders/:orderId", element: <RequireAuth><OrderPage /></RequireAuth> },
      { path: "attendee", element: <RequireAuth><AttendeeDashboardPage /></RequireAuth> },
      { path: "support", element: <RequireAuth><MyCasesPage /></RequireAuth> },
      { path: "support/cases/:caseId", element: <RequireAuth><CasePage /></RequireAuth> },
      {
        path: "support/inbox",
        element: <RequireRole role={["organizer", "platform_admin"]}><InboxPage /></RequireRole>,
      },
      {
        path: "organizer",
        element: <RequireRole role="organizer"><OrganizerDashboardPage /></RequireRole>,
      },
      {
        path: "organizer/events/new",
        element: <RequireRole role="organizer"><CreateEventPage /></RequireRole>,
      },
      {
        path: "organizer/events/:eventId",
        element: <RequireRole role="organizer"><ManageEventPage /></RequireRole>,
      },
      {
        path: "organizer/events/:eventId/preview",
        element: <RequireRole role="organizer"><EventPreviewPage /></RequireRole>,
      },
      {
        path: "admin",
        element: <RequireRole role="platform_admin"><AdminDashboardPage /></RequireRole>,
      },
      { path: "about", element: <AboutPage /> },
      { path: "organizers", element: <OrganizersPage /> },
      { path: "help", element: <HelpPage /> },
      { path: "refund-policy", element: <RefundPolicyPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
