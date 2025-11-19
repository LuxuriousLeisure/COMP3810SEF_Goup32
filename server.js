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