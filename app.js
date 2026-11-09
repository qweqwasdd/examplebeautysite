/* Демо: данные формы никуда не отправляются, ничего не сохраняется. */
"use strict";
/* фото: сначала img/..., затем запасное фото, иначе блок остаётся пустым фоном */
(function(){
  function fail(img){
    var fb = img.getAttribute("data-fallback");
    if (fb && img.getAttribute("src") !== fb){ img.setAttribute("src", fb); }
    else { img.hidden = true; }
  }
  document.querySelectorAll("img[data-fallback]").forEach(function(img){
    img.addEventListener("error", function(){ fail(img); });
    if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) fail(img);
  });
})();
(function(){
  var SERVICES = [
    {cat:"Чистки", items:[
      {id:"c1", name:"Комбинированная чистка", desc:"Ультразвук и ручная чистка, успокаивающая маска.", min:60, price:3200},
      {id:"c2", name:"Ультразвуковая чистка", desc:"Деликатно, подходит для чувствительной кожи.", min:45, price:2400},
      {id:"c3", name:"Атравматичная чистка", desc:"Кислоты вместо механики, без покраснений после.", min:75, price:3600}
    ]},
    {cat:"Пилинги", items:[
      {id:"p1", name:"Миндальный пилинг", desc:"Мягкое обновление, можно и в солнечный сезон.", min:40, price:2600},
      {id:"p2", name:"Срединный пилинг", desc:"Постакне и пигментация. Курс от трёх процедур.", min:45, price:4200},
      {id:"p3", name:"Энзимный пилинг", desc:"Самый щадящий, хорош перед уходом.", min:30, price:1800}
    ]},
    {cat:"Уходы", items:[
      {id:"u1", name:"Уход по типу кожи", desc:"Очищение, сыворотка и маска под вашу задачу.", min:60, price:3000},
      {id:"u2", name:"Увлажняющий уход", desc:"С альгинатной маской, для сухой кожи зимой.", min:50, price:2800}
    ]},
    {cat:"Массаж лица", items:[
      {id:"m1", name:"Классический массаж", desc:"Снимает отёки и напряжение мышц лица.", min:40, price:2200},
      {id:"m2", name:"Буккальный массаж", desc:"Глубокая проработка жевательных мышц.", min:60, price:3500}
    ]}
  ];
  var SLOTS = ["10:00","11:30","13:00","14:30","16:00","17:30","19:00","20:00"];
  var rub = function(n){ return n.toLocaleString("ru-RU").replace(/ /g," ") + " ₽"; };
  var byId = {}, flat = [];
  SERVICES.forEach(function(g){ g.items.forEach(function(s){ byId[s.id]=s; flat.push(s); }); });
  var $ = function(id){ return document.getElementById(id); };
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var state = {service:"c1", day:null, slot:null};

  /* ---------- custom select ---------- */
  var cbtn = $("combo-btn"), menu = $("combo-menu"), active = 0;
  SERVICES.forEach(function(g, gi){
    var gl = document.createElement("li"); gl.className="grp"; gl.setAttribute("role","presentation"); gl.textContent=g.cat; menu.appendChild(gl);
    g.items.forEach(function(s){
      var li = document.createElement("li");
      li.className="opt"; li.id="opt-"+s.id; li.setAttribute("role","option"); li.dataset.id=s.id;
      li.innerHTML = '<svg class="tick" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7"/></svg>'+
        '<span>'+s.name+'</span><span class="o-meta num">'+s.min+' мин, '+rub(s.price)+'</span>';
      li.addEventListener("mousemove", function(){ setActive(flat.indexOf(s), false); });
      li.addEventListener("click", function(){ choose(s.id); close(true); });
      menu.appendChild(li);
    });
  });
  var opts = function(){ return menu.querySelectorAll(".opt"); };
  function renderCombo(){
    var s = byId[state.service];
    $("combo-name").textContent = s.name;
    $("combo-meta").textContent = s.min + " мин, " + rub(s.price);
    opts().forEach(function(o){ o.setAttribute("aria-selected", String(o.dataset.id===state.service)); });
  }
  function setActive(i, scroll){
    active = Math.max(0, Math.min(flat.length-1, i));
    opts().forEach(function(o,k){ o.classList.toggle("active", k===active); });
    var el = opts()[active];
    menu.setAttribute("aria-activedescendant", el.id);
    if (scroll) el.scrollIntoView({block:"nearest"});
  }
  function open(){
    menu.hidden = false; cbtn.setAttribute("aria-expanded","true");
    setActive(flat.indexOf(byId[state.service]), true);
    menu.focus({preventScroll:true});
  }
  function close(focusBtn){
    menu.hidden = true; cbtn.setAttribute("aria-expanded","false");
    if (focusBtn) cbtn.focus({preventScroll:true});
  }
  function choose(id){ state.service = id; state.slot = null; renderCombo(); renderSlots(); update(); }
  cbtn.addEventListener("click", function(){ menu.hidden ? open() : close(false); });
  cbtn.addEventListener("keydown", function(e){
    if (["ArrowDown","ArrowUp","Enter"," "].indexOf(e.key) > -1){ e.preventDefault(); open(); }
  });
  var typed = "", typedT;
  menu.addEventListener("keydown", function(e){
    if (e.key==="ArrowDown"){ e.preventDefault(); setActive(active+1, true); }
    else if (e.key==="ArrowUp"){ e.preventDefault(); setActive(active-1, true); }
    else if (e.key==="Home"){ e.preventDefault(); setActive(0, true); }
    else if (e.key==="End"){ e.preventDefault(); setActive(flat.length-1, true); }
    else if (e.key==="Enter" || e.key===" "){ e.preventDefault(); choose(flat[active].id); close(true); }
    else if (e.key==="Escape"){ e.preventDefault(); close(true); }
    else if (e.key==="Tab"){ close(false); }
    else if (e.key.length===1){
      clearTimeout(typedT); typed += e.key.toLowerCase(); typedT = setTimeout(function(){ typed=""; }, 600);
      var hit = flat.findIndex(function(s){ return s.name.toLowerCase().indexOf(typed)===0; });
      if (hit > -1) setActive(hit, true);
    }
  });
  document.addEventListener("pointerdown", function(e){ if (!menu.hidden && !$("combo").contains(e.target)) close(false); });

  /* ---------- days ---------- */
  var wd = new Intl.DateTimeFormat("ru-RU",{weekday:"short"});
  var longDate = new Intl.DateTimeFormat("ru-RU",{weekday:"long", day:"numeric", month:"long"});
  var short = function(d){ return wd.format(d).replace(".","") + " " + d.getDate(); };
  var days = [], today = new Date(); today.setHours(0,0,0,0);
  for (var i=0;i<7;i++){ var d = new Date(today); d.setDate(today.getDate()+i); days.push(d); }
  var daysEl = $("b-days");
  days.forEach(function(d, i){
    var b = document.createElement("button"); b.type="button"; b.className="day";
    var closed = d.getDay()===1;
    b.disabled = closed; b.setAttribute("aria-pressed","false");
    b.setAttribute("aria-label", longDate.format(d) + (closed ? ", выходной" : ""));
    b.innerHTML = "<small>"+(i===0?"сегодня":wd.format(d).replace(".",""))+"</small><b class=\"num\">"+d.getDate()+"</b>";
    b.addEventListener("click", function(){ state.day = i; state.slot = null; renderDays(); renderSlots(); update(); });
    daysEl.appendChild(b);
  });
  function renderDays(){ Array.prototype.forEach.call(daysEl.children, function(b,i){ b.setAttribute("aria-pressed", String(i===state.day)); }); }

  /* ---------- slots: fixed busy pattern so the demo looks lived-in ---------- */
  function isBusy(di, si){
    if (days[di].getDay()===1) return true;
    if (di===0){
      var now = new Date(), hm = SLOTS[si].split(":");
      if (+hm[0]*60 + +hm[1] <= now.getHours()*60 + now.getMinutes() + 60) return true;
    }
    var seed = days[di].getDate()*31 + si*7 + state.service.charCodeAt(1);
    return (seed % 5)===0 || (seed % 7)===3;
  }
  function firstFree(){
    for (var di=0; di<days.length; di++) for (var si=0; si<SLOTS.length; si++) if (!isBusy(di,si)) return {di:di, si:si};
    return null;
  }
  var slotsEl = $("b-slots");
  function renderSlots(){
    slotsEl.innerHTML = ""; var free = 0;
    SLOTS.forEach(function(t, si){
      var b = document.createElement("button"); b.type="button"; b.className="slot num"; b.textContent=t;
      var busy = isBusy(state.day, si); b.disabled = busy; if(!busy) free++;
      b.setAttribute("aria-pressed", String(state.slot===t));
      if (busy) b.setAttribute("aria-label", t+", занято");
      b.addEventListener("click", function(){ state.slot = t; renderSlots(); update(); });
      slotsEl.appendChild(b);
    });
    $("b-note").textContent = free ? "" : "На этот день мест нет. Выберите другую дату.";
    var f = firstFree();
    $("b-soon").innerHTML = f ? 'ближайшее окно: <b class="num">'+(f.di===0?"сегодня":f.di===1?"завтра":short(days[f.di]))+", "+SLOTS[f.si]+"</b>" : "";
  }

  var nextBtn = $("b-next");
  function update(){
    if (state.slot){ nextBtn.disabled=false; nextBtn.textContent = "Дальше: " + short(days[state.day]) + ", " + state.slot; }
    else { nextBtn.disabled=true; nextBtn.textContent = "Выберите время"; }
  }
  function show(id){ ["step-pick","step-contact","step-done"].forEach(function(s){ $(s).hidden = s!==id; }); }
  function when(){ return longDate.format(days[state.day]) + ", " + state.slot; }

  nextBtn.addEventListener("click", function(){
    var s = byId[state.service];
    $("b-summary").innerHTML = "<strong>"+s.name+"</strong><span>"+when()+"</span><span class=\"num\">"+s.min+" мин, "+rub(s.price)+"</span>";
    show("step-contact"); $("b-name").focus({preventScroll:true});
  });
  $("b-back").addEventListener("click", function(){ show("step-pick"); });

  /* ---------- validation + simulated sending: nothing leaves the page ---------- */
  function setErr(input, el, msg){ el.textContent = msg; input.classList.toggle("invalid", !!msg); input.setAttribute("aria-invalid", msg?"true":"false"); }
  $("booking").addEventListener("submit", function(e){
    e.preventDefault();
    var name=$("b-name"), phone=$("b-phone"), ok=true;
    if (!name.value.trim()){ setErr(name,$("e-name"),"Напишите, как к вам обращаться"); ok=false; } else setErr(name,$("e-name"),"");
    if (phone.value.replace(/\D/g,"").length < 10){ setErr(phone,$("e-phone"),"В номере не хватает цифр"); ok=false; } else setErr(phone,$("e-phone"),"");
    var consent=$("b-consent");
    if (!consent.checked){ $("e-consent").textContent="Без согласия мы не можем принять запись"; ok=false; } else $("e-consent").textContent="";
    if (!ok){ (!name.value.trim()?name:(phone.value.replace(/\D/g,"").length<10?phone:consent)).focus(); return; }
    var btn=$("b-confirm"); btn.disabled=true; btn.innerHTML='<span class="spinner" aria-hidden="true"></span> Записываем';
    setTimeout(function(){
      var s = byId[state.service];
      $("done-text").textContent = s.name + ", " + when() + ". " + ($("b-remind").checked ? "Накануне пришлём SMS." : "Если планы изменятся, позвоните нам.");
      btn.disabled=false; btn.textContent="Записаться"; show("step-done");
    }, 900);
  });
  $("b-again").addEventListener("click", function(){ state.slot=null; $("b-name").value=""; $("b-phone").value=""; $("b-consent").checked=false; renderSlots(); update(); show("step-pick"); });

  /* ---------- price tabs ---------- */
  var tabs=$("tabs"), price=$("price");
  function renderPrice(ci){
    Array.prototype.forEach.call(tabs.children, function(t,i){ t.setAttribute("aria-selected", String(i===ci)); t.tabIndex = i===ci?0:-1; });
    price.setAttribute("aria-label", SERVICES[ci].cat);
    price.innerHTML = SERVICES[ci].items.map(function(s){
      return '<div class="row"><div class="info"><h3>'+s.name+'</h3><p>'+s.desc+'</p></div>'+
        '<span class="dur num">'+s.min+' мин</span><span class="cost num">'+rub(s.price)+'</span>'+
        '<button type="button" class="pick" data-pick="'+s.id+'">Записаться</button></div>';
    }).join("");
  }
  SERVICES.forEach(function(g,i){
    var t=document.createElement("button"); t.type="button"; t.className="tab"; t.setAttribute("role","tab"); t.textContent=g.cat;
    t.addEventListener("click", function(){ renderPrice(i); });
    t.addEventListener("keydown", function(e){
      if (e.key==="ArrowRight"||e.key==="ArrowLeft"){ var n=(i+(e.key==="ArrowRight"?1:-1)+SERVICES.length)%SERVICES.length; renderPrice(n); tabs.children[n].focus(); }
    });
    tabs.appendChild(t);
  });
  price.addEventListener("click", function(e){
    var b=e.target.closest("[data-pick]"); if(!b) return;
    choose(b.getAttribute("data-pick")); show("step-pick");
    $("booking").scrollIntoView({behavior: reduce?"auto":"smooth", block:"center"});
  });

  /* start on the first day that has a free slot */
  var f0 = firstFree(); state.day = f0 ? f0.di : 1;
  renderCombo(); renderDays(); renderSlots(); update(); renderPrice(0);
})();
