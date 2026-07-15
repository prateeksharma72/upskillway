import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../assets/styles/SwpCalculator.scss";
import Header from "../Component/Header";
import Footer from "../Component/Footer";
import Seo from "../Component/Seo";
import Animation from "../assets/image/invest.jpg"; // Assuming this path is correct

function SwpCalculator() {
  const [investmentPeriod, setInvestmentPeriod] = useState(1);
  const [totalInvestment, setTotalInvestment] = useState(100000); // Example initial value
  const [monthlyWithdrawal, setMonthlyWithdrawal] = useState(1000); // Example initial value
  const [rateOfReturn, setRateOfReturn] = useState(8); // Example initial value
  const [finalValue, setFinalValue] = useState(null);
  const [totalInterest, setTotalInterest] = useState(null);
  const [totalWithdrawn, setTotalWithdrawn] = useState(null);
  const [tableData, setTableData] = useState([]);

  const handleInputChange = (setter) => (e) => {
    // Ensure we handle empty input gracefully, setting it to 0
    const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
    // Use isNaN check for safety
    setter(isNaN(value) ? 0 : value);
  };

  // Separate handler for text input to allow typing numbers directly
  const handleTextInputChange = (setter) => (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, ""); // Allow only numbers and dot
    // Ensure we handle empty input gracefully, setting it to 0 or keeping it empty for typing
    const numericValue = value === "" ? "" : parseFloat(value);
    // Update state only if it's a valid number or empty string
    if (value === "" || !isNaN(numericValue)) {
      setter(value === "" ? "" : numericValue); // Store empty string or number
    }
  };

  // Helper function to format numbers for display in text inputs
  const formatValueForInput = (value) => {
    // Show empty string if value is 0 or '', otherwise show the number
    return value === 0 || value === "" ? "" : value.toString();
  };

  const calculateSWP = () => {
    // Use 0 if state holds empty string before calculation
    const currentTotalInvestment = totalInvestment === "" ? 0 : totalInvestment;
    const currentMonthlyWithdrawal =
      monthlyWithdrawal === "" ? 0 : monthlyWithdrawal;
    const currentRateOfReturn = rateOfReturn === "" ? 0 : rateOfReturn;

    let remainingAmount = currentTotalInvestment;
    let totalWithdrawals = investmentPeriod * 12;
    let interestEarned = 0;
    let monthlyData = []; // Array to store monthly data for the table

    // Basic validation
    if (
      currentTotalInvestment <= 0 ||
      investmentPeriod <= 0 ||
      currentRateOfReturn < 0 ||
      currentMonthlyWithdrawal < 0
    ) {
      // Maybe set an error state here or just reset results
      setFinalValue(null);
      setTotalInterest(null);
      setTotalWithdrawn(null);
      setTableData([]); // Clear table data
      console.warn("Invalid input for calculation.");
      return; // Stop calculation if inputs are invalid
    }

    for (let i = 0; i < totalWithdrawals; i++) {
      // Ensure remainingAmount doesn't go below zero before calculation
      if (remainingAmount <= 0) {
        remainingAmount = 0;
        break; // Stop if balance is zero or negative
      }

      let interest = (remainingAmount * (currentRateOfReturn / 100)) / 12;
      interestEarned += interest;
      let beforeWithdrawal = remainingAmount + interest; // Balance before withdrawal
      remainingAmount = beforeWithdrawal - currentMonthlyWithdrawal;

      // Ensure remaining amount doesn't drop below zero *after* withdrawal
      if (remainingAmount < 0) {
        // Adjust last withdrawal if needed? Or just set final to 0?
        // For simplicity, let's assume the full withdrawal happens if possible,
        // and the final value reflects the potentially negative balance before setting to 0.
        // Let's recalculate the last effective withdrawal if balance goes negative.
        // Or more simply: cap remainingAmount at 0.
        remainingAmount = 0;
        // We need to know how many withdrawals actually happened.
        totalWithdrawals = i + 1; // Record the actual number of withdrawals made
      }

      monthlyData.push({
        month: i + 1,
        beginningBalance: beforeWithdrawal.toFixed(2),
        withdrawal: currentMonthlyWithdrawal.toFixed(2),
        interest: interest.toFixed(2),
        endingBalance: remainingAmount.toFixed(2),
      });
    }

    setFinalValue(remainingAmount.toFixed(2));
    setTotalInterest(interestEarned.toFixed(2));
    // Calculate total withdrawn based on actual withdrawals made before balance hit zero
    setTotalWithdrawn((currentMonthlyWithdrawal * totalWithdrawals).toFixed(2));
    setTableData(monthlyData); // Set the table data state
  };

  return (
    <div className="swpcalculator-container">
      <Seo
        title="SWP Calculator"
        description="This Systematic Withdrawal Plan calculator computes your matured sum as per your monthly withdrawals."
        canonical="Swp-calculator"
        keywords={[
          "trading",
          "thecapitaltree",
          "risk management",
          "strategies",
          "swp",
          "systematic withdrawal plan",
          "investment calculator",
        ]}
      />
      <Header />
      <main className="swp-main">
        {/* Left Side - Calculator */}
        <section className="calculator-section">
          <h1 className="calculator-title">
            <span className="accent">SWP</span> Calculator
          </h1>
          
          <div className="calculator-form">
            <div className="input-group">
              <label>Total Investment</label>
              <input
                type="text"
                value={formatValueForInput(totalInvestment)}
                onChange={handleTextInputChange(setTotalInvestment)}
                placeholder="$10000"
                className="form-input"
              />
            </div>
            
            <div className="input-group">
              <label>Monthly Withdrawal</label>
              <input
                type="text"
                value={formatValueForInput(monthlyWithdrawal)}
                onChange={handleTextInputChange(setMonthlyWithdrawal)}
                placeholder="10000"
                className="form-input"
              />
            </div>
            
            <div className="input-group">
              <label>Expected Rate of Return (%)</label>
              <input
                type="text"
                value={formatValueForInput(rateOfReturn)}
                onChange={handleTextInputChange(setRateOfReturn)}
                placeholder="8"
                className="form-input"
              />
            </div>
            
            <div className="input-group">
              <label>Investment Period (Years)</label>
              <input
                type="text"
                value={investmentPeriod}
                onChange={handleTextInputChange(setInvestmentPeriod)}
                placeholder="4"
                className="form-input"
              />
            </div>
            
            <button className="calculate-btn" onClick={calculateSWP}>
              Calculate
            </button>
          </div>

          {/* Results - Only show after calculation */}
          {finalValue !== null && (
            <div className="results-summary">
              <div className="result-row">
                <span>Final Value:</span>
                <span>₹{finalValue}</span>
              </div>
              <div className="result-row">
                <span>Total Interest Earned:</span>
                <span>₹{totalInterest}</span>
              </div>
              <div className="result-row">
                <span>Total Withdrawn:</span>
                <span>₹{totalWithdrawn}</span>
              </div>
            </div>
          )}
        </section>

        {/* Right Side - Testimonial & Dashboard */}
        <section className="testimonial-section">
          <div className="testimonial">
            <div className="quote-icon">"</div>
            <p className="testimonial-text">
              The Capital Tree made our transactions seamless and secure. The platform is fast, reliable, and incredibly user-friendly. Highly recommend!
            </p>
            <div className="testimonial-author">
              <div className="author-avatar">P</div>
              <div className="author-info">
                <div className="author-name">Prateek</div>
                <div className="author-title">Web3 Entrepreneur</div>
              </div>
            </div>
          </div>
          
          <div className="dashboard-preview">
            <img src={Animation} alt="Trading Dashboard Preview" className="dashboard-img" />
          </div>
        </section>
      </main>
      
      {/* Separate Results Table Section - Only show after calculation */}
      {finalValue !== null && tableData.length > 0 && (
        <div className="table-section-container">
          <div className="table-section">
            <h2 className="table-title">Monthly Breakdown</h2>
            <div className="results-table">
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Balance at Begin (₹)</th>
                    <th>Withdrawal (₹)</th>
                    <th>Interest Earned (₹)</th>
                    <th>Balance at End (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, index) => (
                    <tr key={index}>
                      <td>{row.month}</td>
                      <td>₹{row.beginningBalance}</td>
                      <td>₹{row.withdrawal}</td>
                      <td>₹{row.interest}</td>
                      <td>₹{row.endingBalance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}

export default SwpCalculator;
