/* ═══════════════ ① 配置区 ═══════════════ */
const AUTO_INTERVAL_MS = 4  * 60 * 60 * 1000;   // 自动抓取周期：4 小时
const SYNC_INTERVAL_MS = 90 * 1000;             // 实时追踪探测周期：90 秒
const TICKER_SECONDS   = 90;                    // 快讯滚动周期（秒）
const CACHE_KEY='gho_cache_v9', ANCHOR_KEY='gho_anchor_v9', SYNC_KEY='gho_sync_v9';

/* 通用镜像通道生成器 */
const gMirror  = (site,kw) => 'https://news.google.com/rss/search?q=site:'+site+(kw?'+':'+')+(kw||'')+'&hl=zh-CN&gl=CN&ceid=CN:zh-Hans';
const bMirror  = (site,kw) => 'https://www.bing.com/news/search?q=site%3A'+site+(kw?'+':'%20')+(kw?encodeURIComponent(kw):'')+'&format=rss';

const NEWS_SOURCES = [
  /* ═══ 新华社 · 仅展示主要领导人新闻（关键词过滤 + 定向镜像）═══ */
  { id:'xinhua', name:'新华社·要闻', cat:'政治', region:'中国', hosts:['news.cn','xinhuanet.com'],
    must:/领导人|主席|总理|常委|委员长|副主席|会见|会谈|致电|慰问电|出席|主持|署名文章|同.*举行会谈|通电话/,
    urls:[
      'http://rss.xinhuanet.com/rss/native.xml',                    // 官方·国内（时政要闻）
      'http://rss.xinhuanet.com/rss/world.xml',                     // 官方·国际
      gMirror('news.cn','领导人'),
      bMirror('news.cn','领导人'),
    ]},
  /* ═══ 央视国防军事（CCTV-7）· 军事分类专属信源 ═══ */
  { id:'cctv7', name:'央视国防军事', cat:'军事', region:'中国', hosts:['cctv.com','cntv.cn','cctv.cn'],
    urls:[
      'https://rsshub.app/cctv/lm/jsbd',                            // 《军事报道》栏目
      'https://rsshub.rssforever.com/cctv/lm/jsbd',
      'https://rsshub.dicomp.net/cctv/lm/jsbd',
      gMirror('tv.cctv.com','军事报道'),
      bMirror('tv.cctv.com','军事报道'),
    ]},
  /* ═══ 国际权威 ═══ */
  { id:'sputnik', name:'卫星通讯社', cat:'政治', region:'俄罗斯', hosts:['sputniknews.cn','sputniknews.com'],
    urls:[
      'https://sputniknews.cn/export/rss2/archive/index.xml',
      'https://rsshub.app/sputniknews/news/chinese',
      'https://rsshub.dicomp.net/sputniknews/news/chinese',
      bMirror('sputniknews.cn'),
    ]},
  { id:'nhk', name:'NHK', cat:'政治', region:'日本', hosts:['nhk.or.jp'],
    urls:[
      'https://www3.nhk.or.jp/rss/news/cat0.xml',
      'https://www3.nhk.or.jp/rss/news/cat3.xml',
      bMirror('nhk.or.jp'),
    ]},
  { id:'reuters', name:'路透社', cat:'政治', region:'全球', hosts:['reuters.com'],
    urls:[
      'https://rsshub.app/reuters/world',
      'https://rsshub.dicomp.net/reuters/world',
      bMirror('reuters.com'),
      gMirror('reuters.com'),
    ]},
  { id:'bbc', name:'BBC', cat:'政治', region:'全球', hosts:['bbc.co.uk','bbc.com'],
    urls:[
      'https://feeds.bbci.co.uk/news/world/rss.xml',
      bMirror('bbc.com'),
    ]},
  { id:'cnn', name:'CNN', cat:'政治', region:'全球', hosts:['cnn.com'],
    urls:[
      'http://rss.cnn.com/rss/edition_world.rss',
      'http://rss.cnn.com/rss/cnn_world.rss',
      bMirror('cnn.com'),
      gMirror('cnn.com'),
    ]},
  /* ═══ 垂直领域 ═══ */
  { id:'nasa', name:'NASA', cat:'航天', region:'深空', hosts:['nasa.gov'],
    urls:['https://www.nasa.gov/news-release/feed/', bMirror('nasa.gov')]},
  { id:'sfn', name:'SpaceflightNow', cat:'航天', region:'全球', hosts:['spaceflightnow.com'],
    urls:['https://www.spaceflightnow.com/feed/', bMirror('spaceflightnow.com')]},
  { id:'wscn', name:'华尔街见闻', cat:'科技·经济', region:'全球', hosts:['wallstreetcn.com'],
    urls:['https://dedicated.wallstreetcn.com/rss.xml', bMirror('wallstreetcn.com')]},
];

/* 代理域 = 错误页，需降级 */
const PROXY_HOSTS = ['rsshub.app','rsshub.rssforever.com','rsshub.dicomp.net',
                     'api.allorigins.win','api.rss2json.com','plink.anyfeeder.com'];
/* 可信中转网关：点击后落回原文页，标记「聚合」 */
const GATEWAY_HOSTS = ['news.google.com','www.bing.com','bing.com'];

/* 军事已从自动分类中移除：军事分类条目仅来自 CCTV-7 专属信源 */
const AI_KEYWORDS = {
  '航天':['航天','火箭','卫星','发射','星链','空间站','探测器','轨道','nasa','space','rocket','satellite','launch','orbit'],
  '科技·经济':['经济','油价','芯片','量子','贸易','关税','产能','市场','算力','market','oil','chip','tech','economy','trade','tariff','quantum','ai'],
  '政治':['峰会','议会','选举','外交','政府','磋商','制裁','领导人','会见','sanction','summit','parliament','election','diplomacy','government']
};
const HI=/战争|冲突|导弹|袭击|开火|核|war|strike|missile|nuclear/i, MID=/演习|制裁|关税|紧张|抗议|sanction|tariff|tension|drill/i;

/* ═══════════════ ② 工具函数 ═══════════════ */
const $=id=>document.getElementById(id);
const strip=h=>{const d=document.createElement('div');d.innerHTML=h||'';return (d.textContent||'').replace(/\s+/g,' ').trim().slice(0,150);};
const ago=ms=>{const m=(Date.now()-ms)/6e4;if(m<60)return Math.max(1,Math.round(m))+'分钟前';const h=m/60;if(h<24)return Math.round(h)+'小时前';return Math.round(h/24)+'天前';};
const pad=n=>String(n).padStart(2,'0');
const bingNews=t=>'https://www.bing.com/news/search?q='+encodeURIComponent(t);
const fmtLeft=ms=>{ms=Math.max(0,ms);const h=Math.floor(ms/3.6e6),m=Math.floor(ms%3.6e6/6e4),s=Math.floor(ms%6e4/1000);return pad(h)+':'+pad(m)+':'+pad(s);};
function log(msg,cls=''){const l=$('crawlLog');const d=document.createElement('div');d.className='log-line '+cls;
  d.textContent='['+pad(new Date().getHours())+':'+pad(new Date().getMinutes())+':'+pad(new Date().getSeconds())+'] '+msg;
  l.prepend(d);while(l.children.length>40)l.lastChild.remove();}
const viaLabel=u=>{if(!u)return'';if(u.includes('news.google.com'))return'Google定向';if(u.includes('bing.com'))return'Bing定向';if(u.includes('rsshub'))return'RSSHub';return'官方';};

/* ═══════════════ ③ 抓取通道（双通道 × 多实例 × 定向过滤）═══════════════ */
async function withTimeout(p,ms){const c=new AbortController();const t=setTimeout(()=>c.abort(),ms);
  try{return await p(c.signal);}finally{clearTimeout(t);}}
async function viaRss2Json(url,sig){
  const r=await fetch('https://api.rss2json.com/v1/api.json?rss_url='+encodeURIComponent(url),{signal:sig});
  const d=await r.json();if(d.status!=='ok')throw new Error(d.message||'rss2json error');
  return d.items.map(it=>({title:strip(it.title),link:it.link,desc:strip(it.description),pub:new Date(it.pubDate).getTime()||Date.now()}));
}
async function viaProxy(url,sig){
  const r=await fetch('https://api.allorigins.win/raw?url='+encodeURIComponent(url),{signal:sig});
  const doc=new DOMParser().parseFromString(await r.text(),'text/xml');
  return [...doc.querySelectorAll('item, entry')].map(it=>{
    const linkEl=it.querySelector('link');
    const link=(linkEl?.textContent||'').trim()||(linkEl?.getAttribute('href')||'').trim()
            ||(it.querySelector('link[rel="alternate"]')?.getAttribute('href')||'').trim();
    return {title:strip(it.querySelector('title')?.textContent),link,
      desc:strip(it.querySelector('description,summary,content')?.textContent),
      pub:new Date(it.querySelector('pubDate,published,updated')?.textContent||0).getTime()||Date.now()};
  }).filter(x=>x.title&&x.link);
}
async function fetchViaChannels(url,limit){
  const t0=performance.now();let items;
  try{items=await withTimeout(signal=>viaRss2Json(url,signal),10000);}
  catch(e1){try{items=await withTimeout(signal=>viaProxy(url,signal),12000);}catch(e2){throw new Error('双通道失败');}}
  return {items:items.slice(0,limit),ms:Math.round(performance.now()-t0)};
}
/* 依次尝试 urls[]；含 must 过滤（镜像通道豁免——查询词已定向） */
async function fetchFirstOk(s,limit){
  const errors=[];
  for(const url of s.urls){
    try{
      const {items,ms}=await fetchViaChannels(url,limit);
      const isMirror=/news\.google\.com|bing\.com/.test(url);
      let list=items;
      if(s.must && !isMirror && list.length){
        list=list.filter(x=>s.must.test(x.title+' '+(x.desc||'')));
        if(!list.length){errors.push(viaLabel(url)+'→无领导人匹配');continue;}
      }
      if(list.length>0){s.using=url;s.ms=ms;return list;}
      errors.push(viaLabel(url)+'→空');
    }catch(e){errors.push(viaLabel(url)+'→fail');}
  }
  throw new Error(errors.join(' | ').slice(0,140));
}

/* ═══════════════ ④ 深链校验 · AI 分类 · 入库 ═══════════════ */
function deepLink(rawLink,baseUrl,title,hosts){
  try{
    const u=new URL(rawLink,baseUrl);
    if(!u.href||!u.pathname||u.pathname==='/')return{url:bingNews(title),orig:0};
    if(PROXY_HOSTS.some(h=>u.host===h||u.host.endsWith('.'+h)))return{url:bingNews(title),orig:0};
    if(GATEWAY_HOSTS.includes(u.host))return{url:u.href,orig:0};
    if(hosts&&!hosts.some(h=>u.host===h||u.host.endsWith('.'+h)))return{url:bingNews(title),orig:0};
    if(/error|404|notfound|exception/i.test(u.pathname))return{url:bingNews(title),orig:0};
    return{url:u.href,orig:1};
  }catch(e){return{url:bingNews(title),orig:0};}
}
function aiClassify(text,defCat){
  const t=text.toLowerCase();let best=defCat, hits=9;
  for(const [c,kws] of Object.entries(AI_KEYWORDS)){const h=kws.filter(k=>t.includes(k)).length;if(h>hits){hits=h;best=c;}}
  return best;
}
function buildItem(raw,s,idx){
  const cat=s.cat;   /* 分类由信源声明决定：cctv7=军事，xinhua=政治… */
  const heat=+((6.2+Math.min(2.5,(s.ms||2000)/4000)-idx*0.18+(raw.title.length>45?0.6:0)).toFixed(1));
  const baseUrl=s.using||s.urls[0];
  const deep=deepLink(raw.link,baseUrl,raw.title,s.hosts);
  let origin=baseUrl;try{origin=new URL(deep.url).origin;}catch(e){}
  return{id:s.id+'-'+raw.pub+'-'+idx,srcId:s.id,title:raw.title,
    link:deep.url,orig:deep.orig,
    desc:raw.desc||'（点击卡片进入报道正文）',
    pub:raw.pub,src:s.name,srcUrl:origin,region:s.region,cat,heat,live:true,
    tag:HI.test(raw.title)?'高危':MID.test(raw.title)?'紧张':'关注'};
}

/* ═══════════════ ⑤ 渲染（无演示数据 · 空状态友好）═══════════════ */
let ITEMS=[],curCat='全部';
function render(){
  let list=ITEMS.filter(x=>curCat==='全部'||x.cat===curCat).sort((a,b)=>b.pub-a.pub);
  /* 军事标签页仅显示 CCTV-7 专属信源内容 */
  if(curCat==='军事') list=list.filter(x=>x.srcId==='cctv7');

  $('feed').innerHTML = list.length ? list.map(x=>`
    <article class="news-card ${x.srcId==='cctv7'?'c-cctv7':x.cat==='航天'?'c-space':x.cat==='科技·经济'?'c-econ':''}" data-link="${x.link}" title="点击进入报道正文">
      <div class="meta">
        <span class="cat">${x.cat}</span>
        <span class="tag t-${{关注:'gz',紧张:'jz',高危:'gw',重点:'zd'}[x.tag]}">${x.tag}</span>
        ${x.fresh&&Date.now()-x.fresh<180000?'<span class="badge b-new">NEW</span>':''}
        ${x.orig===1?'<span class="badge b-orig">原文</span>':''}
        <span class="badge b-live">LIVE</span>
        <span class="time">🕐 ${ago(x.pub)}</span>
      </div>
      <h3><a href="${x.link}" target="_blank" rel="noopener">${x.title}</a></h3>
      <p>${x.desc}</p>
      <div class="foot">
        <a href="${x.srcUrl}" target="_blank" rel="noopener" onclick="event.stopPropagation()">信源 · ${x.src}</a>
        <span>区域 · ${x.region}</span>
        <span class="heat">热度 ${x.heat.toFixed(1)}</span>
        <span class="deep">阅读报道 →</span>
      </div>
    </article>`).join('')
  : `<div class="empty"><span class="ic">📡</span>
      ${curCat==='军事'?'「军事」分类信息源为央视国防军事频道《军事报道》<br>当前暂无条目 · 点击「立即刷新」抓取或等待自动调度'
                      :'暂无'+(curCat==='全部'?'':curCat)+'条目 · 点击「立即刷新」抓取或等待自动调度（每4小时）'}</div>`;

  $('trending').innerHTML = ITEMS.length ? [...ITEMS].sort((a,b)=>b.heat-a.heat).slice(0,5).map((x,i)=>`
    <div class="rank"><span class="no">0${i+1}</span>
      <div style="flex:1"><a href="${x.link}" target="_blank" style="color:#fff;text-decoration:none;font-size:13px">${x.title.slice(0,30)}${x.title.length>30?'…':''}</a>
      <div style="color:var(--dim);font-size:11px;margin-top:3px">${x.src} · 实时抓取</div></div>
      <span class="heat">热度 ${x.heat.toFixed(1)}</span></div>`).join('')
  : '<div class="empty" style="padding:20px">暂无数据</div>';

  const tl=$('tickerList');
  tl.innerHTML = ITEMS.length
    ? ITEMS.slice(0,8).map(x=>`<li>【${x.cat}】${x.title} ◆</li>`).join('')
    : '<li>等待首轮 AI 抓取…（无演示数据，全部条目来自实时信源）</li>';
  tl.style.animationDuration=TICKER_SECONDS+'s';

  const liveN=ITEMS.length;
  $('statNews').textContent=liveN;
  $('statNewsUp').textContent=liveN?'▲ 实时入库 +'+liveN:'▲ 等待首轮抓取';
  $('libCount').textContent=liveN;
}
$('feed').addEventListener('click',e=>{
  if(e.target.closest('a'))return;
  const card=e.target.closest('.news-card');
  if(card&&card.dataset.link)window.open(card.dataset.link,'_blank','noopener');
});
function renderSrcStatus(){
  $('srcStatus').innerHTML=NEWS_SOURCES.map(s=>{
    const st=s.status||'idle';
    const cls=st==='ok'?'ok':st==='fail'?'fail':st==='busy'?'busy':'';
    const ic=st==='ok'?'✓':st==='fail'?'✗':st==='busy'?'●':'○';
    const extra=st==='ok'?` <span class="via">${viaLabel(s.using)}</span> ${(s.ms||0)}ms`:st==='fail'?' 失败':'';
    return `<span class="src-chip ${cls}" title="当前通道: ${s.using||s.urls[0]}">${ic} ${s.name}${extra}</span>`;
  }).join('');
}

/* ═══════════════ ⑥ 三轨并行调度 ═══════════════ */
let isCrawling=false, nextAt=null, syncOn=false, syncTimer=null, lastSyncAt=0;
function initAutoSchedule(){
  let a=+(localStorage.getItem(ANCHOR_KEY)||0);
  if(!a){a=Date.now();localStorage.setItem(ANCHOR_KEY,a);log('自动调度锚点建立：每 4 小时固定抓取一次','ai');}
  nextAt=a+AUTO_INTERVAL_MS;
  if(nextAt<=Date.now()){nextAt=Date.now()+3000;log('检测到错过自动周期 → 3 秒后补抓','ai');}
}
function tick(){
  const d=new Date();
  $('clock').textContent=pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds());
  $('date').textContent=d.getFullYear()+'年'+(d.getMonth()+1)+'月'+d.getDate()+'日 · 北京时间 UTC+8';
  if(nextAt){
    const left=nextAt-Date.now();
    $('nextCrawl').textContent=left<=0?'即将触发…':fmtLeft(left);
    if(left<=0&&!isCrawling)crawlAll('auto');
  }
}
async function crawlAll(trigger){
  if(isCrawling)return;isCrawling=true;
  const btn=$('refreshBtn');btn.disabled=true;btn.classList.add('loading');
  NEWS_SOURCES.forEach(s=>{s.status='busy';s.using=null});renderSrcStatus();
  const label={auto:'⏰ 定时自动触发',manual:'▶ 手动触发',boot:'🚀 首次引导抓取'}[trigger]||'▶ 抓取';
  log(label+' · '+NEWS_SOURCES.length+' 信源并行调度（纯净模式 · 无演示数据）','ai');

  const results=await Promise.allSettled(NEWS_SOURCES.map(async s=>{
    try{
      const raws=await fetchFirstOk(s,12);
      s.status='ok';
      return raws.map((it,i)=>buildItem(it,s,i));
    }catch(e){
      s.status='fail';
      log('✗ '+s.name+' · '+e.message,'err');
      return[];
    }
  }));

  let fresh=[];
  results.forEach(r=>{if(r.status==='fulfilled')fresh.push(...r.value);});
  const okN=NEWS_SOURCES.filter(s=>s.status==='ok').length;
  fresh.forEach(it=>log('✓ '+it.src+' · 「'+it.title.slice(0,20)+'…」'+(it.orig?' [原文]':' [聚合]'),'ok'));
  log('分类完成：'+['政治','军事','航天','科技·经济'].map(c=>c+'×'+fresh.filter(x=>x.cat===c).length).join(' | '),'ai');
  log('信源体检：'+okN+'/'+NEWS_SOURCES.length+' 可接入 · 新华社条目均经领导人过滤 · 军事条目来自 CCTV-7','ai');

  if(fresh.length){
    const old=JSON.parse(localStorage.getItem(CACHE_KEY)||'[]');
    const seen=new Set(old.map(x=>x.title));
    const merged=[...fresh.filter(x=>!seen.has(x.title)),...old].slice(0,120);
    ITEMS=[...fresh,...old.filter(x=>!fresh.some(f=>f.title===x.title))];
    ITEMS=ITEMS.slice(0,120);
    localStorage.setItem(CACHE_KEY,JSON.stringify(ITEMS));
    localStorage.setItem(CACHE_KEY+'_t',Date.now());
  }else{
    log('⚠ 本轮全部信源失败 → 保留现有条目，等待下次调度（无演示数据兜底）','err');
  }
  $('lastCrawl').textContent=new Date().toLocaleTimeString('zh-CN');
  $('okCount').textContent=okN+' / '+NEWS_SOURCES.length;
  render();renderSrcStatus();

  if(trigger==='auto'){
    nextAt=Date.now()+AUTO_INTERVAL_MS;
    localStorage.setItem(ANCHOR_KEY,Date.now());
    log('自动周期完成 → 下次自动抓取：'+new Date(nextAt).toLocaleTimeString('zh-CN'),'ai');
  }else{
    log('抓取完成 · 自动倒计时未受影响，剩余 '+fmtLeft(nextAt-Date.now()),'ai');
  }
  isCrawling=false;btn.disabled=false;btn.classList.remove('loading');
}
function updateSyncUI(){
  const b=$('syncBtn');b.classList.toggle('on',syncOn);
  b.textContent=syncOn?'🛰 实时追踪 · 运行中':'🛰 实时追踪 · 已关闭';
  $('syncState').textContent=syncOn
    ?('每 '+(SYNC_INTERVAL_MS/1000)+'s · '+(lastSyncAt?'最后同步 '+new Date(lastSyncAt).toLocaleTimeString('zh-CN'):'待首次探测'))
    :'未开启';
}
function setSync(on){
  syncOn=on;localStorage.setItem(SYNC_KEY,on?'1':'0');
  if(syncTimer){clearInterval(syncTimer);syncTimer=null;}
  if(on){syncTimer=setInterval(syncLoop,SYNC_INTERVAL_MS);
    log('🛰 实时追踪开启：每 '+(SYNC_INTERVAL_MS/1000)+' 秒探测 '+NEWS_SOURCES.length+' 家媒体更新','ai');}
  else log('实时追踪已关闭','dim');
  updateSyncUI();
}
async function syncLoop(){
  if(isCrawling)return;isCrawling=true;
  $('syncState').textContent='探测中…';
  const titles=new Set(ITEMS.map(x=>x.title));
  const results=await Promise.allSettled(NEWS_SOURCES.map(async s=>{
    const raws=await fetchFirstOk(s,5);
    return raws.map((it,i)=>buildItem(it,s,i)).filter(x=>!titles.has(x.title));
  }));
  const newItems=[];
  results.forEach(r=>{if(r.status==='fulfilled')newItems.push(...r.value);});
  if(newItems.length){
    newItems.forEach(x=>{x.fresh=Date.now();titles.add(x.title);});
    ITEMS=[...newItems,...ITEMS].slice(0,120);
    localStorage.setItem(CACHE_KEY,JSON.stringify(ITEMS));
    localStorage.setItem(CACHE_KEY+'_t',Date.now());
    const bySrc={};newItems.forEach(x=>{bySrc[x.src]=(bySrc[x.src]||0)+1;});
    log('🛰 检测到媒体更新 → 同步入库 +'+newItems.length+' 条（'+Object.entries(bySrc).map(([k,v])=>k+'×'+v).join('，')+'）','ok');
    render();
  }else log('🛰 同步探测完成：各媒体无新增','dim');
  lastSyncAt=Date.now();
  isCrawling=false;updateSyncUI();
}

/* ═══════════════ ⑦ 初始化 ═══════════════ */
$('refreshBtn').onclick=()=>crawlAll('manual');
$('syncBtn').onclick=()=>setSync(!syncOn);
$('tabs').onclick=e=>{if(!e.target.classList.contains('tab'))return;
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  e.target.classList.add('active');curCat=e.target.dataset.cat;render();};

$('statSrc').textContent=NEWS_SOURCES.length+' 家';
renderSrcStatus();
initAutoSchedule();
setInterval(tick,1000);tick();

/* 纯净模式启动：只载真实缓存，绝不注入演示条目 */
const cached=JSON.parse(localStorage.getItem(CACHE_KEY)||'[]');
if(cached.length){
  ITEMS=cached;
  const t=+(localStorage.getItem(CACHE_KEY+'_t')||0);
  $('lastCrawl').textContent=new Date(t).toLocaleTimeString('zh-CN');
  log('已从本地缓存载入 '+cached.length+' 条实时条目');
}else{
  ITEMS=[];
  log('纯净模式启动：无演示数据 · 等待首轮抓取','ai');
}
render();
if(!cached.length || Date.now()-(+(localStorage.getItem(CACHE_KEY+'_t')||0))>AUTO_INTERVAL_MS){
  log('启动引导抓取（不影响自动倒计时）','ai');
  crawlAll('boot');
}
if(localStorage.getItem(SYNC_KEY)==='1')setSync(true);
updateSyncUI();
log('调度就绪：'+NEWS_SOURCES.length+' 家权威信源 · 新华社=领导人要闻 · 军事=CCTV-7 · 无演示数据','ai');
