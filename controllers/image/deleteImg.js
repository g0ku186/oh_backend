const Generations = require('../../models/generationsModel');
const deleteFromCF = require('./../helpers/deleteFromCF');

const deleteImg = async (req, res, next) => {
    try {
        const { email } = req;
        const imgId = req.body.imgId;

        const image = await Generations.findOne({ imgId, email });

        if (!image) {
            return res.status(404).json({ message: 'Image not found' });
        }
        const cf_id = image.cf_id;
        let upscale_cf_id = null;
        if (image.upscaled) {
            upscale_cf_id = image.upscale_cf_id;
        }

        await Generations.deleteOne({ imgId, email });
        if (cf_id) {
            const deleteFromCFResponse = await deleteFromCF(cf_id);
        }
        if (upscale_cf_id) {
            await deleteFromCF(upscale_cf_id);
        }
        return res.status(200).json({ message: 'Image deleted successfully' });
    } catch (err) {
        console.log("=============ERROR: Image Delete Error=============");
        next(err);
    }
}

module.exports = deleteImg;
