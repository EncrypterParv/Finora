"use client";
import { useId, useState } from "react";

const rupees = (value: number) =>
  `₹${Math.round(value).toLocaleString("en-IN")}`;
export function FinancialWorkbench({ stage }: { stage: number }) {
  const [pace, setPace] = useState(900);
  const paceId = useId();
  return (
    <div className="financial-workbench">
      <div className="workbench-title">
        <span>YOUR FINANCIAL FIELD GUIDE</span>
        <span>{stage + 1} / 4</span>
      </div>
      {stage === 0 && (
        <div className="workbench-body">
          <h4>A statement, translated.</h4>
          <p>Different descriptions. One consistent record.</p>
          <div className="raw-transaction">
            UPI/BLUETOKAI/ORDER-182
            <br />
            <span>12 OCT 2026 · DEBIT · INR 320.00</span>
          </div>
          <div className="record-table">
            <div>
              <span>Merchant</span>
              <strong>Blue Tokai</strong>
            </div>
            <div>
              <span>Category</span>
              <strong>Food & Dining</strong>
            </div>
            <div>
              <span>Amount</span>
              <strong>₹320</strong>
            </div>
            <div>
              <span>Duplicate check</span>
              <strong className="positive-label">Unique record</strong>
            </div>
          </div>
          <p className="workbench-note">
            A sample record. No personal bank data.
          </p>
        </div>
      )}
      {stage === 1 && (
        <div className="workbench-body">
          <h4>Your week, in perspective.</h4>
          <p>Find the days that change your monthly pace.</p>
          <div className="week-comparison">
            {[680, 320, 450, 210, 980, 1240, 790].map((amount, i) => (
              <div key={i}>
                <span>
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                </span>
                <div>
                  <i style={{ transform: `scaleY(${amount / 1240})` }} />
                </div>
                <small>{rupees(amount)}</small>
              </div>
            ))}
          </div>
          <div className="workbench-observation">
            <span>The detail behind the total</span>
            <strong>Saturday was the busiest spending day.</strong>
            <p>Open a day in the app to see the transactions behind it.</p>
          </div>
        </div>
      )}
      {stage === 2 && (
        <div className="workbench-body">
          <h4>Try a different pace.</h4>
          <p>A small daily change adds up across a month.</p>
          <div className="pace-result">
            <span>Projected month-end spend</span>
            <output>{rupees(18000 + pace * 15)}</output>
            <small>
              {18000 + pace * 15 <= 35000 ? "Within" : "Above"} a ₹35,000 sample
              budget
            </small>
          </div>
          <label className="scenario-label" htmlFor={paceId}>
            Daily spending <strong>{rupees(pace)}</strong>
          </label>
          <input
            id={paceId}
            type="range"
            min="300"
            max="1800"
            step="50"
            value={pace}
            onChange={(e) => setPace(Number(e.target.value))}
          />
          <div className="calculation-note">
            ₹18,000 already spent + 15 days × {rupees(pace)}.
          </div>
          <p className="workbench-note">
            Illustrative arithmetic, not a trained-model prediction.
          </p>
        </div>
      )}
      {stage === 3 && (
        <div className="workbench-body">
          <h4>A next step with a reason.</h4>
          <p>You decide what to do with the information.</p>
          <div className="action-receipt">
            <span>YOUR SAMPLE PLAN</span>
            <div>
              <span>Monthly budget</span>
              <strong>₹35,000</strong>
            </div>
            <div>
              <span>Projected spending</span>
              <strong>₹31,500</strong>
            </div>
            <div className="receipt-total">
              <span>Room to save</span>
              <strong>₹3,500</strong>
            </div>
          </div>
          <div className="workbench-observation">
            <span>One possible next step</span>
            <strong>Put the surplus toward a safety net.</strong>
            <p>
              Compare contributions in the wealth scenario below. Finora never
              moves money for you.
            </p>
          </div>
        </div>
      )}
      <div className="workbench-footer">
        Illustrative financial data <span>Built for understanding</span>
      </div>
    </div>
  );
}
