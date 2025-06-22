import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy | Rolomind",
  description: "Privacy Policy for Rolomind - How we collect, use, and protect your data",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto px-4 py-16">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold">Privacy Policy</h1>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">1. Introduction</h2>
              <p className="text-muted-foreground">
                Rolomind (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your privacy. This Privacy Policy explains how we collect, 
                use, disclose, and safeguard your information when you use our contact management service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">2. Information We Collect</h2>
              <h3 className="text-xl font-medium">Personal Information</h3>
              <p className="text-muted-foreground">
                We collect information you provide directly to us, such as:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Name and email address when you create an account</li>
                <li>Contact information you upload and manage within the Service</li>
                <li>Communications between you and us</li>
              </ul>
              
              <h3 className="text-xl font-medium">Automatically Collected Information</h3>
              <p className="text-muted-foreground">
                When you use our Service, we may automatically collect:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Log data (IP address, browser type, operating system)</li>
                <li>Usage information (features used, time spent on the Service)</li>
                <li>Device information</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">3. How We Use Your Information</h2>
              <p className="text-muted-foreground">We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Provide, maintain, and improve our Service</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices, updates, security alerts, and support messages</li>
                <li>Respond to your comments, questions, and customer service requests</li>
                <li>Monitor and analyze trends, usage, and activities</li>
                <li>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">4. AI Services and Third-Party Processors</h2>
              <p className="text-muted-foreground">
                To provide intelligent search and insights, we use the following AI services:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>OpenRouter:</strong> Routes AI requests to various providers including Anthropic (via AWS Bedrock), Google, and Anthropic direct</li>
                <li><strong>OpenAI:</strong> Used exclusively for voice transcription features</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                <strong>Important:</strong> When you use AI search or voice features:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Your queries and relevant contact data are sent to these AI services for processing</li>
                <li>AI providers process this data according to their own privacy policies</li>
                <li>These providers have committed to not use customer data to train or improve their models</li>
                <li>AI providers may retain data for up to 30 days for abuse monitoring purposes</li>
                <li>We do not store your raw contact data on our servers - it remains in your browser&apos;s local storage</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">5. Data Storage and Security</h2>
              <p className="text-muted-foreground">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, 
                alteration, disclosure, or destruction. Your contact data is primarily stored locally in your browser using IndexedDB. 
                While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee absolute security.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">6. Data Sharing and Disclosure</h2>
              <p className="text-muted-foreground">
                We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>With your consent or at your direction</li>
                <li>To comply with legal obligations</li>
                <li>To protect and defend our rights and property</li>
                <li>With service providers who assist in our operations (under strict confidentiality agreements)</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">7. Your Rights and Choices</h2>
              <p className="text-muted-foreground">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Access and receive a copy of your personal information</li>
                <li>Update or correct your personal information</li>
                <li>Delete your account and associated data</li>
                <li>Object to or restrict certain processing of your data</li>
                <li>Data portability (receive your data in a structured format)</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">8. Data Retention</h2>
              <p className="text-muted-foreground">
                We retain your personal information only for as long as necessary to provide you with our Service and as described in this Privacy Policy. 
                Your contact data stored locally in your browser remains under your control and can be deleted at any time by clearing your browser data. 
                Account information is retained until you delete your account.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">9. Analytics and Cookies</h2>
              <p className="text-muted-foreground">
                We use cookies and similar tracking technologies to track activity on our Service and hold certain information. You can instruct 
                your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may 
                not be able to use some portions of our Service.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">10. Children&apos;s Privacy</h2>
              <p className="text-muted-foreground">
                Our Service is not intended for children under 18 years of age. We do not knowingly collect personal information from children under 18. 
                If we learn that we have collected personal information from a child under 18, we will take steps to delete such information.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">11. International Data Transfers</h2>
              <p className="text-muted-foreground">
                Your information may be transferred to and processed in countries other than your country of residence. 
                We ensure appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">12. California Privacy Rights (CCPA)</h2>
              <p className="text-muted-foreground">
                If you are a California resident, you have specific rights regarding your personal information under the California Consumer 
                Privacy Act (CCPA). These rights include the right to know, delete, opt-out, and non-discrimination. To exercise these rights, 
                please contact us using the information provided below.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">13. Changes to This Privacy Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page 
                and updating the &ldquo;Last updated&rdquo; date. Your continued use of the Service after any changes indicates your acceptance of the updated Privacy Policy.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-semibold">14. Contact Us</h2>
              <p className="text-muted-foreground">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p className="text-muted-foreground">
                Email: <a href="mailto:privacy@rolomind.com" className="text-primary hover:underline">privacy@rolomind.com</a><br />
                Address: [Your Company Address]
              </p>
            </section>
          </div>

          <div className="pt-8 border-t">
            <div className="flex justify-center gap-4">
              <Link href="/" className="text-primary hover:underline">
                Return to Home
              </Link>
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}