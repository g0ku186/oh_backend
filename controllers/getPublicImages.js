const PublicImage = require('../models/publicImagesModel');

const getPublicImages = async (req, res) => {
    try {
        const page = Number(req.query.page) || 1; // defaults to 1
        const limit = 20;
        const skip = (page - 1) * limit;

        // Retrieve the images from the database
        const images = await PublicImage.find()
            .sort({ imgId: -1 })
            .skip(skip)
            .limit(limit)
            .select('imgId prompt parameters.width parameters.height parameters.negative_prompt parameters.seed parameters.guidance_scale');

        // Get the total count of images in the database for the given email (and bookmark if provided)
        const totalCount = await PublicImage.countDocuments();

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