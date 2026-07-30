const STORE_KEY = "rixu.tasks.v1";
const THEME_KEY = "rixu.theme";
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const pad = (n) => String(n).padStart(2, "0");
const dateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parseDate = (s) => { const [y,m,d] = s.split("-").map(Number); return new Date(y,m-1,d); };
const today = () => dateKey(new Date());
const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
const weekdays = ["日","一","二","三","四","五","六"];

let tasks = JSON.parse(localStorage.getItem(STORE_KEY) || "[]");
let selectedDate = today();
let view = "today";
let category = "";
let deferredPrompt;
let calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

function save(){ localStorage.setItem(STORE_KEY, JSON.stringify(tasks)); render(); }
function toast(text){ const el=$("#toast"); el.textContent=text; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),1800); }
function addStarterTasks(){
  if(tasks.length) return;
  tasks = [
    {id:uid(),title:"规划今天最重要的三件事",date:today(),time:"09:00",category:"工作",priority:"high",notes:"专注比忙碌更重要",done:false},
    {id:uid(),title:"散步 30 分钟",date:today(),time:"18:30",category:"健康",priority:"medium",notes:"",done:false}
  ];
  localStorage.setItem(STORE_KEY,JSON.stringify(tasks));
}
function visibleTasks(){
  const now=parseDate(today()), weekEnd=new Date(now); weekEnd.setDate(now.getDate()+6);
  let out=tasks.filter(t=>{
    if(category && t.category!==category) return false;
    if(view==="all") return true;
    if(view==="week"){ const d=parseDate(t.date); return d>=now&&d<=weekEnd; }
    return t.date===selectedDate;
  });
  const priority={high:0,medium:1,low:2};
  const sort=$("#sortSelect").value;
  return out.sort((a,b)=>a.done-b.done || (sort==="priority" ? priority[a.priority]-priority[b.priority] : (a.date+a.time).localeCompare(b.date+b.time)));
}
function renderDates(){
  const wrap=$("#dateStrip"); wrap.innerHTML="";
  const base=parseDate(today());
  for(let i=0;i<7;i++){ const d=new Date(base); d.setDate(base.getDate()+i); const key=dateKey(d);
    const btn=document.createElement("button"); btn.className=`date-chip ${key===selectedDate&&view==="today"?"active":""} ${key===today()?"today":""}`;
    btn.innerHTML=`<span>周${weekdays[d.getDay()]}</span><strong>${d.getDate()}</strong>`;
    btn.onclick=()=>{selectedDate=key;view="today";category="";syncNav();render();}; wrap.append(btn);
  }
}
function render(){
  renderDates();
  const items=visibleTasks(), list=$("#taskList"); list.innerHTML="";
  items.forEach(t=>{
    const row=document.createElement("article"); row.className=`task-item ${t.done?"completed":""} ${t.priority==="high"?"priority-high":""}`;
    row.innerHTML=`<input class="check" type="checkbox" ${t.done?"checked":""} aria-label="标记完成"><span class="task-time">${t.time||"全天"}</span><div class="task-main"><strong></strong><p></p></div><span class="tag">${t.category}</span>`;
    row.querySelector("strong").textContent=t.title;
    row.querySelector("p").textContent=t.notes || ({high:"重要事项",medium:"按计划完成",low:"有空再做"}[t.priority]);
    row.querySelector(".check").onchange=e=>{t.done=e.target.checked;save();toast(t.done?"完成一件，真不错":"已恢复为待办");};
    row.querySelector(".task-main").onclick=()=>openDialog(t); list.append(row);
  });
  $("#emptyState").hidden=items.length>0;
  const todays=tasks.filter(t=>t.date===today()), done=todays.filter(t=>t.done).length;
  const pct=todays.length?Math.round(done/todays.length*100):0;
  $("#progressText").textContent=`${pct}%`; $("#progressBar").style.width=`${pct}%`;
  $("#pendingCount").textContent=todays.length-done; $("#doneCount").textContent=done;
  const date=parseDate(selectedDate);
  const title=view==="all"?"全部事项":view==="week"?"近 7 天":selectedDate===today()?"今天":`${date.getMonth()+1}月${date.getDate()}日`;
  $("#viewTitle").textContent=category||title; $("#listTitle").textContent=category?`${category}事项`:(view==="today"?"当日事项":title);
  $("#eyebrow").textContent=new Intl.DateTimeFormat("zh-CN",{year:"numeric",month:"long",day:"numeric",weekday:"long"}).format(new Date());
}
function syncNav(){ $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===view)); }
function renderCalendar(){
  const year=calendarMonth.getFullYear(), month=calendarMonth.getMonth();
  $("#calendarMonthTitle").textContent=`${year}年 ${month+1}月`;
  const grid=$("#calendarGrid"); grid.innerHTML="";
  const first=new Date(year,month,1), mondayOffset=(first.getDay()+6)%7;
  const start=new Date(year,month,1-mondayOffset);
  for(let i=0;i<42;i++){
    const d=new Date(start); d.setDate(start.getDate()+i);
    const key=dateKey(d), btn=document.createElement("button");
    btn.className=`calendar-day ${d.getMonth()!==month?"outside":""} ${key===selectedDate?"selected":""} ${key===today()?"today":""} ${tasks.some(t=>t.date===key)?"has-tasks":""}`;
    btn.textContent=d.getDate();
    btn.setAttribute("aria-label",`${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`);
    btn.onclick=()=>{selectedDate=key;view="today";category="";syncNav();$("#calendarDialog").close();render();};
    grid.append(btn);
  }
}
function openCalendar(){
  const d=parseDate(selectedDate);
  calendarMonth=new Date(d.getFullYear(),d.getMonth(),1);
  renderCalendar();
  $("#calendarDialog").showModal();
}
function openDialog(task){
  $("#taskForm").reset(); $("#taskId").value=task?.id||""; $("#dialogTitle").textContent=task?"编辑事项":"新建事项";
  $("#taskTitle").value=task?.title||""; $("#taskDate").value=task?.date||selectedDate; $("#taskTime").value=task?.time||"";
  $("#taskCategory").value=task?.category||"生活"; $("#taskPriority").value=task?.priority||"medium"; $("#taskNotes").value=task?.notes||"";
  $("#deleteBtn").hidden=!task; $("#taskDialog").showModal(); setTimeout(()=>$("#taskTitle").focus(),50);
}
$("#taskForm").addEventListener("submit",e=>{
  e.preventDefault(); const id=$("#taskId").value, existing=tasks.find(t=>t.id===id);
  const data={id:id||uid(),title:$("#taskTitle").value.trim(),date:$("#taskDate").value,time:$("#taskTime").value,category:$("#taskCategory").value,priority:$("#taskPriority").value,notes:$("#taskNotes").value.trim(),done:existing?.done||false};
  if(existing) Object.assign(existing,data); else tasks.push(data); $("#taskDialog").close(); save(); toast(existing?"事项已更新":"事项已加入日程");
});
$("#deleteBtn").onclick=()=>{ const id=$("#taskId").value; if(confirm("确定删除这件事项吗？")){tasks=tasks.filter(t=>t.id!==id);$("#taskDialog").close();save();toast("事项已删除");}};
$("#addBtn").onclick=()=>openDialog(); $("#emptyAddBtn").onclick=()=>openDialog(); $("#closeDialog").onclick=()=>$("#taskDialog").close(); $("#cancelBtn").onclick=()=>$("#taskDialog").close();
$("#calendarBtn").onclick=openCalendar;
$("#closeCalendarBtn").onclick=()=>$("#calendarDialog").close();
$("#prevMonthBtn").onclick=()=>{calendarMonth.setMonth(calendarMonth.getMonth()-1);renderCalendar();};
$("#nextMonthBtn").onclick=()=>{calendarMonth.setMonth(calendarMonth.getMonth()+1);renderCalendar();};
$("#calendarTodayBtn").onclick=()=>{selectedDate=today();calendarMonth=new Date(new Date().getFullYear(),new Date().getMonth(),1);view="today";category="";syncNav();$("#calendarDialog").close();render();};
$("#sortSelect").onchange=render;
$$(".nav-item").forEach(b=>b.onclick=()=>{view=b.dataset.view;category="";if(view==="today")selectedDate=today();syncNav();render();});
$$(".category-filter").forEach(b=>b.onclick=()=>{category=category===b.dataset.category?"":b.dataset.category;view="all";syncNav();render();});
$("#menuBtn").onclick=()=>$(".sidebar").classList.toggle("open");
document.addEventListener("click",e=>{if(innerWidth<=800&&!$(".sidebar").contains(e.target)&&!$("#menuBtn").contains(e.target))$(".sidebar").classList.remove("open");});
function setTheme(theme){document.documentElement.dataset.theme=theme;localStorage.setItem(THEME_KEY,theme);$("#themeBtn").textContent=theme==="dark"?"☀":"☾";}
$("#themeBtn").onclick=()=>setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark");
$("#exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify({app:"日序",version:1,exportedAt:new Date().toISOString(),tasks},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`日序备份-${today()}.json`;a.click();URL.revokeObjectURL(a.href);toast("备份已导出");};
$("#importInput").onchange=async e=>{try{const data=JSON.parse(await e.target.files[0].text());if(!Array.isArray(data.tasks))throw 0;if(confirm(`将导入 ${data.tasks.length} 件事项，并替换当前数据。继续吗？`)){tasks=data.tasks;save();toast("备份已恢复");}}catch{alert("无法读取这个备份文件。");}e.target.value="";};
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("#installBtn").hidden=false;});
$("#installBtn").onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$("#installBtn").hidden=true;}};
window.addEventListener("appinstalled",()=>toast("日序已安装到本机"));
if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js"));
setTheme(localStorage.getItem(THEME_KEY)||((matchMedia("(prefers-color-scheme: dark)").matches)?"dark":"light"));
addStarterTasks(); render();
