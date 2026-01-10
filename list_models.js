require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const API_KEY = process.env.GOOGLE_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const candidates = [
    "gemini-2.0-flash",
    "gemini-2.0-pro",
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-flash-latest",
    "gemini-pro-latest"
];

async function testModels() {
    console.log("Testing model candidates...");

    for (const modelName of candidates) {
        try {
            console.log(`\nTesting: ${modelName}`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello, are you there?");
            const response = await result.response;
            console.log(`✅ SUCCESS: ${modelName}`);
            console.log("Response:", response.text().substring(0, 50) + "...");
            return; // Valid model found, stop.
        } catch (error) {
            console.log(`❌ FAILED: ${modelName}`);
            console.log(`Reason: ${error.message.split('\n')[0]}`); // Print first line of error
        }
    }
    console.log("\n❌ No working models found in candidate list.");
}

testModels();
