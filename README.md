# COMP3810SEF_Goup32

## 👥 Project Information
Project Name: Instagram Clone  
Group info:  
  Group No. 32  
  1) WU You - 13416252  

## 🗳️ Project File Introduction
- `server.js`: Core server file with key functionalities  
  User Authentication 
  - Login System: Supports GitHub OAuth login and local username/password login.  
  - Session Management: Utilises `express-session` to maintain user sessions, enabling persistent login.  

  Data Handling 
  - Database Connection: Establishes link to MongoDB via Mongoose for data storage.  
  - Route Management: Handles routes for authentication (login/register), home feed, post publishing, profile access, and API endpoints.  
  - Middleware Configuration: Sets up EJS view engine, static file service, request parsing, and authentication checks.  

  Post Management Operations 
  -  Create Post: The system allows authenticated users to create new posts with images, content, and tags.
  -  View Post Details: Users can view individual posts with all their details including comments.
  -  Like Post: Authenticated users can like posts, which increments the post's like count.
  -  Delete Post: Post owners can delete their own posts, which also removes all associated comments and decrements the user's post count.
  -  Add Comments: Users can add comments to posts, with validation to ensure comments are not empty.

  User Management Operations
  - User Profile: The profile route displays the current user's information and their posts.
  - View Other Users' Profiles: Users can view other users' profiles.
  - User Settings: Users can update their avatar, username, and password through dedicated settings routes.

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

- `Views`: EJS template files for page rendering  
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
  - [fllows.js](models/follow.js): Use relation pairs: `follower` - `followee`.
    

## ☁️ Cloud URL
- [Deployed Application](https://comp3810sef-goup32.onrender.com/)  https://comp3810sef-goup32.onrender.com

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
### Read (Get top 5 posts)  
<br/>HTTP Request Type: GET  
<br/>Path URI: `/api/public/posts`  
<br/>Example Testing Command:  
```bash
curl -X GET https://comp3810sef-goup32.onrender.com/api/public/posts
```

### Create (Add a new post)  
<br/>HTTP Request Type: POST  
<br/>Path URI: `/api/public/posts`  
<br/>Example Testing Command:  
```bash
curl -X POST https://comp3810sef-goup32.onrender.com/api/public/posts \
     -H "Content-Type: application/json" \
     -d '{"content":"Hello world from public API","images":["https://res.hancibao.com/img/kai/05/56fe.png"]}'
```

### Update (Modify post content)  
<br/>HTTP Request Type: PUT  
<br/>Path URI: `/api/public/posts/<post_id>` (replace `<post_id>` with the target post ID)  
<br/>Example Testing Command:  
```bash
curl -X PUT https://comp3810sef-goup32.onrender.com/api/public/posts/<post_id> \
     -H "Content-Type: application/json" \
     -d '{"content":"Updated content via public API"}'
```

### Delete (Remove a post)  
<br/>HTTP Request Type: DELETE  
<br/>Path URI: `/api/public/posts/<post_id>` (replace `<post_id>` with the target post ID)  
<br/>Example Testing Command:  
```bash
curl -X DELETE https://comp3810sef-goup32.onrender.com/api/public/posts/<post_id>
```
