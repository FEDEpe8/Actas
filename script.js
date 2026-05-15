// ── CONFIG ──
const AREAS={hab:{label:'Habilitaciones',tipos:['ac','ai']},obr:{label:'Obras Privadas',tipos:['oi','ins']},seg:{label:'Seguridad Urbana',tipos:['sc','si','st']},amb:{label:'Ambiente',tipos:['aca','aia']},bro:{label:'Bromatologia',tipos:['br']}};
const TIPOS={ac:{label:'Informacion',badge:'AC',form:'form-ac',titulo:'Acta de Informacion',pref:'AC-',dir:'Direccion de Habilitaciones',isig:'s-ac-2',color:'info'},ai:{label:'Infraccion',badge:'AI',form:'form-ai',titulo:'Acta de Infraccion',pref:'AI-',dir:'Direccion de Habilitaciones',isig:'s-ai-2',color:'infr'},oi:{label:'Infraccion',badge:'OI',form:'form-oi',titulo:'Acta de Infraccion',pref:'OI-',dir:'Direccion de Obras Privadas',isig:'s-oi-2',color:'infr'},ins:{label:'Inspeccion',badge:'INS',form:'form-ins',titulo:'Acta de Inspeccion',pref:'INS-',dir:'Dir. Obras Privadas y Planeamiento',isig:'s-ins-2',color:'insp'},sc:{label:'Informacion',badge:'SC',form:'form-sc',titulo:'Acta de Informacion',pref:'SC-',dir:'Direccion de Seguridad Urbana',isig:'s-sc-2',color:'info'},si:{label:'Infraccion',badge:'SI',form:'form-si',titulo:'Acta de Infraccion',pref:'SI-',dir:'Direccion de Seguridad Urbana',isig:'s-si-2',color:'infr'},st:{label:'Transito',badge:'ST',form:'form-st',titulo:'Acta Unica Infraccion de Transito',pref:'ST-',dir:'Direccion de Seguridad Urbana',isig:'s-st-1',color:'trans'},aca:{label:'Informacion',badge:'ACA',form:'form-aca',titulo:'Acta de Informacion',pref:'ACA-',dir:'Dir. Ambiente y Desarrollo Sustentable',isig:'s-aca-2',color:'info'},aia:{label:'Infraccion',badge:'AIA',form:'form-aia',titulo:'Acta de Infraccion',pref:'AIA-',dir:'Dir. Ambiente y Desarrollo Sustentable',isig:'s-aia-2',color:'infr'},br:{label:'Inspeccion',badge:'BR',form:'form-br',titulo:'Acta de Inspeccion',pref:'BR-',dir:'Dir. Bromatologia y Zoonosis',isig:'s-br-2',color:'insp'}};
const BARRIOS=['139 Viviendas','30 de Mayo','Acceso Norte','Anahi','Caballito Blanco','Centro','Concordia','Costanera','El Algarrobo','El Hueco','El Porteno','Escribano','Gallo Blanco','Ipora','La Esmeralda','La Noria','Lomas Altas','Los Sauces','Parque Girado','Puerto Chascomus','San Cayetano','San Jose','San Juan Bautista','San Luis','San Miguel','Villa Lujan','Otro'];
const bH='<option value="">Seleccionar</option>'+BARRIOS.map(b=>'<option>'+b+'</option>').join('');
// Cargar barrios en todos los selects de todas las areas
['bar-ac','bar-ai','bar-sc','bar-si','bar-aca','bar-aia','bar-br'].forEach(function(id){
  var e=document.getElementById(id);
  if(e) e.innerHTML=bH;
});

var tipo='ac',area='hab';
var _mapInited = {}; // Controlar inicializacion de mapas

// ── PERFILES LOCALES ──
// Login local: el usuario ingresa con `username` y como contrasena su `legajo`.
// Areas: 'hab'=Habilitaciones, 'obr'=Obras Privadas, 'seg'=Seguridad Urbana,
//        'amb'=Ambiente, 'bro'=Bromatologia, 'all'=Supervisor (todas las areas)
const INSPECTORES=[
  {username:'mariap', nombre:'Maria Paula Campestre',legajo:'1001',area:'amb',cargo:'Inspector Municipal'},
  {username:'mzaccheo',nombre:'Marcelo Javier Zaccheo',legajo:'1002',area:'obr',cargo:'Tec. Superior Obras'},
  {username:'marias',nombre:'Mariana Arias',          legajo:'1003',area:'bro',cargo:'Inspectora Municipal'},
  {username:'fperez', nombre:'Federico Perez',         legajo:'1004',area:'all',cargo:'Inspector Municipal'},
];
// ─────────────────────────────────────────────────────────────────────────────

// ── LOGIN ──
function getInsp(){try{return JSON.parse(localStorage.getItem('insp'));}catch(e){return null;}}
function saveInsp(d){localStorage.setItem('insp',JSON.stringify(d));}

function isCanvasBlank(cv){
  var ctx=cv.getContext('2d');
  var imgData=ctx.getImageData(0,0,cv.width,cv.height);
  // Verificar si hay algo dibujado (con margen de tolerancia)
  for(var i=0;i<imgData.data.length;i+=4){
    if(imgData.data[i+0]!==255 || imgData.data[i+1]!==255 || imgData.data[i+2]!==255){
      return false;
    }
  }
  return true;
}

function normNombre(s){return s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');}

// ── USUARIOS (localStorage + fallback a INSPECTORES) ──
function getUsers(){
  try{var s=JSON.parse(localStorage.getItem('users_db'));if(s&&s.length)return s;}catch(e){}
  return INSPECTORES.map(function(ins){return Object.assign({},ins);});
}
function saveUsers(u){localStorage.setItem('users_db',JSON.stringify(u));}

function onNombreInput(){
  var user=document.getElementById('l-nombre').value.trim().toLowerCase();
  if(!user){setSigStatus('(se carga automaticamente)','#aaa');return;}
  var legajo=localStorage.getItem('umap_'+user);
  if(legajo){
    var saved=localStorage.getItem('firma_'+legajo);
    if(saved){loadSigCanvas(saved);setSigStatus('Firma guardada','#2d8b4a');return;}
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
  var user=document.getElementById('l-nombre').value.trim();
  var pass=document.getElementById('l-clave').value.trim();
  var err=document.getElementById('login-err');
  if(!user||!pass){err.style.display='block';err.textContent='Completar usuario y clave';return;}
  err.style.display='none';

  var u=user.toLowerCase();
  var local=getUsers().find(function(x){
    return (x.username&&x.username.toLowerCase()===u)
      ||normNombre(x.legajo||'')===normNombre(user)
      ||normNombre(x.nombre||'')===normNombre(user);
  });
  if(!local||String(pass)!==String(local.legajo)){
    err.style.display='block';
    err.textContent='Usuario o clave incorrectos';
    return;
  }

  localStorage.setItem('umap_'+u,String(local.legajo));

  var sigCv=document.getElementById('login-sig');
  var firma;
  if(!isCanvasBlank(sigCv)){
    firma=sigCv.toDataURL('image/png');
    localStorage.setItem('firma_'+local.legajo,firma);
  } else {
    firma=localStorage.getItem('firma_'+local.legajo)||null;
  }
  var insp={
    nombre:local.nombre,
    legajo:String(local.legajo),
    area:local.area||'hab',
    cargo:local.cargo||'Inspector Municipal',
    firma:firma,
    loggedIn:true,
    username:local.username||user
  };
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
  document.getElementById('l-nombre').value=insp.username||'';
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
      var isEmpty=isCanvasBlank(cv);
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

// ── PRE-COMPLETADO DEL PARRAFO INICIAL ──
function prefillNarrativa(formId){
  var f=document.getElementById(formId);
  if(!f)return;
  var d=new Date();
  var dia=d.getDate();
  var meses=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  var mes=meses[d.getMonth()];
  var anioFull=d.getFullYear();
  var anio2=String(anioFull).slice(-2);
  var hora=String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
  var insp=getInsp();

  function textoAntes(inp){
    var t='',n=inp.previousSibling;
    while(n){
      if(n.nodeType===3)t=n.textContent+t;
      else if(n.nodeType===1)t=(n.textContent||'')+t;
      n=n.previousSibling;
    }
    return t.toLowerCase();
  }

  f.querySelectorAll('p.narr').forEach(function(p){
    p.querySelectorAll('input').forEach(function(inp){
      if(inp.value && inp.value !== inp.defaultValue) return;
      var antes=textoAntes(inp);
      if(/(?:a\s+)?los\s*$/.test(antes)){inp.value=dia;return;}
      if(/mes(?:\s+de)?\s*$/.test(antes)){inp.value=mes;return;}
      if(/(?:dos\s+mil|de\s+20|ano\s+20)\s*$/.test(antes)){inp.value=anio2;return;}
      if(/del\s+ano\s*$/.test(antes)){inp.value=anioFull;return;}
      if(/siendo\s+las\s*$/.test(antes)){inp.value=hora;return;}
      if(insp&&insp.nombre){
        if(/que\s+suscribe\s*$/.test(antes)||/el\s+inspector\s*$/.test(antes)){
          inp.value=insp.nombre;return;
        }
      }
    });
  });

  f.querySelectorAll('.f').forEach(function(field){
    var label=field.querySelector('label');
    if(!label)return;
    var inp=field.querySelector('input');
    if(!inp||(inp.value && inp.value !== inp.defaultValue))return;
    var l=label.textContent.toLowerCase().trim();
    if(l==='dia')inp.value=dia;
    else if(l==='mes')inp.value=mes;
    else if(l==='ano'||l==='año')inp.value=anioFull;
    else if(l==='hora/min'||l==='hora')inp.value=hora;
  });
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
  // Inicializar mapas solo si no estaban inicializados
  document.querySelectorAll('#'+TIPOS[t].form+' .map-canvas').forEach(function(cv){
    if(!_mapInited[cv.id]){
      _mapInited[cv.id] = true;
      initMapCanvas(cv.id,cv.dataset.style);
    }
  });
  setTimeout(function(){prefillInspector();prefillNarrativa(TIPOS[t].form);},100);
}

// ── NUMERACION LOCAL ──
function getSeqLocal(p){return parseInt(localStorage.getItem('seq_'+p.replace(/-/g,''))||'0');}
function setSeqLocal(p,n){localStorage.setItem('seq_'+p.replace(/-/g,''),n);}

function loadNum(){var n=Math.max(1,getSeqLocal(TIPOS[tipo].pref));document.getElementById('num-acta').value=String(n).padStart(6,'0');}

function nuevaActa(){
  var n=getSeqLocal(TIPOS[tipo].pref)+1;
  setSeqLocal(TIPOS[tipo].pref,n);
  document.getElementById('num-acta').value=String(n).padStart(6,'0');
  limpiar(false);
  prefillInspector();
  prefillNarrativa(TIPOS[tipo].form);
  toast('Nueva acta N '+String(n).padStart(6,'0'));
}

// ── FOTOS ADJUNTAS ──
var _fotos = []; // {dataUrl, w, h}

function onFotosSelect(ev){
  var files = ev.target ? ev.target.files : null;
  if(!files || !files.length) return;
  var pending = files.length;
  var done = function(){ pending--; if(pending<=0) renderFotos(); };
  Array.prototype.forEach.call(files, function(f){
    if(!f.type || f.type.indexOf('image/')!==0){ done(); return; }
    _compressImage(f, function(item){
      if(item) _fotos.push(item);
      done();
    });
  });
  try{ ev.target.value=''; }catch(_){}
}

function _compressImage(file, cb){
  try{
    var reader = new FileReader();
    reader.onload = function(e){
      var img = new Image();
      img.onload = function(){
        try{
          var maxW = 1600, maxH = 1600;
          var w = img.naturalWidth || img.width;
          var h = img.naturalHeight || img.height;
          if(w<=0 || h<=0){ cb(null); return; }
          var ratio = Math.min(1, maxW/w, maxH/h);
          var dw = Math.round(w*ratio), dh = Math.round(h*ratio);
          var cv = document.createElement('canvas');
          cv.width = dw; cv.height = dh;
          var ctx = cv.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0,0,dw,dh);
          ctx.drawImage(img, 0, 0, dw, dh);
          var dataUrl = cv.toDataURL('image/jpeg', 0.85);
          cb({dataUrl:dataUrl, w:dw, h:dh});
        }catch(err){ console.warn('[Fotos] compress error:',err); cb(null); }
      };
      img.onerror = function(){ cb(null); };
      img.src = e.target.result;
    };
    reader.onerror = function(){ cb(null); };
    reader.readAsDataURL(file);
  }catch(err){ console.warn('[Fotos] reader error:',err); cb(null); }
}

function removeFoto(idx){
  if(idx<0 || idx>=_fotos.length) return;
  _fotos.splice(idx,1);
  renderFotos();
}

function renderFotos(){
  var grid = document.getElementById('fotos-grid');
  var cnt = document.getElementById('fotos-count');
  if(cnt) cnt.textContent = String(_fotos.length);
  if(!grid) return;
  var html = '';
  for(var i=0;i<_fotos.length;i++){
    html += '<div class="fotos-thumb">'
         +    '<img src="'+_fotos[i].dataUrl+'" alt="Foto '+(i+1)+'">'
         +    '<span class="fotos-num">'+(i+1)+'</span>'
         +    '<button class="fotos-del" type="button" onclick="removeFoto('+i+')" aria-label="Quitar foto">✕</button>'
         +  '</div>';
  }
  grid.innerHTML = html;
}

function clearFotos(){ _fotos = []; renderFotos(); }

// ── CAPTURA PDF ──
function syncDOM(origEl, clonedEl){
  // Inputs de texto
  var origInputs=origEl.querySelectorAll('input:not([type=checkbox]):not([type=radio])');
  var clonInputs=clonedEl.querySelectorAll('input:not([type=checkbox]):not([type=radio])');
  for(var i=0;i<origInputs.length && i<clonInputs.length;i++){
    clonInputs[i].setAttribute('value',origInputs[i].value);
    clonInputs[i].value=origInputs[i].value;
  }
  
  // Checkboxes
  var origCheck = origEl.querySelectorAll('input[type=checkbox]');
  var clonCheck = clonedEl.querySelectorAll('input[type=checkbox]');
  for(var i=0;i<origCheck.length && i<clonCheck.length;i++){
    if(origCheck[i].checked) clonCheck[i].setAttribute('checked','checked');
    else clonCheck[i].removeAttribute('checked');
  }
  
  // Radios
  var origRadio = origEl.querySelectorAll('input[type=radio]');
  var clonRadio = clonedEl.querySelectorAll('input[type=radio]');
  for(var i=0;i<origRadio.length && i<clonRadio.length;i++){
    if(origRadio[i].checked) clonRadio[i].setAttribute('checked','checked');
    else clonRadio[i].removeAttribute('checked');
  }
  
  // Textareas
  var origTas=origEl.querySelectorAll('textarea');
  var clonTas=clonedEl.querySelectorAll('textarea');
  for(var i=0;i<origTas.length && i<clonTas.length;i++){
    clonTas[i].textContent=origTas[i].value;
    clonTas[i].value=origTas[i].value;
  }
  
  // Selects
  var origSels=origEl.querySelectorAll('select');
  var clonSels=clonedEl.querySelectorAll('select');
  for(var i=0;i<origSels.length && i<clonSels.length;i++){
    clonSels[i].selectedIndex=origSels[i].selectedIndex;
  }
  
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

      clonedEl.querySelectorAll('input,select,textarea').forEach(function(inp){
        inp.style.backgroundColor='#ffffff';
        inp.style.webkitTextFillColor='#1a1a2e';
        inp.style.color='#1a1a2e';
        inp.style.boxShadow='0 0 0 1000px #ffffff inset';
      });

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

// ── MAPA DIBUJABLE (con prevencion de reinicializacion) ──
function initMapCanvas(id,style){
  var cv=document.getElementById(id);
  if(!cv) return;
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
  
  function getPos(e){
    var r=cv.getBoundingClientRect(),sx=W/r.width,sy=H/r.height;
    var s=e.touches?e.touches[0]:e;
    return[(s.clientX-r.left)*sx,(s.clientY-r.top)*sy];
  }
  
  function down(e){
    e.preventDefault();
    drawing=true;
    var p=getPos(e);
    lx=p[0];ly=p[1];
  }
  
  function move(e){
    if(!drawing) return;
    e.preventDefault();
    var p=getPos(e);
    var x=p[0],y=p[1];
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
  
  cv.addEventListener('mousedown',down);
  cv.addEventListener('mousemove',move);
  cv.addEventListener('mouseup',up);
  cv.addEventListener('mouseleave',up);
  cv.addEventListener('touchstart',down,{passive:false});
  cv.addEventListener('touchmove',move,{passive:false});
  cv.addEventListener('touchend',up);
  cv.addEventListener('touchcancel',up);
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
  f.querySelectorAll('input:not([type=checkbox]):not([type=radio])').forEach(function(el){el.value='';});
  f.querySelectorAll('textarea').forEach(function(el){el.value='';});
  f.querySelectorAll('select').forEach(function(el){el.selectedIndex=0;});
  f.querySelectorAll('input[type=checkbox]').forEach(function(el){el.checked=false;});
  f.querySelectorAll('input[type=radio]').forEach(function(el){el.checked=false;});
  f.querySelectorAll('.otro-inp').forEach(function(el){el.style.display='none';});
  f.querySelectorAll('.sig-canvas').forEach(function(cv){cv.getContext('2d').clearRect(0,0,cv.width,cv.height);});
  f.querySelectorAll('.map-canvas').forEach(function(cv){if(cv._clearMap)cv._clearMap();});
  clearFotos();
  prefillInspector();
  prefillNarrativa(TIPOS[tipo].form);
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
    r.pdf.save(r.filename);
    await new Promise(function(res){setTimeout(res,700);});
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
    // Anexar fotos como paginas adicionales
    if(_fotos.length){
      for(var fi=0; fi<_fotos.length; fi++){
        var fo=_fotos[fi];
        pdf.addPage('a4','portrait');
        var marg=10, titH=12;
        var avW=pw-2*marg, avH=ph-2*marg-titH;
        var fw=fo.w||1, fh=fo.h||1;
        var rr=Math.min(avW/fw, avH/fh);
        var dw=fw*rr, dh=fh*rr;
        var dx=(pw-dw)/2, dy=marg+titH+(avH-dh)/2;
        pdf.setFontSize(10);
        pdf.setTextColor(26,26,46);
        pdf.text('Acta '+TIPOS[tipo].pref+numStr+' - Foto '+(fi+1)+' / '+_fotos.length, pw/2, marg+7, {align:'center'});
        try{ pdf.addImage(fo.dataUrl,'JPEG',dx,dy,dw,dh,'','FAST'); }
        catch(err){ console.warn('[Fotos] addImage error:',err); }
      }
    }
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
    toast('PDF guardado correctamente');
  }catch(err){console.error(err);toast('Error al generar PDF');}
  btn.disabled=false;btn.textContent='Guardar y Descargar PDF';
}

// ── BACKOFFICE ──
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
    html='<div class="bo-empty">No hay usuarios registrados. Crea el primero.</div>';
  } else {
    html='<table class="bo-table"><thead><tr><th>Nombre</th><th>Area</th><th>Cargo</th><th style="text-align:center">Firma</th><th>Acciones</th></tr></thead><tbody>';
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
  document.getElementById('bo-f-clave').placeholder=u?'Dejar vacio para no cambiar':'Nueva clave';
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
  if(!nombre||!legajo||!area){errEl.textContent='Nombre, legajo y area son obligatorios';return;}
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
  if(!confirm('¿Eliminar este usuario? Esta accion no se puede deshacer.'))return;
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
      if(!Array.isArray(users)||!users.length)throw new Error('Formato invalido');
      if(!confirm('Esto reemplazara los '+users.length+' usuarios del archivo. ¿Continuar?'))return;
      saveUsers(users);boRenderTable();toast('Importados '+users.length+' usuarios');
    }catch(err){alert('Error al importar: '+err.message);}
  };
  reader.readAsText(file);
  e.target.value='';
}

// ── AUTO-RESIZE TEXTAREAS ──
function autoResizeTa(ta){ta.style.height='auto';ta.style.height=ta.scrollHeight+'px';}
document.querySelectorAll('.f textarea').forEach(function(ta){
  ta.addEventListener('input',function(){autoResizeTa(this);});
});

// ── DICTADO POR VOZ ──
(function(){
  function esDictable(ta){
    return !!ta.closest('.acta');
  }
  function crearReconocedor(){
    var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR)return null;
    var r=new SR();
    r.lang='es-AR';
    r.continuous=true;
    r.interimResults=true;
    return r;
  }
  function attachDictado(ta){
    var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    var wrap=document.createElement('div');
    wrap.className='dict-wrap';
    ta.parentNode.insertBefore(wrap,ta);
    wrap.appendChild(ta);
    var btn=document.createElement('button');
    btn.type='button';
    btn.className='dict-btn';
    btn.setAttribute('aria-label','Dictar por voz');
    btn.innerHTML='<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/></svg>';
    if(!SR){
      btn.disabled=true;
      btn.classList.add('dict-off');
      btn.title='Tu navegador no soporta dictado por voz';
    } else {
      btn.title='Dictar por voz';
    }
    wrap.appendChild(btn);
    if(!SR)return;

    var rec=null,grabando=false,baseText='';
    function detenerUI(){
      grabando=false;
      btn.classList.remove('dict-on');
      btn.title='Dictar por voz';
    }
    btn.addEventListener('click',function(e){
      e.preventDefault();
      if(grabando){try{rec&&rec.stop();}catch(_){}return;}
      rec=crearReconocedor();
      if(!rec)return;
      baseText=(ta.value||'');
      if(baseText&&!/\s$/.test(baseText))baseText+=' ';
      rec.onresult=function(ev){
        var interim='',finales='';
        for(var i=ev.resultIndex;i<ev.results.length;i++){
          var r=ev.results[i];
          if(r.isFinal)finales+=r[0].transcript;
          else interim+=r[0].transcript;
        }
        if(finales){baseText+=finales+(/\s$/.test(finales)?'':' ');}
        ta.value=(baseText+interim);
        ta.dispatchEvent(new Event('input',{bubbles:true}));
      };
      rec.onerror=function(ev){
        console.warn('[Dictado] error:',ev.error);
        if(ev.error==='not-allowed'||ev.error==='service-not-allowed'){
          alert('El navegador no permite acceder al microfono. Revisa los permisos del sitio.');
        }
        detenerUI();
      };
      rec.onend=function(){detenerUI();};
      try{
        rec.start();
        grabando=true;
        btn.classList.add('dict-on');
        btn.title='Detener dictado';
      }catch(err){
        console.error('[Dictado] no se pudo iniciar:',err);
        detenerUI();
      }
    });
  }
  function init(){
    document.querySelectorAll('textarea').forEach(function(ta){
      if(ta.dataset.dictReady==='1')return;
      if(!esDictable(ta))return;
      ta.dataset.dictReady='1';
      attachDictado(ta);
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();

// ── MAYUSCULAS AUTOMATICAS EN ACTAS ──
(function(){
  function debeMayuscular(el){
    if(!el||!el.closest)return false;
    if(!el.closest('.acta'))return false;
    if(el.classList&&el.classList.contains('no-upper'))return false;
    var tag=(el.tagName||'').toLowerCase();
    if(tag!=='input'&&tag!=='textarea')return false;
    var type=(el.getAttribute('type')||'text').toLowerCase();
    if(type==='email'||type==='tel'||type==='password'||type==='url'||type==='number'||type==='date'||type==='time')return false;
    return true;
  }
  function aMayus(el){
    var v=el.value;
    if(typeof v!=='string')return;
    var u=v.toUpperCase();
    if(u===v)return;
    var s=el.selectionStart,e=el.selectionEnd;
    el.value=u;
    try{el.setSelectionRange(s,e);}catch(_){}
  }
  document.addEventListener('input',function(ev){
    var t=ev.target;
    if(debeMayuscular(t))aMayus(t);
  },true);
})();

// ── INIT ──
renderFotos();
checkLogin();
document.getElementById('login-sig').addEventListener('touchstart',function(){document.getElementById('sig-hint').style.display='none';},{passive:true});
document.getElementById('login-sig').addEventListener('mousedown',function(){document.getElementById('sig-hint').style.display='none';});