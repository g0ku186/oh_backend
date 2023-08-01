const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { credential } = require("firebase-admin");
const serviceAccount = require(process.env.FIREBASE_CONFIG_PATH);

const firebaseApp = initializeApp({
    credential: credential.cert(serviceAccount),
});
const auth = getAuth(firebaseApp);

module.exports = auth;