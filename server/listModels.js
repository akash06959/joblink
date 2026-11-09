require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        process.exit(1);
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // genAI doesn't have a direct method to list models, but we can try a known working model.
        // Actually, some libraries expose a method, let's just stick to the error message which implied check the list.
        // The Google Gemini API documentation says models are `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-1.0-pro`.
        // If these fail, maybe the API key is invalid or has no quota.

        // Let's print the full error message for `gemini-1.5-flash` to be sure.
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent('hi');
        console.log('Success:', result.response.text());
        process.exit(0);
    } catch (error) {
        console.error('FULL ERROR:', error);

        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        process.exit(1);
    }
}

listModels();
