const { Logtail } = require("@logtail/node");
const logger = new Logtail(process.env.logtail_token);

module.exports = logger;
