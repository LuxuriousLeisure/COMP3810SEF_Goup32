const mongoose = require('mongoose');
const { faker } = require('@faker-js/faker');
require('dotenv').config();

// 导入 Schema 并创建 Model
const userSchema = require('../models/user');
const postSchema = require('../models/post');
const commentSchema = require('../models/comment');
const followSchema = require('../models/follow');

const User = mongoose.model('User', userSchema);
const Post = mongoose.model('Post', postSchema);
const Comment = mongoose.model('Comment', commentSchema);
const Follow = mongoose.model('Follow', followSchema);

// 配置
const CONFIG = {
    NUM_USERS: 1000,
    NUM_POSTS: 20000,
    NUM_COMMENTS: 5000
};

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/instagram_clone';

// 生成假用户数据
function generateFakeUsers(count) {
    const users = [];
    const usedUsernames = new Set();  // 防止重复用户名
    
    for (let i = 0; i < count; i++) {
        let username;
        let attempts = 0;
        
        // 生成符合规则的用户名（只包含字母、数字、下划线）
        do {
            username = faker.internet.displayName()
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, '_')  // 把所有非法字符替换成下划线
                .substring(0, 16);             // 限制最大长度16
            
            // 确保长度至少4个字符
            if (username.length < 4) {
                username = username + faker.string.alphanumeric(4 - username.length);
            }
            
            attempts++;
            if (attempts > 10) {
                // 如果尝试10次还生成不出来，就用随机字符串
                username = 'user_' + faker.string.alphanumeric(8);
            }
        } while (usedUsernames.has(username));
        
        usedUsernames.add(username);
        
        users.push({
            username: username,
            password: '$2a$10$YourHashedPasswordHere',
            profileImage: faker.image.avatar(),
            followerCount: 0,
            followingCount: 0,
            postCount: 0
        });
    }
    return users;
}

// 生成假帖子数据
function generateFakePosts(count, userIds) {
    const posts = [];
    const possibleTags = [
        'travel', 'food', 'fashion', 'nature', 'photography',
        'art', 'fitness', 'love', 'instagood', 'photooftheday',
        'beautiful', 'happy', 'cute', 'like4like', 'followme',
        'picoftheday', 'sunset', 'beach', 'summer', 'style'
    ];

    for (let i = 0; i < count; i++) {
        const numImages = faker.number.int({ min: 1, max: 4 });
        const images = [];
        for (let j = 0; j < numImages; j++) {
            images.push(faker.image.url());
        }

        const numTags = faker.number.int({ min: 0, max: 5 });
        const tags = faker.helpers.arrayElements(possibleTags, numTags);

        posts.push({
            userId: faker.helpers.arrayElement(userIds),
            images: images,
            content: faker.lorem.paragraph({ min: 1, max: 5 }),
            tags: tags,
            likeCount: faker.number.int({ min: 0, max: 5000 })
        });
    }
    return posts;
}

// 生成假评论数据
function generateFakeComments(count, userIds, postIds) {
    const comments = [];
    for (let i = 0; i < count; i++) {
        comments.push({
            postId: faker.helpers.arrayElement(postIds),
            userId: faker.helpers.arrayElement(userIds),
            content: faker.lorem.sentence({ min: 3, max: 20 })
        });
    }
    return comments;
}

// 生成关注关系（每个用户一条记录）
function generateFakeFollows(userIds) {
    const follows = [];
    
    for (const userId of userIds) {
        // 随机选择 0-50 个粉丝
        const numFollowers = faker.number.int({ min: 0, max: 50 });
        const followers = faker.helpers.arrayElements(
            userIds.filter(id => id.toString() !== userId.toString()),
            Math.min(numFollowers, userIds.length - 1)
        );
        
        // 随机选择 0-50 个关注的人
        const numFollowing = faker.number.int({ min: 0, max: 50 });
        const following = faker.helpers.arrayElements(
            userIds.filter(id => id.toString() !== userId.toString()),
            Math.min(numFollowing, userIds.length - 1)
        );
        
        follows.push({
            userId: userId,
            followers: followers,
            following: following
        });
    }
    
    return follows;
}

// 更新用户的帖子计数
async function updateUserPostCounts() {
    console.log('🔄 更新用户的帖子计数...');
    const postCounts = await Post.aggregate([
        { $group: { _id: '$userId', count: { $sum: 1 } } }
    ]);
    
    for (const item of postCounts) {
        await User.updateOne(
            { _id: item._id },
            { $set: { postCount: item.count } }
        );
    }
    console.log('✅ 帖子计数更新完成！');
}

// 更新用户的关注/粉丝计数
async function updateUserFollowCounts() {
    console.log('🔄 更新用户的关注/粉丝计数...');
    
    const allFollows = await Follow.find();
    
    for (const follow of allFollows) {
        await User.updateOne(
            { _id: follow.userId },
            { 
                $set: { 
                    followerCount: follow.followers.length,
                    followingCount: follow.following.length
                } 
            }
        );
    }
    
    console.log('✅ 关注/粉丝计数更新完成！');
}

// 主函数
async function seedDatabase() {
    try {
        console.log('🔌 连接到 MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ MongoDB 连接成功！\n');

        console.log('🗑️  清空现有数据...');
        await User.deleteMany({});
        await Post.deleteMany({});
        await Comment.deleteMany({});
        await Follow.deleteMany({});
        console.log('✅ 数据清空完成！\n');

        console.log(`👥 创建 ${CONFIG.NUM_USERS} 个用户...`);
        const fakeUsers = generateFakeUsers(CONFIG.NUM_USERS);
        const insertedUsers = await User.insertMany(fakeUsers);
        const userIds = insertedUsers.map(user => user._id);
        console.log(`✅ 成功创建 ${insertedUsers.length} 个用户！\n`);

        console.log(`📸 创建 ${CONFIG.NUM_POSTS} 个帖子...`);
        const fakePosts = generateFakePosts(CONFIG.NUM_POSTS, userIds);
        const insertedPosts = await Post.insertMany(fakePosts);
        const postIds = insertedPosts.map(post => post._id);
        console.log(`✅ 成功创建 ${insertedPosts.length} 个帖子！\n`);

        console.log(`💬 创建 ${CONFIG.NUM_COMMENTS} 条评论...`);
        const fakeComments = generateFakeComments(CONFIG.NUM_COMMENTS, userIds, postIds);
        const insertedComments = await Comment.insertMany(fakeComments);
        console.log(`✅ 成功创建 ${insertedComments.length} 条评论！\n`);

        console.log(`🤝 创建关注关系...`);
        const fakeFollows = generateFakeFollows(userIds);
        const insertedFollows = await Follow.insertMany(fakeFollows);
        console.log(`✅ 成功创建 ${insertedFollows.length} 个用户的关注记录！\n`);

        console.log('📊 更新统计数据...\n');
        await updateUserPostCounts();
        await updateUserFollowCounts();

        console.log('\n📊 数据库统计:');
        console.log(`   👥 用户总数: ${await User.countDocuments()}`);
        console.log(`   📸 帖子总数: ${await Post.countDocuments()}`);
        console.log(`   💬 评论总数: ${await Comment.countDocuments()}`);
        console.log(`   🤝 关注记录数: ${await Follow.countDocuments()}`);
        
        console.log('\n📝 示例用户（含统计）:');
        const sampleUsers = await User.find().limit(5);
        sampleUsers.forEach(user => {
            console.log(`   - ${user.username}`);
            console.log(`     帖子: ${user.postCount}, 关注: ${user.followingCount}, 粉丝: ${user.followerCount}`);
        });

        console.log('\n📸 示例帖子:');
        const samplePosts = await Post.find().limit(3).populate('userId', 'username');
        samplePosts.forEach(post => {
            console.log(`   - 作者: ${post.userId.username}`);
            console.log(`     点赞: ${post.likeCount}, 标签: ${post.tags.join(', ')}`);
        });

        console.log('\n🤝 示例关注关系:');
        const sampleFollows = await Follow.find().limit(3).populate('userId', 'username');
        for (const follow of sampleFollows) {
            console.log(`   - 用户: ${follow.userId.username}`);
            console.log(`     粉丝数: ${follow.followers.length}, 关注数: ${follow.following.length}`);
        }

        console.log('\n🎉 数据库填充完成！');

    } catch (error) {
        console.error('❌ 错误:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n👋 数据库连接已关闭');
        process.exit(0);
    }
}

seedDatabase();
