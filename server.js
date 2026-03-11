/**
 * MARCH MADNESS: PRICING STRATEGY SHOWDOWN — Server
 * =====================================================
 * Run: node server.js
 *
 * Teacher URL : http://<YOUR-IP>:3000/
 * Student URL : http://<YOUR-IP>:3000/student
 *
 * HOW TO ADD COMPANIES: Add entry to COMPANIES{}, add id to INITIAL_BRACKET_ORDER
 * HOW TO ADD MARKET CONDITIONS: push object to MARKET_CONDITIONS[]
 * HOW TO CHANGE SCORING: edit SCORE_WEIGHTS{}
 * HOW TO CHANGE PORT: set PORT env var or edit below
 */

const http  = require('http');
const fs    = require('fs');
const path  = require('path');
const { WebSocketServer, WebSocket } = require('ws');
const os    = require('os');

const PORT = process.env.PORT || 3000;

function getLocalIP() {
  for (const ifaces of Object.values(os.networkInterfaces())) {
    for (const i of ifaces || []) {
      if (i.family === 'IPv4' && !i.internal) return i.address;
    }
  }
  return 'localhost';
}
const LOCAL_IP = getLocalIP();

// ================================================================
// GAME DATA
// ================================================================

const COMPANIES = {
  apple:      { id:'apple',      name:'Apple',       emoji:'🍎', tagline:'Think Different',             strategy:'Premium Pricing',      description:'Commands elite margins through hardware-software ecosystem lock-in. Switching costs are enormous and brand status is unmatched.',         attributes:{brandPower:98,costEfficiency:58,customerLoyalty:93,demandElasticity:22,pricingFlexibility:38,channelStrength:88} },
  nike:       { id:'nike',       name:'Nike',        emoji:'👟', tagline:'Just Do It',                  strategy:'Psychological Pricing', description:'Aspirational pricing signals athletic identity and social status. Limited-edition drops and $9.99 endings create purchase urgency.',            attributes:{brandPower:92,costEfficiency:65,customerLoyalty:80,demandElasticity:42,pricingFlexibility:58,channelStrength:88} },
  starbucks:  { id:'starbucks',  name:'Starbucks',   emoji:'☕', tagline:'The Third Place',             strategy:'Value Pricing',         description:'Charges premium for ritual, customization, and belonging. Loyalty app drives habitual purchases insulated from price sensitivity.',           attributes:{brandPower:86,costEfficiency:54,customerLoyalty:88,demandElasticity:46,pricingFlexibility:64,channelStrength:84} },
  tesla:      { id:'tesla',      name:'Tesla',       emoji:'⚡', tagline:'Accelerating Sustainability', strategy:'Premium Pricing',       description:'Innovation premium captures early adopters. Direct-to-consumer model eliminates dealer margin. OTA updates sustain perceived value.',       attributes:{brandPower:89,costEfficiency:54,customerLoyalty:84,demandElasticity:32,pricingFlexibility:72,channelStrength:71} },
  walmart:    { id:'walmart',    name:'Walmart',     emoji:'🏪', tagline:'Save Money. Live Better.',    strategy:'Discount Pricing',      description:'EDLP (Every Day Low Prices) strategy. Massive scale enables supplier negotiation that passes savings directly to shoppers.',               attributes:{brandPower:78,costEfficiency:96,customerLoyalty:73,demandElasticity:80,pricingFlexibility:76,channelStrength:96} },
  aldi:       { id:'aldi',       name:'Aldi',        emoji:'🛒', tagline:'Good. Different.',            strategy:'Discount Pricing',      description:'Ultra-lean private-label grocery model strips every cost. Strict SKU discipline and no-frills operations fund maximum savings.',             attributes:{brandPower:60,costEfficiency:98,customerLoyalty:76,demandElasticity:88,pricingFlexibility:48,channelStrength:72} },
  mcdonalds:  { id:'mcdonalds',  name:"McDonald's",  emoji:'🍔', tagline:"I'm Lovin' It",              strategy:'Competitive Pricing',   description:'Matches rivals on price while using value menus strategically. Franchise scale and supply chain efficiency sustain strong margins.',           attributes:{brandPower:88,costEfficiency:86,customerLoyalty:78,demandElasticity:68,pricingFlexibility:80,channelStrength:93} },
  southwest:  { id:'southwest',  name:'Southwest',   emoji:'✈️', tagline:'Low Fares. Nothing to Hide.',strategy:'Penetration Pricing',   description:'Transparent low fares with no hidden fees build loyalty in a sector notorious for fee stacking.',                                            attributes:{brandPower:72,costEfficiency:82,customerLoyalty:80,demandElasticity:65,pricingFlexibility:66,channelStrength:70} },
  uber:       { id:'uber',       name:'Uber',        emoji:'🚗', tagline:'Move the Way You Want',       strategy:'Dynamic Pricing',       description:'Real-time surge pricing algorithms balance supply and demand across millions of trips. Pricing flexibility is core to the model.',           attributes:{brandPower:80,costEfficiency:66,customerLoyalty:61,demandElasticity:56,pricingFlexibility:96,channelStrength:85} },
  delta:      { id:'delta',      name:'Delta',       emoji:'🛫', tagline:'Keep Climbing',               strategy:'Dynamic Pricing',       description:'Yield management with 20+ fare classes optimizes revenue across every seat. Medallion program captures high-value business travelers.',       attributes:{brandPower:79,costEfficiency:62,customerLoyalty:76,demandElasticity:50,pricingFlexibility:88,channelStrength:80} },
  amazon:     { id:'amazon',     name:'Amazon',      emoji:'📦', tagline:'Work Hard. Have Fun.',        strategy:'Competitive Pricing',   description:'Price-matching algorithms adjust prices millions of times daily. Prime membership anchors loyalty and subsidizes free shipping.',               attributes:{brandPower:90,costEfficiency:88,customerLoyalty:86,demandElasticity:60,pricingFlexibility:93,channelStrength:98} },
  ticketmaster:{id:'ticketmaster',name:'Ticketmaster',emoji:'🎟️',tagline:'Your Live Experiences',     strategy:'Dynamic Pricing',       description:'Near-monopolistic control over live events enables aggressive dynamic pricing and fee stacking. Venue lock-in eliminates alternatives.',          attributes:{brandPower:64,costEfficiency:70,customerLoyalty:34,demandElasticity:38,pricingFlexibility:96,channelStrength:91} },
  costco:     { id:'costco',     name:'Costco',      emoji:'🏬', tagline:'Quality at Scale',            strategy:'Value Pricing',         description:'Membership fees subsidize razor-thin 11% product margins. Treasure-hunt merchandising and bulk value create cult loyalty.',                    attributes:{brandPower:83,costEfficiency:90,customerLoyalty:95,demandElasticity:72,pricingFlexibility:44,channelStrength:80} },
  target:     { id:'target',     name:'Target',      emoji:'🎯', tagline:'Expect More. Pay Less.',      strategy:'Psychological Pricing', description:'Positioned between Walmart and department stores. Own-brand labels drive aspiration. $X.99 charm pricing anchors perceived savings.',          attributes:{brandPower:80,costEfficiency:78,customerLoyalty:75,demandElasticity:64,pricingFlexibility:72,channelStrength:86} },
  netflix:    { id:'netflix',    name:'Netflix',     emoji:'🎬', tagline:"See What's Next",             strategy:'Bundle Pricing',        description:'Monthly subscription bundles unlimited content. High content cost amortized across global subscribers — scale is everything.',                 attributes:{brandPower:85,costEfficiency:64,customerLoyalty:72,demandElasticity:60,pricingFlexibility:54,channelStrength:88} },
  disneyplus: { id:'disneyplus', name:'Disney+',     emoji:'🏰', tagline:'The Stories You Love',       strategy:'Bundle Pricing',        description:'Unparalleled IP: Disney, Marvel, Star Wars, Pixar. Bundle tiers with Hulu and ESPN+ create family ecosystem lock-in.',                         attributes:{brandPower:93,costEfficiency:58,customerLoyalty:80,demandElasticity:44,pricingFlexibility:50,channelStrength:86} }
};

// To add a condition: push new object with same structure.
// strategyBonuses: points added to score for that strategy in this market.
// attrMultipliers: multiplier applied to attribute weight during scoring.
const MARKET_CONDITIONS = [
  { id:'hi_inf',  name:'High Inflation',           icon:'📈', color:'#EF4444', description:'Rising prices erode purchasing power. Consumers shift to value-seeking, penalizing premium brands.', strategyBonuses:{'Discount Pricing':28,'Value Pricing':22,'Competitive Pricing':12,'Penetration Pricing':8,'Bundle Pricing':5,'Dynamic Pricing':-8,'Psychological Pricing':-12,'Premium Pricing':-22}, attrMultipliers:{costEfficiency:1.35,brandPower:0.8} },
  { id:'lux',     name:'Luxury Trend Surge',       icon:'💎', color:'#A855F7', description:'Social media drives aspirational consumption. Consumers willingly pay more for status and exclusivity.', strategyBonuses:{'Premium Pricing':30,'Psychological Pricing':22,'Bundle Pricing':12,'Dynamic Pricing':10,'Value Pricing':5,'Competitive Pricing':-5,'Penetration Pricing':-18,'Discount Pricing':-25}, attrMultipliers:{brandPower:1.45,customerLoyalty:1.2} },
  { id:'weak_ec', name:'Weak Economy',             icon:'📉', color:'#F97316', description:'GDP contraction shifts consumers toward essentials. Discretionary spending collapses.', strategyBonuses:{'Discount Pricing':25,'Value Pricing':18,'Penetration Pricing':15,'Competitive Pricing':10,'Bundle Pricing':5,'Dynamic Pricing':-10,'Psychological Pricing':-15,'Premium Pricing':-28}, attrMultipliers:{costEfficiency:1.4,brandPower:0.7} },
  { id:'supply',  name:'Supply Chain Disruption',  icon:'🚢', color:'#EAB308', description:'Product shortages flip power dynamics. Lean operators gain advantage; dynamic pricers capture scarcity premiums.', strategyBonuses:{'Dynamic Pricing':28,'Premium Pricing':20,'Competitive Pricing':10,'Value Pricing':8,'Bundle Pricing':5,'Penetration Pricing':-5,'Discount Pricing':-20}, attrMultipliers:{costEfficiency:1.5,pricingFlexibility:1.3} },
  { id:'tourism', name:'Tourism Boom',             icon:'🌴', color:'#06B6D4', description:'Surging travel demand creates high-margin opportunities. Dynamic pricers capture peak premiums.', strategyBonuses:{'Dynamic Pricing':35,'Premium Pricing':20,'Bundle Pricing':18,'Psychological Pricing':12,'Competitive Pricing':5,'Value Pricing':5,'Penetration Pricing':-5,'Discount Pricing':-15}, attrMultipliers:{pricingFlexibility:1.45,brandPower:1.1} },
  { id:'viral',   name:'Viral Social Media Buzz',  icon:'📱', color:'#EC4899', description:'A cultural moment drives massive brand awareness. Iconic brands capitalize; generic competitors can\'t convert attention.', strategyBonuses:{'Psychological Pricing':28,'Premium Pricing':22,'Bundle Pricing':15,'Dynamic Pricing':12,'Value Pricing':10,'Competitive Pricing':5,'Penetration Pricing':8,'Discount Pricing':-10}, attrMultipliers:{brandPower:1.5,customerLoyalty:1.2} },
  { id:'season',  name:'Seasonal Demand Spike',    icon:'🎄', color:'#22C55E', description:'Holiday surge floods demand. Flexible pricers and strong channels dominate. Rigid low-price models leave revenue uncaptured.', strategyBonuses:{'Dynamic Pricing':30,'Bundle Pricing':25,'Psychological Pricing':18,'Premium Pricing':15,'Competitive Pricing':10,'Value Pricing':8,'Discount Pricing':5,'Penetration Pricing':-5}, attrMultipliers:{channelStrength:1.4,pricingFlexibility:1.3} },
  { id:'newco',   name:'New Competitor Enters',    icon:'⚔️', color:'#F43F5E', description:'A well-funded disruptor threatens market share. Customer loyalty and brand strength become the key moats.', strategyBonuses:{'Competitive Pricing':25,'Penetration Pricing':20,'Value Pricing':18,'Dynamic Pricing':15,'Discount Pricing':12,'Bundle Pricing':10,'Psychological Pricing':5,'Premium Pricing':-10}, attrMultipliers:{customerLoyalty:1.4,pricingFlexibility:1.2,brandPower:1.1} },
  { id:'strong',  name:'Strong Consumer Confidence',icon:'💪', color:'#10B981', description:'Low unemployment and rising wages unleash spending. Aspirational categories outperform and price sensitivity drops.', strategyBonuses:{'Premium Pricing':28,'Psychological Pricing':22,'Bundle Pricing':18,'Dynamic Pricing':15,'Value Pricing':10,'Competitive Pricing':5,'Penetration Pricing':0,'Discount Pricing':-10}, attrMultipliers:{brandPower:1.3,customerLoyalty:1.2} },
  { id:'weak_c',  name:'Weak Consumer Confidence', icon:'😰', color:'#6366F1', description:'Anxiety drives belt-tightening. Value and essential brands win. Premium purchases are postponed.', strategyBonuses:{'Discount Pricing':28,'Value Pricing':22,'Penetration Pricing':15,'Competitive Pricing':12,'Bundle Pricing':8,'Dynamic Pricing':-5,'Psychological Pricing':-15,'Premium Pricing':-25}, attrMultipliers:{costEfficiency:1.4,brandPower:0.75} }
];

// Adjust these weights to change how much each factor influences the outcome.
const SCORE_WEIGHTS = {
  brandPower:0.20, costEfficiency:0.15, customerLoyalty:0.20,
  demandElasticity:0.10, pricingFlexibility:0.10, channelStrength:0.15,
  strategyFit:0.07, marketCondition:0.03
};

const INITIAL_BRACKET_ORDER = ['apple','disneyplus','nike','netflix','starbucks','target','tesla','costco','walmart','ticketmaster','aldi','amazon','mcdonalds','delta','southwest','uber'];
const ROUND_NAMES  = ['Round of 16','Elite 8','Final Four','Championship'];
const ROUND_LABELS = ['R16','E8','F4','🏆'];
const TEAM_COLORS  = ['#FF6B35','#3B7FE8','#1DB87A','#F5C842','#9B5CE8','#EC4899','#06B6D4','#F97316'];

// ================================================================
// GAME STATE
// ================================================================

function makeDefaultTeams() {
  return ['Team 1','Team 2','Team 3','Team 4'].map((name, i) => ({
    id:'t'+i, name, color:TEAM_COLORS[i], points:0, correctVotes:0, totalVotes:0
  }));
}

let G = {
  phase: 'lobby',
  teams: makeDefaultTeams(),
  bracket: null,
  bracketOrder: [...INITIAL_BRACKET_ORDER],
  currentRound: 0,
  currentMatchupIdx: 0,
  activeCondition: null,
  lastResult: null,
  companyOverrides: {}
};

// Student sessions: wsId -> { ws, name, teamId, vote }
const students = new Map();
let teacherWs = null;

// ================================================================
// SCORING ENGINE
// ================================================================

function getCompany(id) {
  const base = COMPANIES[id];
  const ov   = G.companyOverrides[id] || {};
  return { ...base, ...ov, attributes: { ...base.attributes, ...(ov.attributes||{}) }, strategy: ov.strategy || base.strategy };
}

function stratFitScore(strategy, a) {
  switch(strategy) {
    case 'Premium Pricing':      return a.brandPower*0.40+a.customerLoyalty*0.35+(100-a.demandElasticity)*0.25;
    case 'Penetration Pricing':  return a.costEfficiency*0.45+a.channelStrength*0.30+a.customerLoyalty*0.25;
    case 'Competitive Pricing':  return a.channelStrength*0.35+a.costEfficiency*0.35+a.pricingFlexibility*0.30;
    case 'Discount Pricing':     return a.costEfficiency*0.50+a.demandElasticity*0.30+a.channelStrength*0.20;
    case 'Dynamic Pricing':      return a.pricingFlexibility*0.60+a.channelStrength*0.25+a.brandPower*0.15;
    case 'Value Pricing':        return a.customerLoyalty*0.35+a.costEfficiency*0.35+(100-a.demandElasticity)*0.15+a.brandPower*0.15;
    case 'Psychological Pricing':return a.brandPower*0.45+a.customerLoyalty*0.35+a.channelStrength*0.20;
    case 'Bundle Pricing':       return a.brandPower*0.30+a.customerLoyalty*0.35+a.channelStrength*0.35;
    default: return 50;
  }
}

function calcScore(id, cond) {
  const co = getCompany(id), a = co.attributes, w = SCORE_WEIGHTS, m = cond.attrMultipliers||{};
  const brand   = a.brandPower        * w.brandPower        * (m.brandPower        ||1);
  const cost    = a.costEfficiency    * w.costEfficiency    * (m.costEfficiency    ||1);
  const loyal   = a.customerLoyalty   * w.customerLoyalty   * (m.customerLoyalty   ||1);
  const elastic = (100-a.demandElasticity)*w.demandElasticity*(m.demandElasticity  ||1);
  const flex    = a.pricingFlexibility* w.pricingFlexibility* (m.pricingFlexibility||1);
  const channel = a.channelStrength   * w.channelStrength   * (m.channelStrength   ||1);
  const sf  = stratFitScore(co.strategy, a);
  const rawMkt  = cond.strategyBonuses[co.strategy] || 0;
  const rnd     = (Math.random()*6 - 3);
  const total   = Math.max(0, Math.min(120, brand+cost+loyal+elastic+flex+channel + sf*w.strategyFit + rawMkt*w.marketCondition + rnd));
  return { id, co, total:+total.toFixed(1), bd:{brand:+brand.toFixed(1),cost:+cost.toFixed(1),loyal:+loyal.toFixed(1),elastic:+elastic.toFixed(1),flex:+flex.toFixed(1),channel:+channel.toFixed(1),sFit:+(sf*w.strategyFit).toFixed(1),mkt:+(rawMkt*w.marketCondition).toFixed(1),rnd:+rnd.toFixed(1)}, rawMkt };
}

function buildExplanation(sA, sB, winner, loser, cond) {
  const wB = cond.strategyBonuses[winner.co.strategy]||0, lB = cond.strategyBonuses[loser.co.strategy]||0;
  const margin = Math.abs(sA.total - sB.total);
  let t = `<strong>${winner.co.name}</strong> advanced`;
  if (wB>=20) t += ` because its <em>${winner.co.strategy}</em> was an excellent match for <strong>${cond.name}</strong>.`;
  else if (wB>=8) t += `, leveraging <em>${winner.co.strategy}</em> during <strong>${cond.name}</strong>.`;
  else if (lB<=-15) t += ` as ${loser.co.name}'s <em>${loser.co.strategy}</em> faced a steep penalty under <strong>${cond.name}</strong>.`;
  else t += ` on core brand power, loyalty, and operational strength rather than market alignment alone.`;
  t += ` ${cond.description}`;
  if (lB<=-15) t += ` <strong>${loser.co.name}'s</strong> <em>${loser.co.strategy}</em> is usually effective but was structurally disadvantaged here.`;
  if (margin<3) t += ` <em>Extremely close — under different conditions the outcome may have been reversed.</em>`;
  return t;
}

// ================================================================
// BRACKET HELPERS
// ================================================================

function initBracket(order) {
  const rounds = [], r0 = [];
  for (let i=0;i<order.length;i+=2) r0.push({a:order[i],b:order[i+1],winner:null});
  rounds.push(r0);
  let prev=r0.length;
  while (prev>1) { const n=prev/2,r=[]; for(let i=0;i<n;i++) r.push({a:null,b:null,winner:null}); rounds.push(r); prev=n; }
  return rounds;
}
function curM() { return G.bracket[G.currentRound][G.currentMatchupIdx]; }
function advWinner(wId) {
  const r=G.currentRound,m=G.currentMatchupIdx;
  G.bracket[r][m].winner=wId;
  if (r<G.bracket.length-1) G.bracket[r+1][Math.floor(m/2)][m%2===0?'a':'b']=wId;
}
function moveNext() {
  const round=G.bracket[G.currentRound];
  if (G.currentMatchupIdx+1<round.length) { G.currentMatchupIdx++; }
  else if (G.currentRound<G.bracket.length-1) { G.currentRound++; G.currentMatchupIdx=0; }
  else { G.phase='champion'; return; }
  G.phase='matchup'; G.activeCondition=null; G.lastResult=null;
}

// ================================================================
// STATE SERIALIZATION
// Strategies hidden during matchup/voting; revealed during results/champion
// ================================================================

function safeCompany(id, hideStrategy) {
  const c = getCompany(id);
  const out = { id:c.id, name:c.name, emoji:c.emoji, tagline:c.tagline, attributes:c.attributes };
  if (!hideStrategy) { out.strategy=c.strategy; out.description=c.description; }
  return out;
}

function buildMatchupData(hideStrategy) {
  if (!G.bracket) return null;
  const m = curM();
  if (!m || !m.a || !m.b) return null;
  return { a: safeCompany(m.a, hideStrategy), b: safeCompany(m.b, hideStrategy), aId:m.a, bId:m.b };
}

function buildTeamVoteSummary() {
  // Returns { teamId: { a: count, b: count } }
  const summary = {};
  for (const t of G.teams) summary[t.id] = {a:0, b:0};
  for (const s of students.values()) {
    if (s.teamId && s.vote && summary[s.teamId]) summary[s.teamId][s.vote]++;
  }
  return summary;
}

function buildConnectedStudents() {
  return Array.from(students.values()).map(s => ({
    name: s.name || null, teamId: s.teamId || null, vote: s.vote || null
  }));
}

function serializeResult(result, studentWsId) {
  if (!result) return null;
  const m = result;
  const myStudent = studentWsId ? students.get(studentWsId) : null;
  const myVote = myStudent ? myStudent.vote : null;
  const myCorrect = myVote ? (myVote==='a'? m.sA.id===m.winner.id : m.sB.id===m.winner.id) : null;
  return {
    winner: { id:m.winner.id, name:m.winner.co.name, emoji:m.winner.co.emoji, total:m.winner.total, strategy:m.winner.co.strategy, description:m.winner.co.description },
    loser:  { id:m.loser.id,  name:m.loser.co.name,  emoji:m.loser.co.emoji,  total:m.loser.total,  strategy:m.loser.co.strategy,  description:m.loser.co.description  },
    sA: m.sA, sB: m.sB,
    condition: m.condition,
    explanation: m.explanation,
    teamVoteSummary: buildTeamVoteSummary(),
    myCorrect,
    teamResults: G.teams.map(t => {
      const tv = buildTeamVoteSummary()[t.id] || {a:0,b:0};
      const majority = tv.a>tv.b?'a':tv.b>tv.a?'b':null;
      const correct  = majority ? (majority==='a'? m.sA.id===m.winner.id : m.sB.id===m.winner.id) : null;
      return { teamId:t.id, name:t.name, color:t.color, points:t.points, majority, correct, votes:tv };
    })
  };
}

function stateForTeacher() {
  const hideStrategy = ['matchup','voting','simulating'].includes(G.phase);
  const matchupNum = G.bracket ? G.currentMatchupIdx+1 : 0;
  const matchupTotal = G.bracket ? G.bracket[G.currentRound].length : 0;
  return {
    type:'state', role:'teacher',
    phase: G.phase,
    teams: G.teams,
    bracket: G.bracket ? G.bracket.map(round => round.map(m => ({
      a:m.a ? safeCompany(m.a,false) : null,
      b:m.b ? safeCompany(m.b,false) : null,
      aId:m.a, bId:m.b, winner:m.winner
    }))) : null,
    currentRound: G.currentRound, currentMatchupIdx: G.currentMatchupIdx,
    matchup: buildMatchupData(hideStrategy),
    activeCondition: G.activeCondition,
    lastResult: serializeResult(G.lastResult, null),
    connectedStudents: buildConnectedStudents(),
    teamVoteSummary: buildTeamVoteSummary(),
    roundName: ROUND_NAMES[G.currentRound],
    roundLabel: ROUND_LABELS[G.currentRound],
    matchupNum, matchupTotal,
    totalStudents: students.size,
    votedCount: Array.from(students.values()).filter(s=>s.vote).length
  };
}

function stateForStudent(wsId) {
  const hideStrategy = ['matchup','voting','simulating'].includes(G.phase);
  const s = students.get(wsId);
  return {
    type:'state', role:'student',
    phase: G.phase,
    teams: G.teams,
    matchup: G.bracket ? buildMatchupData(hideStrategy) : null,
    activeCondition: G.phase==='voting'||G.phase==='simulating'||G.phase==='results' ? G.activeCondition : null,
    lastResult: serializeResult(G.lastResult, wsId),
    myVote: s ? s.vote : null,
    myName: s ? s.name : null,
    myTeamId: s ? s.teamId : null,
    roundName: ROUND_NAMES[G.currentRound],
    roundLabel: ROUND_LABELS[G.currentRound],
    matchupNum: G.bracket ? G.currentMatchupIdx+1 : 0,
    matchupTotal: G.bracket ? G.bracket[G.currentRound].length : 0,
    totalStudents: students.size,
    votedCount: Array.from(students.values()).filter(s2=>s2.vote).length
  };
}

// ================================================================
// BROADCAST
// ================================================================

function broadcast() {
  if (teacherWs && teacherWs.readyState === WebSocket.OPEN) {
    teacherWs.send(JSON.stringify(stateForTeacher()));
  }
  for (const [wsId, s] of students) {
    if (s.ws.readyState === WebSocket.OPEN) {
      s.ws.send(JSON.stringify(stateForStudent(wsId)));
    }
  }
}

// ================================================================
// GAME ACTIONS (called by teacher commands)
// ================================================================

function actionStartTournament() {
  G.bracket = initBracket(G.bracketOrder);
  G.currentRound=0; G.currentMatchupIdx=0;
  G.phase='matchup'; G.activeCondition=null; G.lastResult=null;
  // Clear all student votes
  for (const s of students.values()) s.vote = null;
  broadcast();
}

function actionOpenVoting() {
  G.activeCondition = MARKET_CONDITIONS[Math.floor(Math.random()*MARKET_CONDITIONS.length)];
  for (const s of students.values()) s.vote = null;
  G.phase='voting'; broadcast();
}

function actionRunSimulation() {
  if (!G.activeCondition) G.activeCondition = MARKET_CONDITIONS[Math.floor(Math.random()*MARKET_CONDITIONS.length)];
  const m = curM();
  const sA = calcScore(m.a, G.activeCondition);
  const sB = calcScore(m.b, G.activeCondition);
  const winner = sA.total>=sB.total?sA:sB, loser = sA.total>=sB.total?sB:sA;
  const result = { sA, sB, winner, loser, condition:G.activeCondition, explanation:buildExplanation(sA,sB,winner,loser,G.activeCondition) };
  G.lastResult = result;
  advWinner(winner.id);

  // Score teams: team gets +1 if majority of its students voted for the winner
  const tvs = buildTeamVoteSummary();
  G.teams.forEach(t => {
    const tv = tvs[t.id]||{a:0,b:0};
    if (tv.a===0 && tv.b===0) return; // no votes from this team
    t.totalVotes++;
    const majority = tv.a>tv.b?'a':tv.b>tv.a?'b':null;
    if (majority) {
      const majorityId = majority==='a'?m.a:m.b;
      if (majorityId===winner.id) { t.points++; t.correctVotes++; }
    }
  });

  G.phase='results';
  broadcast();
}

function actionNextMatchup() {
  moveNext();
  for (const s of students.values()) s.vote = null;
  broadcast();
}

function actionReset() {
  G = {
    phase:'lobby', teams:G.teams.map(t=>({...t,points:0,correctVotes:0,totalVotes:0})),
    bracket:null, bracketOrder:[...INITIAL_BRACKET_ORDER],
    currentRound:0, currentMatchupIdx:0, activeCondition:null, lastResult:null, companyOverrides:{}
  };
  for (const s of students.values()) s.vote = null;
  broadcast();
}

function actionShuffle() {
  const arr=[...INITIAL_BRACKET_ORDER];
  for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}
  G.bracketOrder=arr; broadcast();
}

// ================================================================
// HTTP SERVER — serves teacher.html and student.html
// ================================================================

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0].split('#')[0];
  if (url === '/' || url === '/teacher') {
    const file = path.join(__dirname, 'teacher.html');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    fs.createReadStream(file).pipe(res);
  } else if (url === '/student') {
    const file = path.join(__dirname, 'student.html');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    fs.createReadStream(file).pipe(res);
  } else {
    res.writeHead(404); res.end('Not found');
  }
});

// ================================================================
// WEBSOCKET SERVER
// ================================================================

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  const params = new URLSearchParams(req.url.includes('?') ? req.url.split('?')[1] : '');
  const role = params.get('role') || 'student';
  const wsId = Math.random().toString(36).slice(2,10);

  if (role === 'teacher') {
    teacherWs = ws;
    ws.send(JSON.stringify(stateForTeacher()));
  } else {
    // Register student with empty profile (they'll send 'join' to set name/team)
    students.set(wsId, { ws, name:null, teamId:null, vote:null });
    ws.send(JSON.stringify(stateForStudent(wsId)));
  }

  ws.on('message', raw => {
    try {
      const msg = JSON.parse(raw.toString());
      if (role === 'teacher') handleTeacher(msg);
      else handleStudent(wsId, msg);
    } catch(e) { /* ignore malformed */ }
  });

  ws.on('close', () => {
    if (role === 'student') {
      students.delete(wsId);
      broadcast();
    } else if (teacherWs===ws) {
      teacherWs=null;
    }
  });
});

function handleTeacher(msg) {
  switch(msg.type) {
    case 'action':
      switch(msg.action) {
        case 'start':      actionStartTournament(); break;
        case 'openVoting': actionOpenVoting();      break;
        case 'runSim':     actionRunSimulation();   break;
        case 'next':       actionNextMatchup();     break;
        case 'reset':      actionReset();           break;
        case 'shuffle':    actionShuffle();         break;
        case 'champion':   G.phase='champion'; broadcast(); break;
      }
      break;
    case 'updateTeams':
      G.teams = msg.teams; broadcast(); break;
    case 'updateCompany':
      G.companyOverrides[msg.id] = { strategy:msg.strategy, attributes:msg.attributes }; broadcast(); break;
  }
}

function handleStudent(wsId, msg) {
  const s = students.get(wsId);
  if (!s) return;
  switch(msg.type) {
    case 'join':
      s.name = (msg.name||'').trim().slice(0,30) || 'Student';
      s.teamId = msg.teamId || G.teams[0]?.id;
      s.vote = null;
      broadcast(); break;
    case 'vote':
      if (G.phase==='voting' && (msg.side==='a'||msg.side==='b')) {
        s.vote = msg.side;
        broadcast();
      }
      break;
  }
}

// ================================================================
// START
// ================================================================

server.listen(PORT, '0.0.0.0', () => {
  const line = '═'.repeat(52);
  console.log(`\n${line}`);
  console.log(`  MARCH MADNESS: PRICING STRATEGY SHOWDOWN`);
  console.log(line);
  console.log(`  ✅  Server running!\n`);
  console.log(`  🎓  TEACHER  →  http://${LOCAL_IP}:${PORT}/`);
  console.log(`  📱  STUDENTS →  http://${LOCAL_IP}:${PORT}/student\n`);
  console.log(`  Students connect over your classroom WiFi.`);
  console.log(`  Put the student URL on your projector!`);
  console.log(`${line}\n`);
});
