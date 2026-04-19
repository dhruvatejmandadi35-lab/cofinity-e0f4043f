import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <h2 className="text-xl font-bold text-foreground">{title}</h2>
    <div className="text-muted-foreground leading-relaxed space-y-2">{children}</div>
  </div>
);

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6 max-w-3xl">
          {/* Header */}
          <div className="mb-12 space-y-3">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest">Legal</p>
            <h1 className="text-4xl font-extrabold text-foreground">Privacy Policy</h1>
            <p className="text-muted-foreground">
              Last updated: April 19, 2026. We believe in clear, plain-English privacy practices.
            </p>
          </div>

          <div className="space-y-10 text-sm">
            {/* Quick summary */}
            <div
              className="p-5 rounded-2xl border"
              style={{ background: "rgba(96,165,250,0.06)", borderColor: "rgba(96,165,250,0.2)" }}
            >
              <p className="font-bold text-blue-400 mb-2">The short version</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• We collect only what's necessary to run the platform</li>
                <li>• We don't sell your personal data to advertisers</li>
                <li>• We don't serve behavioral ads</li>
                <li>• You can export or delete your data at any time</li>
                <li>• We do not knowingly collect data from children under 13</li>
              </ul>
            </div>

            <Section title="1. Who We Are">
              <p>
                Cofinity ("we", "our", "us") operates the Cofinity platform at cofinity.app. We are the data
                controller for personal data processed through the Service.
              </p>
              <p>
                For privacy questions, contact us at{" "}
                <a href="mailto:privacy@cofinity.app" className="text-primary underline">privacy@cofinity.app</a>.
              </p>
            </Section>

            <Section title="2. Information We Collect">
              <p><strong className="text-foreground">Account Information:</strong> Email address, username, display name, profile photo, bio, location, and website — provided when you sign up or update your profile.</p>
              <p><strong className="text-foreground">Activity Data:</strong> Events you RSVP to, check-ins, messages sent (metadata only — not full content for analytics), teams you join, points earned, badges unlocked, and levels reached.</p>
              <p><strong className="text-foreground">Payment Data:</strong> If you subscribe to a paid plan, Stripe processes your payment. We store only your Stripe customer ID — never full card details.</p>
              <p><strong className="text-foreground">Technical Data:</strong> IP address, browser type, device info, and usage logs collected automatically via our infrastructure provider (Supabase).</p>
              <p><strong className="text-foreground">Optional Profile Data:</strong> Birthday (display is opt-in), skills, and any other information you choose to add to your profile.</p>
            </Section>

            <Section title="3. How We Use Your Information">
              <p>We use collected information to:</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Provide, operate, and maintain the Cofinity platform</li>
                <li>Manage your account and authenticate your identity</li>
                <li>Award points, track levels, and unlock perks</li>
                <li>Send transactional emails (account confirmation, event reminders)</li>
                <li>Generate aggregated, anonymized analytics about platform usage</li>
                <li>Detect and prevent fraud, abuse, and security incidents</li>
                <li>Comply with legal obligations</li>
              </ul>
              <p>
                We do <strong className="text-foreground">not</strong> use your data to serve behavioral advertisements,
                build advertising profiles, or sell data to third parties.
              </p>
            </Section>

            <Section title="4. Children's Privacy (COPPA / GDPR-K)">
              <p>
                Cofinity is not directed to children under 13. We do not knowingly collect personal information
                from children under 13. If you believe a child under 13 has created an account, please contact
                us at <a href="mailto:privacy@cofinity.app" className="text-primary underline">privacy@cofinity.app</a> and
                we will delete the account and associated data promptly.
              </p>
              <p>
                Users between 13 and 17 may use Cofinity with parental or guardian consent. Parents and guardians
                may request access to, correction of, or deletion of their child's data by contacting us.
              </p>
            </Section>

            <Section title="5. How We Share Information">
              <p>We share your information only with:</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li><strong className="text-foreground">Supabase</strong> — our database and auth infrastructure provider, processing data in the EU under standard contractual clauses</li>
                <li><strong className="text-foreground">Stripe</strong> — payment processing for paid plans; subject to Stripe's privacy policy</li>
                <li><strong className="text-foreground">Google</strong> — if you sign in with Google, subject to Google's privacy policy</li>
                <li><strong className="text-foreground">Legal authorities</strong> — if required by law, court order, or to protect rights, safety, and property</li>
              </ul>
              <p>We do not sell, rent, or share your personal data with marketers or data brokers.</p>
            </Section>

            <Section title="6. Data Retention">
              <p>
                We retain your account data for as long as your account is active. If you delete your account,
                we will delete your personal data within 30 days, except where required to retain it for
                legal compliance (e.g., billing records may be kept for 7 years per tax law).
              </p>
              <p>
                Activity data (points history, event attendance) may be retained in anonymized, aggregated
                form after account deletion to maintain statistical integrity.
              </p>
            </Section>

            <Section title="7. Your Rights">
              <p>Depending on your jurisdiction, you may have the right to:</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li><strong className="text-foreground">Access</strong> — request a copy of data we hold about you</li>
                <li><strong className="text-foreground">Correction</strong> — request that we correct inaccurate data</li>
                <li><strong className="text-foreground">Deletion</strong> — request that we delete your data ("right to be forgotten")</li>
                <li><strong className="text-foreground">Portability</strong> — request your data in a machine-readable format</li>
                <li><strong className="text-foreground">Objection</strong> — object to certain processing activities</li>
                <li><strong className="text-foreground">Withdrawal of consent</strong> — where processing is based on consent</li>
              </ul>
              <p>To exercise your rights, contact <a href="mailto:privacy@cofinity.app" className="text-primary underline">privacy@cofinity.app</a>. We'll respond within 30 days.</p>
            </Section>

            <Section title="8. Cookies & Tracking">
              <p>
                Cofinity uses essential cookies required for authentication and session management. We do not
                use advertising cookies, tracking pixels, or third-party analytics that profile individuals.
              </p>
              <p>
                We use anonymous, aggregated usage analytics (page views, feature usage) to improve the
                platform. This data cannot be linked to individual users.
              </p>
            </Section>

            <Section title="9. Security">
              <p>
                We use industry-standard measures to protect your data: TLS encryption in transit, encrypted
                storage at rest, Row Level Security (RLS) in our database ensuring users can only access their
                own data, and regular security reviews.
              </p>
              <p>
                No system is 100% secure. If we become aware of a breach affecting your data, we'll notify
                you within 72 hours as required by applicable law.
              </p>
            </Section>

            <Section title="10. International Transfers">
              <p>
                Cofinity is operated from the United States. If you are located outside the US, your data
                will be transferred to and processed in the US. We rely on Standard Contractual Clauses for
                transfers from the EEA/UK.
              </p>
            </Section>

            <Section title="11. Changes to This Policy">
              <p>
                We may update this Privacy Policy from time to time. We'll notify you via email and in-app
                notice for material changes. The "last updated" date at the top of this page reflects the
                most recent revision.
              </p>
            </Section>

            <Section title="12. Contact Us">
              <p>
                For privacy-related questions or to exercise your rights:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Email: <a href="mailto:privacy@cofinity.app" className="text-primary underline">privacy@cofinity.app</a></li>
                <li>General support: <a href="mailto:support@cofinity.app" className="text-primary underline">support@cofinity.app</a></li>
              </ul>
            </Section>
          </div>

          <div className="mt-12 pt-8 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
            <span>© {new Date().getFullYear()} Cofinity. All rights reserved.</span>
            <Link to="/terms" className="text-primary hover:underline">Terms of Use →</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
