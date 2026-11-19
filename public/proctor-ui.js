(()=>{
  'use strict';
  const $=id=>document.getElementById(id);
  let passcode=sessionStorage.getItem('vcAdminPass')||'';
  let pollTimer=null,refreshing=false;
  const call=async(url,data)=>{
    const response=await fetch(url,{method:data?'POST':'GET',headers:{...(data?{'Content-Type':'application/json'}:{}),'x-admin-passcode':passcode},body:data?JSON.stringify(data):undefined});
    const body=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(body.error||`Request failed (${response.status})`);
    return body;
  };
  const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const formatTime=milliseconds=>{
    const seconds=Math.max(0,Math.ceil(milliseconds/1000));
    return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
  };
  const statusClass=status=>status==='SUBMITTED'?'submitted':status==='DISQUALIFIED'?'disqualified':status==='TIME EXPIRED'?'disqualified':'';

  function showDashboard(){
    $('login').classList.add('hidden');
    $('dashboard').classList.remove('hidden');
    $('logout').classList.remove('hidden');
    if(!pollTimer){refresh();pollTimer=setInterval(refresh,3000)}
  }
  function logout(){
    if(pollTimer)clearInterval(pollTimer);
    pollTimer=null;passcode='';sessionStorage.removeItem('vcAdminPass');
    $('dashboard').classList.add('hidden');$('logout').classList.add('hidden');$('login').classList.remove('hidden');
    $('passcode').value='';$('login-error').textContent='';
  }
  function rankRows(sessions){
    const sorted=[...sessions].sort((a,b)=>(b.score??0)-(a.score??0)||(b.answeredCount??0)-(a.answeredCount??0)||a.startTime-b.startTime);
    let lastScore=null,lastRank=0;
    return sorted.map((s,index)=>{
      const score=s.score??0;
      if(score!==lastScore){lastRank=index+1;lastScore=score}
      const total=window.proctorQuestionTotal||45;
      const answered=Math.min(total,s.answeredCount??0);
      const rankClass=lastRank===1?' first':'';
      const scoreClass=lastRank===1?' score-top':'';
      const state=`<span class="status-pill ${statusClass(s.status)}">${escapeHtml(s.status)}</span>`;
      return `<tr><td><span class="rank${rankClass}">#${lastRank}</span></td><td>${escapeHtml(s.playerName)}<span class="room-tag">${escapeHtml(s.roomName)} · ${escapeHtml(s.roomCode)}</span></td><td><span class="score-value${scoreClass}">${score} / ${total}</span></td><td>${answered} / ${total}<div class="progress-track"><i style="width:${Math.round(answered/total*100)}%"></i></div></td><td><span class="flag-count ${s.violations?'danger':''}">${s.violations} / ${s.maxFlags}</span></td><td>${state}</td></tr>`;
    }).join('');
  }
  function renderFlagHistory(session){
    const log=Array.isArray(session.violationLog)?session.violationLog:[];
    if(!log.length)return '<span class="score-empty">No flags</span>';
    const latest=log[log.length-1];
    const items=log.map(entry=>`<li>${new Date(entry.timestamp).toLocaleTimeString()} — ${escapeHtml(entry.reason)}</li>`).join('');
    return `<details class="flag-details"><summary>${log.length} flag${log.length===1?'':'s'} · ${escapeHtml(latest.reason)}</summary><ul>${items}</ul></details>`;
  }
  function renderSessions(sessions,now){
    if(!sessions.length)return '<tr><td colspan="5">No participants yet. Share a room link to get started.</td></tr>';
    return sessions.slice().sort((a,b)=>b.startTime-a.startTime).map(s=>{
      const remain=Math.max(0,s.startTime+s.durationMs-now);
      const time=s.status==='IN PROGRESS'?formatTime(remain):'—';
      const action=s.status==='IN PROGRESS'?`<button class="kick" type="button" data-lock="${escapeHtml(s.sessionId)}">FORCE LOCK</button>`:'—';
      const ip=s.ip?`<small>${escapeHtml(s.ip)}</small>`:'';
      return `<tr><td>${escapeHtml(s.playerName)}${ip}<small>${escapeHtml(s.sessionId.slice(0,8))}</small></td><td>${time}</td><td>${renderFlagHistory(s)}</td><td><span class="status-pill ${statusClass(s.status)}">${escapeHtml(s.status)}</span></td><td>${action}</td></tr>`;
    }).join('');
  }
  async function forceLock(sessionId){
    if(!confirm('Force-lock this participant? They will be disqualified immediately.'))return;
    try{await call('/api/admin/lock',{sessionId});await refresh()}catch(error){alert(error.message)}
  }
  async function refresh(){
    if(refreshing||!passcode)return;
    refreshing=true;
    try{
      const data=await call('/api/admin/sessions');
      const sessions=Array.isArray(data.sessions)?data.sessions:[];
      window.proctorQuestionTotal=data.totalQuestions||45;
      const counts=sessions.reduce((acc,s)=>{acc.total++;if(s.status==='IN PROGRESS')acc.active++;else if(s.status==='SUBMITTED')acc.submitted++;else if(s.status==='DISQUALIFIED')acc.locked++;else if(s.status==='TIME EXPIRED')acc.expired++;return acc},{total:0,active:0,submitted:0,locked:0,expired:0});
      $('stat-total').textContent=counts.total;$('stat-active').textContent=counts.active;$('stat-submitted').textContent=counts.submitted;$('stat-locked').textContent=counts.locked;$('stat-expired').textContent=counts.expired;
      $('leaderboard').innerHTML=sessions.length?rankRows(sessions):'<tr><td colspan="6">No participants yet. Scores appear when answers are saved.</td></tr>';
      $('session-rows').innerHTML=renderSessions(sessions,data.now||Date.now());
      $('session-rows').querySelectorAll('[data-lock]').forEach(button=>button.addEventListener('click',()=>forceLock(button.dataset.lock)));
      $('connection').textContent=`LIVE · ${new Date(data.now||Date.now()).toLocaleTimeString()}`;$('connection').className='badge';
    }catch(error){
      $('connection').textContent='OFFLINE';$('connection').className='badge offline';
      if(error.message==='Organizer passcode required')logout();
    }finally{refreshing=false}
  }
  async function createRoom(event){
    event.preventDefault();$('room-error').textContent='';
    const submit=$('room-form').querySelector('button[type="submit"]');submit.disabled=true;
    try{
      const room=await call('/api/rooms',{name:$('room-name').value,durationMinutes:Number($('duration').value),maxFlags:Number($('max-flags').value),accessCode:$('room-code').value});
      const url=room.participantUrl||new URL(`/?room=${encodeURIComponent(room.roomCode)}`,location.origin).href;
      $('share-url').value=url;$('room-created').textContent=`${room.name} · ROOM ${room.roomCode}`;$('share').classList.remove('hidden');
      $('qrcode').replaceChildren();
      if(window.QRCode){try{$('qrcode').append(await QRCode.toCanvas(url,{width:150,margin:1,color:{dark:'#130720',light:'#ffffff'}}))}catch{$('qrcode').textContent='QR unavailable — copy the participant link above.'}}
      else $('qrcode').textContent='QR library unavailable — copy the participant link above.';
      await refresh();
    }catch(error){$('room-error').textContent=error.message}
    finally{submit.disabled=false}
  }
  async function copyLink(){
    const input=$('share-url');
    try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(input.value);else{input.focus();input.select();if(!document.execCommand('copy'))throw new Error('Copy was blocked. Select and copy the link manually.')}}
    catch(error){$('room-error').textContent=error.message;return}
    const button=$('copy');button.textContent='COPIED';setTimeout(()=>button.textContent='COPY',1400);
  }
  $('login-form').addEventListener('submit',async event=>{
    event.preventDefault();$('login-error').textContent='';
    const attempted=$('passcode').value;
    try{await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({passcode:attempted})}).then(async response=>{const body=await response.json().catch(()=>({}));if(!response.ok)throw new Error(body.error||'Login failed')});passcode=attempted;sessionStorage.setItem('vcAdminPass',passcode);$('passcode').value='';showDashboard()}
    catch(error){$('login-error').textContent=error.message}
  });
  $('room-form').addEventListener('submit',createRoom);
  $('copy').addEventListener('click',copyLink);
  $('logout').addEventListener('click',logout);
  if(passcode){call('/api/admin/sessions').then(showDashboard).catch(()=>{sessionStorage.removeItem('vcAdminPass');passcode='';$('login-error').textContent='Saved passcode expired. Sign in again.'})}
})();
