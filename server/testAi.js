require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

(async () => {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const res = await model.generateContent("test");
        const out = await res.response;
        console.log("SUCCESS:", out.text());
    } catch (e) {
        console.error("ERROR:", e.message);
    }
})();
