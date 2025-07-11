import React from 'react';
import { Card } from '../../ui/Card';
import { APP_TITLE } from '../../../constants';

export const AboutPageView: React.FC = () => {
  return (
    <div className="bg-background py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-primary sm:text-5xl">
            About {APP_TITLE}
          </h1>
          <p className="mt-4 text-xl text-textSecondary">
            Engineering the future of digital communication.
          </p>
        </div>

        <div className="space-y-12">
          <Card>
            <h2 className="text-2xl font-bold text-textPrimary mb-4">Our Mission</h2>
            <p className="text-textSecondary leading-relaxed">
              Our mission is to empower creators, strategists, and organizations with the most advanced tools to understand and engage with their audiences on a deeper, more meaningful level. We believe that the fusion of behavioral psychology and artificial intelligence can unlock unprecedented levels of connection and impact. We are committed to building a platform that is not only powerful but also promotes ethical, responsible, and positive communication strategies.
            </p>
          </Card>

          <Card>
            <h2 className="text-2xl font-bold text-textPrimary mb-4">Our Vision</h2>
            <p className="text-textSecondary leading-relaxed">
              We envision a digital world where communication is more intentional, resonant, and effective. {APP_TITLE} aims to be the indispensable partner for anyone looking to move beyond surface-level metrics and generic messaging. We strive to be at the forefront of AI-driven communication technology, continuously innovating to provide our users with a decisive strategic edge while championing the responsible use of powerful technologies.
            </p>
          </Card>

          <Card>
            <h2 className="text-2xl font-bold text-textPrimary mb-4">The Team</h2>
            <p className="text-textSecondary leading-relaxed">
              {APP_TITLE} was born from a multidisciplinary team of data scientists, behavioral psychologists, software engineers, and veteran campaign strategists. We are united by a passion for understanding human behavior and a belief in the potential of technology to foster better communication. Our diverse expertise allows us to approach problems from unique angles, resulting in a tool that is as scientifically grounded as it is technologically advanced.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};