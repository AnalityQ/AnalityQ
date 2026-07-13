type PricingPlan = {
  name: string;
  price: string;
  label: string;
  description: string;
  highlighted?: boolean;
  features: string[];
};

export function PricingCard({ plan }: { plan: PricingPlan }) {
  return (
    <article className={`pricing-card ${plan.highlighted ? "pricing-card-highlighted" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-cyan-100">{plan.label}</p>
          <h3 className="mt-2 text-3xl font-black text-white">{plan.name}</h3>
        </div>
        <p className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-bold text-slate-200">
          {plan.name === "Premium" ? "Wkrótce" : "Dostępny"}
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
    </article>
  );
}
