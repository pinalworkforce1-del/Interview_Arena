(()=>{
  const wait=ms=>new Promise(r=>setTimeout(r,ms));
  const results=[];
  const check=(ok,label)=>{results.push({ok:!!ok,label});console.log(`${ok?'PASS':'FAIL'}: ${label}`)};
  const hotspotSelector='button[class*="hotspot"]:not(.hotspot-layer),a[class*="hotspot"]:not(.hotspot-layer)';
  const checkHotspots=label=>{
    const hotspots=Array.from(document.querySelectorAll(hotspotSelector));
    if(!hotspots.length)return;
    const allIconized=hotspots.every(h=>h.classList.contains('lu-hotspot-iconized'));
    const allLabeled=hotspots.every(h=>!!h.dataset.luLabel&&h.dataset.luLabel!=='Explore');
    const allIcons=hotspots.every(h=>h.dataset.luIcon==='✦'||h.dataset.luIcon==='✓');
    const noShapes=hotspots.every(h=>{
      const s=getComputedStyle(h);
      return parseFloat(s.borderTopWidth)===0&&s.backgroundColor==='rgba(0, 0, 0, 0)'&&s.borderRadius==='0px';
    });
    const hitAreasPreserved=hotspots.every(h=>{const r=h.getBoundingClientRect();return r.width>30&&r.height>30});
    check(allIconized,`${label}: all image links use the Level Up icon treatment`);
    check(allLabeled,`${label}: all image links have meaningful labels`);
    check(allIcons,`${label}: all image links display glow/check icons`);
    check(noShapes,`${label}: old circle/rectangle hotspot shapes are visually removed`);
    check(hitAreasPreserved,`${label}: generous hotspot click areas are preserved`);
  };
  const ensureNarrated=async()=>{
    const id=scenes[state.scene]?.id;
    if(id&&!state.narrationDone.includes(id)){
      finishNarration();
      await wait(140);
    }
  };
  const markDoneKeys=async(keys=[])=>{
    for(const key of keys)if(!state.done.includes(key))state.done.push(key);
    save();render();
    await wait(140);
  };
  const rail=()=>document.querySelector('.lu-scene-rail');
  const continueBtn=()=>document.querySelector('[data-role="continue"]');
  const advanceScene=async(label,doneKeys=[])=>{
    const before=state.scene;
    await ensureNarrated();
    checkHotspots(label);
    if(doneKeys.length)await markDoneKeys(doneKeys);
    checkHotspots(`${label} completed`);
    const c=continueBtn();
    check(!!rail(),`${label}: Level Up rail is present`);
    check(!!c&&!c.hidden&&!c.disabled,`${label}: rail Continue is available`);
    c?.click();
    await wait(160);
    check(state.scene===before+1,`${label}: rail Continue advances to the next scene`);
    check(!!rail(),`${label}: rail survives the scene re-render`);
  };

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
    await wait(160);
    check(document.querySelectorAll('.lu-scene-rail').length===1,'Rail survives opening narration completion re-render');
    const arenaHotspot=document.querySelector('.image-hotspot.arena');
    check(!!arenaHotspot,'Opening Interview Arena image hotspot remains available');
    checkHotspots('Opening Interview Arena');
    check((arenaHotspot?.dataset.luLabel||'').toLowerCase().includes('interview'),'Opening hotspot has an intentional Interview Arena label');

    enterArena();
    await wait(180);
    check(state.scene===1,'Opening image hotspot advances into Interview Invitation');
    check(document.querySelectorAll('.lu-scene-rail').length===1,'Rail survives opening hotspot transition');
    checkHotspots('Interview Invitation');
    const phone=document.querySelector('.image-hotspot.phone');
    const email=document.querySelector('.image-hotspot.email');
    check((phone?.dataset.luLabel||'').toLowerCase().includes('phone'),'Phone hotspot has an intentional label');
    check((email?.dataset.luLabel||'').toLowerCase().includes('email'),'Email hotspot has an intentional label');
    const nativeNext=document.querySelector('.nav-btn.next');
    const ns=nativeNext&&getComputedStyle(nativeNext);
    check(!!nativeNext&&ns.left.startsWith('-9999')&&ns.pointerEvents==='none'&&ns.opacity==='0','Native forward button is functionally hidden');
    const lockedContinue=continueBtn();
    check(!!lockedContinue&&!lockedContinue.hidden&&lockedContinue.disabled,'Rail Continue mirrors the locked invitation state');

    continueBtn()?.parentElement?.querySelector('[data-role="skip"]')?.click();
    await wait(160);
    check(state.narrationDone.includes('invitation'),'Rail Skip completes invitation narration through native app logic');
    check(!!rail(),'Rail survives Skip-triggered re-render');

    await markDoneKeys(['phone','email']);
    checkHotspots('Interview Invitation explored state');
    check(document.querySelector('.image-hotspot.phone')?.dataset.luIcon==='✓','Explored phone hotspot changes to a check icon');
    check(document.querySelector('.image-hotspot.email')?.dataset.luIcon==='✓','Explored email hotspot changes to a check icon');
    const invitationContinue=continueBtn();
    check(!!invitationContinue&&!invitationContinue.hidden&&!invitationContinue.disabled,'Invitation Continue unlocks after required explorations');
    invitationContinue?.click();
    await wait(180);
    check(state.scene===2,'Invitation advances into Opportunity Awareness');
    check(!!rail(),'Rail persists after first HUD-driven Continue');

    const img=document.querySelector('.canvas>.visual');
    const video=document.querySelector('.canvas>.narration');
    check(img&&getComputedStyle(img).objectFit==='cover','Main artwork fills the 16:9 stage');
    check(video&&getComputedStyle(video).objectFit==='cover','Caption/narration video aligns to the full stage');
    const shade=document.querySelector('.canvas>.caption-shade');
    const ss=shade&&getComputedStyle(shade);
    check(shade&&ss.height&&ss.left!=='0px','Single caption backdrop is inset over the artwork');

    await advanceScene('Opportunity Awareness',['awareness']);
    await advanceScene('Prepare Your Loadout',['flip:outfit','flip:resume','flip:notebook','flip:questions','flip:route','flip:pma']);
    await advanceScene('Restore Your Energy',['energy']);
    await advanceScene('Lobby Encounter',['lobby']);
    await advanceScene('One-on-One Challenge',['one']);
    await advanceScene('Panel Battle',['panel']);
    await advanceScene('Virtual Victory Portal',['virtual']);
    await advanceScene('24-Hour Follow-Up',['follow']);

    check(state.scene===10,'Full route reaches Quest Complete celebration');
    await ensureNarrated();
    checkHotspots('Quest Complete');
    check(state.done.includes('complete'),'Celebration narration marks Quest Complete through native logic');
    const celebrationContinue=continueBtn();
    check(!!celebrationContinue&&!celebrationContinue.hidden&&!celebrationContinue.disabled,'Quest Complete Continue is available in the Level Up rail');
    celebrationContinue?.click();
    await wait(180);
    check(state.scene===11,'Quest Complete advances to final Reflection / Wrap-Up');
    check(!!rail(),'Rail persists into the final wrap-up scene');
    checkHotspots('Final Reflection');

    await ensureNarrated();
    state.complete=true;
    if(!state.done.includes('reflection'))state.done.push('reflection');
    save();render();
    await wait(180);
    const finalContinue=continueBtn();
    check(!!finalContinue&&!finalContinue.hidden&&!finalContinue.disabled,'Final Return control is available after completion');
    check((finalContinue?.textContent||'').toLowerCase().includes('return'),'Final rail control preserves the module return-to-journey action');
    check(state.scene===11,'Smoke test stops before leaving Interview Arena');

    const failed=results.filter(x=>!x.ok);
    const marker=document.createElement('pre');
    marker.id='smoke-result';
    marker.textContent=failed.length?`INTERVIEW_ARENA_SMOKE_FAIL\n${failed.map(x=>x.label).join('\n')}`:'INTERVIEW_ARENA_SMOKE_PASS';
    document.body.appendChild(marker);
    document.title=failed.length?'INTERVIEW_ARENA_SMOKE_FAIL':'INTERVIEW_ARENA_SMOKE_PASS';
  };
  run().catch(err=>{const p=document.createElement('pre');p.id='smoke-result';p.textContent='INTERVIEW_ARENA_SMOKE_FAIL\n'+String(err?.stack||err);document.body.appendChild(p);document.title='INTERVIEW_ARENA_SMOKE_FAIL'});
})();
