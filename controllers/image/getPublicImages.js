const Generations = require('../../models/generationsModel');

const getPublicImages = async (req, res, next) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = 30;
        const skip = (page - 1) * limit;
        const query = { email: "ofcreator07@gmail.com" };

        const images = await Generations.find(query)
            .sort({ imgId: -1 })
            .skip(skip)
            .limit(limit)
            .select('imgId jobId cf_id prompt status bookmark upscaled parameters.width parameters.height parameters.image_orientation parameters.high_quality parameters.negative_prompt parameters.seed parameters.guidance_scale createdAt upscale_status upscale_jobId upscale_cf_id');

        const totalCount = await Generations.countDocuments(query);

        //We calculate the total Pages because on the frontend, we use this to load more images as user scrolls
        res.send({
            images: images,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
        });
    } catch (err) {
        console.log("=============ERROR: Get Public Images Error=============");
        next(err);
    }
}

module.exports = getPublicImages;