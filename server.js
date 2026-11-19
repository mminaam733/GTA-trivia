const express = require('express');
const crypto = require('crypto');
const path = require('path');

const app = express();
app.disable('x-powered-by');
// Render/Railway terminate HTTPS at a trusted reverse proxy. Honor the original
// protocol so generated participant URLs point to the public HTTPS address.
app.set('trust proxy', 1);
app.use(express.json({ limit: '32kb' }));
app.get('/proctor.html',(_req,res)=>res.sendFile(path.join(__dirname,'public','proctor-ui.html')));
app.use(express.static(path.join(__dirname, 'public')));

// Complete bank from Trivia questions.pdf. Bolded answers were used as the key,
// with the math errors in questions 2 and 24 corrected and question 9 clarified.
// Never expose answer, answerText, or answerAliases in public question responses.
const QUESTIONS = [
  { type:'MULTIPLE CHOICE', question:"You've purchased a CEO Office and a Supercar in Los Santos. Which business model would generate revenue using both assets most effectively?", options:['Automobile manufacturing','Luxury car rentals and executive transportation','Food processing','Pharmaceutical distribution'], answer:1 },
  { type:'MULTIPLE CHOICE', question:"Your crew invests $500,000 in a nightclub. It generates $100,000 in revenue every round, with operating expenses of $40,000 per round. How many rounds will it take to recover your initial investment?", options:['5 rounds','6 rounds','9 rounds','10 rounds'], answer:2 },
  { type:'MULTIPLE CHOICE', question:"Your team receives 50 million to invest in different businesses across Vice City. You are considering investing in a hotel, car dealership, restaurant and technology startup to generate long-term returns while reducing financial risk. Which investment strategy would be most suitable for your team?", options:['Liquidation','Diversification','Monopoly','Outsourcing'], answer:1 },
  { type:'MULTIPLE CHOICE', question:"Three organisations bid for an exclusive business contract worth $1 million. The contract requires an investment of $700,000 and operational costs of $100,000. Which organisation has the best potential profit if the contract is awarded to the highest bidder?", options:['Team A bids $950,000','Team B bids $850,000','Team C bids $750,000','All teams earn the same profit'], answer:0 },
  { type:'MULTIPLE CHOICE', question:"A game studio gives its app free but charges for premium features. This model is:", options:['Franchising','Barter','Freemium','Licensing'], answer:2 },
  { type:'MULTIPLE CHOICE', question:"Your company has two investment opportunities. Investment A offers a 20% expected return with high risk. Investment B offers a 12% expected return with significantly lower risk. Your organisation cannot afford major financial losses. Which decision is most sensible?", options:['Always choose Investment A because returns are higher.','Choose Investment B after evaluating risk-adjusted returns.','Invest all capital in both without analysis.','Avoid investing in either opportunity.'], answer:1 },
  { type:'MULTIPLE CHOICE', question:"Your yacht-rental demand peaks in summer and dips in monsoon. This pattern is:", options:['Inflation','Arbitrage','Liquidation','Seasonality'], answer:3 },
  { type:'MULTIPLE CHOICE', question:"When an investor purchases shares through an IPO, who receives the money in a fresh issue?", options:['Existing shareholders selling their shares','The company issuing the new shares','The stock exchange','The stockbroker'], answer:1 },
  { type:'MULTIPLE CHOICE', question:"What does a company mean when it announces a 1:2 stock split?", options:['Each existing share becomes three shares.','Every two existing shares are converted into one share.','Each existing share becomes two shares: one additional share for each share held.','The company doubles its market capitalization.'], answer:2 },
  { type:'MULTIPLE CHOICE', question:"The specific group of customers a business aims to serve is its:", options:['Supplier base','Target market','Competition','Shareholders'], answer:1 },
  { type:'MULTIPLE CHOICE', question:'Which is the most liquid asset?', options:['Cash','Casino building','Yacht','Land'], answer:0 },
  { type:'MULTIPLE CHOICE', question:'One company controls all helicopter taxis in the city. This is a:', options:['Oligopoly','Monopoly','Duopoly','Perfect competition'], answer:1 },
  { type:'MULTIPLE CHOICE', question:'Your casino generates high revenue, but customer retention is declining and competitors are gaining market share. Which metric would best help you understand whether customers continue to choose your casino?', options:['Employee Attendance','Customer Retention Rate','Office Maintenance Cost','Number of Company Vehicles'], answer:1 },
  { type:'MULTIPLE CHOICE', question:'A company reports increasing revenue but decreasing profits. What could be the most likely reason?', options:['Its sales volume has increased','Its customer base has expanded','Its market share has increased','Its operating expenses have increased faster than revenue'], answer:3 },
  { type:'MULTIPLE CHOICE', question:'A team member discovers confidential information that a competitor is about to launch a new luxury vehicle. Your organisation uses this information to prepare its marketing strategy before the launch. What business function is primarily involved?', options:['Market Intelligence','Human Resource Management','Inventory Management','Financial Auditing'], answer:0 },
  { type:'MULTIPLE CHOICE', question:'Your organisation owns a casino, a luxury hotel, a car dealership and a nightclub. Although each business operates independently, you bring them under one recognisable corporate identity to build trust and reputation across multiple industries. Which strategy best describes this approach?', options:['Brand Portfolio Strategy','Cost Leadership','Market Segmentation','Product Differentiation'], answer:0 },
  { type:'MULTIPLE CHOICE', question:'A sudden economic recession hits Los Santos. Customers cut luxury spending, hotel bookings decline, and your nightclub has fewer visitors. Your organisation also has outstanding loans and high operating expenses. What is the most sustainable business decision?', options:['Expand aggressively by taking additional loans.','Maintain all existing expenses and avoid changing the business model.','Reassess operating costs, preserve cash reserves, identify essential revenue streams and adapt services to customer demand.','Immediately sell every business asset without evaluating its long-term value.'], answer:2 },
  { type:'MULTIPLE CHOICE', question:'A company announces excellent quarterly results, but its stock price falls immediately afterwards. What is a possible explanation?', options:['The stock exchange rejected its results.','The company automatically became unprofitable.','Its outstanding shares disappeared.','Investors expected even better results.'], answer:3 },
  { type:'MULTIPLE CHOICE', question:'Which business model generates revenue by charging customers at regular intervals?', options:['Franchise model','Brokerage model','Subscription model','Licensing model'], answer:2 },
  { type:'MULTIPLE CHOICE', question:'A company selling shares to the public for the first time is an:', options:['EMI','MOU','NPA','IPO'], answer:3 },
  { type:'MULTIPLE CHOICE', question:'Letting others run outlets under your brand and system for a fee is:', options:['Merger','Outsourcing','Franchising','Liquidation'], answer:2 },
  { type:'MULTIPLE CHOICE', question:'What happens to the ownership percentage of existing shareholders when a company issues new shares, assuming they do not purchase additional shares?', options:['It automatically decreases','It automatically increases','It remains unchanged','It becomes zero'], answer:0 },
  { type:'MULTIPLE CHOICE', question:'You own a popular nightclub in Vice City. Revenue rises by 30%, but profits fall because salaries, electricity bills and maintenance costs rise significantly. What is the most likely reason?', options:['Increased operating expenses','Increased customer demand','Improved brand recognition','Increased market share'], answer:0 },
  { type:'MULTIPLE CHOICE', question:"Your organisation has $2 million in cash, $5 million in properties, $1 million in vehicles, $3 million in outstanding loans, and $1 million in other liabilities. What is its net worth?", options:['$4 million','$5 million','$6 million','$8 million'], answer:0 },
  { type:'MULTIPLE CHOICE', question:'Your nightclub generates $200,000 in monthly revenue. Operating expenses are 40% of revenue, and monthly loan instalments are $30,000. What is the remaining monthly cash flow after these expenses?', options:['$90,000','$120,000','$140,000','$170,000'], answer:0 },

  { type:'TRUE / FALSE', question:'A company can increase its profits even if its total revenue remains unchanged by reducing its expenses.', options:['True','False'], answer:0 },
  { type:'TRUE / FALSE', question:'When demand for a product increases and supply remains constant, its price generally tends to rise.', options:['True','False'], answer:0 },
  { type:'TRUE / FALSE', question:'A monopoly exists when many companies compete to sell the same product.', options:['True','False'], answer:1 },
  { type:'TRUE / FALSE', question:'Buying shares of a company makes you a partial owner of that company.', options:['True','False'], answer:0 },
  { type:'TRUE / FALSE', question:'A business operating at a loss necessarily has zero revenue.', options:['True','False'], answer:1 },
  { type:'TRUE / FALSE', question:"Franchising allows a business to expand using another company's established brand and business model.", options:['True','False'], answer:0 },
  { type:'TRUE / FALSE', question:'Inflation increases the purchasing power of money.', options:['True','False'], answer:1 },
  { type:'TRUE / FALSE', question:"A company's market share represents its percentage of total sales within a particular market.", options:['True','False'], answer:0 },
  { type:'TRUE / FALSE', question:'Offering discounts always guarantees an increase in overall profit.', options:['True','False'], answer:1 },
  { type:'TRUE / FALSE', question:'Diversification helps businesses reduce their dependence on a single source of income.', options:['True','False'], answer:0 },

  { type:'QNA', question:'What is the term for money borrowed by a company that must be repaid with interest?', answerText:'debt' },
  { type:'QNA', question:'What do we call the process of transferring government-owned businesses to private ownership?', answerText:'privatisation', answerAliases:['privatization'] },
  { type:'QNA', question:"Which financial term describes a business's ability to meet its short-term financial obligations?", answerText:'liquidity' },
  { type:'QNA', question:'What is the term for a market dominated by a small number of major companies?', answerText:'oligopoly' },
  { type:'QNA', question:'What is the additional value customers associate with a well-known brand compared to a generic alternative?', answerText:'brand premium' }
];
const rooms = new Map();
const sessions = new Map();
const DEFAULT_ROOM = 'OPEN';
rooms.set(DEFAULT_ROOM, { name:'Los Santos Brand Quest', durationMs:30*60*1000, maxFlags:3, accessCode:null, createdAt:Date.now() });
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'admin123';
const clean = s => String(s || '').trim().slice(0, 48);
const playerKey = s => clean(s).toLowerCase().replace(/\s+/g,' ');
const publicQuestion = q => { const { answer, answerText, answerAliases, ...safe } = q; return safe; };
const startPayload = (s,resumed=false) => ({ sessionId:s.id,durationMs:s.durationMs,maxFlags:s.maxFlags,roomName:rooms.get(s.roomCode)?.name||'Trivia Event',questions:QUESTIONS.map(publicQuestion),answers:s.responses||{},currentQuestion:s.currentQuestion||0,resumed });
const scoreResponses = responses => QUESTIONS.reduce((score,q,i) => {
  const value=responses[i];
  if(value===undefined || value===null || value==='') return score;
  if(q.answer!==undefined && Number(value)===q.answer) return score+1;
  if(q.answerText && typeof value==='string' && [q.answerText,...(q.answerAliases||[])].some(keyword=>value.trim().toLowerCase().includes(keyword))) return score+1;
  return score;
},0);
const sanitizeResponses = value => {
  const source=value && typeof value==='object' && !Array.isArray(value) ? value : {};
  const cleanAnswers={};
  QUESTIONS.forEach((q,i)=>{
    const answer=source[i];
    if(q.answer!==undefined && (typeof answer==='number' || typeof answer==='string') && String(answer).trim()!=='' && Number.isInteger(Number(answer)) && Number(answer)>=0 && Number(answer)<q.options.length) cleanAnswers[i]=Number(answer);
    else if(q.answerText && typeof answer==='string' && answer.trim()) cleanAnswers[i]=answer.trim().slice(0,160);
  });
  return cleanAnswers;
};
const mergeResponses = (previous,value) => {
  const source=value && typeof value==='object' && !Array.isArray(value) ? value : {};
  const cleanAnswers=sanitizeResponses(source);
  const merged={...(previous||{})};
  QUESTIONS.forEach((_,i)=>{
    if(Object.prototype.hasOwnProperty.call(source,i)){
      if(Object.prototype.hasOwnProperty.call(cleanAnswers,i))merged[i]=cleanAnswers[i];
      else delete merged[i];
    }
  });
  return merged;
};
const sessionPublic = s => ({ sessionId:s.id, playerName:s.playerName, ip:s.ip, roomCode:s.roomCode, roomName:rooms.get(s.roomCode)?.name || 'Unknown room', startTime:s.startTime, durationMs:s.durationMs, violations:s.violations, maxFlags:s.maxFlags, violationLog:s.violationLog, answeredCount:Object.keys(s.responses || {}).length, status:s.locked?'DISQUALIFIED':s.submitted?'SUBMITTED':Date.now()>s.startTime+s.durationMs+10000?'TIME EXPIRED':'IN PROGRESS', score:s.score, reason:s.lockReason || null });
const getSession = req => sessions.get(String(req.body.sessionId || req.query.sessionId || ''));
const admin = (req,res,next) => {
  const token = req.get('x-admin-passcode') || req.query.passcode;
  if (token !== ADMIN_PASSCODE) return res.status(401).json({ error:'Organizer passcode required' });
  next();
};

app.post('/api/rooms', admin, (req,res) => {
  const name = clean(req.body.name) || 'Trivia Event';
  const duration = Number(req.body.durationMinutes);
  const maxFlags = Number(req.body.maxFlags);
  if (!Number.isFinite(duration) || duration < 1 || duration > 240) return res.status(400).json({error:'Duration must be between 1 and 240 minutes'});
  if (!Number.isInteger(maxFlags) || maxFlags < 1 || maxFlags > 20) return res.status(400).json({error:'Max flags must be between 1 and 20'});
  const roomCode = crypto.randomBytes(4).toString('hex').toUpperCase();
  rooms.set(roomCode,{name,durationMs:duration*60000,maxFlags,accessCode:clean(req.body.accessCode)||null,createdAt:Date.now()});
  res.json({roomCode,name,participantUrl:`${req.protocol}://${req.get('host')}/?room=${roomCode}`});
});

app.post('/api/start', (req,res) => {
  const playerName = clean(req.body.playerName);
  const roomCode = String(req.body.roomCode || DEFAULT_ROOM).toUpperCase();
  const room = rooms.get(roomCode);
  if (!playerName) return res.status(400).json({error:'Enter a nickname'});
  if (!room) return res.status(404).json({error:'Room not found'});
  if (room.accessCode && String(req.body.accessCode || '') !== room.accessCode) return res.status(403).json({error:'Incorrect room access code'});
  const normalizedName=playerKey(playerName);
  const samePlayerSessions=[...sessions.values()].filter(s=>s.roomCode===roomCode&&s.playerKey===normalizedName);
  const savedSession=samePlayerSessions.find(s=>s.id===String(req.body.resumeSessionId||''));
  const existing=savedSession||samePlayerSessions.sort((a,b)=>{
    const now=Date.now();
    const priority=s=>s.locked||s.submitted||now>s.startTime+s.durationMs+10000?1:0;
    return priority(a)-priority(b)||(Object.keys(b.responses||{}).length-Object.keys(a.responses||{}).length)||(b.score||0)-(a.score||0)||a.startTime-b.startTime;
  })[0];
  if(existing){
    if(String(req.body.resumeSessionId||'')!==existing.id)return res.status(409).json({error:'A session already uses this nickname in this room. Resume it in the same browser or choose another nickname.'});
    if(existing.locked)return res.status(423).json({error:'This session is disqualified'});
    if(existing.submitted)return res.status(409).json({error:'This session has already been submitted'});
    if(Date.now()>existing.startTime+existing.durationMs+10000)return res.status(408).json({error:'This session has expired'});
    existing.playerName=playerName;
    return res.json(startPayload(existing,true));
  }
  const id = crypto.randomUUID();
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const session = {id,roomCode,playerName,playerKey:normalizedName,ip,startTime:Date.now(),durationMs:room.durationMs,maxFlags:room.maxFlags,violations:0,violationLog:[],locked:false,lockReason:null,submitted:false,score:0,responses:{},currentQuestion:0};
  sessions.set(id,session);
  res.json(startPayload(session));
});

app.post('/api/violation', (req,res) => {
  const s=getSession(req); if(!s) return res.status(404).json({error:'Session not found'});
  if(s.locked || s.submitted) return res.json({locked:s.locked,violations:s.violations,maxFlags:s.maxFlags});
  const reason=clean(req.body.reason)||'Proctoring violation';
  s.violations++; s.violationLog.push({timestamp:Date.now(),reason});
  if(s.violations>=s.maxFlags){s.locked=true;s.lockReason=reason;}
  res.json({locked:s.locked,violations:s.violations,maxFlags:s.maxFlags});
});

// Progress is stored and scored only on the server. The answer key is never returned.
app.post('/api/progress', (req,res) => {
  const s=getSession(req); if(!s) return res.status(404).json({error:'Session not found'});
  if(s.locked) return res.status(423).json({error:'Session disqualified',locked:true});
  if(s.submitted) return res.status(409).json({error:'Session already submitted'});
  if(Date.now()>s.startTime+s.durationMs+10000) return res.status(408).json({error:'Time expired'});
  s.responses=mergeResponses(s.responses,req.body.answers);
  s.score=scoreResponses(s.responses);
  const currentQuestion=Number(req.body.currentQuestion);
  if(Number.isInteger(currentQuestion))s.currentQuestion=Math.max(0,Math.min(QUESTIONS.length-1,currentQuestion));
  res.json({ok:true});
});

app.post('/api/submit', (req,res) => {
  const s=getSession(req); if(!s) return res.status(404).json({error:'Session not found'});
  if(s.locked) return res.status(423).json({error:'Session disqualified',locked:true,violations:s.violations});
  if(s.submitted) return res.json({score:s.score,total:QUESTIONS.length,violations:s.violations});
  if(Date.now()>s.startTime+s.durationMs+10000) return res.status(408).json({error:'Time expired'});
  const answers=mergeResponses(s.responses,req.body.answers);
  const score=scoreResponses(answers);
  s.submitted=true;s.score=score;s.responses=answers;
  res.json({score,total:QUESTIONS.length,violations:s.violations,playerName:s.playerName});
});

app.get('/api/time/:id', (req,res)=>{const s=sessions.get(req.params.id);if(!s)return res.status(404).json({error:'Session not found'});res.json({serverNow:Date.now(),startTime:s.startTime,durationMs:s.durationMs,remainingMs:Math.max(0,s.startTime+s.durationMs-Date.now()),violations:s.violations,maxFlags:s.maxFlags,locked:s.locked,submitted:s.submitted});});
app.post('/api/admin/login',(req,res)=>{if(String(req.body.passcode||'')!==ADMIN_PASSCODE)return res.status(401).json({error:'Incorrect passcode'});res.json({ok:true});});
app.get('/api/admin/sessions',admin,(req,res)=>res.json({sessions:[...sessions.values()].map(sessionPublic),totalQuestions:QUESTIONS.length,now:Date.now()}));
app.post('/api/admin/lock',admin,(req,res)=>{const s=sessions.get(String(req.body.sessionId||''));if(!s)return res.status(404).json({error:'Session not found'});if(s.submitted)return res.status(409).json({error:'Submitted sessions cannot be force-locked'});if(s.locked)return res.json({ok:true});s.locked=true;s.lockReason='Organizer force lock';s.violations=Math.max(s.violations,s.maxFlags);s.violationLog.push({timestamp:Date.now(),reason:s.lockReason});res.json({ok:true});});

app.get('/proctor',(_req,res)=>res.sendFile(path.join(__dirname,'public','proctor-ui.html')));
app.get('/health',(_req,res)=>res.json({ok:true}));
const port=Number(process.env.PORT)||3000;
app.listen(port,'0.0.0.0',()=>console.log(`Vice City Trivia listening on ${port}`));
