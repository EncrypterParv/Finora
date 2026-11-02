"use client";
import { useId, useState } from "react";

// Ordinary annuity: end-of-month contributions, constant nominal return,
// monthly compounding, no starting corpus, fees, taxes or inflation.
export function futureValue(
  monthly: number,
  years: number,
  annualReturn: number,
) {
  const months = years * 12;
  const rate = annualReturn / 100 / 12;
  return rate === 0
    ? monthly * months
    : (monthly * Math.expm1(months * Math.log1p(rate))) / rate;
}
const amount = (value: number) =>
  value >= 10000000
    ? `₹${(value / 10000000).toFixed(2)} crore`
    : value >= 100000
      ? `₹${(value / 100000).toFixed(2)} lakh`
      : `₹${Math.round(value).toLocaleString("en-IN")}`;
export function WealthExplorer() {
  const id = useId();
  const [monthly, setMonthly] = useState(10000);
  const [years, setYears] = useState(20);
  const [annualReturn, setAnnualReturn] = useState(8);
  const [expenses, setExpenses] = useState(30000);
  const corpus = futureValue(monthly, years, annualReturn);
  const contributed = monthly * years * 12;
  const target = expenses * 12 * 25;
  const max = Math.max(corpus, target) * 1.12;
  const points = Array.from({ length: years + 1 }, (_, year) => [
    40 + (year / years) * 510,
    205 - (futureValue(monthly, year, annualReturn) / max) * 175,
  ]);
  const line = points
    .map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");
  const targetY = 205 - (target / max) * 175;
  const milestone = Array.from({ length: 50 }, (_, i) => i + 1).find(
    (y) => futureValue(monthly, y, annualReturn) >= target,
  );
  return (
    <section className="wealth-section" id="wealth">
      <div className="wealth-heading">
        <h2>
          What could your
          <br />
          <em>future look like?</em>
        </h2>
        <p>
          Your first salary. A small monthly habit. Time to let it grow. Change
          the assumptions and see one possible path to financial independence.
        </p>
      </div>
      <div className="wealth-explorer">
        <div className="wealth-controls">
          <h3>Make it your scenario.</h3>
          <p>Start at zero. Contribute every month.</p>
          {[
            {
              key: "monthly",
              label: "Monthly contribution",
              value: monthly,
              text: `₹${monthly.toLocaleString("en-IN")}`,
              min: 1000,
              max: 50000,
              step: 500,
              change: setMonthly,
            },
            {
              key: "years",
              label: "Time to grow",
              value: years,
              text: `${years} years`,
              min: 1,
              max: 40,
              step: 1,
              change: setYears,
            },
            {
              key: "return",
              label: "Assumed annual return",
              value: annualReturn,
              text: `${annualReturn}%`,
              min: 0,
              max: 12,
              step: 0.5,
              change: setAnnualReturn,
            },
            {
              key: "expenses",
              label: "Monthly living expenses",
              value: expenses,
              text: `₹${expenses.toLocaleString("en-IN")}`,
              min: 10000,
              max: 100000,
              step: 1000,
              change: setExpenses,
            },
          ].map((control) => (
            <div className="wealth-control" key={control.key}>
              <label htmlFor={`${id}-${control.key}`}>
                {control.label}
                <strong>{control.text}</strong>
              </label>
              <input
                id={`${id}-${control.key}`}
                type="range"
                min={control.min}
                max={control.max}
                step={control.step}
                value={control.value}
                  aria-valuetext={control.text}
                onChange={(e) => control.change(Number(e.target.value))}
              />
            </div>
          ))}
        </div>
        <div className="wealth-result">
          <div className="wealth-total">
            <span>Potential corpus after {years} years</span>
            <output>{amount(corpus)}</output>
            <p>
              <strong>{amount(contributed)}</strong> contributed by you.
              <br />
              <strong>{amount(corpus - contributed)}</strong> from assumed
              growth.
            </p>
          </div>
          <p className="wealth-chart-label">
            Independence target <strong>{amount(target)}</strong>
          </p>
          <svg
            className="wealth-chart"
            viewBox="0 0 580 245"
            role="img"
            aria-label={`Projected corpus ${amount(corpus)} in ${years} years, against a financial independence target of ${amount(target)}.`}
          >
            <path d={`${line} L550,205 L40,205Z`} fill="#e8eddf" />
            <path d="M40 205H550" stroke="#cdd3c5" />
            <path
              d={`M40 ${targetY}H550`}
              stroke="#8d7960"
              strokeDasharray="5 5"
            />
            <path d={line} stroke="#65745c" fill="none" strokeWidth="2.5" />
          </svg>
          <div className="wealth-axis">
            <span>Today</span>
            <span>Year {years}</span>
          </div>
          <div className="wealth-milestone">
            <strong>
              {corpus >= target
                ? "The scenario reaches your target."
                : milestone
                  ? `This scenario reaches the target in about ${milestone} years.`
                  : "The target is beyond this 50-year scenario."}
            </strong>
            <span>Target = 25 × annual expenses = {amount(target)}.</span>
          </div>
        </div>
      </div>
      <p className="wealth-disclaimer">
        FIRE means Financial Independence, Retire Early. The 25× target is an
        illustrative planning assumption, not a guaranteed safe withdrawal rule.
        This model uses fixed returns and monthly compounding; it excludes
        inflation, taxes, fees, and market volatility. Future living costs and
        actual outcomes may differ substantially. No investment recommendation
        is being made.
      </p>
    </section>
  );
}
