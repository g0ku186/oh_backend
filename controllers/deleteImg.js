const Generations = require('../models/generationsModel');

const deleteImg = async (req, res) => {
    try {
        const { email } = req;
        const imgId = req.body.imgId;

        const image = await Generations.findOne({ imgId, email });

        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }

        await Generations.deleteOne({ imgId, email });

        return res.status(200).json({ message: 'Image deleted successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error' });
    }
}

module.exports = deleteImg;
