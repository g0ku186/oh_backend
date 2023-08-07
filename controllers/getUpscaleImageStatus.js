const axios = require('axios');
const generationsModel = require('../models/generationsModel');
const uploadToCF = require('./uploadToCF');


const getUpscaleImageStatus = async (req, res) => {
    console.log('Came to getUpscaleImageStatus')
    try {
        const jobId = req.params.upscale_jobId;
        const imgId = req.body.imgId;
        const response = await axios.post(`https://stablediffusionapi.com/api/v3/dreambooth/fetch/${jobId}`, {
            "key": process.env.sd_apiKey
        });

        const status = response.data.status;
        if (status !== 'processing') {
            //update the status in the db
            if (status === 'success') {
                // Find the existing record in the database
                const existingRecord = await generationsModel.findOne({ imgId: imgId, email: req.email });
                // If cf_uploaded flag is true, the image has already been uploaded to CF
                if (existingRecord.upscale_cf_uploaded) {
                    res.status(200).send({ upscale_status: status, upscale_cf_id: existingRecord.upscale_cf_id });
                    return;
                }

                existingRecord.upscale_cf_uploaded = false;
                existingRecord.upscale_cf_id = null;
                existingRecord.upscale_cf_meta = {};
                const cfResponse = await uploadToCF(response.data.output[0]);
                existingRecord.upscale_cf_uploaded = cfResponse.success;
                existingRecord.upscale_cf_id = cfResponse.result.id;
                existingRecord.upscale_cf_meta.errors = cfResponse.errors;
                existingRecord.upscale_cf_meta.messages = cfResponse.messages;
                existingRecord.upscale_status = status;
                existingRecord.save();

                if (cfResponse.success) res.status(200).send({ upscale_status: existingRecord.upscale_status, upscale_cf_id: existingRecord.upscale_cf_id });
                else res.status(200).send({ status: "failed" });
                return;
            } else {
                const updateStatus = await generationsModel.updateOne({ imgId: imgId, email: req.email }, { upscale_status: status });
                res.status(200).send({ upscale_status: status });
                return
            }
        }
        res.status(200).send({ upscale_status: status });
    } catch (err) {
        console.log('Came here!')
        console.log(err);
        res.status(500).send("An error occurred while fetching the status.");
    }
}


module.exports = getUpscaleImageStatus;