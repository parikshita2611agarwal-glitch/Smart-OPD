const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function extractSymptoms(userText) {
  const res = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: `
Extract symptoms from user input.
Return JSON:
{
  "symptoms": [],
  "severity": "",
  "duration": "",
  "riskFlags": []
}
`
      },
      { role: "user", content: userText }
    ]
  });

  return JSON.parse(res.choices[0].message.content);
}

async function adjustScore(disease, score, userText) {
  const res = await client.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      {
        role: "system",
        content: `
Adjust medical risk score.
Return JSON:
{ "adjustedScore": number }
`
      },
      {
        role: "user",
        content: `
Disease: ${disease.name}
Score: ${score}
Input: ${userText}
`
      }
    ]
  });

  return JSON.parse(res.choices[0].message.content);
}

module.exports = { extractSymptoms, adjustScore };