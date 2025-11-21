// server.js - 无加密版本
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
require('dotenv').config();

const app = express();

// ===== 1. 数据库连接 =====
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/instagram_clone';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB 连接成功！'))
    .catch(err => console.error('❌ MongoDB 连接失败:', err));

// ===== 2. 导入 Models =====
const userSchema = require('./models/user');
const postSchema = require('./models/post');
const commentSchema = require('./models/comment');
const followSchema = require('./models/follow');

const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);
const Comment = mongoose.model('Comment', commentSchema);
const Follow = mongoose.model('Follow', followSchema);

// ===== 3. 中间件配置 =====
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session 配置
app.use(session({
    secret: 'your-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true
    }
}));

// ===== 4. 认证中间件 =====
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
}

// ===== 5. 路由：主页 GET / =====
app.get('/', (req, res) => {
    if (req.session.userId) {
        res.redirect('/home');
    } else {
        res.redirect('/login');
    }
});

// ===== 6. 路由：登录页面 GET /login =====
app.get('/login', (req, res) => {
    res.render('login', { 
        message: req.query.message || null 
    });
});

// ===== 7. 路由：注册页面 GET /register =====
app.get('/register', (req, res) => {
    res.render('register', { 
        message: req.query.message || null 
    });
});

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
app.get('/home', isAuthenticated, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        // 获取帖子总数
        const totalPosts = await Post.countDocuments();
        const totalPages = Math.ceil(totalPosts / limit);

        // 获取帖子列表（按创建时间降序）
        const posts = await Post.find()
            .populate('userId', 'username profileImage')
            .sort({ _id: -1 })
            .skip(skip)
            .limit(limit);

        // 获取当前用户信息
        const currentUser = await User.findById(req.session.userId);

        console.log(`📖 用户 ${currentUser.username} 查看首页`);

        res.render('home', {
            posts: posts,
            currentPage: page,
            totalPages: totalPages,
            user: currentUser,
            message: null
        });

    } catch (error) {
        console.error('❌ 获取首页错误:', error);
        res.render('error', {
            error: '加载首页失败',
            statusCode: 500
        });
    }
});

// ===== 11. 路由：发布页面 GET /publish =====
app.get('/publish', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
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
            userId: req.session.userId,
            images: images,
            content: content,
            tags: tagArray,
            likeCount: 0
        });

        // 更新用户的 postCount
        await User.findByIdAndUpdate(req.session.userId, {
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
        const currentUser = await User.findById(req.session.userId);

        // 检查是否为帖子所有者
        const isOwner = post.userId._id.toString() === req.session.userId;

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
        const currentUser = await User.findById(req.session.userId);

        // 获取用户的帖子
        const userPosts = await Post.find({ userId: req.session.userId });

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
        const currentUser = await User.findById(req.session.userId);

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
            userId: req.session.userId,
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
        if (post.userId.toString() !== req.session.userId) {
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
        await User.findByIdAndUpdate(req.session.userId, {
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

// ===== 20. 404 错误处理 =====
app.use((req, res) => {
    res.status(404).render('error', {
        error: '❌ 页面不存在 (404)',
        statusCode: 404
    });
});

// ===== 21. 启动服务器 =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🚀 服务器运行在 http://localhost:${PORT}`);
    console.log(`📍 访问 http://localhost:${PORT}/login 开始使用\n`);
});
