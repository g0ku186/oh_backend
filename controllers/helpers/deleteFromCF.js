const axios = require('axios');
const deleteFromCF = async (cf_id) => {
    try {
        const res = await axios.delete(
            `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_accountId}/images/v1/${cf_id}`,
            {
                headers: { "Authorization": `Bearer ${process.env.CF_apiKey}` },
            }
        );
        return res.data;

    } catch (err) {
        console.log("=============ERROR: Cloudflare Delete Error=============");
        throw err;
    }
}

module.exports = deleteFromCF;