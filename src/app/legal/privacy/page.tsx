import { PageHeader } from '@/components/page-header';

export default function PrivacyPolicyPage() {
  return (
    <div className="prose prose-sm md:prose-base dark:prose-invert max-w-4xl mx-auto">
      <PageHeader title="Privacy Policy" description="Last updated: July 5, 2025" />

      <p>
        Your privacy is important to us. It is Rackt's policy to respect your privacy regarding any information we may collect from you through our app.
      </p>
      
      <h3>1. Information We Collect</h3>
      <ul>
        <li><strong>Personal Data:</strong> When you sign up, we collect information like your name, email address, and password. You may also provide a username and profile picture.</li>
        <li><strong>Usage Data:</strong> We collect data you generate while using the app, such as match results, challenges, tournament participation, and interactions with friends.</li>
        <li><strong>Content You Provide:</strong> We collect content you upload, such as videos for our AI Coach feature. This content is used solely to provide the coaching service to you.</li>
        <li><strong>Data from Third Parties:</strong> If you sign up using Google, we receive information from your Google account, such as your name, email address, and profile picture, as permitted by your Google account settings.</li>
      </ul>

      <h3>2. How We Use Your Information</h3>
      <ul>
        <li>To provide and maintain our service, including authenticating you, calculating your RacktRank, and displaying your stats.</li>
        <li>To enable social features like friending, challenging, and chatting with other users.</li>
        <li>To power our AI features, such as analyzing your swing video or predicting match outcomes.</li>
        <li>To communicate with you, for example, by sending email notifications for account verification.</li>
      </ul>

      <h3>3. Data Sharing</h3>
      <p>
        We do not sell, trade, or rent your personal identification information to others. Your profile information, such as your name, username, and stats, is visible to other users of the app to enable the social and competitive features.
      </p>
      
      <h3>4. Security</h3>
      <p>
        We take reasonable measures to protect your personal information from unauthorized access, use, or disclosure. However, no method of transmission over the internet or method of electronic storage is 100% secure.
      </p>

      <h3>5. Your Rights</h3>
      <p>
        You have the right to access and update your personal information through your account settings. You can also delete your account, which will remove your personal data from our active systems.
      </p>
      
      <h3>6. Children's Privacy</h3>
      <p>
        Our service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from children under 13.
      </p>

      <h3>7. Changes to This Privacy Policy</h3>
      <p>
        We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
      </p>
      
      <h3>Contact Us</h3>
      <p>
        If you have any questions about this Privacy Policy, please contact us at <a href="mailto:racktapp@gmail.com">racktapp@gmail.com</a>.
      </p>
    </div>
  );
}
