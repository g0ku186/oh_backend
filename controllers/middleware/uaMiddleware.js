const crypto = require('crypto');
const UAParser = require('ua-parser-js');

const uaMiddleware = (req, res, next) => {
    const userAgent = UAParser(req.headers['user-agent']);
    req.userAgent = userAgent;
    const uniqueIdentifier = crypto
        .createHash('sha256')
        .update(req.clientIp + userAgent.ua)
        .digest('hex');
    req.uniqueIdentifier = uniqueIdentifier;
    next();
}

module.exports = uaMiddleware;