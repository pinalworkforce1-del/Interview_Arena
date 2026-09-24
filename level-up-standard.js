/* Level Up UX Standard v5 — master Level Up shell + gold-standard scene rail bound to native Interview Arena learner state */
(()=>{
  const q=(...selectors)=>selectors.map(s=>document.querySelector(s)).find(Boolean);
  const byText=(needle,scope=document)=>Array.from(scope.querySelectorAll('button')).find(b=>(b.textContent||'').toLowerCase().includes(needle.toLowerCase()));
  const safeClick=el=>{if(el&&!el.disabled)el.click()};
  const activeVideo=()=>q('#lessonNarration','#narration');
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
  const sceneDescriptions={
    entry:'A learner approaches the glowing entrance to Interview Arena, where the interview-preparation quest begins.',
    invitation:'A phone invitation and an email invitation appear as two ways an employer may contact a candidate.',
    awareness:'An interview invitation is highlighted while reminders reinforce checking messages and responding promptly.',
    prepare:'A preparation loadout displays interview essentials including clothing, résumé copies, notes, questions, route planning, and mindset.',
    energy:'A learner pauses to restore energy and prepare physically and mentally before an interview.',
    lobby:'A learner enters a workplace lobby and prepares to make a professional first impression with everyone they meet.',
    one:'A learner faces a one-on-one interview and practices listening, eye contact, and specific responses.',
    panel:'A learner sits before multiple interviewers and practices engaging the full panel while answering clearly.',
    virtual:'A learner prepares for a virtual interview with attention to technology, camera position, sound, and surroundings.',
    follow:'A learner builds a professional follow-up message after an interview.',
    complete:'A celebratory Interview Arena scene marks completion of the main interview-preparation quest.',
    reflection:'A learner reviews confidence, strengths, next steps, and coaching needs before leaving Interview Arena.'
  };

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

  function cloudMeta(){
    let status='local';
    try{if(typeof cloud!=='undefined'&&cloud?.status)status=cloud.status}catch(_){}
    if(status==='syncing')return {icon:'☁',label:'Saving progress'};
    if(status==='synced')return {icon:'☁',label:'Progress saved to Level Up'};
    if(status==='offline')return {icon:'☁̸',label:'Progress saved on this device'};
    return {icon:'☁',label:'Progress saved on this device'};
  }

  function clearInterviewArena(){
    if(!confirm('Reset Interview Arena and clear its saved progress?'))return;
    try{
      if(typeof cloneInitial==='function'&&typeof state!=='undefined'){
        state=cloneInitial();
        if(typeof save==='function')save();
        if(typeof render==='function')render();
      }
    }catch(_){}
  }

  function ensureMasterHeader(){
    const topbar=document.querySelector('.topbar');
    if(!topbar)return;
    topbar.classList.add('lu-master-header');
    const meta=topbar.querySelector('.progress-meta');
    if(meta){
      const first=meta.querySelector('span');
      const xp=meta.querySelector('b');
      if(first&&!meta.querySelector('.lu-scene-counter')){
        const raw=(first.textContent||'').trim();
        const match=raw.match(/^(.*?)\s*·\s*Scene\s+(\d+)\s+of\s+(\d+)$/i);
        first.classList.add('lu-progress-title');
        if(match){
          first.textContent=match[1];
          const counter=document.createElement('span');
          counter.className='lu-scene-counter';
          counter.textContent=`Scene ${match[2]} of ${match[3]}`;
          meta.insertBefore(counter,xp||null);
        }
      }
      if(xp)xp.classList.add('lu-progress-xp');
    }
    const controls=topbar.querySelector('.controls');
    if(!controls)return;
    let utilities=controls.querySelector('.lu-master-utilities');
    if(!utilities){
      utilities=document.createElement('div');
      utilities.className='lu-master-utilities';
      const city=document.createElement('button');
      city.type='button';city.className='lu-master-utility lu-city';
      city.innerHTML='<span aria-hidden="true">←</span><b>Opportunity City</b>';
      city.setAttribute('aria-label','Back to Opportunity City');
      city.title='Back to Opportunity City';
      city.addEventListener('click',()=>{location.href='https://pinalworkforce1-del.github.io/Level_Up_Portal/'});
      const cloudEl=document.createElement('span');
      cloudEl.className='lu-master-cloud';
      cloudEl.setAttribute('aria-label','Level Up save status');
      const help=document.createElement('button');
      help.type='button';help.className='lu-master-utility lu-help';
      help.innerHTML='<span aria-hidden="true">?</span><b>Help</b>';
      help.setAttribute('aria-label','Open Interview Arena help');
      help.title='Help';
      help.addEventListener('click',()=>openControlDialog('help'));
      const clear=document.createElement('button');
      clear.type='button';clear.className='lu-master-utility lu-clear';
      clear.innerHTML='<span aria-hidden="true">↻</span>';
      clear.setAttribute('aria-label','Clear Interview Arena progress');
      clear.title='Clear Interview Arena progress';
      clear.addEventListener('click',clearInterviewArena);
      utilities.append(city,cloudEl,help,clear);
      controls.prepend(utilities);
    }
    const cloudEl=utilities.querySelector('.lu-master-cloud');
    const cloudState=cloudMeta();
    if(cloudEl){cloudEl.textContent=cloudState.icon;cloudEl.title=cloudState.label}
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

  function nativeSettings(){
    try{
      if(typeof state!=="undefined"){
        state.settings={auto:true,captions:true,reduce:false,large:false,playbackRate:1,...(state.settings||{}),auto:true,captions:true};
        return state.settings;
      }
    }catch(_){}
    return {auto:true,captions:true,reduce:false,large:false,playbackRate:1};
  }

  function saveNativeSettings(){
    try{if(typeof save==="function")save()}catch(_){}
  }

  function applyLearningPrefs(){
    const settings=nativeSettings();
    document.body.classList.toggle('lu-hide-captions',!settings.captions);
    document.body.classList.toggle('lu-reduce-motion',!!settings.reduce);document.body.classList.toggle('lu-large-text',!!settings.large);const v=activeVideo();if(v)v.playbackRate=Number(settings.playbackRate||1);
  }

  function openControlDialog(kind){
    closeControlDialog();
    const backdrop=document.createElement('div');
    backdrop.className='lu-control-dialog-backdrop';
    backdrop.innerHTML=kind==='access'
      ? `<section class="lu-control-dialog lu-accessibility-dialog" role="dialog" aria-modal="true" aria-label="Accessibility">
          <header><div><small>ACCESSIBILITY • SCENE ${typeof state!=='undefined'?state.scene+1:1} OF ${typeof scenes!=='undefined'?scenes.length:12}</small><h2>${typeof state!=='undefined'&&scenes?.[state.scene]?scenes[state.scene].title:'Interview Arena'}</h2></div><button type="button" class="lu-dialog-close" aria-label="Close">×</button></header>
          <p class="lu-access-intro">Adjust the experience at any time. Your choices are saved with your Level Up progress.</p>
          <section class="lu-scene-description"><div><span aria-hidden="true">◉</span><strong>Describe this scene</strong></div><p>${typeof state!=='undefined'&&scenes?.[state.scene]?sceneDescriptions[scenes[state.scene].id]||'Interview preparation scene.':'Interview preparation scene.'}</p></section>
          <div class="lu-access-options">
            <label class="lu-preference-row"><span><strong>Larger interface text</strong><small>Increases controls and readable text without changing the artwork.</small></span><input id="luLargeText" type="checkbox"></label>
            <label class="lu-preference-row"><span><strong>Reduce motion</strong><small>Turns off pulses, flips, and decorative movement.</small></span><input id="luReduceMotion" type="checkbox"></label>
            <fieldset class="lu-speed-options"><legend>Narration speed</legend><div>
              <button type="button" data-rate="0.75">0.75×</button><button type="button" data-rate="1">1×</button><button type="button" data-rate="1.25">1.25×</button><button type="button" data-rate="1.5">1.5×</button>
            </div></fieldset>
          </div>
          <p class="lu-caption-note">Captions appear with every narration video. You can pause, replay, mute, change speed, or skip narration without losing access to the scene.</p>
          <button type="button" class="lu-access-return">Return to Interview Arena</button>
        </section>`
      : `<section class="lu-control-dialog" role="dialog" aria-modal="true" aria-label="Interview Arena help">
          <header><div><small>HELP</small><h2>Interview Arena controls</h2></div><button type="button" class="lu-dialog-close" aria-label="Close">×</button></header>
          <div class="lu-help-guide">
            <p><b>Audio</b> turns narration sound on or off.</p>
            <p><b>Accessibility</b> lets you control narration autoplay, visual captions, and motion.</p>
            <p><b>Replay narration</b> restarts the current narration from the beginning.</p>
            <p><b>Skip narration</b> moves past narration so you can begin the scene activity.</p>
            <p><b>Play narration</b> plays or pauses the current narration.</p>
            <p><b>Previous scene</b> returns to the prior scene without clearing your saved progress.</p>
            <p><b>Continue</b> becomes available after required scene interactions are complete.</p>
            <p><b>Interview Arena activity:</b> use the visible ✦ cues to explore required interview-prep hotspots. A ✓ shows an item you have already explored.</p>
            <p>Your existing scene gates, XP, saved progress, and completion rules stay in effect while you use these controls.</p>
          </div>
        </section>`;
    document.body.append(backdrop);
    backdrop.querySelector('.lu-dialog-close')?.addEventListener('click',closeControlDialog);
    backdrop.addEventListener('click',e=>{if(e.target===backdrop)closeControlDialog()});
    if(kind==='access'){
      const large=backdrop.querySelector('#luLargeText');
      const reduce=backdrop.querySelector('#luReduceMotion');
      const settings=nativeSettings();
      large.checked=!!settings.large;
      reduce.checked=!!settings.reduce;
      const syncRates=()=>backdrop.querySelectorAll('[data-rate]').forEach(button=>button.classList.toggle('selected',Number(button.dataset.rate)===Number(nativeSettings().playbackRate||1)));
      syncRates();
      large.addEventListener('change',()=>{
        nativeSettings().large=large.checked;
        document.body.classList.toggle('lu-large-text',large.checked);
        saveNativeSettings();
      });
      reduce.addEventListener('change',()=>{
        nativeSettings().reduce=reduce.checked;
        document.body.classList.toggle('lu-reduce-motion',reduce.checked);
        saveNativeSettings();
      });
      backdrop.querySelectorAll('[data-rate]').forEach(button=>button.addEventListener('click',()=>{
        nativeSettings().playbackRate=Number(button.dataset.rate)||1;
        const v=activeVideo();if(v)v.playbackRate=nativeSettings().playbackRate;
        syncRates();
        saveNativeSettings();
      }));
      backdrop.querySelector('.lu-access-return')?.addEventListener('click',closeControlDialog);
    }
  }

  function buildRail(wrap){
    const rail=document.createElement('aside');
    rail.className='lu-scene-rail';
    rail.setAttribute('aria-label','Scene controls');
    wrap.append(rail);
    const add=(label,cls,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;if(cls)b.className=cls;b.addEventListener('click',fn);rail.append(b);return b};

    const back=add('← Previous scene','lu-back',()=>safeClick(findNativeBack()));
    const audio=add('🔊 Audio on','',()=>{
      const native=nativeAudioControl();
      if(native)safeClick(native);
      else{const v=activeVideo();if(v)v.muted=!v.muted}
      syncRail(rail);
      setTimeout(()=>syncRail(rail),0);
    });
    const access=add('◉ Accessibility','',()=>openControlDialog('access'));
    const replay=add('↻ Replay narration','',()=>{
      const native=nativeReplayControl();
      if(native){
        safeClick(native);
        setTimeout(()=>{const v=activeVideo();if(v){v.currentTime=0;v.play().catch(()=>{})}},0);
      }else{
        const v=activeVideo();
        if(v){v.currentTime=0;v.play().catch(()=>{})}
      }
    });
    const skip=add('⇥ Skip narration','',()=>safeClick(nativeSkipControl()));
    const play=add('▶ Play narration','',()=>{
      const native=nativePlayPauseControl();
      if(native)safeClick(native);
      else{
        const v=activeVideo();
        if(v){
          if(v.paused){v.play().catch(()=>{})}
          else v.pause();
        }
      }
      setTimeout(()=>syncRail(rail),0);
    });
    const cont=add('Continue →','lu-continue',()=>safeClick(document.querySelector('.nav-btn.next')));
    back.dataset.role='back';audio.dataset.role='audio';access.dataset.role='access';replay.dataset.role='replay';skip.dataset.role='skip';play.dataset.role='play';cont.dataset.role='continue';
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
    if(audio)audio.textContent=audioIsMuted()?'🔇 Audio off':'🔊 Audio on';
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
      play.textContent=playing?'⏸ Pause narration':'▶ Play narration';
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
    ensureMasterHeader();
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
  window.setInterval(()=>{try{ensureMasterHeader()}catch(_){}},1000);
})();
