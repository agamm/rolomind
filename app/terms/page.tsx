import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Service | Rolomind",
  description: "Terms of Service for Rolomind - AI-powered contact management platform",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-16">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Terms of Service</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground">
                By accessing or using Rolomind (&quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). 
                If you disagree with any part of these terms, you do not have permission to access the Service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">2. Alpha Product Disclaimer</h2>
              <p className="text-muted-foreground">
                <strong>Rolomind is currently in alpha stage.</strong> This means the Service is in early development and may contain bugs, 
                incomplete features, or other issues. The Service may be modified, discontinued, or completely changed at any time without notice. 
                We make no guarantees about the availability, reliability, or functionality of the Service during this alpha period.
              </p>
              <p className="text-muted-foreground">
                <strong>Service Cancellation:</strong> We reserve the right to cancel, discontinue, or terminate the Service at any time, 
                for any reason, without prior notice. We may also suspend or terminate access for individual users at our sole discretion 
                for any reason, including but not limited to violation of these terms, technical issues, or business reasons.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">3. Age Restriction</h2>
              <p className="text-muted-foreground">
                <strong>You must be at least 18 years old to use this Service.</strong> By using Rolomind, you represent and warrant that you are 18 years of age or older. 
                We do not knowingly collect or solicit personal information from anyone under the age of 18. 
                If we learn that we have collected personal information from a child under age 18, we will delete that information as quickly as possible.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">4. User Accounts</h2>
              <p className="text-muted-foreground">
                When you create an account with us, you must provide information that is accurate, complete, and current at all times. 
                You are responsible for safeguarding the password and for all activities that occur under your account. 
                You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">5. Acceptable Use</h2>
              <p className="text-muted-foreground">You agree not to use the Service:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
                <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
                <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
                <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
                <li>To submit false or misleading information</li>
                <li>To upload or transmit viruses or any other type of malicious code</li>
                <li>To spam, phish, pharm, pretext, spider, crawl, or scrape</li>
                <li>For any obscene or immoral purpose</li>
                <li>Systematically collect or access personal information of others</li>
                <li>To interfere with or circumvent the security features of the Service</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">6. Privacy and Data Protection</h2>
              <p className="text-muted-foreground">
                Your use of the Service is also governed by our Privacy Policy. 
                By using Rolomind, you consent to the collection and use of information as detailed in our Privacy Policy. 
                We are committed to protecting your personal data and maintaining compliance with applicable data protection regulations.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">7. Contact Data Management</h2>
              <p className="text-muted-foreground">
                You represent and warrant that you have the necessary rights and permissions to upload, store, and manage any contact information in Rolomind. 
                You are solely responsible for ensuring compliance with applicable laws regarding the collection, storage, and use of personal information of your contacts.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">8. Bring Your Own API Keys</h2>
              <p className="text-muted-foreground">
                <strong>API Key Requirement:</strong> To use Rolomind&apos;s AI-powered features, you must provide your own API keys from third-party AI service providers. 
                Specifically, an OpenRouter API key is required for core AI functionality, and an OpenAI API key is optional for voice transcription features.
              </p>
              <p className="text-muted-foreground">
                <strong>Your Responsibility:</strong> You are solely responsible for:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Obtaining and maintaining valid API keys from the respective providers</li>
                <li>Ensuring your API keys have sufficient usage credits or allowances</li>
                <li>Managing costs and billing associated with your API usage</li>
                <li>Compliance with the terms of service of the API providers</li>
                <li>Securing your API keys and preventing unauthorized access</li>
              </ul>
              <p className="text-muted-foreground">
                <strong>Service Limitations:</strong> Without valid API keys, AI-powered features will not function. Rolomind is not responsible for any costs, 
                limitations, or restrictions imposed by third-party API providers. We do not guarantee the availability, reliability, or performance of third-party AI services.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">9. Intellectual Property Rights</h2>
              <p className="text-muted-foreground">
                The Service and its original content, features, and functionality are and will remain the exclusive property of Rolomind and its licensors. 
                The Service is protected by copyright, trademark, and other laws. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">10. Termination</h2>
              <p className="text-muted-foreground">
                We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, 
                under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms. 
                Given the alpha nature of this Service, we reserve the right to remove any user for any reason, including but not limited to 
                technical issues, capacity limitations, business decisions, or any other reason we deem appropriate.
              </p>
              <p className="text-muted-foreground">
                Upon termination, your right to use the Service will immediately cease. We are not obligated to provide advance notice 
                of termination, though we may do so at our discretion. You may also terminate your account at any time by contacting us 
                or by ceasing to use the Service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">11. Disclaimer</h2>
              <p className="text-muted-foreground">
                The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. The Service is provided without warranties of any kind, 
                whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, 
                non-infringement, or course of performance.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">12. Limitation of Liability</h2>
              <p className="text-muted-foreground">
                In no event shall Rolomind, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, 
                incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, 
                or other intangible losses, resulting from your use of the Service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">13. Governing Law</h2>
              <p className="text-muted-foreground">
                These Terms shall be governed and construed in accordance with the laws of the United States, without regard to its conflict of law provisions. 
                Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">14. Changes to Terms</h2>
              <p className="text-muted-foreground">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
                If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">15. Contact Information</h2>
              <p className="text-muted-foreground">
                If you have any questions about these Terms, please contact us at:
              </p>
              <p className="text-muted-foreground">
                Email: <a href="mailto:help@rolomind.com" className="text-primary hover:underline">help@rolomind.com</a><br />
                Address: [Your Company Address]
              </p>
            </section>
          </div>

          <div className="pt-8 border-t">
            <div className="flex justify-center">
              <Link href="/" className="text-primary hover:underline">
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}