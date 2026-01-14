const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const envPath = path.join(__dirname, '../.env');

console.log('Checking .env at:', envPath);

try {
    if (fs.existsSync(envPath)) {
        console.log('.env exists!');
        const content = fs.readFileSync(envPath, 'utf8');
        console.log('Content length:', content.length);
        console.log('Has GEMINI_API_KEY:', content.includes('GEMINI_API_KEY'));
        console.log('GEMINI_API_KEY line:', content.split('\n').find(l => l.startsWith('GEMINI_API_KEY')));
        
        console.log('process.env.GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'IS_SET' : 'NOT_SET');
    } else {
        console.log('.env does NOT exist!');
    }
} catch (err) {
    console.error('Error reading .env:', err);
}
