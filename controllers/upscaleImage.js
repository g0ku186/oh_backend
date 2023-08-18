const axios = require('axios');
const Generation = require('../models/generationsModel');
const uploadToCF = require('./helpers/uploadToCF');
const logger = require('./helpers/logger');

const upscaleImage = async (req, res, next) => {
    try {
        const {
            imgId,
            url,
        } = req.body;

        const { email } = req;
        //first check if this is already upscaled
        const existingRecord = await Generation.findOne({ imgId: imgId, email: email });
        if (existingRecord.upscaled) {
            return res.status(200).json({ upscale_status: "success", upscale_cf_id: existingRecord.upscale_cf_id });
        }
        //check if the upscale button is already clicked, by checking the existance of upscale status and the value of it is processing
        if (existingRecord.upscale_status && existingRecord.upscale_status === 'processing') {
            return res.status(200).json({ upscale_status: "processing" });
        }

        const response = await axios.post(`https://stablediffusionapi.com/api/v3/super_resolution`, {
            "key": process.env.sd_apiKey,
            url: url,
            "scale": 4,
            webhook: null,
            face_enhance: false,
            model_id: "RealESRGAN_x4plus_anime_6B"
        });

        if (response.data.status === 'failed' || response.data.status === 'error') {
            console.log(response.data);
            logger.error(`Upscale Image: ${JSON.stringify(response.data)}`);
            return res.status(500).json({ message: "High load on our servers. Please try later." });
        }

        existingRecord.upscale_jobId = response.data.id;
        existingRecord.upscaled = response.data.status === 'success' ? true : false;
        existingRecord.upscale_status = existingRecord.upscaled ? 'success' : 'processing';
        existingRecord.upscale_imgLink = existingRecord.upscaled ? response.data.output : ''; //check if it is future links for upscale

        existingRecord.upscale_cf_uploaded = false;
        existingRecord.upscale_cf_id = null;
        existingRecord.upscale_cf_meta = {};
        if (existingRecord.upscaled) {
            const cfResponse = await uploadToCF(existingRecord.upscale_imgLink);
            existingRecord.upscale_cf_uploaded = cfResponse.success;
            existingRecord.upscale_cf_id = cfResponse.result.id;
            existingRecord.upscale_cf_meta.errors = cfResponse.errors;
            existingRecord.upscale_cf_meta.messages = cfResponse.messages;
        }

        //update the existing record with new upscale data

        await existingRecord.save();

        //send it to frontend

        const finalData = {
            imgId: imgId,
            upscaled: existingRecord.upscaled,
            upscale_status: existingRecord.upscale_status,
            eta: response.data.eta || null,
            upscale_jobId: response.data.id,
            upscale_cf_id: existingRecord.upscale_cf_id,
        }
        res.send(finalData);
    } catch (err) {
        console.log("=============ERROR: Upscale Image Error=============");
        next(err);
    }
};

module.exports = upscaleImage;