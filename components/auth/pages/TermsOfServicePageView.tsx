
import React, { useMemo } from 'react';
import { Card } from '../../ui/Card';
import { APP_TITLE } from '../../../constants';

export const TermsOfServicePageView: React.FC = () => {
  const effectiveDate = useMemo(() => new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), []);

  return (
    <div className="bg-background py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto prose prose-lg text-textSecondary">
        <h1 className="text-primary">Terms of Service for {APP_TITLE}</h1>
        <p className="lead">
          Welcome to {APP_TITLE}. By accessing or using our application, you agree to be bound by these terms of service.
        </p>

        <h2>1. Use of Service</h2>
        <p>
          {APP_TITLE} provides a suite of tools for strategic social engagement planning and simulation. You agree to use our service in compliance with all applicable laws and regulations and not for any unlawful purpose. The service is intended for professional and educational use, and you agree to use the platform's capabilities ethically and responsibly.
        </p>
        
        <h2>2. User Accounts</h2>
        <p>
          To access most features of the service, you must register for a user account. You are responsible for safeguarding your account credentials and for any activities or actions under your account. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
        </p>
        
        <h2>3. Content</h2>
        <p>
          You are responsible for the content you create, input, or generate using the service ("User Content"). You retain all rights to your User Content, but you grant us a license to use, store, and process this content as necessary to provide and improve the service. You agree not to post content that is illegal, offensive, or otherwise infringes on the rights of others.
        </p>

        <h2>4. AI-Generated Content</h2>
        <p>
          The service utilizes artificial intelligence to generate content and suggestions. While we strive to provide high-quality outputs, AI-generated content may contain inaccuracies or be inappropriate. You are solely responsible for reviewing, editing, and verifying all AI-generated content before use or publication. {APP_TITLE} is not liable for any consequences arising from the use of AI-generated content.
        </p>

        <h2>5. Intellectual Property</h2>
        <p>
          The service and its original content (excluding User Content), features, and functionality are and will remain the exclusive property of {APP_TITLE} and its licensors.
        </p>

        <h2>6. Termination</h2>
        <p>
          We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
        </p>
        
        <h2>7. Limitation of Liability</h2>
        <p>
          In no event shall {APP_TITLE}, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.
        </p>
        
        <h2>8. Changes</h2>
        <p>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice of any changes by posting the new Terms of Service on this page.
        </p>

        <p>
          If you have any questions about these Terms, please contact us.
        </p>

        <p>This policy is effective as of {effectiveDate}.</p>
      </div>
    </div>
  );
};
