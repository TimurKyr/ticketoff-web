// The one static home banner (brief §7a, Timur chose the promo variant). The demo seed
// (backend, BE-23/24) creates the code for this event; the event is
// found by title because its id differs between the production and local databases.
export const HOME_PROMO = {
  code: "DEMO20",
  percent: 20,
  eventTitle: "Kazakh Symphony Night",
} as const;
