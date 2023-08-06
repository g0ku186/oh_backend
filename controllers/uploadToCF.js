const axios = require('axios');
const uploadToCF = async (url) => {
    try {
        const body = new FormData();
        body.append("url", url);
        const res = await axios.post(
            `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_accountId}/images/v1`, body,
            {
                headers: { "Authorization": `Bearer ${process.env.CF_apiKey}` },
            }
        );
        return res.data;

    } catch (e) {
        console.log("ERROR:" + e);
        throw e;
    }
}

module.exports = uploadToCF;