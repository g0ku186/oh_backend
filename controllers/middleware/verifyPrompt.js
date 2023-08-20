const Rejected_prompt = require('../../models/rejectedPrompts');

const checkBannedWords = require('../helpers/checkBannedWords');
const banishedWords = ['child', 'childlike', 'kids', 'kid', 'infant', 'Below 20', 'rape', '5yo', '6yo', '7yo', '8yo', '9yo', '10yo', '11yo', '12yo', '13yo', '14yo', '15yo', '16yo', '17yo',
    '5y', '6y', '7y', '8y', '9y', '10y', '11y', '12y', '13y', '14y', '15y', '16y', '17y', '5yr', '6yr', '7yr', '8yr', '9yr', '10yr', '11yr', '12yr', '13yr', '14yr', '15yr', '16yr', '17yr',
    '5year', '6year', '7year', '8year', '9year', '10year', '11year', '12year', '13year', '14year', '15year', '16year', '17year',
    '5years', '6years', '7years', '8years', '9years', '10years', '11years', '12years', '13years', '14years', '15years', '16years', '17years',
    '5yrs', '6yrs', '7yrs', '8yrs', '9yrs', '10yrs', '11yrs', '12yrs', '13yrs', '14yrs', '15yrs', '16yrs', '17yrs',
    '5 year', '6 year', '7 year', '8 year', '9 year', '10 year', '11 year', '12 year', '13 year', '14 year', '15 year', '16 year', '17 year',
    '5 years', '6 years', '7 years', '8 years', '9 years', '10 years', '11 years', '12 years', '13 years', '14 years', '15 years', '16 years', '17 years',
    '5 yr', '6 yr', '7 yr', '8 yr', '9 yr', '10 yr', '11 yr', '12 yr', '13 yr', '14 yr', '15 yr', '16 yr', '17 yr',
    '5 y', '6 y', '7 y', '8 y', '9 y', '10 y', '11 y', '12 y', '13 y', '14 y', '15 y', '16 y', '17 y',
    '5 yo', '6 yo', '7 yo', '8 yo', '9 yo', '10 yo', '11 yo', '12 yo', '13 yo', '14 yo', '15 yo', '16 yo', '17 yo',
    '5 yrs', '6 yrs', '7 yrs', '8 yrs', '9 yrs', '10 yrs', '11 yrs', '12 yrs', '13 yrs', '14 yrs', '15 yrs', '16 yrs', '17 yrs',
    'five year', 'six year', 'seven year', 'eight year', 'nine year', 'ten year', 'eleven year', 'twelve year', 'thirteen year', 'fourteen year', 'fifteen year', 'sixteen year', 'seventeen year',
    'five years', 'six years', 'seven years', 'eight years', 'nine years', 'ten years', 'eleven years', 'twelve years', 'thirteen years', 'fourteen years', 'fifteen years', 'sixteen years', 'seventeen years',
    'five yr', 'six yr', 'seven yr', 'eight yr', 'nine yr', 'ten yr', 'eleven yr', 'twelve yr', 'thirteen yr', 'fourteen yr', 'fifteen yr', 'sixteen yr', 'seventeen yr',
    'five y', 'six y', 'seven y', 'eight y', 'nine y', 'ten y', 'eleven y', 'twelve y', 'thirteen y', 'fourteen y', 'fifteen y', 'sixteen y', 'seventeen y',
    'five yo', 'six yo', 'seven yo', 'eight yo', 'nine yo', 'ten yo', 'eleven yo', 'twelve yo', 'thirteen yo', 'fourteen yo', 'fifteen yo', 'sixteen yo', 'seventeen yo',
    'five yrs', 'six yrs', 'seven yrs', 'eight yrs', 'nine yrs', 'ten yrs', 'eleven yrs', 'twelve yrs', 'thirteen yrs', 'fourteen yrs', 'fifteen yrs', 'sixteen yrs', 'seventeen yrs',
    'under age', 'minor', 'underage'
];


const verifyPrompt = async (req, res, next) => {
    const prompt = req.body.instructions;
    const { cleanedPrompt, match } = checkBannedWords(prompt, banishedWords);
    if (match) {
        try {
            //store in reject prompts db
            const rejectedPrompt = new Rejected_prompt({
                email: req.email,
                prompt: prompt,
                ip: req.clientIp,
                cleanedPrompt: cleanedPrompt,
                meta: {
                    userAgent: req.userAgent,
                    uniqueIdentifier: req.uniqueIdentifier,
                }

            });
            await rejectedPrompt.save();

        } catch (err) {
            console.log('Failed to save the rejected prompt')
            next(err);
        }
        return res.status(400).json({
            message: 'Prompt rejected. Please do not use age or any illegal words. We do not encourage illegal activities.',
        });
    }
    next();
}

module.exports = verifyPrompt;