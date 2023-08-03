require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const requestIp = require('request-ip');
const db = require('./db');

const generationsModel = require('./models/generationsModel');

//controllers
const isAuthenticated = require('./controllers/authMiddleware');
const verifyCredits = require('./controllers/verifyCredits');
const generateImage = require('./controllers/generateImage');
const createOrUpdateUser = require('./controllers/createOrUpdateUser');
const getImages = require('./controllers/getImages');
const getPublicImages = require('./controllers/getPublicImages');
const bookmarkImg = require('./controllers/bookmarkImg');
const deleteImg = require('./controllers/deleteImg');

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


app.post('/api/v1/status/:jobid', isAuthenticated, async (req, res) => {
    try {
        const jobId = req.params.jobid;
        const imgId = req.body.imgId;
        const response = await axios.post(`https://stablediffusionapi.com/api/v3/dreambooth/fetch/${jobId}`, {
            "key": process.env.sd_apiKey
        });
        const status = response.data.status;
        if (status !== 'processing') {
            console.log('Came inside the processing block')
            //update the status in the db
            const updateStatus = await generationsModel.updateOne({ imgId: imgId, email: req.email }, { status: status });
        }
        res.status(200).send({ status });
    } catch (err) {
        console.log('Came here!')
        console.log(err);
        res.status(500).send("An error occurred while fetching the status.");
    }
});


app.post('/api/v1/generateImage', isAuthenticated, verifyCredits, generateImage);

app.post('/api/v1/user/login', isAuthenticated, createOrUpdateUser);

app.post('/api/v1/image/bookmark', isAuthenticated, bookmarkImg);

app.delete('/api/v1/image/delete', isAuthenticated, deleteImg);

app.get('/api/v1/user/getImages', isAuthenticated, getImages);

app.get('/api/v1/user/getPublicImages', getPublicImages);

app.use((err, req, res, next) => {
    console.log('Came to error handler');
    res.status(500).send("An error occurred while generating the image.");
});


app.listen(7777, () => {
    console.log('Server listening on port 7777');
});