const Generations = require('../../models/generationsModel');

const getImages = async (req, res, next) => {
    try {
        const { email } = req;
        const page = Number(req.query.page) || 1; // defaults to 1
        const limit = Number(req.query.limit) || 20; // defaults to 10
        const additionalSkip = Number(req.query.skip) || 0; // defaults to 0 (for new images
        const bookmark = req.query.bookmark === 'true'; // defaults to false
        let skip = (page - 1) * limit + additionalSkip;

        if (skip < 0) {
            skip = 0;
        }

        const query = { email: email };

        // If bookmark query parameter is provided, include it in the MongoDB query
        if (bookmark) {
            query.bookmark = bookmark;
        }

        // Retrieve the images from the database
        const images = await Generations.find(query)
            .sort({ createdAt: -1, imgId: -1 })
            .skip(skip)
            .limit(limit)
            .select('imgId jobId cf_id prompt status bookmark upscaled parameters.width parameters.height parameters.image_orientation parameters.style parameters.high_quality parameters.negative_prompt parameters.seed parameters.guidance_scale createdAt upscale_status upscale_jobId upscale_cf_id');

        // Get the total count of images in the database for the given email (and bookmark if provided)
        const totalCount = await Generations.countDocuments(query);

        res.send({
            images: images,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
        });
    } catch (err) {
        console.log("=============ERROR: Get Images Error=============");
        next(err);
    }
}

module.exports = getImages;