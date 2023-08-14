const User = require('../../models/usersModel');

const createOrUpdateUser = async (req, res) => {

    try {
        const { email, name, profile_pic, email_verified } = req;
        const ip = req.clientIp;
        const user = await User.findOne({ email });
        if (user) {
            if (!user.email_verified) {
                user.email_verified = email_verified;
                await user.save();
            }
            return res.status(200).json({ message: 'Success' });

        }
        const newUser = await User.create({
            email,
            name,
            profile_pic,
            email_verified,
            ip
        });
        return res.status(200).json({ message: 'Success' });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
module.exports = createOrUpdateUser;