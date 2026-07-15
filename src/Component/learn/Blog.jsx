import React, { useState, useEffect, useCallback } from "react";
import { NavLink, Link } from "react-router-dom"; // Link for "Read More"
import axios from "axios";
import "./Style/Blog.scss" // Assuming this is your SCSS file for the blog page
import Header from "../Header";   // Assuming correct path
import Footer from "../Footer";   // Assuming correct path
import Seo from "../Seo";       // Assuming correct path

// Helper function to truncate content (optional)
const truncateContent = (htmlContent, maxLength) => {
  if (!htmlContent) return '';
  // Strip HTML tags for a cleaner excerpt
  const textContent = new DOMParser().parseFromString(htmlContent, 'text/html').body.textContent || "";
  if (textContent.length <= maxLength) return textContent;
  // Find the last space within the maxLength
  const trimmedString = textContent.substr(0, maxLength);
  return trimmedString.substr(0, Math.min(trimmedString.length, trimmedString.lastIndexOf(" "))) + "...";
};

function PublicBlogPage() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const baseUrl = process.env.REACT_APP_API_BASE_URL; // Your API base URL

  const fetchPublicBlogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Public endpoint, no token needed generally
      const response = await axios.get(`${baseUrl}/api/blogs`);
      // You might want to filter for "published" blogs if your API supports it
      // For example: response.data.filter(blog => blog.isPublished)
      setBlogs(response.data);
    } catch (err) {
      console.error("Error fetching public blog data:", err);
      setError(
        "Failed to load articles. " + (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchPublicBlogs();
  }, [fetchPublicBlogs]);

  return (
    <div className="blog-container">
      <Seo
        title="Blog & Insights - TheCapitalTree"
        description="Stay updated with expert market analysis, investment strategies, and financial insights from TheCapitalTree."
        page="Blog"
        keywords={[
          "blog",
          "insights",
          "market analysis",
          "investment strategies",
          "financial education",
          "thecaptaltree",
        ]}
      />

      <Header />

      <div className="blog-layout">
        {/* Sidebar - Reusing your provided sidebar structure */}
        <aside className="sidebar">
          <h2 className="sidebar-title">Learning Paths</h2>
          <ul>
            <li><NavLink to="/learn" className={({ isActive }) => (isActive ? "active" : "")}>Investment Learning</NavLink></li>
            <li><NavLink to="/book" className={({ isActive }) => (isActive ? "active" : "")}>Books</NavLink></li>
            <li><NavLink to="/short60" className={({ isActive }) => (isActive ? "active" : "")}>Short60</NavLink></li>
            <li><NavLink to="/blog" className={({ isActive }) => (isActive ? "active current-page" : "current-page")}>Blog</NavLink></li> {/* Mark current page */}
          </ul>
        </aside>

        {/* Main Content */}
        <main className="main-content-blog">
          <section className="blog-section">
            <h1 className="main-heading-blog">Blog & Insights</h1>
            <p className="intro-text">
              Stay updated with expert market analysis, investment strategies,
              and financial insights.
            </p>

            <div className="hero-blog"> {/* You can rename this class if 'hero' isn't appropriate */}
              <h3>Latest Articles:</h3>

              {loading && <p className="loading-text">Loading articles...</p>}
              {error && <p className="error-text">{error}</p>}
              
              {!loading && !error && blogs.length === 0 && (
                <p className="no-articles-text">No articles found at the moment. Check back soon!</p>
              )}

              {!loading && !error && blogs.length > 0 && (
                <div className="blog-grid">
                  {blogs.map((blog) => (
                    <div className="blog-card" key={blog.id || blog._id}>
                      {blog.imageUrl && (
                        <Link to={`/blog/${blog.id || blog._id}`} className="blog-card-image-link">
                          <img
                            src={blog.imageUrl}
                            alt={blog.title}
                            className="blog-card-image"
                          />
                        </Link>
                      )}
                      <div className="blog-card-content">
                        <h4 className="blog-card-title">
                          <Link to={`/blog/${blog.id || blog._id}`}>
                            {blog.title}
                          </Link>
                        </h4>
                        <p className="blog-card-author-date">
                          By {blog.author || "TheCapitalTree Team"} 
                          {blog.createdAt && ` on ${new Date(blog.createdAt).toLocaleDateString()}`}
                        </p>
                        <p className="blog-card-excerpt">
                          {truncateContent(blog.content, 120)} {/* Using helper to show excerpt */}
                        </p>
                        <div className="blog-card-meta">
                          {typeof blog.views !== 'undefined' && <span>{blog.views} Views</span>}
                          {typeof blog.likes !== 'undefined' && <span>{blog.likes} Likes</span>}
                        </div>
                        <Link
                          to={`/blog/${blog.id || blog._id}`} // Link to a single blog post page
                          className="read-more-link"
                        >
                          Read More →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="footer-note">
                📌 Explore more and take control of your financial future.
              </p>
            </div>
          </section>
        </main>
      </div>

      <Footer />
    </div>
  );
}

export default PublicBlogPage;