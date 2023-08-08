const User = require('../models/usersModel');

const getUserDetails = async (req, res, next) => {
    try {
        const userObj = await User.findOne({ email: req.email });
        if (userObj) {
            const { email, name, plan, limit, current_usage, license_key } = userObj;
            return res.status(200).json({ email, name, plan, limit, current_usage, license_key });
        } else {
            return res.status(404).json({ message: "User not found" });
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = getUserDetails;