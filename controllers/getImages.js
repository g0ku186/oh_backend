const Generations = require('../models/generationsModel');

const getImages = async (req, res) => {
    const { email } = req;
    const page = Number(req.query.page) || 1; // defaults to 1
    const limit = Number(req.query.limit) || 20; // defaults to 10
    const bookmark = req.query.bookmark === 'true'; // defaults to false

    const skip = (page - 1) * limit;

    try {
        const query = { email: email };

        // If bookmark query parameter is provided, include it in the MongoDB query
        if (req.query.bookmark) {
            query.bookmark = bookmark;
        }

        // Retrieve the images from the database
        const images = await Generations.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('imgId prompt bookmark upscaled parameters.width parameters.height createdAt');

        // Get the total count of images in the database for the given email (and bookmark if provided)
        const totalCount = await Generations.countDocuments(query);

        res.send({
            images: images,
            currentPage: page,
            totalPages: Math.ceil(totalCount / limit),
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving images");
    }
}

module.exports = getImages;

module.exports = getImages;