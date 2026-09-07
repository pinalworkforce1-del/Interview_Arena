/* Level Up UX Standard v1 — resilient adapter for packaged Interview Arena */
(()=>{
  const q=(...selectors)=>selectors.map(s=>document.querySelector(s)).find(Boolean);
  const byText=(needle,scope=document)=>Array.from(scope.querySelectorAll('button')).find(b=>(b.textContent||'').toLowerCase().includes(needle.toLowerCase()));
  const safeClick=el=>{if(el&&!el.disabled)el.click()};
  const activeVideo=()=>q('#lessonNarration','#narration');
  let scheduled=false;

  function buildRail(wrap){
    const rail=document.createElement('aside');
    rail.className='lu-scene-rail';
    rail.setAttribute('aria-label','Scene controls');
    wrap.append(rail);
    const add=(label,cls,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;if(cls)b.className=cls;b.addEventListener('click',fn);rail.append(b);return b};

    const audio=add('🔊 Audio','',()=>{
      const native=q('.controls .icon-btn[aria-label*="Mute"]','.controls .icon-btn[aria-label*="Unmute"]');
      if(native)safeClick(native);else{const v=activeVideo();if(v)v.muted=!v.muted}
      syncRail(rail);
    });
    const replay=add('↺ Replay narration','',()=>{
      const v=activeVideo();
      if(v){v.currentTime=0;v.play().catch(()=>{})}
      else safeClick(byText('Replay narration'));
    });
    const skip=add('⏭ Skip narration','',()=>{
      const lesson=document.querySelector('.lesson-modal');
      const native=lesson?byText('Skip narration',lesson):byText('Skip narration',document.querySelector('.topbar')||document);
      safeClick(native);
    });
    const play=add('▶ Play / Pause','',()=>{const v=activeVideo();if(v)(v.paused?v.play().catch(()=>{}):v.pause())});
    const cont=add('Continue →','lu-continue',()=>safeClick(document.querySelector('.nav-btn.next')));
    audio.dataset.role='audio';replay.dataset.role='replay';skip.dataset.role='skip';play.dataset.role='play';cont.dataset.role='continue';
    syncRail(rail);
    return rail;
  }

  function syncRail(rail=document.querySelector('.lu-scene-rail')){
    if(!rail||!rail.isConnected)return;
    const v=activeVideo();
    const modal=!!document.querySelector('.modal-backdrop');
    const next=document.querySelector('.nav-btn.next');
    const audio=rail.querySelector('[data-role="audio"]');
    const replay=rail.querySelector('[data-role="replay"]');
    const skip=rail.querySelector('[data-role="skip"]');
    const play=rail.querySelector('[data-role="play"]');
    const cont=rail.querySelector('[data-role="continue"]');
    if(audio)audio.textContent=v?.muted?'🔇 Audio':'🔊 Audio';
    const lesson=document.querySelector('.lesson-modal');
    const nativeReplay=lesson?byText('Replay narration',lesson):byText('Replay narration',document.querySelector('.topbar')||document);
    const nativeSkip=lesson?byText('Skip narration',lesson):byText('Skip narration',document.querySelector('.topbar')||document);
    if(replay)replay.disabled=!v&&!nativeReplay;
    if(skip)skip.disabled=!nativeSkip;
    if(play)play.disabled=!v;
    if(cont){
      cont.hidden=!next;
      cont.disabled=!next||next.disabled||modal;
      if(next)cont.textContent=(next.textContent||'Continue →').trim();
    }
  }

  function ensure(){
    scheduled=false;
    document.body.classList.add('level-up-standard');
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
    syncRail(rail);
  }

  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(ensure)}
  const observer=new MutationObserver(schedule);
  observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['disabled','hidden','class','src','muted']});
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',schedule):schedule();
})();
