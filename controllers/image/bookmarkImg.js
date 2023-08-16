const Generations = require('../../models/generationsModel');

const bookmarkImg = async (req, res, next) => {

    try {
        const { email } = req;
        const imgId = req.body.imgId;
        const bookmark = req.body.bookmark;

        const generation = await Generations.findOne({ imgId: imgId, email: email });
        if (generation) {
            generation.bookmark = bookmark;
            await generation.save();
            res.status(200).json({ message: "Bookmark updated successfully" });
        } else {
            res.status(404).json({ message: "Image not found" });
        }
    } catch (err) {
        console.log("=============ERROR: Image Bookmark Error=============");
        next(err);
    }

}
module.exports = bookmarkImg;