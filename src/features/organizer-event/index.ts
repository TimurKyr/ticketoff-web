// Light exports for the organizer pages. The tabs themselves (orders, analytics, history,
// staff) are imported lazily by ManageEventPage from their own modules.
export { EventTabs, type TabSpec } from "./components/EventTabs";
export { isEventOver } from "./readOnly";
export { OverviewCards } from "./dashboard/OverviewCards";
export { EventHistoryList } from "./dashboard/EventHistoryList";
export { useOrganizerOverview } from "./api";
