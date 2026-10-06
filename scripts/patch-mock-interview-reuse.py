from pathlib import Path
import sys

path = Path(sys.argv[1] if len(sys.argv) > 1 else "level-up-standard.js")
text = path.read_text(encoding="utf-8")

old = """  function ensureMockInterviewEntry(stage){
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
    b.style.marginLeft='8px';
    const syncMockAvailability=()=>{
      const online=navigator.onLine;
      b.disabled=!online;
      b.textContent=online?'⚔ Launch AI Mock Interview • 200 XP':'⚔ AI Mock Interview • Online connection required';
      b.title=online?'Launch AI Mock Interview':'Available when you are back online';
    };
    syncMockAvailability();
    b.addEventListener('click',()=>{
      if(!navigator.onLine)return;
      const target='https://pinalworkforce1-del.github.io/LU_Discovery/mock-interview.html?mode=selfpaced&returnTo='+encodeURIComponent(location.href);
      location.href=target;
    });
    window.addEventListener('online',syncMockAvailability);
    window.addEventListener('offline',syncMockAvailability);
    nav.appendChild(b);
  }
"""

new = """  function mockInterviewEarned(){
    try{
      if(typeof state!=='undefined'&&Array.isArray(state.earned)&&state.earned.includes('mock-interview'))return true;
      const saved=JSON.parse(localStorage.getItem('level-up-interview-arena-v3')||'{}');
      return Array.isArray(saved.earned)&&saved.earned.includes('mock-interview');
    }catch(_){return false}
  }

  function ensureMockInterviewEntry(stage){
    const title=(document.querySelector('.progress-meta span')?.textContent||document.querySelector('.scene-status')?.textContent||'').toLowerCase();
    const finalScene=/quest complete|scene 11|complete/.test(title);
    let moduleComplete=false;
    try{moduleComplete=typeof state!=='undefined'&&!!state.complete}catch(_){}
    let b=document.getElementById('luMockInterviewEntry');
    if(!finalScene&&!moduleComplete){if(b)b.remove();return}
    const syncMockAvailability=()=>{
      if(!b)return;
      const online=navigator.onLine;
      const earned=mockInterviewEarned();
      b.disabled=!online;
      b.textContent=online?(earned?'⚔ Practice AI Mock Interview':'⚔ Launch AI Mock Interview • 200 XP'):'⚔ AI Mock Interview • Online connection required';
      b.title=online?(earned?'Practice another AI mock interview':'Launch AI Mock Interview'):'Available when you are back online';
    };
    if(!b){
      const nav=stage.querySelector('.navrow')||stage;
      b=document.createElement('button');
      b.id='luMockInterviewEntry';
      b.type='button';
      b.className='nav-btn lu-mock-interview-entry';
      b.style.marginLeft='8px';
      b.addEventListener('click',()=>{
        if(!navigator.onLine)return;
        const target='https://pinalworkforce1-del.github.io/LU_Discovery/mock-interview.html?mode=selfpaced&returnTo='+encodeURIComponent(location.href);
        location.href=target;
      });
      window.addEventListener('online',syncMockAvailability);
      window.addEventListener('offline',syncMockAvailability);
      nav.appendChild(b);
    }
    syncMockAvailability();
  }
"""

if "function mockInterviewEarned()" in text:
    print("Reusable mock interview patch already present.")
elif old in text:
    text = text.replace(old, new, 1)
    path.write_text(text, encoding="utf-8")
    print("Reusable mock interview access enabled.")
else:
    raise SystemExit("Mock interview launch signature changed; patch not applied")
