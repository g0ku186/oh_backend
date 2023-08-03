const mongoose = require("mongoose");
const { Schema } = mongoose;

const publicImageSchema = new Schema(
    {
        imgId: {
            type: String,
            unique: true,
        },
        imgLink: String,
        prompt: String,
        model: String,
        parameters: Schema.Types.Mixed,

    },
    { timestamps: true }
);

const PublicImage = mongoose.model("public_image", publicImageSchema);

module.exports = PublicImage;

