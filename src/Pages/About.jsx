import React from 'react';
import '../assets/styles/About.scss';
import Header from '../Component/Header';
import Footer from '../Component/Footer';
import { FaChartLine, FaUserShield, FaCoins, FaChartPie } from 'react-icons/fa';
import WCS from '../assets/image/About Us.png';
import Seo from '../Component/Seo';

const About = () => {
  return (
    <div className="about-container">
      <Seo 
        title="About Page" 
        description="This is the About page"  
        keywords={["trading", "thecapitaltree", "risk management", "strategies"]} 
      />

      <Header />

      {/* Main Content */}
      <main className="about">
        {/* Hero heading and intro */}
        <section className="about-hero">
          <h1 className="about-title">About <span className="accent">The Capital Tree</span></h1>
          <p className="about-intro">
            At The Capital Tree, we blend innovative strategies with rigorous analysis to help our clients achieve sustainable financial growth. Our team of seasoned experts specializes in diversified investment portfolios tailored to your goals.
          </p>
          <p className="about-intro">
            The Capital Tree is a next‑generation investment platform dedicated to helping individuals and families achieve financial freedom. We specialize in hedge funds and systematic investment plans (SIPs), offering stable and high‑yield investment options. Our mission is to bridge the gap between retail investors and sophisticated investment strategies, ensuring consistent returns with minimal risk.
          </p>
          <a href="#why" className="btn-learn">Learn more</a>
        </section>

        {/* Why Choose Us with images */}
        <section id="why" className="why">
          <h2 className="why-title"><span className="accent">W</span>hy Choose Us</h2>
          <img src={WCS} alt="Why Choose Us - About The Capital Tree" loading="eager" />
        </section>

        {/* CTA */}
        <section className="about-cta">
          <h2>Join us in growing wealth smarter, faster and safer!</h2>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default About;