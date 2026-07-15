"use client";

import { useState } from "react";
import {
  mobilePremiumTapTarget,
  nextPremiumTapCount,
  shouldActivatePremiumFromTaps,
} from "@/lib/premium-mode-core";
import { activatePremiumMode, usePremiumMode } from "@/lib/premium-mode";

type PricingPlan = {
  name: string;
  price: string;
  label: string;
  description: string;
  highlighted?: boolean;
  features: string[];
};

export function PricingCard({ plan }: { plan: PricingPlan }) {
  const [, setPurchaseTaps] = useState(0);
  const { active } = usePremiumMode();
  const isPremium = plan.name === "Premium";

  function handlePurchaseTap() {
    if (!isPremium || !window.matchMedia("(max-width: 767px)").matches) return;
    setPurchaseTaps((current) => {
      const next = nextPremiumTapCount(current);
      if (shouldActivatePremiumFromTaps(next)) {
        activatePremiumMode("mobile");
        return 0;
      }
      return next;
    });
  }

  return (
    <article className={`pricing-card ${plan.highlighted ? "pricing-card-highlighted" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-cyan-100">{plan.label}</p>
          <h3 className="mt-2 text-3xl font-black text-white">{plan.name}</h3>
        </div>
        <p className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-slate-200">
          {isPremium && active ? "Aktywny" : isPremium ? "Wkrótce" : "Dostępny"}
        </p>
      </div>
      <p className="mt-5 text-4xl font-black text-white">{plan.price}</p>
      <p className="mt-4 min-h-14 text-sm leading-7 text-slate-300">{plan.description}</p>
      <div className="mt-6 space-y-3">
        {plan.features.map((feature) => (
          <p key={feature} className="feature-row">
            <span aria-hidden="true" />
            {feature}
          </p>
        ))}
      </div>
      <button
        type="button"
        className="premium-buy-button"
        onClick={handlePurchaseTap}
        aria-label={isPremium ? "Kup Premium" : "Plan bezpłatny"}
        data-tap-target={isPremium ? mobilePremiumTapTarget : undefined}
        disabled={!isPremium}
      >
        {isPremium ? active ? "Premium aktywny" : "Kup" : "Plan bezpłatny"}
      </button>
    </article>
  );
}
