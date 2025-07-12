import React from 'react';
import { Card } from '../../ui/Card';

interface TestimonialItem {
  name: string;
  text: string;
  handle: string;
  imageSrc: string;
  featured?: boolean;
}

const TestimonialCard: React.FC<{ item: TestimonialItem; className?: string }> = ({ item, className = '' }) => {
  return (
    <Card className={`h-full transition-all duration-300 ease-in-out hover:-translate-y-1 ${item.featured ? 'bg-primary/5 border-primary/30' : 'bg-card/50'} ${className}`}>
      <div className="flex flex-col h-full">
        <div className="flex-grow">
          <p className="text-textSecondary text-lg">{item.text}</p>
        </div>
        <div className="mt-6 flex items-center space-x-4">
          <img src={item.imageSrc} alt={item.name} className="w-12 h-12 rounded-full object-cover border-2 border-primary/50" />
          <div>
            <p className="font-semibold text-textPrimary">{item.name}</p>
            <p className="text-sm text-textSecondary">{item.handle}</p>
          </div>
        </div>
      </div>
    </Card>
  );
};


export const TestimonialSection: React.FC = () => {
    const testimonialItems: TestimonialItem[] = [
        {
          name: 'Mathew',
          text: 'After using this, I cannot imagine going back to the old way of doing things.',
          handle: '@heymatt_oo',
          imageSrc: 'https://picsum.photos/100/100.webp?random=2',
        },
        {
          name: 'Joshua',
          text: 'Perfect for my use case',
          handle: '@joshua',
          imageSrc: 'https://picsum.photos/100/100.webp?random=3',
        },
        {
          name: 'Parl Coppa',
          text: 'This is the best thing since sliced bread. I cannot believe I did not think of it myself.',
          handle: '@coppalipse',
          imageSrc: 'https://picsum.photos/100/100.webp?random=1',
          featured: true, // Feature this testimonial
        },
        {
          name: 'Mandy',
          text: 'Excellent product!',
          handle: '@mandy',
          imageSrc: 'https://picsum.photos/100/100.webp?random=4',
        },
        {
          name: 'Alex',
          text: 'Can easily recommend!',
          handle: '@alex',
          imageSrc: 'https://picsum.photos/100/100.webp?random=5',
        },
        {
          name: 'Sam',
          text: 'I am very happy with the results.',
          handle: '@sama',
          imageSrc: 'https://picsum.photos/100/100.webp?random=6',
        },
      ];

  const featuredTestimonial = testimonialItems.find(item => item.featured);
  const otherTestimonials = testimonialItems.filter(item => !item.featured);

  return (
    <div className="mt-16 sm:mt-20 lg:mt-24 max-w-7xl mx-auto px-4 animate-fade-in-up" style={{ animationDelay: '700ms', opacity: 0 }}>
        <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                Don't take it from us
            </h3>
            <p className="mt-4 text-lg text-gray-300 max-w-2xl mx-auto">
                See what our customers have to say.
            </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTestimonial && <TestimonialCard item={featuredTestimonial} className="lg:col-span-2" />}
            {otherTestimonials.map((item) => (
                <TestimonialCard key={item.handle} item={item} />
            ))}
        </div>
    </div>
  );
};
