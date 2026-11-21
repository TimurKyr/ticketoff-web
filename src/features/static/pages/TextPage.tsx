import { useI18n } from "@/lib/i18n";

import { STATIC_TEXTS, type StaticTexts } from "../content";
import { StaticPage, StaticSection } from "../components/StaticPage";

type TextKey = "about" | "organizers" | "refund";

function TextPage({ page }: { page: TextKey }) {
  const { lang } = useI18n();
  const text: StaticTexts[TextKey] = STATIC_TEXTS[lang][page];
  return (
    <StaticPage title={text.title} lead={text.lead}>
      {text.sections.map((section) => (
        <StaticSection key={section.title} section={section} />
      ))}
    </StaticPage>
  );
}

export const AboutPage = () => <TextPage page="about" />;
export const OrganizersPage = () => <TextPage page="organizers" />;
export const RefundPolicyPage = () => <TextPage page="refund" />;
