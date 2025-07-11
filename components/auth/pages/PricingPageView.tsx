import React, { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabaseClient';
import { RoleType, RoleName, AuthViewType } from '../../../types';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { LoadingSpinner } from '../../ui/LoadingSpinner';
import { CheckCircleIcon } from '../../ui/Icons';

interface PricingPageViewProps {
  setAuthView: (view: AuthViewType) => void;
}

export const PricingPageView: React.FC<PricingPageViewProps> = ({ setAuthView }) => {
  const [roles, setRoles] = useState<RoleType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoles = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('role_types')
        .select('*')
        .order('price_monthly', { ascending: true });

      if (error) {
        setError(error.message);
        console.error("Error fetching pricing plans:", error);
      } else {
        setRoles(data.filter(role => role.name !== RoleName.Admin));
      }
      setIsLoading(false);
    };

    fetchRoles();
  }, []);

  const getPlanHighlightClass = (planName: RoleName) => {
    if (planName === RoleName.Essentials) {
      return 'border-primary ring-2 ring-primary';
    }
    return 'border-lightBorder';
  };

  return (
    <div className="bg-background py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <h2 className="text-base font-semibold text-primary tracking-wide uppercase">Pricing</h2>
          <p className="mt-2 text-3xl font-extrabold text-textPrimary sm:text-4xl">
            Choose the Right Plan for You
          </p>
          <p className="mt-4 max-w-2xl mx-auto text-xl text-textSecondary">
            Start for free, then scale up as your strategic needs grow. No hidden fees, just pure value.
          </p>
        </div>

        {isLoading && <LoadingSpinner text="Loading plans..." className="mt-12" />}
        {error && <p className="text-center text-danger mt-8">Could not load pricing plans. Please try again later.</p>}

        {!isLoading && !error && (
          <div className="mt-12 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-x-8">
            {roles.map((plan, index) => (
              <div key={plan.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 200}ms`, opacity: 0 }}>
                <Card className={`flex flex-col p-8 ${getPlanHighlightClass(plan.name)} h-full`}>
                    <div className="flex-grow">
                        <h3 className="text-2xl font-semibold text-textPrimary">{plan.name}</h3>
                        <p className="mt-4 text-textSecondary h-12">{
                        plan.name === RoleName.Free ? "Perfect for individuals and small projects getting started." :
                        plan.name === RoleName.Essentials ? "For professionals and teams who need more power and collaboration." : ""
                        }</p>
                        
                        <div className="mt-6">
                        <span className="text-4xl font-extrabold text-textPrimary">${plan.price_monthly}</span>
                        <span className="text-base font-medium text-textSecondary">/month</span>
                        </div>

                        <ul className="mt-8 space-y-4">
                        <li className="flex items-start">
                            <div className="flex-shrink-0">
                            <CheckCircleIcon className="h-6 w-6 text-accent" aria-hidden="true" />
                            </div>
                            <p className="ml-3 text-base text-textSecondary">
                            <span className="font-medium text-textPrimary">{plan.max_personas}</span> Audience Personas
                            </p>
                        </li>
                        <li className="flex items-start">
                            <div className="flex-shrink-0">
                            <CheckCircleIcon className="h-6 w-6 text-accent" aria-hidden="true" />
                            </div>
                            <p className="ml-3 text-base text-textSecondary">
                            <span className="font-medium text-textPrimary">{plan.max_ai_uses_monthly.toLocaleString()}</span> AI Generations/Month
                            </p>
                        </li>
                        {(plan.features || []).map((feature) => (
                            <li key={feature} className="flex items-start">
                            <div className="flex-shrink-0">
                                <CheckCircleIcon className="h-6 w-6 text-accent" aria-hidden="true" />
                            </div>
                            <p className="ml-3 text-base text-textSecondary">{feature}</p>
                            </li>
                        ))}
                        </ul>
                    </div>
                    <Button
                        onClick={() => setAuthView('register')}
                        variant={plan.name === RoleName.Essentials ? 'primary' : 'outline'}
                        size="lg"
                        className="mt-8 w-full"
                    >
                        {plan.name === RoleName.Free ? 'Get Started' : 'Choose Plan'}
                    </Button>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};