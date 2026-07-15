import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../assets/styles/Invest.scss";
import Header from "../Component/Header";
import Footer from "../Component/Footer";
import Seo from "../Component/Seo";
import philosophy from "../assets/image/invest1.jpg";
import timeline from '../assets/image/timeline.png';
import { FaChartBar,FaBriefcase,FaMoneyBillWave, FaShieldAlt, FaChartLine, FaCoins, FaLightbulb} from 'react-icons/fa';

function Invest() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 500);
  }, []);

  return (
    <div className="invest-container">
      <Seo
        title="Invest Page"
        description="This is the invest page"
        page="Invest"
        keywords={["trading", "thecapitaltree", "risk management", "strategies"]}
      />
      <Header />

      <main className="invest">
        {/* Hero */}
        <section className="invest-hero">
          <h1 className="hero-title">
            <span>Grow Your</span> <span className="accent">Wealth</span> with
            <br />
            <span>Strategic</span> <span className="accent">Investments</span>
          </h1>
          <p className="hero-sub">
            Unlock consistent growth through innovative and risk‑adjusted portfolio strategies.
          </p>
          <Link to="/login" className="btn-primary">Get Started</Link>
        </section>

        {/* Investment Philosophy */}
        <section className="invest-philosophy card">
          <div className="philo-media">
            <img
              src={philosophy}
              alt="Investment philosophy at The Capital Tree"
              title="Investment Philosophy"
              loading="eager"
            />
          </div>
          <div className="philo-content">
            <h2>Investment Philosophy</h2>
            <p>
              At The Capital Tree, we believe in sustainable wealth creation through strategic and data‑driven investment approaches. Our philosophy revolves around disciplined risk management, diversification, and maximizing returns while ensuring financial security for our investors.
            </p>
          </div>
        </section>

        {/* Key Benefits - Using Cards */}
        <section className="invest-benefits">
          <h2>Key Benefits of Partnering with <span className="accent-text">The Capital Tree</span></h2>
          <div className="benefit-grid">
            <div className="benefit-item"><h3>Consistent Returns</h3><p>Targeting 3–5% monthly gains.</p></div>
            <div className="benefit-item"><h3>Expert Management</h3><p>Professionally curated portfolios backed by research.</p></div>
            <div className="benefit-item"><h3>Flexible Options</h3><p>Plans tailored to your financial goals.</p></div>
            <div className="benefit-item"><h3>Transparency & Security</h3><p>Regular reports and regulation compliance.</p></div>
          </div>
        </section>

        <div className="invest-process-invest-performance">
          {/* Investment Process - Using a Timeline */}
          <section className="invest-process">
            <div className="process-head">
              <h2>Our Investment <span className="accent-text">Process</span></h2>
              <Link to="/login" className="btn-secondary">Get Started</Link>
            </div>
            <div className="process-timeline">
              <img src={timeline} alt="Investment process timeline" className="timeline" />
            </div>
          </section>

      <section className="invest-performance">
          <h2 className={visible ? "fade-in-title show" : "fade-in-title"}>Performance <span className="accent-text">Highlights</span></h2>
          <div className="perf-grid">
            <div className="perf-card"><FaChartBar className="perf-icon" /><p>Average annual returns exceeding 36%.</p></div>
            <div className="perf-card"><FaBriefcase className="perf-icon" /><p>Strong risk‑adjusted returns through diversified strategies.</p></div>
            <div className="perf-card"><FaShieldAlt className="perf-icon" /><p>Proven record of consistent monthly payouts.</p></div>
            <div className="perf-card"><FaMoneyBillWave className="perf-icon" /><p>Optimized risk management for stable high‑yield investing.</p></div>
            <div className="perf-card"><FaChartLine className="perf-icon" /><p>Maximizing returns while maintaining a balanced risk profile.</p></div>
            <div className="perf-card"><FaCoins className="perf-icon" /><p>Strategic approaches yielding superior market performance.</p></div>
          </div>
      </section>

        </div>

        {/* CTA - Call to Action */}
        <section className="invest-cta">
          <h2>Take the next step toward <span className="accent-text">financial</span> freedom!</h2>
          <div className="cta-actions">
            <a className="btn-primary" href="tel:+918263066511">Schedule a Free Consultation</a>
            <Link to="/learn" className="btn-secondary">Learn More About Our Funds</Link>
          </div>
          <div className="compliance card-outline">
            <h3>Regulatory and Compliance Notes</h3>
            <p>
              The Capital Tree operates under strict financial guidelines, ensuring compliance with Indian investment laws. Our strategies adhere to SEBI regulations, offering a secure and transparent investment platform.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Invest;
