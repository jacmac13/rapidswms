import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-05-27.dahlia',
});

export const PLANS = {
  solo: { name: 'Solo', price: 29, priceId: process.env.STRIPE_PRICE_SOLO! },
  crew: { name: 'Small Crew', price: 49, priceId: process.env.STRIPE_PRICE_CREW! },
  business: { name: 'Business', price: 99, priceId: process.env.STRIPE_PRICE_BUSINESS! },
} as const;

export type PlanKey = keyof typeof PLANS;
