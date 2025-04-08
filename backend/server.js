const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: "*", // Replace "*" with your frontend's URL for better security
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));
app.use(bodyParser.json());
app.use(express.json());

// Authentication middleware
function authenticateToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, 'your_jwt_secret', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// MongoDB Connection
const MONGO_URI = 'mongodb+srv://ColinceLupin:10Million$$@colincelupin.bc8p5u7.mongodb.net/GEN-Z?retryWrites=true&w=majority';
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Error connecting to MongoDB:', err));

// Define a Post Schema
const PostSchema = new mongoose.Schema({
  title: String,
  content: String,
  likes: { type: Number, default: 0 },
  comments: [
    {
      text: String,
      replies: [{ text: String }],
    },
  ],
});

const Post = mongoose.model('Post', PostSchema);

// Define a User Schema
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Friend connections
});

const User = mongoose.model('User', UserSchema);

// Routes

// Get all posts
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await Post.find();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Create a new post
app.post('/api/posts', async (req, res) => {
  try {
    const { title, content } = req.body;
    const newPost = new Post({ title, content });
    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Add a comment to a post
app.post('/api/posts/:id/comments', async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);
    post.comments.push({ text });
    await post.save();
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Like a post
app.post('/api/posts/:id/like', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    post.likes += 1;
    await post.save();
    res.status(200).json(post);
  } catch (err) {
    res.status(500).json({ error: 'Failed to like post' });
  }
});

// Register a new user
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login a user
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Compare the password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Generate a JWT token
    const token = jwt.sign({ userId: user._id }, 'your_jwt_secret', { expiresIn: '1h' });

    res.status(200).json({ token, message: 'Login successful' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to log in' });
  }
});

// Send a friend request
app.post('/api/users/:id/friend-request', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const friendId = req.params.id;

    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!friend) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add friend to user's friends list
    user.friends.push(friendId);
    friend.friends.push(userId);

    await user.save();
    await friend.save();

    res.status(200).json({ message: 'Friend request sent successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send friend request' });
  }
});

// Get friends list
app.get('/api/users/:id/friends', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('friends', 'username email');
    res.status(200).json(user.friends);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch friends list' });
  }
});

app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Triggering new deployment

async function createPost() {
  const title = document.getElementById("post-title").value.trim();
  const content = document.getElementById("post-content").value.trim();

  if (!title || !content) {
    alert("Please fill in both the title and content.");
    return;
  }

  try {
    const response = await fetch("https://vast-bayou-80396-565a5a041ae1.herokuapp.com/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });

    if (response.ok) {
      closeModal(); // Close the modal after creating the post
      fetchPosts(); // Refresh the posts
    } else {
      const errorData = await response.json();
      alert(`Failed to create post: ${errorData.error || "Unknown error"}`);
    }
  } catch (err) {
    console.error("Error creating post:", err);
    alert("An error occurred. Please try again.");
  }
}

async function signup() {
  const username = document.getElementById("signup-username").value.trim();
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value.trim();

  if (!username || !email || !password) {
    alert("Please fill in all fields.");
    return;
  }

  try {
    const response = await fetch("https://vast-bayou-80396-565a5a041ae1.herokuapp.com/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    if (response.ok) {
      alert("Signup successful! Please log in.");
    } else {
      const errorData = await response.json();
      alert(`Failed to sign up: ${errorData.error || "Unknown error"}`);
    }
  } catch (err) {
    console.error("Error signing up:", err);
    alert("An error occurred. Please try again.");
  }
}
