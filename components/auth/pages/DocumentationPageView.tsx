
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

          <Card>
            <h3 className="text-2xl font-semibold text-primary mb-3">Technology and Features</h3>
            <p className="text-textSecondary mb-4">
              At PixaSocial, we are committed to delivering a diverse and personalized user experience through innovative technologies. Our platform integrates advanced datasets and psychological frameworks to enhance the realism and inclusivity of our AI-driven interactions.
            </p>

            <h4 className="text-xl font-semibold text-textPrimary mt-4 mb-2">Nemotron Integration with NVIDIA</h4>
            <img src="https://i.ibb.co/HfZy6Cr1/nemotron-persona-approach.png" alt="Nemotron Persona Approach" className="w-full h-auto rounded-lg shadow-md my-4" />
            <p className="text-textSecondary mb-2">
              We have incorporated the Nemotron dataset, developed by NVIDIA, into our backend. This dataset consists of personas that reflect real-world demographic, geographic, and personality trait distributions. By leveraging Nemotron, we ensure that our AI models are trained on diverse and representative data, enabling us to:
            </p>
            <ul className="list-disc list-inside text-textSecondary ml-4 space-y-1 mb-3">
              <li>Enhance the diversity of synthetic data used in our platform.</li>
              <li>Mitigate biases in our AI systems by including a wide range of personas.</li>
              <li>Improve the realism of user interactions through detailed and varied persona profiles.</li>
            </ul>
            <p className="text-textSecondary mb-3">The Nemotron dataset is licensed under CC BY 4.0, and we gratefully acknowledge NVIDIA for providing this valuable resource.</p>

            <h5 className="text-lg font-semibold text-textPrimary mt-4 mb-2">Dataset Details</h5>
            <ul className="list-disc list-inside text-textSecondary ml-4 space-y-1 mb-3">
                <li>100k records with 22 fields: 6 persona fields and 16 contextual fields</li>
                <li>~54M tokens, including ~23.6M persona tokens</li>
                <li>Comprehensive coverage across demographic, geographic, and personality trait axes</li>
                <li>Over 560 distinct professional occupations, all grounded in real-world distributions</li>
            </ul>
            <p className="text-textSecondary mb-4">The dataset includes 22 fields: 6 persona fields and 16 contextual fields shown below.</p>
            <img src="https://i.ibb.co/BHmmJyPM/nemotron-personas-schema.png" alt="Nemotron Persona Schema" className="w-full h-auto rounded-lg shadow-md my-4" />
            
            <h4 className="text-xl font-semibold text-textPrimary mt-6 mb-2">OCEAN Personality Model</h4>
            <p className="text-textSecondary mb-3">To further personalize user experiences, our platform draws on insights from the OCEAN personality model, a widely recognized framework in psychology. OCEAN stands for:</p>
             <ul className="list-disc list-inside text-textSecondary ml-4 space-y-1 mb-3">
              <li><strong>Openness:</strong> Reflects creativity, curiosity, and a willingness to embrace new experiences.</li>
              <li><strong>Conscientiousness:</strong> Measures organization, dependability, and self-discipline.</li>
              <li><strong>Extraversion:</strong> Indicates sociability, assertiveness, and energy in social settings.</li>
              <li><strong>Agreeableness:</strong> Assesses kindness, cooperation, and empathy.</li>
              <li><strong>Neuroticism:</strong> Gauges emotional stability and the tendency to experience negative emotions.</li>
            </ul>
            <img src="https://research-assets.cbinsights.com/2021/06/11005852/ocean-cambridge-min.png" alt="OCEAN Personality Model" className="w-full h-auto rounded-lg shadow-md my-4" />
            <p className="text-textSecondary mb-4">By incorporating these personality dimensions, we can tailor our services to better meet the unique needs and preferences of our users, creating more engaging and effective interactions.</p>

            <h4 className="text-xl font-semibold text-textPrimary mt-6 mb-2">Age distribution</h4>
            <p className="text-textSecondary mb-3">The distribution of our persona ages takes the form of a bulging population pyramid that reflects historical birth rates, mortality trends, and migration patterns. This is in stark contrast to a bell curve distribution typically produced by an LLM alone. Overall the distribution is right-skewed and distinctly non-Gaussian. Note that minors are excluded from this dataset (see the Ethics section below).</p>
            <img src="https://huggingface.co/datasets/nvidia/Nemotron-4-340B-Reward/resolve/main/nemotron_personas_age_group_distribution.png" alt="Age Distribution Chart" className="w-full h-auto rounded-lg shadow-md my-4" />

            <h4 className="text-xl font-semibold text-textPrimary mt-6 mb-2">Marital Status by Age Group</h4>
            <p className="text-textSecondary mb-3">The heatmap below displays the fraction of people for each age cohort who are (1) never married, (2) currently married, (3) separated, (4) divorced, or (5) widowed. It highlights how marital status shifts over the life course in the US with “never married” dominating late teens and early twenties, “married” climbing rapidly in twenties and peaking in mid-fourties, divorced and widowed being much more pronounced in later stages of life. All of these considerations are of relevance to informing life experiences and personas.</p>
            <img src="https://i.ibb.co/zWj9r6Lm/nemotron-personas-marital-status-distribution.png" alt="Marital Status Distribution Chart" className="w-full h-auto rounded-lg shadow-md my-4" />

            <h4 className="text-xl font-semibold text-textPrimary mt-6 mb-2">Education Level by Age Group</h4>
            <p className="text-textSecondary mb-3">The heatmap below captures intricate patterns of educational attainment across age cohorts. For example, note how the share of high-school-only and no-diploma individuals ebbs then resurges among the oldest age groups, reflecting historical shifts in access and in social norms.</p>
            <img src="https://huggingface.co/datasets/nvidia/Nemotron-4-340B-Reward/resolve/main/nemotron_personas_education_distribution.png" alt="Education Level Distribution Chart" className="w-full h-auto rounded-lg shadow-md my-4" />

            <h4 className="text-xl font-semibold text-textPrimary mt-6 mb-2">Occupational Categories</h4>
            <p className="text-textSecondary mb-3">The treemap below reflects the richness of our dataset with respect to professional occupations of personas. Represented in our dataset are over 560 occupation categories that are further informed by demographic and geographic distributions.</p>
            <img src="https://i.ibb.co/TM6gn3CR/nemotron-personas-occupation-tree-map.png" alt="Occupational Categories Treemap" className="w-full h-auto rounded-lg shadow-md my-4" />

            <h4 className="text-xl font-semibold text-textPrimary mt-6 mb-2">Persona diversity</h4>
            <p className="text-textSecondary mb-3">The attributes above (and many more) ultimately affect the diversity of the personas being generated. As an example, the analysis below highlights a multitude of clusters within professional persona descriptions. These clusters are identified by clustering embeddings and reducing dimensionality to 2D.</p>
            <img src="https://i.ibb.co/BHmmJyPM/nemotron-personas-schema.png" alt="Persona Diversity Clustering Chart" className="w-full h-auto rounded-lg shadow-md my-4" />

            <h4 className="text-xl font-semibold text-textPrimary mt-6 mb-2">Ethical Considerations:</h4>
            <p className="text-textSecondary mb-3">Pixasocial believes Trustworthy AI is a shared responsibility and we have established policies and practices to enable development for a wide array of AI applications.</p>
            
            <h4 className="text-xl font-semibold text-textPrimary mt-6 mb-2">How We Use These Technologies</h4>
            <p className="text-textSecondary mb-3">The combination of Nemotron and the OCEAN model allows us to create nuanced user profiles that enhance the functionality of our platform. Whether it’s personalizing content, improving user engagement, or ensuring inclusivity, these technologies are integral to our mission of providing a cutting-edge social experience.</p>
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
