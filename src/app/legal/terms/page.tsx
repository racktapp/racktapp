import { PageHeader } from '@/components/page-header';

export default function TermsOfServicePage() {
  return (
    <div className="prose prose-sm md:prose-base dark:prose-invert max-w-4xl mx-auto">
      <PageHeader title="Terms of Service" description="Last updated: July 5, 2025" />

      <h2>Welcome to Rackt!</h2>
      <p>
        These terms and conditions outline the rules and regulations for the use of Rackt's Application. By accessing this app we assume you accept these terms and conditions. Do not continue to use Rackt if you do not agree to take all of the terms and conditions stated on this page.
      </p>

      <h3>1. Your Account</h3>
      <p>
        You are responsible for maintaining the security of your account, and you are fully responsible for all activities that occur under the account. You must be a human. Accounts registered by "bots" or other automated methods are not permitted. You must provide a valid email address and any other information requested in order to complete the signup process.
      </p>

      <h3>2. User Conduct</h3>
      <p>
        We are building a friendly, competitive community. Please be respectful of other users. Harassment, abuse, or any form of hate speech will not be tolerated and will result in account termination. When reporting match results, please do so honestly. Falsifying match results may lead to penalties or account suspension.
      </p>

      <h3>3. AI Features</h3>
      <p>
        Rackt provides AI-powered features like the AI Coach and Match Predictor. These tools are for entertainment and informational purposes only. They do not constitute professional coaching or guaranteed predictions. The analysis provided is based on the data you provide and may not be perfect.
      </p>

      <h3>4. Content</h3>
      <p>
        When you upload content, such as videos for the AI Coach, you grant us a worldwide, non-exclusive, royalty-free license to use, process, and display that content solely for the purpose of providing the app's services to you. We do not claim ownership of your content.
      </p>

      <h3>5. Termination</h3>
      <p>
        We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
      </p>

      <h3>6. Disclaimer</h3>
      <p>
        The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement or course of performance.
      </p>

      <h3>7. Changes to Terms</h3>
      <p>
        We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will try to provide at least 30 days' notice prior to any new terms taking effect.
      </p>

      <h3>Contact Us</h3>
      <p>
        If you have any questions about these Terms, please contact us.
      </p>
    </div>
  );
}
