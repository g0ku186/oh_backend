const Generations = require('../../models/generationsModel');

const getImages = async (req, res, next) => {
    try {
        const { email } = req;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 20;
        //When we send images to frontend, we are caching it in the frontend to avoid unnecessary requests to the backend.
        //As user generates new images after fetching some images, we need to skip the images that are newly generated,
        //For example, if we send 20 images in the first go, then user generated 2 new images, 
        //then without additionalSkip, when we request the backend again, the 1st and 2nd image will be same as 19th and 20th images of first request.
        //Reverse logic applies when user deletes an image. Hence, on the frontend we track additionSkip param to fetch only the images that are required.
        const additionalSkip = Number(req.query.skip) || 0;
        const bookmark = req.query.bookmark === 'true'; // defaults to false
        let skip = (page - 1) * limit + additionalSkip;

        if (skip < 0) {
            skip = 0;
        }

        const query = { email: email, isDeleted: false };

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

        //We calculate the total Pages because on the frontend, we use this to load more images as user scrolls
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