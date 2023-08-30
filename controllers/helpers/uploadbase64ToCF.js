const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const fsPromises = fs.promises;
const path = require('path');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));


const uploadbase64ToCF = async (base64Image, name, retries = 3, delay = 5000) => {
    try {
        // Step 1: Convert base64 to buffer
        const buffer = Buffer.from(base64Image, 'base64');

        // Step 2: Write the buffer to a file (you could use a temp folder)
        const filePath = path.join(__dirname, `${name}.png`);
        await fsPromises.writeFile(filePath, buffer);

        // Step 3: Use that file in form data
        const body = new FormData();
        body.append('file', fs.createReadStream(filePath), { filename: `${name}.png`, contentType: 'image/png' });

        const res = await axios.post(
            `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_accountId}/images/v1`,
            body,
            {
                headers: { "Authorization": `Bearer ${process.env.CF_apiKey}`, ...body.getHeaders() },
            }
        );

        // Optionally, remove the temp file after upload
        await fsPromises.unlink(filePath);

        return res.data;

    } catch (err) {
        if (retries > 0) {
            console.log('Failed to upload to CF. Retrying...');
            await sleep(delay); // wait for the given delay
            return uploadbase64ToCF(base64Image, name, retries - 1, delay); // recursively retry
        } else {
            console.log("=============ERROR: Cloudflare Upload Error=============");
            throw err;
        }
    }
};

module.exports = uploadbase64ToCF;
