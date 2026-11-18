import { createBrowserRouter } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";
import { NotFoundPage } from "@/components/layout/NotFoundPage";
import { EventDetailsPage, EventsListPage } from "@/features/events";
import { MyTicketsPage, OrderPage } from "@/features/tickets";
import { CreateEventPage, ManageEventPage, OrganizerDashboardPage } from "@/features/organizer";
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
      { path: "events/:eventId", element: <EventDetailsPage /> },
      { path: "login", element: <GuestOnly><LoginPage /></GuestOnly> },
      { path: "register", element: <GuestOnly redirectTo="/account"><RegisterPage /></GuestOnly> },
      { path: "account", element: <RequireAuth><AccountPage /></RequireAuth> },
      { path: "tickets", element: <RequireAuth><MyTicketsPage /></RequireAuth> },
      { path: "orders/:orderId", element: <RequireAuth><OrderPage /></RequireAuth> },
      { path: "attendee", element: <RequireAuth><AttendeeDashboardPage /></RequireAuth> },
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
        path: "admin",
        element: <RequireRole role="platform_admin"><AdminDashboardPage /></RequireRole>,
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
