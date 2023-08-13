const Generations = require('../../models/generationsModel');

const bookmarkImg = async (req, res) => {

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
        console.log(err);
        res.status(500).json({ message: "Internal server error" });
    }

}
module.exports = bookmarkImg;