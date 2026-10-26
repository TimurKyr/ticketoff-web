// TODO (Frontend): replace/merge with generated schema types once the
// backend's /openapi.json defines the User / auth shapes.

export type UserRole = "attendee" | "organizer" | "admin";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}
