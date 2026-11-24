import { Link } from "react-router-dom";

import { useAuth } from "@/features/auth";
import { useI18n } from "@/lib/i18n";

const primary =
  "rounded-md bg-[#1A1A18] px-4 py-2 text-sm font-medium text-white hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";
const secondary =
  "rounded-md border border-[#E4E1DA] bg-white px-4 py-2 text-sm font-medium hover:bg-[#F5F4F1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2";

/**
 * The next step on /organizers for whoever reads it (FE-22 #12): a guest registers, a user
 * becomes an organizer in the profile, an organizer creates an event.
 */
export function OrganizersCta() {
  const { t } = useI18n();
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  return (
    <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium sm:flex-1">
        {t(user?.is_organizer ? "organizers.cta.organizer" : user ? "organizers.cta.user" : "organizers.cta.guest")}
      </p>
      <div className="flex shrink-0 flex-wrap gap-2">
        {user?.is_organizer ? (
          <>
            <Link to="/organizer/events/new" className={primary}>
              {t("org.create")}
            </Link>
            <Link to="/organizer" className={secondary}>
              {t("nav.organizer")}
            </Link>
          </>
        ) : user ? (
          <Link to="/account#become-organizer" className={primary}>
            {t("account.becomeOrganizer.title")}
          </Link>
        ) : (
          <>
            <Link to="/register" className={primary}>
              {t("nav.register")}
            </Link>
            <Link to="/login" state={{ from: "/account#become-organizer" }} className={secondary}>
              {t("nav.login")}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
