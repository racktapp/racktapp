

import { PageHeader } from '@/components/page-header';
import Link from 'next/link';

export default function SupportPage() {
  return (
    <div className="prose prose-sm md:prose-base dark:prose-invert max-w-4xl mx-auto">
      <PageHeader title="Rackt Support" description="Welcome to the Rackt support page!" />

      <p>
        We're here to help you get the most out of the app. If you’re having issues or need assistance, you’re in the right place.
      </p>

      <h3>What is Rackt?</h3>
      <p>
        Rackt is a social and competitive platform for racket sport players. Track your matches, view your RacktRank, join tournaments, and connect with friends across tennis, padel, badminton, and table tennis.
      </p>

      <h3>Need Help?</h3>
      <p>If you’re experiencing any of the following, we’re happy to assist:</p>
      <ul>
        <li>Trouble signing in or creating an account</li>
        <li>Bug reports or app crashes</li>
        <li>Incorrect stats or match results</li>
        <li>Questions about AI features like the AI Coach</li>
        <li>Concerns about account privacy or content</li>
      </ul>

      <h3>Contact Us</h3>
      <p>You can reach our support team at:</p>
      <p>
        📧 <a href="mailto:racktapp@gmail.com">racktapp@gmail.com</a>
      </p>
      <p>We aim to respond within 24–48 hours on business days.</p>

      <h3>Helpful Links</h3>
      <ul>
        <li><Link href="/legal/privacy">Privacy Policy</Link></li>
        <li><Link href="/legal/terms">Terms of Service</Link></li>
      </ul>
      

      <h3>Support Hours</h3>
      <p>
        We’re available Monday to Friday, 9:00–17:00 EET (Helsinki time).
        <br />
        Feel free to contact us anytime — we’ll get back to you as soon as we can.
      </p>
    </div>
  );
}
