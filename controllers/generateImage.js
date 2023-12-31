const axios = require('axios');

//models
const User = require('../models/usersModel');
const Generation = require('../models/generationsModel');
const Ip = require('../models/ipsModel');

//helpers
const uploadToCF = require('./helpers/uploadToCF');
const logger = require('./helpers/logger');

const generateImageDimensions = (image_orientation) => {
    let width, height;
    let upscale = 'no';

    // Determine dimensions based on image orientation
    switch (image_orientation) {
        case 'square':
            width = 512;
            height = 512;
            upscale = '2';
            break;
        case 'portrait':
            width = 512;
            height = 768;
            break;
        case 'landscape':
            width = 768;
            height = 512;
            break;
        default:
            throw new Error('Invalid image orientation');
    }
    return { width, height, upscale };
};

const defaultNegativePrompt = 'child, childlike, Below 20, kids,';
const defaultPositivePrompt = 'adult, Above 20, mature, (masterpiece), (best quality)';

const text2ImgEndPoint = "https://stablediffusionapi.com/api/v4/dreambooth";
const img2ImgEndPoint = "https://stablediffusionapi.com/api/v4/dreambooth/img2img";

const generateImage = async (req, res, next) => {
    try {
        const {
            instructions,
            negative_prompt = '',
            image_orientation = 'square',
            high_quality = false,
            guidance_scale = 6,
            seed = null,
            init_image = null,
            style = "classic",
        } = req.body;


        const { width, height, upscale } = generateImageDimensions(image_orientation);
        let model_id;
        //SDAPI specific
        if (style === "classic") {
            model_id = 'hassaku-hentai';
        } else if (style === "anime") {
            model_id = 'meina-hentai';
        } else {
            model_id = 'grapefruit-hentai-mo';
        }

        // if (style === "classic") {
        //     model_id = 'grapefruit-hentai-mo';
        // } else if (style === "anime") {
        //     model_id = 'grapefruit-hentai-mo';
        // } else {
        //     model_id = 'grapefruit-hentai-mo';
        // }


        const { email } = req;

        //SDAPI Specific
        const data = {
            key: process.env.sd_apiKey,
            model_id: model_id,
            prompt: instructions + ' ' + defaultPositivePrompt,
            negative_prompt: defaultNegativePrompt + ' ' + negative_prompt,
            width: width,
            height: height,
            samples: '1',
            safety_checker: 'no',
            num_inference_steps: '20',
            enhance_prompt: 'no',
            scheduler: 'EulerAncestralDiscreteScheduler',
            seed: seed,
            guidance_scale: guidance_scale,
            webhook: null,
            tomesd: 'yes',
            multi_lingual: 'no',
            use_karras_sigmas: 'yes',
            upscale: upscale,
            vae: null,
            lora_model: null,
            lora_strength: null,
            embeddings_model: null,
            clip_skip: 2,
            self_attention: 'no',

        };

        let response;

        const makeRequest = async () => {
            try {
                if (init_image) {
                    data.init_image = init_image;
                    return await axios.post(img2ImgEndPoint, data);
                } else {
                    return await axios.post(text2ImgEndPoint, data);
                }

            } catch (err) {
                console.log("Error with Stable Diffusion API");
                logger.error(`Error with stable diffusion API - ${JSON.stringify(err.response.data)}`);
                throw err;
            }
        }

        // Make request to Stable Diffusion API, if response.data.status is 'failed', then retry with a gap of 3 secs

        let retryCount = 0;
        let maxRetries = 3;
        let retryGap = 3000;

        while (retryCount < maxRetries) {
            try {
                response = await makeRequest();
                //SDAPI Specific
                if (response.data.status === 'failed') {
                    console.log(response.data.error_log.server_id);
                    console.log(response.data.error_log.response.message);
                    retryCount++;
                    console.log(`SD API Failed - Retry ${retryCount} of ${maxRetries}...`)
                    await new Promise(resolve => setTimeout(resolve, retryGap));
                } else {
                    break;
                }
            } catch (err) {
                throw err;
            }
        }

        if (response.data.status === 'failed') {
            logger.error(`SD API: ${response.data.status} - ${response.data.message} - ${JSON.stringify(response.data)}`);
            return res.status(500).json({ message: 'High demand. Please try in a bit or upgrade your plan.' });
        }
        if (response.data.status === 'error') {
            console.log(response.data);
            logger.error(`SD API: ${response.data.status} - ${response.data.message} - ${JSON.stringify(response.data)}`);
            console.log(response.data);
            return res.status(500).json({ message: 'High demand. Please try in a bit or upgrade your plan.' });
        }

        // console.log(response.data);
        const isImgGenerated = response.data.status === 'success' ? true : false;
        const status = isImgGenerated ? 'success' : 'processing';
        const imgLinks = isImgGenerated ? response.data.output : response.data.future_links;
        const baseImgId = response.data.meta.file_prefix.replace('.png', '');

        const generationsPromises = imgLinks.map(async (imgLink, i) => {
            let cf_uploaded = false;
            let cf_id = null;
            let cf_meta = {};
            if (isImgGenerated) {
                const cfResponse = await uploadToCF(imgLink);
                cf_uploaded = cfResponse.success;
                cf_id = cfResponse.result.id;
                cf_meta.errors = cfResponse.errors;
                cf_meta.messages = cfResponse.messages;
            }

            return {
                email: email,
                imgId: i + '-' + baseImgId, // append the index to the baseImgId
                imgLink: imgLink,
                prompt: instructions,
                model: response.data.meta.model_id,
                jobId: response.data.id,
                isImgGenerated: isImgGenerated,
                status: status,
                cf_uploaded: cf_uploaded,
                cf_id: cf_id,
                cf_meta: cf_meta,
                ip: req.clientIp,
                parameters: {
                    negative_prompt: negative_prompt,
                    image_orientation: image_orientation,
                    high_quality: high_quality,
                    width: response.data.meta.W,
                    height: response.data.meta.H,
                    style: style,
                    samples: response.data.meta.n_samples,
                    num_inference_steps: response.data.meta.steps,
                    scheduler: response.data.meta.scheduler,
                    seed: response.data.meta.seed,
                    guidance_scale: response.data.meta.guidance_scale,
                    vae: response.data.meta.vae,
                    lora_model: response.data.meta.lora,
                    lora_strength: response.data.meta.lora_strength,
                    clip_skip: response.data.meta.clip_skip,
                    init_image: response.data.meta.init_image,
                    safety_checker_type: response.data.meta.safety_checker_type,
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
                eta: response.data.eta || null,
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

module.exports = generateImage;