const generateSubscriptionStatus = (gumRoadResponse) => {
    const subscriptionDetails = {};
    subscriptionDetails.sale_timestamp = gumRoadResponse.purchase.sale_timestamp;
    subscriptionDetails.uses = gumRoadResponse.uses;
    subscriptionDetails.short_product_id = gumRoadResponse.purchase.short_product_id;
    subscriptionDetails.email = gumRoadResponse.purchase.email;
    subscriptionDetails.price = gumRoadResponse.purchase.price;
    subscriptionDetails.recurrence = gumRoadResponse.purchase.recurrence;
    subscriptionDetails.order_number = gumRoadResponse.purchase.order_number;
    subscriptionDetails.variants = gumRoadResponse.purchase.variants;
    subscriptionDetails.ip_country = gumRoadResponse.purchase.ip_country;
    subscriptionDetails.disputed = gumRoadResponse.purchase.disputed;
    subscriptionDetails.dispute_won = gumRoadResponse.purchase.dispute_won;
    subscriptionDetails.subscription_ended_at = gumRoadResponse.purchase.subscription_ended_at;
    subscriptionDetails.subscription_cancelled_at = gumRoadResponse.purchase.subscription_cancelled_at;
    subscriptionDetails.subscription_failed_at = gumRoadResponse.purchase.subscription_failed_at;


    const subscriptionEnded = subscriptionDetails.subscription_ended_at || subscriptionDetails.subscription_cancelled_at || subscriptionDetails.subscription_failed_at ? true : false;
    const subscriptionEndedAt = subscriptionEnded ? new Date(Math.max(new Date(subscriptionDetails.subscription_ended_at), new Date(subscriptionDetails.subscription_cancelled_at), new Date(subscriptionDetails.subscription_failed_at))) : null;

    //if subscription ended, and the ending date is less than date.now, then set canGenerate as false
    let canGenerate = true;
    if (subscriptionEndedAt && new Date(subscriptionEndedAt) < Date.now()) {
        canGenerate = false;
    }
    let limit = 1;
    let plan = "free";
    if (subscriptionDetails.recurrence === "yearly") {
        limit = 1000;
        plan = "yearly";
    } else {
        limit = 1000;
        plan = "monthly";
    }
    return { subscriptionDetails, subscriptionEnded, subscriptionEndedAt, limit, plan, canGenerate };

}

module.exports = generateSubscriptionStatus;