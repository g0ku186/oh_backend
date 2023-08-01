require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const requestIp = require('request-ip');
const db = require('./db');

//controllers
const isAuthenticated = require('./controllers/authMiddleware');
const verifyCredits = require('./controllers/verifyCredits');
const generateImage = require('./controllers/generateImage');
const createOrUpdateUser = require('./controllers/createOrUpdateUser');
const getImages = require('./controllers/getImages');
const bookmarkImg = require('./controllers/bookmarkImg');
const deleteImg = require('./controllers/deleteImg');

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestIp.mw())

app.get('/api', isAuthenticated, (req, res) => {
    res.send('Hello World!')
});


app.get('/generations/:id', function (req, res) {
    console.log('Came to reverse proxy')
    let id = req.params.id;
    let remoteUrl = `https://cdn.stablediffusionapi.com/generations/${id}`;

    axios({
        method: 'get',
        url: remoteUrl,
        responseType: 'stream'
    })
        .then(function (response) {
            response.data.pipe(res);
        })
        .catch(function (error) {
            console.error(error);
            res.status(500).send("An error occurred while retrieving the image.");
        });
});

app.post('/api/v1/generateImage', isAuthenticated, verifyCredits, generateImage);

app.post('/api/v1/user/login', isAuthenticated, createOrUpdateUser);

app.post('/api/v1/image/bookmark', isAuthenticated, bookmarkImg);

app.delete('/api/v1/image/delete', isAuthenticated, deleteImg);

app.get('/api/v1/user/getImages', isAuthenticated, getImages);

app.use((err, req, res, next) => {
    console.log('Came to error handler');
    res.status(500).send("An error occurred while generating the image.");
});


app.listen(7777, () => {
    console.log('Server listening on port 7777');
});
