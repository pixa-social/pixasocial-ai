
import React from 'react';
import { Card } from './ui/Card';
import { APP_TITLE } from '../constants';

export const MethodologyView: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-3xl font-bold text-textPrimary mb-4 text-center">{APP_TITLE}: Methodology</h2>
      
      <Card>
        <h3 className="text-2xl font-semibold text-primary mb-3">Introduction</h3>
        <p className="text-textSecondary mb-2">
          Welcome to {APP_TITLE}, a strategic social engagement suite designed to help you plan, simulate, and evaluate
          sophisticated communication campaigns. Our core philosophy is to leverage behavioral insights and the power of
          Artificial Intelligence (AI) to craft more effective, resonant, and responsible messaging.
        </p>
        <p className="text-textSecondary">
          This platform provides a structured environment to understand target audiences, design engagement mechanics,
          generate tailored content, anticipate feedback, and audit your strategies for ethical alignment and effectiveness.
        </p>
      </Card>

      <Card>
        <h3 className="text-2xl font-semibold text-primary mb-3">Key Modules & Workflow</h3>
        <p className="text-textSecondary mb-4">
          {APP_TITLE} is organized into several interconnected modules, each serving a distinct purpose in the campaign lifecycle:
        </p>

        <div className="space-y-4">
          <div>
            <h4 className="text-xl font-semibold text-textPrimary mb-1">1. Audience Modeling: Understanding Your Audience</h4>
            <p className="text-textSecondary ml-4 mb-1">
              The foundation of any successful campaign is a deep understanding of the target audience. This module allows you to:
            </p>
            <ul className="list-disc list-inside text-textSecondary ml-8 space-y-1">
              <li>Create detailed audience personas, incorporating demographic, psychographic, and behavioral data.</li>
              <li>Utilize the <strong className="text-textPrimary">Reinforcement Sensitivity Theory (RST)</strong> (BAS: Behavioral Approach System, BIS: Behavioral Inhibition System, FFFS: Fight-Flight-Freeze System) to gain deeper psychological insights into what drives your audience's sensitivities to reward, punishment, and threat.</li>
              <li>Leverage AI assistance to suggest persona details, potential vulnerabilities, and estimate RST profiles based on initial inputs.</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xl font-semibold text-textPrimary mb-1">2. OperatorBuilder: Designing Engagement Mechanics</h4>
            <p className="text-textSecondary ml-4 mb-1">
              This module applies principles of <strong className="text-textPrimary">Pavlovian Conditioning</strong> to design specific "operators" (e.g., Hope, Fear, Custom) intended to elicit desired responses. You will define:
            </p>
            <ul className="list-disc list-inside text-textSecondary ml-8 space-y-1">
              <li><strong className="text-textPrimary">Conditioned Stimulus (CS):</strong> A previously neutral signal or cue that, after association, triggers a conditioned response.</li>
              <li><strong className="text-textPrimary">Unconditioned Stimulus (US):</strong> A stimulus that naturally and automatically triggers a response.</li>
              <li><strong className="text-textPrimary">Desired Conditioned Response (CR):</strong> The learned reaction to the CS, representing the target behavior or attitude shift.</li>
              <li><strong className="text-textPrimary">Reinforcement Loop:</strong> The mechanisms through which the CR is strengthened and maintained over time (e.g., social validation, repetition).</li>
              <li>AI provides suggestions for CS, US, and reinforcement strategies tailored to your target persona and chosen operator type.</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xl font-semibold text-textPrimary mb-1">3. Content Planner: Crafting the Message</h4>
            <p className="text-textSecondary ml-4 mb-1">
              Translate your strategic operators into compelling content for various social media platforms. This module facilitates:
            </p>
            <ul className="list-disc list-inside text-textSecondary ml-8 space-y-1">
              <li>Generating tailored content drafts for platforms like X (Twitter), Facebook, Instagram, and more.</li>
              <li>AI assistance in drafting posts and suggesting relevant hashtags, considering persona characteristics, operator goals, and platform-specific styles.</li>
              <li>Storing and managing multiple content drafts for different campaign arms.</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xl font-semibold text-textPrimary mb-1">4. Feedback Simulator: Anticipating Reactions</h4>
            <p className="text-textSecondary ml-4 mb-1">
              Before deploying content, use AI to predict how your target persona might react. The simulator provides:
            </p>
            <ul className="list-disc list-inside text-textSecondary ml-8 space-y-1">
              <li>Forecasts of sentiment distribution (positive, neutral, negative).</li>
              <li>Predictions of engagement levels (Low, Medium, High).</li>
              <li>Identification of potential risks or unintended interpretations of your message.</li>
              <li>An opportunity to refine content iteratively for optimal impact.</li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-xl font-semibold text-textPrimary mb-1">5. Audit Tool: Ensuring Strategic Alignment & Responsibility</h4>
            <p className="text-textSecondary ml-4 mb-1">
              Maintain rigor and ethical considerations throughout your campaign planning using the <strong className="text-textPrimary">8D (Eight Disciplines) Problem-Solving Process</strong>. This module guides you through:
            </p>
            <ul className="list-disc list-inside text-textSecondary ml-8 space-y-1">
              <li>A structured approach covering planning, team establishment, problem definition, root cause analysis, corrective actions, implementation, and prevention of recurrence.</li>
              <li>AI assistance for brainstorming root causes, developing corrective actions, and performing an overall risk analysis on your plan.</li>
            </ul>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-2xl font-semibold text-primary mb-3">The Role of AI</h3>
        <p className="text-textSecondary mb-2">
          {APP_TITLE} integrates advanced AI capabilities, leveraging models from providers like Google (Gemini) and OpenAI. AI is used throughout the platform to:
        </p>
        <ul className="list-disc list-inside text-textSecondary ml-4 space-y-1">
          <li>Provide intelligent suggestions for persona attributes, operator components, and audit steps.</li>
          <li>Generate creative and contextually relevant content drafts.</li>
          <li>Analyze persona data and content to simulate potential audience feedback.</li>
          <li>Identify potential risks and areas for strategic improvement.</li>
        </ul>
        <p className="text-textSecondary mt-2">
          This AI augmentation aims to enhance your strategic thinking, boost creative output, and streamline the campaign planning process.
        </p>
      </Card>
      
      <Card className="bg-amber-50 border-l-4 border-warning">
        <h3 className="text-xl font-semibold text-amber-700 mb-2">Ethical Considerations & Disclaimer</h3>
        <p className="text-amber-600 mb-2">
          {APP_TITLE} is a powerful tool intended for planning, simulation, and educational purposes. It is crucial to use the insights and capabilities provided by this platform ethically and responsibly.
        </p>
        <ul className="list-disc list-inside text-amber-600 ml-4 space-y-1">
          <li>Users are solely responsible for ensuring their campaigns comply with all applicable laws, regulations, and platform policies.</li>
          <li>The tool should not be used for manipulative practices, spreading misinformation, or any activity that could cause harm.</li>
          <li>The objective should always be to foster positive, constructive, and transparent engagement.</li>
        </ul>
         <p className="text-amber-600 mt-3 font-semibold">
          By using {APP_TITLE}, you acknowledge your responsibility to apply these strategies in an ethical manner.
        </p>
      </Card>
    </div>
  );
};
