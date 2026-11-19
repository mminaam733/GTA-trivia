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

// Keep the complete, authoritative answer bank here. Replace/add entries to reach 45.
// Do not move answer or answerText fields into public assets.
const QUESTIONS = [
  { type:'MULTIPLE CHOICE', question:'Which fictional city is the setting of GTA: Vice City?', options:['Liberty City','Vice City','San Andreas','Carcer City'], answer:1 },
  { type:'MULTIPLE CHOICE', question:'Who is the protagonist of Vice City?', options:['Carl Johnson','Tommy Vercetti','Claude','Victor Vance'], answer:1 },
  { type:'MULTIPLE CHOICE', question:'Which decade defines Vice City’s neon-soaked story?', options:['1960s','1970s','1980s','1990s'], answer:2 },
  { type:'TRUE / FALSE', question:'Tommy Vercetti arrives in Vice City after serving time in prison.', options:['True','False'], answer:0 },
  { type:'TRUE / FALSE', question:'The Ocean View Hotel is one of Tommy’s early safehouses.', options:['True','False'], answer:0 },
  { type:'QNA', question:'Name the protagonist of GTA: Vice City.', answerText:'tommy vercetti' },
  { type:'QNA', question:'What is the name of Tommy’s lawyer?', answerText:'ken rosenberg' },
  { type:'CASE FILE', brief:'A deal at the docks goes bad. A trusted lawyer needs the boss to rebuild his reach across the city.', question:'Which character is Tommy’s lawyer and early business contact?', options:['Lance Vance','Ken Rosenberg','Sonny Forelli','Avery Carrington'], answer:1 },
  { type:'CASE FILE', brief:'A radio host keeps the city moving with synth, rock, and Miami Vice-era energy.', question:'Which station is hosted by Fernando Martinez?', options:['Flash FM','V-Rock','Wave 103','Radio Espantoso'], answer:0 },
  { type:'MULTIPLE CHOICE', question:'What is the name of Tommy’s associate who later turns against him?', options:['Lance Vance','Phil Cassidy','Umberto Robina','Steve Scott'], answer:0 },
  { type:'TRUE / FALSE', question:'The Malibu Club can become one of Tommy’s business assets.', options:['True','False'], answer:0 },
  { type:'MULTIPLE CHOICE', question:'Which station is known for its rock lineup and Lazlow’s hosting?', options:['V-Rock','K-Chat','Emotion 98.3','Fever 105'], answer:0 },
  { type:'QNA', question:'What is the surname of the Vance brothers?', answerText:'vance' },
  { type:'CASE FILE', brief:'A property deal opens a route into the city’s nightlife economy.', question:'Which club does Tommy acquire?', options:['The Rusty Anchor','Malibu Club','Pole Position','Hyman Memorial'], answer:1 },
  { type:'MULTIPLE CHOICE', question:'Which district is home to the Ocean View Hotel?', options:['Vice Point','Ocean Beach','Little Haiti','Downtown'], answer:1 },
  { type:'TRUE / FALSE', question:'GTA: Vice City features a full in-game radio dial.', options:['True','False'], answer:0 },
  { type:'MULTIPLE CHOICE', question:'Which character is a real estate developer Tommy works with?', options:['Avery Carrington','Kent Paul','Cam Jones','Pastor Richards'], answer:0 },
  { type:'QNA', question:'Name the lawyer who helps Tommy settle in Vice City.', answerText:'ken rosenberg' },
  { type:'CASE FILE', brief:'The city’s music scene ranges from new wave to classic rock.', question:'Which station features new wave and is presented by Adam First?', options:['Wave 103','V-Rock','Wildstyle','Flash FM'], answer:0 },
  { type:'MULTIPLE CHOICE', question:'What is the name of the Cuban gang leader?', options:['Ricardo Diaz','Umberto Robina','Auntie Poulet','Sonny Forelli'], answer:1 },
  { type:'TRUE / FALSE', question:'Ricardo Diaz becomes one of Tommy’s major enemies.', options:['True','False'], answer:0 },
  { type:'MULTIPLE CHOICE', question:'Which vehicle is a classic two-door sports car in Vice City?', options:['Banshee','Cheetah','Both of these','Neither'], answer:2 },
  { type:'QNA', question:'What is Tommy Vercetti’s first name?', answerText:'tommy' },
  { type:'CASE FILE', brief:'A rock station is recruiting loud personalities for a loud city.', question:'Who is the host of V-Rock?', options:['Lazlow','Fernando Martinez','Adam First','Lionel Makepeace'], answer:0 },
  { type:'MULTIPLE CHOICE', question:'Which island district is associated with the Vercetti Estate?', options:['Starfish Island','Prawn Island','Leaf Links','Washington Beach'], answer:0 },
  { type:'MULTIPLE CHOICE', question:'What is the name of the nightclub owned by Tommy?', options:['Malibu Club','Pole Position Club','Club Malibu','Ocean Club'], answer:0 },
  { type:'MULTIPLE CHOICE', question:'Which character owns the Print Works?', options:['Mitch Baker','Steve Scott','Tommy Vercetti','Phil Cassidy'], answer:2 },
  { type:'MULTIPLE CHOICE', question:'What is the name of the biker gang leader?', options:['Mitch Baker','Umberto Robina','Cam Jones','Hilary King'], answer:0 },
  { type:'MULTIPLE CHOICE', question:'Which station plays Latin music and is hosted by Pepe?', options:['Radio Espantoso','Wildstyle','Flash FM','K-Chat'], answer:0 },
  { type:'MULTIPLE CHOICE', question:'What is the name of the Haitian gang leader?', options:['Auntie Poulet','Mercedes Cortez','Candy Suxxx','Hilary King'], answer:0 },
  { type:'MULTIPLE CHOICE', question:'Which vehicle is used in the mission “Demolition Man”?', options:['RC Bandit','RC Goblin','RC Raider','RC Baron'], answer:1 },
  { type:'MULTIPLE CHOICE', question:'Who is the owner of the film studio on Prawn Island?', options:['Steve Scott','Sonny Forelli','Ken Rosenberg','Avery Carrington'], answer:0 },
  { type:'MULTIPLE CHOICE', question:'Which radio station features classic pop and hosted by Toni?', options:['Emotion 98.3','Wave 103','V-Rock','Flash FM'], answer:0 },
  { type:'MULTIPLE CHOICE', question:'What is the name of the Cuban gang’s leader?', options:['Umberto Robina','Ricardo Diaz','Mitch Baker','Auntie Poulet'], answer:0 },
  { type:'MULTIPLE CHOICE', question:'Which property is a car dealership?', options:['Sunshine Autos','Print Works','Cherry Popper','Boatyard'], answer:0 },
  { type:'MULTIPLE CHOICE', question:'Who is the owner of the Cherry Popper Ice Cream Factory?', options:['Auntie Poulet','Tommy Vercetti','Ken Rosenberg','Sonny Forelli'], answer:1 },
  { type:'MULTIPLE CHOICE', question:'Which character is a film director?', options:['Steve Scott','Kent Paul','Cam Jones','Hilary King'], answer:0 },
  { type:'MULTIPLE CHOICE', question:'What is the name of the city’s golf course?', options:['Leaf Links','Starfish Links','Vice Point Greens','Ocean Dunes'], answer:0 },
  { type:'MULTIPLE CHOICE', question:'Which station is hosted by Lionel Makepeace?', options:['K-Chat','Flash FM','V-Rock','Emotion 98.3'], answer:0 },
  { type:'MULTIPLE CHOICE', question:'What does Tommy acquire to help move goods across the water?', options:['Boatyard','Film Studio','Car Showroom','Nightclub'], answer:0 },
  { type:'TRUE / FALSE', question:'Vice City is inspired by Miami in the 1980s.', options:['True','False'], answer:0 },
  { type:'TRUE / FALSE', question:'Lance Vance is Tommy’s cousin.', options:['True','False'], answer:1 },
  { type:'TRUE / FALSE', question:'The Vercetti Estate is located on Starfish Island.', options:['True','False'], answer:0 },
  { type:'TRUE / FALSE', question:'Tommy meets Sonny Forelli during the opening deal.', options:['True','False'], answer:0 },
  { type:'TRUE / FALSE', question:'Prawn Island is home to the film studio.', options:['True','False'], answer:0 }
];
const rooms = new Map();
const sessions = new Map();
const DEFAULT_ROOM = 'OPEN';
rooms.set(DEFAULT_ROOM, { name:'Los Santos Brand Quest', durationMs:30*60*1000, maxFlags:3, accessCode:null, createdAt:Date.now() });
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'admin123';
const clean = s => String(s || '').trim().slice(0, 48);
const publicQuestion = q => { const { answer, answerText, ...safe } = q; return safe; };
const scoreResponses = responses => QUESTIONS.reduce((score,q,i) => {
  const value=responses[i];
  if(value===undefined || value===null || value==='') return score;
  if(q.answer!==undefined && Number(value)===q.answer) return score+1;
  if(q.answerText && typeof value==='string' && value.trim().toLowerCase().includes(q.answerText)) return score+1;
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
  const id = crypto.randomUUID();
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const session = {id,roomCode,playerName,ip,startTime:Date.now(),durationMs:room.durationMs,maxFlags:room.maxFlags,violations:0,violationLog:[],locked:false,lockReason:null,submitted:false,score:0,responses:{}};
  sessions.set(id,session);
  res.json({sessionId:id,durationMs:room.durationMs,maxFlags:room.maxFlags,roomName:room.name,questions:QUESTIONS.map(publicQuestion)});
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
  s.responses=sanitizeResponses(req.body.answers);
  s.score=scoreResponses(s.responses);
  res.json({ok:true});
});

app.post('/api/submit', (req,res) => {
  const s=getSession(req); if(!s) return res.status(404).json({error:'Session not found'});
  if(s.locked) return res.status(423).json({error:'Session disqualified',locked:true,violations:s.violations});
  if(s.submitted) return res.json({score:s.score,total:QUESTIONS.length,violations:s.violations});
  if(Date.now()>s.startTime+s.durationMs+10000) return res.status(408).json({error:'Time expired'});
  const answers=sanitizeResponses(req.body.answers);
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
