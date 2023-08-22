const User = require('../../models/usersModel');

const getUserDetails = async (req, res, next) => {
    try {
        const userObj = await User.findOne({ email: req.email });
        if (userObj) {
            if (userObj.plan === "free" && (!userObj.role || userObj.role === "user")) {
                const currentDate = new Date();
                const lastUpdatedDate = userObj.limitLastUpdatedAt || userObj.createdAt;
                const daysSinceLastUpdate = Math.floor((currentDate - lastUpdatedDate) / (1000 * 60 * 60 * 24));

                if (daysSinceLastUpdate >= 1) {
                    const additionalCredits = Math.min(daysSinceLastUpdate * 3, 30);
                    userObj.limit = userObj.limit + additionalCredits; // Ensure the limit doesn't exceed 30
                    userObj.limitLastUpdatedAt = currentDate;
                    await userObj.save(); // Save the updated limit and date
                }
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