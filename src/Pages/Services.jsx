import React from "react";
import "../assets/styles/Services.scss";
import Header from "../Component/Header";
import Footer from "../Component/Footer";
import Seo from '../Component/Seo';

function Services() {
    return (
        <div className="services-container">
             <Seo title="Home Page" description="this is home page" page="Home" keywords={["trading", "thecaptaltree", "risk management", "strategies"]}/>
            <Header />
            <main className="main-content-services">
                {/* Services Section */}
                <section className="services-section">
                    <h1 className="main-heading-services">Our Services</h1>
                    <p className="services-description">
                        TheCapitalTree provides top-tier investment solutions to help you grow your wealth strategically.
                    </p>
                    
                    <div className="services-grid">
                        <div className="service-card">
                            <i className="icon-portfolio"></i>
                            <h3>Portfolio Management</h3>
                            <p>Expertly managed investment portfolios tailored to your needs.</p>
                        </div>
                        <div className="service-card">
                            <i className="icon-wealth"></i>
                            <h3>Wealth Planning</h3>
                            <p>Smart strategies to secure and grow your financial future.</p>
                        </div>
                        <div className="service-card">
                            <i className="icon-market"></i>
                            <h3>Market Insights & Reports</h3>
                            <p>Stay updated with the latest market trends and reports.</p>
                        </div>
                        <div className="service-card">
                            <i className="icon-risk"></i>
                            <h3>Risk Mitigation Strategies</h3>
                            <p>Comprehensive plans to minimize investment risks.</p>
                        </div>
                        <div className="service-card">
                            <i className="icon-sustainable"></i>
                            <h3>Sustainable Investing</h3>
                            <p>Invest in eco-friendly and socially responsible ventures.</p>
                        </div>
                    </div>
                </section>

                {/* Contact & Newsletter Section */}
                <section className="contact-section">
                    <h2 className="contact-heading">Stay Informed, Stay Ahead</h2>
                    <p className="contact-text">Subscribe to TheCapitalTree newsletter for market insights.</p>
                    <form className="contact-form">
                        <input type="text" placeholder="Name" required />
                        <input type="email" placeholder="Email" required />
                        <input type="tel" placeholder="Contact Number" required />
                        <button type="submit">Subscribe</button>
                    </form>
                </section>
            </main>
            <Footer />
        </div>
    );
}

export default Services;
