import React from "react";
import "../assets/styles/Learn.scss";
import Header from "../Component/Header";
import Footer from "../Component/Footer";
import Seo from "../Component/Seo";
import { Link } from "react-router-dom";
import { FaChartLine, FaChartBar, FaShieldAlt, FaMoneyBillWave } from "react-icons/fa";

function Learn() {
    return (
        <div className="learn-container">
            <Seo 
                title="Learn Page"
                description="Expand your investment knowledge"
                page="Learn"
                keywords={["investment learning", "market trends", "financial growth", "wealth strategies"]} 
            />

            <Header />

            <div className="learn-layout no-sidebar">
                {/* Main Content with clickable cards (replaces sidebar) */}
                <main className="main-content-learn">
                    <br />
                    <br />
                    <section className="learn-section" id="investment-learning">
                        <div className="learn-hero">
                            <h1 className="main-heading-learn">Empower Yourself with Investment Knowledge</h1>
                            <h3>
                                TheCapitalTree is committed to educating investors on market trends, 
                                risk management, and wealth-building strategies.
                            </h3>
                        </div>

                        <h2 className="learn-title">What You’ll Learn</h2>

                        <div className="learn-grid learn-grid-clickable">
                            <Link to="/blog" className="learn-card learn-card-link" aria-label="Read market analysis articles">
                                <span className="card-index">01</span>
                                <div className="card-icon"><FaChartBar /></div>
                                <h3>Market Trends & Analysis</h3>
                                <p>Read our latest insights and stay ahead of the market.</p>
                                <span className="card-cta">Explore Articles →</span>
                            </Link>
                            <Link to="/short60" className="learn-card learn-card-link" aria-label="Watch Short60 videos">
                                <span className="card-index">02</span>
                                <div className="card-icon"><FaChartLine /></div>
                                <h3>Short60</h3>
                                <p>Quick, focused learning bites to level up faster.</p>
                                <span className="card-cta">Open Short60 →</span>
                            </Link>
                            <Link to="/book" className="learn-card learn-card-link" aria-label="See recommended books">
                                <span className="card-index">03</span>
                                <div className="card-icon"><FaMoneyBillWave /></div>
                                <h3>Books</h3>
                                <p>Handpicked reads to deepen your finance knowledge.</p>
                                <span className="card-cta">Browse Books →</span>
                            </Link>
                            <Link to="/learn" className="learn-card learn-card-link" aria-label="Learn investment basics">
                                <span className="card-index">04</span>
                                <div className="card-icon"><FaShieldAlt /></div>
                                <h3>Investment Basics</h3>
                                <p>Foundational guides on risk, returns, and portfolios.</p>
                                <span className="card-cta">Start Learning →</span>
                            </Link>
                        </div>

                        <p className="learnpara">
                            Stay ahead with our expert insights and <b>transform the way you invest!</b>
                        </p>
                    </section>
                </main>
            </div>

            <Footer />
        </div>
    );
}

export default Learn;
