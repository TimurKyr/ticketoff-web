import { describe, expect, it } from "vitest";

import type { CampaignOut, TicketTypeOut } from "@/lib/api/types";

import { campaignTypesText } from "./campaignTypes";

const type = (id: string, name: string) => ({ id, name }) as TicketTypeOut;
const campaign = (ids: string[]) => ({ ticket_type_ids: ids }) as CampaignOut;
const TYPES = [type("a", "VIP"), type("b", "Standard"), type("c", "Student")];

describe("campaignTypesText", () => {
  it("says all types for an empty list", () => {
    expect(campaignTypesText(campaign([]), TYPES, "Все типы")).toBe("Все типы");
  });

  it("names the chosen types in the event's order", () => {
    expect(campaignTypesText(campaign(["c", "a"]), TYPES, "Все типы")).toBe("VIP, Student");
  });

  it("shows a dash when every chosen type is gone", () => {
    expect(campaignTypesText(campaign(["zzz"]), TYPES, "Все типы")).toBe("—");
  });
});
