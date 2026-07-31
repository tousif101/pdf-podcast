export type PackId = "small" | "large";

export interface CreditPack {
  id: PackId;
  credits: number;
  priceUsd: number;
  priceEnv: string;
}

export const CREDIT_PACKS: Record<PackId, CreditPack> = {
  small: {
    id: "small",
    credits: 25,
    priceUsd: 5,
    priceEnv: "STRIPE_PRICE_SMALL",
  },
  large: {
    id: "large",
    credits: 60,
    priceUsd: 10,
    priceEnv: "STRIPE_PRICE_LARGE",
  },
};

export function stripeConfigured(): boolean {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_WEBHOOK_SECRET &&
      process.env.STRIPE_PRICE_SMALL &&
      process.env.STRIPE_PRICE_LARGE,
  );
}
