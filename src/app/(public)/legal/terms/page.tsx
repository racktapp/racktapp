

import { PageHeader } from '@/components/page-header';

export default function TermsOfServicePage() {
  return (
    <div className="prose prose-sm md:prose-base dark:prose-invert max-w-4xl mx-auto">
      <PageHeader title="Terms of Service" description="Effective Date: July 9, 2025 | Last Updated: July 9, 2025" />

      <h2>Welcome to Rackt!</h2>
      <p>
        These Terms of Service ("Terms") govern your use of the Rackt mobile application (the "App", "Service", or "Rackt") provided by us. By using Rackt, you agree to comply with these Terms. If you do not agree with any part of these Terms, please do not use the app.
      </p>

      <h3>1. Your Account</h3>
      <p>You are responsible for maintaining the security of your account and all activity that occurs under it.</p>
      <ul>
        <li>You must provide accurate, complete information during registration, including a valid email address.</li>
        <li>You may not use someone else’s identity or create accounts using automated methods ("bots").</li>
        <li>You must be at least 13 years old to use the Service.</li>
      </ul>

      <h3>2. User Conduct</h3>
      <p>We are building a positive and competitive sports community. You agree to:</p>
      <ul>
        <li>Treat other users with respect and fairness.</li>
        <li>Avoid any form of harassment, hate speech, or abusive behavior.</li>
        <li>Report match results honestly. Falsifying match outcomes may result in warnings, suspensions, or permanent bans.</li>
      </ul>
      
      <h3>3. AI Features</h3>
      <p>Rackt offers AI-powered tools, such as the AI Coach and Match Predictor. These features are:</p>
      <ul>
        <li>Intended for informational and entertainment purposes only.</li>
        <li>Based on the data you provide (e.g., swing videos).</li>
        <li>Not guaranteed to be accurate or error-free, nor a substitute for professional coaching or advice.</li>
      </ul>

      <h3>4. Content</h3>
      <p>When you upload content (like swing videos), you retain ownership of it. However, by uploading, you grant us a non-exclusive, royalty-free, worldwide license to use, display, and process your content solely to deliver app features (like the AI Coach). We will never sell or repurpose your content outside the app’s core functionality.</p>

      <h3>5. Termination</h3>
      <p>We may suspend or terminate your access to the app immediately and without prior notice if:</p>
      <ul>
        <li>You violate these Terms,</li>
        <li>Engage in fraudulent or harmful behavior,</li>
        <li>Or act in a way that disrupts the community or service.</li>
      </ul>

      <h3>6. Disclaimer</h3>
      <p>The Rackt service is provided “as is” and “as available.” We make no warranties, expressed or implied, including but not limited to:</p>
      <ul>
        <li>Fitness for a particular purpose</li>
        <li>Reliability or availability of features</li>
        <li>Non-infringement or uninterrupted service</li>
      </ul>
      <p>Use the app at your own risk.</p>

      <h3>7. Changes to These Terms</h3>
      <p>We may update these Terms at any time. If we do:</p>
      <ul>
        <li>We'll notify users within the app or by email where possible.</li>
        <li>Continued use of the app after updates means you accept the new Terms.</li>
      </ul>

      <h3>8. Contact Us</h3>
      <p>
        If you have any questions or concerns about these Terms, you can contact us at:
      </p>
      <p>
        📧 <a href="mailto:racktapp@gmail.com">racktapp@gmail.com</a>
      </p>
    </div>
  );
}
