import React from 'react';
import { Card } from '../../ui/Card';
import { APP_TITLE } from '../../../constants';

export const PrivacyPolicyPageView: React.FC = () => {
  return (
    <div className="bg-background py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto prose prose-invert lg:prose-xl text-textSecondary prose-headings:text-primary prose-a:text-accent prose-strong:text-textPrimary">
        <h1>Privacy Policy for {APP_TITLE}</h1>
        <p className="lead">
          Your privacy is important to us. It is {APP_TITLE}'s policy to respect your privacy regarding any information we may collect from you across our application.
        </p>

        <h2>1. Information We Collect</h2>
        <p>
          We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. We also let you know why we’re collecting it and how it will be used.
        </p>
        <ul>
          <li><strong>Account Information:</strong> When you register for an account, we collect information