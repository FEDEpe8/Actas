// ── CONFIG ──
const AREAS={hab:{label:'Habilitaciones',tipos:['ac','ai']},obr:{label:'Obras Privadas',tipos:['oi','ins']},seg:{label:'Seguridad Urbana',tipos:['sc','si','st']},amb:{label:'Ambiente',tipos:['aca','aia']},bro:{label:'Bromatologia',tipos:['br']}};
const TIPOS={ac:{label:'Informacion',badge:'AC',form:'form-ac',titulo:'Acta de Informacion',pref:'AC-',dir:'Direccion de Habilitaciones',isig:'s-ac-2',color:'info'},ai:{label:'Infraccion',badge:'AI',form:'form-ai',titulo:'Acta de Infraccion',pref:'AI-',dir:'Direccion de Habilitaciones',isig:'s-ai-2',color:'infr'},oi:{label:'Infraccion',badge:'OI',form:'form-oi',titulo:'Acta de Infraccion',pref:'OI-',dir:'Direccion de Obras Privadas',isig:'s-oi-2',color:'infr'},ins:{label:'Inspeccion',badge:'INS',form:'form-ins',titulo:'Acta de Inspeccion',pref:'INS-',dir:'Dir. Obras Privadas y Planeamiento',isig:'s-ins-2',color:'insp'},sc:{label:'Informacion',badge:'SC',form:'form-sc',titulo:'Acta de Informacion',pref:'SC-',dir:'Direccion de Seguridad Urbana',isig:'s-sc-2',color:'info'},si:{label:'Infraccion',badge:'SI',form:'form-si',titulo:'Acta de Infraccion',pref:'SI-',dir:'Direccion de Seguridad Urbana',isig:'s-si-2',color:'infr'},st:{label:'Transito',badge:'ST',form:'form-st',titulo:'Acta Unica Infraccion de Transito',pref:'ST-',dir:'Direccion de Seguridad Urbana',isig:'s-st-1',color:'trans'},aca:{label:'Informacion',badge:'ACA',form:'form-aca',titulo:'Acta de Informacion',pref:'ACA-',dir:'Dir. Ambiente y Desarrollo Sustentable',isig:'s-aca-2',color:'info'},aia:{label:'Infraccion',badge:'AIA',form:'form-aia',titulo:'Acta de Infraccion',pref:'AIA-',dir:'Dir. Ambiente y Desarrollo Sustentable',isig:'s-aia-2',color:'infr'},br:{label:'Inspeccion',badge:'BR',form:'form-br',titulo:'Acta de Inspeccion',pref:'BR-',dir:'Dir. Bromatologia y Zoonosis',isig:'s-br-2',color:'insp'}};
const BARRIOS=['139 Viviendas','30 de Mayo','Acceso Norte','Anahi','Caballito Blanco','Centro','Concordia','Costanera','El Algarrobo','El Hueco','El Porteno','Escribano','Gallo Blanco','Ipora','La Esmeralda','La Noria','Lomas Altas','Los Sauces','Parque Girado','Puerto Chascomus','San Cayetano','San Jose','San Juan Bautista','San Luis','San Miguel','Villa Lujan','Otro'];
const bH='<option value="">Seleccionar</option>'+BARRIOS.map(b=>'<option>'+b+'</option>').join('');
['bar-ac','bar-ai','bar-sc','bar-si'].forEach(function(id){var e=document.getElementById(id);if(e)e.innerHTML=bH;});

var tipo='ac',area='hab';

// ── LISTA DE INSPECTORES ──────────────────────────────────────────────────────
// Agregar/editar los inspectores del municipio en este arreglo.
// Areas: 'hab'=Habilitaciones, 'obr'=Obras Privadas, 'seg'=Seguridad Urbana,
//        'amb'=Ambiente, 'bro'=Bromatologia, 'all'=Supervisor (todas las areas)
// IMPORTANTE: Cambiar las claves antes de publicar.
const INSPECTORES=[
  {nombre:'Maria Paula Campestre',legajo:'1001',area:'amb',cargo:'Inspector Municipal',clave:'mp1001'},
  {nombre:'Marcelo Javier Zaccheo',legajo:'1002',area:'obr',cargo:'Tec. Superior Obras',clave:'mz1002'},
  {nombre:'Mariana Arias',legajo:'1003',area:'bro',cargo:'Inspectora Municipal',clave:'ma1003'},
  {nombre:'Federico Perez',legajo:'1004',area:'admin',cargo:'Inspector Municipal',clave:'Ch@scomus2026'},
];
// Credenciales del supervisor (acceso a todas las areas)
// IMPORTANTE: Cambiar estas credenciales antes de publicar
const SUP_USER='admin';
const SUP_PASS='Ch@scomus2026';
// ─────────────────────────────────────────────────────────────────────────────

// ── LOGIN ──
function getInsp(){try{return JSON.parse(localStorage.getItem('insp'));}catch(e){return null;}}
function saveInsp(d){localStorage.setItem('insp',JSON.stringify(d));}

function isCanvasBlank(cv){return!cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data.some(function(x){return x!==0;});}

function normNombre(s){return s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');}

// ── USUARIOS (localStorage + fallback a INSPECTORES) ──
function getUsers(){
  try{var s=JSON.parse(localStorage.getItem('users_db'));if(s&&s.length)return s;}catch(e){}
  return INSPECTORES.map(function(ins){return Object.assign({},ins);});
}
function saveUsers(u){localStorage.setItem('users_db',JSON.stringify(u));}

function findInspector(nombre,clave){
  if(normNombre(nombre)===normNombre(SUP_USER)&&clave===SUP_PASS)
    return{nombre:'Supervisor',legajo:'0000',area:'all',cargo:'Supervisor',clave:SUP_PASS};
  return getUsers().find(function(ins){return normNombre(ins.nombre)===normNombre(nombre)&&ins.clave===clave;})||null;
}

// Pre-carga la firma cuando el usuario escribe su nombre
function onNombreInput(){
  var nombre=document.getElementById('l-nombre').value.trim();
  var found=getUsers().find(function(ins){return normNombre(ins.nombre)===normNombre(nombre);});
  if(found){
    var saved=localStorage.getItem('firma_'+found.legajo);
    if(saved){
      loadSigCanvas(saved);
      setSigStatus('Firma guardada','#2d8b4a');
      return;
    }
  }
  setSigStatus('(se carga automaticamente)','#aaa');
}

function setSigStatus(txt,color){
  var el=document.getElementById('sig-status');
  if(el){el.textContent=txt;el.style.color=color||'#aaa';}
}

function loadSigCanvas(dataUrl){
  var sigCv=document.getElementById('login-sig');
  var ctx=sigCv.getContext('2d');
  ctx.clearRect(0,0,sigCv.width,sigCv.height);
  var img=new Image();
  img.onload=function(){ctx.drawImage(img,0,0,sigCv.width,sigCv.height);};
  img.src=dataUrl;
  document.getElementById('sig-hint').style.display='none';
}

function checkLogin(){
  var insp=getInsp();
  if(insp&&insp.loggedIn){applyLogin(insp);return;}
  document.getElementById('login-overlay').style.display='flex';
}

function doLogin(){
  var nombre=document.getElementById('l-nombre').value.trim();
  var clave=document.getElementById('l-clave').value;
  var err=document.getElementById('login-err');
  if(!nombre||!clave){err.style.display='block';err.textContent='Completar nombre y clave';return;}
  var found=findInspector(nombre,clave);
  if(!found){err.style.display='block';err.textContent='Nombre o clave incorrectos';return;}
  err.style.display='none';
  var sigCv=document.getElementById('login-sig');
  var firma;
  if(!isCanvasBlank(sigCv)){
    firma=sigCv.toDataURL('image/png');
    localStorage.setItem('firma_'+found.legajo,firma);
  } else {
    firma=localStorage.getItem('firma_'+found.legajo)||null;
  }
  var insp={nombre:found.nombre,legajo:found.legajo,area:found.area,cargo:found.cargo,firma:firma,loggedIn:true};
  saveInsp(insp);
  document.getElementById('login-overlay').style.display='none';
  applyLogin(insp);
}

function applyLogin(insp){
  var ti=document.getElementById('tb-insp');
  ti.style.display='block';
  document.getElementById('tb-name').textContent=insp.nombre;
  document.getElementById('tb-area').textContent=AREAS[insp.area]?AREAS[insp.area].label:'Supervisor';
  document.querySelectorAll('.atab').forEach(function(tab){
    if(insp.area==='all'){tab.style.display='';}
    else{tab.style.display=(tab.dataset.area===insp.area)?'':'none';}
  });
  var ab=document.getElementById('tb-admin-btn');
  if(ab)ab.style.display=insp.area==='all'?'block':'none';
  var at=document.querySelector('.area-tabs');
  if(at)at.classList.toggle('sup-mode',insp.area==='all');
  setArea(insp.area==='all'?'hab':insp.area);
}

function editPerfil(){
  var insp=getInsp()||{};
  document.getElementById('l-nombre').value=insp.nombre||'';
  document.getElementById('l-clave').value='';
  var saved=insp.legajo?localStorage.getItem('firma_'+insp.legajo):null;
  var firma=saved||insp.firma||null;
  if(firma){loadSigCanvas(firma);setSigStatus('Firma guardada','#2d8b4a');}
  else{var sigCv=document.getElementById('login-sig');sigCv.getContext('2d').clearRect(0,0,sigCv.width,sigCv.height);document.getElementById('sig-hint').style.display='flex';setSigStatus('(se carga automaticamente)','#aaa');}
  document.getElementById('login-overlay').style.display='flex';
}

function logOut(){localStorage.removeItem('insp');location.reload();}

// ── PREFILL INSPECTOR ──
function prefillInspector(){
  var insp=getInsp();
  if(!insp||!insp.nombre)return;
  var T=TIPOS[tipo];
  var sigId=T.isig;
  if(!sigId)return;
  var cv=document.getElementById(sigId);
  if(!cv)return;
  var aclInp=document.getElementById(sigId+'-acl');
  if(aclInp){
    var txt=insp.nombre;
    if(insp.cargo)txt+=' - '+insp.cargo;
    aclInp.defaultValue=txt;
    if(!aclInp.value||aclInp.value===aclInp._lastPrefill)aclInp.value=txt;
    aclInp._lastPrefill=txt;
  }
  if(insp.firma){
    var img=new Image();
    img.onload=function(){
      var ctx=cv.getContext('2d');
      var isEmpty=!ctx.getImageData(0,0,cv.width,cv.height).data.some(function(x){return x!==0;});
      if(isEmpty){ctx.clearRect(0,0,cv.width,cv.height);ctx.drawImage(img,0,0,cv.width,cv.height);}
    };
    img.src=insp.firma;
  }
  if(tipo==='st'){
    var el;
    el=document.getElementById('st-legajo');if(el&&!el.value)el.value=insp.legajo||'';
    el=document.getElementById('st-nombre');if(el&&!el.value)el.value=insp.nombre||'';
    el=document.getElementById('st-cargo');if(el&&!el.value)el.value=insp.cargo||'';
  }
}

// ── AREA / TIPO ──
function setArea(a){
  area=a;
  document.querySelectorAll('.atab').forEach(function(t){t.classList.toggle('on',t.dataset.area===a);});
  var row=document.getElementById('tipo-row');
  row.innerHTML=AREAS[a].tipos.map(function(t){return'<button class="tbn" id="btn-'+t+'" onclick="setTipo(\''+t+'\')">'+'<span class="badge">'+TIPOS[t].badge+'</span><span class="sub">'+TIPOS[t].label+'</span></button>';}).join('');
  setTipo(AREAS[a].tipos[0]);
}

function setTipo(t){
  tipo=t;
  document.querySelectorAll('.tbn').forEach(function(b){b.className='tbn';});
  var btn=document.getElementById('btn-'+t);
  if(btn)btn.className='tbn on-'+t;
  Object.values(TIPOS).forEach(function(v){document.getElementById(v.form).classList.add('hidden');});
  document.getElementById(TIPOS[t].form).classList.remove('hidden');
  document.getElementById('titulo-acta').textContent=TIPOS[t].titulo;
  document.getElementById('num-pref').textContent=TIPOS[t].pref;
  document.getElementById('hdr-dir').textContent=TIPOS[t].dir;
  var hb=document.querySelector('.hdr-bar');
  if(hb){hb.className='hdr-bar'+(TIPOS[t].color?' tipo-'+TIPOS[t].color:'');}
  loadNum();
  document.querySelectorAll('#'+TIPOS[t].form+' .map-canvas').forEach(function(cv){initMapCanvas(cv.id,cv.dataset.style);});
  setTimeout(prefillInspector,100);
}

// ── NUMERACION ──
function getSeq(p){return parseInt(localStorage.getItem('seq_'+p.replace(/-/g,''))||'0');}
function setSeq(p,n){localStorage.setItem('seq_'+p.replace(/-/g,''),n);}
function loadNum(){var n=Math.max(1,getSeq(TIPOS[tipo].pref));document.getElementById('num-acta').value=String(n).padStart(6,'0');}
function nuevaActa(){var n=getSeq(TIPOS[tipo].pref)+1;setSeq(TIPOS[tipo].pref,n);document.getElementById('num-acta').value=String(n).padStart(6,'0');limpiar(false);prefillInspector();toast('Nueva acta N '+String(n).padStart(6,'0'));}

// ── CAPTURA PDF (FIX PRINCIPAL) ─────────────────────────────────────────────
// html2canvas clona el DOM pero pierde los valores asignados por JavaScript
// (como el nombre del inspector y el numero de acta).
// La solucion es usar 'onclone' para sincronizar los valores antes de renderizar.
function syncDOM(origEl, clonedEl){
  // Inputs de texto
  var origInputs=origEl.querySelectorAll('input:not([type=checkbox]):not([type=radio])');
  var clonInputs=clonedEl.querySelectorAll('input:not([type=checkbox]):not([type=radio])');
  origInputs.forEach(function(inp,i){
    if(clonInputs[i]){
      clonInputs[i].setAttribute('value',inp.value);
      clonInputs[i].value=inp.value;
    }
  });
  // Textareas
  var origTas=origEl.querySelectorAll('textarea');
  var clonTas=clonedEl.querySelectorAll('textarea');
  origTas.forEach(function(ta,i){
    if(clonTas[i]){
      clonTas[i].textContent=ta.value;
      clonTas[i].value=ta.value;
    }
  });
  // Selects
  var origSels=origEl.querySelectorAll('select');
  var clonSels=clonedEl.querySelectorAll('select');
  origSels.forEach(function(sel,i){
    if(clonSels[i])clonSels[i].selectedIndex=sel.selectedIndex;
  });
  // Fix layout en el clon
  var numBox=clonedEl.querySelector('.num-box');
  if(numBox){numBox.style.flexShrink='0';numBox.style.minWidth='fit-content';}
  clonedEl.querySelectorAll('.sign-box').forEach(function(sb){
    sb.style.width='100%';sb.style.alignItems='stretch';
  });
  clonedEl.querySelectorAll('.sig-acl').forEach(function(sa){sa.style.width='100%';});
  clonedEl.querySelectorAll('.sig-acl input').forEach(function(inp){
    inp.style.width='100%';inp.style.display='block';
  });
}

async function captureActa(){
  var el=document.getElementById('acta-doc');
  return await html2canvas(el,{
    scale:1.5,
    useCORS:true,
    allowTaint:true,
    backgroundColor:'#ffffff',
    logging:false,
    width:750,
    windowWidth:800,
    scrollX:0,
    scrollY:0,
    onclone:function(clonedDoc){
      var origEl=document.getElementById('acta-doc');
      var clonedEl=clonedDoc.getElementById('acta-doc');
      if(!origEl||!clonedEl)return;
      syncDOM(origEl,clonedEl);

      // Fix numero de acta: reemplazar inputs con un span simple
      var numBox=clonedEl.querySelector('.num-box');
      var origPref=document.querySelector('.num-pref');
      var origNum=document.getElementById('num-acta');
      if(numBox&&origPref&&origNum){
        var sp=clonedDoc.createElement('span');
        sp.textContent=(origPref.textContent||'')+(origNum.value||'');
        sp.style.cssText='font-size:12px;font-weight:700;color:#1a1a2e;white-space:nowrap';
        numBox.innerHTML='';
        numBox.appendChild(sp);
        numBox.style.flexShrink='0';
      }

      // Fix autofill: forzar fondo blanco en todos los inputs del clon
      clonedEl.querySelectorAll('input,select,textarea').forEach(function(inp){
        inp.style.backgroundColor='#ffffff';
        inp.style.webkitTextFillColor='#1a1a2e';
        inp.style.color='#1a1a2e';
        inp.style.boxShadow='0 0 0 1000px #ffffff inset';
      });

      // Fix campos .f: html2canvas no renderiza texto en inputs normales,
      // reemplazar con spans que muestran el valor como texto visible
      clonedEl.querySelectorAll('.f').forEach(function(fEl){
        fEl.querySelectorAll('input:not([type=checkbox]):not([type=radio])').forEach(function(inp){
          var span=clonedDoc.createElement('span');
          span.textContent=inp.value||'';
          span.style.cssText='display:block;font-size:13px;color:#1a1a2e;padding:5px 2px;border-bottom:1.5px solid #e0e0e0;width:100%;word-break:break-word;font-family:inherit;min-height:23px;box-sizing:border-box;';
          inp.parentNode.replaceChild(span,inp);
        });
        fEl.querySelectorAll('textarea').forEach(function(ta){
          var div=clonedDoc.createElement('div');
          div.textContent=ta.value||'';
          div.style.cssText='font-size:12px;color:#1a1a2e;border:1.5px solid #e0e0e0;border-radius:8px;padding:8px;white-space:pre-wrap;word-break:break-word;line-height:1.5;font-family:inherit;width:100%;box-sizing:border-box;min-height:100px;';
          ta.parentNode.replaceChild(div,ta);
        });
      });

      // Fix nombre inspector y aclaraciones: reemplazar input por div para evitar corte
      clonedEl.querySelectorAll('.sig-acl').forEach(function(acl){
        var inp=acl.querySelector('input');
        if(!inp)return;
        var div=clonedDoc.createElement('div');
        div.textContent=inp.value||'';
        div.style.cssText='font-size:11px;color:#444;text-align:center;width:100%;white-space:normal;word-break:break-word;padding:2px 4px;box-sizing:border-box';
        acl.replaceChild(div,inp);
      });
    }
  });
}
// ─────────────────────────────────────────────────────────────────────────────

// ── MAPA DIBUJABLE ──
function initMapCanvas(id,style){
  var cv=document.getElementById(id);
  if(!cv||cv._mapInited)return;
  cv._mapInited=true;
  var ctx=cv.getContext('2d');
  var W=cv.width,H=cv.height;
  function drawBg(){
    ctx.fillStyle='#ffffff';ctx.fillRect(0,0,W,H);
    if(style==='grid'){
      ctx.strokeStyle='#e8e8e8';ctx.lineWidth=1;
      for(var x=W/4;x<W;x+=W/4){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
      for(var y=H/4;y<H;y+=H/4){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    } else if(style==='cross'){
      var lw=W*0.28;
      ctx.fillStyle='#f0f0f0';
      ctx.fillRect(W/2-lw/2,0,lw,H);ctx.fillRect(0,H/2-lw/2,W,lw);
      ctx.strokeStyle='#d0d0d0';ctx.lineWidth=1;
      [[W/2-lw/2,0,W/2-lw/2,H],[W/2+lw/2,0,W/2+lw/2,H],[0,H/2-lw/2,W,H/2-lw/2],[0,H/2+lw/2,W,H/2+lw/2]].forEach(function(l){ctx.beginPath();ctx.moveTo(l[0],l[1]);ctx.lineTo(l[2],l[3]);ctx.stroke();});
    }
    var fs=Math.round(W*0.06);
    ctx.fillStyle='#bbb';ctx.font='bold '+fs+'px -apple-system,sans-serif';
    ctx.textAlign='center';ctx.fillText('N',W/2,fs+6);ctx.fillText('S',W/2,H-6);
    ctx.textAlign='left';ctx.fillText('O',6,H/2+fs/3);
    ctx.textAlign='right';ctx.fillText('E',W-6,H/2+fs/3);
  }
  drawBg();
  var bgData=ctx.getImageData(0,0,W,H);
  var drawing=false,lx=0,ly=0,tool='draw';
  cv._setTool=function(t){tool=t;};
  cv._clearMap=function(){ctx.putImageData(bgData,0,0);};
  function getPos(e){var r=cv.getBoundingClientRect(),sx=W/r.width,sy=H/r.height,s=e.touches?e.touches[0]:e;return[(s.clientX-r.left)*sx,(s.clientY-r.top)*sy];}
  function down(e){e.preventDefault();drawing=true;var p=getPos(e);lx=p[0];ly=p[1];}
  function move(e){
    if(!drawing)return;e.preventDefault();
    var p=getPos(e);var x=p[0],y=p[1];
    if(tool==='erase'){
      var r=W*0.07;
      var tmp=document.createElement('canvas');tmp.width=W;tmp.height=H;
      tmp.getContext('2d').putImageData(bgData,0,0);
      ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.clip();ctx.drawImage(tmp,0,0);ctx.restore();
    } else {
      ctx.lineWidth=2.5;ctx.lineCap='round';ctx.lineJoin='round';
      ctx.strokeStyle=tool==='red'?'#e00':'#1a1a2e';
      ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(x,y);ctx.stroke();
    }
    lx=x;ly=y;
  }
  function up(){drawing=false;}
  cv.addEventListener('mousedown',down);cv.addEventListener('mousemove',move);cv.addEventListener('mouseup',up);cv.addEventListener('mouseleave',up);
  cv.addEventListener('touchstart',down,{passive:false});cv.addEventListener('touchmove',move,{passive:false});cv.addEventListener('touchend',up);cv.addEventListener('touchcancel',up);
}

function mtool(btn){
  var mapId=btn.dataset.map,tool=btn.dataset.tool;
  var cv=document.getElementById(mapId);
  if(tool==='clear'){if(cv&&cv._clearMap)cv._clearMap();return;}
  document.querySelectorAll('[data-map="'+mapId+'"]').forEach(function(b){b.classList.remove('on');});
  btn.classList.add('on');
  if(cv&&cv._setTool)cv._setTool(tool);
}

// ── FIRMAS ──
function initSig(id){
  var cv=document.getElementById(id);if(!cv)return;
  var ctx=cv.getContext('2d');var drawing=false,lx=0,ly=0;
  function pos(e){var r=cv.getBoundingClientRect(),sx=cv.width/r.width,sy=cv.height/r.height,s=e.touches?e.touches[0]:e;return[(s.clientX-r.left)*sx,(s.clientY-r.top)*sy];}
  function down(e){e.preventDefault();drawing=true;var p=pos(e);lx=p[0];ly=p[1];ctx.beginPath();ctx.moveTo(lx,ly);cv.classList.add('active');}
  function move(e){if(!drawing)return;e.preventDefault();var p=pos(e);ctx.lineWidth=2.8;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#111';ctx.beginPath();ctx.moveTo(lx,ly);ctx.lineTo(p[0],p[1]);ctx.stroke();lx=p[0];ly=p[1];}
  function up(){drawing=false;cv.classList.remove('active');}
  cv.addEventListener('mousedown',down);cv.addEventListener('mousemove',move);cv.addEventListener('mouseup',up);cv.addEventListener('mouseleave',up);
  cv.addEventListener('touchstart',down,{passive:false});cv.addEventListener('touchmove',move,{passive:false});cv.addEventListener('touchend',up);cv.addEventListener('touchcancel',up);
}
document.querySelectorAll('.sig-canvas').forEach(function(c){initSig(c.id);});
initSig('login-sig');
function clrSig(id){var cv=document.getElementById(id);if(cv)cv.getContext('2d').clearRect(0,0,cv.width,cv.height);}

// ── HELPERS ──
function tog(sid,iid){var v=document.getElementById(sid).value;var i=document.getElementById(iid);i.style.display=(v==='Otros'||v==='Otro')?'block':'none';if(i.style.display==='none')i.value='';else i.focus();}

function limpiar(doToast){
  if(doToast===undefined)doToast=true;
  var f=document.getElementById(TIPOS[tipo].form);
  f.querySelectorAll('input:not([type=checkbox]):not([type=radio])').forEach(function(el){el.value=el.defaultValue||'';});
  f.querySelectorAll('textarea').forEach(function(el){el.value='';});
  f.querySelectorAll('select').forEach(function(el){el.selectedIndex=0;});
  f.querySelectorAll('input[type=checkbox]').forEach(function(el){el.checked=false;});
  f.querySelectorAll('input[type=radio]').forEach(function(el){el.checked=false;});
  f.querySelectorAll('.otro-inp').forEach(function(el){el.style.display='none';});
  f.querySelectorAll('.sig-canvas').forEach(function(cv){cv.getContext('2d').clearRect(0,0,cv.width,cv.height);});
  f.querySelectorAll('.map-canvas').forEach(function(cv){if(cv._clearMap)cv._clearMap();});
  if(doToast)toast('Formulario limpiado');
}

// ── TOAST ──
var _toastT;
function toast(msg,dur){dur=dur||2500;var t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');clearTimeout(_toastT);_toastT=setTimeout(function(){t.classList.remove('show');},dur);}

// ── WHATSAPP ──
function openWA(){document.getElementById('wa-num').value='';document.getElementById('wa-overlay').classList.add('open');setTimeout(function(){document.getElementById('wa-num').focus();},200);}
function closeWA(){document.getElementById('wa-overlay').classList.remove('open');}
async function sendWA(){
  var raw=document.getElementById('wa-num').value.replace(/\D/g,'');
  if(raw.length<8){alert('Ingresa un numero valido');return;}
  var num=raw.startsWith('54')?raw:'54'+raw;
  closeWA();
  toast('Generando PDF...',9000);
  try{
    var r=await buildPDF();
    // 1. Descargar el PDF en el dispositivo
    r.pdf.save(r.filename);
    // 2. Pequeña pausa para que el navegador procese la descarga
    await new Promise(function(res){setTimeout(res,700);});
    // 3. Abrir WhatsApp al número específico (sin texto, chat limpio)
    window.open('https://wa.me/'+num,'_blank');
    toast('PDF guardado. Adjuntalo en el chat que se abrio.',5000);
  }catch(err){
    console.error(err);toast('Error al generar PDF');
  }
}

function buildMsg(){
  var T=TIPOS[tipo],num=document.getElementById('num-acta').value;
  var insp=getInsp();
  var lines=['*MUNICIPALIDAD DE CHASCOMUS*','*'+T.dir+'*','*'+T.titulo+' N '+T.pref+num+'*'];
  if(insp)lines.push('_Inspector: '+insp.nombre+(insp.legajo?' (Leg.'+insp.legajo+')':'')+'_');
  lines.push('---------------------');
  var form=document.getElementById(T.form);
  form.querySelectorAll('.f').forEach(function(f){
    var lbl=f.querySelector('label');
    f.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not(.otro-inp),select,textarea').forEach(function(inp){
      if(lbl&&inp.value&&inp.value.trim()&&inp.value!==inp.defaultValue)lines.push('*'+lbl.textContent.trim()+':* '+inp.value);
    });
  });
  form.querySelectorAll('.narr').forEach(function(narr){
    var parts=[];
    narr.childNodes.forEach(function(n){if(n.nodeType===3&&n.textContent.trim())parts.push(n.textContent.trim());if(n.tagName==='INPUT'&&n.value)parts.push(n.value);});
    if(parts.length)lines.push('','*Descripcion:*',parts.filter(Boolean).join(' ').replace(/\s{2,}/g,' '));
  });
  var chkd=[];
  form.querySelectorAll('input[type=checkbox]').forEach(function(cb){if(cb.checked){var row=cb.closest('.chk-row,.dest-row,.chk-inline');if(row){var s=row.querySelector('span');if(s)chkd.push('  - '+s.textContent.trim());}}});
  if(chkd.length){lines.push('','*Selecciones:*');chkd.forEach(function(c){lines.push(c);});}
  lines.push('','---------------------','_Sistema de Actas Digitales - Municipalidad de Chascomus_');
  return lines.join('\n');
}

// ── PDF ──
async function buildPDF(){
  var el=document.getElementById('acta-doc');
  var n=parseInt(document.getElementById('num-acta').value)||1;
  document.body.classList.add('pdf-mode');
  el.style.cssText='width:750px!important;min-width:750px!important;max-width:750px!important';
  window.scrollTo(0,0);
  await new Promise(function(r){requestAnimationFrame(function(){requestAnimationFrame(r);});});
  await new Promise(function(r){setTimeout(r,400);});
  try{
    var canvas=await captureActa();
    el.style.cssText='';document.body.classList.remove('pdf-mode');
    var img=canvas.toDataURL('image/jpeg',0.88);
    var jsPDF=window.jspdf.jsPDF;
    var pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
    var pw=210,ph=297;
    var imgH=(canvas.height*pw)/canvas.width;
    if(imgH<=ph){pdf.addImage(img,'JPEG',0,0,pw,imgH,'','FAST');}
    else{var fitW=(canvas.width*ph)/canvas.height;pdf.addImage(img,'JPEG',(pw-fitW)/2,0,fitW,ph,'','FAST');}
    var numStr=String(n).padStart(6,'0');
    var filename='Acta-'+TIPOS[tipo].pref+numStr+'.pdf';
    return{pdf:pdf,n:n,numStr:numStr,filename:filename};
  }catch(err){
    el.style.cssText='';document.body.classList.remove('pdf-mode');
    throw err;
  }
}

async function descargar(){
  var btn=document.getElementById('btn-dl');btn.disabled=true;btn.textContent='Generando...';
  toast('Preparando PDF...',9000);
  try{
    var r=await buildPDF();
    r.pdf.save(r.filename);
    var nextN=r.n+1;setSeq(TIPOS[tipo].pref,nextN);
    document.getElementById('num-acta').value=String(nextN).padStart(6,'0');
    toast('PDF guardado correctamente');
  }catch(err){console.error(err);toast('Error al generar PDF');}
  btn.disabled=false;btn.textContent='Guardar y Descargar PDF';
}

// ── BACKOFFICE ──────────────────────────────────────────────────
var _boEditLegajo=null;

function openBackoffice(){
  _boEditLegajo=null;
  document.getElementById('bo-form-wrap').style.display='none';
  document.getElementById('bo-err').textContent='';
  boRenderTable();
  document.getElementById('backoffice-overlay').style.display='flex';
}
function closeBackoffice(){document.getElementById('backoffice-overlay').style.display='none';}

function _escH(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function _escA(s){return String(s||'').replace(/'/g,'&#39;');}

function boRenderTable(){
  var users=getUsers();
  var areaColors={hab:'#1a6bb5',obr:'#b7770d',seg:'#7b2d8b',amb:'#2d8b4a',bro:'#c05a39'};
  var html='';
  if(!users.length){
    html='<div class="bo-empty">No hay usuarios registrados. Creá el primero.</div>';
  } else {
    html='<table class="bo-table"><thead><tr><th>Nombre</th><th>Área</th><th>Cargo</th><th style="text-align:center">Firma</th><th>Acciones</th></tr></thead><tbody>';
    users.forEach(function(u){
      var aLabel=AREAS[u.area]?AREAS[u.area].label:u.area;
      var aColor=areaColors[u.area]||'#555';
      var hasFirma=!!localStorage.getItem('firma_'+u.legajo);
      html+='<tr>'
        +'<td><strong>'+_escH(u.nombre)+'</strong><br><span style="font-size:10px;color:#aaa">Leg. '+_escH(u.legajo)+'</span></td>'
        +'<td><span class="bo-badge" style="background:'+aColor+'22;color:'+aColor+'">'+_escH(aLabel)+'</span></td>'
        +'<td style="color:#666">'+_escH(u.cargo)+'</td>'
        +'<td style="text-align:center">'+(hasFirma?'<span style="color:#2d8b4a;font-size:15px">✓</span>':'<span style="color:#ddd">—</span>')+'</td>'
        +'<td><div class="bo-td-actions">'
          +'<button class="bo-btn-edit" onclick="boShowForm(\''+_escA(u.legajo)+'\')">Editar</button>'
          +(hasFirma?'<button class="bo-btn-clr" onclick="boClearFirma(\''+_escA(u.legajo)+'\')">Firma</button>':'')
          +'<button class="bo-btn-del" onclick="boDeleteUser(\''+_escA(u.legajo)+'\')">Eliminar</button>'
        +'</div></td>'
      +'</tr>';
    });
    html+='</tbody></table>';
  }
  document.getElementById('bo-table').innerHTML=html;
}

function boNextLegajo(){
  var users=getUsers();
  if(!users.length)return'1001';
  var max=Math.max.apply(null,users.map(function(u){return parseInt(u.legajo)||0;}));
  return String(max+1);
}

function boShowForm(legajo){
  _boEditLegajo=legajo||null;
  var users=getUsers();
  var u=legajo?users.find(function(x){return x.legajo===legajo;}):null;
  document.getElementById('bo-form-title').textContent=u?'Editar usuario':'Nuevo usuario';
  document.getElementById('bo-f-nombre').value=u?u.nombre:'';
  document.getElementById('bo-f-legajo').value=u?u.legajo:boNextLegajo();
  document.getElementById('bo-f-legajo').readOnly=!!u;
  document.getElementById('bo-f-area').value=u?u.area:'hab';
  document.getElementById('bo-f-cargo').value=u?u.cargo:'';
  document.getElementById('bo-f-clave').value='';
  document.getElementById('bo-f-clave2').value='';
  document.getElementById('bo-f-clave').placeholder=u?'Dejar vacío para no cambiar':'Nueva clave';
  document.getElementById('bo-clave-lbl').textContent=u?'Nueva clave (opcional)':'Clave *';
  document.getElementById('bo-err').textContent='';
  var fw=document.getElementById('bo-form-wrap');
  fw.style.display='block';
  fw.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function boSaveUser(){
  var nombre=document.getElementById('bo-f-nombre').value.trim();
  var legajo=document.getElementById('bo-f-legajo').value.trim();
  var area=document.getElementById('bo-f-area').value;
  var cargo=document.getElementById('bo-f-cargo').value.trim();
  var clave=document.getElementById('bo-f-clave').value;
  var clave2=document.getElementById('bo-f-clave2').value;
  var errEl=document.getElementById('bo-err');
  if(!nombre||!legajo||!area){errEl.textContent='Nombre, legajo y área son obligatorios';return;}
  if(clave&&clave!==clave2){errEl.textContent='Las claves no coinciden';return;}
  if(!_boEditLegajo&&!clave){errEl.textContent='La clave es obligatoria para un nuevo usuario';return;}
  var users=getUsers();
  if(_boEditLegajo){
    var idx=users.findIndex(function(u){return u.legajo===_boEditLegajo;});
    if(idx<0){errEl.textContent='Usuario no encontrado';return;}
    users[idx].nombre=nombre;users[idx].area=area;users[idx].cargo=cargo;
    if(clave)users[idx].clave=clave;
  } else {
    if(users.find(function(u){return u.legajo===legajo;})){errEl.textContent='Ya existe un usuario con ese legajo';return;}
    users.push({nombre:nombre,legajo:legajo,area:area,cargo:cargo,clave:clave});
  }
  var wasEdit=!!_boEditLegajo;
  saveUsers(users);
  document.getElementById('bo-form-wrap').style.display='none';
  _boEditLegajo=null;
  boRenderTable();
  toast(wasEdit?'Usuario actualizado':'Usuario creado');
}

function boDeleteUser(legajo){
  if(!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.'))return;
  saveUsers(getUsers().filter(function(u){return u.legajo!==legajo;}));
  boRenderTable();
  toast('Usuario eliminado');
}

function boClearFirma(legajo){
  if(!confirm('¿Borrar la firma guardada de este usuario?'))return;
  localStorage.removeItem('firma_'+legajo);
  boRenderTable();
  toast('Firma eliminada');
}

function boExport(){
  var data=JSON.stringify(getUsers(),null,2);
  var blob=new Blob([data],{type:'application/json'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download='usuarios-actas-'+new Date().toISOString().slice(0,10)+'.json';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Exportado correctamente');
}

function boImport(e){
  var file=e.target.files[0];if(!file)return;
  var reader=new FileReader();
  reader.onload=function(ev){
    try{
      var users=JSON.parse(ev.target.result);
      if(!Array.isArray(users)||!users.length)throw new Error('Formato inválido');
      if(!confirm('Esto reemplazará los '+users.length+' usuarios del archivo. ¿Continuar?'))return;
      saveUsers(users);boRenderTable();toast('Importados '+users.length+' usuarios');
    }catch(err){alert('Error al importar: '+err.message);}
  };
  reader.readAsText(file);
  e.target.value='';
}
// ────────────────────────────────────────────────────────────────

// ── AUTO-RESIZE TEXTAREAS ──
function autoResizeTa(ta){ta.style.height='auto';ta.style.height=ta.scrollHeight+'px';}
document.querySelectorAll('.f textarea').forEach(function(ta){
  ta.addEventListener('input',function(){autoResizeTa(this);});
});

// ── INIT ──
checkLogin();
document.getElementById('login-sig').addEventListener('touchstart',function(){document.getElementById('sig-hint').style.display='none';},{passive:true});
document.getElementById('login-sig').addEventListener('mousedown',function(){document.getElementById('sig-hint').style.display='none';});

// ── SERVICE WORKER ──
if('serviceWorker' in navigator){
  window.addEventListener('load',function(){
    navigator.serviceWorker.register('./sw.js').catch(function(){});
  });
}
