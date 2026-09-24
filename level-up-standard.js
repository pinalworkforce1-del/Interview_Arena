/* Level Up UX Standard v1 — resilient adapter for packaged Interview Arena */
(()=>{
  const q=(...selectors)=>selectors.map(s=>document.querySelector(s)).find(Boolean);
  const byText=(needle,scope=document)=>Array.from(scope.querySelectorAll('button')).find(b=>(b.textContent||'').toLowerCase().includes(needle.toLowerCase()));
  const safeClick=el=>{if(el&&!el.disabled)el.click()};
  const activeVideo=()=>q('#lessonNarration','#narration');
  let scheduled=false;

  const titleCase=text=>text.replace(/\b([a-z])/g,m=>m.toUpperCase());
  function hotspotLabel(el){
    if(el.classList.contains('arena'))return 'Interview Arena';
    if(el.classList.contains('phone'))return 'Phone Invitation';
    if(el.classList.contains('email'))return 'Email Invitation';
    if(el.classList.contains('reflection'))return 'Review Interview Readiness';
    if(el.classList.contains('card-front')){
      const raw=(el.getAttribute('aria-label')||'').replace(/^Explore\s+/i,'').trim();
      const short={
        'Appropriate Outfit':'Outfit',
        'Résumé Folder':'Résumé',
        'Notebook & Pen':'Notebook',
        'Interview Questions':'Questions',
        'Directions & Route':'Route',
        'Positive Mindset':'Mindset'
      };
      return short[raw]||raw||'Explore';
    }
    const cue=(el.querySelector('.hotspot-cue')?.textContent||'').trim();
    let text=(el.getAttribute('aria-label')||el.getAttribute('title')||'').trim();
    if(!text||/^(explore|open|enter|select|choose|view)$/i.test(text))text=cue;
    text=text
      .replace(/^(explore|open|enter|select|choose|view|activate|visit)\s+(the\s+)?/i,'')
      .replace(/^(click|tap)\s+(to\s+)?/i,'')
      .replace(/\s+(illustrated\s+)?learning\s+scene$/i,'')
      .replace(/\s+hotspot$/i,'')
      .replace(/^✓\s*/,'')
      .replace(/^explored\s*:?\s*/i,'')
      .trim();
    if(!text||/^explored$/i.test(text))text='Explore';
    return titleCase(text);
  }

  function decorateHotspots(){
    const selector=[
      'button.image-hotspot','a.image-hotspot',
      'button[class*="hotspot"]:not(.hotspot-layer)','a[class*="hotspot"]:not(.hotspot-layer)',
      'button.card-front'
    ].join(',');
    document.querySelectorAll(selector).forEach(el=>{
      if(el.closest('.lu-scene-rail'))return;
      el.classList.add('lu-hotspot-iconized');
      const cue=(el.querySelector('.hotspot-cue')?.textContent||'').trim();
      const explored=el.classList.contains('explored')||el.closest('.loadout-card')?.classList.contains('viewed')||/^✓/.test(cue)||/explored/i.test(cue);
      el.dataset.luIcon=explored?'✓':'✦';
      el.dataset.luLabel=hotspotLabel(el);
      el.dataset.luState=explored?'explored':'available';
    });
  }

  function findNativeBack(){
    const nav=document.querySelector('.navrow')||document;
    return Array.from(nav.querySelectorAll('button')).find(b=>{
      if(b.closest('.lu-scene-rail'))return false;
      return /^\s*←?\s*back\s*$/i.test((b.textContent||'').trim());
    })||null;
  }

  function closeControlDialog(){
    document.querySelector('.lu-control-dialog-backdrop')?.remove();
  }

  function readPref(key,defaultValue){
    try{
      const value=localStorage.getItem(key);
      return value===null?defaultValue:value==='1';
    }catch(_){return defaultValue}
  }

  function writePref(key,value){
    try{localStorage.setItem(key,value?'1':'0')}catch(_){}
  }

  function applyLearningPrefs(){
    const auto=readPref('lu-interview-auto-narration',true);
    const captions=readPref('lu-interview-show-captions',true);
    const reduce=readPref('lu-interview-reduce-motion',false);
    document.body.classList.toggle('lu-hide-captions',!captions);
    document.body.classList.toggle('lu-reduce-motion',reduce);
    const v=activeVideo();
    if(v&&!auto&&!v.dataset.luManualPlay&&!v.dataset.luAutoSuppressed){
      v.dataset.luAutoSuppressed='1';
      v.pause();
      try{v.currentTime=0}catch(_){}
    }
  }

  function openControlDialog(kind){
    closeControlDialog();
    const backdrop=document.createElement('div');
    backdrop.className='lu-control-dialog-backdrop';
    backdrop.innerHTML=kind==='access'
      ? `<section class="lu-control-dialog" role="dialog" aria-modal="true" aria-label="Accessibility">
          <header><div><small>ACCESSIBILITY</small><h2>Choose how you learn</h2></div><button type="button" class="lu-dialog-close" aria-label="Close">×</button></header>
          <label class="lu-switch-row"><span>Play narration automatically</span><input id="luAutoPlay" type="checkbox"></label>
          <label class="lu-switch-row"><span>Show visual captions</span><input id="luShowCaptions" type="checkbox"></label>
          <label class="lu-switch-row"><span>Reduce motion</span><input id="luReduceMotion" type="checkbox"></label>
        </section>`
      : `<section class="lu-control-dialog" role="dialog" aria-modal="true" aria-label="Interview Arena help">
          <header><div><small>HELP</small><h2>Interview Arena controls</h2></div><button type="button" class="lu-dialog-close" aria-label="Close">×</button></header>
          <div class="lu-help-guide">
            <p><b>Audio</b> turns narration sound on or off.</p>
            <p><b>Accessibility</b> lets you control narration autoplay, visual captions, and motion.</p>
            <p><b>Replay narration</b> restarts the current narration from the beginning.</p>
            <p><b>Skip narration</b> moves past narration so you can begin the scene activity.</p>
            <p><b>Play narration</b> plays or pauses the current narration.</p>
            <p><b>Back</b> returns to the previous scene without clearing your saved progress.</p>
            <p><b>Continue</b> becomes available after required scene interactions are complete.</p>
          </div>
        </section>`;
    document.body.append(backdrop);
    backdrop.querySelector('.lu-dialog-close')?.addEventListener('click',closeControlDialog);
    backdrop.addEventListener('click',e=>{if(e.target===backdrop)closeControlDialog()});
    if(kind==='access'){
      const auto=backdrop.querySelector('#luAutoPlay');
      const captions=backdrop.querySelector('#luShowCaptions');
      const reduce=backdrop.querySelector('#luReduceMotion');
      auto.checked=readPref('lu-interview-auto-narration',true);
      captions.checked=readPref('lu-interview-show-captions',true);
      reduce.checked=readPref('lu-interview-reduce-motion',false);
      auto.addEventListener('change',()=>{
        writePref('lu-interview-auto-narration',auto.checked);
        if(!auto.checked){
          const v=activeVideo();
          if(v){v.dataset.luAutoSuppressed='1';v.pause();try{v.currentTime=0}catch(_){}}
        }
      });
      captions.addEventListener('change',()=>{
        writePref('lu-interview-show-captions',captions.checked);
        document.body.classList.toggle('lu-hide-captions',!captions.checked);
      });
      reduce.addEventListener('change',()=>{
        writePref('lu-interview-reduce-motion',reduce.checked);
        document.body.classList.toggle('lu-reduce-motion',reduce.checked);
      });
    }
  }

  function buildRail(wrap){
    const rail=document.createElement('aside');
    rail.className='lu-scene-rail';
    rail.setAttribute('aria-label','Scene controls');
    wrap.append(rail);
    const add=(label,cls,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;if(cls)b.className=cls;b.addEventListener('click',fn);rail.append(b);return b};

    const audio=add('🔊 Audio on','',()=>{
      const native=q('.controls .icon-btn[aria-label*="Mute"]','.controls .icon-btn[aria-label*="Unmute"]');
      if(native)safeClick(native);else{const v=activeVideo();if(v)v.muted=!v.muted}
      syncRail(rail);
    });
    const access=add('◉ Accessibility','',()=>openControlDialog('access'));
    const help=add('? Help','',()=>openControlDialog('help'));
    const replay=add('↺ Replay narration','',()=>{
      const v=activeVideo();
      if(v){v.dataset.luManualPlay='1';v.currentTime=0;v.play().catch(()=>{})}
      else{
        const lesson=document.querySelector('.lesson-modal');
        safeClick(lesson?byText('Replay narration',lesson):byText('Replay narration',document.querySelector('.topbar')||document));
      }
    });
    const skip=add('⏭ Skip narration','',()=>{
      const lesson=document.querySelector('.lesson-modal');
      const native=lesson?byText('Skip narration',lesson):byText('Skip narration',document.querySelector('.topbar')||document);
      safeClick(native);
    });
    const play=add('▶ Play narration','',()=>{const v=activeVideo();if(v){if(v.paused){v.dataset.luManualPlay='1';v.play().catch(()=>{})}else v.pause()}});
    const back=add('← Back','lu-back',()=>safeClick(findNativeBack()));
    const cont=add('Continue →','lu-continue',()=>safeClick(document.querySelector('.nav-btn.next')));
    audio.dataset.role='audio';access.dataset.role='access';help.dataset.role='help';replay.dataset.role='replay';skip.dataset.role='skip';play.dataset.role='play';back.dataset.role='back';cont.dataset.role='continue';
    syncRail(rail);
    return rail;
  }

  function syncRail(rail=document.querySelector('.lu-scene-rail')){
    if(!rail||!rail.isConnected)return;
    const v=activeVideo();
    const modal=!!document.querySelector('.modal-backdrop,.lu-control-dialog-backdrop');
    const prev=findNativeBack();
    const next=document.querySelector('.nav-btn.next');
    const audio=rail.querySelector('[data-role="audio"]');
    const access=rail.querySelector('[data-role="access"]');
    const replay=rail.querySelector('[data-role="replay"]');
    const skip=rail.querySelector('[data-role="skip"]');
    const play=rail.querySelector('[data-role="play"]');
    const back=rail.querySelector('[data-role="back"]');
    const cont=rail.querySelector('[data-role="continue"]');
    if(audio)audio.textContent=v?.muted?'🔇 Audio off':'🔊 Audio on';
    if(access){access.hidden=false;access.disabled=false}
    const lesson=document.querySelector('.lesson-modal');
    const nativeReplay=lesson?byText('Replay narration',lesson):byText('Replay narration',document.querySelector('.topbar')||document);
    const nativeSkip=lesson?byText('Skip narration',lesson):byText('Skip narration',document.querySelector('.topbar')||document);
    if(replay)replay.disabled=!v&&!nativeReplay;
    if(skip)skip.disabled=!nativeSkip;
    if(play){
      play.disabled=!v;
      play.textContent=v&&!v.paused&&!v.ended?'Ⅱ Pause narration':'▶ Play narration';
    }
    if(back){back.hidden=!prev;back.disabled=!prev||prev.disabled||modal}
    if(cont){
      cont.hidden=!next;
      cont.disabled=!next||next.disabled||modal;
      if(next){
        const label=(next.textContent||'Continue →').trim();
        cont.textContent=/return to my journey/i.test(label)?'Return to Opportunity City →':label;
      }
    }
  }

  function ensure(){
    scheduled=false;
    document.body.classList.add('level-up-standard');
    decorateHotspots();
    const stage=q('.stage','.scene-frame','.game-stage','.scene-stage');
    if(!stage)return;
    let wrap=stage.closest('.lu-standard-wrap');
    if(!wrap){
      const host=stage.parentElement;if(!host)return;
      wrap=document.createElement('div');wrap.className='lu-standard-wrap';
      host.insertBefore(wrap,stage);
      const stageHost=document.createElement('div');stageHost.className='lu-stage-host';wrap.append(stageHost);stageHost.append(stage);
    }
    let rail=wrap.querySelector('.lu-scene-rail');
    if(!rail)rail=buildRail(wrap);
    const nativeBack=findNativeBack();
    if(nativeBack)nativeBack.classList.add('lu-native-nav-hidden');
    applyLearningPrefs();
    syncRail(rail);
    ensureMockInterviewEntry(stage);
  }

  function ensureMockInterviewEntry(stage){
    const title=(document.querySelector('.progress-meta span')?.textContent||document.querySelector('.scene-status')?.textContent||'').toLowerCase();
    const finalScene=/quest complete|scene 11|complete/.test(title);
    let b=document.getElementById('luMockInterviewEntry');
    if(!finalScene){if(b)b.remove();return}
    if(b)return;
    const nav=stage.querySelector('.navrow')||stage;
    b=document.createElement('button');
    b.id='luMockInterviewEntry';
    b.type='button';
    b.className='nav-btn next';
    b.textContent='⚔ Launch AI Mock Interview • 200 XP';
    b.style.marginLeft='8px';
    b.addEventListener('click',()=>{
      const target='https://pinalworkforce1-del.github.io/LU_Discovery/mock-interview.html?mode=selfpaced&returnTo='+encodeURIComponent(location.href);
      location.href=target;
    });
    nav.appendChild(b);
  }

  function schedule(){if(scheduled)return;scheduled=true;setTimeout(ensure,0)}
  const observer=new MutationObserver(schedule);
  observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['disabled','hidden','class','src','muted']});
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule):schedule();
})();
