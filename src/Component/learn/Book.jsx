import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Style/Book.scss";
import Header from "../../Component/Header";  
import Footer from "../../Component/Footer";  
import commonStocks from "../../assets/image/business1.jpg";
import thinkGrow from "../../assets/image/business2.jpg";
import smallBusiness from "../../assets/image/business3.jpg";
import richDad from "../../assets/image/business4.jpg"; 
import intelligentInvestor from "../../assets/image/business5.png";
import commonInvest from "../../assets/image/business7.jpg";
import psychologyMoney from "../../assets/image/business6.jpg";

const books = [
    { id: 1, title: "The Intelligent Investor", author: "Benjamin Graham", img: intelligentInvestor },
    { id: 2, title: "Rich Dad Poor Dad", author: "Robert Kiyosaki", img: richDad },
    { id: 3, title: "The Psychology of Money", author: "Morgan Housel", img: psychologyMoney },
    { id: 4, title: "Common Stocks and Uncommon Profits", author: "Philip Fisher", img: commonInvest },
    { id: 5, title: "Think And Grow Rich", author: "Napoleon Hill", img: commonStocks },
    { id: 6, title: "Small Business Big Money", author: "Akinola Alabi", img: smallBusiness },
    { id: 6, title: "Small Business Big Money", author: "Akinola Alabi", img: smallBusiness },
    { id: 6, title: "Small Business Big Money", author: "Akinola Alabi", img: smallBusiness }
];

const Book = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="book-page">
            <Header />
            
           
            <div className="book-content">
                
                <nav className={`sidebar ${isSidebarOpen ? "open" : "closed"}`}>
                <h2 className="sidebar-title">Learning Paths</h2>
                    <ul>
                        <li><Link to="/learn">Investment Learning</Link></li>
                        <li><Link to="/book">Books</Link></li>
                        <li><Link to="/short60">Short60</Link></li>
                        <li><Link to="/blog" activeClassName="active">Blog</Link></li>
                    </ul>
                </nav>

                {/* Book Section */}
                <div className="book-container">
                    <h2 className="book-title">Recommended Books</h2>
                    <div className="book-grid">
                        {books.map((book) => (
                            <div key={book.id} className="book-card">
                                <img src={book.img} alt={book.title} className="book-img" loading="lazy" />
                                <div className="book-info">
                                    <h3 className="book-name">{book.title}</h3>
                                    <p className="book-author">by {book.author}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Book;
