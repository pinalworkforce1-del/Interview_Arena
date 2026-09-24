#!/usr/bin/env python3
"""Patch packaged Interview Arena so Level Up accessibility preferences live in native app state."""
from pathlib import Path
import sys

path = Path(sys.argv[1] if len(sys.argv) > 1 else "restored/dist/app.js")
source = path.read_text(encoding="utf-8")

def replace_once(old: str, new: str, label: str) -> None:
    global source
    if old not in source:
        raise SystemExit(f"Interview Arena native accessibility patch failed: {label} signature changed")
    source = source.replace(old, new, 1)

replace_once(
    "const initial={scene:0,xp:0,earned:[],done:[],narrationDone:[],answers:{},flips:[],videos:[],reflection:{confidence:'',strength:'',next:'',coach:''},complete:false,startedAt:new Date().toISOString(),savedAt:new Date().toISOString()};",
    "const initial={scene:0,xp:0,earned:[],done:[],narrationDone:[],answers:{},flips:[],videos:[],reflection:{confidence:'',strength:'',next:'',coach:''},complete:false,settings:{auto:true,captions:true,reduce:false,large:false,playbackRate:1},startedAt:new Date().toISOString(),savedAt:new Date().toISOString()};",
    "native state",
)

replace_once(
    "document.body.classList.toggle('a11y',a11y);",
    "document.body.classList.toggle('a11y',a11y);state.settings={auto:true,captions:true,reduce:false,large:false,playbackRate:1,...(state.settings||{}),auto:true,captions:true};document.body.classList.toggle('lu-hide-captions',!state.settings.captions);document.body.classList.toggle('lu-reduce-motion',!!state.settings.reduce);document.body.classList.toggle('lu-large-text',!!state.settings.large);",
    "render preference classes",
)

autoplay_signature = " autoplay playsinline "
if source.count(autoplay_signature) != 2:
    raise SystemExit(
        f"Interview Arena native accessibility patch failed: expected 2 narration autoplay signatures, found {source.count(autoplay_signature)}"
    )
source = source.replace(
    autoplay_signature,
    " ${state.settings.auto?'autoplay':''} playsinline ",
)

replace_once(
    "function startActiveVideo(){const v=document.getElementById('narration')||document.getElementById('lessonNarration');if(!v)return;v.muted=muted;v.play().catch(()=>showPlayFallback(v))}",
    "function startActiveVideo(){const v=document.getElementById('narration')||document.getElementById('lessonNarration');if(!v)return;v.muted=muted;v.playbackRate=Number(state.settings.playbackRate||1);if(state.settings.auto)v.play().catch(()=>showPlayFallback(v));else showPlayFallback(v)}",
    "narration lifecycle",
)

replace_once(
    "b.textContent='▶ Listen to narration & captions';",
    "b.textContent=state.settings.captions?'▶ Listen to narration & captions':'▶ Listen to narration';",
    "manual narration label",
)

path.write_text(source, encoding="utf-8")
