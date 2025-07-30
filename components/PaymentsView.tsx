import React, { useState, useEffect } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useToast } from './ui/ToastProvider';
import { supabase } from '../services/supabaseClient';
import { RoleName } from '../types/app';
import { RoleType } from '../types/user';
import { CreditCardIcon, PayPalIcon, CryptoIcon, CheckCircleIcon } from './ui/Icons';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { useAppDataContext } from './MainAppLayout';
import { loadStripe, Stripe } from '@stripe/stripe-js';

// Define payment methods
type PaymentMethod = 'credit-card' | 'paypal' | 'crypto';

// Replace with your actual Stripe publishable key. 
// It's safe to expose this key in your frontend code.
const STRIPE_PUBLISHABLE_KEY = 'pk_test_YOUR_PUBLISHABLE_KEY';

export const PaymentsView: React.FC = () => {
    const { currentUser } = useAppDataContext();
    const { showToast } = useToast();
    
    const [plans, setPlans] = useState<RoleType[]>([]);
    const [isLoadingPlans, setIsLoadingPlans] = useState(true);
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(currentUser.role.id);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('credit-card');
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);
    
    // Stripe state
    const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

    useEffect(() => {
        if (STRIPE_PUBLISHABLE_KEY.startsWith('pk_test_YOUR')) {
            console.warn("Stripe publishable key is not set. Payments will not work.");
            return;
        }
        setStripePromise(loadStripe(STRIPE_PUBLISHABLE_KEY));
    }, []);

    useEffect(() => {
        const fetchPlans = async () => {
            setIsLoadingPlans(true);
            const { data, error } = await supabase
                .from('role_types')
                .select('*')
                .neq('name', RoleName.Admin)
                .order('price_monthly', { ascending: true });
            
            if (error) {
                showToast(`Error fetching subscription plans: ${error.message}`, 'error');
            } else {
                setPlans(data as RoleType[]);
            }
            setIsLoadingPlans(false);
        };
        fetchPlans();
    }, [showToast]);

    const handlePlanSelect = (planId: string) => {
        setSelectedPlanId(planId);
    };

    const handlePayment = async () => {
        if (!selectedPlanId) {
            showToast('Please select a subscription plan.', 'error');
            return;
        }
        
        // This view currently only implements Stripe for Credit Card payments.
        if (selectedPaymentMethod !== 'credit-card') {
            showToast(`Backend for ${selectedPaymentMethod} is not yet implemented.`, 'info');
            return;
        }

        setIsProcessingPayment(true);
        try {
            const { data, error: functionError } = await supabase.functions.invoke('create-checkout-session', {
                body: { priceId: selectedPlanId },
            });

            if (functionError) throw functionError;
            if (data.error) throw new Error(data.error);

            const { sessionId } = data;
            const stripe = await stripePromise;
            if (!stripe) throw new Error('Stripe.js has not loaded yet.');

            const { error: stripeError } = await stripe.redirectToCheckout({ sessionId });
            if (stripeError) {
                throw stripeError;
            }
        } catch (error) {
            showToast(`Payment failed: ${(error as Error).message}`, 'error');
        } finally {
            setIsProcessingPayment(false);
        }
    };
    
    const selectedPlan = plans.find(p => p.id === selectedPlanId);

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-textPrimary mb-2">Payments & Subscriptions</h2>
            <p className="text-muted-foreground mb-6">Manage your subscription plan and payment methods.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left side: Plans */}
                <div className="lg:col-span-2">
                    <Card title="Choose Your Plan">
                        {isLoadingPlans ? (
                            <LoadingSpinner text="Loading plans..." />
                        ) : (
                            <div className="space-y-4">
                                {plans.map(plan => (
                                    <div
                                        key={plan.id}
                                        onClick={() => handlePlanSelect(plan.id)}
                                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedPlanId === plan.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-primary">${plan.price_monthly}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                                            </div>
                                        </div>
                                        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                                            <li className="flex items-center"><CheckCircleIcon className="w-4 h-4 text-success mr-2"/> {plan.max_personas} Audience Personas</li>
                                            <li className="flex items-center"><CheckCircleIcon className="w-4 h-4 text-success mr-2"/> {plan.max_ai_uses_monthly.toLocaleString()} AI Uses/Month</li>
                                            {(plan.features || []).map(feature => (
                                                <li key={feature} className="flex items-center"><CheckCircleIcon className="w-4 h-4 text-success mr-2"/> {feature}</li>
                                            ))}
                                        </ul>
                                         {currentUser.role.id === plan.id && <p className="text-xs text-accent font-semibold mt-3 text-right">Current Plan</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                </div>

                {/* Right side: Payment Method */}
                <div className="lg:col-span-1">
                    <Card title="Payment Method" className="sticky top-24">
                        <div className="space-y-3 mb-4">
                            <Button variant={selectedPaymentMethod === 'credit-card' ? 'primary' : 'outline'} className="w-full justify-start" onClick={() => setSelectedPaymentMethod('credit-card')} leftIcon={<CreditCardIcon className="w-5 h-5"/>}>Credit Card</Button>
                            <Button variant={selectedPaymentMethod === 'paypal' ? 'primary' : 'outline'} className="w-full justify-start" onClick={() => setSelectedPaymentMethod('paypal')} leftIcon={<PayPalIcon className="w-5 h-5"/>}>PayPal</Button>
                            <Button variant={selectedPaymentMethod === 'crypto' ? 'primary' : 'outline'} className="w-full justify-start" onClick={() => setSelectedPaymentMethod('crypto')} leftIcon={<CryptoIcon className="w-5 h-5"/>}>Cryptocurrency</Button>
                        </div>
                        
                        {selectedPaymentMethod === 'credit-card' && (
                            <div className="text-center p-4 bg-background rounded animate-fadeIn">
                                <p className="text-sm text-muted-foreground">You will be securely redirected to Stripe to complete your payment.</p>
                            </div>
                        )}

                        {selectedPaymentMethod === 'paypal' && (
                            <div className="text-center p-4 bg-background rounded animate-fadeIn">
                                <p className="text-sm text-muted-foreground">You will be redirected to PayPal to complete your payment.</p>
                            </div>
                        )}

                        {selectedPaymentMethod === 'crypto' && (
                            <div className="text-center p-4 bg-background rounded animate-fadeIn">
                                <p className="text-sm text-muted-foreground">Crypto payments are coming soon. Connect your wallet in settings.</p>
                            </div>
                        )}

                        <Button 
                            onClick={handlePayment} 
                            className="w-full mt-6"
                            isLoading={isProcessingPayment}
                            disabled={!selectedPlan || selectedPlan.price_monthly === 0 || isProcessingPayment}
                        >
                            {selectedPlan?.price_monthly === 0 ? 'Free Plan Selected' : `Pay $${selectedPlan?.price_monthly || 0}/month`}
                        </Button>
                    </Card>
                </div>
            </div>
        </div>
    );
};