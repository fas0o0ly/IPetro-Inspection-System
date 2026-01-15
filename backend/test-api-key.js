const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function test() {
  try {
    console.log('Testing API key...');
    console.log('Key preview:', process.env.GEMINI_API_KEY?.substring(0, 20) + '...');
    
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const result = await model.generateContent("Say 'working' if you can read this");
    console.log('✅ SUCCESS!');
    console.log('Response:', result.response.text());
    
  } catch (err) {
    console.error('❌ FAILED:', err.message);
    
    if (err.message.includes('404')) {
      console.error('\n🔴 Your API key might not have access to this model.');
      console.error('Solution:');
      console.error('1. Go to https://aistudio.google.com/app/apikey');
      console.error('2. DELETE your current API key');
      console.error('3. CREATE a new API key');
      console.error('4. Update your .env file');
    }
  }
}

test();