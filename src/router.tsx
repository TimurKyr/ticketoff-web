import { createBrowserRouter } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";
import { NotFoundPage } from "@/components/layout/NotFoundPage";
import { EventsListPage } from "@/features/events";
import { MyTicketsPage } from "@/features/tickets";
import { OrganizerDashboardPage } from "@/features/organizer";
import { AttendeeDashboardPage } from "@/features/attendee";
import { AdminDashboardPage } from "@/features/admin";
import {
  AccountPage,
  GuestOnly,
  LoginPage,
  RegisterPage,
  RequireAuth,
  RequireRole,
} from "@/features/auth";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <EventsListPage /> },
      { path: "events", element: <EventsListPage /> },
      { path: "login", element: <GuestOnly><LoginPage /></GuestOnly> },
      { path: "register", element: <GuestOnly redirectTo="/account"><RegisterPage /></GuestOnly> },
      { path: "account", element: <RequireAuth><AccountPage /></RequireAuth> },
      { path: "tickets", element: <RequireAuth><MyTicketsPage /></RequireAuth> },
      { path: "attendee", element: <RequireAuth><AttendeeDashboardPage /></RequireAuth> },
      {
        path: "organizer",
        element: <RequireRole role="organizer"><OrganizerDashboardPage /></RequireRole>,
      },
      {
        path: "admin",
        element: <RequireRole role="platform_admin"><AdminDashboardPage /></RequireRole>,
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
