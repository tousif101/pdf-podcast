import { test } from "node:test";
import assert from "node:assert/strict";
import { CREDIT_PACKS, stripeConfigured } from "../../lib/billing";

test("CREDIT_PACKS ids match their keys and reference the right price envs", () => {
  for (const [key, pack] of Object.entries(CREDIT_PACKS)) {
    assert.equal(pack.id, key, `pack.id should equal its map key (${key})`);
    assert.ok(pack.credits > 0, "pack grants a positive number of credits");
    assert.ok(pack.priceUsd > 0, "pack has a positive price");
    assert.match(pack.priceEnv, /^STRIPE_PRICE_/, "priceEnv names a Stripe env");
  }
});

test("CREDIT_PACKS encodes the documented small/large tiers", () => {
  assert.deepEqual(CREDIT_PACKS.small, {
    id: "small",
    credits: 25,
    priceUsd: 5,
    priceEnv: "STRIPE_PRICE_SMALL",
  });
  assert.deepEqual(CREDIT_PACKS.large, {
    id: "large",
    credits: 60,
    priceUsd: 10,
    priceEnv: "STRIPE_PRICE_LARGE",
  });
});

const STRIPE_ENVS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_SMALL",
  "STRIPE_PRICE_LARGE",
] as const;

function withStripeEnv(
  values: Partial<Record<(typeof STRIPE_ENVS)[number], string>>,
  fn: () => void,
) {
  const saved: Record<string, string | undefined> = {};
  for (const key of STRIPE_ENVS) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
  for (const [key, value] of Object.entries(values)) {
    process.env[key] = value;
  }
  try {
    fn();
  } finally {
    for (const key of STRIPE_ENVS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
}

test("stripeConfigured is true only when all four Stripe envs are present", () => {
  withStripeEnv(
    {
      STRIPE_SECRET_KEY: "sk_test",
      STRIPE_WEBHOOK_SECRET: "whsec",
      STRIPE_PRICE_SMALL: "price_s",
      STRIPE_PRICE_LARGE: "price_l",
    },
    () => assert.equal(stripeConfigured(), true),
  );
});

test("stripeConfigured is false when any single Stripe env is missing", () => {
  for (const missing of STRIPE_ENVS) {
    const full: Record<string, string> = {
      STRIPE_SECRET_KEY: "sk_test",
      STRIPE_WEBHOOK_SECRET: "whsec",
      STRIPE_PRICE_SMALL: "price_s",
      STRIPE_PRICE_LARGE: "price_l",
    };
    delete full[missing];
    withStripeEnv(full, () =>
      assert.equal(
        stripeConfigured(),
        false,
        `should be false when ${missing} is unset`,
      ),
    );
  }
});

test("stripeConfigured is false with no Stripe envs at all", () => {
  withStripeEnv({}, () => assert.equal(stripeConfigured(), false));
});
