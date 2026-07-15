import React, { useState, useEffect, useCallback } from "react";
import SidebarAdmin from "./AdminSidebar";
import "./Style/manageBlog.scss" // Ensure this SCSS file exists and is styled
import axios from "axios";

// --- Environment Variable for Blog API ---
const blogApiBaseUrl = import.meta.env.VITE_BLOG_API_BASE_URL;


// --- Axios Instance for Blog API ---
const blogApiClient = axios.create({
  baseURL: `${blogApiBaseUrl}/api`, // Appends /api
});

// Helper to get token
const getToken = () => localStorage.getItem("authToken");

// Add a request interceptor to include the token for blogApiClient
blogApiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    // Ensure Content-Type is set for POST/PUT if not already, though usually Axios handles this for JSON.
    // If you are sending JSON, Axios typically sets 'Content-Type': 'application/json' automatically for POST/PUT/PATCH.
    // But if you ever need to force it or for other types:
    // if (config.method === 'post' || config.method === 'put') {
    //   if (!config.headers['Content-Type']) {
    //     config.headers['Content-Type'] = 'application/json';
    //   }
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


// --- AddBlogModal (No changes needed from your previous version) ---
const AddBlogModal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay-manageBlog">
      <div className="modal-content-manageBlog">
        <button className="modal-close-manageBlog" onClick={onClose}>×</button>
        {children}
      </div>
    </div>
  );
};

// --- EditBlogModal Component (No changes needed from your previous version) ---
const EditBlogModal = ({
  isOpen,
  onClose,
  onSubmit,
  blogData,
  onInputChange,
  onRemoveImage,
  submissionError
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay-manageBlog">
      <div className="modal-content-manageBlog">
        <button className="modal-close-manageBlog" onClick={onClose}>×</button>
        <h3>Edit Blog Post</h3>
        <form onSubmit={onSubmit} className="edit-blog-form-manageBlog">
          {submissionError && <p className="error-message-manageBlog">{submissionError}</p>}
          
          <div className="form-group-manageBlog">
            <label htmlFor="edit-title">Title:</label>
            <input type="text" id="edit-title" name="title" value={blogData.title} onChange={onInputChange} required />
          </div>

          <div className="form-group-manageBlog">
            <label htmlFor="edit-content">Content:</label>
            <textarea id="edit-content" name="content" value={blogData.content} onChange={onInputChange} rows="5" required></textarea>
          </div>

          <div className="form-group-manageBlog">
            <label htmlFor="edit-author">Author:</label>
            <input type="text" id="edit-author" name="author" value={blogData.author} onChange={onInputChange} required />
          </div>

          <div className="form-group-manageBlog">
            <label htmlFor="edit-imageUrl">Image URL:</label>
            <input
              type="url"
              id="edit-imageUrl"
              name="imageUrl"
              value={blogData.imageUrl}
              onChange={onInputChange}
              placeholder=""
            />
            {blogData.imageUrl && (
              <div className="current-image-preview-manageBlog">
                <p>Current Image:</p>
                <img src={blogData.imageUrl} alt="Current blog visual" />
                <button type="button" onClick={onRemoveImage} className="remove-image-btn-manageBlog">
                  Remove Image
                </button>
              </div>
            )}
            {!blogData.imageUrl && <p className="no-image-text-manageBlog">No image currently set. You can add one above.</p>}
          </div>

          <div className="form-actions-manageBlog">
            <button type="submit" className="submit-btn-manageBlog">Update Blog</button>
            <button type="button" className="cancel-btn-manageBlog" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};


function ManageBlog() {
  const [blogData, setBlogData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newBlog, setNewBlog] = useState({
    title: "",
    content: "",
    author: "Admin",
    imageUrl: "",
  });
  const [addSubmissionError, setAddSubmissionError] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState(null);
  const [editFormState, setEditFormState] = useState({
    id: '',
    title: '',
    content: '',
    author: '',
    imageUrl: ''
  });
  const [editSubmissionError, setEditSubmissionError] = useState('');

  // Removed: const baseUrl = process.env.REACT_APP_API_BASE_URL;
  // Removed: const getToken = () => localStorage.getItem("authToken"); // Now defined globally for the client

  const fetchBlogs = useCallback(() => {
    setLoading(true);
    // Token is now handled by blogApiClient interceptor
    blogApiClient.get("/blogs") // Endpoint relative to baseURL
      .then((response) => {
        setBlogData(response.data);
        setError(null);
      })
      .catch((err) => {
        console.error("Error fetching blog data:", err);
        if (err.response && err.response.status === 401) {
          setError("Session expired or unauthorized. Please log in again.");
        } else {
          setError("Failed to load blog data. " + (err.response?.data?.message || err.message));
        }
      })
      .finally(() => setLoading(false));
  }, []); // Removed baseUrl from dependencies

  useEffect(() => {
    if (!blogApiBaseUrl) {
        setError("Blog API URL is not configured. Please check environment variables.");
        setLoading(false);
        return;
    }
    fetchBlogs();
  }, [fetchBlogs]); // fetchBlogs itself has no external dependencies now that will change

  const handleNewBlogInputChange = (e) => {
    const { name, value } = e.target;
    setNewBlog((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddNewBlog = async (e) => {
    e.preventDefault();
    setAddSubmissionError('');
    if (!newBlog.title || !newBlog.content || !newBlog.author) {
      setAddSubmissionError("Title, Content, and Author are required.");
      return;
    }
    const token = getToken(); // Check token existence for user feedback before API call
    if (!token) {
      setAddSubmissionError("Authentication token not found. Please log in again.");
      return;
    }
    try {
      // Headers are now handled by blogApiClient interceptor
      await blogApiClient.post("/blogs", newBlog); // Endpoint relative to baseURL
      fetchBlogs();
      setIsAddModalOpen(false);
      setNewBlog({ title: "", content: "", author: "Admin", imageUrl: "" });
    } catch (err) {
      console.error("Error adding new blog:", err);
      setAddSubmissionError("Failed to add blog. " + (err.response?.data?.message || err.message));
    }
  };

  const openAddModal = () => {
    setNewBlog({ title: "", content: "", author: "Admin", imageUrl: "" });
    setAddSubmissionError('');
    setIsAddModalOpen(true);
  };
  const closeAddModal = () => setIsAddModalOpen(false);

  const openEditModal = (blog) => {
    const currentBlogId = blog.id || blog._id;
    setEditingBlogId(currentBlogId);
    setEditFormState({
      id: currentBlogId,
      title: blog.title || '',
      content: blog.content || '',
      author: blog.author || 'Admin',
      imageUrl: blog.imageUrl || ''
    });
    setEditSubmissionError('');
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingBlogId(null);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormState(prev => ({ ...prev, [name]: value }));
  };

  const handleRemoveImageInEdit = () => {
    setEditFormState(prev => ({ ...prev, imageUrl: '' }));
  };

  const handleUpdateBlog = async (e) => {
    e.preventDefault();
    setEditSubmissionError('');
    if (!editFormState.title || !editFormState.content || !editFormState.author) {
      setEditSubmissionError("Title, Content, and Author are required.");
      return;
    }
    const token = getToken(); // Check token existence for user feedback
    if (!token) {
      setEditSubmissionError("Authentication token not found. Please log in again.");
      return;
    }

    const { id, ...payload } = editFormState; 

    try {
      // Headers are now handled by blogApiClient interceptor
      await blogApiClient.put(`/blogs/${editingBlogId}`, payload); // Endpoint relative to baseURL
      fetchBlogs();
      closeEditModal();
    } catch (err) {
      console.error("Error updating blog:", err);
      setEditSubmissionError("Failed to update blog. " + (err.response?.data?.message || err.message));
    }
  };

  // --- JSX Rendering (No changes in structure, only API call methods) ---
  return (
    <>
      <div className="dashboard-manageBlog">
        <SidebarAdmin />
        <div className="main-content-manageBlog">
          <h2>Welcome Back!</h2>
          <div className="stats">
            <div className="stat">
              <h4>Total Posts</h4>
              <p>{blogData.length}</p>
            </div>
          </div>
          <div className="recent-blog">
            <div className="recent-blog-header">
              <h4>Recent Blogs</h4>
              <button className="add-new" onClick={openAddModal}>+ Add New</button>
            </div>
            {loading && <p>Loading blogs...</p> }
            {error && !loading && <p className="error">{error}</p>}
            {!loading && !error && blogData.length === 0 && <p>No blogs found. Add one!</p>}
            {!loading && !error && blogData.length > 0 && (
              <div className="blog-list-manageBlog">
                {blogData.map((blog) => (
                  <div className="blog-item-manageBlog" key={blog.id || blog._id}>
                    {blog.imageUrl && (
                      <img src={blog.imageUrl} alt={blog.title} className="blog-item-image-manageBlog" />
                    )}
                    <div className="blog-item-details-manageBlog">
                      <h5 className="blog-item-title-manageBlog">{blog.title}</h5>
                      <p className="blog-item-author-manageBlog">Author: {blog.author || 'N/A'}</p>
                      <div className="blog-item-meta-manageBlog">
                        <span>{blog.comments_count || blog.comments?.length || 0} Comments</span>
                        <span>{blog.likes || 0} Likes</span>
                        <span>{blog.views || 0} Views</span>
                      </div>
                    </div>
                    <button 
                      className="edit-blog-btn-manageBlog" 
                      onClick={() => openEditModal(blog)}
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AddBlogModal isOpen={isAddModalOpen} onClose={closeAddModal}>
        <h3>Add New Blog Post</h3>
        <form onSubmit={handleAddNewBlog} className="add-blog-form-manageBlog">
          {addSubmissionError && <p className="error-message-manageBlog">{addSubmissionError}</p>}
          <div className="form-group-manageBlog">
            <label htmlFor="title">Title:</label>
            <input type="text" id="title" name="title" value={newBlog.title} onChange={handleNewBlogInputChange} required />
          </div>
          <div className="form-group-manageBlog">
            <label htmlFor="content">Content:</label>
            <textarea id="content" name="content" value={newBlog.content} onChange={handleNewBlogInputChange} rows="5" required></textarea>
          </div>
          <div className="form-group-manageBlog">
            <label htmlFor="author">Author:</label>
            <input type="text" id="author" name="author" value={newBlog.author} onChange={handleNewBlogInputChange} required />
          </div>
          <div className="form-group-manageBlog">
            <label htmlFor="imageUrl">Image URL (Optional):</label>
            <input type="url" id="imageUrl" name="imageUrl" placeholder="https://example.com/image.png" value={newBlog.imageUrl} onChange={handleNewBlogInputChange} />
          </div>
          <div className="form-actions-manageBlog">
            <button type="submit" className="submit-btn-manageBlog">Add Blog</button>
            <button type="button" className="cancel-btn-manageBlog" onClick={closeAddModal}>Cancel</button>
          </div>
        </form>
      </AddBlogModal>

      <EditBlogModal
        isOpen={isEditModalOpen}
        onClose={closeEditModal}
        onSubmit={handleUpdateBlog}
        blogData={editFormState}
        onInputChange={handleEditInputChange}
        onRemoveImage={handleRemoveImageInEdit}
        submissionError={editSubmissionError}
      />
    </>
  );
}

export default ManageBlog;  
