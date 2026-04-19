import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <h2 className="text-xl font-bold text-foreground">{title}</h2>
    <div className="text-muted-foreground leading-relaxed space-y-2">{children}</div>
  </div>
);

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-6 max-w-3xl">
          {/* Header */}
          <div className="mb-12 space-y-3">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest">Legal</p>
            <h1 className="text-4xl font-extrabold text-foreground">Terms of Use</h1>
            <p className="text-muted-foreground">
              Last updated: April 19, 2026. Effective immediately for all new accounts.
            </p>
          </div>

          <div className="space-y-10 text-sm">
            {/* Age requirement — prominent */}
            <div
              className="p-5 rounded-2xl border"
              style={{ background: "rgba(251,146,60,0.06)", borderColor: "rgba(251,146,60,0.25)" }}
            >
              <p className="font-bold text-orange-400 mb-1">Age Requirement — You must be 13 or older</p>
              <p className="text-muted-foreground">
                Cofinity is not intended for children under 13 years of age. By creating an account you represent
                and warrant that you are at least 13 years old. If you are under 18, you represent that a parent
                or guardian has reviewed and agreed to these Terms on your behalf. If we learn that a user is
                under 13, we will delete their account and data promptly.
              </p>
            </div>

            <Section title="1. Acceptance of Terms">
              <p>
                By accessing or using Cofinity ("Service," "Platform," "we," "us"), you agree to be bound by
                these Terms of Use. If you do not agree, do not use Cofinity.
              </p>
              <p>
                We may update these Terms from time to time. We'll notify you of material changes via email or
                in-app notice. Continued use after changes constitutes acceptance.
              </p>
            </Section>

            <Section title="2. Eligibility">
              <p>You may use Cofinity if you are:</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>At least 13 years old</li>
                <li>If between 13 and 17, you have parental or guardian consent</li>
                <li>Not prohibited from using the Service under applicable law</li>
                <li>Not a person whose account has been previously terminated by Cofinity</li>
              </ul>
            </Section>

            <Section title="3. Your Account">
              <p>
                You are responsible for maintaining the confidentiality of your account credentials and for all
                activities that occur under your account. You agree to notify us immediately of any unauthorized
                use at <a href="mailto:support@cofinity.app" className="text-primary underline">support@cofinity.app</a>.
              </p>
              <p>
                You must provide accurate, current, and complete information when creating your account.
                Impersonating another person or organization is strictly prohibited.
              </p>
            </Section>

            <Section title="4. Permitted Use">
              <p>You may use Cofinity to:</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Create and manage organizations, teams, and workspaces</li>
                <li>Organize events and coordinate RSVPs</li>
                <li>Communicate with team members via chat, polls, and announcements</li>
                <li>Earn points and unlock cosmetic perks through engagement</li>
                <li>Track your involvement and export portfolios</li>
              </ul>
            </Section>

            <Section title="5. Prohibited Conduct">
              <p>You agree not to:</p>
              <ul className="list-disc list-inside space-y-1 pl-2">
                <li>Post content that is illegal, harassing, threatening, defamatory, or discriminatory</li>
                <li>Attempt to access accounts or data that do not belong to you</li>
                <li>Use automated bots or scripts to interact with the platform</li>
                <li>Reverse-engineer, decompile, or copy any part of the platform</li>
                <li>Upload or transmit malware, viruses, or harmful code</li>
                <li>Use the platform for spam, phishing, or fraudulent activity</li>
                <li>Sell, rent, or transfer your account to another party</li>
                <li>Collect or harvest other users' personal data without consent</li>
              </ul>
            </Section>

            <Section title="6. Points, Levels & Perks">
              <p>
                Cofinity's points system is a purely engagement-based, cosmetic reward system. Points, levels,
                badges, and perks have no monetary value and cannot be converted to cash, transferred between
                accounts, or exchanged for goods or services outside the platform.
              </p>
              <p>
                Monthly points reset on the 1st of each month. All-time points and levels are permanent unless
                your account is terminated for a violation of these Terms.
              </p>
              <p>
                We reserve the right to adjust, reset, or remove points and perks at our discretion, including
                for abuse of the system.
              </p>
            </Section>

            <Section title="7. Content You Submit">
              <p>
                You retain ownership of content you submit to Cofinity. By submitting content, you grant
                Cofinity a worldwide, royalty-free, non-exclusive license to use, display, and distribute
                that content solely to provide and improve the Service.
              </p>
              <p>
                You represent that you have all necessary rights to the content you submit and that it does
                not violate any third-party rights or applicable laws.
              </p>
            </Section>

            <Section title="8. Third-Party Services">
              <p>
                Cofinity integrates with third-party services (Supabase, Stripe, Google). Your use of those
                services is subject to their respective terms and privacy policies. We are not responsible for
                the practices of third parties.
              </p>
            </Section>

            <Section title="9. Paid Plans">
              <p>
                Some features require a paid subscription (Pro, Growth, Enterprise). Payments are processed
                securely by Stripe. Subscriptions renew automatically unless cancelled. We do not store your
                payment card details. Refunds are handled on a case-by-case basis — contact us within 7 days
                of a charge for a refund request.
              </p>
            </Section>

            <Section title="10. Termination">
              <p>
                We may suspend or terminate your account at any time for violation of these Terms, with or
                without notice. You may delete your account at any time from account settings. Upon termination,
                your data will be deleted in accordance with our Privacy Policy.
              </p>
            </Section>

            <Section title="11. Disclaimer of Warranties">
              <p>
                Cofinity is provided "AS IS" without warranties of any kind. We do not guarantee that the
                Service will be uninterrupted, error-free, or secure. Use the Service at your own risk.
              </p>
            </Section>

            <Section title="12. Limitation of Liability">
              <p>
                To the fullest extent permitted by law, Cofinity shall not be liable for indirect, incidental,
                special, or consequential damages arising from your use of (or inability to use) the Service.
                Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim.
              </p>
            </Section>

            <Section title="13. Governing Law">
              <p>
                These Terms are governed by the laws of the State of Delaware, United States, without regard
                to conflict of law principles. Disputes shall be resolved through binding arbitration under the
                American Arbitration Association rules.
              </p>
            </Section>

            <Section title="14. Contact">
              <p>
                Questions about these Terms? Contact us at{" "}
                <a href="mailto:legal@cofinity.app" className="text-primary underline">legal@cofinity.app</a>.
              </p>
            </Section>
          </div>

          <div className="mt-12 pt-8 border-t border-border text-xs text-muted-foreground flex items-center justify-between">
            <span>© {new Date().getFullYear()} Cofinity. All rights reserved.</span>
            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy →</Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
