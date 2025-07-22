

import { PageHeader } from '@/components/page-header';

export default function PrivacyPolicyPage() {
  return (
    <div className="prose prose-sm md:prose-base dark:prose-invert max-w-4xl mx-auto">
      <PageHeader title="Privacy Policy" description="Effective Date: July 9, 2025 | Last Updated: July 9, 2025" />

      <p>
        Your privacy is important to us. This Privacy Policy explains how Rackt we collect, uses, and protects your personal information when you use our mobile application (“Rackt” or “the app”).
      </p>
      
      <p>By using Rackt, you agree to the collection and use of information in accordance with this policy.</p>

      <h3>1. Information We Collect</h3>
      <h4>Personal Data</h4>
      <p>When you create an account, we collect:</p>
      <ul>
        <li>Your name</li>
        <li>Email address</li>
        <li>Password</li>
        <li>Optional profile information such as a username and profile picture</li>
      </ul>

      <h4>Usage Data</h4>
      <p>While using the app, we collect data related to:</p>
      <ul>
        <li>Match results and performance statistics</li>
        <li>Challenges and tournament participation</li>
        <li>Social interactions (e.g., friends, messages)</li>
      </ul>

      <h4>Content You Provide</h4>
      <p>If you use features like our AI Coach, we collect media you upload (e.g., swing videos). This content is used solely to provide coaching feedback and is not shared externally.</p>

      <h4>Data from Third Parties</h4>
      <p>If you sign up using a Google account, we access information such as your name, email address, and profile picture, as permitted by your Google settings.</p>

      <h3>2. How We Use Your Information</h3>
      <p>We use your data to:</p>
      <ul>
        <li>Provide and operate the app’s features, including login and authentication</li>
        <li>Calculate and display your RacktRank and performance stats</li>
        <li>Enable social features like friending, chatting, and challenges</li>
        <li>Process and analyze video content through our AI tools</li>
        <li>Send notifications for account verification and service-related updates</li>
        <li>Improve the app’s performance and user experience</li>
      </ul>

      <h3>3. Data Sharing</h3>
      <p>
        We do not sell, trade, or rent your personal data. Your profile information (e.g., name, username, and stats) is visible to other users to support social and competitive features of the app.
      </p>
      <p>We may use trusted third-party services like Firebase to provide authentication, data storage, and analytics. These services process data on our behalf under strict confidentiality and security standards.</p>
      
      <h3>4. Security</h3>
      <p>
        We implement appropriate technical and organizational measures to protect your data. However, no internet transmission or electronic storage method is 100% secure. We encourage you to keep your account credentials confidential.
      </p>

      <h3>5. Your Rights</h3>
      <p>You can:</p>
      <ul>
        <li>View and update your account information via your app settings</li>
        <li>Delete your account at any time, which will remove your personal data from our active systems</li>
        <li>If you are located in the European Economic Area (EEA), you may have additional rights under GDPR, including the right to access, correct, or erase your data.</li>
      </ul>
      
      <h3>6. Children’s Privacy</h3>
      <p>
        Rackt is intended for users aged 13 and older. We do not knowingly collect personal data from children under 13. If we learn that we have collected personal information from a child under 13, we will delete it immediately. Parents or guardians who believe their child has provided us with personal information may contact us at the email below.
      </p>

      <h3>7. Changes to This Policy</h3>
      <p>
        We may update this Privacy Policy from time to time. Any changes will be posted on this page, and we may notify users through the app or by email where appropriate.
      </p>
      
      <h3>8. Contact Us</h3>
      <p>
        If you have questions or concerns about this Privacy Policy or your personal data, please contact us:
      </p>
      <p>
        📧 Email: <a href="mailto:racktapp@gmail.com">racktapp@gmail.com</a>
      </p>
    </div>
  );
}
