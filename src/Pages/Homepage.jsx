import React, { useState } from 'react';
import '../assets/styles/Homepage.scss';
import Header from '../Component/Header';
import Footer from '../Component/Footer';
import mob from '../assets/image/home-img.png';
import mob2 from '../assets/image/home-img2.png';
import mob3 from '../assets/image/home-img3.png';
import Seo from '../Component/Seo';
import { FaTwitter, FaFacebookF, FaInstagram } from 'react-icons/fa';

const Homepage = () => {
  const [showPlans, setShowPlans] = useState(false);
  const [showStrategy, setShowStrategy] = useState(false);

  const handlePlansClick = () => {
    setShowPlans(!showPlans);
    setShowStrategy(false); // hide strategy if open
  };

  const handleStrategyClick = () => {
    setShowStrategy(!showStrategy);
    setShowPlans(false); // hide plans if open
  };

  return (
    <div className="homepage-container">
      <Seo 
        title="Home Page" 
        description="this is home page" 
        page="home" 
        keywords={["trading", "thecaptaltree", "risk management", "strategies"]} 
      />
      
      <Header />

      <main className="hero">
        {/* Decorative circles */}
        <div className="hero-bg" aria-hidden="true"></div>

        {/* Left sidebar with meta and socials */}
        <aside className="hero-aside" aria-label="page meta and socials">
          <div className="meta">
            <div>
              <span className="meta-label">Date</span>
              <span className="meta-value">20.05.2025</span>
            </div>
            <div>
              <span className="meta-label">Created</span>
              <span className="meta-value">2025</span>
            </div>
          </div>
          <div className="socials">
            <a href="https://twitter.com/thecapitaltree" target="_blank" rel="noopener noreferrer" aria-label="Twitter"><FaTwitter/></a>
            <a href="https://facebook.com/thecapitaltree" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><FaFacebookF/></a>
            <a href="https://instagram.com/thecapitaltree" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><FaInstagram/></a>
          </div>
        </aside>

        {/* Core content */}
        <section className="hero-content">
          <h1 className="hero-title">
            <span className="quote">“</span> Cultivating Growth <span className="quote">”</span>
            <br/>
            INTELLIGENT INVESTING AT ONE CLICK.
            <br/>
            time
          </h1>

          <div className="card-row">
            <figure className="hero-card">
              <img src={mob} alt="Trading dashboard visualization" loading="eager" />
              <figcaption>
                <div className="caption-title">Architecture</div>
                <div className="caption-sub">Trading dashboard visualization</div>
              </figcaption>
            </figure>
            <figure className="hero-card">
              <img src={mob2} alt="Stock market graphs & candlestick charts" loading="eager" />
              <figcaption>
                <div className="caption-title">Architecture</div>
                <div className="caption-sub">Stock market graphs & candlestick charts</div>
              </figcaption>
            </figure>
            <figure className="hero-card">
              <img src={mob3} alt="AI‑driven investment advisory" loading="eager" />
              <figcaption>
                <div className="caption-title">Architecture</div>
                <div className="caption-sub">AI‑driven investment advisory</div>
              </figcaption>
            </figure>
          </div>

          <div className="hero-footer-row">
            <div className="hero-labels">
              <div className="label-title">Fintech Trading</div>
              <div className="label-sub">Empowering investors with AI‑driven trading insights and real‑time analytics.</div>
            </div>
            <div className="hero-index">07</div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Homepage;
