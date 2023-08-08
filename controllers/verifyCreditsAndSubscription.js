const User = require('../models/usersModel');
const getAndUpdateSubscriptionData = require('./helpers/getAndUpdateSubscriptionData');

const verifyCreditsAndSubscription = async (req, res, next) => {
    //first get user details.
    //if there is no license key, then he is a free user, just check the limits and if usage is less than limit, then allow.
    //if there is license key, then we need to check the subscription details. 
    // to check the subscription details, first check the subscriptionDetailsUpdatedAt field. If it is null or if it is > 24hrs, then call the getAndUpdateSubscriptionData function to get the latest details. 
    //getAndUpdateSubscriptionData returns the updated user object with latest subscription details
    // then check the value canGenerate. if false, then send the error to user. if true then check the usage and limit.
    //if usage is more than limit, send error, else call next.
    try {
        const user = await User.findOne({ email: req.email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (!user.license_key) {
            console.log('Here there is no license key')
            if (user.current_usage < user.limit) {
                next();
            } else {
                return res.status(403).json({ message: "Limit exceeded. Please subscribe to one of our plans." });
            }
        } else {
            if (!user.subscriptionDetailsUpdatedAt || (user.subscriptionDetailsUpdatedAt && (new Date() - user.subscriptionDetailsUpdatedAt) > 86400000)) {
                console.log('stale data')
                const updatedUser = await getAndUpdateSubscriptionData(user.email, user.license_key);
                if (!updatedUser.canGenerate) {
                    return res.status(403).json({ message: "Your subscription ended." });
                } else {
                    if (updatedUser.current_usage < updatedUser.limit) {
                        next();
                    } else {
                        return res.status(403).json({ message: "Limit exceeded. Please upgrade your plan." });
                    }
                }
            } else {
                console.log('fresh data')
                if (!user.canGenerate) {
                    return res.status(403).json({ message: "Your subscription ended. If you have subscribed again, please validate your license key in profile page." });
                } else {
                    if (user.current_usage < user.limit) {
                        next();
                    } else {
                        return res.status(403).json({ message: "Limit exceeded" });
                    }
                }
            }
        }
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Something went wrong. Please reach out to support" });
    }
};


module.exports = verifyCreditsAndSubscription;
