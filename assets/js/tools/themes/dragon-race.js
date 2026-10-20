(function(){
    const RACERS=[{icon:'🐉',name:'Crimson',seed:13},{icon:'🦄',name:'Starlight',seed:35},{icon:'🦅',name:'Skytalon',seed:57},{icon:'🔥',name:'Ember',seed:79}];
    const commentMsgs=(name,icon)=>[icon+' '+name+' breathes fire and surges ahead!','🐉 '+name+' soars to the front!',icon+' '+name+' dominates the skies!'];
    let totalDuration=60,remaining=60,isRunning=false,animId=null,lastTs=null,raceFinished=false;
    let states=RACERS.map(r=>({pos:0,seed:r.seed+Math.random()*30,isTurbo:false}));
    let lastLeader=-1,commentCooldown=0;
    const display=document.getElementById('race-display'),commentary=document.getElementById('race-commentary'),track=document.getElementById('race-track'),podium=document.getElementById('podium'),podiumGrid=document.getElementById('podium-grid'),podiumTitle=document.getElementById('podium-title'),btnStart=document.getElementById('btn-start'),btnReset=document.getElementById('btn-reset'),btnAgain=document.getElementById('btn-race-again');
    const racers=RACERS.map((r,i)=>({icon:r.icon,name:r.name,box:document.getElementById('racer-'+i),label:document.getElementById('racer-label-'+i)}));
    function fmt(s){const m=Math.floor(s/60),sec=Math.floor(s%60);return String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0');}
    function setComm(msg){if(commentary)commentary.textContent=msg;}
    function renderPositions(){const tw=track.clientWidth||800,avail=Math.max(100,tw-58-52);states.forEach((st,i)=>{const px=Math.min(avail+30,st.pos*avail);if(racers[i].box){racers[i].box.style.transform='translateX('+px+'px)';if(isRunning){racers[i].box.classList.add('is-running');if(st.isTurbo)racers[i].box.classList.add('is-turbo');else racers[i].box.classList.remove('is-turbo');}else racers[i].box.classList.remove('is-running','is-turbo');}});}
    function animLoop(ts){if(!isRunning)return;if(!lastTs)lastTs=ts;const dt=Math.min(0.1,(ts-lastTs)/1000);lastTs=ts;remaining=Math.max(0,remaining-dt);display.textContent=fmt(Math.ceil(remaining));const prog=Math.min(1,Math.max(0,1-(remaining/totalDuration)));states.forEach((st,i)=>{const wave=Math.sin(prog*Math.PI*4+st.seed*0.05)*0.045+Math.sin(prog*Math.PI*8+st.seed)*0.025;st.isTurbo=wave>0.04&&isRunning;if(prog<0.9)st.pos=Math.max(0,Math.min(0.88,prog+wave*0.7));else{const sr=(prog-0.9)/0.1;st.pos=Math.min(1.06,0.88+sr*(0.12+((st.seed%10)-4.5)*0.008));}});let leader=0,maxP=-1;states.forEach((st,i)=>{if(st.pos>maxP){maxP=st.pos;leader=i;}});commentCooldown-=dt;if(leader!==lastLeader&&commentCooldown<=0&&prog<0.9){lastLeader=leader;commentCooldown=3;const msgs=commentMsgs(racers[leader].name,racers[leader].icon);setComm(msgs[Math.floor(Math.random()*msgs.length)]);}else if(prog>=0.9&&commentCooldown<=0){commentCooldown=999;setComm('🔥 FINAL BREATH! Dragons converge on the finish — who claims glory?!');}renderPositions();if(remaining<=0){finishRace();return;}animId=requestAnimationFrame(animLoop);}
    function start(){if(isRunning)return;if(raceFinished||remaining<=0)reset();isRunning=true;raceFinished=false;lastTs=null;if(podium)podium.style.display='none';btnStart.innerHTML='<span>Pause</span>';btnStart.classList.add('is-running');if(window.SoundFX)window.SoundFX.playClick();setComm('🐉 DRAGONS AWAY! The fantasy race has begun!');animId=requestAnimationFrame(animLoop);}
    function pause(){isRunning=false;if(animId){cancelAnimationFrame(animId);animId=null;}btnStart.classList.remove('is-running');btnStart.innerHTML='<span>Resume</span>';renderPositions();if(window.SoundFX)window.SoundFX.playClick();setComm('⏸️ Race paused. Click Resume to continue.');}
    function reset(){isRunning=false;raceFinished=false;if(animId){cancelAnimationFrame(animId);animId=null;}lastTs=null;remaining=totalDuration;display.textContent=fmt(remaining);lastLeader=-1;commentCooldown=0;states=RACERS.map(r=>({pos:0,seed:r.seed+Math.random()*30,isTurbo:false}));renderPositions();btnStart.classList.remove('is-running');btnStart.innerHTML='<span>Start Race</span>';if(podium)podium.style.display='none';setComm('🐉 Dragons assembled! Press Start Race to begin the epic race.');}
    function finishRace(){isRunning=false;raceFinished=true;if(animId){cancelAnimationFrame(animId);animId=null;}display.textContent=fmt(0);renderPositions();btnStart.classList.remove('is-running');btnStart.innerHTML='<span>Start Race</span>';const ranking=states.map((st,i)=>({i,pos:st.pos})).sort((a,b)=>b.pos-a.pos);const winner=racers[ranking[0].i];setComm('🏆 '+winner.icon+' '+winner.name+' WINS THE DRAGON RACE!');if(window.SoundFX)window.SoundFX.playFanfare();if(window.Confetti)window.Confetti.fire({count:200,colors:['#dc2626','#f59e0b','#7c3aed','#0369a1']});if(podiumTitle)podiumTitle.textContent='🏆 '+winner.icon+' '+winner.name+' Claims Glory!';const medals=['🥇 1st','🥈 2nd','🥉 3rd','🎖️ 4th'];if(podiumGrid)podiumGrid.innerHTML=ranking.map((r,rank)=>`<div class="podium-item ${rank===0?'winner':''}"><div style="font-size:2rem;">${racers[r.i].icon}</div><strong style="font-size:0.95rem;color:#fed7aa;">${racers[r.i].name}</strong><span style="font-size:0.75rem;color:#fb923c;">${medals[rank]}</span></div>`).join('');if(podium)podium.style.display='block';}
    
    function parseRaceDuration(val) {
      if (!val) return null;
      let s = 0;
      const str = String(val).trim().toLowerCase();
      const mMatch = str.match(/(\d+)\s*(?:m|min|minute)/);
      const sMatch = str.match(/(\d+)\s*(?:s|sec|second)/);
      if (mMatch || sMatch) {
        if (mMatch) s += parseInt(mMatch[1], 10) * 60;
        if (sMatch) s += parseInt(sMatch[1], 10);
      } else if (str.includes(':')) {
        const p = str.split(':').map(Number);
        s = (p[0] || 0) * 60 + (p[1] || 0);
      } else {
        const n = parseInt(str, 10);
        if (!isNaN(n)) {
          s = (n <= 10) ? n * 60 : n;
        }
      }
      return (!isNaN(s) && s >= 5 && s <= 3600) ? s : null;
    }

    async function promptCustomRaceTime() {
      if (isRunning) pause();
      const curM = Math.floor(totalDuration / 60);
      const curS = totalDuration % 60;
      const defVal = curM > 0 ? (curS > 0 ? `${curM}m ${curS}s` : `${curM}m`) : `${curS}s`;
      let res = null;
      if (window.ClassPanel && window.ClassPanel.prompt) {
        res = await window.ClassPanel.prompt({
          title: 'Set Dragon Race Duration',
          label: 'Enter duration (e.g. "45s", "2m", "1m 30s", "90", or MM:SS):',
          defaultValue: defVal,
          placeholder: 'e.g. 2m or 45s',
          confirmText: 'Set Time'
        });
      } else {
        res = window.prompt('Enter race duration (e.g. 2m, 45s, 90, or 01:30):', defVal);
      }
      if (res != null) {
        const s = parseRaceDuration(res);
        if (s !== null) {
          totalDuration = s;
          document.querySelectorAll('.presets-group .preset-chip').forEach(x => x.classList.remove('active'));
          const btnCust = document.getElementById('btn-custom-race');
          if (btnCust) btnCust.classList.add('active');
          reset();
          if (window.ClassPanel && window.ClassPanel.showToast) {
            window.ClassPanel.showToast(`Dragon race countdown set to ${s} seconds!`);
          }
        }
      }
    }
    const btnCustomRace = document.getElementById('btn-custom-race');
    if (btnCustomRace) btnCustomRace.addEventListener('click', promptCustomRaceTime);
    
    btnStart.addEventListener('click', () => { if (isRunning) pause(); else start(); });
    btnReset.addEventListener('click', reset);
    if (btnAgain) btnAgain.addEventListener('click', reset);
    display.addEventListener('click', promptCustomRaceTime);
    document.querySelectorAll('.presets-group .preset-chip[data-time]').forEach(c=>{c.addEventListener('click',()=>{totalDuration=parseInt(c.getAttribute('data-time'),10);document.querySelectorAll('.presets-group .preset-chip').forEach(x=>x.classList.remove('active'));c.classList.add('active');reset();});});
    racers.forEach((r,i)=>{r.label.addEventListener('blur',()=>{const v=r.label.textContent.trim();if(v)RACERS[i].name=v;else r.label.textContent=RACERS[i].name;});r.label.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();r.label.blur();}});});
    window.addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||e.target.isContentEditable)return;if(e.code==='Space'){e.preventDefault();if(isRunning)pause();else start();}if(e.code==='KeyR')reset();});
    window.addEventListener('resize',renderPositions);
    reset();
  })();