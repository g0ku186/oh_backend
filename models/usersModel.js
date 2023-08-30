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
        role: {
            type: String,
            default: "user",
        },
        limit: {
            type: Number,
            default: 3,
        },
        current_usage: {
            type: Number,
            default: 0,
        },
        support_queries: {
            type: [Schema.Types.Mixed],
            default: [],
        },
        subscriptionEnded: Boolean,
        subscriptionEndedAt: Date,
        limitRenewedAt: Date,
        limitLastUpdatedAt: Date,
        subscriptionDetailsUpdatedAt: Date,
        canGenerate: {
            type: Boolean,
            default: true,
        },
        license_key: {
            type: String,
            unique: true,
        },
        subscriptionDetails: {
            sale_timestamp: Date,
            uses: Number,
            short_product_id: String,
            email: String,
            price: Number,
            recurrence: String,
            order_number: String,
            variants: String,
            ip_country: String,
            disputed: Boolean,
            dispute_won: Boolean,
            subscription_ended_at: Date,
            subscription_cancelled_at: Date,
            subscription_failed_at: Date,
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
