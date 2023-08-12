const axios = require('axios');
const User = require('../models/usersModel');
const getAndUpdateSubscriptionData = require('./helpers/getAndUpdateSubscriptionData');



const activateLicense = async (req, res, next) => {
    console.log('Cme to activate license function')
    const email = req.email;
    try {
        const existingKey = await User.findOne({ license_key: req.body.license_key });
        if (existingKey) {
            if (existingKey.email !== email) {
                console.log('License key already in use');
                res.status(401).json({ message: 'License key already in use with different account' });
                return;
            }
        }
        const updatedUser = await getAndUpdateSubscriptionData(email, req.body.license_key);
        if (updatedUser.subscriptionEnded) {
            console.log('Came to subscription ended condition')
            if (new Date(subscriptionEndedAt) < Date.now()) {
                console.log('Subscription has ended');
                res.status(401).json({ message: 'Subscription has ended' });
                return;
            }
        }

        res.status(200).json({ message: 'License key activated successfully' });

    } catch (e) {
        console.log("ERROR:");
        console.log(e);
        if (e?.response?.status === 404 && e?.response?.data?.success === false) {
            res.status(401).json({ message: 'Invalid license key' });
            return;
        }
    }
}

module.exports = activateLicense;