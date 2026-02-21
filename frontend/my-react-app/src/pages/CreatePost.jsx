import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UploadCloud } from 'lucide-react';
import './CreatePost.css';

const CreatePost = () => {
    const [caption, setCaption] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);
    const navigate = useNavigate();

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!imageFile) return;

        setLoading(true);
        const formData = new FormData();
        formData.append('image', imageFile);
        formData.append('caption', caption);

        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:3000/api/posts/create', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
                }
            });
            window.location.href = '/feed';
        } catch (error) {
            console.error("Failed to create post", error);
            alert("Failed to create post");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-post-container animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 className="heading-1">Create New Post</h2>

            <form onSubmit={handleSubmit} className="glass-panel create-post-form">
                <div
                    className={`image-upload-area ${imagePreview ? 'has-image' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                >
                    {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="image-preview" />
                    ) : (
                        <div className="upload-placeholder">
                            <UploadCloud size={48} color="var(--accent-color)" />
                            <p style={{ marginTop: '1rem', fontWeight: 600 }}>Click or drag to upload an image</p>
                            <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>JPEG, PNG, JPG up to 5MB</p>
                        </div>
                    )}
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={handleImageChange}
                />

                <div className="caption-input-container">
                    <textarea
                        placeholder="Write a caption..."
                        className="input-field caption-input"
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        rows="4"
                    />
                </div>

                <div style={{ padding: '0 1.5rem 1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={!imageFile || loading}
                    >
                        {loading ? 'Posting...' : 'Share Post'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreatePost;
