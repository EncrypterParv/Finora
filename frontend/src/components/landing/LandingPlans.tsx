import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "₹0",
    cadence: "always",
    description: "A clear starting point for everyday money.",
    features: ["Calendar and spending overview", "One savings goal", "CSV import concept"],
  },
  {
    name: "Individual Pro",
    price: "₹499",
    cadence: "per month · proposed",
    description: "More history and detail for your personal plan.",
    features: ["Longer history and advanced insights", "Multiple savings goals", "Expanded statement import concept"],
    featured: true,
  },
  {
    name: "Teams",
    price: "₹1,599",
    cadence: "per month · proposed",
    description: "A shared view for households and small teams.",
    features: ["Shared calendars and budgets", "Member roles and access", "Combined cash-flow view concept"],
  },
];

export function LandingPlans() {
  return (
    <section className="plans-section" id="plans" aria-labelledby="plans-title">
      <div className="plans-heading">
        <div>
          <h2 id="plans-title">
            A plan for the way
            <br />
            <em>you manage money.</em>
          </h2>
        </div>
        <p>
          Compare the early plan concepts. Prices and features are illustrative;
          subscriptions and checkout are not connected in this prototype.
        </p>
      </div>
      <div className="plans-grid">
        {plans.map((plan) => (
          <article
            className={`plan-column${plan.featured ? " plan-column-featured" : ""}`}
            key={plan.name}
          >
            <h3>{plan.name}</h3>
            <p className="plan-description">{plan.description}</p>
            <p className="plan-price">
              <strong>{plan.price}</strong>
              <span>{plan.cadence}</span>
            </p>
            <ul>
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <Link className="plan-link" href="/login">
              Explore the sample workspace
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M4 12h15m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" />
              </svg>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
