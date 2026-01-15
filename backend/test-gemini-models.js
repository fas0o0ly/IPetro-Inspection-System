const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    console.log('Testing Gemini API...');
    
    // Try gemini-pro
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("Say hello!");
    console.log('✅ gemini-pro works!');
    console.log('Response:', result.response.text());
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

listModels();