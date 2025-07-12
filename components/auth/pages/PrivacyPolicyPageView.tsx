
import React, { useMemo } from 'react';
import { Card } from '../../ui/Card';
import { APP_TITLE } from '../../../constants';

export const PrivacyPolicyPageView: React.FC = () => {
  const effectiveDate = useMemo(() => new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), []);

  return (
    <div className="bg-background py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto prose prose-invert lg:prose-xl text-textSecondary prose-headings:text-primary prose-a:text-accent prose-strong:text-textPrimary">
        <h1>Privacy Policy for {APP_TITLE}</h1>
        <p className="lead">
          Your privacy is important to us. It is {APP_TITLE}'s policy to respect your privacy regarding any information we may collect from you across our application.
        </p>
        <p>This policy is effective as of {effectiveDate}.</p>

        <h2>1. Information We Collect</h2>
        <p>
          We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.
        </p>
        <ul>
          <li><strong>Account Information:</strong> When you register for an account, we collect information such as your name and email address to create and manage your account.</li>
          <li><strong>User-Generated Content:</strong> We store the data you create within the application, such as Audience Personas, Campaign Operators, and Content Drafts, to provide you with our services.</li>
          <li><strong>API Keys:</strong> If you provide API keys for third-party AI services in the Admin Panel, they are stored securely and used solely to proxy requests to those services on your behalf.</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>
          We use the information we collect in various ways, including to:
        </p>
        <ul>
          <li>Provide, operate, and maintain our application</li>
          <li>Improve, personalize, and expand our application</li>
          <li>Understand and analyze how you use our application</li>
          <li>Communicate with you, either directly or through one of our partners, including for customer service, to provide you with updates and other information relating to the webapp, and for marketing and promotional purposes</li>
          <li>Find and prevent fraud</li>
        </ul>

        <h2>3. Log Files</h2>
        <p>
          {APP_TITLE} follows a standard procedure of using log files. These files log visitors when they visit websites. All hosting companies do this and a part of hosting services' analytics. The information collected by log files include internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks. These are not linked to any information that is personally identifiable.
        </p>
        
        <h2>4. Security of Your Information</h2>
        <p>
          The security of your personal information is important to us, but remember that no method of transmission over the Internet, or method of electronic storage, is 100% secure. While we strive to use commercially acceptable means to protect your Personal Information, we cannot guarantee its absolute security.
        </p>

        <h2>5. Links to Other Sites</h2>
        <p>
          Our Service may contain links to other sites that are not operated by us. If you click on a third party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy of every site you visit. We have no control over and assume no responsibility for the content, privacy policies or practices of any third party sites or services.
        </p>

        <h2>6. Changes to This Privacy Policy</h2>
        <p>
          We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
        </p>

        <h2>Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us.
        </p>
      </div>
    </div>
  );
};
