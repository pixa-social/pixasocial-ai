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
            <img src="https://cdn-lfs-us-1.hf.co/repos/21/01/21012328ed6d7508551c7ed69fbab62974022535264bbffd089260171f3d90f5/52dc13a40f19f600f5f32277e137d0aae896950d1cbff6cfa96a00e50c1ffd9d?response-content-disposition=inline%3B+filename*%3DUTF-8''nemotron_persona_approach.png%3B+filename%3D%22nemotron_persona_approach.png%22%3B&response-content-type=image%2Fpng&Expires=1752263707&Policy=eyJTdGF0ZW1lbnQiOlt7IkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc1MjI2MzcwN319LCJSZXNvdXJjZSI6Imh0dHBzOi8vY2RuLWxmcy11cy0xLmhmLmNvL3JlcG9zLzIxLzAxLzIxMDEyMzI4ZWQ2ZDc1MDg1NTFjN2VkNjlmYmFiNjI5NzQwMjI1MzUyNjRiYmZmZDA4OTI2MDE3MWYzZDkwZjUvNTJkYzEzYTQwZjE5ZjYwMGY1ZjMyMjc3ZTEzN2QwYWFlODk2OTUwZDFjYmZmNmNmYTk2YTAwZTUwYzFmZmQ5ZD9yZXNwb25zZS1jb250ZW50LWRpc3Bvc2l0aW9uPSomcmVzcG9uc2UtY29udGVudC10eXBlPSoifV19&Signature=tvhK77SZo-8K8nbZ9UWwq-IU2bXlS9NXzbxNHid-VLjJ978z1uQEvOXIsrL7t7zCBF4pf2Pj5IZs7xTUKgGHQwqSGE64UWS1lcLLNl7%7EIuHtWlPpEuMNhAvr18UCX0xC9rv1fLsmx0dPLkJOFAws0qB%7EroNI5IEbCeyP5M-3PPhXhSK6c6h0TcTbNh38O5gA1q524dQ5Em9lzY4UCEqK61pj8h14zU8BE1l1HlosrZBwSYfzfAWry7mbgtFV610pIZ18OXzBskBjoO7DXifqNVDi63EswZ50dH4JJb5Sa3ON1q5eYACAlqtFrAU6OcxVF%7E5m%7EuL%7ENOv-7CY8wIxcVw__&Key-Pair-Id=K24J24Z295AEI9" alt="Nemotron Persona Approach" className="w-full h-auto rounded-lg shadow-md my-4" />
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
            <img src="https://cdn-lfs-us-1.hf.co/repos/21/01/21012328ed6d7508551c7ed69fbab62974022535264bbffd089260171f3d90f5/34f31b46611963133f2b9a78f9e04b05dd8a5b88fdfc317225535556b431ed27?response-content-disposition=inline%3B+filename*%3DUTF-8''nemotron_personas_schema.png%3B+filename%3D%22nemotron_personas_schema.png%22%3B&response-content-type=image%2Fpng&Expires=1752263772&Policy=eyJTdGF0ZW1lbnQiOlt7IkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc1MjI2Mzc3Mn19LCJSZXNvdXJjZSI6Imh0dHBzOi8vY2RuLWxmcy11cy0xLmhmLmNvL3JlcG9zLzIxLzAxLzIxMDEyMzI4ZWQ2ZDc1MDg1NTFjN2VkNjlmYmFiNjI5NzQwMjI1MzUyNjRiYmZmZDA4OTI2MDE3MWYzZDkwZjUvMzRmMzFiNDY2MTE5NjMxMzNmMmI5YTc4ZjllMDRiMDVkZDhhNWI4OGZkZmMzMTcyMjU1MzU1NTZiNDMxZWQyNz9yZXNwb25zZS1jb250ZW50LWRpc3Bvc2l0aW9uPSomcmVzcG9uc2UtY29udGVudC10eXBlPSoifV19&Signature=rzaWYE%7EK6cSR058MkvGpX7Yh90C2OJqNEZIiQOn60R9eLGFbltTRkdDI5CHILkKQ0rENawMTeNzsZHHFZUHMBGQSp0EAqwN9%7EzvbeUFC1-UY4w7W4tXxAAjCPXAjJpczJMbmi5AKBVYm6lsnLspSFiEK%7EB3Za2DIIYHUoF2t6ipx0DWhV3yoPyY5ihZ-l5K%7E32zYYVw0ExDin6TKRE8exz8C2Qx0Y0lTbbi54ILnFgWfZFiM9X9DXG5LZHjX9XswR4Z9h2BEtp8KX6OkTap09WxOClSoZusx7T9nxEYBMt5iHbrHJKqrn0ogbajZXwR81YA-riJufjym5rYn5ar23Q__&Key-Pair-Id=K24J24Z295AEI9" alt="Nemotron Persona Schema" className="w-full h-auto rounded-lg shadow-md my-4" />
            
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
            <img src="https://cdn-lfs-us-1.hf.co/repos/21/01/21012328ed6d7508551c7ed69fbab62974022535264bbffd089260171f3d90f5/8524d3b3deb70ede6dccff09a509480edfc68f12d66b9841d257eb5ca4c0ec70?response-content-disposition=inline%3B+filename*%3DUTF-8''nemotron_personas_age_group_distribution.png%3B+filename%3D%22nemotron_personas_age_group_distribution.png%22%3B&response-content-type=image%2Fpng&Expires=1752263866&Policy=eyJTdGF0ZW1lbnQiOlt7IkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc1MjI2Mzg2Nn19LCJSZXNvdXJjZSI6Imh0dHBzOi8vY2RuLWxmcy11cy0xLmhmLmNvL3JlcG9zLzIxLzAxLzIxMDEyMzI4ZWQ2ZDc1MDg1NTFjN2VkNjlmYmFiNjI5NzQwMjI1MzUyNjRiYmZmZDA4OTI2MDE3MWYzZDkwZjUvODUyNGQzYjNkZWI3MGVkZTZkY2NmZjA5YTUwOTQ4MGVkZmM2OGYxMmQ2NmI5ODQxZDI1N2ViNWNhNGMwZWM3MD9yZXNwb25zZS1jb250ZW50LWRpc3Bvc2l0aW9uPSomcmVzcG9uc2UtY29udGVudC10eXBlPSoifV19&Signature=uOpvkw05DUgri%7EAIsAmNxdAcP9g97b5OuBfVUhn4u8poGfcU4vbkOT2Uwrnz0KSu-1uTAgm9xzQyO3htTCOH9xlW-siXzRSZDIiF9Sl%7E3I%7EAhNg6BWZ0D5XTeNbz6kenk26LC9m3MgkW6whUL6HlC5gmB0N-V425j6ldpMpsvV-WFbfYVrhABHvp7X7jjkvgj4mznceY%7EghyBCKPIifixR%7EBpsPYi-%7EvTO%7ExVtiaclQk1--LzUDBEeGJrtbyoeQ68r6EqV3EzUIhLjqMJZAVs7K3Jk3g6h3D%7EzINW6jVjevpf-Y69AnKFCf3Y7IQAt5ZBBPNE47rP5L36EbZ%7EL5uHQ__&Key-Pair-Id=K24J24Z295AEI9" alt="Age Distribution Chart" className="w-full h-auto rounded-lg shadow-md my-4" />

            <h4 className="text-xl font-semibold text-textPrimary mt-6 mb-2">Marital Status by Age Group</h4>
            <p className="text-textSecondary mb-3">The heatmap below displays the fraction of people for each age cohort who are (1) never married, (2) currently married, (3) separated, (4) divorced, or (5) widowed. It highlights how marital status shifts over the life course in the US with “never married” dominating late teens and early twenties, “married” climbing rapidly in twenties and peaking in mid-fourties, divorced and widowed being much more pronounced in later stages of life. All of these considerations are of relevance to informing life experiences and personas.</p>
            <img src="https://cdn-lfs-us-1.hf.co/repos/21/01/21012328ed6d7508551c7ed69fbab62974022535264bbffd089260171f3d90f5/7c40d8a9b1e1a8e4e6353518e6d2a86e1e75d4897ea430b53a5099cd798af515?response-content-disposition=inline%3B+filename*%3DUTF-8''nemotron_personas_marital_status_distribution.png%3B+filename%3D%22nemotron_personas_marital_status_distribution.png%22%3B&response-content-type=image%2Fpng&Expires=1752263906&Policy=eyJTdGF0ZW1lbnQiOlt7IkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc1MjI2MzkwNn19LCJSZXNvdXJjZSI6Imh0dHBzOi8vY2RuLWxmcy11cy0xLmhmLmNvL3JlcG9zLzIxLzAxLzIxMDEyMzI4ZWQ2ZDc1MDg1NTFjN2VkNjlmYmFiNjI5NzQwMjI1MzUyNjRiYmZmZDA4OTI2MDE3MWYzZDkwZjUvN2M0MGQ4YTliMWUxYThlNGU2MzUzNTE4ZTZkMmE4NmUxZTc1ZDQ4OTdlYTQzMGI1M2E1MDk5Y2Q3OThhZjUxNT9yZXNwb25zZS1jb250ZW50LWRpc3Bvc2l0aW9uPSomcmVzcG9uc2UtY29udGVudC10eXBlPSoifV19&Signature=vKanOFVlPl3IyY56wlr00AWIuHVaz%7ExngCk0xSpvaUKvx-Cc7%7Es46FlIhs5BVdlwoE5q%7EyFaF0g709BvgjanIyRwuB5yjDVDwNn7wGPlzawyh7XZ6m4YjqtVJdlUzkmYkXiPwOG7l8%7ELr2v5Y7AgL4DxsyRQ8Xo68AiRQfaVTFv7m8SE1Kw9zhFss-ps64qiVjS73JGg3EHv0fiplqoBB0YExNWShPpW%7EAUjF9ZbHmkEgeNlLtsr48OlmoJz%7EfZXxkZy1S3NgggLEB02mOjRsP2JJMiXg-U0-MtHjTFkzwjobxrMqJDwXBJv9v5XjfY%7ER0K0m0yGUYEcPXZ8c%7E5ScA__&Key-Pair-Id=K24J24Z295AEI9" alt="Marital Status Distribution Chart" className="w-full h-auto rounded-lg shadow-md my-4" />

            <h4 className="text-xl font-semibold text-textPrimary mt-6 mb-2">Education Level by Age Group</h4>
            <p className="text-textSecondary mb-3">The heatmap below captures intricate patterns of educational attainment across age cohorts. For example, note how the share of high-school-only and no-diploma individuals ebbs then resurges among the oldest age groups, reflecting historical shifts in access and in social norms.</p>
            <img src="https://cdn-lfs-us-1.hf.co/repos/21/01/21012328ed6d7508551c7ed69fbab62974022535264bbffd089260171f3d90f5/1f7be5d51fc36774d553b3fff0111345eb56a2abac2c3004a4f023212c2f7b5b?response-content-disposition=inline%3B+filename*%3DUTF-8''nemotron_personas_education_distribution.png%3B+filename%3D%22nemotron_personas_education_distribution.png%22%3B&response-content-type=image%2Fpng&Expires=1752263943&Policy=eyJTdGF0ZW1lbnQiOlt7IkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc1MjI2Mzk0M319LCJSZXNvdXJjZSI6Imh0dHBzOi8vY2RuLWxmcy11cy0xLmhmLmNvL3JlcG9zLzIxLzAxLzIxMDEyMzI4ZWQ2ZDc1MDg1NTFjN2VkNjlmYmFiNjI5NzQwMjI1MzUyNjRiYmZmZDA4OTI2MDE3MWYzZDkwZjUvMWY3YmU1ZDUxZmMzNjc3NGQ1NTNiM2ZmZjAxMTEzNDVlYjU2YTJhYmFjMmMzMDA0YTRmMDIzMjEyYzJmN2I1Yj9yZXNwb25zZS1jb250ZW50LWRpc3Bvc2l0aW9uPSomcmVzcG9uc2UtY29udGVudC10eXBlPSoifV19&Signature=Y2BV4hYdIF-Dl8iuVg1YgGb287znWBDz%7EU4tGD92k9VdY5Xup-I-YCmwdcFd2Sk1xBrq2YQD6KppuCgHvRs2LWzIBY%7ERYIo9OBtLNTZ65TIeiO4pomWITdlnTwnGmp9QeBfXpqvoaz8xVobPLopCQj-9Ux1ymcXDYj3pG4KmXi4J2NUN8Cl3BKtNKoAmrcaL4qaOUWRcSuHZTBwoCT8gvHhHI9DBjKlhytPPliJXxqWQhzFOyhJ5SjyG-cMRGY74DOfYcV42tuHHHcG5fHyPZ8EQfEEZMg81C9bNgKrJ6tRuYGyTw1F9KJS6TYZSurg63uzA%7EJGp8JcOaIv4qfr5HA__&Key-Pair-Id=K24J24Z295AEI9" alt="Education Level Distribution Chart" className="w-full h-auto rounded-lg shadow-md my-4" />

            <h4 className="text-xl font-semibold text-textPrimary mt-6 mb-2">Occupational Categories</h4>
            <p className="text-textSecondary mb-3">The treemap below reflects the richness of our dataset with respect to professional occupations of personas. Represented in our dataset are over 560 occupation categories that are further informed by demographic and geographic distributions.</p>
            <img src="https://cdn-lfs-us-1.hf.co/repos/21/01/21012328ed6d7508551c7ed69fbab62974022535264bbffd089260171f3d90f5/b5dacd5ff4171466eb5efc86d6304241b842beb02bfed77605c2a58b55d4843d?response-content-disposition=inline%3B+filename*%3DUTF-8''nemotron_personas_occupation_tree_map.png%3B+filename%3D%22nemotron_personas_occupation_tree_map.png%22%3B&response-content-type=image%2Fpng&Expires=1752264009&Policy=eyJTdGF0ZW1lbnQiOlt7IkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc1MjI2NDAwOX19LCJSZXNvdXJjZSI6Imh0dHBzOi8vY2RuLWxmcy11cy0xLmhmLmNvL3JlcG9zLzIxLzAxLzIxMDEyMzI4ZWQ2ZDc1MDg1NTFjN2VkNjlmYmFiNjI5NzQwMjI1MzUyNjRiYmZmZDA4OTI2MDE3MWYzZDkwZjUvYjVkYWNkNWZmNDE3MTQ2NmViNWVmYzg2ZDYzMDQyNDFiODQyYmViMDJiZmVkNzc2MDVjMmE1OGI1NWQ0ODQzZD9yZXNwb25zZS1jb250ZW50LWRpc3Bvc2l0aW9uPSomcmVzcG9uc2UtY29udGVudC10eXBlPSoifV19&Signature=KSyi9gLF4m%7Es-ckXBjc8tjOXKtN4KBZ%7EdIE1tJO4J5slVdo8p35Npjnb69ETXXj3Hx4fYj-ohiJuc5NfCwIZxxVXF0iXJq1ynZUI0xjWwl9cB3AJnVj0fA4BI-FyMPIuDTTRIZvq3ZuPqIIXh07PXqrCxnAOCwGSjHP1j8cPKuAuA2c8AbEKtex-emWiG5SCgvPxqJVyI7eWmqbuN6DTA7FE1qyD6PGGXkp6ZnCM0Zjbkv4Vaod97ZUICz6-Ic21APjL4UBwW3lwq4fTRGAFP1hAsQ9z8mAMrMRGQ3KkH2jO1K8uQf90ICNkCFKEzHV12dEGzakPi2lE7EeIpCCaMw__&Key-Pair-Id=K24J24Z295AEI9" alt="Occupational Categories Treemap" className="w-full h-auto rounded-lg shadow-md my-4" />

            <h4 className="text-xl font-semibold text-textPrimary mt-6 mb-2">Persona diversity</h4>
            <p className="text-textSecondary mb-3">The attributes above (and many more) ultimately affect the diversity of the personas being generated. As an example, the analysis below highlights a multitude of clusters within professional persona descriptions. These clusters are identified by clustering embeddings and reducing dimensionality to 2D.</p>
            <img src="https://cdn-lfs-us-1.hf.co/repos/21/01/21012328ed6d7508551c7ed69fbab62974022535264bbffd089260171f3d90f5/57377bb2b82f9ffe674e96d72cba9e907dac1a0e77449781d4d26c2a44344e05?response-content-disposition=inline%3B+filename*%3DUTF-8''nemotron_personas_professional_personas_clustering.png%3B+filename%3D%22nemotron_personas_professional_personas_clustering.png%22%3B&response-content-type=image%2Fpng&Expires=1752264055&Policy=eyJTdGF0ZW1lbnQiOlt7IkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc1MjI2NDA1NX19LCJSZXNvdXJjZSI6Imh0dHBzOi8vY2RuLWxmcy11cy0xLmhmLmNvL3JlcG9zLzIxLzAxLzIxMDEyMzI4ZWQ2ZDc1MDg1NTFjN2VkNjlmYmFiNjI5NzQwMjI1MzUyNjRiYmZmZDA4OTI2MDE3MWYzZDkwZjUvNTczNzdiYjJiODJmOWZmZTY3NGU5NmQ3MmNiYTllOTA3ZGFjMWEwZTc3NDQ5NzgxZDRkMjZjMmE0NDM0NGUwNT9yZXNwb25zZS1jb250ZW50LWRpc3Bvc2l0aW9uPSomcmVzcG9uc2UtY29udGVudC10eXBlPSoifV19&Signature=XI3jRKtVOvz8kaXmAydWUqMXxkMRrztcLB63he6EmMPWO3g6cqSK5rUGv3KG-MtYrNc%7E3WzvtQz%7EQRzjwdVTD7xQ7upcoQUzEm3Bq%7EYu573%7El5d9TW6HlrhCv5hTmV077BMxY3aU41WKXRIpYiTS95jJeP685M7BzDana2m9YmK-qKfknPTaRTaFce4vfzm8H4aZCmMZK3HM3DUs4vp5lAFZTGZiFBFnlUma6SYTYXwkJagDaw6spF2lT0bMXWMcUDImnO8qldM3zF0lYMVTwkQaZZPPTkZoSKbmJP5JxVxtzw13Zlc8nhE8k5vOUcrbMkZKEKr90dVWYoT9qOBKsQ__&Key-Pair-Id=K24J24Z295AEI9" alt="Persona Diversity Clustering Chart" className="w-full h-auto rounded-lg shadow-md my-4" />

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