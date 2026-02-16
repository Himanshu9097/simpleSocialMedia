import React, { useState,useEffect } from 'react';
import axios from 'axios'

const Feed = () => {
  const [posts, setPosts] = useState([
    {
      _id: "1",
      image: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8",
      caption: "Beautiful Scenery",
    }
  ]);

  useEffect(()=>{
    axios.get("http://localhost:3000/posts").then((res)=>{
        setPosts(res.data.posts)
    })


  },[])



  return (
    <section className='feed-section'>
      {posts.length > 0 ? (
        posts.map((post) => (
          <div key={post._id} className="post-card">
            <img 
              src={post.image} 
              alt={post.caption} 
              className="post-image"
            />
            <p className="post-caption">{post.caption}</p>
          </div>
        ))
      ) : (
        <h1 className="no-posts">No posts available</h1>
      )}
    </section>
  );
}

export default Feed;