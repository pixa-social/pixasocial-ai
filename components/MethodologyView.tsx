import React from 'react';
import { Card } from './ui/Card';
import { APP_TITLE } from '../constants';
import RstIntroductionGraphic from './RstIntroductionGraphic'; // Re-import if used for specific section

export const MethodologyView: React.FC = () => {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <header className="text-center mb-10">
        <h2 className="text-4xl sm:text-5xl font-extrabold text-primary mb-3">
          {APP_TITLE} Documentation
        </h2>
        <p className="text-lg text-textSecondary max-w-3xl mx-auto">
          Your guide to mastering strategic social engagement with behavioral insights and AI.
        </p>
      </header>

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
        <h3 className="text-2xl font-semibold text-primary mb-3">Why Use {APP_TITLE}? Key Benefits & Use Cases</h3>
        <ul className="list-disc list-inside text-textSecondary ml-4 space-y-2">
          <li>
            <strong className="text-textPrimary">Deep Audience Understanding:</strong> Go beyond demographics. Model personas based on psychological drivers (RST) to understand what truly motivates your audience.
            <em className="block text-sm">Use Case: Identify if an audience is more reward-seeking (BAS) or risk-averse (BIS) to tailor messaging.</em>
          </li>
          <li>
            <strong className="text-textPrimary">Strategic Message Design:</strong> Craft "Operators" based on conditioning principles to systematically influence perceptions and behaviors.
            <em className="block text-sm">Use Case: Develop a "Hope" operator to associate your initiative with positive outcomes for a specific persona.</em>
          </li>
          <li>
            <strong className="text-textPrimary">AI-Powered Content Creation:</strong> Generate tailored content drafts, image concepts, and video ideas for multiple platforms, saving time and enhancing creativity.
            <em className="block text-sm">Use Case: Quickly produce 5 variations of an X (Twitter) post targeting different persona vulnerabilities.</em>
          </li>
          <li>
            <strong className="text-textPrimary">Predictive Feedback & Risk Assessment:</strong> Simulate potential audience reactions to your content before deployment, identifying sentiment and potential pitfalls.
            <em className="block text-sm">Use Case: Test a sensitive message to see if it might be misinterpreted or cause backlash.</em>
          </li>
          <li>
            <strong className="text-textPrimary">Structured Campaign Audits:</strong> Apply the 8D methodology to rigorously plan and troubleshoot campaigns, ensuring strategic alignment and effectiveness.
            <em className="block text-sm">Use Case: Systematically analyze why a previous campaign underperformed and develop corrective actions.</em>
          </li>
          <li>
            <strong className="text-textPrimary">Centralized Campaign Management:</strong> Plan, draft, schedule (via Calendar), and manage assets (via Content Library) all in one place.
          </li>
        </ul>
      </Card>
      
      {/* Enhanced Key Modules Section */}
      <Card>
        <h3 className="text-2xl font-semibold text-primary mb-4">Key Modules & How They Work</h3>
        <div className="space-y-6">

          {/* Audience Modeling Module Detailed */}
          <section>
            <h4 className="text-xl font-semibold text-textPrimary mb-2 border-b pb-1">1. Audience Modeling: Crafting Your Target Persona</h4>
            <p className="text-textSecondary mb-2">
              Effective campaigns begin with a profound understanding of the target audience. This module allows you to build detailed personas.
            </p>
            <p className="text-sm text-textSecondary mb-1"><strong className="text-gray-700">Key Inputs:</strong></p>
            <ul className="list-disc list-inside text-textSecondary ml-4 text-sm space-y-0.5 mb-2">
              <li>Persona Name, Region/Country focus, Key Interests (for AI).</li>
              <li>Manual input for Demographics, Psychographics, Initial Beliefs, Vulnerabilities.</li>
              <li>Manual assessment or AI suggestion for RST traits (BAS, BIS, FFFS).</li>
            </ul>
             <p className="text-sm text-textSecondary mb-1"><strong className="text-gray-700">The Process & AI's Role:</strong></p>
            <ul className="list-disc list-inside text-textSecondary ml-4 text-sm space-y-0.5 mb-2">
              <li>You can manually define all aspects of a persona or leverage AI.</li>
              <li><strong className="text-textPrimary">AI Persona Generation:</strong> Based on region and interests, the AI (e.g., Gemini) can suggest comprehensive details for demographics, psychographics, initial beliefs, potential vulnerabilities, and even estimate an RST profile. This is similar to generating realistic synthetic personal details for a specific profile.</li>
              <li>The system uses a JSON-based prompting method to instruct the AI to fill these fields. For instance, the prompt might specify:
                <br /><code className="text-xs bg-gray-100 p-1 rounded">"Generate persona details for Region: {`{region}`}, Interests: {`{interests}`}. JSON: {`{demographics: '...', rstProfile: {bas: '<Low|Medium|High>'...}}`}"</code>
              </li>
              <li><strong className="text-textPrimary">RST Integration:</strong> The Reinforcement Sensitivity Theory (BAS: Behavioral Approach System, BIS: Behavioral Inhibition System, FFFS: Fight-Flight-Freeze System) is a core component. The UI includes an <strong className="text-textPrimary">RST Introduction Graphic</strong> and allows for visual assessment of these traits. AI can also suggest these based on the persona's profile, providing a deeper psychological layer.</li>
            </ul>
            <p className="text-sm text-textSecondary mb-1"><strong className="text-gray-700">Key Outputs:</strong></p>
            <ul className="list-disc list-inside text-textSecondary ml-4 text-sm space-y-0.5">
              <li>A rich, detailed persona profile including demographics, psychographics, beliefs, vulnerabilities, and an RST assessment.</li>
              <li>A foundation for targeted operator design and content creation.</li>
            </ul>
            <RstIntroductionGraphic />
          </section>

          {/* Operator Builder Module Detailed */}
          <section>
            <h4 className="text-xl font-semibold text-textPrimary mb-2 border-b pb-1">2. Operator Builder: Designing Engagement Mechanics</h4>
            <p className="text-textSecondary mb-2">
              Apply principles of psychological conditioning (inspired by Pavlovian conditioning) to design "Operators" (e.g., Hope, Fear, Belonging) aimed at eliciting specific responses from your target personas.
            </p>
             <p className="text-sm text-textSecondary mb-1"><strong className="text-gray-700">Key Inputs:</strong></p>
            <ul className="list-disc list-inside text-textSecondary ml-4 text-sm space-y-0.5 mb-2">
              <li>Operator Name, Target Audience Persona (selected from created personas), Operator Type (e.g., Hope, Fear), Desired Conditioned Response.</li>
              <li>Manual input for Conditioned Stimulus (CS), Unconditioned Stimulus (US), Reinforcement Loop.</li>
            </ul>
            <p className="text-sm text-textSecondary mb-1"><strong className="text-gray-700">The Process & AI's Role:</strong></p>
            <ul className="list-disc list-inside text-textSecondary ml-4 text-sm space-y-0.5 mb-2">
              <li>The selected Persona's RST profile is displayed to inform Operator design.</li>
              <li><strong className="text-textPrimary">AI Suggestion for Conditioning Elements:</strong> Based on the Persona, Operator Type, and Desired CR, the AI can suggest plausible CS, US, and Reinforcement Loop ideas. For example, for a "Hope" operator targeting a high-BAS persona, the AI might suggest a CS related to novelty and a US involving social recognition.</li>
            </ul>
             <p className="text-sm text-textSecondary mb-1"><strong className="text-gray-700">Key Outputs:</strong></p>
            <ul className="list-disc list-inside text-textSecondary ml-4 text-sm space-y-0.5">
              <li>A defined Operator with specific CS, US, CR, and Reinforcement Loop, ready to be used in content planning.</li>
            </ul>
          </section>

          {/* Content Planner Module Detailed */}
          <section>
            <h4 className="text-xl font-semibold text-textPrimary mb-2 border-b pb-1">3. Content Planner: Crafting & Customizing Messages</h4>
            <p className="text-textSecondary mb-2">
              Translate your strategic Operators into tailored content for multiple platforms.
            </p>
             <p className="text-sm text-textSecondary mb-1"><strong className="text-gray-700">Key Inputs:</strong></p>
            <ul className="list-disc list-inside text-textSecondary ml-4 text-sm space-y-0.5 mb-2">
              <li>Target Persona, Campaign Operator, Global Media Type (text, image, video), Tone of Voice, Custom Instructions.</li>
              <li>Selection of target platforms (X, Facebook, Email, Poster types, etc.).</li>
            </ul>
            <p className="text-sm text-textSecondary mb-1"><strong className="text-gray-700">The Process & AI's Role:</strong></p>
            <ul className="list-disc list-inside text-textSecondary ml-4 text-sm space-y-0.5 mb-2">
              <li><strong className="text-textPrimary">Multi-Platform Content Generation:</strong> AI generates content (text, hashtags, email subjects/bodies), image prompts, meme text, and video ideas based on all inputs and platform-specific guidelines.</li>
              <li><strong className="text-textPrimary">Image Generation & Processing:</strong> For image-based content or Posters:
                <ul className="list-disc list-inside text-textSecondary ml-6 text-sm space-y-0.5">
                    <li>AI generates detailed `imagePrompt` (visual description for image model) and `memeText`.</li>
                    <li>The application can then use another AI call (e.g., to Imagen via Gemini API) to generate the actual image from the `imagePrompt`.</li>
                    <li>Client-side canvas manipulation applies the `memeText` onto the generated or uploaded image, fitting it to target dimensions for posters.</li>
                </ul>
              </li>
              <li><strong className="text-textPrimary">Iterative Refinement:</strong> Users can edit AI suggestions, regenerate content for specific platforms, or change image sources (AI-generate vs. upload).</li>
            </ul>
            <p className="text-sm text-textSecondary mb-1"><strong className="text-gray-700">Key Outputs:</strong></p>
            <ul className="list-disc list-inside text-textSecondary ml-4 text-sm space-y-0.5">
              <li>A set of platform-specific content drafts, including text and media concepts/processed images.</li>
              <li>Saved drafts that can be scheduled via the Calendar or further refined.</li>
            </ul>
          </section>
          
          {/* Feedback Simulator Module Detailed */}
          <section>
            <h4 className="text-xl font-semibold text-textPrimary mb-2 border-b pb-1">4. Feedback Simulator: Anticipating Audience Reactions</h4>
            <p className="text-textSecondary mb-2">
              Test your content against a target persona to predict potential feedback before going live.
            </p>
            <p className="text-sm text-textSecondary mb-1"><strong className="text-gray-700">Key Inputs:</strong></p>
            <ul className="list-disc list-inside text-textSecondary ml-4 text-sm space-y-0.5 mb-2">
              <li>Target Persona, Content to simulate (text, or select from saved drafts).</li>
            </ul>
            <p className="text-sm text-textSecondary mb-1"><strong className="text-gray-700">The Process & AI's Role:</strong></p>
            <ul className="list-disc list-inside text-textSecondary ml-4 text-sm space-y-0.5 mb-2">
              <li>AI analyzes the content in the context of the selected Persona's profile (demographics, psychographics, beliefs, vulnerabilities, RST).</li>
              <li>The AI returns a JSON object predicting sentiment distribution, engagement level, and potential risks.</li>
            </ul>
            <p className="text-sm text-textSecondary mb-1"><strong className="text-gray-700">Key Outputs:</strong></p>
            <ul className="list-disc list-inside text-textSecondary ml-4 text-sm space-y-0.5">
              <li>A visual (pie chart) and textual summary of predicted sentiment (Positive, Neutral, Negative).</li>
              <li>An engagement forecast (Low, Medium, High).</li>
              <li>A list of potential risks or misinterpretations.</li>
            </ul>
          </section>

          {/* Audit Tool Module Detailed */}
          <section>
            <h4 className="text-xl font-semibold text-textPrimary mb-2 border-b pb-1">5. Audit Tool: Ensuring Strategic Rigor</h4>
            <p className="text-textSecondary mb-2">
              Apply the <strong className="text-textPrimary">8D (Eight Disciplines) Problem-Solving Process</strong> to your campaign planning for thoroughness and risk mitigation.
            </p>
            <p className="text-sm text-textSecondary mb-1"><strong className="text-gray-700">Key Inputs:</strong></p>
            <ul className="list-disc list-inside text-textSecondary ml-4 text-sm space-y-0.5 mb-2">
              <li>Overall Campaign Objective or Problem Statement.</li>
            </ul>
            <p className="text-sm text-textSecondary mb-1"><strong className="text-gray-700">The Process & AI's Role:</strong></p>
            <ul className="list-disc list-inside text-textSecondary ml-4 text-sm space-y-0.5 mb-2">
              <li>AI generates actionable content for each of the 8D steps (D0: Plan, D1: Establish Team, ..., D8: Congratulate Team) based on the provided objective.</li>
              <li>The AI is prompted to return a JSON object where keys are step IDs (D0-D8) and values are the detailed content for each step.</li>
            </ul>
            <p className="text-sm text-textSecondary mb-1"><strong className="text-gray-700">Key Outputs:</strong></p>
            <ul className="list-disc list-inside text-textSecondary ml-4 text-sm space-y-0.5">
              <li>A structured 8D audit plan, exportable as Markdown or text.</li>
              <li>A framework for systematically addressing campaign challenges and opportunities.</li>
            </ul>
          </section>
        </div>
      </Card>

      <Card>
        <h3 className="text-2xl font-semibold text-primary mb-3">Getting Started: A Typical Workflow</h3>
        <ol className="list-decimal list-inside text-textSecondary ml-4 space-y-2">
          <li>
            <strong className="text-textPrimary">Configure AI Provider (Admin Panel):</strong> Ensure your AI provider (e.g., Gemini) is set up with a valid API key. This is crucial for all AI-assisted features.
          </li>
          <li>
            <strong className="text-textPrimary">Model Your Audience (Audience Modeling):</strong> Create one or more detailed Personas. Use AI suggestions for depth. Pay attention to the RST profiles.
          </li>
          <li>
            <strong className="text-textPrimary">Design Operators (Operator Builder):</strong> For each Persona, design Operators that align with your campaign goals. Let AI suggest CS, US, and reinforcement loops.
          </li>
          <li>
            <strong className="text-textPrimary">Plan Content (Content Planner):</strong> Select a Persona and Operator, then use AI to generate content drafts for various platforms. Refine image prompts and meme text. Process and save images.
          </li>
          <li>
            <strong className="text-textPrimary">Simulate Feedback (Feedback Simulator):</strong> Test key content pieces against your Personas to anticipate reactions and refine your messaging.
          </li>
          <li>
            <strong className="text-textPrimary">Schedule Posts (Calendar):</strong> Once satisfied, schedule your content drafts for deployment using the Calendar view. Update post statuses as they go live.
          </li>
          <li>
            <strong className="text-textPrimary">Manage Assets (Content Library):</strong> Upload and organize reusable media assets (images, videos). Push processed images from the Content Planner directly to the library.
          </li>
          <li>
            <strong className="text-textPrimary">Collaborate (Team Chat):</strong> Discuss strategies, share insights, and coordinate with your team in real-time.
          </li>
          <li>
            <strong className="text-textPrimary">Audit Your Plan (Audit Tool):</strong> At any stage, especially for complex campaigns, use the Audit Tool to apply the 8D framework for robust planning.
          </li>
           <li>
            <strong className="text-textPrimary">Manage Settings (Settings):</strong> Simulate connecting social accounts and manage your user profile (e.g., wallet address, team members).
          </li>
        </ol>
      </Card>
      
      <Card>
        <h3 className="text-2xl font-semibold text-primary mb-3">Understanding AI in {APP_TITLE}</h3>
        <p className="text-textSecondary mb-2">
          {APP_TITLE} integrates Large Language Models (LLMs) and Image Generation Models primarily from Google (Gemini and Imagen). The specific models used are defined in <code className="text-xs bg-gray-100 p-1 rounded">constants.ts</code> (e.g., <code className="text-xs bg-gray-100 p-1 rounded">GEMINI_TEXT_MODEL_NAME</code>).
        </p>
        <ul className="list-disc list-inside text-textSecondary ml-4 space-y-1 mb-3">
          <li>
            <strong className="text-textPrimary">API Key Management:</strong> API keys for AI services are managed in the <strong className="text-textPrimary">Admin Panel</strong>. These keys are stored in your browser's local storage. For Google Gemini, the application can also utilize a pre-configured environment variable (<code className="text-xs bg-gray-100 p-1 rounded">process.env.API_KEY</code>) if available, which is a more secure method if the app were deployed with a backend.
          </li>
          <li>
            <strong className="text-textPrimary">Prompt Engineering:</strong> The application constructs detailed prompts sent to the AI, often requesting JSON-formatted responses for structured data (e.g., persona details, audit plans, feedback simulations) or specific text/image outputs for content. System instructions guide the AI's persona and output style.
          </li>
          <li>
            <strong className="text-textPrimary">Client-Side AI Calls:</strong> In this prototype, AI API calls are made directly from the client-side (browser) via <code className="text-xs bg-gray-100 p-1 rounded">aiService.ts</code>. In a production environment, these would be proxied through a backend server to protect API keys and manage usage.
          </li>
        </ul>
        <p className="text-textSecondary">
          The goal of AI integration is to augment your strategic capabilities, streamline content creation, and provide data-driven insights for more effective campaigns.
        </p>
      </Card>

      <Card className="bg-amber-50 border-l-4 border-warning">
        <h3 className="text-xl font-semibold text-amber-700 mb-2">Ethical Considerations & Disclaimer</h3>
        <p className="text-amber-600 mb-2">
          {APP_TITLE} is a powerful tool intended for strategic planning, simulation, and educational purposes. It is crucial to use the insights and capabilities provided by this platform ethically and responsibly.
        </p>
        <ul className="list-disc list-inside text-amber-600 ml-4 space-y-1">
          <li>Users are solely responsible for ensuring their campaigns comply with all applicable laws, regulations, and platform policies.</li>
          <li>The tool should not be used for manipulative practices, spreading misinformation, or any activity that could cause harm.</li>
          <li>The objective should always be to foster positive, constructive, and transparent engagement.</li>
        </ul>
         <p className="text-amber-600 mt-3 font-semibold">
          By using {APP_TITLE}, you acknowledge your responsibility to apply these strategies in an ethical manner. All data is stored locally in your browser.
        </p>
      </Card>
    </div>
  );
};
