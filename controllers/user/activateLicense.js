const axios = require('axios');
const User = require('../../models/usersModel');
const getAndUpdateSubscriptionData = require('../helpers/getAndUpdateSubscriptionData');
const logger = require('../helpers/logger');



const activateLicense = async (req, res, next) => {
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
            if (new Date(updatedUser.subscriptionEndedAt) < Date.now()) {
                console.log('Subscription has ended');
                res.status(401).json({ message: 'Subscription has ended' });
                return;
            }
        }

        res.status(200).json({ message: 'License key activated successfully' });

    } catch (err) {
        console.log("=============ERROR: License Activation Error=============");
        if (err?.response?.status === 404 && err?.response?.data?.success === false) {
            logger.info(`Invalid license key: ${req.email, req.body.license_key}`)
            res.status(401).json({ message: 'Invalid license key' });
            return;
        }
        next(err);
    }
}

module.exports = activateLicense;