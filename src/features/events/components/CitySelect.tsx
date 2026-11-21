import { useEffect } from "react";

import { useI18n } from "@/lib/i18n";

import { useVenues } from "../api";
import { setCity, useCities, useCity } from "../city";

/** "Все города / Алматы / Астана" in the header; filters the home rows and /events. */
export function CitySelect() {
  const { t } = useI18n();
  const city = useCity();
  const venues = useVenues();
  const cities = useCities();

  // A saved city that no venue has any more (renamed, demo data reset) falls back to all.
  useEffect(() => {
    if (venues.isSuccess && city && !cities.includes(city)) setCity("");
  }, [venues.isSuccess, city, cities]);

  return (
    <label className="flex items-center text-sm">
      <span className="sr-only">{t("city.label")}</span>
      <select
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="max-w-[11rem] rounded-[10px] border border-[#8F8C85] bg-white py-1 pl-2 pr-7 text-sm font-medium text-[#1A1A18]"
      >
        <option value="">{t("city.all")}</option>
        {cities.map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
        {/* Keep the saved value selectable while venues load. */}
        {city && !cities.includes(city) && <option value={city}>{city}</option>}
      </select>
    </label>
  );
}
