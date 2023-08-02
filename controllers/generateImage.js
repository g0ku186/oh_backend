const axios = require('axios');
const User = require('../models/usersModel');
const Generation = require('../models/generationsModel');
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

const generateImage = async (req, res, next) => {
    const { instructions } = req.body;
    const { email } = req;
    console.log(instructions);
    const data = {
        key: process.env.sd_apiKey,
        model_id: 'hassaku-hentai',
        prompt: instructions,
        negative_prompt: '(worst quality, low quality:1.4), monochrome, zombie, (interlocked fingers:1.2), multiple views, comic, sketch, animal ears, pointy ears',
        width: '1024',
        height: '1024',
        samples: '2',
        safety_checker: 'no',
        num_inference_steps: '20',
        enhance_prompt: 'no',
        scheduler: 'EulerAncestralDiscreteScheduler',
        seed: null,
        guidance_scale: 7.5,
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
    try {
        const response = await axios.post('https://stablediffusionapi.com/api/v4/dreambooth', data);
        console.log(response.data);
        const isImgGenerated = response.data.status === 'success' ? true : false;
        const status = isImgGenerated ? 'success' : 'processing';
        const imgLinks = isImgGenerated ? response.data.output : response.data.future_links;
        const baseImgId = response.data.meta.file_prefix.replace('.png', '');

        const generations = imgLinks.map((imgLink, i) => {
            return {
                email: email,
                imgId: i + '-' + baseImgId, // append the index to the baseImgId
                imgLink: imgLink,
                prompt: instructions,
                model: data.model_id,
                jobId: response.data.id,
                isImgGenerated: isImgGenerated,
                status: status,
                parameters: {
                    negative_prompt: data.negative_prompt,
                    width: data.width,
                    height: data.height,
                    samples: data.samples,
                    num_inference_steps: data.num_inference_steps,
                    scheduler: data.scheduler,
                    seed: data.seed,
                    guidance_scale: data.guidance_scale,
                    vae: data.vae,
                    lora_model: data.lora_model,
                    lora_strength: data.lora_strength,
                    clip_skip: data.clip_skip
                },
            };
        });

        await Generation.insertMany(generations);

        const finalData = { status: status, eta: response.data.eta || null, imgId: baseImgId, jobId: response.data.id };
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
        next(err);
    }
};

module.exports = generateImage;