import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PostCard from '../components/PostCard';
import { X } from 'lucide-react';

const Feed = () => {
  const [posts, setPosts] = useState(null);
  const [feedStories, setFeedStories] = useState([]);
  const [activeUserStories, setActiveUserStories] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchFeedData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [postsRes, storiesRes] = await Promise.all([
        axios.get('https://simplesocialbackend.onrender.com/api/posts/feed', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('https://simplesocialbackend.onrender.com/api/stories/feed', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setPosts(postsRes.data.posts);

      const grouped = {};
      storiesRes.data.stories.forEach(s => {
        const uId = s.user._id;
        if (!grouped[uId]) grouped[uId] = { user: s.user, stories: [] };
        grouped[uId].stories.push(s);
      });
      // Sort each user's stories ascending (oldest first for sequential viewing)
      Object.values(grouped).forEach(g => g.stories.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));

      setFeedStories(Object.values(grouped));
    } catch (error) {
      console.error("Failed to fetch feed data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedData();
    const interval = setInterval(fetchFeedData, 10000); // 10s auto-refresh for feed
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center mt-10">
        <div className="text-muted">Loading feed...</div>
      </div>
    );
  }

  const openStoryViewer = (userStoryGroup) => {
    setActiveUserStories(userStoryGroup);
    setActiveStoryIndex(0);
  };

  return (
    <div className="feed-container animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
      {activeUserStories && (
        <div className="story-viewer-modal glass-panel animate-fade-in" style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyItems: 'center', paddingTop: '5vh',
          background: 'rgba(0,0,0,0.95)'
        }}>
          <div style={{ position: 'absolute', top: '2rem', right: '2rem', cursor: 'pointer', zIndex: 1001 }} onClick={() => setActiveUserStories(null)}>
            <X size={36} color="white" />
          </div>

          <div className="story-image-container" style={{ position: 'relative', width: '100%', maxWidth: '420px', height: '80vh', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
            <img src={activeUserStories.stories[activeStoryIndex].image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

            <div style={{ position: 'absolute', top: '1rem', left: '1rem', display: 'flex', alignItems: 'center', gap: '0.8rem', zIndex: 20 }}>
              <img src={activeUserStories.user.profilePic} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid hotpink' }} onError={(e) => { e.target.style.display = 'none'; }} />
              <span style={{ color: 'white', fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{activeUserStories.user.username}</span>
            </div>

            <div style={{ position: 'absolute', top: '6px', left: '6px', right: '6px', display: 'flex', gap: '4px', zIndex: 20 }}>
              {activeUserStories.stories.map((_, i) => (
                <div key={i} style={{ flex: 1, height: '3px', background: i <= activeStoryIndex ? 'white' : 'rgba(255,255,255,0.4)', borderRadius: '2px' }} />
              ))}
            </div>

            {/* Navigation Taps */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '40%', height: '100%', cursor: 'pointer', zIndex: 10 }} onClick={() => {
              if (activeStoryIndex > 0) setActiveStoryIndex(activeStoryIndex - 1);
            }} />
            <div style={{ position: 'absolute', top: 0, right: 0, width: '60%', height: '100%', cursor: 'pointer', zIndex: 10 }} onClick={() => {
              if (activeStoryIndex < activeUserStories.stories.length - 1) setActiveStoryIndex(activeStoryIndex + 1);
              else setActiveUserStories(null);
            }} />
          </div>
        </div>
      )}

      <h2 className="heading-1" style={{ marginBottom: '1rem' }}>Feed</h2>

      {/* Stories Bar */}
      <div className="stories-bar glass-panel" style={{ display: 'flex', gap: '1.2rem', padding: '1.5rem 1rem', marginBottom: '2rem', overflowX: 'auto', scrollbarWidth: 'none', borderRadius: 'var(--radius-lg)' }}>
        {feedStories.length === 0 && <span className="text-muted" style={{ fontSize: '0.9rem' }}>No new stories</span>}
        {feedStories.map(group => (
          <div key={group.user._id} onClick={() => openStoryViewer(group)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', flexShrink: 0 }}>
            <div style={{ width: '74px', height: '74px', borderRadius: '50%', padding: '3px', background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}>
              <img src={group.user.profilePic} alt={group.user.username} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--bg-color)' }} onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }} />
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>{group.user.username}</span>
          </div>
        ))}
      </div>
      {posts?.length === 0 ? (
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <p className="text-muted">No posts yet. Be the first to post!</p>
        </div>
      ) : (
        posts?.map(post => <PostCard key={post._id} post={post} />)
      )}
    </div>
  );
};

export default Feed;
