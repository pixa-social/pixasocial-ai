import React from 'react';
import { Card } from './ui/Card';
import { APP_TITLE } from '../constants';
import RstIntroductionGraphic from './RstIntroductionGraphic';

export const MethodologyView: React.FC = () => {
  return (
    <div className="p-6">
      <header className="text-center mb-10">
        <h2 className="text-4xl sm:text-5xl font-extrabold text-primary mb-3">
          The {APP_TITLE} Methodology
        </h2>
        <p className="text-lg text-textSecondary max-w-3xl mx-auto">
          A scientifically-grounded framework for strategic social engagement.
        </p>
      </header>

      <div className="space-y-8 max-w-4xl mx-auto">
        <Card>
          <h3 className="text-2xl font-semibold text-primary mb-3">Core Philosophy</h3>
          <p className="text-textSecondary mb-2">
            Traditional social media tools focus on reach and surface-level engagement. {APP_TITLE} operates on a deeper level. Our methodology is built on the premise that to truly connect with an audience, you must understand the fundamental psychological drivers that shape their perceptions, beliefs, and actions.
          </p>
          <p className="text-textSecondary">
            We integrate established principles from behavioral psychology with advanced AI to provide a toolkit for crafting resonant, influential, and strategically sound campaigns. This approach transforms communication from a broadcast into a sophisticated dialogue.
          </p>
        </Card>

        <Card>
          <h3 className="text-2xl font-semibold text-primary mb-4">Pillar 1: Reinforcement Sensitivity Theory (RST)</h3>
          <p className="text-textSecondary mb-4">
            At the heart of our audience modeling is the Reinforcement Sensitivity Theory (RST), a leading neuropsychological model of personality. RST posits three core systems that govern how individuals respond to environmental stimuli. Understanding a persona's RST profile allows for hyper-targeted messaging.
          </p>
          <RstIntroductionGraphic />
          <div className="mt-6 space-y-4">
            <div>
              <h4 className="text-lg font-semibold text-primary">Behavioral Approach System (BAS)</h4>
              <p className="text-sm text-textSecondary">This system is sensitive to signals of reward, non-punishment, and escape from punishment. Individuals with a high BAS are motivated by potential gains, novelty, and positive outcomes. They are often described as impulsive, reward-seeking, and optimistic.
                <br /><strong>Messaging Strategy:</strong> Target with themes of opportunity, achievement, exclusivity, pride, and novelty.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-yellow-400">Behavioral Inhibition System (BIS)</h4>
              <p className="text-sm text-textSecondary">The BIS is sensitive to signals of punishment, non-reward, and novelty, which it resolves by inhibiting behavior and increasing arousal and attention. High-BIS individuals are cautious, risk-averse, and sensitive to potential negative outcomes.
                <br /><strong>Messaging Strategy:</strong> Target with themes of safety, security, risk mitigation, and problem-solving.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-danger">Fight-Flight-Freeze System (FFFS)</h4>
              <p className="text-sm text-textSecondary">This system responds to all aversive stimuli, mediating reactions of fight, flight, or freezing. It is the system most associated with fear. High-FFFS sensitivity leads to strong reactions to perceived threats.
                <br /><strong>Messaging Strategy:</strong> Use with extreme caution. Target with themes of urgency, threat avoidance, and immediate action to overcome a clear danger.
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-2xl font-semibold text-primary mb-3">Pillar 2: Operator Conditioning</h3>
          <p className="text-textSecondary mb-2">
            Our "Operator Builder" module is a practical application of classical and operant conditioning principles. An "Operator" is a structured campaign mechanic designed to associate a neutral stimulus with a desired emotional or cognitive response.
          </p>
          <ul className="list-disc list-inside text-textSecondary ml-4 space-y-2">
            <li><strong>Conditioned Stimulus (CS):</strong> The neutral element you want to imbue with meaning (e.g., a logo, slogan, hashtag, or specific type of imagery).</li>
            <li><strong>Unconditioned Stimulus (US):</strong> A stimulus that naturally elicits a response (e.g., heartwarming stories to elicit hope, alarming statistics to elicit fear).</li>
            <li><strong>Desired Conditioned Response (CR):</strong> The target behavior or attitude you want your audience to exhibit when they encounter the CS (e.g., feelings of trust, a sense of urgency, sharing a post).</li>
            <li><strong>Reinforcement Loop:</strong> The mechanism that strengthens the association between the CS and CR (e.g., social validation, echo chamber effects, repeated exposure).</li>
          </ul>
        </Card>

        <Card>
            <h3 className="text-2xl font-semibold text-primary mb-3">Pillar 3: 8D Problem-Solving Framework</h3>
            <p className="text-textSecondary mb-2">
                For strategic rigor, we've integrated the 8D (Eight Disciplines) problem-solving process into our Audit Tool. Originally from the manufacturing industry, this structured methodology is exceptionally effective for planning and de-risking complex campaigns.
            </p>
            <ol className="list-decimal list-inside text-textSecondary ml-4 space-y-1 text-sm">
                <li><strong>D0: Plan:</strong> Define the scope and prerequisites for the campaign.</li>
                <li><strong>D1: Establish the Team:</strong> Identify roles and responsibilities.</li>
                <li><strong>D2: Describe the Problem/Opportunity:</strong> Clearly state the campaign's core objective.</li>
                <li><strong>D3: Develop Interim Containment Actions (ICA):</strong> Short-term actions if addressing an active issue.</li>
                <li><strong>D4: Identify and Verify Root Causes:</strong> Analyze the underlying factors of the problem or opportunity.</li>
                <li><strong>D5: Choose and Verify Permanent Corrective Actions (PCA):</strong> Select the core long-term strategies.</li>
                <li><strong>D6: Implement and Validate PCA:</strong> Execute the plan and measure its effectiveness.</li>
                <li><strong>D7: Prevent Recurrence:</strong> Standardize successful processes for future use.</li>
                <li><strong>D8: Congratulate the Team:</strong> Recognize the team's effort and success.</li>
            </ol>
        </Card>

        <Card className="bg-yellow-500/10 border-l-4 border-warning">
            <h3 className="text-xl font-semibold text-yellow-300 mb-2">Ethical Use Framework</h3>
            <p className="text-yellow-400">
                The power of these methodologies comes with a profound responsibility. {APP_TITLE} is intended for ethical use cases that aim to inform, inspire, and foster positive engagement. Users are responsible for ensuring their campaigns are truthful, respectful, and do not exploit vulnerabilities maliciously. Manipulative practices, misinformation, and harmful influence campaigns are a violation of our terms of service.
            </p>
        </Card>

      </div>
    </div>
  );
};
