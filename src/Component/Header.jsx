import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../assets/styles/Header.scss";
import logo from "../assets/image/logo.png";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  // Close menu when a link is clicked
  const closeMenu = () => {
    setMenuOpen(false);
  };

  // Handle login link click - force navigation even if already on login page
  const handleLoginClick = (e) => {
    closeMenu();
    
    // If already on login page, force a refresh by adding a timestamp parameter
    if (location.pathname === '/login') {
      e.preventDefault();
      // Use navigate with replace to trigger a re-render
      window.location.href = '/login?view=login&t=' + Date.now();
    }
  };

  return (
    <header className="header">
      <div className="logo">
        <Link to="/" onClick={closeMenu}>
          <img src={logo} alt="The Capital Tree Logo" title="logo" height="40px" width="120px" loading="eager" />
        </Link>
      </div>
      
      {/* Hamburger Menu Button */}
      <button
        className={`hamburger ${menuOpen ? "active" : ""}`}
        onClick={toggleMenu}
        aria-label="Toggle navigation"
        aria-expanded={menuOpen}
        aria-controls="nav-menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      
      {/* Navigation Links */}
      <nav className="nav-center">
        <ul id="nav-menu" className={`nav-links ${menuOpen ? "open" : ""}`}>
          <li><Link className="nav-link" to="/" onClick={closeMenu}>Home</Link></li>
          <li><Link className="nav-link" to="/about" onClick={closeMenu}>About Us</Link></li>
          <li><Link className="nav-link" to="/invest" onClick={closeMenu}>Invest</Link></li>
          <li><Link className="nav-link" to="/swp-calculator" onClick={closeMenu}>SWP Calculator</Link></li>
          <li className="nav-divider" aria-hidden="true"></li>
          <li><Link className="nav-link" to="/learn" onClick={closeMenu}>Learn</Link></li>
          <li><Link className="nav-link" to="/support" onClick={closeMenu}>Support</Link></li>
          {/* Mobile-only Login item */}
          <li className="nav-login-mobile">
            <Link 
              className="nav-link" 
              to="/login" 
              onClick={handleLoginClick}
            >
              Login
            </Link>
          </li>
        </ul>
      </nav>

      {/* Desktop Login on the right */}
      <div className="nav-cta">
        <Link 
          className="nav-link nav-link-login" 
          to="/login" 
          onClick={handleLoginClick}
        >
          Login
        </Link>
      </div>
    </header>
  );
};

export default Header;
