import React from 'react';
import { Card } from '../../ui/Card';
import { APP_TITLE } from '../../../constants';
import RstIntroductionGraphic from '../../RstIntroductionGraphic';

export const DocumentationPageView: React.FC = () => {
  return (
    <div className="bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-primary mb-3">
            {APP_TITLE} Documentation
          </h2>
          <p className="text-lg text-textSecondary max-w-3xl mx-auto">
            Your guide to mastering strategic social engagement with behavioral insights and AI.
          </p>
        </header>

        <div className="space-y-8">
          <Card>
            <h3 className="text-2xl font-semibold text-primary mb-3">Introduction: What is {APP_TITLE}?</h3>
            <p className="text-textSecondary mb-2">
              {APP_TITLE} is a sophisticated suite designed for global campaign managers, content creators, and strategists. It empowers you to plan, simulate, and evaluate impactful social engagement strategies by integrating:
            </p>
            <ul className="list-disc list-inside text-textSecondary ml-4 space-y-1 mb-3">
              <li>Deep <strong className="text-textPrimary">Behavioral Insights</strong> (including Reinforcement Sensitivity Theory - RST).</li>
              <li>Principles of <strong className="text-textPrimary">Psychological Conditioning</strong>.</li>
              <li>Structured <strong className="text-textPrimary">Problem-Solving Frameworks</strong> (like 8D).</li>
              <li>Powerful <strong className="text-textPrimary">Artificial Intelligence (AI)</strong> assistance for generation, analysis, and simulation.</li>
            </ul>
            <p className="text-textSecondary">
              Our platform helps you move beyond generic messaging to craft resonant narratives that drive desired actions, all while maintaining ethical considerations.
            </p>
          </Card>

          <Card>
            <h3 className="text-2xl font-semibold text-primary mb-4">Key Modules & How They Work</h3>
            <div className="space-y-6">
              <section>
                <h4 className="text-xl font-semibold text-textPrimary mb-2 border-b border-lightBorder pb-1">1. Audience Modeling</h4>
                <p className="text-textSecondary mb-2">
                  Create detailed personas to understand your audience. Use AI suggestions based on region and interests for comprehensive profiles, including demographics, psychographics, and RST traits (BAS, BIS, FFFS) to uncover deep psychological drivers.
                </p>
                <RstIntroductionGraphic />
              </section>

              <section>
                <h4 className="text-xl font-semibold text-textPrimary mb-2 border-b border-lightBorder pb-1">2. Operator Builder</h4>
                <p className="text-textSecondary mb-2">
                  Design "Operators" (e.g., Hope, Fear) based on conditioning principles. Link them to specific personas to systematically influence perceptions. AI can suggest the core components (Conditioned Stimulus, Unconditioned Stimulus, Reinforcement Loop) based on your goals.
                </p>
              </section>

              <section>
                <h4 className="text-xl font-semibold text-textPrimary mb-2 border-b border-lightBorder pb-1">3. Content Planner</h4>
                <p className="text-textSecondary mb-2">
                  Generate tailored content for multiple platforms. The AI crafts drafts, image prompts, and video ideas based on your personas and operators. You can refine and regenerate content, and even process images with meme text overlays directly in the app.
                </p>
              </section>
              
              <section>
                <h4 className="text-xl font-semibold text-textPrimary mb-2 border-b border-lightBorder pb-1">4. Feedback Simulator</h4>
                <p className="text-textSecondary mb-2">
                  Test your content before going live. The AI simulates audience reactions, providing a sentiment forecast (Positive, Neutral, Negative), an engagement prediction, and a list of potential risks to help you fine-tune your messaging.
                </p>
              </section>

              <section>
                <h4 className="text-xl font-semibold text-textPrimary mb-2 border-b border-lightBorder pb-1">5. Audit Tool</h4>
                <p className="text-textSecondary mb-2">
                  Apply the rigorous 8D (Eight Disciplines) problem-solving framework to your campaign. Provide your main objective, and the AI will generate a structured audit plan to ensure strategic alignment and risk mitigation.
                </p>
              </section>
            </div>
          </Card>

          <Card>
            <h3 className="text-2xl font-semibold text-primary mb-3">A Typical Workflow</h3>
            <ol className="list-decimal list-inside text-textSecondary ml-4 space-y-2">
              <li><strong className="text-textPrimary">Configure AI:</strong> In the Admin Panel, ensure your AI provider API keys are set up.</li>
              <li><strong className="text-textPrimary">Model Audience:</strong> Create detailed Personas in Audience Modeling.</li>
              <li><strong className="text-textPrimary">Design Operators:</strong> Craft Operators linked to your Personas in the Operator Builder.</li>
              <li><strong className="text-textPrimary">Plan Content:</strong> Generate platform-specific content drafts in the Content Planner.</li>
              <li><strong className="text-textPrimary">Simulate Feedback:</strong> Test critical messages with the Feedback Simulator.</li>
              <li><strong className="text-textPrimary">Schedule & Manage:</strong> Use the Calendar and Content Library to organize your campaign.</li>
            </ol>
          </Card>
          
          <Card className="bg-yellow-500/10 border-l-4 border-warning">
            <h3 className="text-xl font-semibold text-yellow-300 mb-2">Ethical Considerations & Disclaimer</h3>
            <p className="text-yellow-400 mb-2">
              {APP_TITLE} is a powerful tool intended for strategic planning and educational purposes. It is crucial to use the insights and capabilities provided by this platform ethically and responsibly.
            </p>
            <ul className="list-disc list-inside text-yellow-400 ml-4 space-y-1">
              <li>Users are solely responsible for ensuring their campaigns comply with all applicable laws, regulations, and platform policies.</li>
              <li>The tool should not be used for manipulative practices, spreading misinformation, or any activity that could cause harm.</li>
            </ul>
             <p className="text-yellow-300 mt-3 font-semibold">
              By using {APP_TITLE}, you acknowledge your responsibility to apply these strategies in an ethical manner.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
};