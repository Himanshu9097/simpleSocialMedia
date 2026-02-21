# 📸 Full-Stack Instagram Clone

Welcome to the Full-Stack Instagram Clone! This project is a complete, feature-rich social media application built using the **MERN Stack** (MongoDB, Express, React, Node.js) along with **Socket.io** for real-time interactions. 

This document explains exactly how the project is structured, what every file does, and how the entire system communicates. It is written so that anyone—even someone who doesn't code—can understand how the app works behind the scenes!

---

## 🌟 How the App Works (The Big Picture)

Imagine a restaurant:
1. **The Frontend (React - The Dining Room):** This is what you see and tap on your screen. It handles the beautiful UI, animations, loading spinners, and forms.
2. **The Backend (Node.js & Express - The Kitchen):** This is where the heavy lifting happens. It receives requests from the frontend, checks if you are allowed to do what you are asking (security), and prepares the data.
3. **The Database (MongoDB - The Pantry):** This is where all the permanent information is stored—user accounts, posts, messages, and followers.
4. **WebSockets (Socket.io - The Waiter):** Normally, the frontend has to ask the backend "Are there new messages?" constantly. WebSockets act like a waiter that instantly alerts the frontend the millisecond someone sends you a message or likes your post, without you needing to refresh the page!

### How the Frontend Connects to the Backend:
When you type your password and click "Login" on the **Frontend**, it sends a secure HTTP request (`Axios`) to the **Backend**. The Backend checks your password in the **Database**. If correct, the Backend gives the Frontend a digital wristband called a **JWT Token**. The Frontend saves this token and shows it to the Backend every time you want to view the Feed or send a message so the Backend knows exactly who you are!

---

## 📁 Detailed Project Structure

The project is split into two completely separate folders: `Backend` and `frontend`.

### 1. The Backend (`/Backend`)

This folder contains the server that runs 24/7, processing data and connecting to the database.

* **`server.js`**: The main power switch. This file connects to the MongoDB database, turns on the HTTP server, and initializes the Real-time WebSockets (`Socket.io`).
* **`app.js`**: The traffic controller. It registers all the "Routes" (URL paths) so that if a user goes to `/api/users/login`, it sends them to the correct controller.

#### 🗂️ Controllers (`src/controllers/`)
Think of Controllers as the brain for each specific feature. They receive data from the user, process it, talk to the database, and send an answer back.
* **`user.controller.js`**: Handles account creation (Registration), signing in (Login), fetching profiles, searching for friends, and managing the Follow/Unfollow request system.
* **`post.controller.js`**: Handles uploading images, creating new posts, updating your feed, liking/unliking photos, and writing comments.
* **`message.controller.js`**: Responsible for creating direct messages to friends and fetching chat history between two people.
* **`story.controller.js`**: Manages the upload of temporary Stories.
* **`notification.controller.js`**: Fetches a user's unread notifications (likes, followers, messages) and marks them as read.

#### 🗂️ Models (`src/models/`)
Models define the "blueprint" or structure of how data is strictly saved in the MongoDB database.
* **`user.model.js`**: Defines that a User must have a username, email, encrypted password, and arrays tracking who they follow.
* **`post.model.js`**: Defines that a Post must have an image URL, a caption, an author, and arrays of likes and comments.
* **`message.model.js`**: Stores the sender ID, receiver ID, the text sent, and the timestamp.
* **`story.model.js`**: Stores temporary image URLs. (This uses a special MongoDB feature called TTL—Time to Live—which automatically deletes stories after 24 hours).
* **`notification.model.js`**: Stores alerts so users know when someone interacts with them.

#### 🗂️ Middleware (`src/middleware/`)
Security guards that check requests before they reach the controllers.
* **`auth.middleware.js`**: Every time a user tries to access a protected route (like posting a picture), this guard steps in to verify their "JWT Token" wristband. If it's valid, they are allowed in. If not, they get an "Unauthorized" error.

#### 🗂️ Services & WebSockets
* **`storage.service.js`**: Takes uploaded image files and securely sends them to **ImageKit** (our cloud image storage), returning a live image URL to save in our database.
* **`socket.js`**: The live-connection hub. It keeps a record of which users are currently online and securely tunnels instant messages & notifications directly to their specific screens.

---

### 2. The Frontend (`/frontend/my-react-app`)

This folder contains the React application that runs in the browser.

* **`src/App.jsx`**: The main map of the application. It dictates the "Routes" (e.g., going to `/messages` loads the Messages page). It also prevents logged-out users from seeing private pages using a `ProtectedRoute` wrapper.
* **`src/SocketContext.jsx`**: A global brain that keeps the WebSocket connection alive across the entire app. It quietly listens in the background for incoming live messages and red-dot notification triggers.
* **`src/index.css` & `src/index.js`**: Contains the global design styles (colors, fonts, layout system) and boots up the React software.

#### 🗂️ Pages (`src/pages/`)
The full-screen views that the user sees.
* **`Auth.jsx`**: The Login & Sign Up screen.
* **`Feed.jsx`**: The main home page. It loads the `PostCard` components and displays a scrolling top-bar of live Stories.
* **`Profile.jsx`**: Displays a specific user's info, follower counts, and a grid tab system switching between Posts, Saved content, and Tagged photos. 
* **`Messages.jsx`**: The chat portal. Features a sidebar of connections and a live chat window that instantly prints messages using Socket.io.
* **`CreatePost.jsx`**: A screen with a file-picker allowing users to select an image from their phone/computer and write a caption.
* **`Search.jsx`**: Allows searching the database for other users by typing their username.

#### 🗂️ Components (`src/components/`)
Smaller, reusable building blocks used to create the Pages.
* **`Navbar.jsx`**: The sidebar menu (or bottom bar on mobile) that lets users navigate the app and opens the red-dot Notification dropdown.
* **`PostCard.jsx`**: The visually structured block that holds a single post (the author's photo, the image itself, the heart/comment buttons, and the timestamp).

---

## 🚀 How to Run the App on Your Own Computer

If you want to run this code locally on your laptop to write new code or test features, follow these steps:

### 1. Set Up Environment Variables (.env)
You need secret API keys to connect to databases.
In the `/Backend` folder, create a `.env` file that looks like this:
```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=a_random_secret_password_for_tokens
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=your_imagekit_url
```

In the `/frontend/my-react-app` folder, create a `.env` file:
```env
VITE_API_URL=http://localhost:3000
```

### 2. Run the Backend Server
Open a terminal, go into the Backend folder, install the packages, and start it:
```bash
cd Backend
npm install
node server.js
# Or use "npx nodemon server.js" so it auto-restarts when you edit code!
```

### 3. Run the Frontend React App
Open a brand new terminal window, go into the frontend folder, and start the Vite dev server:
```bash
cd frontend/my-react-app
npm install
npm run dev
```

Finally, open your browser and go to `http://localhost:5173` to see your running app!

---

## ✨ Summary of Key Technologies Used
* **React + Vite**: Ultra-fast frontend framework for building the user interface.
* **Node.js + Express.js**: Handles the powerful backend APIs.
* **MongoDB + Mongoose**: The NoSQL database storing JSON-like documents.
* **Socket.io**: Powers the realtime chat and live red-dot notification system.
* **ImageKit**: Cloud storage for automatically optimizing and serving user photos. 
* **Bcrypt & JWT**: Provides enterprise-grade password encryption and secure stateless authentication.
