const mongoose = require("mongoose");
const { Schema } = mongoose;

const generationsSchema = new Schema(
    {
        email: String,
        imgId: {
            type: String,
            unique: true,
        },
        jobId: String,
        imgLink: String,
        isImgGenerated: {
            type: Boolean,
            default: false,
        },
        status: String,
        prompt: String,
        model: String,
        bookmark: {
            type: Boolean,
            default: false,
        },
        upscaled: {
            type: Boolean,
            default: false,
        },
        parameters: Schema.Types.Mixed,

    },
    { timestamps: true }
);

const Generation = mongoose.model("Generation", generationsSchema);

module.exports = Generation;

