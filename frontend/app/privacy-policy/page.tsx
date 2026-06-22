import type { Metadata } from "next";
import Link from "next/link";
import { LandingNav }    from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";

export const metadata: Metadata = {
  title: "Privacy Policy — Naviora by Blue Stratum",
  description:
    "How Blue Stratum Ltd collects, uses, and protects your personal data in connection with the Naviora platform.",
};

const LAST_UPDATED = "22 June 2026";
const EFFECTIVE    = "22 June 2026";

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="text-2xl font-bold text-white mt-12 mb-4 scroll-mt-24">
      {children}
    </h2>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-white mt-6 mb-2">{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed mb-3" style={{ color: "#94a3b8" }}>{children}</p>;
}

function UL({ children }: { children: React.ReactNode }) {
  return <ul className="space-y-1.5 mb-4 ml-4">{children}</ul>;
}

function LI({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm" style={{ color: "#94a3b8" }}>
      <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#D4A63A" }} />
      <span>{children}</span>
    </li>
  );
}

function Table({ rows }: { rows: [string, string, string][] }) {
  return (
    <div className="overflow-x-auto mb-6">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            {["Purpose", "Legal Basis (GDPR Art. 6)", "Retention"].map((h) => (
              <th key={h} className="text-left py-2 px-3 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "#D4A63A" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([purpose, basis, retention], i) => (
            <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <td className="py-2.5 px-3" style={{ color: "#cbd5e1" }}>{purpose}</td>
              <td className="py-2.5 px-3" style={{ color: "#94a3b8" }}>{basis}</td>
              <td className="py-2.5 px-3 whitespace-nowrap" style={{ color: "#94a3b8" }}>{retention}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TOC = [
  { id: "controller",      label: "1. Who we are" },
  { id: "data-collected",  label: "2. Data we collect" },
  { id: "purposes",        label: "3. How we use your data" },
  { id: "sharing",         label: "4. Who we share data with" },
  { id: "transfers",       label: "5. International transfers" },
  { id: "retention",       label: "6. Retention periods" },
  { id: "rights",          label: "7. Your rights" },
  { id: "cookies",         label: "8. Cookies" },
  { id: "children",        label: "9. Children" },
  { id: "changes",         label: "10. Changes to this policy" },
  { id: "contact",         label: "11. Contact & DPO" },
];

export default function PrivacyPolicyPage() {
  return (
    <div style={{ background: "#0B0B0F" }}>
      <LandingNav />

      {/* Hero */}
      <div
        className="relative pt-32 pb-16 px-6 text-center overflow-hidden"
        style={{ background: "linear-gradient(180deg,#141821 0%,#0B0B0F 100%)" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(212,166,58,0.07) 0%, transparent 65%)" }}
        />
        <div className="relative max-w-3xl mx-auto">
          <div
            className="inline-block text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-5"
            style={{ color: "#D4A63A", background: "rgba(212,166,58,0.1)", border: "1px solid rgba(212,166,58,0.2)" }}
          >
            Legal
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-base" style={{ color: "#64748b" }}>
            Last updated: <strong className="text-white">{LAST_UPDATED}</strong>
            &ensp;&middot;&ensp;
            Effective: <strong className="text-white">{EFFECTIVE}</strong>
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:flex gap-16 items-start">

        {/* Sidebar TOC */}
        <aside className="hidden lg:block w-64 shrink-0 sticky top-24">
          <div
            className="rounded-xl p-5 border"
            style={{ background: "#141821", borderColor: "rgba(255,255,255,0.07)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "#D4A63A" }}>
              Contents
            </p>
            <nav className="space-y-1">
              {TOC.map(({ id, label }) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="block text-xs py-1.5 px-2 rounded transition-colors hover:text-white hover:bg-white/5"
                  style={{ color: "#64748b" }}
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 max-w-3xl">

          {/* Intro */}
          <P>
            This Privacy Policy explains how <strong className="text-white">Blue Stratum Ltd</strong>
            {" "}("Blue Stratum", "we", "us", "our") collects, uses, stores, and shares your
            personal data when you use the Naviora platform and visit our website
            (collectively, the "Services"). It applies to all users including platform
            administrators, organization managers, and maritime training candidates.
          </P>
          <P>
            We are committed to processing your personal data in accordance with the{" "}
            <strong className="text-white">UK General Data Protection Regulation (UK GDPR)</strong>,
            the UK Data Protection Act 2018, and where applicable the EU GDPR. Please
            read this policy carefully. By using our Services you acknowledge you have read it.
          </P>

          {/* 1 */}
          <H2 id="controller">1. Who we are</H2>
          <P>
            Blue Stratum Ltd is the <strong className="text-white">data controller</strong> for
            personal data processed through the Naviora platform.
          </P>
          <div
            className="rounded-xl p-5 border mb-6"
            style={{ background: "#141821", borderColor: "rgba(255,255,255,0.07)" }}
          >
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              {[
                ["Company name",     "Blue Stratum Ltd"],
                ["Registered in",    "England & Wales"],
                ["ICO Registration", "Pending"],
                ["Data Protection contact", "privacy@bluestratum.com"],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-xs uppercase tracking-wider mb-0.5" style={{ color: "#475569" }}>{k}</div>
                  <div style={{ color: "#cbd5e1" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          <P>
            Where an organization subscribes to Naviora and administers candidates under their
            account, that organization acts as an additional data controller (or processor,
            depending on the relationship) for data relating to their candidates. A separate
            Data Processing Agreement (DPA) is available upon request.
          </P>

          {/* 2 */}
          <H2 id="data-collected">2. Data we collect</H2>

          <H3>2.1 Data you provide directly</H3>
          <UL>
            <LI><strong className="text-white">Account data:</strong> name, work email address, job title, organization name.</LI>
            <LI><strong className="text-white">Contact / demo requests:</strong> name, work email, organization, role, message, and your GDPR consent timestamps.</LI>
            <LI><strong className="text-white">Candidate profiles:</strong> name, seafarer ID, nationality, qualifications, certificate numbers.</LI>
            <LI><strong className="text-white">Assessment records:</strong> session dates, scores, evaluator notes, competency ratings, simulator performance data.</LI>
            <LI><strong className="text-white">Certificates:</strong> digital certificate metadata including issue date, expiry, and issuing authority.</LI>
          </UL>

          <H3>2.2 Data collected automatically</H3>
          <UL>
            <LI><strong className="text-white">Usage data:</strong> pages visited, features used, session duration, button clicks.</LI>
            <LI><strong className="text-white">Technical data:</strong> IP address, browser type and version, operating system, time zone, referring URL.</LI>
            <LI><strong className="text-white">Log data:</strong> server access logs, error logs, API request logs (retained for security and debugging).</LI>
          </UL>

          <H3>2.3 Data from third parties</H3>
          <UL>
            <LI>Simulator performance data received via direct simulator integrations (Kongsberg, Wärtsilä/Transas, etc.) during assessment sessions.</LI>
            <LI>Single sign-on (SSO/SAML) identity data from your organization's identity provider where configured.</LI>
          </UL>

          {/* 3 */}
          <H2 id="purposes">3. How we use your data</H2>
          <P>We only process your data for specific, documented purposes with a valid legal basis.</P>
          <Table rows={[
            ["Respond to demo / contact requests",          "Art. 6(1)(a) — Consent",                  "Until withdrawn or 2 years after last contact"],
            ["Provide and maintain the platform",           "Art. 6(1)(b) — Contract performance",    "Duration of contract + 30 days"],
            ["Conduct and record assessments",             "Art. 6(1)(b) — Contract performance",    "7 years (regulatory compliance)"],
            ["Issue and verify digital certificates",      "Art. 6(1)(c) — Legal obligation",         "10 years"],
            ["Platform security and fraud prevention",     "Art. 6(1)(f) — Legitimate interests",     "90 days (logs) / ongoing (security data)"],
            ["Product analytics and improvement",          "Art. 6(1)(f) — Legitimate interests",     "25 months (anonymised after 90 days)"],
            ["Marketing communications (with consent)",    "Art. 6(1)(a) — Consent",                  "Until consent withdrawn"],
            ["Legal compliance and regulatory reporting",  "Art. 6(1)(c) — Legal obligation",         "As required by applicable law"],
          ]} />
          <P>
            We will not use your data for automated decision-making or profiling that produces
            legal or similarly significant effects without your explicit consent.
          </P>

          {/* 4 */}
          <H2 id="sharing">4. Who we share data with</H2>
          <P>We do not sell your personal data. We share it only in the following circumstances:</P>
          <UL>
            <LI>
              <strong className="text-white">Infrastructure providers:</strong> hosting, database, and storage services
              (currently Replit Inc., subject to a DPA) processing data on our behalf.
            </LI>
            <LI>
              <strong className="text-white">Email service providers:</strong> transactional email delivery (e.g. for
              account notifications and certificate issuance), under a DPA.
            </LI>
            <LI>
              <strong className="text-white">Your organization:</strong> where you are a candidate, your assessment
              results, competency records, and certificates are accessible to your organization's
              administrators within the platform.
            </LI>
            <LI>
              <strong className="text-white">Flag state / regulatory authorities:</strong> where legally required and at
              the direction of the subscribing organization (e.g. certificate verification).
            </LI>
            <LI>
              <strong className="text-white">Legal / law enforcement:</strong> where required by applicable law, court order,
              or to protect the rights and safety of our users.
            </LI>
            <LI>
              <strong className="text-white">Business transfers:</strong> in connection with a merger, acquisition, or sale
              of all or substantially all of our assets, subject to standard confidentiality obligations.
            </LI>
          </UL>

          {/* 5 */}
          <H2 id="transfers">5. International transfers</H2>
          <P>
            Our primary data processing takes place within the <strong className="text-white">UK and the European Economic Area (EEA)</strong>.
            Where data is transferred outside the UK/EEA (for example, to infrastructure providers
            with US-based data centres), we rely on:
          </P>
          <UL>
            <LI>UK adequacy regulations for transfers to countries with an adequacy decision.</LI>
            <LI>UK International Data Transfer Agreements (IDTAs) or EU Standard Contractual Clauses (SCCs) with appropriate supplementary measures.</LI>
          </UL>
          <P>
            A copy of the applicable transfer mechanism can be requested by emailing{" "}
            <a href="mailto:privacy@bluestratum.com" className="underline hover:text-white transition-colors" style={{ color: "#D4A63A" }}>
              privacy@bluestratum.com
            </a>.
          </P>

          {/* 6 */}
          <H2 id="retention">6. Retention periods</H2>
          <P>
            We retain personal data for no longer than is necessary for the purposes for
            which it was collected. The specific periods are shown in the table in Section 3.
            Where legal obligations require us to retain data for a defined period (e.g. maritime
            certification records for 10 years), we apply that period. After expiry, data is
            securely deleted or anonymised.
          </P>
          <P>
            If you withdraw consent for demo / marketing purposes, we will stop processing within
            14 days and delete the relevant data within 30 days unless retention is required by law.
          </P>

          {/* 7 */}
          <H2 id="rights">7. Your rights</H2>
          <P>Under UK/EU GDPR you have the following rights regarding your personal data:</P>
          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            {[
              ["Right of access",          "Request a copy of the personal data we hold about you (Subject Access Request)."],
              ["Right to rectification",   "Require inaccurate or incomplete data to be corrected."],
              ["Right to erasure",         "Request deletion of your data where there is no compelling reason to continue processing."],
              ["Right to restriction",     "Ask us to pause processing while accuracy or legitimacy is verified."],
              ["Right to portability",     "Receive your data in a structured, machine-readable format."],
              ["Right to object",          "Object to processing based on legitimate interests or for direct marketing (absolute right)."],
              ["Withdraw consent",         "Where processing is consent-based, withdraw at any time without affecting prior lawful processing."],
              ["Automated decisions",      "Not be subject to solely automated decisions that significantly affect you, without human review."],
            ].map(([title, desc]) => (
              <div key={title} className="rounded-lg p-4 border" style={{ background: "#141821", borderColor: "rgba(255,255,255,0.07)" }}>
                <div className="text-sm font-semibold text-white mb-1">{title}</div>
                <div className="text-xs leading-relaxed" style={{ color: "#64748b" }}>{desc}</div>
              </div>
            ))}
          </div>
          <P>
            To exercise any of these rights, email us at{" "}
            <a href="mailto:privacy@bluestratum.com" className="underline hover:text-white transition-colors" style={{ color: "#D4A63A" }}>
              privacy@bluestratum.com
            </a>{" "}
            with the subject line "Data Subject Request — [Your Name]". We will respond within
            30 days. You also have the right to lodge a complaint with the{" "}
            <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer"
              className="underline hover:text-white transition-colors" style={{ color: "#D4A63A" }}>
              Information Commissioner&apos;s Office (ICO)
            </a>.
          </P>

          {/* 8 */}
          <H2 id="cookies">8. Cookies</H2>
          <P>
            We use cookies and similar tracking technologies on our website. The table below
            summarises the types in use:
          </P>
          <Table rows={[
            ["Strictly necessary",  "Art. 6(1)(b) — Contract / legitimate interests",  "Session / 1 year"],
            ["Functional (preferences)", "Art. 6(1)(a) — Consent",                     "1 year"],
            ["Analytics (anonymised)",   "Art. 6(1)(a) — Consent",                     "25 months"],
            ["Marketing / targeting",    "Art. 6(1)(a) — Consent",                     "As set by provider"],
          ]} />
          <P>
            You can control cookie preferences via the cookie banner displayed on your first
            visit, and update your preferences at any time by clicking "Cookie Settings" in
            the footer. Withdrawing consent for non-essential cookies does not affect the
            functionality of the core platform.
          </P>

          {/* 9 */}
          <H2 id="children">9. Children</H2>
          <P>
            The Naviora platform is not directed at individuals under 18 years of age. We do
            not knowingly collect personal data from minors. If you believe we have
            inadvertently collected data relating to a child under 18, please contact us
            immediately so we can delete it.
          </P>

          {/* 10 */}
          <H2 id="changes">10. Changes to this policy</H2>
          <P>
            We may update this Privacy Policy from time to time to reflect changes in law,
            our practices, or our Services. We will notify registered users of material
            changes by email or prominent notice within the platform at least 14 days before
            the change takes effect. The "Last updated" date at the top of this page reflects
            the most recent revision.
          </P>
          <P>
            Continued use of the Services after the effective date of a change constitutes
            acceptance of the updated policy. If you do not agree to a change, you should
            discontinue use and contact us to exercise your data rights.
          </P>

          {/* 11 */}
          <H2 id="contact">11. Contact &amp; data protection enquiries</H2>
          <P>
            For any questions, subject access requests, or concerns about this policy or our
            data practices, please contact our data protection team:
          </P>
          <div
            className="rounded-xl p-6 border"
            style={{ background: "#141821", borderColor: "rgba(212,166,58,0.2)" }}
          >
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-xs uppercase tracking-wider" style={{ color: "#475569" }}>Email</span><br />
                <a href="mailto:privacy@bluestratum.com" className="font-medium hover:text-white transition-colors" style={{ color: "#D4A63A" }}>
                  privacy@bluestratum.com
                </a>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider" style={{ color: "#475569" }}>Response time</span><br />
                <span style={{ color: "#cbd5e1" }}>We aim to respond to all requests within 5 business days.</span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider" style={{ color: "#475569" }}>Supervisory authority</span><br />
                <span style={{ color: "#cbd5e1" }}>
                  Information Commissioner&apos;s Office (ICO), Wycliffe House, Water Lane,
                  Wilmslow, Cheshire, SK9 5AF —{" "}
                  <a href="https://ico.org.uk/concerns" target="_blank" rel="noopener noreferrer"
                    className="underline hover:text-white transition-colors" style={{ color: "#D4A63A" }}>
                    ico.org.uk/concerns
                  </a>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <div className="flex flex-wrap gap-4 text-xs" style={{ color: "#334155" }}>
              <Link href="/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/cookie-policy"    className="hover:text-white transition-colors">Cookie Policy</Link>
              <Link href="/"                 className="hover:text-white transition-colors">Back to Home</Link>
            </div>
          </div>
        </main>
      </div>

      <LandingFooter />
    </div>
  );
}
