
import React from 'react';
import { Card } from '../../ui/Card';

/**
 * A section for the homepage that highlights the banner generation feature.
 * It displays an example banner image on the left with its generating prompt,
 * and descriptive marketing text on the right.
 */
export const BannerFeatureSection: React.FC = () => {
  const imageUrl = "https://i.ibb.co/v6HnS6b5/67d82bd9a1c76bbf41c51298-img-3w-XXGEKGnes-Q5-Y21wk5bm-1.webp";
  const promptText = `>_ Digital banner featuring a hiker standing on a windswept mountaintop at sunrise, arms outstretched against golden sunrays. Warm orange and cool blue hues contrast across rugged cliffs and snow-dusted peaks. Center text: "GEAR UP FOR YOUR NEXT JOURNEY"; CTA text right below: "Shop Now". Crisp 3D render with cinematic lighting, inspired by Ansel Adams' landscapes.`;

  return (
    <section className="bg-background py-16 sm:py-20 lg:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Image and Prompt */}
          <div className="lg:col-span-2">
             <Card className="p-3 bg-card/50" shadow="xl">
                <img
                  src={imageUrl}
                  alt="AI generated banner of a hiker on a mountain"
                  className="rounded-lg w-full h-auto"
                />
              <p className="mt-4 text-xs text-textSecondary font-mono break-words">
                {promptText}
              </p>
            </Card>
          </div>

          {/* Right Column: Text Content */}
          <div className="lg:col-span-3">
            <h2 className="text-4xl md:text-5xl font-bold text-textPrimary mb-6 leading-tight">
              Effortless banners—<br className="sm:hidden" />fast, easy, stunning
            </h2>
            <p className="text-lg text-textSecondary leading-relaxed">
              Creating custom banners doesn't have to be hard or confusing. Pixasocial simplifies the entire process, letting anyone make professional-quality banners with ease. With no experience needed, you can quickly have banners that look like you hired a designer. Save time, avoid frustration, and produce visuals you'll proudly share online.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
};
