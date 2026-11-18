// Short names for generated schema types. Add aliases here as features need them.
import type { components } from "./schema";

type Schemas = components["schemas"];

export type MeOut = Schemas["MeOut"];
export type UserOut = Schemas["UserOut"];
export type UserRegister = Schemas["UserRegister"];
export type TokenOut = Schemas["TokenOut"];
export type SystemRole = Schemas["SystemRole"];
export type OrganizerProfileIn = Schemas["OrganizerProfileIn"];
export type OrganizerProfileOut = Schemas["OrganizerProfileOut"];
export type LoginForm = Schemas["Body_login_auth_login_post"];

export type EventOut = Schemas["EventOut"];
export type EventPage = Schemas["EventPage"];
export type VenueOut = Schemas["VenueOut"];
export type PublicTicketTypeOut = Schemas["PublicTicketTypeOut"];
export type RegistrationCreate = Schemas["RegistrationCreate"];
export type AttendeeIn = Schemas["AttendeeIn"];
export type OrderOut = Schemas["OrderOut"];
export type OrderStatus = Schemas["OrderStatus"];
export type TicketOut = Schemas["TicketOut"];
export type TicketStatus = Schemas["TicketStatus"];

export type EventCreate = Schemas["EventCreate"];
export type EventUpdate = Schemas["EventUpdate"];
export type EventStatus = Schemas["EventStatus"];
export type EventVisibility = Schemas["EventVisibility"];
export type EventBucket = Schemas["EventBucket"];
export type TicketKind = Schemas["TicketKind"];
export type TicketTypeOut = Schemas["TicketTypeOut"];
export type TicketTypeCreate = Schemas["TicketTypeCreate"];
export type TicketTypeUpdate = Schemas["TicketTypeUpdate"];
export type EventInventoryOut = Schemas["EventInventoryOut"];
export type ActivationChecklistOut = Schemas["ActivationChecklistOut"];
