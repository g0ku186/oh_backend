const User = require('../models/usersModel');

const createOrUpdateUser = async (req, res) => {
    const { email, name, profile_pic, email_verified } = req;
    try {
        const user = await User.findOne({ email });
        if (user) {
            return res.status(200).json({ message: 'Success' });
        }
        const newUser = await User.create({
            email,
            name,
            profile_pic,
            email_verified,
        });
        return res.status(200).json({ message: 'Success' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
module.exports = createOrUpdateUser;