const axios = require('axios');
const User = require('../models/usersModel');
const Generation = require('../models/generationsModel');
const uploadToCF = require('./uploadToCF');
const Ip = require('../models/ipsModel');
// const modelConfig = [
//     v1 : {
//         modelId: 'meina-hentai',

//     }
// ]

//models: meina-hentai, hassaku-hentai, grapefruit-hentai-mo, abyssorangemix2nsfw, anything-v5

// Euler A = EulerAncestralDiscreteScheduler
// Euler = EulerDiscreteScheduler, UniPCMultistepScheduler
// DPM++ SDE Karras = DPMSolverMultistepScheduler
// DPM++ 2M Karras = KDPM2DiscreteScheduler
// DDIM = DDIMScheduler

// const uploadToCF = async (url) => {
//     try {
//         const body = new FormData();
//         body.append("url", url);
//         const res = await axios.post(
//             `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_accountId}/images/v1`, body,
//             {
//                 headers: { "Authorization": `Bearer ${process.env.CF_apiKey}` },
//             }
//         );
//         return res.data;

//     } catch (e) {
//         console.log("ERROR:" + e);
//     }
// }
const generateImageDimensions = (image_orientation, high_quality) => {
    let width, height;

    // Determine dimensions based on image orientation
    switch (image_orientation) {
        case 'square':
            width = 512;
            height = 512;
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

    // Adjust dimensions for high quality
    if (high_quality) {
        if (image_orientation === 'square') {
            width *= 2;
            height *= 2;
        } else {
            width *= 1.5;
            height *= 1.5;
        }
    }

    return { width, height };
};

const defaultNegativePrompt = 'child, childlike, Below 20, kids,';

const generateImage = async (req, res, next) => {
    try {
        const {
            instructions,
            negative_prompt = '(worst quality, low quality:1.4), monochrome, zombie, (interlocked fingers:1.2), multiple views, comic, sketch, animal ears, pointy ears',
            image_orientation = 'square',
            high_quality = false,
            guidance_scale = 7.5,
            seed = null,
        } = req.body;


        const { width, height } = generateImageDimensions(image_orientation, high_quality);

        const { email } = req;
        console.log(instructions);
        const data = {
            key: process.env.sd_apiKey,
            model_id: 'meina-hentai',
            prompt: instructions,
            negative_prompt: defaultNegativePrompt + ' ' + negative_prompt,
            width: width,
            height: height,
            samples: '2',
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
            upscale: 'no',
            vae: null,
            lora_model: null,
            lora_strength: null,
            embeddings_model: null,
            clip_skip: 2
        };

        console.log(data);
        const response = await axios.post('https://stablediffusionapi.com/api/v4/dreambooth', data);
        console.log(response.data);
        const isImgGenerated = response.data.status === 'success' ? true : false;
        const status = isImgGenerated ? 'success' : 'processing';
        const imgLinks = isImgGenerated ? response.data.output : response.data.future_links;
        const baseImgId = response.data.meta.file_prefix.replace('.png', '');

        const generationsPromises = imgLinks.map(async (imgLink, i) => {
            let cf_uploaded = false;
            let cf_id = null;
            let cf_meta = {};
            if (isImgGenerated) {
                console.log('Uploading to CF')
                console.log(imgLink);
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
                prompt: response.data.meta.prompt,
                model: response.data.meta.model_id,
                jobId: response.data.id,
                isImgGenerated: isImgGenerated,
                status: status,
                cf_uploaded: cf_uploaded,
                cf_id: cf_id,
                cf_meta: cf_meta,
                parameters: {
                    negative_prompt: negative_prompt,
                    width: response.data.meta.W,
                    height: response.data.meta.H,
                    samples: response.data.meta.n_samples,
                    num_inference_steps: response.data.meta.steps,
                    scheduler: response.data.meta.scheduler,
                    seed: response.data.meta.seed,
                    guidance_scale: response.data.meta.guidance_scale,
                    vae: response.data.meta.vae,
                    lora_model: response.data.meta.lora,
                    lora_strength: response.data.meta.lora_strength,
                    clip_skip: response.data.meta.clip_skip
                },
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
                    negative_prompt: generation.parameters.negative_prompt,
                    seed: generation.parameters.seed,
                    guidance_scale: generation.parameters.guidance_scale,
                }
            };
        });
        console.log(finalData)
        res.send(finalData);
        //increase current_usage in the user model by 1
        if (email) {
            await User.findOneAndUpdate({ email: email }, { $inc: { current_usage: 1 } });
        } else {
            const ip = req.clientIp;
            await Ip.findOneAndUpdate({ ip: ip }, { $inc: { current_usage: 1 } });
        }
    } catch (err) {
        console.log(err);
        next(err);
    }
};

module.exports = generateImage;