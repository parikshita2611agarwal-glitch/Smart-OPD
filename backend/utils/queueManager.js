const DISEASES = require('../data/diseases.json');
const { tiers, doctorTimeMinutes } = DISEASES;
 
// Token counters per tier
const tokenCounters = {
  EMERGENCY: tiers.EMERGENCY.tokenStart,
  SERIOUS:   tiers.SERIOUS.tokenStart,
  CHECKUP:   tiers.CHECKUP.tokenStart,
  MINOR:     tiers.MINOR.tokenStart,
};
 
// Daily capacity tracking (160 patients / day example)
const DAILY_CAPACITY = 160;
const dailySlots = {
  EMERGENCY: Math.round(DAILY_CAPACITY * tiers.EMERGENCY.weight), // 80
  SERIOUS:   Math.round(DAILY_CAPACITY * tiers.SERIOUS.weight),   // 40
  CHECKUP:   Math.round(DAILY_CAPACITY * tiers.CHECKUP.weight),   // 24
  MINOR:     Math.round(DAILY_CAPACITY * tiers.MINOR.weight),     // 16
};
const usedSlots = { EMERGENCY:0, SERIOUS:0, CHECKUP:0, MINOR:0 };
 
let queue = [];
 
function getNextToken(tier) {
  const token = tokenCounters[tier];
  tokenCounters[tier]++;
  return token;
}
 
function getTierOrder(tier) {
  return { EMERGENCY:0, SERIOUS:1, CHECKUP:2, MINOR:3 }[tier] ?? 4;
}
 
function addPatient(patient) {
  const tier = patient.tier || 'MINOR';
  const token = getNextToken(tier);
  usedSlots[tier] = (usedSlots[tier] || 0) + 1;
 
  // Doctor time from dataset or fallback
  const docTime = patient.doctor_time_minutes || doctorTimeMinutes[tier] || 10;
 
  const entry = {
    ...patient,
    token,
    tokenDisplay: String(token).padStart(3, '0'),
    tier,
    arrivedAt: Date.now(),
    waitMinutes: estimateWait(tier),
    doctorTimeMinutes: docTime,
  };
  queue.push(entry);
  queue.sort((a, b) =>
    getTierOrder(a.tier) - getTierOrder(b.tier) || a.arrivedAt - b.arrivedAt
  );
  return entry;
}
 
function removePatient(token) {
  queue = queue.filter(p => p.token !== token);
}
 
function getQueue() { return queue; }
 
function estimateWait(tier) {
  const ahead = queue.filter(p => getTierOrder(p.tier) <= getTierOrder(tier)).length;
  const avgTime = doctorTimeMinutes[tier] || 10;
  return Math.max(1, ahead * avgTime);
}
 
function getStats() {
  const counts = { EMERGENCY:0, SERIOUS:0, CHECKUP:0, MINOR:0 };
  queue.forEach(p => { if(counts[p.tier]!==undefined) counts[p.tier]++; });
  return {
    total: queue.length,
    total: queue.length,
    high: counts.EMERGENCY,
    medium: counts.SERIOUS,
    low: counts.CHECKUP + counts.MINOR,
    ...counts,
    avgWait: queue.length
      ? Math.round(queue.reduce((s,p)=>s+p.waitMinutes,0)/queue.length)
      : 0,
    nextToken: queue.length ? queue[0].tokenDisplay : null,
    slotsRemaining: {
      EMERGENCY: dailySlots.EMERGENCY - usedSlots.EMERGENCY,
      SERIOUS:   dailySlots.SERIOUS   - usedSlots.SERIOUS,
      CHECKUP:   dailySlots.CHECKUP   - usedSlots.CHECKUP,
      MINOR:     dailySlots.MINOR     - usedSlots.MINOR,
    }
  };
}
 
module.exports = { addPatient, removePatient, getQueue, getStats };
