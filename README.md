# COMP3810SEF_Goup32

## 👥 Project Information
Project Name: Instagram Clone  
Group info:  Group No. 32  
  1) WU You - 13416252
  2) DENG Qi - 13405410
  3) JI Zhengyang - 13363752
  4) ZHAO Zixng - 13406180

## 🗳️ Project File Introduction
- `server.js`: Core server file with key features
  
  User Authentication 
  - Login System: Supports dual authentication methods - GitHub OAuth login and simple username/password login.  
  - Session Management: Utilizes `express-session` to maintain persistent user sessions across requests.  

  Data Handling 
  - Database Connection: Establishes link to MongoDB via Mongoose for data storage.  
  - Route Management: Handles routes for authentication (login/register), home feed, post publishing, profile access, and API endpoints.  
  - Middleware Configuration: Sets up EJS view engine, static file service, request parsing, and authentication checks.  

  Post Management Operations 
  -  Create Post: The system allows authenticated users to publish new posts with images, content, and tags.
  -  View Single Post Details: Users can view individual posts pages displaying complete information including author, images, content, tags, like count, and associated comments.
  -  View All Posts by a User: Displays all posts created by a specific user.
  -  Like Post: Authenticated users can like posts, which increments the post's like count by one.
  -  Delete Post: Post owners can delete their own posts, which also removes all associated comments and decrements the user's post count.
  -  Add Comments: Users can add comments to posts, with validation to ensure comments are not empty.

  User Management Operations
  - User Registration: Allows new users to create accounts by providing usernames and passwords. 
  - User Profile: The profile displays the current user's avatar, username, registration date, statistics (post count, follower count, following count), and grid layout of user's posts. 
  - View Other Users' Profiles: Users can view other users' profiles with similar information display.
  - User Settings: Users can update their avatar, username, and password through dedicated settings routes.

  Search Operations
  - Search by username: Find users by username matching. 
  - Search by tag name: Search posts by particular tag (i.e. #food, #travel, #fashion, #nature, #photography, #art, #fitness, #sunset, #beach, #summer, #style, etc)


- `package.json`: List of Dependencies  
  - [express](https://www.npmjs.com/package/express): Fast, unopinionated web framework for Node.js.  
  - [ejs](https://www.npmjs.com/package/ejs): Embedded JavaScript templates for rendering HTML pages.  
  - [mongoose](https://www.npmjs.com/package/mongoose): MongoDB object modeling tool for asynchronous environments.  
  - [express-session](https://www.npmjs.com/package/express-session): Session management middleware for Express.  
  - [passport](https://www.npmjs.com/package/passport): Express-compatible authentication middleware.  
  - [passport-github2](https://www.npmjs.com/package/passport-github2): GitHub OAuth 2.0 authentication strategy for Passport.  
  - [dotenv](https://www.npmjs.com/package/dotenv): Loads environment variables from `.env` file.  
  - [method-override](https://www.npmjs.com/package/method-override): Supports HTTP methods like PUT/DELETE in form submissions.
  - [body-parser](https://www.npmjs.com/package/body-parser): Used to parse the request body
  - [bcryptjs](https://www.npmjs.com/package/bcryptjs): Used for password encryption 

- `Public`: Static assets folder  
  - [css/style.css](/public/css/style.css): Custom styles for application pages, including layout, typography, and responsive design.  

- `views`: EJS template files for page rendering  
  - [login.ejs](/views/login.ejs): Login page with GitHub OAuth and local login options.  
  - [register.ejs](/views/register.ejs): User registration page for local account creation.  
  - [home.ejs](/views/home.ejs): Main feed page displaying posts from all users.  
  - [publish.ejs](/views/publish.ejs): Page for creating and publishing new posts.  
  - [profile.ejs](/views/profile.ejs): User profile page showing personal posts and stats.  
  - [search-result.ejs](/views/search-result.ejs): Post search page with keyword-based filtering.  
  - [error.ejs](/views/error.ejs): Error handling page for 404 or server errors.
  - [post-detail.ejs](/views/post-detail.ejs): Post details page.
  - [user-profile.ejs](/views/user-profile.ejs): View other users' profile pages.
  - [settings.ejs](/views/settings.ejs): User settings page.
  - [following-list.ejs](/views/following-list.ejs): Following List Page.
  - [followers-list.ejs](/views/followers-list.ejs): Fan list page.
  - [answers.ejs](/views/answers.ejs): Response.
  - [partials/](/views/partials/): Folder: Contains reusable components.

- `Models`: Database schema definitions  
  - [user.js](/models/user.js): User schema with fields for `username`, `githubId`, `profileImage`, and post-related counters.  
  - [post.js](/models/post.js): Post schema including `userId` (author reference), `content`, `images`, `tags`, and `likeCount`.
  - [comment.js](models/comment.js): Use `postId`, `userId`, `content`.
  - [follows.js](models/follow.js): Use relation pairs: `follower` - `followee`.
    

## How to Start
###  ☁️ Cloud
- The application is deployed and available at: https://comp3810sef-goup32.onrender.com/
- Note: The Cloud deployment runs the main branch code.
### 💻 Local Development
To run the application locally:
1. **Switch to the `localhost` branch**
2. **Install dependencies:**
   ```bash
   npm install
3. **Start the development server:**
   ```bash
   npm start

## ⚙️ Operation Guides
### 1. Login/Register  
- **Page Entry**: Access the application homepage to be redirected to the login page (`/login`), or click the "Sign up here" link to navigate to the registration page (`/register`).  

- **Register**:  
  1. Fill in the registration form with:  
     - Username (3-20 characters, letters/numbers/underscores only);  
     - Password (at least 6 characters);  
     - Confirm password (must match the password).  
  2. Click the "Register" button. A success message will appear, and you can then proceed to log in.  

- **Login**:  
  - **GitHub OAuth Login**: Click the "Continue with GitHub" button on the login page, authorize the application, and be automatically redirected to the homepage.  
  - **Local Account Login**: Enter your registered username and password, then click "Login" to access the homepage.
  - For evaluation, the following pre-existing accounts are available:
  ```json
  {"username": "user_bfm65caq", "password": "ap7dVfR"},
  {"username": "user_dhoq", "password": "YBn9vX5oea"},
  {"username": "user_dq051005", "password": "L1pmuZVwl"},
  {"username": "user_5o5328wf", "password": "uAoMREpDV"},
  {"username": "user_7pb2341", "password": "7IXn7Bw"}
  ```

### 2. Logout  
- **Where**: Click the "Logout" button at the bottom of the left navigation bar.  
- **Effect**: Destroys the current user session and redirects to the login page.  

### 3. Find（home）  
- **Page Entry**: Automatically redirect to the homepage (`/home`) after login, or access via the "Home" button in the left navigation bar.  
- **Functions and Operations**:  
  - Displays the latest posts from all users (sorted by post time in descending order), 10 posts per page.  
  - Each post shows: Author's avatar, username, post images (1-10), content, tags, and like count.  
  - Pagination: Use "Previous Page" and "Next Page" buttons at the bottom to switch between pages.  
  - View Details: Click the "View Details" button on a post to navigate to its detailed page.
  - Comment function: User can post comments on the post details page.
  - Like function: Allows user to like posts.

### 4. Search
- **Page Entry**: Access via the "Search" button in the left navigation bar.  
- **Functions and Operations**:  
  - A search box at the top supports keyword search for posts (matching content or tags) or other user (matching username).  
  - Enter keywords and click the "Search" button to display matching post or user thumbnails in a grid layout.  
  - Hover over thumbnails to view the post's like count; click thumbnails to enter the post or user details page.  

### 5. Publish  
- **Page Entry**: Access via the "Publish" button in the left navigation bar (login required).  
- **Functions and Operations**:  
  - Used to create new posts; fill in the following information:  
    - Image URLs: Enter one image link per line, 1-10 links required;  
    - Content: Text description, up to 2000 characters (required);  
    - Tags: Space-separated keywords (optional).  
  - Click the "Publish" button. After success, you will be redirected to the homepage to see the newly published post.  

### 6. Profile 
- **Page Entry**: Access via the "Profile" button in the left navigation bar (login required).  
- **Functions and Operations**:  
  - Displays current user's personal information: Avatar, username, and registration date.  
  - Statistics: Number of published posts, followers, and following.  
  - Post List: Shows all posts by the current user in a grid layout; click to view details.  
  - Edit Profile: Supports updating personal information (e.g., avatar, username, password) (based on actual implementation).  

## 🚀 RESTful CRUD Services
**API Architecture Overview:**  
Our application provides two types of API endpoints:

**I. Authenticated APIs (Require Login) - 8 endpoints**
These endpoints require active user session for security and data integrity:
1. `POST /api/posts` - Create new post
2. `GET /posts/:id` - View single post details
3. `DELETE /api/posts/:id` - Delete one post
4. `POST /api/posts/:id/comments` - Add comment to post
5. `POST /api/posts/:id/like` - Like a post
6. `POST /api/users/:id/follow` - Follow another user (Future Work)
7. `POST /api/users/:id/unfollow` - Unfollow a user (Future Work)
8. `PUT /settings/update-avatar` - Update user avatar

**II. Public APIs (No Authentication Required) - 4 endpoints**
These endpoints are provided for testing and demonstration purposes.
1. `GET /api/public/posts` - Retrieve top 5 recent posts
2. `POST /api/public/posts` - Create new post via system account
3. `PUT /api/public/posts/:id` - Update existing post content
4. `DELETE /api/public/posts/:id` - Delete a post

**Testing the Public API Endpoints:**
The following sections provide example commands for testing each CRUD operation:

### 1. Read (Get top 5 posts)  
HTTP Request Type: GET  
<br/>Path URI: `/api/public/posts`  
<br/>Example Testing Command:  
```bash
curl -X GET https://comp3810sef-goup32.onrender.com/api/public/posts
```

**Sample Response:**
```json
{"success":true,"posts":[{"_id":"69267d3059fa9448d468ef3d","userId":{"_id":"691f2ed08c63fa3d82fb2075","username":"123","profileImage":"https://th.bing.com/th/id/R.383b7cdec9be427d7f4b612471dfd3ea?rik=I1Op2JL6oa5peQ&riu=http%3a%2f%2foss.suning.com%2fsdsp%2fprd_scsp%2f1669312324703_6d2f62357cf42336e878374404141afa.jpeg%3fimgW%3d2048%26imgH%3d1365&ehk=WMmmd582wkpoK7NxNyFPpVY%2fY4cbDo4c2HiPuxVJAko%3d&risl=&pid=ImgRaw&r=0"},"content":"Hello world from public API","images":["https://res.hancibao.com/img/kai/05/56fe.png"],"tags":[],"likeCount":0,"__v":0},{"_id":"69266bdde1119c176fece88b","userId":{"_id":"691f2ed08c63fa3d82fb2075","username":"123","profileImage":"https://th.bing.com/th/id/R.383b7cdec9be427d7f4b612471dfd3ea?rik=I1Op2JL6oa5peQ&riu=http%3a%2f%2foss.suning.com%2fsdsp%2fprd_scsp%2f1669312324703_6d2f62357cf42336e878374404141afa.jpeg%3fimgW%3d2048%26imgH%3d1365&ehk=WMmmd582wkpoK7NxNyFPpVY%2fY4cbDo4c2HiPuxVJAko%3d&risl=&pid=ImgRaw&r=0"},"content":"7","images":["https://media.wired.com/photos/598e35994ab8482c0d6946e0/3:2/w_2240,c_limit/phonepicutres-TA.jpg"],"tags":["7"],"likeCount":0,"__v":0},{"_id":"691f2ed28c63fa3d82fb7277","userId":{"_id":"691f2ed08c63fa3d82fb2280","username":"user_h8ayma5x","profileImage":"https://i.pravatar.cc/300?img=2"},"content":"Making memories worth sharing 📸\n\nComptus spectaculum tener pariatur modi bibo neque.","images":["https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=800"],"tags":["beach","paradise","ocean","tropical"],"likeCount":1032,"__v":0},{"_id":"691f2ed28c63fa3d82fb7276","userId":{"_id":"691f2ed08c63fa3d82fb2207","username":"user_tdg8","profileImage":"https://i.pravatar.cc/300?img=16"},"content":"Luxury is not about having the best, it's about appreciating what you have 💎\n\nCarmen sed trado animi viduo thalassinus thalassinus torrens.","images":["https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/1907228/pexels-photo-1907228.jpeg?auto=compress&cs=tinysrgb&w=800"],"tags":["style","outfit","fashion","luxury"],"likeCount":3822,"__v":0},{"_id":"691f2ed28c63fa3d82fb7275","userId":{"_id":"691f2ed08c63fa3d82fb2253","username":"user_cbygkrsr","profileImage":"https://i.pravatar.cc/300?img=17"},"content":"Artistic soul, wandering spirit 🎭\n\nCaput alius corporis stabilis pecto corpus comburo demitto.","images":["https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800","https://images.pexels.com/photos/1533720/pexels-photo-1533720.jpeg?auto=compress&cs=tinysrgb&w=800"],"tags":["mountains","nature","sunset","landscape"],"likeCount":3002,"__v":0}]}
```

### 2. Create (Add a new post)  
HTTP Request Type: POST  
<br/>Path URI: `/api/public/posts`  
<br/>Example Testing Command:  
```bash
curl -X POST https://comp3810sef-goup32.onrender.com/api/public/posts \
     -H "Content-Type: application/json" \
     -d '{"content":"Hello world from public API","images":["https://res.hancibao.com/img/kai/05/56fe.png"]}'
```

**Sample Response:**
```json
{"success":true,"message":"Post created","post":{"userId":"691f2ed08c63fa3d82fb2075","content":"Hello world from public API","images":["https://res.hancibao.com/img/kai/05/56fe.png"],"tags":[],"likeCount":0,"_id":"692d8e2eff4b9d4c2e83cc21","__v":0}}
```

### 3. Update (Modify post content)  
HTTP Request Type: PUT  
<br/>Path URI: `/api/public/posts/<post_id>` (replace `<post_id>` with the target post ID)  
<br/>Example Testing Command:  
```bash
curl -X PUT https://comp3810sef-goup32.onrender.com/api/public/posts/<post_id> \
     -H "Content-Type: application/json" \
     -d '{"content":"Updated content via public API"}'
```

**Sample Response:**
```json
{"success":true,"message":"Post updated","post":{"_id":"691f2ed28c63fa3d82fb7277","userId":"691f2ed08c63fa3d82fb2280","content":"Updated content via public API","images":["https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=800"],"tags":["beach","paradise","ocean","tropical"],"likeCount":1032,"__v":0}}
```

### 4. Delete (Remove a post)  
HTTP Request Type: DELETE  
<br/>Path URI: `/api/public/posts/<post_id>` (replace `<post_id>` with the target post ID)  
<br/>Example Testing Command:  
```bash
curl -X DELETE https://comp3810sef-goup32.onrender.com/api/public/posts/<post_id>
```

**Sample Response:**
```json
{"success":true,"message":"Post deleted"}
```


