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
export type Availability = Schemas["Availability"];
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

// FE-6: checkout and payment
export type CheckoutCreate = Schemas["CheckoutCreate"];
export type PayOrderIn = Schemas["PayOrderIn"];
export type PaymentResultOut = Schemas["PaymentResultOut"];
export type PromoCheckOut = Schemas["PromoCheckOut"];
export type PromoQrOut = Schemas["PromoQrOut"];

// FE-8: promo campaigns and codes (organizer side)
export type DiscountType = Schemas["DiscountType"];
export type CampaignCreate = Schemas["CampaignCreate"];
export type CampaignOut = Schemas["CampaignOut"];
export type CodeCreate = Schemas["CodeCreate"];
export type CodeOut = Schemas["CodeOut"];
export type CodeUpdate = Schemas["CodeUpdate"];
export type PromoCodeStatus = Schemas["PromoCodeStatus"];

// FE-8: support cases
export type SupportKind = Schemas["SupportKind"];
export type SupportCategory = Schemas["SupportCategory"];
export type SupportStatus = Schemas["SupportStatus"];
export type CaseCreate = Schemas["CaseCreate"];
export type CaseOut = Schemas["CaseOut"];
export type CaseDetailOut = Schemas["CaseDetailOut"];
export type CasePage = Schemas["CasePage"];
export type MessageCreate = Schemas["MessageCreate"];
export type MessageOut = Schemas["MessageOut"];
export type SupportStatusUpdate = Schemas["StatusUpdate"];

// FE-7: organizer analytics, event orders, staff, timeline, payment summary
export type OverviewOut = Schemas["OverviewOut"];
export type SalesFigures = Schemas["SalesFigures"];
export type EventCounts = Schemas["EventCounts"];
export type EventHistoryPage = Schemas["EventHistoryPage"];
export type EventStatsOut = Schemas["EventStatsOut"];
export type EventAnalyticsOut = Schemas["EventAnalyticsOut"];
export type TicketTypeStatsOut = Schemas["TicketTypeStatsOut"];
export type DailySalesOut = Schemas["DailySalesOut"];
export type CampaignStatsOut = Schemas["CampaignStatsOut"];
export type EventOrderPage = Schemas["EventOrderPage"];
export type EventOrderOut = Schemas["EventOrderOut"];
export type EventOrderGuestOut = Schemas["EventOrderGuestOut"];
export type CheckinStatsOut = Schemas["StatsOut"];
export type StaffOut = Schemas["StaffOut"];
export type StaffIn = Schemas["StaffIn"];
export type TimelinePage = Schemas["TimelinePage"];
export type TimelineItemOut = Schemas["TimelineItemOut"];
export type PaymentSummaryOut = Schemas["PaymentSummaryOut"];
export type RefundIn = Schemas["RefundIn"];
export type RefundResultOut = Schemas["RefundResultOut"];
