const axios = require('axios');

//models
const User = require('../models/usersModel');
const Generation = require('../models/generationsModel');
const Ip = require('../models/ipsModel');

//helpers
const uploadbase64ToCF = require('./helpers/uploadbase64ToCF');
const logger = require('./helpers/logger');
const constructApiData = require('./helpers/constructApiData');



const text2ImgEndPoint = `http://localhost:7778/api/sdv1/generateImage`;
const img2ImgEndPoint = `http://localhost:7778/api/sdv1/generateImage`;

const headers = {
    'Authorization': "sai"
}

const generateImage2 = async (req, res, next) => {
    try {
        const { email } = req;
        const makeRequest = async (payload) => {
            try {
                if (payload['init_image']) {
                    return await axios.post(img2ImgEndPoint, payload, { headers: headers });
                } else {
                    return await axios.post(text2ImgEndPoint, payload, { headers: headers });
                }
            } catch (err) {
                console.log("Error with Stable Diffusion API");
                logger.error(`Error with stable diffusion API - ${JSON.stringify(err.response.data)}`);
                throw err;
            }
        };

        const apiData = constructApiData(req.body);
        //check for response.data.status, if it is 'failed', retry 3 times
        console.log(apiData)
        const response = await makeRequest(apiData);

        // console.log(response.data);
        const isImgGenerated = true;
        const status = isImgGenerated ? 'success' : 'processing';
        const base64Images = response.data.images;


        const generationsPromises = base64Images.map(async (base64Image, i) => {
            let cf_uploaded = false;
            let imgId = i + '-' + response.data.parameters.jobId;
            let cf_id = null;
            let cf_meta = {};
            if (isImgGenerated) {
                const cfResponse = await uploadbase64ToCF(base64Image, imgId);
                cf_uploaded = cfResponse.success;
                cf_id = cfResponse.result.id;
                cf_meta.errors = cfResponse.errors;
                cf_meta.messages = cfResponse.messages;
            }

            return {
                email: email,
                imgId: imgId,
                prompt: req.body.instructions,
                model: response.data.parameters.model_id,
                isImgGenerated: isImgGenerated,
                status: status,
                cf_uploaded: cf_uploaded,
                cf_id: cf_id,
                cf_meta: cf_meta,
                ip: req.clientIp,
                parameters: {
                    negative_prompt: req.body.negative_prompt,
                    image_orientation: req.body.image_orientation,
                    high_quality: req.body.high_quality,
                    width: response.data.parameters.width,
                    height: response.data.parameters.height,
                    style: req.body.style,
                    samples: response.data.parameters.samples,
                    num_inference_steps: response.data.parameters.steps,
                    scheduler: response.data.parameters.scheduler,
                    seed: response.data.parameters.seed,
                    guidance_scale: response.data.parameters.cfg_scale,
                    clip_skip: response.data.parameters.clip_skip,
                    denoising_strength: response.data.parameters.denoising_strength,
                    restore_faces: response.data.parameters.restore_faces
                },
                meta: {
                    userAgent: req.userAgent,
                    uniqueIdentifier: req.uniqueIdentifier,
                }
            };
        });

        const generations = await Promise.all(generationsPromises);
        await Generation.insertMany(generations);

        //const finalData = { status: status, eta: response.data.eta || null, imgId: baseImgId, jobId: response.data.id, parameters: { width: data.width, height: data.height } };

        const finalData = generations.map((generation) => {
            return {
                status: generation.status,
                eta: response.data.parameters.eta || null,
                imgId: generation.imgId,
                cf_id: generation.cf_id,
                jobId: generation.jobId,
                prompt: generation.prompt,
                bookmark: false,
                upscaled: false,
                parameters: {
                    width: generation.parameters.width,
                    height: generation.parameters.height,
                    image_orientation: generation.parameters.image_orientation,
                    high_quality: generation.parameters.high_quality,
                    negative_prompt: generation.parameters.negative_prompt,
                    seed: generation.parameters.seed,
                    guidance_scale: generation.parameters.guidance_scale,
                    style: generation.parameters.style,
                    blurImage: req.blurImage,
                }
            };
        });
        // console.log(finalData)
        res.send(finalData);
        //increase current_usage in the user model by 1
        if (email) {
            await User.findOneAndUpdate({ email: email }, { $inc: { current_usage: 1 } });
        } else {
            const ip = req.clientIp;
            await Ip.findOneAndUpdate({ ip: ip }, { $inc: { current_usage: 1 } });
        }
    } catch (err) {
        console.log("=============ERROR: Generating Image Error=============");
        next(err);
    }
};

module.exports = generateImage2;