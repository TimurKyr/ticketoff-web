import type { CampaignOut, TicketTypeOut } from "@/lib/api/types";

/** "Все типы", or the names of the campaign's ticket types (in the event's order). */
export function campaignTypesText(
  campaign: CampaignOut,
  types: TicketTypeOut[],
  allTypesText: string
): string {
  if (campaign.ticket_type_ids.length === 0) return allTypesText;
  const chosen = new Set(campaign.ticket_type_ids);
  const names = types.filter((type) => chosen.has(type.id)).map((type) => type.name);
  // A type deleted since keeps the campaign limited; only the known names are listed.
  return names.length > 0 ? names.join(", ") : "—";
}
