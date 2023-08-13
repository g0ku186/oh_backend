require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const requestIp = require('request-ip');
const db = require('./db');

const generationsModel = require('./models/generationsModel');

//controllers

//generate & upscale Controllers
const generateImage = require('./controllers/generateImage');
const upscaleImage = require('./controllers/upscaleImage');
const getImageStatus = require('./controllers/getImageStatus');
const getUpscaleImageStatus = require('./controllers/getUpscaleImageStatus');


//Image Controllers
const getImages = require('./controllers/image/getImages');
const getPublicImages = require('./controllers/image/getPublicImages');
const bookmarkImg = require('./controllers/image/bookmarkImg');
const deleteImg = require('./controllers/image/deleteImg');

//User Controllers
const createOrUpdateUser = require('./controllers/user/createOrUpdateUser');
const getUserDetails = require('./controllers/user/getUserDetails');
const activateLicense = require('./controllers/user/activateLicense');

//middleware
const isAuthenticated = require('./controllers/middleware/authMiddleware');
const verifyCreditsAndSubscription = require('./controllers/middleware/verifyCreditsAndSubscription');

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestIp.mw())

app.get('/api', isAuthenticated, (req, res) => {
    res.send('Hello World!')
});


app.get('/generations/:id', async function (req, res) {
    try {
        let id = req.params.id;
        let remoteUrl = `https://cdn.stablediffusionapi.com/generations/${id}`;
        const response = await axios({
            method: 'get',
            url: remoteUrl,
            responseType: 'stream'
        });
        response.data.pipe(res);
    } catch (error) {
        console.log('Came to catch block of reverse proxy');
        res.status(404).send("No image yet yo.");
    }
});


//generate routes
app.post('/api/v1/status/:jobid', isAuthenticated, getImageStatus);

app.post('/api/v1/upscaleStatus/:jobid', isAuthenticated, getUpscaleImageStatus);

app.post('/api/v1/generateImage', isAuthenticated, verifyCreditsAndSubscription, generateImage);

app.post('/api/v1/upscaleImage', isAuthenticated, upscaleImage);


//user routes
app.post('/api/v1/user/login', isAuthenticated, createOrUpdateUser);

app.get('/api/v1/user/profile', isAuthenticated, getUserDetails);

app.post('/api/v1/user/activateLicense', isAuthenticated, activateLicense);


//image routes
app.get('/api/v1/image/getPublicImages', getPublicImages);

app.get('/api/v1/image/getImages', isAuthenticated, getImages);

app.post('/api/v1/image/bookmark', isAuthenticated, bookmarkImg);

app.delete('/api/v1/image/delete', isAuthenticated, deleteImg);


app.use((err, req, res, next) => {
    console.log('Came to error handler');
    console.log(err);
    res.status(500).json({ message: "An error occurred while generating the image." });
});


app.listen(7777, () => {
    console.log('Server listening on port 7777');
});
