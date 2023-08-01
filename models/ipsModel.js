const mongoose = require("mongoose");
const { Schema } = mongoose;

const ipSchema = new Schema(
    {
        ip: {
            type: String,
            unique: true,
        },
        current_usage: Number,
    },
    { timestamps: true }
);

const Ip = mongoose.model("Ip", ipSchema);

module.exports = Ip;
