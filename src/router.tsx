import { createBrowserRouter } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";
import { EventsListPage } from "@/features/events";
import { MyTicketsPage } from "@/features/tickets";
import { OrganizerDashboardPage } from "@/features/organizer";
import { AttendeeDashboardPage } from "@/features/attendee";
import { AdminDashboardPage } from "@/features/admin";
import { LoginPage } from "@/features/auth";

// TODO (Frontend): add role-based route guards (organizer/attendee/admin)
// once auth state is wired up, e.g. wrap organizer/admin routes in a
// <RequireRole role="organizer"> element.
export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <EventsListPage /> },
      { path: "events", element: <EventsListPage /> },
      { path: "tickets", element: <MyTicketsPage /> },
      { path: "organizer", element: <OrganizerDashboardPage /> },
      { path: "attendee", element: <AttendeeDashboardPage /> },
      { path: "admin", element: <AdminDashboardPage /> },
      { path: "login", element: <LoginPage /> },
    ],
  },
]);
