import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "./Sidebar";
import "./Style/BlogDetail.scss";

const BlogDetail = () => {
  const { blogId } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const baseUrl = process.env.REACT_APP_API_BASE_URL;

  useEffect(() => {
    const fetchBlogDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${baseUrl}/api/blogs/${blogId}`);
        setBlog(response.data);
      } catch (err) {
        console.error("Error fetching blog detail:", err);
        setError(
          "Failed to load blog post. " + (err.response?.data?.message || err.message)
        );
      } finally {
        setLoading(false);
      }
    };

    if (blogId) {
      fetchBlogDetail();
    }
  }, [blogId, baseUrl]);

  const handleBackToMarketGuides = () => {
    navigate("/dashboard/marketguides");
  };

  if (loading) {
    return (
      <div className="dashboard-blogdetail">
        <Sidebar />
        <div className="main-content-BlogDetail">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading blog post...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-blogdetail">
        <Sidebar />
        <div className="main-content-BlogDetail">
          <div className="error-container">
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={handleBackToMarketGuides} className="back-btn">
              Back to Market Guides
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="dashboard-blogdetail">
        <Sidebar />
        <div className="main-content-BlogDetail">
          <div className="not-found-container">
            <h2>Blog Post Not Found</h2>
            <p>The blog post you're looking for doesn't exist.</p>
            <button onClick={handleBackToMarketGuides} className="back-btn">
              Back to Market Guides
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-blogdetail">
      <Sidebar />
      <div className="main-content-BlogDetail">
        <div className="blog-detail-container">
          <button onClick={handleBackToMarketGuides} className="back-btn">
            ← Back to Market Guides
          </button>
          
          <article className="blog-post">
            <header className="blog-header">
              <h1 className="blog-title">{blog.title}</h1>
              <div className="blog-meta">
                <span className="blog-author">
                  By {blog.author || "TheCapitalTree Team"}
                </span>
                {blog.createdAt && (
                  <span className="blog-date">
                    {new Date(blog.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                )}
                {typeof blog.views !== 'undefined' && (
                  <span className="blog-views">{blog.views} Views</span>
                )}
                {typeof blog.likes !== 'undefined' && (
                  <span className="blog-likes">{blog.likes} Likes</span>
                )}
              </div>
            </header>

            {blog.imageUrl && (
              <div className="blog-image-container">
                <img
                  src={blog.imageUrl}
                  alt={blog.title}
                  className="blog-image"
                />
              </div>
            )}

            <div 
              className="blog-content"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />

            <footer className="blog-footer">
              <div className="blog-tags">
                {blog.tags && blog.tags.length > 0 && (
                  <div className="tags">
                    <span className="tags-label">Tags:</span>
                    {blog.tags.map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="blog-actions">
                <button 
                  onClick={() => window.print()} 
                  className="print-btn"
                >
                  Print Article
                </button>
                <button 
                  onClick={() => {
                    navigator.share ? 
                      navigator.share({
                        title: blog.title,
                        text: blog.title,
                        url: window.location.href
                      }) : 
                      navigator.clipboard.writeText(window.location.href)
                    }
                  } 
                  className="share-btn"
                >
                  Share
                </button>
              </div>
            </footer>
          </article>
        </div>
      </div>
    </div>
  );
};

export default BlogDetail; 
