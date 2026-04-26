const express = require("express");
const router = express.Router();
const DISEASES = require("../data/diseases.json");

const { extractSymptoms, adjustScore } = require("../utils/aiEngine");

// scoring function
function calculateScore(disease, extracted) {
  let score = 0;

  const symptoms = extracted.symptoms || [];

  disease.symptoms.primary.forEach(s => {
    if (symptoms.includes(s.term)) score += s.weight;
  });

  disease.symptoms.secondary.forEach(s => {
    if (symptoms.includes(s.term)) score += s.weight;
  });

  disease.negativeIndicators?.forEach(n => {
    if (symptoms.includes(n)) score -= 8;
  });

  return score;
}

router.post("/", async (req, res) => {
  try {
    const { text } = req.body;

    // 1. AI extract symptoms
    const extracted = await extractSymptoms(text);

    let results = [];

    // 2. Score all diseases
    for (let disease of DISEASES.diseases) {
      let baseScore = calculateScore(disease, extracted);

      // 3. AI refine score
      const { adjustedScore } = await adjustScore(
        disease,
        baseScore,
        text
      );

      results.push({
        name: disease.name,
        score: adjustedScore,
        tier: disease.tier,
        department: disease.department
      });
    }

    // 4. sort best match
    results.sort((a, b) => b.score - a.score);

    const top = results[0];

    res.json({
      extracted,
      topMatch: top,
      all: results.slice(0, 5)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI analysis failed" });
  }
});

module.exports = router;