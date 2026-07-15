import React from "react";
import { Link } from "react-router-dom";
import { FaInstagram, FaLinkedin, FaFacebook, FaTwitter } from "react-icons/fa";
import "../assets/styles/Footer.scss";
import footerLogo from "../assets/image/logo.png"; // Assuming this is still used for the company logo

const Footer = () => {
    return (
        
        <footer className="footer">
            <div className="footer-wave" aria-hidden="true">
                <svg viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#d1e7d0" fillOpacity="1" d="M0,64L40,90.7C80,117,160,171,240,186.7C320,203,400,181,480,154.7C560,128,640,96,720,80C800,64,880,64,960,85.3C1040,107,1120,149,1200,170.7C1280,192,1360,192,1400,192L1440,192L1440,0L0,0Z"></path>
                </svg>
            </div>
            
          
            
            <div className="footer-content">
                <div className="footer-section company-info">
                    {/* Changed from .logo-text to .footer-heading for structure */}
                    <div className="footer-heading">
                        {/* Assuming footerLogo is used for the image next to 'The Capital Tree' */}
                        <img className="footerLogo" src={footerLogo} alt="logo" title="logo" loading="eager" />
                        <h2 className="logo-text">The Capital Tree</h2>
                    </div>
                    <p className="footer-para">
                        TheCapitalTree provides the best investment options to help you grow your wealth.
                    </p>
                    <div className="social-icons">
                        <a href="https://www.facebook.com/thecapitaltree" target="_blank" rel="noopener noreferrer">
                            <FaFacebook className="social-icon" />
                        </a>
                        <a href="https://www.instagram.com/thecapitaltree" target="_blank" rel="noopener noreferrer">
                            <FaInstagram className="social-icon" />
                        </a>
                        <a href="https://www.twitter.com/thecapitaltree" target="_blank" rel="noopener noreferrer">
                            <FaTwitter className="social-icon" />
                        </a>
                        <a href="https://www.linkedin.com/company/thecapitaltree" target="_blank" rel="noopener noreferrer">
                            <FaLinkedin className="social-icon" />
                        </a>
                    </div>
                </div>
                
                <div className="footer-section links-section">
                    <h3>Features</h3> {/* Added back H3 as per SCSS */}
                    <ul>
                        <li><Link to="/pricing">Pricing</Link></li>
                        <li><Link to="/login">Login</Link></li>
                        <li><Link to="/signup">Signup</Link></li>
                    </ul>
                </div>
                
                <div className="footer-section links-section">
                    <h3>Terms of Use</h3> {/* Added back H3 as per SCSS */}
                    <ul>
                        <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                        <li><Link to="/legal-notice">Legal Notice</Link></li>
                    </ul>
                </div>
                
                <div className="footer-section links-section">
                    <h3>Feedback</h3> {/* Added back H3 as per SCSS */}
                    <ul>
                        <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                        <li><Link to="/legal-notice">Legal Notice</Link></li>
                    </ul>
                </div>
            </div>
            
            <div className="footer-bottom">
                <p className="copyright">Made by Medro ❤</p>
            </div>
        </footer>
    );
};

export default Footer;