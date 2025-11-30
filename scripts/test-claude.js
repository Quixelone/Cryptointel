const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config({ path: '.env.local' });

async function testClaude() {
    console.log('🔑 Checking API Key from environment...');
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
        console.error('❌ ANTHROPIC_API_KEY not found in .env.local');
        return;
    }

    const anthropic = new Anthropic({ apiKey });

    console.log('📡 Sending test request to Claude...');
    try {
        const msg = await anthropic.messages.create({
            model: "claude-sonnet-4-20250514",
            max_tokens: 100,
            messages: [{ role: "user", content: "Hello" }],
        });
        console.log('✅ Success! Response:', msg.content[0].text);
    } catch (error) {
        console.error('❌ Error calling Claude:', error);
    }
}

testClaude();
