const User = require('../../models/usersModel');
const Generations = require('../../models/generationsModel');


// Helper function to calculate the start of the current subscription period
const getSubscriptionPeriodStart = (subscriptionDate, plan) => {
    // Use UTC methods for all date manipulations
    const now = new Date(Date.now());
    const start = new Date(Date.UTC(subscriptionDate.getUTCFullYear(), subscriptionDate.getUTCMonth(), subscriptionDate.getUTCDate()));

    if (plan === 'monthly') {
        while (start <= now) {
            start.setUTCMonth(start.getUTCMonth() + 1);
        }
        start.setUTCMonth(start.getUTCMonth() - 1);
    } else { // yearly
        while (start <= now) {
            start.setUTCFullYear(start.getUTCFullYear() + 1);
        }
        start.setUTCFullYear(start.getUTCFullYear() - 1);
    }

    start.setUTCHours(0, 0, 0, 0); // Reset time to midnight
    return start;
};



//get user details is called whenever the OAuthStateChange event is triggered on the frontend by firebase.
// If the user is on free plan, we give 3 credits per day with a max of 30 credits
// if the user has montly / yearly plan, we refresh his current_usage based on the subscription date

const getUserDetails = async (req, res, next) => {
    try {
        const userObj = await User.findOne({ email: req.email });
        if (userObj) {
            if (userObj.plan === "free" && (!userObj.role || userObj.role === "user")) {
                const currentDate = new Date();
                const lastUpdatedDate = userObj.limitLastUpdatedAt || userObj.createdAt;
                const daysSinceLastUpdate = Math.floor((currentDate - lastUpdatedDate) / (1000 * 60 * 60 * 24));

                if (daysSinceLastUpdate >= 1) {
                    const additionalCredits = Math.min(daysSinceLastUpdate * 10, 30);
                    userObj.limit = userObj.limit + additionalCredits; // Ensure the limit doesn't exceed 30
                    userObj.limitLastUpdatedAt = currentDate;
                    await userObj.save(); // Save the updated limit and date
                }
            }
            if (userObj.plan === 'monthly' || userObj.plan === 'yearly') {
                const subscriptionDate = userObj.subscriptionDetails.sale_timestamp;
                const currentPeriodStart = getSubscriptionPeriodStart(subscriptionDate, userObj.plan);
                const imageCount = await Generations.countDocuments({
                    email: req.email,
                    createdAt: { $gte: currentPeriodStart },
                    status: 'success',
                });
                userObj.limitRenewedAt = currentPeriodStart;
                userObj.current_usage = imageCount;
                await userObj.save();
            }

            const { email, name, plan, limit, current_usage, license_key } = userObj;
            return res.status(200).json({ email, name, plan, limit, current_usage, license_key });
        } else {
            return res.status(404).json({ message: "User not found" });
        }
    }
    catch (err) {
        console.log("=============ERROR: Get User Details Error=============");
        next(err);
    }
};


module.exports = getUserDetails;