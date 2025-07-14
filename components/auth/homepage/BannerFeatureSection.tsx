import React from 'react';
import { Card } from '../../ui/Card';

export const BannerFeatureSection: React.FC = () => {
  const imageUrl =
    'https://i.ibb.co/v6HnS6b5/67d82bd9a1c76bbf41c51298-img-3w-XXGEKGnes-Q5-Y21wk5bm-1.webp';
  const promptText = `> Digital banner featuring a hiker standing on a windswept mountaintop at sunrise, arms outstretched against golden sunrays. Warm orange and cool blue hues contrast across rugged cliffs and snow-dusted peaks. Center text: "GEAR UP FOR YOUR NEXT JOURNEY"; CTA text right below: "Shop Now". Crisp 3D render with cinematic lighting, inspired by Ansel Adams' landscapes.`;

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-background via-background/90 to-background/70 py-20 sm:py-24 lg:py-32">
      {/* decorative orbs */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-br from-primary to-accent opacity-20 blur-3xl animate-pulse" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-tl from-accent to-primary opacity-20 blur-3xl animate-pulse [animation-delay:1.5s]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-5 lg:gap-16 items-center">
          {/* Left: Image + Prompt */}
          <div className="lg:col-span-2">
            <Card
              shadow="2xl"
              className="group relative overflow-hidden rounded-2xl border border-border/40 bg-card/40 p-1.5 backdrop-blur-md transition-transform duration-300 hover:-translate-y-1"
            >
              <div className="aspect-[4/3] overflow-hidden rounded-xl">
                <img
                  src={imageUrl}
                  alt="AI generated banner"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Prompt block */}
              <div className="mt-3 rounded-lg bg-muted/30 p-3">
                <p className="text-xs font-mono leading-relaxed text-muted-foreground">
                  <span className="text-primary">Prompt:</span>
                  <br />
                  {promptText}
                </p>
              </div>
            </Card>
          </div>

          {/* Right: Copy */}
          <div className="lg:col-span-3">
            <span className="inline-block rounded-full bg-gradient-to-r from-primary/20 to-accent/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-foreground">
              AI Banner Generator
            </span>

            <h2 className="mt-4 text-4xl font-extrabold leading-tight text-foreground sm:text-5xl lg:text-6xl">
              Effortless banners—<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                fast, easy, stunning
              </span>
            </h2>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
              Creating custom banners doesn’t have to be hard or confusing. Pixasocial simplifies
              the entire process, letting anyone make professional-quality banners with ease. No
              experience needed—just describe and click. Save time, skip the frustration, and share
              visuals you’ll be proud of.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};