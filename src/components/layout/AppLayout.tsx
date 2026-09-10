import { Outlet, Link } from "react-router-dom";

// TODO (Frontend): swap this placeholder nav for real role-aware
// navigation once auth + role guards land.
export function AppLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-4 py-3 flex items-center gap-4">
        <Link to="/" className="font-semibold">
          ticketoff
        </Link>
        <nav className="flex gap-3 text-sm text-gray-600">
          <Link to="/events">Events</Link>
          <Link to="/organizer">Organizer</Link>
          <Link to="/admin">Admin</Link>
        </nav>
      </header>
      <main className="flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
