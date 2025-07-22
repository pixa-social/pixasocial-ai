
import React from 'react';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Brain, Target, Zap, Users, TrendingUp, Clock } from 'lucide-react';

interface SectionProps {
  className?: string;
}

const PixaSocialSections: React.FC<SectionProps> = ({ className = "" }) => {
  return (
    <div className={`w-full bg-background ${className}`}>
      {/* Section 1 */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Badge variant="outline" className="px-4 py-2 text-sm font-medium">
                <Brain className="w-4 h-4 mr-2" />
                AI-Powered Personalization
              </Badge>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-8 leading-tight">
              PixaSocial writes, designs and schedules posts that speak to the{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                hidden personality traits
              </span>{' '}
              of each micro-segment of your audience—so every scroll stops, every click converts.
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <Card className="p-6 border-border bg-card hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg mb-4 mx-auto">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Micro-Targeting</h3>
                <p className="text-muted-foreground text-sm">
                  Identify and target specific personality segments within your audience for maximum engagement.
                </p>
              </Card>
              
              <Card className="p-6 border-border bg-card hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg mb-4 mx-auto">
                  <Zap className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Instant Impact</h3>
                <p className="text-muted-foreground text-sm">
                  Every scroll stops and every click converts with psychologically-tuned content.
                </p>
              </Card>
              
              <Card className="p-6 border-border bg-card hover:shadow-lg transition-shadow duration-300">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg mb-4 mx-auto">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Higher Conversions</h3>
                <p className="text-muted-foreground text-sm">
                  Automated content creation that speaks directly to your audience's psychological triggers.
                </p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2 */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <Badge variant="outline" className="px-4 py-2 text-sm font-medium">
                <Users className="w-4 h-4 mr-2" />
                Science-Backed Approach
              </Badge>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 leading-tight">
              Stop guessing what to post. Our AI reads your target demographic personalities and writes messages that trigger the{' '}
              <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                exact dopamine path
              </span>{' '}
              that makes them click.
            </h2>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Based on peer-reviewed OCEAN + RST models, PixaSocial builds psychographic personas in less than 20 seconds and auto-generates posts, emails and banners tuned to each persona.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <Card className="p-6 border-border bg-card">
                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex-shrink-0">
                    <Brain className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">OCEAN Model Analysis</h3>
                    <p className="text-muted-foreground text-sm">
                      Leverages the Big Five personality traits (Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism) for precise audience segmentation.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-border bg-card">
                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex-shrink-0">
                    <Target className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">RST Framework</h3>
                    <p className="text-muted-foreground text-sm">
                      Applies Reinforcement Sensitivity Theory to understand motivation patterns and create content that triggers specific behavioral responses.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-border bg-card">
                <div className="flex items-start space-x-4">
                  <div className="flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex-shrink-0">
                    <Clock className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">20-Second Personas</h3>
                    <p className="text-muted-foreground text-sm">
                      Rapid psychographic analysis that instantly creates detailed audience personas and generates tailored content across all channels.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            <div className="lg:pl-8">
              <Card className="p-8 border-border bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-6">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    Dopamine-Driven Content
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Our AI understands the neurochemical triggers that drive engagement, creating content that naturally compels your audience to take action.
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">98%</div>
                      <div className="text-xs text-muted-foreground">Accuracy</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-600">3x</div>
                      <div className="text-xs text-muted-foreground">Engagement</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">20s</div>
                      <div className="text-xs text-muted-foreground">Setup Time</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PixaSocialSections;