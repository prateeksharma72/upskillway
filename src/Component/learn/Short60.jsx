import React from "react";
import { Link } from "react-router-dom";
import "./Style/Short60.scss";
import Header from '../../Component/Header';
import Footer from '../../Component/Footer';

const Short60 = () => {
    return (
        <div className="short60-page">
            <Header />

            <div className="content-container">
                {/* Sidebar */}
                <nav className="sidebar">
                <h2 className="sidebar-title">Learning Paths</h2>
                    <ul>

                        <li><Link to="/learn">Investment Learning</Link></li>
                        <li><Link to="/book">Books</Link></li>
                        <li><Link to="/short60">Short60</Link></li>
                        <li><Link to="/blog" activeClassName="active">Blog</Link></li>
                    </ul>
                </nav>

                {/* Short60 Content */}
                <div className="short-container">
                    <h2 className="short-title">Short60</h2>
                    <iframe 
                        className="short-iframe"
                        src="https://shorts60.com"
                        title="Short60"
                    ></iframe>
                </div>
            </div>

            <Footer />
        </div>
    );
}

export default Short60;
