const axios = require('axios');

//models
const User = require('../models/usersModel');
const Generation = require('../models/generationsModel');
const Ip = require('../models/ipsModel');

//helpers
const uploadToCF = require('./helpers/uploadToCF');
const { model } = require('mongoose');

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
        if (style === "classic") {
            model_id = 'hassaku-hentai';
        } else if (style === "anime") {
            model_id = 'meina-hentai';
        } else if (style === "sd") {
            model_id = 'sd';
        } else if (style === "rv") {
            model_id = 'realistic-vision-v51';
            // model_id = 'realistic-vision-v13';
            // model_id = 'sdxl';
        } else if (style === "wifu") {
            model_id = 'wifu-diffusion';
        } else if (style === "f222") {
            model_id = 'f222-diffusion';
        } else {
            model_id = 'hassaku-hentai';
        }
        console.log(model_id);
        const { email } = req;

        const data = {
            key: process.env.sd_apiKey,
            prompt: instructions + ' ' + defaultPositivePrompt,
            negative_prompt: defaultNegativePrompt + ' ' + negative_prompt,
            width: width,
            height: height,
            samples: '2',
            safety_checker: 'no',
            num_inference_steps: '31',
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
            clip_skip: 2
        };

        if (model_id !== 'sd') {
            data.model_id = model_id;
        }


        let attempts = 0;
        const maxAttempts = 3;

        const makeRequest = async () => {
            try {
                if (init_image) {
                    data.init_image = init_image;
                    if (model_id === 'sd') {
                        console.log('SD Img 2 Img')
                        return await axios.post('https://stablediffusionapi.com/api/v3/img2img', data);
                    } else {
                        return await axios.post('https://stablediffusionapi.com/api/v4/dreambooth/img2img', data);
                    }
                } else {
                    if (model_id === 'sd') {
                        console.log('SD Text 2 Img')
                        return await axios.post('https://stablediffusionapi.com/api/v3/text2img', data);
                    } else {
                        return await axios.post('https://stablediffusionapi.com/api/v4/dreambooth', data);
                    }
                }
            } catch (err) {
                throw err;
            }
        };


        //check for response.data.status, if it is 'failed', retry 3 times
        let response;
        while (attempts < maxAttempts) {
            try {
                response = await makeRequest();
                if (response.data.status === 'failed') {
                    attempts++;
                    console.log('Attempt ' + attempts + ' failed');
                    await new Promise(res => setTimeout(res, 3000));
                } else {
                    break;
                }
            } catch (err) {
                throw err;
            }
        }
        console.log(response.data);

        if (response.data.status === 'failed') return res.status(500).json({ message: 'High demand. Please try in a bit' });

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
                model: response.data.meta.model_id ? response.data.meta.model_id : 'sd',
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
        console.log(err);
        next(err);
    }
};

module.exports = generateImage;