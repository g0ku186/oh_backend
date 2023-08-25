const mongoose = require("mongoose");
const { Schema } = mongoose;

const generationsSchema = new Schema(
    {
        email: String,
        imgId: {
            type: String,
            unique: true,
        },
        jobId: Number,
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
        isDeleted: {
            type: Boolean,
            default: false,
        },
        parameters: Schema.Types.Mixed,
        cf_uploaded: Boolean,
        cf_id: String,
        cf_meta: Schema.Types.Mixed,
        upscaled: {
            type: Boolean,
            default: false,
        },
        upscale_status: String,
        upscale_jobId: Number,
        upscale_cf_id: String,
        upscale_cf_meta: Schema.Types.Mixed,
        upscale_cf_uploaded: Boolean,
        upscale_imgLink: String,
        upscale_model: String,
        ip: String,
        meta: Schema.Types.Mixed,
    },
    { timestamps: true }
);

const Generation = mongoose.model("Generation", generationsSchema);

module.exports = Generation;

