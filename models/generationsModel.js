const mongoose = require("mongoose");
const { Schema } = mongoose;

const generationsSchema = new Schema(
    {
        email: String,
        imgId: {
            type: String,
            unique: true,
        },
        imgLink: String,
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

