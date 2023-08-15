const crypto = require('crypto');
const UAParser = require('ua-parser-js');

const uaMiddleware = (req, res, next) => {
    console.log('Came to UA middleware')
    const userAgent = UAParser(req.headers['user-agent']);
    req.userAgent = userAgent;
    console.log(userAgent);
    console.log(req.clientIp);
    console.log(userAgent.ua);
    console.log(req.clientIp + userAgent.ua);
    const uniqueIdentifier = crypto
        .createHash('sha256')
        .update(req.clientIp + userAgent.ua)
        .digest('hex');
    req.uniqueIdentifier = uniqueIdentifier;
    next();
}

module.exports = uaMiddleware;