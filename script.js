// ── CONFIG ──
const AREAS={hab:{label:'Habilitaciones',tipos:['ac','ai']},obr:{label:'Obras Privadas',tipos:['oi','ins']},seg:{label:'Seguridad Urbana',tipos:['sc','si','st']},amb:{label:'Ambiente',tipos:['aca','aia']},bro:{label:'Bromatologia',tipos:['br']}};
const TIPOS={ac:{label:'Constatacion',badge:'AC',form:'form-ac',titulo:'Acta de Constatacion',pref:'AC-',dir:'Direccion de Habilitaciones',isig:'s-ac-2'},ai:{label:'Infraccion',badge:'AI',form:'form-ai',titulo:'Acta de Infraccion',pref:'AI-',dir:'Direccion de Habilitaciones',isig:'s-ai-2'},oi:{label:'Infraccion',badge:'OI',form:'form-oi',titulo:'Acta de Infraccion',pref:'OI-',dir:'Direccion de Obras Privadas',isig:'s-oi-2'},ins:{label:'Inspeccion',badge:'INS',form:'form-ins',titulo:'Acta de Inspeccion',pref:'INS-',dir:'Dir. Obras Privadas y Planeamiento',isig:'s-ins-2'},sc:{label:'Constatacion',badge:'SC',form:'form-sc',titulo:'Acta de Constatacion',pref:'SC-',dir:'Direccion de Seguridad Urbana',isig:'s-sc-2'},si:{label:'Infraccion',badge:'SI',form:'form-si',titulo:'Acta de Infraccion',pref:'SI-',dir:'Direccion de Seguridad Urbana',isig:'s-si-2'},st:{label:'Transito',badge:'ST',form:'form-st',titulo:'Acta Unica Infraccion de Transito',pref:'ST-',dir:'Direccion de Seguridad Urbana',isig:'s-st-1'},aca:{label:'Constatacion',badge:'ACA',form:'form-aca',titulo:'Acta de Constatacion',pref:'ACA-',dir:'Dir. Ambiente y Desarrollo Sustentable',isig:'s-aca-2'},aia:{label:'Infraccion',badge:'AIA',form:'form-aia',titulo:'Acta de Infraccion',pref:'AIA-',dir:'Dir. Ambiente y Desarrollo Sustentable',isig:'s-aia-2'},br:{label:'Inspeccion',badge:'BR',form:'form-br',titulo:'Acta de Inspeccion',pref:'BR-',dir:'Dir. Bromatologia y Zoonosis',isig:'s-br-2'}};
const BARRIOS=['139 Viviendas','30 de Mayo','Acceso Norte','Anahi','Caballito Blanco','Centro','Concordia','Costanera','El Algarrobo','El Hueco','El Porteno','Escribano','Gallo Blanco','Ipora','La Esmeralda','La Noria','Lomas Altas','Los Sauces','Parque Girado','Puerto Chascomus','San Cayetano','San Jose','San Juan Bautista','San Luis','San Miguel','Villa Lujan','Otro'];
const bH='<option value="">Seleccionar</option>'+BARRIOS.map(b=>'<option>'+b+'</option>').join('');
['bar-ac','bar-ai','bar-sc','bar-si'].forEach(function(id){var e=document.getElementById(id);if(e)e.innerHTML=bH;});

var tipo='ac',area='hab';

// ── LISTA DE INSPECTORES ──────────────────────────────────────────────────────
// Agregar/editar los inspectores del municipio en este arreglo.
// Areas: 'hab'=Habilitaciones, 'obr'=Obras Privadas, 'seg'=Seguridad Urbana,
// 'amb'=Ambiente, 'bro'=Bromatologia, 'all'=Supervisor (acceso a todas las areas)
const INSPECTORES=[
   {nombre:'Maria Paula Campestre',legajo:'1001',area:'amb',cargo:'Inspector Municipal'},
   {nombre:'Marcelo Javier Zaccheo',legajo:'1002',area:'obr',cargo:'Tec. Superior Obras'},
   {nombre:'Mariana Arias',legajo:'1003',area:'bro',cargo:'Inspectora Municipal'},
];
// Credenciales del supervisor (quien puede acceder a todas las areas)
// IMPORTANTE: Cambiar estas credenciales antes de publicar
const SUP_USER='admin';
const SUP_PASS='Ch@scomus2026';
// ─────────────────────────────────────────────────────────────────────────────

// ── LOGIN ──
function getInsp(){try{return JSON.parse(localStorage.getItem('insp'));}catch(e){return null;}}
function saveInsp(d){localStorage.setItem('insp',JSON.stringify(d));}

function checkLogin(){
  var insp=getInsp();
  if(insp&&insp.loggedIn){applyLogin(insp);return;}
  document.getElementById('login-overlay').style.display='flex';
}

function doLogin(){
  var nombre=document.getElementById('l-nombre').value.trim();
  var legajo=document.getElementById('l-legajo').value.trim();
  var areaVal=document.getElementById('l-area').value;
  var cargo=document.getElementById('l-cargo').value.trim();
  var err=document.getElementById('login-err');
  if(!nombre||!areaVal){err.style.display='block';err.textContent='Completar nombre y area';return;}
  if(areaVal==='all'){
    var su=document.getElementById('l-sup-user'),sp=document.getElementById('l-sup-pass');
    if(!su||su.value.trim()!==SUP_USER||!sp||sp.value!==SUP_PASS){
      err.style.display='block';err.textContent='Credenciales de supervisor incorrectas';return;
    }
  }
  err.style.display='none';
  var sigCv=document.getElementById('login-sig');
  var firma=sigCv.toDataURL('image/png');
  var isBlank=!sigCv.getContext('2d').getImageData(0,0,sigCv.width,sigCv.height).data.some(function(x){return x!==0;});
  var insp={nombre:nombre,legajo:legajo,area:areaVal,cargo:cargo,firma:isBlank?null:firma,loggedIn:true};
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
  setArea(insp.area==='all'?'hab':insp.area);
}

function editPerfil(){
  var insp=getInsp()||{};
  document.getElementById('l-nombre').value=insp.nombre||'';
  document.getElementById('l-legajo').value=insp.legajo||'';
  document.getElementById('l-area').value=insp.area||'';
  document.getElementById('l-cargo').value=insp.cargo||'';
  var sigCv=document.getElementById('login-sig');
  var ctx=sigCv.getContext('2d');
  ctx.clearRect(0,0,sigCv.width,sigCv.height);
  if(insp.firma){
    document.getElementById('sig-hint').style.display='none';
    var img=new Image();img.onload=function(){ctx.drawImage(img,0,0,sigCv.width,sigCv.height);};img.src=insp.firma;
  } else {document.getElementById('sig-hint').style.display='flex';}
  var listSel=document.getElementById('l-inspector-list');
  if(listSel){listSel.value='manual';setManualVisible(true);}
  if(typeof onAreaChange==='function')onAreaChange();
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
function sendWA(){
  var raw=document.getElementById('wa-num').value.replace(/\D/g,'');
  if(raw.length<8){alert('Ingresa un numero valido');return;}
  var num=raw.startsWith('54')?raw:'54'+raw;
  closeWA();
  var msg=buildMsg();
  window.open('https://wa.me/'+num+'?text='+encodeURIComponent(msg),'_blank');
  toast('Abriendo WhatsApp...');
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
async function descargar(){
  var btn=document.getElementById('btn-dl');btn.disabled=true;btn.textContent='Generando...';
  toast('Preparando PDF...',9000);
  var el=document.getElementById('acta-doc');
  try{
    var n=parseInt(document.getElementById('num-acta').value)||1;
    document.body.classList.add('pdf-mode');
    el.style.cssText='width:750px!important;min-width:750px!important;max-width:750px!important';
    window.scrollTo(0,0);
    await new Promise(function(r){requestAnimationFrame(function(){requestAnimationFrame(r);});});
    await new Promise(function(r){setTimeout(r,400);});

    var canvas=await captureActa();

    el.style.cssText='';document.body.classList.remove('pdf-mode');
    // JPEG 88% — mucho mas liviano que PNG
    var img=canvas.toDataURL('image/jpeg',0.88);
    var jsPDF=window.jspdf.jsPDF;
    var pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
    var pw=210,ph=297;
    var imgH=(canvas.height*pw)/canvas.width;
    if(imgH<=ph){
      // Entra en una sola hoja A4 — alinear arriba
      pdf.addImage(img,'JPEG',0,0,pw,imgH,'','FAST');
    } else {
      // Escalar proporcionalmente para que entre en el alto de A4
      var fitW=(canvas.width*ph)/canvas.height;
      pdf.addImage(img,'JPEG',(pw-fitW)/2,0,fitW,ph,'','FAST');
    }
    var numStr=String(n).padStart(6,'0');
    pdf.save('Acta-'+TIPOS[tipo].pref+numStr+'.pdf');
    var nextN=n+1;setSeq(TIPOS[tipo].pref,nextN);
    document.getElementById('num-acta').value=String(nextN).padStart(6,'0');
    toast('PDF descargado correctamente');
  }catch(err){
    el.style.cssText='';document.body.classList.remove('pdf-mode');
    console.error(err);toast('Error al generar PDF');
  }
  btn.disabled=false;btn.textContent='Descargar PDF';
}

// ── LISTA DE INSPECTORES (UI) ──
function buildLoginExtras(){
  if(INSPECTORES.length>0){
    var lw=document.createElement('div');lw.className='lf';
    lw.innerHTML='<label>Inspector</label><select id="l-inspector-list" aria-label="Inspector"><option value="">— Seleccionar inspector —</option>'+INSPECTORES.map(function(ins,i){return'<option value="'+i+'">'+ins.nombre+' — '+(AREAS[ins.area]?AREAS[ins.area].label:ins.area)+'</option>';}).join('')+'<option value="manual">Otro / Ingresar manualmente...</option></select>';
    var nm=document.getElementById('l-nombre').closest('.lf');
    nm.parentNode.insertBefore(lw,nm);
    document.getElementById('l-inspector-list').addEventListener('change',function(){onInspSelect(this.value);});
    setManualVisible(false);
  }
  var sw=document.createElement('div');sw.id='l-sup-wrap';sw.style.display='none';
  sw.innerHTML='<div class="lf"><label>Usuario supervisor</label><input id="l-sup-user" type="text" autocomplete="off"></div><div class="lf"><label>Clave supervisor</label><input id="l-sup-pass" type="password" autocomplete="off"></div>';
  var sigLbl=document.querySelector('.lf-sig-lbl');
  sigLbl.parentNode.insertBefore(sw,sigLbl);
  document.getElementById('l-area').addEventListener('change',onAreaChange);
}

function setManualVisible(v){
  ['l-nombre','l-legajo','l-cargo'].forEach(function(id){var w=document.getElementById(id).closest('.lf');if(w)w.style.display=v?'':'none';});
  var aw=document.getElementById('l-area').closest('.lf');if(aw)aw.style.display=v?'':'none';
}

function onInspSelect(val){
  if(!val)return;
  if(val==='manual'){
    setManualVisible(true);
    ['l-nombre','l-legajo','l-area','l-cargo'].forEach(function(id){document.getElementById(id).value='';});
    var sw=document.getElementById('l-sup-wrap');if(sw)sw.style.display='none';return;
  }
  var ins=INSPECTORES[parseInt(val)];if(!ins)return;
  document.getElementById('l-nombre').value=ins.nombre||'';
  document.getElementById('l-legajo').value=ins.legajo||'';
  document.getElementById('l-area').value=ins.area||'';
  document.getElementById('l-cargo').value=ins.cargo||'';
  setManualVisible(false);
  var sw=document.getElementById('l-sup-wrap');if(sw)sw.style.display='none';
}

function onAreaChange(){
  var v=document.getElementById('l-area').value;
  var sw=document.getElementById('l-sup-wrap');
  if(sw)sw.style.display=(v==='all')?'':'none';
  if(v==='all'){var u=document.getElementById('l-sup-user'),p=document.getElementById('l-sup-pass');if(u)u.value='';if(p)p.value='';}
}

// ── INIT ──
buildLoginExtras();
checkLogin();
document.getElementById('login-sig').addEventListener('touchstart',function(){document.getElementById('sig-hint').style.display='none';},{passive:true});
document.getElementById('login-sig').addEventListener('mousedown',function(){document.getElementById('sig-hint').style.display='none';});

// ── SERVICE WORKER ──
if('serviceWorker' in navigator){
  window.addEventListener('load',function(){
    navigator.serviceWorker.register('./sw.js').catch(function(){});
  });
}
