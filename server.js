// server.js - 无加密版本
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
require('dotenv').config();

const app = express();

// ===== DB connection =====
const uri  = 'mongodb+srv://wuyou007991:007991@cluster0.ashcnqc.mongodb.net/?appName=Cluster0';
const dbName = 'COMP3810SEFGroup32';

mongoose.connect(uri, { dbName: dbName })
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err);
    });



// ===== import Models =====
const userSchema = require('./models/user');
const postSchema = require('./models/post');
const commentSchema = require('./models/comment');
const followSchema = require('./models/follow');

const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);
const Comment = mongoose.model('Comment', commentSchema);
const Follow = mongoose.model('Follow', followSchema);


// Middleware
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session config
app.use(session({
    secret: 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true
    }
}));

// Passport config
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err);
    }
});

// Facebook Strategy
passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: '/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'photos', 'email']
}, async (accessToken, refreshToken, profile, done) => {
    try {
        // Check if user exists
        let user = await User.findOne({ facebookId: profile.id });

        if (user) {
            return done(null, user);
        }

        // Create new user
        user = await User.create({
            facebookId: profile.id,
            username: profile.displayName || `fb_user_${profile.id}`,
            profileImage: profile.photos[0].value || '/images/default-avatar.jpg',
            followerCount: 0,
            followingCount: 0,
            postCount: 0
        });

        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

// middleware Authentication
function isAuthenticated(req, res, next) {
    if (req.session.userId || req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/login');
    }
}

// ===== Route:home page GET / =====
app.get('/', (req, res) => {
    if (req.session.userId || req.isAuthenticated()) {
        res.redirect('/home');
    } else {
        res.redirect('/login');
    }
});

// ===== route：login page GET /login =====
app.get('/login', (req, res) => {
    res.render('login', { 
        message: req.query.message || null 
    });
});

// ===== route:register GET /register =====
app.get('/register', (req, res) => {
    res.render('register', { 
        message: req.query.message || null 
    });
});

// ===== Facebook Auth Routes =====
app.get('/auth/facebook', passport.authenticate('facebook', { scope: ['email'] }));

app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    (req, res) => {
        // Successful authentication
        req.session.userId = req.user._id.toString();
        req.session.username = req.user.username;
        req.session.profileImage = req.user.profileImage;
        console.log(`✅ Facebook 用户登录成功: ${req.user.username}`);
        res.redirect('/home');
    }
);

// ===== 8. 路由：用户登录 POST /api/users/login =====
app.post('/api/users/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // 验证输入
        if (!username || !password) {
            return res.render('login', {
                message: '❌ 请输入用户名和密码'
            });
        }

        // 从数据库查询用户
        const user = await User.findOne({ username });

        if (!user) {
            return res.render('login', {
                message: '❌ 用户名不存在'
            });
        }

        // 直接比对密码（无加密）
        if (password !== user.password) {
            return res.render('login', {
                message: '❌ 密码错误'
            });
        }

        // 保存 session（标记用户已登录）
        req.session.userId = user._id.toString();
        req.session.username = user.username;
        req.session.profileImage = user.profileImage;

        console.log(`✅ 用户登录成功: ${username}`);
        return res.redirect('/home');
    } catch (error) {
        console.error('❌ 登录错误:', error);
        res.render('login', {
            message: '❌ 登录失败，请重试'
        });
    }
});

// ===== 9. 路由：用户注册 POST /api/users/register =====
app.post('/api/users/register', async (req, res) => {
    try {
        const { username, password, passwordConfirm } = req.body;

        // 验证输入
        if (!username || !password || !passwordConfirm) {
            return res.render('register', {
                message: '❌ 请填写所有字段'
            });
        }

        if (password !== passwordConfirm) {
            return res.render('register', {
                message: '❌ 密码不匹配'
            });
        }

        // 检查用户名是否已存在
        const userExists = await User.findOne({ username });
        if (userExists) {
            return res.render('register', {
                message: '❌ 用户名已存在'
            });
        }

        // 创建新用户（密码明文存储）
        const newUser = await User.create({
            username,
            password: password,
            profileImage: '/images/default-avatar.jpg',
            followerCount: 0,
            followingCount: 0,
            postCount: 0
        });

        console.log(`✅ 用户注册成功: ${username}`);
        return res.render('register', {
            message: '✅ 注册成功！请返回登录'
        });

    } catch (error) {
        console.error('❌ 注册错误:', error);
        res.render('register', {
            message: '❌ 注册失败，请重试'
        });
    }
});

// ===== 10. 路由：首页 GET /home =====
// ===== 10. 路由：首页 GET /home =====
app.get('/home', isAuthenticated, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        // 获取帖子总数
        const totalPosts = await Post.countDocuments();
        const totalPages = Math.ceil(totalPosts / limit);

        // 获取帖子列表并 populate 用户信息
        const posts = await Post.find()
            .populate('userId', 'username profileImage')
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit);

        // ✅ 過濾掉 userId 為 null 的帖子（用戶已被刪除）
        const validPosts = posts.filter(post => post.userId !== null);

        // 获取当前用户信息
        const currentUser = await User.findById(req.session.userId || req.user._id);
        
        // Null 检查
        if (!currentUser) {
            console.log('⚠️ 用户不存在，清除 session');
            req.session.destroy();
            return res.redirect('/login?message=請重新登入');
        }

        console.log(`📖 用户 ${currentUser.username} 查看首页 - 顯示 ${validPosts.length} 個有效帖子`);
        
        res.render('home', {
            posts: validPosts,  // 使用過濾後的帖子
            currentPage: page,
            totalPages: totalPages,
            user: currentUser,
            message: null
        });
    } catch (error) {
        console.error('❌ 获取首页错误:', error);
        res.status(500).render('error', {
            error: '❌ 加载首页失败',
            statusCode: 500
        });
    }
});

// ===== 11. 路由：发布页面 GET /publish =====
app.get('/publish', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId || req.user._id);
        // ✅ Null 检查
        if (!user) {
            console.log('⚠️ 用户不存在，清除 session');
            req.session.destroy();
            return res.redirect('/login?message=請重新登入');
        }

        res.render('publish', { 
            user: user,
            message: null
        });
    } catch (error) {
        console.error('❌ 获取发布页错误:', error);
        res.render('error', {
            error: '加载发布页失败',
            statusCode: 500
        });
    }
});

// ===== 12. 路由：发布帖子 POST /api/posts =====
app.post('/api/posts', isAuthenticated, async (req, res) => {
    try {
        const { imageUrls, content, tags } = req.body;

        // 验证输入
        if (!imageUrls || !content) {
            return res.status(400).json({
                success: false,
                message: '❌ 请输入图片URL和内容'
            });
        }

        // 处理图片 URL
        const images = imageUrls.split('\n')
            .map(url => url.trim())
            .filter(url => url !== '');

        if (images.length === 0) {
            return res.status(400).json({
                success: false,
                message: '❌ 请至少输入一个图片URL'
            });
        }

        // 处理标签
        const tagArray = tags ? tags.split(/\s+/).filter(tag => tag !== '') : [];

        // 创建新帖子
        const newPost = await Post.create({
            userId: req.session.userId || req.user._id,
            images: images,
            content: content,
            tags: tagArray,
            likeCount: 0
        });

        // 更新用户的 postCount
        await User.findByIdAndUpdate(req.session.userId || req.user._id, {
            $inc: { postCount: 1 }
        });

        console.log(`✅ 帖子发布成功`);

        return res.json({
            success: true,
            message: '✅ 帖子发布成功',
            postId: newPost._id
        });

    } catch (error) {
        console.error('❌ 发布帖子错误:', error);
        res.status(500).json({
            success: false,
            message: '❌ 发布失败，请重试',
            error: error.message
        });
    }
});

// ===== 13. 路由：帖子详情 GET /posts/:id =====
app.get('/posts/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;

        // 获取帖子
        const post = await Post.findById(id)
            .populate('userId', 'username profileImage');

        if (!post) {
            return res.status(404).render('error', {
                error: '❌ 帖子不存在',
                statusCode: 404
            });
        }

        // 获取评论
        const comments = await Comment.find({ postId: id })
            .populate('userId', 'username profileImage');

        // 获取当前用户信息
        const currentUser = await User.findById(req.session.userId || req.user._id);

	// ✅ Null 检查
        if (!currentUser) {
            console.log('⚠️ 用户不存在，清除 session');
            req.session.destroy();
            return res.redirect('/login?message=請重新登入');
        }

        // 检查是否为帖子所有者
        const isOwner = post.userId._id.toString() === (req.session.userId || req.user._id);

        console.log(`📝 用户查看帖子: ${post._id}`);

        res.render('post-detail', {
            post: post,
            comments: comments,
            user: currentUser,
            isOwner: isOwner,
            message: null
        });

    } catch (error) {
        console.error('❌ 获取帖子详情错误:', error);
        res.status(500).render('error', {
            error: '❌ 加载帖子失败',
            statusCode: 500
        });
    }
});

// ===== 14. 路由：个人资料页 GET /profile =====
app.get('/profile', isAuthenticated, async (req, res) => {
    try {
        const currentUser = await User.findById(req.session.userId || req.user._id);

	// ✅ Null 检查
        if (!currentUser) {
            console.log('⚠️ 用户不存在，清除 session');
            req.session.destroy();
            return res.redirect('/login?message=請重新登入');
        }

        // 获取用户的帖子
        const userPosts = await Post.find({ userId: req.session.userId || req.user._id });

        console.log(`👤 用户查看个人资料: ${currentUser.username}`);

        res.render('profile', {
            user: currentUser,
            userPosts: userPosts,
            message: null
        });

    } catch (error) {
        console.error('❌ 获取个人资料错误:', error);
        res.status(500).render('error', {
            error: '❌ 加载资料失败',
            statusCode: 500
        });
    }
});

// ===== 15. 路由：搜索页面 GET /search =====
app.get('/search', isAuthenticated, async (req, res) => {
    try {
        const { q } = req.query;
        const currentUser = await User.findById(req.session.userId || req.user._id);

	 // ✅ Null 检查
        if (!currentUser) {
            console.log('⚠️ 用户不存在，清除 session');
            req.session.destroy();
            return res.redirect('/login?message=請重新登入');
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

        // 檢查是否是標籤搜索（以#開頭）
        const isHashtag = q.startsWith('#');
        const searchQuery = isHashtag ? q.substring(1) : q;

        if (isHashtag) {
            // 標籤模糊搜索
            const posts = await Post.find({ 
                tags: { $regex: searchQuery, $options: 'i' } 
            })
            .populate('userId', 'username profileImage')
            .sort({ _id: -1 });

            console.log(`🏷️ 搜索標籤: ${searchQuery}，找到 ${posts.length} 個帖子`);
            
            res.render('search-result', {
                searchType: 'tag',
                searchQuery: searchQuery,
                users: [],
                posts: posts,
                user: currentUser,
                message: null
            });
        } else {
            // 用戶名模糊搜索
            const users = await User.find({
                username: { $regex: searchQuery, $options: 'i' }
            });

            // 同時搜索帖子內容（模糊搜索）
            const posts = await Post.find({
                content: { $regex: searchQuery, $options: 'i' }
            })
            .populate('userId', 'username profileImage')
            .sort({ _id: -1 });

            console.log(`🔍 搜索用戶: ${searchQuery}，找到 ${users.length} 個用戶和 ${posts.length} 個帖子`);
            
            res.render('search-result', {
                searchType: 'user',
                searchQuery: searchQuery,
                users: users,
                posts: posts,
                user: currentUser,
                message: null
            });
        }
    } catch (error) {
        console.error('❌ 搜索錯誤:', error);
        res.status(500).render('error', {
            error: '❌ 搜索失敗',
            statusCode: 500
        });
    }
});

// ===== 16. 路由：添加评论 POST /api/posts/:id/comments =====
app.post('/api/posts/:id/comments', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;

        if (!content || content.trim() === '') {
            return res.status(400).json({
                success: false,
                message: '❌ 评论不能为空'
            });
        }

        // 创建评论
        const newComment = await Comment.create({
            postId: id,
            userId: req.session.userId || req.user._id,
            content: content.trim()
        });

        console.log(`💬 评论已添加`);

        return res.json({
            success: true,
            message: '✅ 评论成功',
            comment: newComment
        });

    } catch (error) {
        console.error('❌ 添加评论错误:', error);
        res.status(500).json({
            success: false,
            message: '❌ 评论失败',
            error: error.message
        });
    }
});

// ===== 17. 路由：点赞帖子 POST /api/posts/:id/like =====
app.post('/api/posts/:id/like', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;

        // 增加点赞数
        const post = await Post.findByIdAndUpdate(
            id,
            { $inc: { likeCount: 1 } },
            { new: true }
        );

        console.log(`❤️ 帖子被点赞`);

        return res.json({
            success: true,
            message: '✅ 点赞成功',
            likeCount: post.likeCount
        });

    } catch (error) {
        console.error('❌ 点赞错误:', error);
        res.status(500).json({
            success: false,
            message: '❌ 点赞失败',
            error: error.message
        });
    }
});

// ===== 18. 路由：删除帖子 DELETE /api/posts/:id =====
app.delete('/api/posts/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;

        // 查询帖子
        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: '❌ 帖子不存在'
            });
        }

        // 检查是否为帖子所有者
        if (post.userId.toString() !== (req.session.userId || req.user._id)) {
            return res.status(403).json({
                success: false,
                message: '❌ 没有权限删除此帖子'
            });
        }

        // 删除帖子
        await Post.findByIdAndDelete(id);

        // 删除相关评论
        await Comment.deleteMany({ postId: id });

        // 更新用户的 postCount
        await User.findByIdAndUpdate(req.session.userId || req.user._id, {
            $inc: { postCount: -1 }
        });

        console.log(`🗑️ 帖子已删除`);

        return res.json({
            success: true,
            message: '✅ 帖子已删除'
        });

    } catch (error) {
        console.error('❌ 删除帖子错误:', error);
        res.status(500).json({
            success: false,
            message: '❌ 删除失败',
            error: error.message
        });
    }
});

// ===== 19. 路由：登出 POST /logout =====
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: '❌ 登出失败'
            });
        }
        console.log('✅ 用户已登出');
        res.redirect('/login');
    });
});

// ===== 20. 路由：查看其他用戶資料 GET /users/:id =====
app.get('/users/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = await User.findById(req.session.userId || req.user._id);

        // Null 檢查
        if (!currentUser) {
            console.log('⚠️ 用戶不存在，清除 session');
            req.session.destroy();
            return res.redirect('/login?message=請重新登入');
        }

        // 如果是查看自己的資料，重定向到 /profile
        if (id === (req.session.userId || req.user._id)) {
            return res.redirect('/profile');
        }

        // 查詢被查看的用戶
        const viewedUser = await User.findById(id);
        if (!viewedUser) {
            return res.status(404).render('error', {
                error: '❌ 用戶不存在',
                statusCode: 404
            });
        }

        // 查詢被查看用戶的帖子
        const userPosts = await Post.find({ userId: id }).sort({ _id: -1 });

        // 檢查當前用戶是否已關注該用戶
        const followRelation = await Follow.findOne({
            follower: req.session.userId || req.user._id,
            followee: id
        });
        const isFollowing = !!followRelation;

        console.log(`👤 用戶 ${currentUser.username} 查看 ${viewedUser.username} 的資料`);
        
        res.render('user-profile', {
            user: currentUser,
            viewedUser: viewedUser,
            userPosts: userPosts,
            isFollowing: isFollowing,
            message: null
        });
    } catch (error) {
        console.error('❌ 獲取用戶資料錯誤:', error);
        res.status(500).render('error', {
            error: '❌ 加載資料失敗',
            statusCode: 500
        });
    }
});

// ===== 21. 路由：关注用户 POST /api/users/:id/follow =====
app.post('/api/users/:id/follow', isAuthenticated, async (req, res) => {
    try {
        const followeeId = req.params.id;
        const followerId = req.session.userId || req.user._id;

        console.log(`🔍 關注請求 - Follower: ${followerId}, Followee: ${followeeId}`);

        // 檢查參數
        if (!followeeId || !followerId) {
            return res.json({
                success: false,
                message: '❌ 缺少必要參數'
            });
        }

        // 不能關注自己
        if (followeeId === followerId) {
            return res.json({
                success: false,
                message: '❌ 不能關注自己'
            });
        }

        // 檢查被關注用戶是否存在
        const followeeUser = await User.findById(followeeId);
        if (!followeeUser) {
            return res.json({
                success: false,
                message: '❌ 用戶不存在'
            });
        }

        // 檢查是否已經關注
        const existingFollow = await Follow.findOne({
            follower: followerId,
            followee: followeeId
        });

        if (existingFollow) {
            return res.json({
                success: false,
                message: '❌ 已經關注過了'
            });
        }

        // 創建關注關係
        const newFollow = await Follow.create({
            follower: followerId,
            followee: followeeId
        });

        console.log(`✅ 關注關係已創建: ${newFollow._id}`);

        // 更新計數
        await User.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } });
        await User.findByIdAndUpdate(followeeId, { $inc: { followerCount: 1 } });

        console.log(`✅ 關注成功`);

        res.json({
            success: true,
            message: '✅ 關注成功'
        });
    } catch (error) {
        console.error('❌ 關注錯誤 (詳細):', error);
        console.error('錯誤類型:', error.name);
        console.error('錯誤訊息:', error.message);
        
        // 特別處理 E11000 錯誤
        if (error.code === 11000) {
            return res.json({
                success: false,
                message: '❌ 已經關注過了（數據庫約束）'
            });
        }
        
        res.status(500).json({
            success: false,
            message: '❌ 關注失敗: ' + error.message
        });
    }
});


// ===== 22. 路由：取消關注用戶 POST /api/users/:id/unfollow =====
app.post('/api/users/:id/unfollow', isAuthenticated, async (req, res) => {
    try {
        const followeeId = req.params.id;

        // 刪除關注關係
        const result = await Follow.findOneAndDelete({
            follower: req.session.userId || req.user._id,
            followee: followeeId
        });

        if (!result) {
            return res.json({
                success: false,
                message: '❌ 你沒有關注這個用戶'
            });
        }

        // 更新計數
        await User.findByIdAndUpdate(req.session.userId || req.user._id, { $inc: { followingCount: -1 } });
        await User.findByIdAndUpdate(followeeId, { $inc: { followerCount: -1 } });

        console.log(`✅ 取消關注成功`);
        res.json({
            success: true,
            message: '✅ 已取消關注'
        });
    } catch (error) {
        console.error('❌ 取消關注錯誤:', error);
        res.json({
            success: false,
            message: '❌ 操作失敗'
        });
    }
});


// ===== 22. 路由：設置頁面 GET /settings =====
app.get('/settings', isAuthenticated, async (req, res) => {
    try {
        const currentUser = await User.findById(req.session.userId || req.user._id);
        console.log(`⚙️ 用戶 ${currentUser.username} 查看設置頁面`);
        
        res.render('settings', {
            user: currentUser,
            message: null
        });
    } catch (error) {
        console.error('❌ 獲取設置頁錯誤:', error);
        res.status(500).render('error', {
            error: '❌ 加載設置頁失敗',
            statusCode: 500
        });
    }
});

// ===== 23. 路由：更新頭像 POST /settings/update-avatar =====
app.post('/settings/update-avatar', isAuthenticated, async (req, res) => {
    try {
        const { avatarUrl } = req.body;
        
        if (!avatarUrl || avatarUrl.trim() === '') {
            const currentUser = await User.findById(req.session.userId || req.user._id);
            return res.render('settings', {
                user: currentUser,
                message: { type: 'error', text: '❌ 請提供頭像網址' }
            });
        }

        await User.findByIdAndUpdate(req.session.userId || req.user._id, {
            profileImage: avatarUrl
        });

        req.session.profileImage = avatarUrl;
        console.log(`✅ 用戶更新了頭像`);
        
        const currentUser = await User.findById(req.session.userId || req.user._id);
        res.render('settings', {
            user: currentUser,
            message: { type: 'success', text: '✅ 頭像更新成功！' }
        });
    } catch (error) {
        console.error('❌ 更新頭像錯誤:', error);
        const currentUser = await User.findById(req.session.userId || req.user._id);
        res.render('settings', {
            user: currentUser,
            message: { type: 'error', text: '❌ 更新失敗，請重試' }
        });
    }
});

// ===== 24. 路由：更新用戶名 POST /settings/update-username =====
app.post('/settings/update-username', isAuthenticated, async (req, res) => {
    try {
        const { newUsername } = req.body;
        
        if (!newUsername || newUsername.trim().length < 3) {
            const currentUser = await User.findById(req.session.userId || req.user._id);
            return res.render('settings', {
                user: currentUser,
                message: { type: 'error', text: '❌ 用戶名至少需要 3 個字符' }
            });
        }

        // 檢查用戶名是否已存在
        const existingUser = await User.findOne({ username: newUsername });
        if (existingUser && existingUser._id.toString() !== (req.session.userId || req.user._id)) {
            const currentUser = await User.findById(req.session.userId || req.user._id);
            return res.render('settings', {
                user: currentUser,
                message: { type: 'error', text: '❌ 用戶名已被使用' }
            });
        }

        await User.findByIdAndUpdate(req.session.userId || req.user._id, {
            username: newUsername
        });

        req.session.username = newUsername;
        console.log(`✅ 用戶名更新為: ${newUsername}`);
        
        const currentUser = await User.findById(req.session.userId || req.user._id);
        res.render('settings', {
            user: currentUser,
            message: { type: 'success', text: '✅ 用戶名更新成功！' }
        });
    } catch (error) {
        console.error('❌ 更新用戶名錯誤:', error);
        const currentUser = await User.findById(req.session.userId || req.user._id);
        res.render('settings', {
            user: currentUser,
            message: { type: 'error', text: '❌ 更新失敗，請重試' }
        });
    }
});

// ===== 25. 路由：更新密碼 POST /settings/update-password =====
app.post('/settings/update-password', isAuthenticated, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const currentUser = await User.findById(req.session.userId || req.user._id);
        
        // 驗證輸入
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.render('settings', {
                user: currentUser,
                message: { type: 'error', text: '❌ 請填寫所有欄位' }
            });
        }

        // 驗證當前密碼
        if (currentPassword !== currentUser.password) {
            return res.render('settings', {
                user: currentUser,
                message: { type: 'error', text: '❌ 當前密碼錯誤' }
            });
        }

        // 驗證新密碼
        if (newPassword.length < 6) {
            return res.render('settings', {
                user: currentUser,
                message: { type: 'error', text: '❌ 新密碼至少需要 6 個字符' }
            });
        }

        if (newPassword !== confirmPassword) {
            return res.render('settings', {
                user: currentUser,
                message: { type: 'error', text: '❌ 兩次輸入的新密碼不一致' }
            });
        }

        // 更新密碼
        currentUser.password = newPassword;
        await currentUser.save();

        console.log(`✅ 用戶 ${currentUser.username} 更新了密碼`);
        
        res.render('settings', {
            user: currentUser,
            message: { type: 'success', text: '✅ 密碼更新成功！' }
        });
    } catch (error) {
        console.error('❌ 更新密碼錯誤:', error);
        const currentUser = await User.findById(req.session.userId || req.user._id);
        res.render('settings', {
            user: currentUser,
            message: { type: 'error', text: '❌ 更新失敗，請重試' }
        });
    }
});

// ===== 26. 路由：Following List GET /following =====
app.get('/following', isAuthenticated, async (req, res) => {
    try {
        const currentUser = await User.findById(req.session.userId || req.user._id);
        
        if (!currentUser) {
            console.log('⚠️ 用戶不存在，清除 session');
            req.session.destroy();
            return res.redirect('/login?message=請重新登入');
        }
        
        // 查詢當前用戶關注的人（follower = 當前用戶）
        const follows = await Follow.find({ follower: req.session.userId || req.user._id })
            .populate('followee', 'username profileImage');
        
        const followingList = follows.map(f => ({
            _id: f.followee._id,
            username: f.followee.username,
            profileImage: f.followee.profileImage
        }));

        console.log(`📋 用戶 ${currentUser.username} 查看 Following List`);
        
        res.render('following-list', {
            user: currentUser,
            followingList: followingList
        });
    } catch (error) {
        console.error('❌ 獲取 Following List 錯誤:', error);
        res.status(500).render('error', {
            error: '❌ 加載關注列表失敗',
            statusCode: 500
        });
    }
});

// ===== 27. 路由：Followers List GET /followers =====
app.get('/followers', isAuthenticated, async (req, res) => {
    try {
        const currentUser = await User.findById(req.session.userId || req.user._id);
        
        if (!currentUser) {
            console.log('⚠️ 用戶不存在，清除 session');
            req.session.destroy();
            return res.redirect('/login?message=請重新登入');
        }
        
        // 查詢關注當前用戶的人（followee = 當前用戶）
        const follows = await Follow.find({ followee: req.session.userId || req.user._id })
            .populate('follower', 'username profileImage');
        
        const followersList = follows.map(f => ({
            _id: f.follower._id,
            username: f.follower.username,
            profileImage: f.follower.profileImage
        }));

        console.log(`📋 用戶 ${currentUser.username} 查看 Followers List`);
        
        res.render('followers-list', {
            user: currentUser,
            followersList: followersList
        });
    } catch (error) {
        console.error('❌ 獲取 Followers List 錯誤:', error);
        res.status(500).render('error', {
            error: '❌ 加載粉絲列表失敗',
            statusCode: 500
        });
    }
});



// ===== 28. 路由：取消關注 POST /following/:id/unfollow =====
app.post('/following/:id/unfollow', isAuthenticated, async (req, res) => {
    try {
        const followeeId = req.params.id;
        
        await Follow.findOneAndDelete({
            follower: req.session.userId || req.user._id,
            followee: followeeId
        });

        await User.findByIdAndUpdate(req.session.userId || req.user._id, { $inc: { followingCount: -1 } });
        await User.findByIdAndUpdate(followeeId, { $inc: { followerCount: -1 } });

        console.log(`✅ 從 Following List 取消關注成功`);
        res.redirect('/following');
    } catch (error) {
        console.error('❌ 取消關注錯誤:', error);
        res.status(500).render('error', {
            error: '❌ 操作失敗',
            statusCode: 500
        });
    }
});


// ===== 29. 路由：移除粉絲 POST /followers/:id/remove =====
app.post('/followers/:id/remove', isAuthenticated, async (req, res) => {
    try {
        const followerId = req.params.id;
        
        await Follow.findOneAndDelete({
            follower: followerId,
            followee: req.session.userId || req.user._id
        });

        await User.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } });
        await User.findByIdAndUpdate(req.session.userId || req.user._id, { $inc: { followerCount: -1 } });

        console.log(`✅ 移除粉絲成功`);
        res.redirect('/followers');
    } catch (error) {
        console.error('❌ 移除粉絲錯誤:', error);
        res.status(500).render('error', {
            error: '❌ 操作失敗',
            statusCode: 500
        });
    }
});
// ===== 30. 404 错误处理 =====
app.use((req, res) => {
    res.status(404).render('error', {
        error: '❌ 页面不存在 (404)',
        statusCode: 404
    });
});

// ===== 31. 启动服务器 =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 服务器运行在 http://localhost:${PORT}`);
    console.log(`📍 访问 http://localhost:${PORT}/login 开始使用\n`);
});
