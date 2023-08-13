const auth = require("../../firebase");

const isAuthenticated = async (req, res, next) => {
    try {
        const idToken = req.headers.authorization;
        if (!idToken) {
            return res.status(401).json({ message: "Unauthenticated" });
        }
        const decodedToken = await auth.verifyIdToken(idToken);
        req.email = decodedToken.email;
        req.name = decodedToken.name;
        req.profile_pic = decodedToken.picture;
        req.email_verified = decodedToken.email_verified;
        next();
    } catch (error) {
        res.status(401).json({ message: "Unauthenticated. Please refresh the page and login." });
    }
};

module.exports = isAuthenticated;
