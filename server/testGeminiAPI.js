require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiAPI() {
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('Testing Gemini API...');

    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY not found in .env');
        process.exit(1);
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 'gemini-1.0-pro'];

    for (const modelName of modelsToTry) {
        console.log(`\nTesting model: ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const prompt = 'Say "Hello!"';
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            console.log(`✅ SUCCESS with model: ${modelName}`);
            console.log('Response:', text);
            process.exit(0);
        } catch (error) {
            console.error(`❌ Failed with model: ${modelName}`);
            console.error('Error:', error.message);
        }
    }

    console.error('\n❌ All models failed.');
    process.exit(1);
}

testGeminiAPI();
