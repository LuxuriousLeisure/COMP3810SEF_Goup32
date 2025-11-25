require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;

const app = express();

// ===== Database Connection =====
const uri = 'mongodb+srv://wuyou007991:007991@cluster0.ashcnqc.mongodb.net/?appName=Cluster0';
const dbName = 'COMP3810SEFGroup32';

mongoose.connect(uri, { dbName })
    .then(() => console.log('Connected to MongoDB successfully'))
    .catch(err => console.error('MongoDB connection failed:', err));

// ===== Import Models =====
const userSchema = require('./models/user');
const postSchema = require('./models/post');
const commentSchema = require('./models/comment');
const followSchema = require('./models/follow');

const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);
const Comment = mongoose.model('Comment', commentSchema);
const Follow = mongoose.model('Follow', followSchema);

// ===== Middleware Setup =====
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'github-oauth-secret-2025',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Passport setup
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

// ===== GitHub OAuth Strategy =====
passport.use(new GitHubStrategy({
    clientID: "Ov23lizxsl8ccP70QnBZ",
    clientSecret: "b2fe86348ef7718c2c3806bc5a53de6f8bac15f6",
    callbackURL: "http://localhost:3000/auth/github/callback"
},
async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ githubId: profile.id });

        if (!user) {
            // Generate clean username: only letters, numbers, underscore
            let rawName = (profile.username || profile.displayName || 'github_user').toLowerCase();
            let username = rawName.replace(/[^a-z0-9_]/g, '_');
            while (username.length < 3) username += '_';
            username = username.substring(0, 20);

            // Ensure username is unique
            let finalUsername = username;
            let counter = 1;
            while (await User.findOne({ username: finalUsername })) {
                finalUsername = `${username}_${counter++}`.substring(0, 20);
            }

            user = await User.create({
                githubId: profile.id,
                username: finalUsername,
                profileImage: profile.photos?.[0]?.value || '/images/default-avatar.jpg'
            });

            console.log(`New GitHub user registered: ${finalUsername}`);
        }

        return done(null, user);
    } catch (err) {
        console.error('GitHub authentication error:', err);
        return done(err);
    }
}));

// ===== Authentication Middleware =====
function isAuthenticated(req, res, next) {
    if (req.session.userId || req.isAuthenticated()) return next();
    res.redirect('/login');
}

// ===== Routes =====

app.get('/', (req, res) => {
    req.isAuthenticated() ? res.redirect('/home') : res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.render('login', { message: req.query.message || null });
});

app.get('/register', (req, res) => {
    res.render('register', { message: null });
});

// GitHub OAuth Login
app.get('/auth/github', passport.authenticate('github', { scope: ['user:email'] }));

app.get('/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/login?message=GitHub login failed' }),
    (req, res) => {
        req.session.userId = req.user._id.toString();
        req.session.username = req.user.username;
        req.session.profileImage = req.user.profileImage;
        console.log(`GitHub login successful: ${req.user.username}`);
        res.redirect('/home');
    }
);

// Local Login
app.post('/api/users/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.render('login', { message: 'Please enter both username and password' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.render('login', { message: 'Username does not exist' });
        }

        if (password !== user.password) {
            return res.render('login', { message: 'Incorrect password' });
        }

        req.session.userId = user._id.toString();
        req.session.username = user.username;
        req.session.profileImage = user.profileImage;

        console.log(`Local login successful: ${username}`);
        res.redirect('/home');
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { message: 'Login failed. Please try again.' });
    }
});

// Local Register
app.post('/api/users/register', async (req, res) => {
    try {
        const { username, password, passwordConfirm } = req.body;

        if (!username || !password || !passwordConfirm) {
            return res.render('register', { message: 'All fields are required' });
        }

        if (password !== passwordConfirm) {
            return res.render('register', { message: 'Passwords do not match' });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.render('register', { message: 'Username already taken' });
        }

        await User.create({
            username,
            password,
            profileImage: '/images/default-avatar.jpg',
            followerCount: 0,
            followingCount: 0,
            postCount: 0
        });

        console.log(`User registered successfully: ${username}`);
        res.render('register', { message: 'Registration successful! Please log in.' });
    } catch (error) {
        console.error('Registration error:', error);
        res.render('register', { message: 'Registration failed. Please try again.' });
    }
});

// Home Feed
app.get('/home', isAuthenticated, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const totalPosts = await Post.countDocuments();
        const totalPages = Math.ceil(totalPosts / limit);

        const posts = await Post.find()
            .populate('userId', 'username profileImage')
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit);

        const validPosts = posts.filter(post => post.userId !== null);

        const currentUser = await User.findById(req.session.userId || req.user._id);
        if (!currentUser) {
            req.session.destroy();
            return res.redirect('/login?message=Session expired. Please log in again.');
        }

        console.log(`${currentUser.username} viewed home feed – ${validPosts.length} posts loaded`);

        res.render('home', {
            posts: validPosts,
            currentPage: page,
            totalPages,
            user: currentUser,
            message: null
        });
    } catch (error) {
        console.error('Home page error:', error);
        res.status(500).render('error', { error: 'Failed to load home page', statusCode: 500 });
    }
});

// Publish Page
app.get('/publish', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId || req.user._id);
        if (!user) {
            req.session.destroy();
            return res.redirect('/login?message=Please log in again');
        }
        res.render('publish', { user, message: null });
    } catch (error) {
        console.error('Publish page error:', error);
        res.status(500).render('error', { error: 'Failed to load publish page', statusCode: 500 });
    }
});

// Create Post
app.post('/api/posts', isAuthenticated, async (req, res) => {
    try {
        const { imageUrls, content, tags } = req.body;

        if (!imageUrls || !content) {
            return res.status(400).json({ success: false, message: 'Image URLs and content are required' });
        }

        const images = imageUrls.split('\n').map(url => url.trim()).filter(url => url);
        if (images.length === 0) {
            return res.status(400).json({ success: false, message: 'At least one image URL is required' });
        }

        const tagArray = tags ? tags.split(/\s+/).filter(t => t) : [];

        const newPost = await Post.create({
            userId: req.session.userId || req.user._id,
            images,
            content,
            tags: tagArray,
            likeCount: 0
        });

        await User.findByIdAndUpdate(req.session.userId || req.user._id, { $inc: { postCount: 1 } });

        console.log('Post created successfully');
        res.json({ success: true, message: 'Post published successfully', postId: newPost._id });
    } catch (error) {
        console.error('Post creation error:', error);
        res.status(500).json({ success: false, message: 'Failed to publish post' });
    }
});

// Post Detail
app.get('/posts/:id', isAuthenticated, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id).populate('userId', 'username profileImage');
        if (!post) return res.status(404).render('error', { error: 'Post not found', statusCode: 404 });

        const comments = await Comment.find({ postId: req.params.id }).populate('userId', 'username profileImage');
        const currentUser = await User.findById(req.session.userId || req.user._id);

        if (!currentUser) {
            req.session.destroy();
            return res.redirect('/login?message=Please log in again');
        }

        const isOwner = post.userId._id.toString() === (req.session.userId || req.user._id.toString());

        res.render('post-detail', {
            post,
            comments,
            user: currentUser,
            isOwner,
            message: null
        });
    } catch (error) {
        console.error('Post detail error:', error);
        res.status(500).render('error', { error: 'Failed to load post', statusCode: 500 });
    }
});

// Profile Page
app.get('/profile', isAuthenticated, async (req, res) => {
    try {
        const currentUser = await User.findById(req.session.userId || req.user._id);
        if (!currentUser) {
            req.session.destroy();
            return res.redirect('/login?message=Please log in again');
        }

        const userPosts = await Post.find({ userId: currentUser._id }).sort({ _id: -1 });

        res.render('profile', { user: currentUser, userPosts, message: null });
    } catch (error) {
        console.error('Profile page error:', error);
        res.status(500).render('error', { error: 'Failed to load profile', statusCode: 500 });
    }
});

// Search
app.get('/search', isAuthenticated, async (req, res) => {
    try {
        const { q } = req.query;
        const currentUser = await User.findById(req.session.userId || req.user._id);
        if (!currentUser) {
            req.session.destroy();
            return res.redirect('/login?message=Please log in again');
        }

        if (!q) {
            return res.render('search-result', {
                searchType: null,
                searchQuery: '',
                users: [],
                posts: [],
                user: currentUser,
                message: null
            });
        }

        const isHashtag = q.startsWith('#');
        const query = isHashtag ? q.substring(1) : q;

        if (isHashtag) {
            const posts = await Post.find({ tags: { $regex: query, $options: 'i' } })
                .populate('userId', 'username profileImage')
                .sort({ _id: -1 });

            res.render('search-result', {
                searchType: 'tag',
                searchQuery: query,
                users: [],
                posts,
                user: currentUser,
                message: null
            });
        } else {
            const users = await User.find({ username: { $regex: query, $options: 'i' } });
            const posts = await Post.find({ content: { $regex: query, $options: 'i' } })
                .populate('userId', 'username profileImage')
                .sort({ _id: -1 });

            res.render('search-result', {
                searchType: 'user',
                searchQuery: query,
                users,
                posts,
                user: currentUser,
                message: null
            });
        }
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).render('error', { error: 'Search failed', statusCode: 500 });
    }
});

// Add Comment
app.post('/api/posts/:id/comments', isAuthenticated, async (req, res) => {
    try {
        const { content } = req.body;
        if (!content?.trim()) {
            return res.status(400).json({ success: false, message: 'Comment cannot be empty' });
        }

        const comment = await Comment.create({
            postId: req.params.id,
            userId: req.session.userId || req.user._id,
            content: content.trim()
        });

        console.log('Comment added');
        res.json({ success: true, message: 'Comment posted', comment });
    } catch (error) {
        console.error('Comment error:', error);
        res.status(500).json({ success: false, message: 'Failed to post comment' });
    }
});

// Like Post
app.post('/api/posts/:id/like', isAuthenticated, async (req, res) => {
    try {
        const post = await Post.findByIdAndUpdate(
            req.params.id,
            { $inc: { likeCount: 1 } },
            { new: true }
        );

        console.log('Post liked');
        res.json({ success: true, message: 'Liked', likeCount: post.likeCount });
    } catch (error) {
        console.error('Like error:', error);
        res.status(500).json({ success: false, message: 'Like failed' });
    }
});

// Delete Post
app.delete('/api/posts/:id', isAuthenticated, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

        if (post.userId.toString() !== (req.session.userId || req.user._id.toString())) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this post' });
        }

        await Post.findByIdAndDelete(req.params.id);
        await Comment.deleteMany({ postId: req.params.id });
        await User.findByIdAndUpdate(post.userId, { $inc: { postCount: -1 } });

        console.log('Post deleted');
        res.json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Delete post error:', error);
        res.status(500).json({ success: false, message: 'Delete failed' });
    }
});

// Logout
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Logout failed' });
        }
        console.log('User logged out successfully');
        res.redirect('/login');
    });
});

// View Other User's Profile
app.get('/users/:id', isAuthenticated, async (req, res) => {
    try {
        if (req.params.id === (req.session.userId || req.user._id.toString())) {
            return res.redirect('/profile');
        }

        const viewedUser = await User.findById(req.params.id);
        if (!viewedUser) return res.status(404).render('error', { error: 'User not found', statusCode: 404 });

        const currentUser = await User.findById(req.session.userId || req.user._id);
        if (!currentUser) {
            req.session.destroy();
            return res.redirect('/login');
        }

        const userPosts = await Post.find({ userId: req.params.id }).sort({ _id: -1 });
        const follow = await Follow.findOne({ follower: currentUser._id, followee: req.params.id });
        const isFollowing = !!follow;

        res.render('user-profile', {
            user: currentUser,
            viewedUser,
            userPosts,
            isFollowing,
            message: null
        });
    } catch (error) {
        console.error('User profile error:', error);
        res.status(500).render('error', { error: 'Failed to load profile', statusCode: 500 });
    }
});

// Follow User
app.post('/api/users/:id/follow', isAuthenticated, async (req, res) => {
    try {
        const followeeId = req.params.id;
        const followerId = req.session.userId || req.user._id;

        if (followeeId === followerId) {
            return res.json({ success: false, message: "You can't follow yourself" });
        }

        const existing = await Follow.findOne({ follower: followerId, followee: followeeId });
        if (existing) {
            return res.json({ success: false, message: 'You are already following this user' });
        }

        await Follow.create({ follower: followerId, followee: followeeId });
        await User.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } });
        await User.findByIdAndUpdate(followeeId, { $inc: { followerCount: 1 } });

        console.log(`User ${followerId} followed ${followeeId}`);
        res.json({ success: true, message: 'Followed successfully' });
    } catch (error) {
        console.error('Follow error:', error);
        res.status(500).json({ success: false, message: 'Follow failed' });
    }
});

// Unfollow User
app.post('/api/users/:id/unfollow', isAuthenticated, async (req, res) => {
    try {
        const result = await Follow.findOneAndDelete({
            follower: req.session.userId || req.user._id,
            followee: req.params.id
        });

        if (!result) {
            return res.json({ success: false, message: "You are not following this user" });
        }

        await User.findByIdAndUpdate(req.session.userId || req.user._id, { $inc: { followingCount: -1 } });
        await User.findByIdAndUpdate(req.params.id, { $inc: { followerCount: -1 } });

        console.log('Unfollowed successfully');
        res.json({ success: true, message: 'Unfollowed' });
    } catch (error) {
        console.error('Unfollow error:', error);
        res.json({ success: false, message: 'Unfollow failed' });
    }
});

// Settings Page
app.get('/settings', isAuthenticated, async (req, res) => {
    const user = await User.findById(req.session.userId || req.user._id);
    res.render('settings', { user, message: null });
});

// Update Avatar
app.post('/settings/update-avatar', isAuthenticated, async (req, res) => {
    try {
        const { avatarUrl } = req.body;
        if (!avatarUrl?.trim()) {
            const user = await User.findById(req.session.userId || req.user._id);
            return res.render('settings', { user, message: { type: 'error', text: 'Please provide an avatar URL' } });
        }

        await User.findByIdAndUpdate(req.session.userId || req.user._id, { profileImage: avatarUrl });
        req.session.profileImage = avatarUrl;

        const updatedUser = await User.findById(req.session.userId || req.user._id);
        res.render('settings', { user: updatedUser, message: { type: 'success', text: 'Avatar updated!' } });
    } catch (error) {
        const user = await User.findById(req.session.userId || req.user._id);
        res.render('settings', { user, message: { type: 'error', text: 'Update failed' } });
    }
});

// Update Username
app.post('/settings/update-username', isAuthenticated, async (req, res) => {
    try {
        const { newUsername } = req.body;
        if (!newUsername || newUsername.trim().length < 3) {
            const user = await User.findById(req.session.userId || req.user._id);
            return res.render('settings', { user, message: { type: 'error', text: 'Username must be at least 3 characters' } });
        }

        const taken = await User.findOne({ username: newUsername });
        if (taken && taken._id.toString() !== (req.session.userId || req.user._id.toString())) {
            const user = await User.findById(req.session.userId || req.user._id);
            return res.render('settings', { user, message: { type: 'error', text: 'Username already taken' } });
        }

        await User.findByIdAndUpdate(req.session.userId || req.user._id, { username: newUsername });
        req.session.username = newUsername;

        const updatedUser = await User.findById(req.session.userId || req.user._id);
        res.render('settings', { user: updatedUser, message: { type: 'success', text: 'Username updated!' } });
    } catch (error) {
        const user = await User.findById(req.session.userId || req.user._id);
        res.render('settings', { user, message: { type: 'error', text: 'Update failed' } });
    }
});

// Update Password
app.post('/settings/update-password', isAuthenticated, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const user = await User.findById(req.session.userId || req.user._id);

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.render('settings', { user, message: { type: 'error', text: 'All fields are required' } });
        }
        if (currentPassword !== user.password) {
            return res.render('settings', { user, message: { type: 'error', text: 'Current password is incorrect' } });
        }
        if (newPassword.length < 6) {
            return res.render('settings', { user, message: { type: 'error', text: 'New password must be at least 6 characters' } });
        }
        if (newPassword !== confirmPassword) {
            return res.render('settings', { user, message: { type: 'error', text: 'Passwords do not match' } });
        }

        user.password = newPassword;
        await user.save();

        res.render('settings', { user, message: { type: 'success', text: 'Password updated successfully!' } });
    } catch (error) {
        const user = await User.findById(req.session.userId || req.user._id);
        res.render('settings', { user, message: { type: 'error', text: 'Update failed' } });
    }
});

// Following List
app.get('/following', isAuthenticated, async (req, res) => {
    const currentUser = await User.findById(req.session.userId || req.user._id);
    const follows = await Follow.find({ follower: currentUser._id }).populate('followee', 'username profileImage');
    const followingList = follows.map(f => f.followee);

    res.render('following-list', { user: currentUser, followingList });
});

// Followers List
app.get('/followers', isAuthenticated, async (req, res) => {
    const currentUser = await User.findById(req.session.userId || req.user._id);
    const follows = await Follow.find({ followee: currentUser._id }).populate('follower', 'username profileImage');
    const followersList = follows.map(f => f.follower);

    res.render('followers-list', { user: currentUser, followersList });
});

// Remove from Following / Followers
app.post('/following/:id/unfollow', isAuthenticated, async (req, res) => {
    await Follow.findOneAndDelete({ follower: req.session.userId || req.user._id, followee: req.params.id });
    await User.findByIdAndUpdate(req.session.userId || req.user._id, { $inc: { followingCount: -1 } });
    await User.findByIdAndUpdate(req.params.id, { $inc: { followerCount: -1 } });
    res.redirect('/following');
});

app.post('/followers/:id/remove', isAuthenticated, async (req, res) => {
    await Follow.findOneAndDelete({ follower: req.params.id, followee: req.session.userId || req.user._id });
    await User.findByIdAndUpdate(req.params.id, { $inc: { followingCount: -1 } });
    await User.findByIdAndUpdate(req.session.userId || req.user._id, { $inc: { followerCount: -1 } });
    res.redirect('/followers');
});

// 404 Page
app.use((req, res) => {
    res.status(404).render('error', {
        error: 'Page Not Found (404)',
        statusCode: 404
    });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Local: http://localhost:${PORT}`);
    console.log(`On Your Phone: http://YOUR_COMPUTER_LOCAL_IP:${PORT}`);
    console.log(`Example → http://192.168.x.x:${PORT}`);
});
