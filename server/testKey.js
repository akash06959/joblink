const { GoogleGenerativeAI } = require('@google/generative-ai');

(async () => {
    try {
        const apiKey = 'AIzaSyByafraeVVHmKF-yIgtPNci9Km2DTHKKkY';
        const genAI = new GoogleGenerativeAI(apiKey);
        const models = ['gemini-2.0-flash-lite-preview-02-05', 'gemini-2.5-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-pro-latest'];
        for (const m of models) {
            try {
                console.log("Trying", m, "...");
                const model = genAI.getGenerativeModel({ model: m });
                const res = await model.generateContent("hello");
                const out = await res.response;
                console.log("SUCCESS on", m, ":", out.text());
            } catch (e) {
                console.error("ERROR on", m, ":", e.status || e.message);
            }
        }
    } catch (e) {
        console.error("ERROR:", e.message);
    }
})();
