const mongoose = require('mongoose');
const express = require('express');
const app = express();


// Connect to MongoDB
const uri  = 'mongodb+srv://wuyou007991:007991@cluster0.ashcnqc.mongodb.net/?appName=Cluster0';
const dbName = 'COMP3810SEFGoup32';

mongoose.connect(uri, { dbName: dbName })
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((err) => {
        console.error('Error connecting to MongoDB:', err);
    });

//server start
const port  = process.env.PORT || 8099;
app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
});



//Creat RESTful APIs
app.post('/api/users/register', ); // User Registration
app.post('/api/posts',); //pubish a new post
app.post('/api/posts/:id/comments',); //add a comment
app.post('/api/users/username/follow',); //follow a user
app.post('/api/posts/:id/like',); //like a post

//Read RESTful APIs
app.get('/api/posts?page=1&limit=10',); //get all post
app.get('/api/posts/:id',); //single post details
app.get('/api/posts/user/:userId',); //user's posts
app.get('/api/posts/hashtag/:tag',); //tag search  ???hashtag
app.get('/api/users/:userId/followers',); //followers list
app.get('/api/users/:userId/following',); //following list
app.get('/api/users/search?q=keyword',); //search users

//Update RESTful APIs
app.put('/api/users/:username',); //update user profile
app.put('/api/users/:username/profileImage',); //update profile image

//Delete RESTful APIs
app.delete('/api/posts/:id',); //delete a post
app.delete('/api/users/:userId/follow',); //unfollow a user     :userId->表示要取消关注的目标用户