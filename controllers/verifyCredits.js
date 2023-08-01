const User = require('../models/usersModel');

const verifyCredits = async (req, res, next) => {
    try {
        console.log('Came to verification of tokens')
        const userObj = await User.findOne({ email: req.email });
        if (userObj) {
            if (userObj.current_usage < userObj.limit) {
                next();
            } else {
                return res.status(403).json({ message: "Limit exceeded" });
            }
        } else {
            return res.status(404).json({ message: "User not found" });
        }
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// const verifyCreditsOld = async (req, res, next) => {
//     const idToken = req.headers.authorization;
//     const ip = req.clientIp;

//     if (!idToken) {
//         console.log('Came to verification of IP Credits')
//         try {
//             req.email = null;
//             const ipObj = await Ip.findOne({ ip: ip });
//             if (ipObj) {
//                 if (ipObj.current_usage < 2) {
//                     next();
//                 } else {
//                     return res.status(403).json({ message: "Limit exceeded" });
//                 }
//             } else {
//                 const ipObj = new Ip({
//                     ip: ip,
//                     current_usage: 0,
//                 });
//                 await ipObj.save();
//                 next();
//             }
//         } catch (error) {
//             console.log(error);
//             return res.status(500).json({ message: "Internal server error" });
//         }
//     }
//     else {
//         try {
//             console.log('Came to verification of tokens')
//             const decodedToken = await auth.verifyIdToken(idToken);
//             req.email = decodedToken.email;
//             const userObj = await User.findOne({ email: req.email });
//             if (userObj) {
//                 if (userObj.current_usage < userObj.limit) {
//                     next();
//                 } else {
//                     return res.status(403).json({ message: "Limit exceeded" });
//                 }
//             } else {
//                 return res.status(404).json({ message: "User not found" });
//             }
//         }
//         catch (error) {
//             console.log(error);
//             return res.status(500).json({ message: "Internal server error" });
//         }
//     }
// };

module.exports = verifyCredits;
