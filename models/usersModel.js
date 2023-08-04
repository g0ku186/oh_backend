const mongoose = require("mongoose");
const { Schema } = mongoose;

const usersSchema = new Schema(
    {
        email: {
            type: String,
            unique: true,
        },
        name: String,
        profile_pic: String,
        email_verified: Boolean,
        plan: {
            type: String,
            default: "free",
        },
        limit: {
            type: Number,
            default: 5,
        },
        current_usage: {
            type: Number,
            default: 0,
        },
        support_queries: {
            type: [Schema.Types.Mixed],
            default: [],
        },
        subscribedDate: {
            type: Date,
            default: null,
        },
        renewalDate: {
            type: Date,
            default: null,
        },
        utmDetails: Schema.Types.Mixed,
        referrer: String,
        ip: String,
        meta: Schema.Types.Mixed,
    },
    { timestamps: true }
);

const User = mongoose.model("User", usersSchema);

module.exports = User;
