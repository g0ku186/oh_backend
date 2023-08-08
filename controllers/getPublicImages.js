const Generations = require('../models/generationsModel');

const getPublicImages = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1; // defaults to 1
        const limit = 30;
        const skip = (page - 1) * limit;
        const query = { email: "ofcreator07@gmail.com" };
        // Retrieve the images from the database
        const images = await Generations.find(query)
            .sort({ imgId: -1 })
            .skip(skip)
            .limit(limit)
            .select('imgId jobId cf_id prompt status bookmark upscaled parameters.width parameters.height parameters.image_orientation parameters.high_quality parameters.negative_prompt parameters.seed parameters.guidance_scale createdAt upscale_status upscale_jobId upscale_cf_id');

        // Get the total count of images in the database for the given email (and bookmark if provided)
        const totalCount = await Generations.countDocuments(query);

        res.send({
            images: images,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving public images");
    }
}

module.exports = getPublicImages;