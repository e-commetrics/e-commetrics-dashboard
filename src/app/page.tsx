import Landing from "@/components/landing";
import JsonLd from "@/site/components/JsonLd";
import { orgJsonLd, faqJsonLd } from "@/site/lib/schema";
import { faq } from "@/site/content/faq";
import { pageMeta } from "@/site/lib/meta";

// "/" is the public site. The dashboard login lives on /login (Nav → "Dashboard").
export const metadata = {
  ...pageMeta({
    title: "Web development that solves real business problems",
    description:
      "Web development firm for entrepreneurs and growing companies: websites, e-commerce and web apps built around your business problem by senior engineers on Pacific time, 30 minutes from San Diego. Free 20-minute diagnosis.",
    path: "/",
  }),
  title: "E-commetrics · Web development that solves real business problems",
};

export default function Page() {
  return (
    <>
      <JsonLd data={[orgJsonLd(), faqJsonLd(faq)]} />
      <Landing />
    </>
  );
}
