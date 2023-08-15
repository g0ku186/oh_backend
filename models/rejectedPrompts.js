const mongoose = require("mongoose");
const { Schema } = mongoose;

const rejectedPromptSchema = new Schema(
    {
        email: String,
        prompt: String,
        cleanedPrompt: String,
        ip: String,
        meta: Schema.Types.Mixed,
    },
    { timestamps: true }
);

const Rejected_prompt = mongoose.model("rejected_prompt", rejectedPromptSchema);

module.exports = Rejected_prompt;
