const axios = require('axios');
const generationsModel = require('../models/generationsModel');
const uploadToCF = require('./helpers/uploadToCF');

function getImgUrl(imageId, imagesArray) {
    for (let i = 0; i < imagesArray.length; i++) {
        if (imagesArray[i].endsWith(imageId + ".png")) {
            return imagesArray[i];
        }
    }
    return "Image ID not found!";
}


const getImageStatus = async (req, res, next) => {
    try {
        const jobId = req.params.jobid;
        const imgId = req.body.imgId;
        const style = req.body.style;
        let response;
        if (style !== 'sd') {
            response = await axios.post(`https://stablediffusionapi.com/api/v3/dreambooth/fetch/${jobId}`, {
                "key": process.env.sd_apiKey
            });
        } else {
            console.log('SD Status')
            response = await axios.post(`https://stablediffusionapi.com/api/v3/fetch/${jobId}`, {
                "key": process.env.sd_apiKey
            });
        }

        const status = response.data.status;
        if (status !== 'processing') {
            //update the status in the db
            if (status === 'success') {
                // Find the existing record in the database
                const existingRecord = await generationsModel.findOne({ imgId: imgId, email: req.email });
                // If cf_uploaded flag is true, the image has already been uploaded to CF
                if (existingRecord.cf_uploaded) {
                    res.status(200).send({ status, cf_id: existingRecord.cf_id });
                    return;
                }

                let cf_uploaded = false;
                let cf_id = null;
                let cf_meta = {};
                const imgUrl = getImgUrl(imgId, response.data.output);
                const cfResponse = await uploadToCF(imgUrl); // Corrected imgLink to imgUrl
                cf_uploaded = cfResponse.success;
                cf_id = cfResponse.result.id;
                cf_meta.errors = cfResponse.errors;
                cf_meta.messages = cfResponse.messages;
                const updateStatus = await generationsModel.updateOne({ imgId: imgId, email: req.email }, { status, cf_uploaded, cf_id, cf_meta });
                if (cfResponse.success) res.status(200).send({ status, cf_id });
                else res.status(200).send({ status: "failed" });
                return;
            } else {
                const updateStatus = await generationsModel.updateOne({ imgId: imgId, email: req.email }, { status: status });
                res.status(200).send({ status });
                return
            }
        }
        res.status(200).send({ status });
    } catch (err) {
        console.log("=============ERROR: Get Image Status Error=============");
        next(err);
    }
}


module.exports = getImageStatus;