// server.js - Mini Instagram for COMP S381F/3810SEF

const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();

// MongoDB
const uri = 'mongodb+srv://wuyou007991:007991@cluster0.ashcnqc.mongodb.net/?appName=Cluster0';
async function main() {
  await mongoose.connect(uri, { dbName: 'COMP3810SEFGroup32' });
  console.log('Mongoose Connected!');
}
main().catch(err => console.log(err));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.set('view engine', 'ejs');
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});


app.use(session({
  secret: process.env.SESSION_SECRET || 'mini_ig_secret_2025',
  resave: false,
  saveUninitialized: false
}));

// Multer - image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Models
const User = require('./models/User');
const Post = require('./models/Post');

// Auth middleware
const requireLogin = (req, res, next) => {
  if (req.session.user) next();
  else res.redirect('/login');
};

// =============== WEB ROUTES (need login) ===============

// Register
app.get('/register', (req, res) => res.render('register', { user: null }));
app.post('/register', async (req, res) => {
  const hashed = await bcrypt.hash(req.body.password, 10);
  await User.create({ username: req.body.username, password: hashed });
  res.redirect('/login');
});

// Login
app.get('/login', (req, res) => res.render('login', { user: null }));

app.post('/login', async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (user && await bcrypt.compare(req.body.password, user.password)) {
    req.session.user = { id: user._id, username: user.username };
    res.redirect('/');
  } else {
    res.send('Wrong credentials <a href="/login">Try again</a>');
  }
});

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Home - feed
app.get('/', requireLogin, async (req, res) => {
  const posts = await Post.find().populate('author', 'username').sort({ createdAt: -1 });
  res.render('home', { posts, user: req.session.user || null });
});

// New post page
app.get('/post/new', requireLogin, (req, res) => res.render('new-post', { user: req.session.user || null }));

// Create post
app.post('/post', requireLogin, upload.single('image'), async (req, res) => {
  await Post.create({
    image: '/uploads/' + req.file.filename,
    caption: req.body.caption,
    author: req.session.user.id
  });
  res.redirect('/');
});

// Like post
app.post('/post/:id/like', requireLogin, async (req, res) => {
  const post = await Post.findById(req.params.id);
  const userId = req.session.user.id;
  if (post.likes.includes(userId)) {
    post.likes.pull(userId);
  } else {
    post.likes.push(userId);
  }
  await post.save();
  res.redirect('/');
});

// Delete own post
app.post('/post/:id/delete', requireLogin, async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (post.author.toString() === req.session.user.id) {
    await Post.findByIdAndDelete(req.params.id);
  }
  res.redirect('/');
});

// =============== RESTful API (no auth required) ===============

app.get('/api/posts', async (req, res) => {
  const posts = await Post.find().populate('author', 'username').sort({ createdAt: -1 });
  res.json(posts);
});

app.post('/api/posts', upload.single('image'), async (req, res) => {
  const post = await Post.create({
    image: '/uploads/' + req.file.filename,
    caption: req.body.caption || '',
    author: null   // anonymous for public API
  });
  res.status(201).json(post);
});

app.put('/api/posts/:id', async (req, res) => {
  const post = await Post.findByIdAndUpdate(req.params.id, { caption: req.body.caption }, { new: true });
  res.json(post);
});

app.delete('/api/posts/:id', async (req, res) => {
  await Post.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

// Start
const PORT = process.env.PORT || 8099;

app.listen(PORT, () => console.log(`Mini-IG running on http://localhost:${PORT}`));





