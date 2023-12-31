const axios = require('axios');
const User = require('../../models/usersModel');
const generateSubscriptionStatus = require('./generateSubscriptionStatus')


const getDataFromGumRoad = async (license_key) => {
    const gumRoadEndPoint = "https://api.gumroad.com/v2/licenses/verify";
    try {
        const body = {
            "product_id": process.env.GR_productId,
            "license_key": license_key
        }
        const response = await axios.post(gumRoadEndPoint, body, { headers: {} });
        return response.data;

    } catch (err) {
        console.log("=============ERROR: Gumroad License key Error=============");
        throw err;
    }
}


const getAndUpdateSubscriptionData = async (email, license_key) => {
    try {
        const gumRoadResponse = await getDataFromGumRoad(license_key);
        const { subscriptionDetails, subscriptionEnded, subscriptionEndedAt, limit, plan, canGenerate } = generateSubscriptionStatus(gumRoadResponse);
        const updatedUser = await User.findOneAndUpdate({ email: email }, {
            license_key: license_key,
            subscriptionDetails: subscriptionDetails,
            subscriptionEnded: subscriptionEnded,
            subscriptionEndedAt: subscriptionEndedAt,
            limit: limit,
            plan: plan,
            canGenerate: canGenerate,
            subscriptionDetailsUpdatedAt: Date.now(),
        }, { new: true });
        return updatedUser;

    } catch (err) {
        console.log("=============ERROR: Get and Update subscription data Error=============");
        throw err;
    }
}

module.exports = getAndUpdateSubscriptionData;