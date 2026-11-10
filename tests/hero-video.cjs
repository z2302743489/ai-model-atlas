const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const app=fs.readFileSync(require('node:path').resolve(__dirname,'../src/app.js'),'utf8');
const start=app.indexOf('// Decorative footage starts only while visible');
assert.notEqual(start,-1,'background video module is present');
const source=app.slice(start);
let passed=0;const check=(value,message)=>{assert.ok(value,message);passed++};
const tick=async()=>{for(let i=0;i<6;i++)await Promise.resolve()};
function setup({reduced=false,saveData=false,effectiveType='4g',mode='auto'}={}){
 const classes=new Set(),events={},docEvents={},prefEvents={},pending=[];
 let observer;
 const hero={classList:{add:k=>classes.add(k),remove:k=>classes.delete(k)}};
 const video={src:'',dataset:{src:'https://example.com/footage.mp4'},paused:true,ended:false,error:null,mode,playCalls:0,loadCalls:0,addEventListener(k,fn){(events[k]??=[]).push(fn)},emit(k){for(const fn of events[k]||[])fn()},load(){this.loadCalls++;this.error=null},pause(){this.paused=true;this.emit('pause')},play(){this.playCalls++;if(this.mode==='reject'){this.paused=true;return Promise.reject(new Error('blocked'))}this.paused=false;if(this.mode==='pending')return new Promise((resolve,reject)=>pending.push({resolve:()=>{if(!this.paused)this.emit('playing');resolve()},reject}));this.emit('playing');return Promise.resolve()}};
 // Deliberately provide no motion-control button: footage is entirely automatic.
 const doc={hidden:false,querySelector:()=>hero,getElementById:id=>id==='hero-video'?video:null,addEventListener(k,fn){docEvents[k]=fn},emit:k=>docEvents[k]?.()};
 const pref={matches:reduced,addEventListener(k,fn){prefEvents[k]=fn},emit(){prefEvents.change?.()}};
 class Observer{constructor(fn){this.fn=fn;observer=this}observe(){}emit(value){this.fn([{isIntersecting:value}])}}
 const c={document:doc,navigator:{connection:{saveData,effectiveType}},matchMedia:()=>pref,IntersectionObserver:Observer};vm.createContext(c);vm.runInContext(source,c);
 return{hero,video,doc,pref,classes,pending,observer};
}
(async()=>{
 const a=setup({reduced:true});check(!!a.observer,'module initializes without a motion-control button');a.observer.emit(true);await tick();check(!a.video.src&&a.video.playCalls===0,'reduced motion avoids media loading and autoplay');
 a.pref.matches=false;a.pref.emit();await tick();check(!a.video.paused&&a.video.loadCalls===1,'clearing reduced motion permits automatic playback');
 a.pref.matches=true;a.pref.emit();await tick();check(a.video.paused,'enabling reduced motion pauses playing footage');a.pref.matches=false;a.pref.emit();await tick();check(!a.video.paused,'clearing reduced motion resumes visible footage');
 const b=setup({saveData:true});b.observer.emit(true);await tick();check(!b.video.src&&b.video.playCalls===0,'saveData avoids media loading and autoplay');
 for(const effectiveType of ['2g','slow-2g']){const slow=setup({effectiveType});slow.observer.emit(true);await tick();check(!slow.video.src&&slow.video.playCalls===0,effectiveType+' avoids media loading and autoplay')}
 const c=setup();check(!c.video.src&&c.video.playCalls===0,'footage stays unloaded until it is visible');c.observer.emit(true);await tick();check(!c.video.paused&&c.classes.has('video-playing'),'visible footage autoplays without a control button');check(c.video.muted&&c.video.defaultMuted,'automatic playback is muted');
 c.observer.emit(false);await tick();check(c.video.paused,'offscreen footage pauses');c.observer.emit(true);await tick();check(!c.video.paused,'visible footage resumes automatically');
 c.doc.hidden=true;c.doc.emit('visibilitychange');await tick();check(c.video.paused,'hidden document pauses footage');c.doc.hidden=false;c.doc.emit('visibilitychange');await tick();check(!c.video.paused,'visible document resumes eligible footage');check(c.video.loadCalls===1,'visibility changes reuse the loaded media');
 const d=setup({mode:'reject'});d.observer.emit(true);await tick();check(d.video.paused&&!d.classes.has('video-playing'),'autoplay rejection retains the still fallback');d.video.mode='auto';d.observer.emit(false);d.observer.emit(true);await tick();check(!d.video.paused&&d.classes.has('video-playing'),'a later visible transition can recover from autoplay rejection');
 d.video.error=new Error('network failure');d.video.emit('error');await tick();check(d.video.paused&&!d.classes.has('video-playing'),'media errors pause playback and restore the still fallback');d.observer.emit(false);d.observer.emit(true);await tick();check(!d.video.paused&&d.video.loadCalls===2,'a later visible transition reloads failed media');
 const race=setup({mode:'pending'});race.observer.emit(true);race.observer.emit(true);check(race.pending.length>0,'asynchronous playback is exercised');for(const attempt of race.pending)attempt.resolve();await tick();check(!race.video.paused,'stale play completions do not pause current playback');
 const rejected=setup({mode:'pending'});rejected.observer.emit(true);rejected.video.mode='auto';rejected.observer.emit(true);await tick();rejected.pending[0].reject(new Error('stale failure'));await tick();check(!rejected.video.paused&&rejected.classes.has('video-playing'),'a stale rejected promise does not replace successful playback with the fallback');
 for(const hidden of [false,true]){const waiting=setup({mode:'pending'});waiting.observer.emit(true);if(hidden){waiting.doc.hidden=true;waiting.doc.emit('visibilitychange')}else waiting.observer.emit(false);for(const attempt of waiting.pending)attempt.resolve();await tick();check(waiting.video.paused,hidden?'pending playback stays paused after the document hides':'pending playback stays paused after footage leaves view')}
 console.log(JSON.stringify({videoStatesPassed:passed}));
})().catch(error=>{console.error(error);process.exitCode=1});
