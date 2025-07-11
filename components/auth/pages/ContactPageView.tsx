import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import { useToast } from '../../ui/ToastProvider';
import { EnvelopeIcon, UserCircleIcon, ChatBubbleLeftEllipsisIcon } from '../../ui/Icons';

export const ContactPageView: React.FC = () => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !subject || !message) {
      showToast("Please fill out all fields.", "error");
      return;
    }

    const mailtoLink = `mailto:support2@pixasocial.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\n\nMessage:\n${message}`
    )}`;
    
    window.location.href = mailtoLink;

    showToast("Opening your email client to send the message.", "info");
  };

  return (
    <div className="bg-background py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-primary sm:text-5xl">
            Contact Us
          </h1>
          <p className="mt-4 text-xl text-textSecondary">
            We'd love to hear from you. Whether you have a question, feedback, or need assistance, we're here to help.
          </p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Your Name"
              id="contact-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="John Doe"
              leftIcon={<UserCircleIcon className="w-5 h-5 text-gray-400" />}
            />
            <Input
              label="Your Email"
              id="contact-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              leftIcon={<EnvelopeIcon className="w-5 h-5 text-gray-400" />}
            />
            <Input
              label="Subject"
              id="contact-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              placeholder="Regarding..."
              leftIcon={<ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-gray-400" />}
            />
            <Textarea
              label="Message"
              id="contact-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
              placeholder="Your message here..."
            />
            <div className="text-center">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
              >
                Send Message
              </Button>
              <p className="text-xs text-textSecondary mt-3">
                Note: This will open your default email application.
              </p>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};