const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testHardcoded() {
    const apiKey = 'AIzaSyDofLI9VmaS95_b4sHkbkwmHC1irEdf0QQ'; // Hardcoded from .env view
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    try {
        const result = await model.generateContent('Hello');
        console.log('Response:', result.response.text());
    } catch (error) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('StatusText:', error.response.statusText);
        }
    }
}

testHardcoded();
