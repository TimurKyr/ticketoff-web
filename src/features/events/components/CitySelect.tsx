import { Check, ChevronDown, MapPin } from "lucide-react";
import { useEffect } from "react";

import { useMenu } from "@/components/ui/useMenu";
import { useI18n } from "@/lib/i18n";

import { useVenues } from "../api";
import { setCity, useCities, useCity } from "../city";

/**
 * "Все города / Алматы / Астана" in the header; filters the home rows and /events.
 * `inline`: the list opens in the page flow instead of floating, for the mobile menu, whose
 * scrolling panel would clip a floating list (FE-22 #2: «Астана» could not be reached).
 */
export function CitySelect({ className = "", inline = false }: { className?: string; inline?: boolean }) {
  const { t } = useI18n();
  const city = useCity();
  const venues = useVenues();
  const cities = useCities();
  const menu = useMenu();

  // A saved city that no venue has any more (renamed, demo data reset) falls back to all.
  useEffect(() => {
    if (venues.isSuccess && city && !cities.includes(city)) setCity("");
  }, [venues.isSuccess, city, cities]);

  // Keep the saved value listed while venues load.
  const options = ["", ...cities, ...(city && !cities.includes(city) ? [city] : [])];

  function choose(value: string) {
    setCity(value);
    menu.close(true);
  }

  return (
    <div className={`${inline ? "min-w-0 flex-1" : "relative"} ${className}`}>
      <button
        {...menu.buttonProps}
        aria-label={`${t("city.label")}: ${city || t("city.all")}`}
        data-testid="city-menu-button"
        className="flex h-10 max-w-[12rem] items-center gap-1.5 rounded-full px-3 text-sm font-medium text-[#1A1A18] hover:bg-[#F2F1EE] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1A1A18]"
      >
        <MapPin aria-hidden="true" className="h-4 w-4 shrink-0" />
        <span className="truncate">{city || t("city.all")}</span>
        <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-[#5C5A55]" />
      </button>
      {menu.open && (
        <div
          {...menu.menuProps}
          aria-label={t("city.label")}
          className={
            inline
              ? "mt-2 w-full max-w-xs rounded-xl border border-[#E4E1DA] bg-white p-1"
              : "absolute left-0 z-50 mt-2 max-h-80 w-56 overflow-auto rounded-xl border border-[#E4E1DA] bg-white p-1 shadow-lg"
          }
        >
          {options.map((value) => (
            <button
              key={value || "all"}
              type="button"
              role="menuitemradio"
              aria-checked={value === city}
              tabIndex={-1}
              onClick={() => choose(value)}
              className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#1A1A18] hover:bg-[#F2F1EE] focus:bg-[#F2F1EE] focus:outline-none"
            >
              <span>{value || t("city.all")}</span>
              {value === city && <Check aria-hidden="true" className="h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
