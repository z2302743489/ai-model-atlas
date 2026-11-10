// Runtime UI. Data constants are generated before this script from src/data/.
'use strict';
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeURL=u=>/^https:\/\//.test(u)?esc(u):'#';
const ext=(u,label)=>`<a href="${safeURL(u)}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗</a>`;
const brandLogo=b=>`<img class="vendor-logo" src="${esc(ICONS[b.id]||b.logo)}" alt="${esc(b.name)} 图标" width="32" height="32">`;
const allModels=DATA.flatMap(b=>b.models.map(m=>({...m,brand:b})));
const state={filter:'all',region:'all',search:'',view:'overview',brandId:'',modelName:''};
const VIEW_TITLES={overview:'模型总览',ranking:'Arena 排名',pricing:'套餐与额度',table:'型号对比',guide:'场景选型',region:'接入与部署',risks:'风险与边界',sources:'来源与更新',brand:'品牌与型号'};
let applyingRoute=false,lastRouteHash='';
const mobileNavigation=()=>window.innerWidth<=860;
function setMobileNavigation(open,{restoreFocus=true}={}){
 const nav=$('sidenav'),toggle=$('menu-toggle'),scrim=$('nav-scrim');
 const visible=Boolean(open&&mobileNavigation());
 nav.classList.toggle('mobile-open',visible);nav.inert=mobileNavigation()&&!visible;
 toggle.setAttribute('aria-expanded',String(visible));toggle.setAttribute('aria-label',visible?'关闭导航':'打开导航');
 if(scrim)scrim.hidden=!visible;
 $('main').inert=visible;document.body.classList.toggle('nav-open',visible);
 if(visible)nav.querySelector('button, a[href]')?.focus();
 else if(restoreFocus&&mobileNavigation())toggle.focus({preventScroll:true});
}
function syncOverviewControls(){
 if($('search-input').value!==state.search)$('search-input').value=state.search;
 document.querySelectorAll('[data-f]').forEach(n=>{const on=n.dataset.f===state.filter;n.classList.toggle('on',on);n.setAttribute('aria-pressed',String(on));});
 document.querySelectorAll('[data-region]').forEach(n=>{const on=n.dataset.region===state.region;n.classList.toggle('on',on);n.setAttribute('aria-pressed',String(on));});
}
function routeHash(){
 const p=new URLSearchParams();let path=state.view;
 if(state.view==='brand'){path='brand/'+encodeURIComponent(state.brandId);if(state.modelName)p.set('model',state.modelName);}
 if(state.view==='overview'){if(state.search)p.set('q',state.search);if(state.filter!=='all')p.set('f',state.filter);if(state.region!=='all')p.set('region',state.region);}
 if(state.view==='ranking'){
  path='ranking/'+encodeURIComponent(rankState.board);
  if(rankState.query)p.set('q',rankState.query);if(rankState.organization!=='all')p.set('org',rankState.organization);
  if(rankState.onlyGuide)p.set('guide','1');if(rankState.sort!=='rank')p.set('sort',rankState.sort);
 }
 if(state.view==='pricing'){
  path='pricing/'+encodeURIComponent(priceState.brand);
  if(priceState.query)p.set('q',priceState.query);if(priceState.kind!=='all')p.set('kind',priceState.kind);
  if(priceState.currency!=='all')p.set('currency',priceState.currency);if(priceState.billing!=='monthly')p.set('billing',priceState.billing);
 }
 if(state.view==='table'){if($('table-type').value!=='text')p.set('type',$('table-type').value);if($('table-region').value!=='all')p.set('region',$('table-region').value);}
 return '#'+path+(p.size?'?'+p.toString():'');
}
function rememberRouteScroll(){
 if(applyingRoute)return;
 history.replaceState({...history.state,guideRoute:true,scrollTop:$('main').scrollTop},'',location.hash||'#overview');
}
function syncRoute(mode='replace'){
 if(applyingRoute||mode==='none')return;
 const hash=routeHash(),method=mode==='push'&&hash!==location.hash?'pushState':'replaceState';
 history[method]({...history.state,guideRoute:true,scrollTop:$('main').scrollTop},'',hash);lastRouteHash=hash;
}
function focusView(view,modelName=''){
 let target;
 if(view==='brand'&&modelName){const b=DATA.find(b=>b.id===state.brandId),i=b?.models.findIndex(m=>m.name===modelName);if(i>=0)target=$('model-'+i)?.querySelector('h3');}
 target=target||$('panel-'+view)?.querySelector('h1')||$('view-title');
 if(target){target.tabIndex=-1;target.focus({preventScroll:true});}
}
function mediaType(m){
  const k=m.kind;
  if(/预训练|基座/.test(k))return 'base';
  if(/文档识别|OCR/.test(k))return 'document';
  if(/视频生成|视频编辑/.test(k))return 'video';
  if(/图像生成|图像.*编辑|图像.*开放|矢量|动漫|插画/.test(k))return 'image';
  if(/语音|音乐/.test(k))return 'audio';
  return 'text';
}
function isOpen(m){return /开放权重/.test(m.openness)&&!/(未|不|此来源未提供|不等同|并非全系列).{0,5}开放权重/.test(m.openness);}
function matchesFilter(m,f){
  const t=mediaType(m),s=[m.name,m.kind,...m.features,m.useCase].join(' ');
  if(f==='all')return true;
  if(['image','video','audio'].includes(f))return t===f;
  if(f==='text')return t==='text';
  if(f==='document')return t==='document'||/文档|OCR/.test(s);
  if(f==='coding')return t==='text'&&/代码|编程|编码|软件工程|Agent/i.test(s);
  if(f==='reasoning')return t==='text'&&/推理|思考/.test(s);
  if(f==='chinese')return /中文|中英文|多语言|多語/.test(s);
  if(f==='opensource')return isOpen(m);
  if(f==='cheap')return /\b(Luna|Flash|Small|mini|Turbo|Highspeed)\b/i.test(m.name)&&t!=='base';
  return false;
}
function matchedModels(b){
  const q=state.search.toLowerCase().trim();
  const brandMatch=[b.name,b.maker].join(' ').toLowerCase().includes(q);
  return b.models.filter(m=>matchesFilter({...m,brand:b},state.filter)&&(!q||brandMatch||[m.name,m.kind,...m.features,m.useCase,m.context,m.openness].join(' ').toLowerCase().includes(q)));
}
function activate(view,id,{resetScroll=true,focus=true}={}){
  state.view=view;
  document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('on',p.id==='panel-'+view));
  document.querySelectorAll('[data-view]').forEach(n=>{n.classList.toggle('active',n.dataset.view===view);n.setAttribute('aria-current',n.dataset.view===view?'page':'false');});
  document.querySelectorAll('.nav-item').forEach(n=>{n.classList.toggle('active',n.dataset.id===id);n.setAttribute('aria-current',n.dataset.id===id?'page':'false');});
  if(resetScroll)$('main').scrollTop=0;
  setMobileNavigation(false,{restoreFocus:false});
  if($('view-title'))$('view-title').textContent=view==='brand'?(DATA.find(b=>b.id===id)?.name||VIEW_TITLES.brand):VIEW_TITLES[view];
  if(focus)focusView(view,state.modelName);
}
function showView(view,{history:historyMode='push',focus=true,resetScroll=true}={}){
  if(!['overview','ranking','pricing','table','guide','region','risks','sources'].includes(view))view='overview';
  if(historyMode==='push')rememberRouteScroll();
  if(view==='overview'){syncOverviewControls();buildOverview();}
  if(view==='ranking')renderRanking(true);
  if(view==='pricing')renderPricing(true);
  if(view==='table')buildTable();
  state.modelName='';activate(view,undefined,{resetScroll,focus});syncRoute(historyMode);
}
function buildNav(){
  for(const r of ['cn','us'])$('nav-'+r).innerHTML=DATA.filter(b=>(b.region==='cn'?'cn':'us')===r).map(b=>`<button class="nav-item" data-id="${b.id}" aria-label="查看${esc(b.name)}"><span class="nav-icon" style="background:${b.color}15">${brandLogo(b)}</span><span><span class="nav-name">${esc(b.name)}</span><span class="nav-sub" style="display:block">${esc(b.maker)}</span></span></button>`).join('');
  document.querySelectorAll('.nav-item').forEach(n=>n.addEventListener('click',()=>showBrand(n.dataset.id)));
}
function buildOverview(){
  let count=0,models=0;
  const cards=DATA.map(b=>{
    if(state.region!=='all'&&b.region!==state.region)return '';
    const matched=matchedModels(b);if(!matched.length)return '';
    count++;models+=matched.length;
    const preview=state.filter!=='all'||state.search;
    return `<article class="ov-card" tabindex="0" role="button" aria-label="查看${esc(b.name)}的模型特点" data-id="${b.id}" data-model="${preview?esc(matched[0].name):''}" style="--card-accent:${b.color};border-top-color:${b.color}">
      <div class="ov-top"><div class="ov-icon" style="background:${b.color}12">${brandLogo(b)}</div><div><h2 class="ov-name">${esc(b.name)}</h2><div class="ov-maker">${esc(b.maker)}</div></div><span class="ov-badge">${esc(b.origin)}</span></div>
      <div class="ov-tagline">${esc(b.tagline)}</div><div class="ov-chips">${b.scenes.slice(0,4).map(s=>`<span class="ov-chip">${esc(s)}</span>`).join('')}</div>
      ${preview?`<div class="ov-series-preview">${matched.slice(0,3).map(m=>`<div class="ov-sp-group"><div class="ov-sp-model"><div><div class="ov-sp-mname">${esc(m.name)}</div><div class="ov-sp-mdesc">${esc(m.features.join(' · '))}</div></div></div></div>`).join('')}${matched.length>3?`<div class="ov-sp-sub">另有 ${matched.length-3} 款匹配型号</div>`:''}</div>`:`<div class="ov-models"><strong>${esc(b.models[0].name)}</strong><br>${b.models.length>1?esc(b.models[1].name):esc(b.models[0].features.join(' · '))}</div>`}
      <div class="ov-footer"><span>已核对官方资料</span><span>${preview?matched.length:b.models.length} 款型号 · 查看特点 →</span></div></article>`;
  }).join('');
  $('ov-grid').innerHTML=cards||`<div class="empty-state"><strong>没有找到匹配的模型</strong><div>试试其他型号、特点，或清空筛选条件。</div><button class="text-btn" id="clear-filters">清空全部条件</button></div>`;
  $('ov-count').textContent=`${count} / ${DATA.length} 品牌 · ${models} 款`;
  $('clear-filters')?.addEventListener('click',resetFilters);
  document.querySelectorAll('.ov-card').forEach(c=>{c.addEventListener('click',()=>showBrand(c.dataset.id,c.dataset.model));c.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showBrand(c.dataset.id,c.dataset.model);}});});
}
function resetFilters(){state.filter='all';state.region='all';state.search='';syncOverviewControls();buildOverview();syncRoute();$('search-input').focus({preventScroll:true});}
function sourceLinks(m){return m.sourceUrls.map((u,i)=>ext(u, m.sourceUrls.length===1?'官方型号资料':`官方来源 ${i+1}`)).join('');}
function renderModel(m,i){
 return `<div class="mrow" id="model-${i}"><div class="mrow-dot" style="background:var(--accent)"></div><div class="mrow-info"><div class="model-name-line"><h3 class="mrow-name">${esc(m.name)}</h3><span class="model-kind">${esc(m.kind)}</span></div><div class="model-features">${m.features.map(f=>`<span class="feature-chip">${esc(f)}</span>`).join('')}</div><div class="mrow-desc"><strong>适合：</strong>${esc(m.useCase)}<br><strong>边界：</strong>${esc(m.limits)}</div><div class="model-facts"><div><span>开放方式 / 许可</span>${esc(m.openness)}</div><div><span>上下文 / 输入输出规格</span>${esc(m.context||'官方页面未统一公布')}</div></div><div class="model-price"><strong>费用：</strong>${esc(m.price||m.pricing||'按具体接入渠道与套餐查看官方定价；自部署另计硬件与运维。')}</div>${renderModelRanks(m)}<div class="source-links">${sourceLinks(m)}</div></div></div>`;
}
function showBrand(id,modelName='',{history:historyMode='push',focus=true,resetScroll=true}={}){
 const b=DATA.find(x=>x.id===id);if(!b)return;
 if(historyMode==='push')rememberRouteScroll();
 state.brandId=id;state.modelName=b.models.some(m=>m.name===modelName)?modelName:'';
 const groups=[...new Set(b.models.map(m=>m.kind))];
 $('brand-content').innerHTML=`<button class="back-link" id="back-overview">← 返回品牌总览</button><div class="brand-hero"><div class="brand-hero-icon" style="background:${b.color}12">${brandLogo(b)}</div><div><h1 class="brand-hero-name" style="color:${b.color}">${esc(b.name)}</h1><div class="brand-hero-maker">${esc(b.maker)} · ${esc(b.origin)}</div><p class="brand-hero-tagline">${esc(b.tagline)}</p></div><div class="brand-hero-right"><span class="brand-status">✓ 官方资料核对 · ${CHECKED}</span><div class="scene-chips">${b.scenes.map(s=>`<span class="chip">${esc(s)}</span>`).join('')}</div></div></div>${renderBrandPricingSummary(b)}<div class="abilities-section"><div class="abilities-title">特点标签 · 逐型号查看具体能力与边界</div><div class="abilities">${[...new Set(b.models.flatMap(m=>m.features))].slice(0,8).map(f=>`<span class="feature-chip">${esc(f)}</span>`).join('')}</div></div><div class="series-section"><div class="series-title">代表型号与特点 · 点击分类可收起</div><div class="series-groups">${groups.map(k=>`<details class="sgroup" open><summary class="sgroup-header"><span class="sgroup-dot" style="background:${b.color}"></span><span class="sgroup-name">${esc(k)}</span><span class="sgroup-count">${b.models.filter(m=>m.kind===k).length} 款</span></summary><div class="sgroup-body">${b.models.map((m,i)=>m.kind===k?renderModel(m,i):'').join('')}</div></details>`).join('')}</div></div><details class="brand-notes" open><summary>本次更新与纠错 · ${b.notes.length} 项</summary><ul>${b.notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul><div class="source-links">${b.sources.map((s,i)=>ext(s.url,sourceTitle(s,i))).join('')}</div></details>`;
 $('back-overview').addEventListener('click',()=>showView('overview'));
 bindRankLinks($('brand-content'));
 bindPricingLinks($('brand-content'));
 activate('brand',id,{resetScroll,focus:false});
 if(state.modelName&&resetScroll){const i=b.models.findIndex(m=>m.name===state.modelName);if(i>=0)$('model-'+i).scrollIntoView({block:'start'});}
 if(focus)focusView('brand',state.modelName);syncRoute(historyMode);
}
function enhanceScrollableTables(root=document){
 root.querySelectorAll('.table-wrap, .rank-table-wrap, .pricing-table-wrap').forEach(n=>{
  n.tabIndex=0;n.setAttribute('role','region');
  const label=n.classList.contains('rank-table-wrap')?'Arena 排名表':n.classList.contains('pricing-table-wrap')?'厂商套餐比较表':'模型规格比较表';
  n.setAttribute('aria-label',label+'，可左右滚动');
 });
}
function sourceTitle(s,i){return /官方资料 \d+$/.test(s.title)?`${new URL(s.url).hostname} · 资料 ${i+1}`:s.title;}
function buildTable(){
 const type=$('table-type').value,region=$('table-region').value;
 const rows=allModels.filter(m=>(region==='all'||m.brand.region===region)&&(type==='all'||mediaType(m)===type));
 $('table-count').textContent=`${rows.length} 款型号 · 相同来源数据`;
 $('compare-body').innerHTML=rows.map(m=>`<tr><td><div class="table-brand">${brandLogo(m.brand)}${esc(m.brand.name)}</div><small>${esc(m.kind)}</small></td><td><button class="model-link" data-id="${m.brand.id}" data-model="${esc(m.name)}">${esc(m.name)} →</button></td><td><div class="table-features">${m.features.map(f=>`<span class="feature-chip">${esc(f)}</span>`).join('')}</div></td><td>${esc(m.useCase)}</td><td>${esc(m.limits)}</td><td class="table-open">${esc(m.openness)}</td><td>${esc(m.context)}</td><td>${esc(m.price||m.pricing||'按渠道 / 套餐查看官方定价')}<div class="source-links">${ext(m.sourceUrls[0],'规格与定价入口')}</div></td><td>${renderModelRanks(m,true)}</td></tr>`).join('')||'<tr><td colspan="9">此条件下没有收录型号，请选择其他类型。</td></tr>';
 document.querySelectorAll('.model-link').forEach(n=>n.addEventListener('click',()=>showBrand(n.dataset.id,n.dataset.model)));
 bindRankLinks($('compare-body'));
 enhanceScrollableTables();
}
const GUIDES=[
 ['国内日常对话',['doubao','qwen','kimi'],'text','中文指令遵循、语气、拒答与真实响应时间'],
 ['企业文本工作流',['qwen','deepseek','ernie'],'text','结构化输出正确率、工具调用成功率和数据流向'],
 ['出海知识产品',['gpt','claude','gemini'],'text','目标语言、地区准入、调用延迟和真实任务成本'],
 ['代码开发 / Agent',['claude','gpt','glm'],'text','仓库任务通过率、多步工具可靠性和人工返工量'],
 ['复杂推理与分析',['deepseek','gpt','qwen'],'text','可验证答案正确率、推理预算和失败恢复'],
 ['长文档阅读',['kimi','gemini','llama'],'text','跨段检索准确率、证据引用和长输入费用'],
 ['国内图像生产',['doubao','qwen','kling'],'image','文字准确率、参考图保持程度和单张交付成本'],
 ['概念设计与插画',['midjourney','flux'],'image','风格一致性、可编辑性和返工轮数'],
 ['海报 / 图中文字',['ideogram','qwen','doubao'],'image','小字可读性、版式和多语言文字准确率'],
 ['短视频与分镜',['kling','doubao','gemini'],'video','主体一致性、运动、音画与每秒成片成本'],
 ['已有视频编辑',['runway','kling','flux'],'video','局部修改、镜头保持和输入素材限制'],
 ['实时语音助手',['elevenlabs','gpt'],'audio','端到端延迟、打断处理和不同语言自然度'],
 ['歌曲与创意配乐',['suno'],'audio','创作控制、可编辑性、额度与输出使用条款'],
 ['IDE 代码补全',['mistral','gpt'],'text','补全采纳率、端到端延迟和语言覆盖'],
 ['扫描件 / PDF 解析',['mistral','gemini'],'document','表格与阅读顺序、坐标/结构保真和每页成本'],
 ['开放权重部署',['deepseek','glm','llama'],'open','权重许可、总显存、吞吐和维护成本'],
 ['高频简单任务',['gpt','glm','mistral'],'cheap','每次成功任务成本、并发、缓存与失败重试'],
 ['多供应商工作流',['qwen','gpt','claude'],'text','版本锁定、工具格式兼容与故障切换']
];
function guideCandidates(ids,type,title){
 const specific={
  '已有视频编辑':{runway:/Aleph 2\.0/},
  'IDE 代码补全':{mistral:/Codestral/,gpt:/GPT-6\.1 Sol/},
  '实时语音助手':{elevenlabs:/v4 Turbo/,gpt:/GPT-Live/},
  '长文档阅读':{llama:/Llama 4 Scout/}
 };
 return ids.map(id=>{const b=DATA.find(b=>b.id===id);if(!b)return null;let m;const required=specific[title]?.[id];if(required)m=b.models.find(m=>required.test(m.name));else if(type==='open')m=b.models.find(isOpen);else if(type==='cheap')m=b.models.find(m=>/\b(Luna|Flash|Small)\b/.test(m.name));else if(type==='document')m=b.models.find(m=>mediaType(m)==='document')||b.models.find(m=>mediaType(m)==='text');else m=b.models.find(m=>mediaType(m)===type);return m?{b,m}:null;}).filter(Boolean).slice(0,3);
}
function buildGuides(){
 $('guide-grid').innerHTML=GUIDES.map((g,i)=>{const cs=guideCandidates(g[1],g[2],g[0]);return `<article class="gcard" style="--gc:${cs[0]?.b.color||'#5a44f0'}"><div class="gscen">场景 ${String(i+1).padStart(2,'0')}</div><h2 class="gtitle">${g[0]}</h2>${cs.map(c=>`<button class="grec guide-candidate" data-brand="${c.b.id}" data-model="${esc(c.m.name)}" aria-label="查看${esc(c.m.name)}的特点与边界"><span class="grank">候选</span><span>${esc(c.m.name)}</span><span aria-hidden="true">↗</span></button>`).join('')}<div class="guide-eval"><strong>重点验证：</strong>${g[3]}</div></article>`;}).join('');
 document.querySelectorAll('.guide-candidate').forEach(n=>n.addEventListener('click',()=>showBrand(n.dataset.brand,n.dataset.model)));
}
function buildSources(){
 const urls=[...new Set(DATA.flatMap(b=>[...b.sources.map(s=>s.url),...b.models.flatMap(m=>m.sourceUrls)]))];
 $('source-stats').textContent=`${DATA.length} 个品牌 · ${allModels.length} 款代表型号 · ${urls.length} 个官方来源 · 核验 ${CHECKED}`;
 $('source-cards').innerHTML=DATA.map(b=>{
  const sources=new Map(b.sources.map(s=>[s.url,s.title]));b.models.forEach(m=>m.sourceUrls.forEach(u=>{if(!sources.has(u))sources.set(u,m.name+' 官方规格');}));
  return `<article class="source-card" style="--card-accent:${b.color}"><h3>${brandLogo(b)} ${esc(b.name)}</h3><small>核验：${CHECKED} · ${b.models.length} 款代表型号</small><div class="source-links">${[...sources].map(([u,t],i)=>ext(u,sourceTitle({title:t,url:u},i))).join('')}</div><ul>${b.notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul></article>`;
 }).join('');
}
const rankState={board:'text',query:'',organization:'all',onlyGuide:false,sort:'rank'};
const numberFormat=n=>Number.isFinite(n)?n.toLocaleString('en-US'):'未公布';
function scoreLabel(board,row){return board.id==='agent'?Number(row.score).toFixed(2)+'%':numberFormat(row.score);}
function organizationId(name){return {'OpenAI':'gpt','Anthropic':'claude','Google':'gemini','Meta':'llama','Alibaba':'qwen','Alibaba-ATH':'qwen','Bytedance':'doubao','ByteDance':'doubao','Baidu':'ernie','Moonshot':'kimi','KlingAI':'kling','Runway':'runway','Black Forest Labs':'flux','Microsoft AI':'microsoft','SpaceXAI':'xai','Reve':'reve','MiniMax':'minimax','Skywork':'skywork','HiDream':'hidream'}[name];}
function organizationLogo(name){const id=organizationId(name);return ICONS[id]?`<img class="vendor-logo" src="${esc(ICONS[id])}" alt="${esc(name)} 图标" width="28" height="28">`:`<span class="vendor-wordmark">${esc(name)}</span>`;}
function rankingsForModel(m){return RANKINGS.boards.flatMap(board=>board.rows.filter(r=>r.guideModelName===m.name).map(row=>({board,row})));}
function renderModelRanks(m,compact=false){
 const matches=rankingsForModel(m);
 if(!matches.length)return `<div class="arena-model-ranks"><span class="arena-unmatched">本次榜单摘录暂无名称关联记录</span></div>`;
 const shown=matches.slice(0,compact?2:4);
 return `<div class="arena-model-ranks"><div class="arena-model-label">Arena 参测记录${compact?'':' · 按型号名称关联，具体配置见下方'}</div>${shown.map(({board,row})=>`<button class="arena-result" data-rank-board="${board.id}" data-rank-model="${esc(row.model)}"><strong>${esc(board.shortTitle)} #${row.rank}</strong><span>${esc(row.model)} · ${scoreLabel(board,row)}</span></button>`).join('')}${matches.length>shown.length?`<span class="arena-unmatched">另有 ${matches.length-shown.length} 条分类 / 配置记录</span>`:''}</div>`;
}
function bindRankLinks(root){root.querySelectorAll('[data-rank-board]').forEach(n=>n.addEventListener('click',()=>{rankState.board=n.dataset.rankBoard;rankState.query=n.dataset.rankModel||'';rankState.organization='all';rankState.onlyGuide=false;rankState.sort='rank';showView('ranking');}));}
function filteredRankRows(board){
 const q=rankState.query.toLowerCase().trim();
 const rows=board.rows.filter(row=>(!q||[row.model,row.organization].join(' ').toLowerCase().includes(q))&&(rankState.organization==='all'||rankState.organization===row.organization)&&(!rankState.onlyGuide||Boolean(row.guideModelName)));
 if(rankState.sort==='votes')rows.sort((a,b)=>(b.votes??-1)-(a.votes??-1)||a.rank-b.rank);
 else if(rankState.sort==='score')rows.sort((a,b)=>b.score-a.score||a.rank-b.rank);
 else rows.sort((a,b)=>a.rank-b.rank);
 return rows;
}
function renderRanking(syncControls=false){
 const board=RANKINGS.boards.find(x=>x.id===rankState.board)||RANKINGS.boards[0];rankState.board=board.id;
 document.querySelectorAll('[data-board]').forEach(n=>{const on=n.dataset.board===board.id;n.classList.toggle('on',on);n.setAttribute('aria-pressed',String(on));});
 $('rank-board-title').textContent=board.shortTitle;
 $('rank-board-description').textContent=board.metricDescription;
 $('rank-updated').textContent=board.updatedAt;
 $('rank-checked').textContent=board.checkedAt;
 $('rank-metric').textContent=board.id==='agent'?'净提升 Net Improvement':'Arena Score';
 $('rank-coverage').textContent=`摘录前 ${board.rows.length} 条${board.totalModels?' / 全榜 '+numberFormat(board.totalModels)+' 个型号':''}`;
 $('rank-original').href=board.sourceUrl;
 $('rank-score-header').textContent=board.id==='agent'?'净提升 %':'Arena Score';
 $('rank-samples-header').textContent=board.id==='agent'?'会话数':'投票数';
 $('rank-snapshot').textContent=`官方分类榜 · ${board.updatedAt} 更新 · 本次读取 ${board.checkedAt} · 静态快照`;
 const orgs=[...new Set(board.rows.map(r=>r.organization))].sort();
 if(!orgs.includes(rankState.organization))rankState.organization='all';
 $('rank-organization').innerHTML='<option value="all">全部厂商</option>'+orgs.map(org=>`<option value="${esc(org)}">${esc(org)}</option>`).join('');
 $('rank-organization').value=rankState.organization;
 if(syncControls){$('rank-query').value=rankState.query;$('rank-only-guide').checked=rankState.onlyGuide;$('rank-sort').value=rankState.sort;}
 const rows=filteredRankRows(board);
 $('rank-result-count').textContent=`显示 ${rows.length} / ${board.rows.length} 条 · 保留原榜名次`;
 const filtered=rankState.query||rankState.organization!=='all'||rankState.onlyGuide||rankState.sort!=='rank';
 $('rank-leaders').hidden=Boolean(filtered);
 $('rank-leaders').innerHTML=board.rows.slice(0,3).map(row=>`<article class="rank-leader"><div class="rank-leader-head"><span class="rank-medal place-${row.rank}">#${row.rank}</span><span class="rank-leader-org">${organizationLogo(row.organization)}${esc(row.organization)}</span></div><h2>${esc(row.model)}</h2><div class="rank-leader-score">${scoreLabel(board,row)}<small>${esc(row.ci||'')}</small></div><div class="rank-leader-meta">${numberFormat(row.votes)} ${board.id==='agent'?'会话':'票'}${row.preliminary?' · 初步结果':''}</div></article>`).join('');
 $('rank-body').innerHTML=rows.map(row=>`<tr><td><span class="rank-position place-${row.rank<=3?row.rank:'other'}">${row.rank}</span></td><td><div class="rank-model-cell"><span class="rank-logo">${organizationLogo(row.organization)}</span><div><div class="rank-model-name">${esc(row.model)}</div><div class="rank-model-org">${esc(row.organization)} ${row.preliminary?'<span class="rank-preliminary" title="原榜标记 Preliminary">初步结果</span>':''}</div></div></div></td><td class="rank-score">${scoreLabel(board,row)}</td><td class="rank-ci">${esc(row.ci||'未提供')}</td><td class="rank-votes">${numberFormat(row.votes)}</td><td class="rank-spread">${esc(row.rankSpread||'未摘录')}</td><td>${row.guideModelName?`<button class="rank-guide-link" data-guide-brand="${row.guideBrandId}" data-guide-model="${esc(row.guideModelName)}">查看型号档案 →</button><span class="rank-related">按名称关联 · 保留本行配置</span>`:'<span class="rank-related">仅收录榜单条目</span>'}</td></tr>`).join('')||'<tr><td colspan="7"><div class="rank-empty">当前摘录中没有匹配记录。<br><button class="text-btn" id="rank-clear">清空排名筛选</button></div></td></tr>';
 $('rank-clear')?.addEventListener('click',()=>clearRankFilters());
 $('rank-body').querySelectorAll('[data-guide-brand]').forEach(n=>n.addEventListener('click',()=>showBrand(n.dataset.guideBrand,n.dataset.guideModel)));
 $('rank-summary').textContent=`本页提供 ${RANKINGS.boards.length} 个分类榜、${RANKINGS.boards.reduce((n,b)=>n+b.rows.length,0)} 条参测记录。未摘录的型号不据此判断为未上榜。`;
 enhanceScrollableTables();
}
function clearRankFilters({updateRoute=true,focus=true}={}){rankState.query='';rankState.organization='all';rankState.onlyGuide=false;rankState.sort='rank';renderRanking(true);if(updateRoute)syncRoute();if(focus)$('rank-query').focus({preventScroll:true});}
function downloadArena(){
 const file=new Blob([JSON.stringify(RANKINGS,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download='Arena分类榜快照-2026-11-06.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function initRankings(){
 $('rank-categories').innerHTML=RANKINGS.boards.map(board=>`<button class="pill" data-board="${board.id}" aria-pressed="false">${esc(board.shortTitle)}</button>`).join('');
 document.querySelectorAll('[data-board]').forEach(n=>n.addEventListener('click',()=>{rankState.board=n.dataset.board;clearRankFilters({updateRoute:false,focus:false});showView('ranking');}));
 $('rank-query').addEventListener('input',e=>{rankState.query=e.target.value;renderRanking();syncRoute();});
 $('rank-organization').addEventListener('change',e=>{rankState.organization=e.target.value;renderRanking();syncRoute();});
 $('rank-only-guide').addEventListener('change',e=>{rankState.onlyGuide=e.target.checked;renderRanking();syncRoute();});
 $('rank-sort').addEventListener('change',e=>{rankState.sort=e.target.value;renderRanking();syncRoute();});
 $('rank-download').addEventListener('click',downloadArena);
 $('arena-provenance').innerHTML=RANKINGS.boards.map(b=>`<div class="arena-source-row"><strong>${esc(b.shortTitle)}</strong><span>原榜更新 ${esc(b.updatedAt)} · 摘录 ${b.rows.length} 条</span>${ext(b.sourceUrl,'查看原榜')}</div>`).join('');
 $('icon-provenance').innerHTML=`图标来自 <a href="https://github.com/lobehub/lobe-icons" target="_blank" rel="noopener noreferrer">LobeHub Icons</a> 固定版本 1.102.0，已内嵌到页面；HiDream 使用官方站点图标。<a href="${ICON_LICENSE_DOWNLOAD}" download="LobeHub-MIT-License.txt">MIT 许可 ↓</a> · <a href="${ICON_SOURCES_DOWNLOAD}" download="图标来源清单.json">图标来源清单 ↓</a>。品牌商标归各自权利人所有。`;
 renderRanking(true);
}

const priceState={brand:'all',kind:'all',billing:'monthly',currency:'all',query:''};
const PRICE_KINDS={all:'全部方案',app_subscription:'应用会员',coding_subscription:'开发者订阅',api_usage:'API 按量',self_hosted:'自部署'};
const PRICE_STATUS={verified:'已核对官方资料',contact_sales:'联系销售',not_public:'未确认公开报价',login_required:'需登录确认',not_applicable:'不适用'};
const money=(n,c)=>`${c==='CNY'?'¥':c==='USD'?'US$':(c||'')+' '}${Number(n).toLocaleString('en-US',{maximumFractionDigits:2})}`;
function planPrice(plan,billing=priceState.billing){
 if(plan.status!=='verified')return {label:PRICE_STATUS[plan.status]||'查看官方报价',unit:'',detail:plan.priceText,amount:null};
 if(plan.kind==='api_usage')return {label:'按量计费',unit:'',detail:plan.priceText,amount:null};
 if(plan.kind==='self_hosted')return {label:'资源另计',unit:'',detail:plan.priceText,amount:null};
 if(plan.monthlyPrice===0)return {label:plan.currency?money(0,plan.currency):'免费',unit:'免费档',detail:'额度和功能仍按该方案规则执行。',amount:0};
 const monthlyUnit=plan.priceUnit||'月';
 if(billing==='annual'&&Number.isFinite(plan.annualMonthlyPrice))return {label:money(plan.annualMonthlyPrice,plan.currency),unit:`/${monthlyUnit} · 年付折合`,detail:Number.isFinite(plan.annualTotal)?`一次支付 ${money(plan.annualTotal,plan.currency)} / ${plan.annualUnit||'年'}。`:'按年付方案结算，完整总额以官方报价为准。',amount:plan.annualMonthlyPrice};
 if(billing==='annual'&&Number.isFinite(plan.monthlyPrice))return {label:'未核实年付',unit:'',detail:`已核对月付参考 ${money(plan.monthlyPrice,plan.currency)} / ${monthlyUnit}；此项未确认年付价格。`,amount:null};
 if(Number.isFinite(plan.monthlyPrice))return {label:money(plan.monthlyPrice,plan.currency),unit:`/${monthlyUnit}`,detail:'按月付口径显示，首月优惠及续费条件见说明。',amount:plan.monthlyPrice};
 return {label:'查看报价',unit:'',detail:plan.priceText,amount:null};
}
function matchedPlans(brand){
 const base=DATA.find(b=>b.id===brand.id),q=priceState.query.trim().toLowerCase();
 const brandMatch=[base?.name,base?.maker].join(' ').toLowerCase().includes(q);
 return brand.plans.filter(plan=>(priceState.kind==='all'||plan.kind===priceState.kind||plan.includedKinds?.includes(priceState.kind))&&(priceState.currency==='all'||plan.currency===priceState.currency)&&(!q||brandMatch||[plan.name,plan.priceText,plan.quotaText,...plan.quotaDetails].join(' ').toLowerCase().includes(q)));
}
function planSourceLinks(plan){return [...new Set(plan.sourceUrls)].map((url,i)=>ext(url,plan.sourceUrls.length===1?'官方价格与规则':`官方依据 ${i+1}`)).join('');}
function renderPlanCard(plan){
 const price=planPrice(plan);
 return `<article class="plan-card ${plan.status==='verified'?'':'plan-unconfirmed'}"><div class="plan-card-top"><span class="plan-kind">${esc(PRICE_KINDS[plan.kind]||plan.kind)}${plan.includedKinds?.includes('coding_subscription')?' · 含开发者权益':''}</span><span class="plan-status">${esc(PRICE_STATUS[plan.status])}</span></div><h3>${esc(plan.name)}</h3><div class="plan-price"><strong>${esc(price.label)}</strong><span>${esc(price.unit)}</span></div><div class="plan-billing">${esc(price.detail)}</div><div class="plan-quota"><span>包含额度 / 计量方式</span><strong>${esc(plan.quotaText)}</strong></div>${plan.limits.length?`<div class="plan-limits"><strong>使用条件</strong><ul>${plan.limits.map(d=>`<li>${esc(d)}</li>`).join('')}</ul></div>`:''}<details class="plan-details-disclosure"><summary>额度与计费说明</summary>${plan.quotaDetails.length?`<ul class="plan-details">${plan.quotaDetails.map(d=>`<li>${esc(d)}</li>`).join('')}</ul>`:''}<div class="plan-price-note">${esc(plan.priceText)}</div></details><div class="source-links">${planSourceLinks(plan)}</div></article>`;
}
function brandPricePreview(brand){
 const plans=matchedPlans(brand);
 const subscriptions=plans.filter(p=>p.status==='verified'&&['app_subscription','coding_subscription'].includes(p.kind)&&Number.isFinite(p.monthlyPrice)&&p.monthlyPrice>0);
 const preferredKind=priceState.kind==='all'?(subscriptions.some(p=>p.kind==='app_subscription')?'app_subscription':'coding_subscription'):priceState.kind;
 const selected=subscriptions.find(p=>p.kind===preferredKind||p.includedKinds?.includes(preferredKind));
 if(selected){const pr=planPrice(selected),hasFree=plans.some(p=>p.kind===selected.kind&&p.monthlyPrice===0&&p.status==='verified');return {label:`${PRICE_KINDS[selected.kind]}${selected.includedKinds?.includes('coding_subscription')?'（含开发者权益）':''} · ${pr.label}${pr.unit}`,plan:selected,note:`${selected.name} · 代表方案${hasFree?' · 另有免费档':''}${pr.amount===null&&priceState.billing==='annual'?` · 月付参考 ${money(selected.monthlyPrice,selected.currency)} / ${selected.priceUnit||'月'}`:''}`};}
 const free=plans.find(p=>p.kind==='app_subscription'&&p.monthlyPrice===0&&p.status==='verified');
 if(free)return {label:'应用会员 · 有免费档',plan:free,note:'额度及付费方案分别查看'};
 const api=plans.find(p=>p.kind==='api_usage'&&p.status==='verified');if(api)return {label:'API · 按量计费',plan:api,note:'按 token、图像、音频或视频等原始单位'};
 const self=plans.find(p=>p.kind==='self_hosted');if(self)return {label:'自部署 · 资源另计',plan:self,note:'权重许可与托管费用分别确认'};
 const verified=plans.find(p=>p.status==='verified');if(verified)return {label:`${PRICE_KINDS[verified.kind]} · 查看方案报价`,plan:verified,note:'已核对公开说明，具体计费与资格见详情'};
 return {label:'查看官方渠道',note:'报价与资格按各方案标注'};
}
function renderPricing(syncControls=false){
 const matched=PRICING.brands.filter(b=>(priceState.brand==='all'||b.id===priceState.brand)&&matchedPlans(b).length);
 if(syncControls){$('price-brand').value=priceState.brand;$('price-currency').value=priceState.currency;$('price-query').value=priceState.query;}
 document.querySelectorAll('[data-price-kind]').forEach(n=>{const on=n.dataset.priceKind===priceState.kind;n.classList.toggle('on',on);n.setAttribute('aria-pressed',String(on));});
 document.querySelectorAll('[data-billing]').forEach(n=>{const on=n.dataset.billing===priceState.billing;n.classList.toggle('on',on);n.setAttribute('aria-pressed',String(on));});
 const count=matched.reduce((n,b)=>n+matchedPlans(b).length,0);
 $('price-count').textContent=`${matched.length} 家厂商 · ${count} 项方案 / 计费说明`;
 $('price-current-date').textContent=`核验 ${PRICING.checkedAt} · 静态公开资料快照`;
 if(!matched.length){$('pricing-results').innerHTML='<div class="empty-state"><strong>当前条件下没有匹配的方案</strong><p>可清空搜索或切换厂商、方案类型与币种。</p><button class="text-btn" id="price-clear">清空套餐筛选</button></div>';$('price-clear').addEventListener('click',resetPricing);return;}
 if(priceState.brand==='all'){
  $('pricing-results').innerHTML=`<div class="pricing-overview-intro">选择厂商查看逐档价格、额度及限制。当前列表仅用于快速定位，原币价格不做汇率换算。</div><div class="pricing-table-wrap"><table class="pricing-table"><thead><tr><th>厂商</th><th>价格参考</th><th>额度口径示例</th><th>已整理方案</th><th>查看详情</th></tr></thead><tbody>${matched.map(b=>{const base=DATA.find(x=>x.id===b.id),plans=matchedPlans(b),preview=brandPricePreview(b);const quota=preview.plan||plans.find(p=>p.status==='verified')||plans[0];return `<tr><td><div class="pricing-company">${brandLogo(base)}<div><strong>${esc(base.name)}</strong><small>${esc(base.maker)}</small></div></div></td><td><strong class="pricing-preview-price">${esc(preview.label)}</strong><small>${esc(preview.note)}</small></td><td class="pricing-overview-quota">${esc(quota.name)}：${esc(quota.quotaText)}</td><td>${plans.length} 项<br><small>${[...new Set(plans.flatMap(p=>[PRICE_KINDS[p.kind],...(p.includedKinds||[]).map(k=>PRICE_KINDS[k])]))].map(esc).join(' / ')}</small></td><td><button class="text-btn" data-pricing-brand="${b.id}">查看套餐 →</button></td></tr>`;}).join('')}</tbody></table></div>`;
 }else{
  const b=matched[0],base=DATA.find(x=>x.id===b.id),plans=matchedPlans(b);
  $('pricing-results').innerHTML=`<section class="pricing-brand-detail"><div class="pricing-brand-heading"><div class="pricing-company">${brandLogo(base)}<div><h2>${esc(base.name)}</h2><p>${esc(b.regionNote)}</p></div></div><button class="text-btn" data-pricing-brand="all">← 全部厂商</button></div><div class="plan-grid">${plans.map(renderPlanCard).join('')}</div><details class="pricing-brand-notes" open><summary>核验范围与补充说明</summary><ul>${b.notes.map(n=>`<li>${esc(n)}</li>`).join('')}</ul><div class="source-links">${b.sources.map(s=>ext(s.url,s.title)).join('')}</div></details></section>`;
 }
 bindPricingLinks($('pricing-results'),{preserveFilters:true});
 enhanceScrollableTables($('pricing-results'));
}
function openPricing(id,{preserveFilters=false}={}){priceState.brand=id;if(!preserveFilters){priceState.query='';priceState.currency='all';priceState.kind='all';}showView('pricing');}
function bindPricingLinks(root,options={}){root.querySelectorAll('[data-pricing-brand]').forEach(n=>n.addEventListener('click',()=>openPricing(n.dataset.pricingBrand,options)));}
function resetPricing(){Object.assign(priceState,{brand:'all',kind:'all',currency:'all',billing:'monthly',query:''});renderPricing(true);syncRoute();$('price-query').focus({preventScroll:true});}
function renderBrandPricingSummary(brand){
 const record=PRICING.brands.find(b=>b.id===brand.id);if(!record)return '';
 return `<div class="brand-pricing-summary"><div><strong>套餐价格与使用额度</strong><span>${record.plans.length} 项方案 / 计费说明 · 应用、开发者套餐与 API 分开标注</span></div><button class="text-btn" data-pricing-brand="${brand.id}">查看 ${esc(brand.name)} 套餐 →</button></div>`;
}
function initPricing(){
 $('price-brand').innerHTML='<option value="all">全部厂商 · 总览</option>'+DATA.map(b=>`<option value="${b.id}">${esc(b.name)}</option>`).join('');
 $('price-kind-filters').innerHTML=Object.entries(PRICE_KINDS).map(([key,title])=>`<button class="pill" data-price-kind="${key}" aria-pressed="false">${title}</button>`).join('');
 document.querySelectorAll('[data-price-kind]').forEach(n=>n.addEventListener('click',()=>{priceState.kind=n.dataset.priceKind;renderPricing();syncRoute();}));
 document.querySelectorAll('[data-billing]').forEach(n=>n.addEventListener('click',()=>{priceState.billing=n.dataset.billing;renderPricing();syncRoute();}));
 $('price-brand').addEventListener('change',e=>{priceState.brand=e.target.value;showView('pricing',{resetScroll:false,focus:false});});
 $('price-currency').addEventListener('change',e=>{priceState.currency=e.target.value;renderPricing();syncRoute();});
 $('price-query').addEventListener('input',e=>{priceState.query=e.target.value;renderPricing();syncRoute();});
 $('price-download').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(PRICING,null,2)],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='AI套餐价格额度-2026-11-06.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 $('pricing-provenance').innerHTML=PRICING.brands.map(record=>{const base=DATA.find(b=>b.id===record.id);return `<div class="pricing-source"><strong>${esc(base.name)}</strong><small>核验 ${record.checkedAt} · ${record.plans.length} 项</small><div class="source-links">${record.sources.map(s=>ext(s.url,s.title)).join('')}</div></div>`;}).join('');
 const priceSources=new Set(PRICING.brands.flatMap(b=>[...b.sources.map(s=>s.url),...b.plans.flatMap(p=>p.sourceUrls)]));
 $('source-stats').textContent+=` · ${priceSources.size} 个套餐报价来源`;
 renderPricing(true);
}

function applyLocationRoute({initial=false}={}){
 if(location.hash==='#main'){lastRouteHash=location.hash;$('main').focus({preventScroll:true});return;}
 const raw=location.hash.slice(1)||'overview',[path,query='']=raw.split('?'),params=new URLSearchParams(query);
 let parts;try{parts=path.split('/').map(decodeURIComponent);}catch{parts=['overview'];}
 const view=Object.hasOwn(VIEW_TITLES,parts[0])?parts[0]:'overview',valid=(v,values,fallback)=>values.includes(v)?v:fallback;
 const previousScroll=history.state?.guideRoute?history.state.scrollTop:null;
 applyingRoute=true;
 try{
  if(view==='overview')Object.assign(state,{filter:valid(params.get('f'),['all','coding','chinese','image','video','audio','reasoning','cheap','opensource'],'all'),region:valid(params.get('region'),['all','cn','us'],'all'),search:params.get('q')||''});
  if(view==='ranking'){
   rankState.board=valid(parts[1],RANKINGS.boards.map(b=>b.id),'text');
   const board=RANKINGS.boards.find(b=>b.id===rankState.board)||RANKINGS.boards[0];
   Object.assign(rankState,{board:board.id,query:params.get('q')||'',organization:valid(params.get('org'),board.rows.map(r=>r.organization),'all'),onlyGuide:params.get('guide')==='1',sort:valid(params.get('sort'),['rank','score','votes'],'rank')});
  }
  if(view==='pricing')Object.assign(priceState,{brand:valid(parts[1],['all',...PRICING.brands.map(b=>b.id)],'all'),kind:valid(params.get('kind'),Object.keys(PRICE_KINDS),'all'),billing:valid(params.get('billing'),['monthly','annual'],'monthly'),currency:valid(params.get('currency'),['all','USD','CNY'],'all'),query:params.get('q')||''});
  if(view==='table'){$('table-type').value=valid(params.get('type'),['text','image','video','audio','document','base','all'],'text');$('table-region').value=valid(params.get('region'),['all','cn','us'],'all');}
  const options={history:'none',focus:!initial,resetScroll:initial};
  if(view==='brand'&&DATA.some(b=>b.id===parts[1]))showBrand(parts[1],params.get('model')||'',options);
  else showView(view==='brand'?'overview':view,options);
  if(Number.isFinite(previousScroll)&&!initial)$('main').scrollTop=previousScroll;
 }finally{applyingRoute=false;}
 syncRoute('replace');
}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();showView(b.dataset.view);}));
document.querySelectorAll('a[href="#main"]').forEach(link=>link.addEventListener('click',e=>{e.preventDefault();$('main').focus({preventScroll:true});}));
document.querySelectorAll('[data-f]').forEach(b=>b.addEventListener('click',()=>{state.filter=b.dataset.f;syncOverviewControls();buildOverview();syncRoute();}));
document.querySelectorAll('[data-region]').forEach(b=>b.addEventListener('click',()=>{state.region=b.dataset.region;syncOverviewControls();buildOverview();syncRoute();}));
$('search-input').addEventListener('input',e=>{
 state.search=e.target.value;state.filter='all';state.region='all';
 if(state.view!=='overview')showView('overview',{history:'push',focus:false});
 else{syncOverviewControls();buildOverview();syncRoute();}
});
$('table-type').addEventListener('change',()=>{buildTable();syncRoute();});$('table-region').addEventListener('change',()=>{buildTable();syncRoute();});
$('menu-toggle').addEventListener('click',()=>setMobileNavigation(!$('sidenav').classList.contains('mobile-open')));
$('nav-close')?.addEventListener('click',()=>setMobileNavigation(false));
$('nav-scrim')?.addEventListener('click',()=>setMobileNavigation(false));
$('main').addEventListener('click',()=>{if(mobileNavigation()&&$('sidenav').classList.contains('mobile-open'))setMobileNavigation(false,{restoreFocus:false});});
document.addEventListener('keydown',e=>{
 if(!mobileNavigation()||!$('sidenav').classList.contains('mobile-open'))return;
 if(e.key==='Escape'){e.preventDefault();setMobileNavigation(false);return;}
 if(e.key==='Tab'){
  const items=[...$('sidenav').querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex="0"]')].filter(n=>!n.hidden&&(!n.getClientRects||n.getClientRects().length>0));
  const index=items.indexOf(document.activeElement),next=e.shiftKey?(index<=0?items.length-1:index-1):(index<0||index===items.length-1?0:index+1);
  e.preventDefault();items[next]?.focus();
 }
});
window.addEventListener('resize',()=>{if(!mobileNavigation())setMobileNavigation(false,{restoreFocus:false});else $('sidenav').inert=!$('sidenav').classList.contains('mobile-open');});
window.addEventListener('popstate',()=>applyLocationRoute());
window.addEventListener('hashchange',()=>{if(location.hash!==lastRouteHash)applyLocationRoute();});
document.querySelectorAll('[data-show-sources]').forEach(n=>n.addEventListener('click',e=>{e.preventDefault();showView('sources');}));
document.querySelector('[download]').addEventListener('click',e=>{
 e.preventDefault();
 const file=new Blob([JSON.stringify({checkedAt:CHECKED,scope:'官方公开资料、Arena分类榜与套餐报价；静态快照',brands:DATA,arena:RANKINGS,pricing:PRICING},null,2)],{type:'application/json;charset=utf-8'});
 const url=URL.createObjectURL(file),a=document.createElement('a');a.href=url;a.download='AI模型核验数据-'+CHECKED+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
if(!$('main').hasAttribute('tabindex'))$('main').tabIndex=-1;
$('search-input').placeholder='搜索品牌、型号、特点…';$('search-input').setAttribute('aria-label','搜索全部品牌、型号和特点');
buildNav();buildOverview();buildTable();buildGuides();buildSources();initRankings();initPricing();
enhanceScrollableTables();setMobileNavigation(false,{restoreFocus:false});applyLocationRoute({initial:true});

// Interface preferences stay on this device. No analytics are sent for these preferences.
const themeButton=document.getElementById('theme-toggle');
const themeIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M20.7 13A8.8 8.8 0 0 1 11 3.3 8.8 8.8 0 1 0 20.7 13Z"/></svg>';
function applyTheme(theme){document.documentElement.dataset.theme=theme;themeButton.setAttribute('aria-pressed',String(theme==='dark'));themeButton.setAttribute('aria-label',theme==='dark'?'切换浅色外观':'切换深色外观');themeButton.innerHTML=themeIcon;}
let savedTheme;try{savedTheme=localStorage.getItem('atlas-theme');}catch{}
applyTheme(['dark','light'].includes(savedTheme)?savedTheme:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
themeButton.addEventListener('click',()=>{const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';applyTheme(theme);try{localStorage.setItem('atlas-theme',theme);}catch{}});
document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();document.getElementById('search-input').focus();}});
document.getElementById('search-shortcut').textContent=/Mac|iPhone|iPad/.test(navigator.platform)?'⌘ K':'Ctrl K';
document.querySelector('.skip-link').addEventListener('click',()=>{document.getElementById('main').focus({preventScroll:true});});

// Decorative footage starts only while visible and respects motion and data preferences.
(() => {
  const hero=document.querySelector('.atlas-hero');
  const video=document.getElementById('hero-video');
  if(!hero||!video)return;
  const preference=matchMedia('(prefers-reduced-motion: reduce)');
  const connection=navigator.connection;
  let visible=false,attempt=0;
  const prefersStill=()=>preference.matches||connection?.saveData||/^(slow-)?2g$/.test(connection?.effectiveType||'');
  function pause(){attempt++;video.pause();}
  async function play(){
    const ticket=++attempt;
    if(!video.src||video.error){video.src=video.dataset.src;video.load();}
    video.muted=true;video.defaultMuted=true;
    try{
      await video.play();
      if(ticket!==attempt)return;
      if(!visible||document.hidden||prefersStill())video.pause();
    }catch{
      if(ticket!==attempt)return;
      hero.classList.remove('video-playing');
    }
  }
  function sync(){
    if(!visible||document.hidden||prefersStill())pause();
    else play();
  }
  video.addEventListener('playing',()=>hero.classList.add('video-playing'));
  video.addEventListener('error',()=>{hero.classList.remove('video-playing');pause();});
  preference.addEventListener('change',sync);
  document.addEventListener('visibilitychange',sync);
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:0.05});
  observer.observe(hero);
})();
