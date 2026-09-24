/* Level Up UX Standard v2 — canonical Level Up audio + scene controls for packaged Interview Arena */
(()=>{
  const q=(...selectors)=>selectors.map(s=>document.querySelector(s)).find(Boolean);
  const byText=(needle,scope=document)=>Array.from(scope.querySelectorAll('button')).find(b=>(b.textContent||'').toLowerCase().includes(needle.toLowerCase()));
  const safeClick=el=>{if(el&&!el.disabled)el.click()};
  const activeVideo=()=>q('#lessonNarration','#narration');
  const videoSourceKey=v=>v?(v.getAttribute('src')||v.currentSrc||''):'';
  const nativeNarrationScope=()=>document.querySelector('.lesson-modal')||document.querySelector('.topbar')||document;
  const nativeAudioControl=()=>q(
    '.controls .icon-btn[aria-label*="Mute"]',
    '.controls .icon-btn[aria-label*="Unmute"]',
    '.controls button[aria-label*="Audio"]',
    '.topbar button[aria-label*="Mute"]',
    '.topbar button[aria-label*="Unmute"]'
  );
  const nativeAccessibilityControl=()=>{
    const scope=document.querySelector('.controls')||document.querySelector('.topbar')||document;
    return scope.querySelector('button[aria-label*="Access"]')||byText('Accessibility',scope)||null;
  };
  const nativeReplayControl=()=>byText('Replay narration',nativeNarrationScope())||null;
  const nativeSkipControl=()=>byText('Skip narration',nativeNarrationScope())||null;
  const nativePlayPauseControl=()=>{
    const scope=nativeNarrationScope();
    return byText('Pause narration',scope)||byText('Play narration',scope)||byText('Listen to narration',scope)||null;
  };
  const nativeHeaderHelp=()=>{
    const scope=document.querySelector('.controls')||document.querySelector('.topbar');
    return scope?(scope.querySelector('button[aria-label*="Help"]')||byText('Help',scope)||null):null;
  };
  const audioIsMuted=()=>{
    const v=activeVideo();
    if(v)return !!v.muted;
    const native=nativeAudioControl();
    const label=((native?.getAttribute('aria-label')||native?.textContent||'')+'').toLowerCase();
    return /unmute|audio off/.test(label);
  };
  const markLegacyControl=el=>{if(el&&!el.closest('.lu-scene-rail'))el.classList.add('lu-native-control-hidden')};
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

  function setCaptionVisibility(show){
    document.body.classList.toggle('lu-hide-captions',!show);
    const v=activeVideo();
    if(v?.textTracks){
      Array.from(v.textTracks).forEach(track=>{
        if(!track.kind||track.kind==='captions'||track.kind==='subtitles')track.mode=show?'showing':'hidden';
      });
    }
  }

  function markManualPlay(v){
    if(v)v.dataset.luManualPlaySrc=videoSourceKey(v);
  }

  function applyLearningPrefs(){
    const auto=readPref('lu-interview-auto-narration',true);
    const captions=readPref('lu-interview-show-captions',true);
    const reduce=readPref('lu-interview-reduce-motion',false);
    setCaptionVisibility(captions);
    document.body.classList.toggle('lu-reduce-motion',reduce);
    const v=activeVideo();
    const src=videoSourceKey(v);
    if(v&&!auto&&v.dataset.luManualPlaySrc!==src&&v.dataset.luAutoSuppressedSrc!==src){
      v.dataset.luAutoSuppressedSrc=src;
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
            <p><b>Interview Arena activity:</b> use the visible ✦ cues to explore required interview-prep hotspots. A ✓ shows an item you have already explored.</p>
            <p>Your existing scene gates, XP, saved progress, and completion rules stay in effect while you use these controls.</p>
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
          if(v){
            v.dataset.luAutoSuppressedSrc=videoSourceKey(v);
            v.pause();
            try{v.currentTime=0}catch(_){}
          }
        }
      });
      captions.addEventListener('change',()=>{
        writePref('lu-interview-show-captions',captions.checked);
        setCaptionVisibility(captions.checked);
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

    const audio=add('Audio on','',()=>{
      const native=nativeAudioControl();
      if(native)safeClick(native);
      else{const v=activeVideo();if(v)v.muted=!v.muted}
      syncRail(rail);
      setTimeout(()=>syncRail(rail),0);
    });
    const access=add('Accessibility','',()=>openControlDialog('access'));
    const help=add('Help','',()=>openControlDialog('help'));
    const replay=add('Replay narration','',()=>{
      const native=nativeReplayControl();
      if(native)safeClick(native);
      else{
        const v=activeVideo();
        if(v){markManualPlay(v);v.currentTime=0;v.play().catch(()=>{})}
      }
    });
    const skip=add('Skip narration','',()=>safeClick(nativeSkipControl()));
    const play=add('Play narration','',()=>{
      const native=nativePlayPauseControl();
      if(native)safeClick(native);
      else{
        const v=activeVideo();
        if(v){
          if(v.paused){markManualPlay(v);v.play().catch(()=>{})}
          else v.pause();
        }
      }
      setTimeout(()=>syncRail(rail),0);
    });
    const back=add('Back','lu-back',()=>safeClick(findNativeBack()));
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
    if(audio)audio.textContent=audioIsMuted()?'Audio off':'Audio on';
    if(access){access.hidden=false;access.disabled=false}
    const nativeReplay=nativeReplayControl();
    const nativeSkip=nativeSkipControl();
    const nativePlay=nativePlayPauseControl();
    if(replay)replay.disabled=!v&&!nativeReplay;
    if(skip)skip.disabled=!nativeSkip;
    if(play){
      play.disabled=!v&&!nativePlay;
      const nativeLabel=((nativePlay?.getAttribute('aria-label')||nativePlay?.textContent||'')+'').toLowerCase();
      const playing=v?!v.paused&&!v.ended:/pause narration/.test(nativeLabel);
      play.textContent=playing?'Pause narration':'Play narration';
    }
    if(back){
      back.hidden=false;
      back.disabled=!prev||prev.disabled||modal;
    }
    if(cont){
      cont.hidden=false;
      cont.disabled=!next||next.disabled||modal;
      if(next){
        const label=(next.textContent||'Continue →').trim();
        cont.textContent=/return to (my journey|opportunity city)/i.test(label)?'Return to Opportunity City →':label;
      }else cont.textContent='Continue →';
    }
  }

  function hideLegacyControls(){
    [
      nativeAudioControl(),
      nativeAccessibilityControl(),
      nativeReplayControl(),
      nativeSkipControl(),
      nativePlayPauseControl()
    ].forEach(markLegacyControl);
  }

  function bindHeaderHelp(){
    const button=nativeHeaderHelp();
    if(!button||button.dataset.luStandardHelp==='1')return;
    button.dataset.luStandardHelp='1';
    button.addEventListener('click',event=>{
      event.preventDefault();
      event.stopImmediatePropagation();
      openControlDialog('help');
    },true);
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
    hideLegacyControls();
    bindHeaderHelp();
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
