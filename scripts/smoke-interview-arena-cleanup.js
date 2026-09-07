(()=>{
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const results=[];
  const check=(ok,label)=>{results.push({ok:!!ok,label});console.log(`${ok?'PASS':'FAIL'}: ${label}`)};
  const run=async()=>{
    await wait(600);
    check(document.querySelectorAll('.lu-scene-rail').length===1,'Level Up rail appears once on opening scene');
    check(document.querySelectorAll('.lu-caption-backdrop').length===0,'No duplicate Level Up caption backdrop exists');
    const firstShade=document.querySelector('.canvas>.caption-shade');
    if(firstShade){
      const s=getComputedStyle(firstShade);
      check(s.backgroundImage.includes('0.6'),'Opening caption backdrop is semi-transparent');
    }else check(false,'Opening caption backdrop exists');

    finishNarration();
    await wait(250);
    check(document.querySelectorAll('.lu-scene-rail').length===1,'Rail survives opening narration completion re-render');
    check(!!document.querySelector('.image-hotspot.arena'),'Opening Interview Arena image hotspot remains available');

    enterArena();
    await wait(300);
    check(state.scene===1,'Opening image hotspot advances into Interview Invitation');
    check(document.querySelectorAll('.lu-scene-rail').length===1,'Rail survives scene transition re-render');
    const nativeNext=document.querySelector('.nav-btn.next');
    const ns=nativeNext&&getComputedStyle(nativeNext);
    check(!!nativeNext&&ns.left.startsWith('-9999')&&ns.pointerEvents==='none'&&ns.opacity==='0','Native forward button is functionally hidden');
    const railContinue=document.querySelector('[data-role="continue"]');
    check(!!railContinue&&!railContinue.hidden&&railContinue.disabled,'Rail Continue mirrors locked scene state');

    document.querySelector('[data-role="skip"]')?.click();
    await wait(300);
    check(state.narrationDone.includes('invitation'),'Rail Skip completes narration through native app logic');
    check(document.querySelectorAll('.lu-scene-rail').length===1,'Rail survives Skip-triggered re-render');

    if(!state.done.includes('phone'))state.done.push('phone');
    if(!state.done.includes('email'))state.done.push('email');
    save();render();
    await wait(300);
    const enabledContinue=document.querySelector('[data-role="continue"]');
    check(!!enabledContinue&&!enabledContinue.hidden&&!enabledContinue.disabled,'Rail Continue unlocks when scene requirements are met');
    enabledContinue?.click();
    await wait(300);
    check(state.scene===2,'Rail Continue advances with the module next() function');
    check(document.querySelectorAll('.lu-scene-rail').length===1,'Rail persists after HUD-driven Continue');
    const img=document.querySelector('.canvas>.visual');
    const video=document.querySelector('.canvas>.narration');
    check(img&&getComputedStyle(img).objectFit==='cover','Main artwork fills the 16:9 stage');
    check(video&&getComputedStyle(video).objectFit==='cover','Caption/narration video aligns to the full stage');
    const shade=document.querySelector('.canvas>.caption-shade');
    const ss=shade&&getComputedStyle(shade);
    check(shade&&ss.height&&ss.left!=='0px','Single caption backdrop is inset over the artwork');

    const failed=results.filter(x=>!x.ok);
    const marker=document.createElement('pre');
    marker.id='smoke-result';
    marker.textContent=failed.length?`INTERVIEW_ARENA_SMOKE_FAIL\n${failed.map(x=>x.label).join('\n')}`:'INTERVIEW_ARENA_SMOKE_PASS';
    document.body.appendChild(marker);
    document.title=failed.length?'INTERVIEW_ARENA_SMOKE_FAIL':'INTERVIEW_ARENA_SMOKE_PASS';
  };
  run().catch(err=>{const p=document.createElement('pre');p.id='smoke-result';p.textContent='INTERVIEW_ARENA_SMOKE_FAIL\n'+String(err?.stack||err);document.body.appendChild(p);document.title='INTERVIEW_ARENA_SMOKE_FAIL'});
})();
