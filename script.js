// ── FIREBASE CONFIG ──────────────────────────────────────────────────────────
// PASOS PARA CONFIGURAR:
// 1) Entra a https://console.firebase.google.com y crea un proyecto nuevo
// 2) En el proyecto, ve a "Compilacion > Realtime Database" y crea la base de datos
//    (elegir la region "Estados Unidos" o la mas cercana)
// 3) En las Reglas de la base de datos, pega esto y publica:
//    { "rules": { "contadores": { ".read": true, ".write": true } } }
// 4) Ve a "Configuracion del proyecto" (icono engranaje) > "Tus apps" > agrega app Web
// 5) Copia los valores del objeto firebaseConfig y reemplaza los de abajo
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyA4hbpcNkfVUDgd6fmCxxLbKEcgv-AvG5Y",
  authDomain: "contador-6fecb.firebaseapp.com",
  databaseURL: "https://contador-6fecb-default-rtdb.firebaseio.com",
  projectId: "contador-6fecb",
  storageBucket: "contador-6fecb.firebasestorage.app",
  messagingSenderId: "395558186119",
  appId: "1:395558186119:web:388467d8d35b5b504a5c22"
};
// Si los contadores en Firebase deben arrancar desde un numero distinto de 1
// (por ejemplo, porque ya existen actas previas), el supervisor puede ir a
// Realtime Database en Firebase y editar manualmente el valor inicial de cada
// contador bajo la ruta "contadores/AC", "contadores/AI", etc.
// ─────────────────────────────────────────────────────────────────────────────
var _fbDb = null;
(function(){
  try {
    if(FIREBASE_CONFIG.databaseURL && !FIREBASE_CONFIG.databaseURL.startsWith('PEGAR')){
      firebase.initializeApp(FIREBASE_CONFIG);
      _fbDb = firebase.database();
    }
  } catch(e){ console.warn('Firebase init error:', e); }
})();

// ── CONFIG ──
const AREAS={hab:{label:'Habilitaciones',tipos:['ac','ai']},obr:{label:'Obras Privadas',tipos:['oi','ins']},seg:{label:'Seguridad Urbana',tipos:['sc','si','st']},amb:{label:'Ambiente',tipos:['aca','aia']},bro:{label:'Bromatologia',tipos:['br']}};
const TIPOS={ac:{label:'Informacion',badge:'AC',form:'form-ac',titulo:'Acta de Informacion',pref:'AC-',dir:'Direccion de Habilitaciones',isig:'s-ac-2',color:'info'},ai:{label:'Infraccion',badge:'AI',form:'form-ai',titulo:'Acta de Infraccion',pref:'AI-',dir:'Direccion de Habilitaciones',isig:'s-ai-2',color:'infr'},oi:{label:'Infraccion',badge:'OI',form:'form-oi',titulo:'Acta de Infraccion',pref:'OI-',dir:'Direccion de Obras Privadas',isig:'s-oi-2',color:'infr'},ins:{label:'Inspeccion',badge:'INS',form:'form-ins',titulo:'Acta de Inspeccion',pref:'INS-',dir:'Dir. Obras Privadas y Planeamiento',isig:'s-ins-2',color:'insp'},sc:{label:'Informacion',badge:'SC',form:'form-sc',titulo:'Acta de Informacion',pref:'SC-',dir:'Direccion de Seguridad Urbana',isig:'s-sc-2',color:'info'},si:{label:'Infraccion',badge:'SI',form:'form-si',titulo:'Acta de Infraccion',pref:'SI-',dir:'Direccion de Seguridad Urbana',isig:'s-si-2',color:'infr'},st:{label:'Transito',badge:'ST',form:'form-st',titulo:'Acta Unica Infraccion de Transito',pref:'ST-',dir:'Direccion de Seguridad Urbana',isig:'s-st-1',color:'trans'},aca:{label:'Informacion',badge:'ACA',form:'form-aca',titulo:'Acta de Informacion',pref:'ACA-',dir:'Dir. Ambiente y Desarrollo Sustentable',isig:'s-aca-2',color:'info'},aia:{label:'Infraccion',badge:'AIA',form:'form-aia',titulo:'Acta de Infraccion',pref:'AIA-',dir:'Dir. Ambiente y Desarrollo Sustentable',isig:'s-aia-2',color:'infr'},br:{label:'Inspeccion',badge:'BR',form:'form-br',titulo:'Acta de Inspeccion',pref:'BR-',dir:'Dir. Bromatologia y Zoonosis',isig:'s-br-2',color:'insp'}};
const BARRIOS=['139 Viviendas','30 de Mayo','Acceso Norte','Anahi','Caballito Blanco','Centro','Concordia','Costanera','El Algarrobo','El Hueco','El Porteno','Escribano','Gallo Blanco','Ipora','La Esmeralda','La Noria','Lomas Altas','Los Sauces','Parque Girado','Puerto Chascomus','San Cayetano','San Jose','San Juan Bautista','San Luis','San Miguel','Villa Lujan','Otro'];
const bH='<option value="">Seleccionar</option>'+BARRIOS.map(b=>'<option>'+b+'</option>').join('');
['bar-ac','bar-ai','bar-sc','bar-si'].forEach(function(id){var e=document.getElementById(id);if(e)e.innerHTML=bH;});

var tipo='ac',area='hab';

// ── API DE SEGURIDAD ──────────────────────────────────────────────────────────
// Paso 1: POST /seguridad/gettoken  con Authorization: Basic base64(user:pass)
// Paso 2: POST /seguridad/validartoken  con Authorization: Bearer <token>
const API_BASE='http://api.chascomus.gob.ar';

async function apiGetToken(){
  var url=API_BASE+'/seguridad/gettoken';
  var authHeader='Basic '+btoa('nicolas.galli'+':'+'nicolas.galli');
  console.group('[API] apiGetToken');
  console.log('→ URL:',url);
  console.log('→ Method: POST');
  console.log('→ Headers:',{Authorization:authHeader});
  try{
    var res=await fetch(url,{method:'POST',headers:{'Authorization':authHeader}});
    console.log('← Status:',res.status,res.statusText);
    console.log('← Content-Type:',res.headers.get('content-type'));
    if(!res.ok){
      console.error('✗ auth_failed (status no OK)');
      console.groupEnd();
      throw new Error('auth_failed');
    }
    var ct=res.headers.get('content-type')||'';
    var raw=ct.includes('json')?await res.json():await res.text();
    console.log('← Body:',raw);
    // Validar envelope {code, status, message, data}
    if(raw&&typeof raw==='object'&&raw.status==='error'){
      console.error('✗ gettoken rechazado por la API:',raw.message||'sin mensaje');
      console.groupEnd();
      throw new Error('auth_failed:'+(raw.message||'desconocido'));
    }
    var token=null;
    var fuente=null;
    if(typeof raw==='string'){
      token=raw.trim();fuente='raw (string plano)';
    } else if(raw&&typeof raw==='object'){
      // Preferir el campo `data` del envelope; si es objeto, sacar `.token`
      if(typeof raw.data==='string'){token=raw.data.trim();fuente='raw.data (string)';}
      else if(raw.data&&typeof raw.data==='object'&&raw.data.token){token=String(raw.data.token);fuente='raw.data.token';}
      else if(raw.token){token=String(raw.token);fuente='raw.token';}
    }
    console.log('  fuente del token:',fuente);
    if(!token){
      console.error('✗ token_not_found en la respuesta. Body recibido:',raw);
      console.groupEnd();
      throw new Error('token_not_found');
    }
    // Sanity check: si el "token" parece ser solo un codigo HTTP (3 digitos),
    // casi seguro estamos parseando mal el envelope.
    if(/^\d{1,4}$/.test(token)){
      console.error('✗ El token parseado parece un codigo HTTP, no un token real:',token,'| body completo:',raw);
      console.groupEnd();
      throw new Error('token_not_found:parece_codigo_http');
    }
    console.log('✓ Token obtenido:',token,'(longitud:',token.length+')');
    console.groupEnd();
    return token;
  }catch(e){
    console.error('✗ Error en apiGetToken:',e);
    console.groupEnd();
    throw e;
  }
}

async function apiHacerLogin(token,user,pass){
  var url=API_BASE+'/faltas/login';
  var json={
    "token": token,
    "action": "login",
    "user": user,
    "pass": pass
  };
  var headers={'Authorization':'Bearer '+token,'Content-Type':'application/json'};
  console.group('[API] apiHacerLogin');
  console.log('→ URL:',url);
  console.log('→ Method: POST');
  console.log('→ Headers:',headers);
  console.log('→ Body (objeto):',json);
  console.log('→ Body (JSON string):',JSON.stringify(json));
  try{
    var res=await fetch(url,{
      method:'POST',
      headers:headers,
      body:JSON.stringify(json)
    });
    console.log('← Status:',res.status,res.statusText);
    console.log('← Content-Type:',res.headers.get('content-type'));
    if(!res.ok){
      var errText='';
      try{errText=await res.text();}catch(e){}
      console.error('✗ token_invalid (status no OK). Respuesta:',errText);
      console.groupEnd();
      throw new Error('token_invalid');
    }
    var ct=res.headers.get('content-type')||'';
    var resp=ct.includes('json')?await res.json():{};
    console.log('← Body:',resp);
    // La API devuelve un envelope: {code, status, message, data}
    // Validar que el login fue realmente exitoso
    if(resp&&resp.status==='error'){
      console.error('✗ Login rechazado por la API:',resp.message||'sin mensaje');
      console.groupEnd();
      throw new Error('login_failed:'+(resp.message||'desconocido'));
    }
    if(resp&&resp.data===false){
      console.error('✗ Login rechazado: data===false');
      console.groupEnd();
      throw new Error('login_failed:data_false');
    }
    var data=(resp&&typeof resp.data==='object'&&resp.data!==null)?resp.data:resp;
    console.log('✓ Login OK, data:',data);
    console.groupEnd();
    return data;
  }catch(e){
    console.error('✗ Error en apiHacerLogin:',e);
    console.groupEnd();
    throw e;
  }
}
// ─────────────────────────────────────────────────────────────────────────────

// ── PERFILES LOCALES ──────────────────────────────────────────────────────────
// Usados para asignar area/cargo a cada inspector (la auth ya no usa estos datos).
// Areas: 'hab'=Habilitaciones, 'obr'=Obras Privadas, 'seg'=Seguridad Urbana,
//        'amb'=Ambiente, 'bro'=Bromatologia, 'all'=Supervisor (todas las areas)
const INSPECTORES=[
  {nombre:'Maria Paula Campestre',legajo:'1001',area:'amb',cargo:'Inspector Municipal'},
  {nombre:'Marcelo Javier Zaccheo',legajo:'1002',area:'obr',cargo:'Tec. Superior Obras'},
  {nombre:'Mariana Arias',legajo:'1003',area:'bro',cargo:'Inspectora Municipal'},
  {nombre:'Federico Perez',legajo:'1004',area:'admin',cargo:'Inspector Municipal'},
];
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

// Pre-carga la firma usando el mapeo usuario→legajo guardado tras el ultimo login
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

// Mapea el codigo de area que devuelve la API (ej: "SEG", "HAB", "OBR") a las
// claves internas usadas por la app (ej: "seg", "hab", "obr", "all").
function mapApiArea(apiArea){
  if(!apiArea)return null;
  var k=String(apiArea).trim().toLowerCase();
  // Sinonimos / supervisor
  if(k==='all'||k==='admin'||k==='sup'||k==='supervisor'||k==='todas')return 'all';
  // Codigos directos que ya coinciden con las claves de AREAS
  if(AREAS[k])return k;
  // Mapeos extra por si el backend usa otra abreviatura
  var aliases={habilitaciones:'hab',obras:'obr',seguridad:'seg',ambiente:'amb',bromatologia:'bro',transito:'seg'};
  if(aliases[k])return aliases[k];
  return null;
}

async function doLogin(){
  var user=document.getElementById('l-nombre').value.trim();
  var pass=document.getElementById('l-clave').value;
  var err=document.getElementById('login-err');
  var btn=document.querySelector('.btn-login');
  if(!user||!pass){err.style.display='block';err.textContent='Completar usuario y clave';return;}
  err.style.display='none';
  btn.disabled=true;btn.textContent='Verificando...';
  try{
    var token=await apiGetToken();
    var data=await apiHacerLogin(token,user,pass);
    // Guardar mapeo usuario → legajo para pre-carga de firma en proximos logins
    var legajoApi=data.legajo||data.id||data.dni||data.idUsuario||user;
    localStorage.setItem('umap_'+user.toLowerCase(),String(legajoApi));
    // Buscar perfil local por nombre completo (si la API lo devuelve) para area/cargo
    var nombreApi=data.nombre||data.name||data.apellido_nombre||null;
    var local=getUsers().find(function(u){
      return (nombreApi&&normNombre(u.nombre)===normNombre(nombreApi))||normNombre(u.legajo||'')===normNombre(String(legajoApi));
    });
    // El area viene de la API en mayusculas (ej: "SEG"). La normalizamos.
    var areaApi=mapApiArea(data.area);
    console.log('[Login] area cruda de la API:',data.area,'→ mapeada a:',areaApi);
    var found={
      nombre:nombreApi||(local&&local.nombre)||user,
      legajo:String(legajoApi),
      area:areaApi||(local&&local.area)||'hab',
      cargo:data.cargo||data.puesto||(local&&local.cargo)||'Inspector Municipal',
      username:user
    };
    if(data.supervisor||data.es_supervisor||data.rol==='supervisor')found.area='all';
    var sigCv=document.getElementById('login-sig');
    var firma;
    if(!isCanvasBlank(sigCv)){
      firma=sigCv.toDataURL('image/png');
      localStorage.setItem('firma_'+found.legajo,firma);
    } else {
      firma=localStorage.getItem('firma_'+found.legajo)||null;
    }
    var insp={nombre:found.nombre,legajo:found.legajo,area:found.area,cargo:found.cargo,firma:firma,loggedIn:true,username:found.username};
    saveInsp(insp);
    document.getElementById('login-overlay').style.display='none';
    applyLogin(insp);
  }catch(e){
    console.error(e);
    err.style.display='block';
    var msg=String(e&&e.message||e);
    if(msg.indexOf('login_failed')===0){
      var detalle=msg.split(':').slice(1).join(':');
      err.textContent='Usuario o clave incorrectos'+(detalle?' ('+detalle+')':'');
    } else if(msg==='auth_failed'||msg==='token_not_found'){
      err.textContent='No se pudo conectar con el servicio de autenticacion';
    } else if(msg==='token_invalid'){
      err.textContent='Token invalido o credenciales rechazadas';
    } else {
      err.textContent='Error al iniciar sesion';
    }
  }finally{
    btn.disabled=false;btn.textContent='Ingresar al sistema';
  }
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

// ── PRE-COMPLETADO DEL PARRAFO INICIAL ────────────────────────────────────────
// Inspecciona los <p class="narr"> del formulario activo y completa los inputs
// vacios de fecha, mes, anio, hora e inspector segun el texto que los precede.
// Tambien rellena los campos "Dia / Mes / Ano / Hora-min" del acta de transito.
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

  // 1) Inputs dentro de cada parrafo narrativo
  f.querySelectorAll('p.narr').forEach(function(p){
    p.querySelectorAll('input').forEach(function(inp){
      if(inp.value)return; // no pisar lo que el usuario ya escribio
      var antes=textoAntes(inp);
      // Dia: el texto previo termina en "a los" o "los"
      if(/(?:a\s+)?los\s*$/.test(antes)){inp.value=dia;return;}
      // Mes: "del mes" o "del mes de"
      if(/mes(?:\s+de)?\s*$/.test(antes)){inp.value=mes;return;}
      // Anio (2 digitos): precedido por "dos mil", "de 20", "ano 20"
      if(/(?:dos\s+mil|de\s+20|ano\s+20)\s*$/.test(antes)){inp.value=anio2;return;}
      // Anio (4 digitos): "del ano" sin 20 despues
      if(/del\s+ano\s*$/.test(antes)){inp.value=anioFull;return;}
      // Hora: "siendo las"
      if(/siendo\s+las\s*$/.test(antes)){inp.value=hora;return;}
      // Inspector: en form-oi ("que suscribe") o form-ins ("el Inspector")
      if(insp&&insp.nombre){
        if(/que\s+suscribe\s*$/.test(antes)||/el\s+inspector\s*$/.test(antes)){
          inp.value=insp.nombre;return;
        }
      }
    });
  });

  // 2) Caso especial: acta de transito (form-st) usa labels separados Dia / Mes / Ano / Hora-min
  f.querySelectorAll('.f').forEach(function(field){
    var label=field.querySelector('label');
    if(!label)return;
    var inp=field.querySelector('input');
    if(!inp||inp.value)return;
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
  document.querySelectorAll('#'+TIPOS[t].form+' .map-canvas').forEach(function(cv){initMapCanvas(cv.id,cv.dataset.style);});
  setTimeout(function(){prefillInspector();prefillNarrativa(TIPOS[t].form);},100);
}

// ── NUMERACION ──
function getSeqLocal(p){return parseInt(localStorage.getItem('seq_'+p.replace(/-/g,''))||'0');}
function setSeqLocal(p,n){localStorage.setItem('seq_'+p.replace(/-/g,''),n);}

// Muestra el ultimo numero conocido (cache local) como referencia visual
function loadNum(){var n=Math.max(1,getSeqLocal(TIPOS[tipo].pref));document.getElementById('num-acta').value=String(n).padStart(6,'0');}

// Reserva el siguiente numero de forma atomica en Firebase (compartido entre todos los inspectores)
function getNextRemoteSeq(prefix){
  var key=prefix.replace(/-/g,'');
  return new Promise(function(resolve,reject){
    _fbDb.ref('contadores/'+key).transaction(function(current){
      return (current||0)+1;
    },function(error,committed,snapshot){
      if(error)reject(error);
      else if(!committed)reject(new Error('Transaccion no completada'));
      else resolve(snapshot.val());
    });
  });
}

async function nuevaActa(){
  if(!_fbDb){
    // Firebase no configurado: usar contador local (comportamiento anterior)
    var n=getSeqLocal(TIPOS[tipo].pref)+1;
    setSeqLocal(TIPOS[tipo].pref,n);
    document.getElementById('num-acta').value=String(n).padStart(6,'0');
    limpiar(false);prefillInspector();prefillNarrativa(TIPOS[tipo].form);
    toast('Nueva acta N '+String(n).padStart(6,'0')+' (modo local — configurar Firebase para numeracion compartida)');
    return;
  }
  if(!navigator.onLine){
    toast('Sin conexion a internet. Necesitas conexion para reservar un numero de acta.');
    return;
  }
  var btns=document.querySelectorAll('.btn-nueva');
  btns.forEach(function(b){b.disabled=true;b.textContent='Obteniendo numero...';});
  toast('Reservando numero de acta...',9000);
  try{
    var n=await getNextRemoteSeq(TIPOS[tipo].pref);
    setSeqLocal(TIPOS[tipo].pref,n);
    document.getElementById('num-acta').value=String(n).padStart(6,'0');
    limpiar(false);prefillInspector();prefillNarrativa(TIPOS[tipo].form);
    toast('Nueva acta N '+String(n).padStart(6,'0'));
  }catch(err){
    console.error(err);
    toast('Error al reservar numero. Verificar conexion a internet.');
  }
  btns.forEach(function(b){b.disabled=false;b.textContent='+ Nueva acta';});
}

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
  // Re-aplicar pre-completado de inspector y parrafo inicial
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
    // El numero fue reservado al presionar "Nueva Acta" — no se incrementa aqui
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

// ── DICTADO POR VOZ (Web Speech API) ─────────────────────────────────────────
// Agrega un boton de microfono a las textareas de "Observaciones" / "diferencias"
// para permitir el dictado de texto, util sobre todo en uso desde el celular.
// Soporte: Chrome/Edge (Android, desktop) y Safari (iOS 14.5+).
(function(){
  function textoEtiquetaCercana(ta){
    // 1) label dentro del contenedor .f
    var cont=ta.closest('.f');
    if(cont){
      var lbl=cont.querySelector('label');
      if(lbl&&lbl.textContent)return lbl.textContent;
    }
    // 2) un .hdr-sec previo al contenedor (caso del acta de transito)
    var prev=cont?cont.previousElementSibling:ta.previousElementSibling;
    while(prev){
      if(prev.classList&&prev.classList.contains('hdr-sec'))return prev.textContent||'';
      prev=prev.previousElementSibling;
    }
    return '';
  }
  function esDictable(ta){
    var t=textoEtiquetaCercana(ta);
    return /observ|diferenc/i.test(t);
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
    // Envolver la textarea con un wrapper relativo para posicionar el boton
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
      baseText=ta.value||'';
      if(baseText&&!/\s$/.test(baseText))baseText+=' ';
      rec.onresult=function(ev){
        var interim='',finales='';
        for(var i=ev.resultIndex;i<ev.results.length;i++){
          var r=ev.results[i];
          if(r.isFinal)finales+=r[0].transcript;
          else interim+=r[0].transcript;
        }
        if(finales){baseText+=finales+(/\s$/.test(finales)?'':' ');}
        ta.value=baseText+interim;
        // Disparar evento input para que el auto-resize y demas listeners reaccionen
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
// ─────────────────────────────────────────────────────────────────────────────

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
