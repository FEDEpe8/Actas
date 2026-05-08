// =====================================================================
// PORTAL MUNICIPAL DE CHASCOMÚS - VERSIÓN DE PRODUCCIÓN (LIMPIA)
// =====================================================================

// 1. CONEXIÓN CON GOOGLE SHEETS
const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbycfdmRzFh2LlMiJIlVmayT8jKt3ES9WZcW3hE9Wp9cUlqEbWSAYitQRwE69Yv_oWxQ/exec";

// 2. MEMORIA DE TRABAJO
let baseDeDatosMuni = {};
let sincronizacionPromise = null;

// 3. EL FILTRO MAESTRO (CAMPOS PROHIBIDOS)
const LISTA_NEGRA = [
    'styleurl', 'fill', 'fill-opacity', 'stroke', 'stroke-width',
    'stroke-opacity', 'description', 'icon', 'id', 'color_override',
    'gx_media_links', '@id', 'name', 'nombre', 'icon-opacity', 'icon-scale',
    'icon-color', 'icon-anchor', 'icon-offset', 'icon-offset-units', 'icon-rotation', 
    'icon-rotation-units', 'icon-size', 'icon-size-units', 'description', 'visibility', 'displaymode',
     'balloonstyle', 'liststyle', 'icon-opacity', 'labelstyle', 'linestyle', 'polystyle', 'balloontext', 'balloonbgcolor', 'balloonbordercolor', 'balloonborderwidth', 'balloonborderopacity', 'balloontextcolor', 'balloontextsize',
     'listitemtype', 'listitemstate', 'listitemcolor', 'listitembgcolor', 'listitembordercolor', 'listitemborderwidth',
     'listitemborderopacity', 'listitemtextcolor', 'listitemtextsize'
];

// =====================================================================
// SINCRONIZACIÓN INICIAL (idempotente: una sola request en vuelo)
// =====================================================================
function sincronizarPortal() {
    if (sincronizacionPromise) return sincronizacionPromise;
    sincronizacionPromise = fetch(WEBAPP_URL)
        .then(r => r.json())
        .then(data => {
            baseDeDatosMuni = data || {};
            console.log("portal-chascomus: Sincronización de datos exitosa.");
        })
        .catch(e => {
            console.warn("portal-chascomus: Trabajando con datos locales del archivo.", e);
            baseDeDatosMuni = {};
        });
    return sincronizacionPromise;
}

// Lanzar sincronización al cargar el script (en paralelo, no bloquea capas)
sincronizarPortal();

// =====================================================================
// SISTEMA DE FILTRO POR BARRIO
// =====================================================================

// Almacén de datos de capas filtrables (en memoria)
const _datosFiltrables  = {}; // { clave: geojson }
const _layersFiltrables = {}; // { clave: L.layerGroup }
let   _barrioActivo     = null; // nombre del barrio seleccionado

// Todos los anillos de barrios (para detectar features rurales)
let _todosLosAnillosBarrios = []; // [ [coord,...], ... ]

// Claves que son rubros (para filtrado cruzado con estado)
const RUBRO_CLAVES = new Set([
    'alimentacion','gastronomia','indumentaria','salud','automotor',
    'construccion','belleza','turismo','hogar','tecnologia','educacion','agro','otros'
]);

// ── Geometría: punto en polígono (ray casting) ────────────────────────
function _puntoEnPoligono(px, py, anillo) {
    let dentro = false;
    for (let i = 0, j = anillo.length - 1; i < anillo.length; j = i++) {
        const [xi, yi] = anillo[i];
        const [xj, yj] = anillo[j];
        if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi))
            dentro = !dentro;
    }
    return dentro;
}

// ── Centroide simple de una feature ───────────────────────────────────
// Soporta Point, LineString, MultiLineString, Polygon, MultiPolygon
function _centroide(feature) {
    const g = feature.geometry;
    if (!g) return null;
    let coords;
    if      (g.type === 'Point')           return g.coordinates;
    else if (g.type === 'LineString')      coords = g.coordinates;
    else if (g.type === 'MultiLineString') coords = g.coordinates[0];
    else if (g.type === 'Polygon')         coords = g.coordinates[0];
    else if (g.type === 'MultiPolygon')    coords = g.coordinates[0][0];
    else return null;
    if (g.type === 'LineString' || g.type === 'MultiLineString') {
        return coords[Math.floor(coords.length / 2)];
    }
    const lng = coords.reduce((s, c) => s + c[0], 0) / coords.length;
    const lat = coords.reduce((s, c) => s + c[1], 0) / coords.length;
    return [lng, lat];
}

// ── Anillo externo del barrio ──────────────────────────────────────────
function _anillosBarrio(feature) {
    const g = feature.geometry;
    if (!g) return [];
    if (g.type === 'Polygon')
        return [g.coordinates[0]];
    if (g.type === 'MultiPolygon')
        return g.coordinates.map(p => p[0]);
    if (g.type === 'GeometryCollection')
        return g.geometries.flatMap(sub => {
            if (sub.type === 'Polygon')      return [sub.coordinates[0]];
            if (sub.type === 'MultiPolygon') return sub.coordinates.map(p => p[0]);
            return [];
        });
    return [];
}

// ── Toast informativo ─────────────────────────────────────────────────
function _mostrarToast(msg) {
    let t = document.getElementById('_toast-barrio');
    if (!t) {
        t = document.createElement('div');
        t.id = '_toast-barrio';
        t.style.cssText = `
            position:fixed; bottom:24px; left:50%; transform:translateX(-50%);
            background:#18224c; color:#b8d30f; padding:9px 20px;
            border-radius:20px; font-family:'Barlow',sans-serif;
            font-size:13px; font-weight:700; letter-spacing:0.5px;
            box-shadow:0 4px 16px rgba(0,0,0,0.35); z-index:9999;
            pointer-events:none; transition:opacity 0.4s;
        `;
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.style.opacity = '0'; }, 3500);
}

// ── Renderizar parcelas filtradas dentro de un barrio ─────────────────
function _renderizarFiltradas(anillos) {
    let total = 0;

    // Detectar filtros de estado y rubro activos (capas y map son globales del HTML)
    let vigsActivo = false, vencActivo = false, hayRubroActivo = false;
    try {
        vigsActivo     = typeof capas !== 'undefined' && map.hasLayer(capas.vigentes);
        vencActivo     = typeof capas !== 'undefined' && map.hasLayer(capas.vencidas);
        hayRubroActivo = typeof capas !== 'undefined' &&
            [...RUBRO_CLAVES].some(r => capas[r] && map.hasLayer(capas[r]));
    } catch(e) { /* seguridad: si map/capas aún no existen, sin filtro cruzado */ }

    for (const clave in _datosFiltrables) {
        const lg = _layersFiltrables[clave];
        if (!lg) continue;
        lg.clearLayers();

        const esRubro  = RUBRO_CLAVES.has(clave);
        const esEstado = clave === 'vigentes' || clave === 'vencidas';

        // Si es vigentes/vencidas y hay un rubro activo, el rubro ya filtra por estado → no duplicar
        if (esEstado && hayRubroActivo) continue;

        const filtradas = _datosFiltrables[clave].features.filter(f => {
            const c = _centroide(f);
            if (!c) return false;

            const enBarrioActual = anillos.some(anillo => _puntoEnPoligono(c[0], c[1], anillo));

            // Para rubros: incluir también features fuera de TODOS los barrios (puntos rurales)
            if (esRubro && !enBarrioActual) {
                const esRural = _todosLosAnillosBarrios.length > 0 &&
                    !_todosLosAnillosBarrios.some(a => _puntoEnPoligono(c[0], c[1], a));
                if (!esRural) return false; // está en otro barrio, no mostrar
            } else if (!esRubro && !enBarrioActual) {
                return false; // capas no-rubro: solo el barrio seleccionado
            }

            // Para capas de rubro: filtrar por estado si hay filtro de estado activo
            if (esRubro && (vigsActivo || vencActivo)) {
                const props = f.properties || {};
                const estadoF = (props.ESTADO || props.estado || '').toUpperCase();
                if ( vigsActivo && !vencActivo) return estadoF === 'VIGENTE';
                // vencidas incluye también SIN FECHA (ya están en vencidas.geojson)
                if (!vigsActivo &&  vencActivo) return estadoF === 'VENCIDA' || estadoF === 'SIN FECHA';
                // Ambos activos → mostrar todo el rubro sin filtrar
            }

            return true;
        });
        total += filtradas.length;

        if (filtradas.length > 0) {
            L.geoJSON({ type: 'FeatureCollection', features: filtradas }, {
// ── Puntos: circleMarker coloreado por estado ──────────
pointToLayer: (feature, latlng) => {
    const estado = (feature.properties?.ESTADO || feature.properties?.estado || '').toUpperCase();
    const color  = estado === 'VIGENTE'   ? '#2fc96fff'
                 : estado === 'VENCIDA'   ? '#c74031ff'
                 : estado === 'SIN FECHA' ? '#c6742cff'
                 : '#2b8ccdff';
    return L.marker(latlng, {
        icon: L.divIcon({
            className: 'icono-emoji-transparente',
            html: `<div style="
                width: 28px;
                height: 36px;
                position: relative;
            ">
                <svg viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;">
                    <path d="M14 0 C6.3 0 0 6.3 0 14 C0 24.5 14 36 14 36 C14 36 28 24.5 28 14 C28 6.3 21.7 0 14 0 Z"
                          fill="${color}" stroke="#ffffff" stroke-width="2"/>
                    <circle cx="14" cy="14" r="5" fill="#ffffff" fill-opacity="0.7"/>
                </svg>
            </div>`,
            iconSize:   [20, 32],
            iconAnchor: [10, 32],
            popupAnchor:[0, -32]
        })
    });
},          // ── Polígonos y líneas ─────────────────────────────────
                style: (feature) => {
                    const t      = feature.geometry?.type || '';
                    const isLine = t === 'LineString' || t === 'MultiLineString';
                    const estado = (feature.properties?.ESTADO || feature.properties?.estado || '').toUpperCase();
                    const fillColor = estado === 'VIGENTE'   ? '#26c267ff'
                                    : estado === 'VENCIDA'   ? '#bf3e30ff'
                                    : estado === 'SIN FECHA' ? '#c67229ff'
                                    : '#2a85c2ff';
                    return isLine ? {
                        color: '#e8a020', weight: 2.5, opacity: 0.9
                    } : {
                        fillColor, fillOpacity: 0.55, color: '#fff', weight: 1
                    };
                },
                onEachFeature: (feature, layer) => {
                    const props  = feature.properties || {};
                    const nom    = props.nombre || props['NOMBRE / COMERCIO'] || props.name || props.CCA || 'Sin nombre';
                    const estado = (props.ESTADO || props.estado || '').toUpperCase();
                    const colorHeader = estado === 'VIGENTE'   ? '#28d36fff'
                                      : estado === 'VENCIDA'   ? '#c53323ff'
                                      : estado === 'SIN FECHA' ? '#d7741dff'
                                      : '#18224c';
                    let html = `
                        <div style="min-width:220px;font-family:sans-serif;border-radius:8px;overflow:hidden;">
                            <div style="background:${colorHeader};color:#fff;padding:10px;text-align:center;">
                                <b style="font-size:13px;">${escHTML(nom)}</b>
                                ${estado ? `<div style="font-size:10px;opacity:0.85;margin-top:2px;">${estado}</div>` : ''}
                            </div>
                            <div style="padding:12px;background:#fff;">
                    `;
                    const SKIP = new Set(['name','nombre','styleurl','fill','fill-opacity',
                                         'stroke','stroke-width','stroke-opacity','icon','id',
                                         'gx_media_links','@id','estado','descripción','description',
                                         'icon-opacity','icon-color','icon-scale','icon-offset',
                                         'icon-offset-units','icon-rotation','icon-size']);
                    for (const p in props) {
                        const val = props[p];
                        if (SKIP.has(p.toLowerCase()) || val === null || val === '' || typeof val === 'object') continue;
                        html += `<div style="margin-bottom:7px;border-bottom:1px solid #f0f0f0;padding-bottom:4px;">
                            <span style="font-size:9px;color:#aaa;text-transform:uppercase;font-weight:700;">${escHTML(p)}</span><br>
                            <span style="font-size:12px;color:#212529;font-weight:600;">${escHTML(String(val))}</span>
                        </div>`;
                    }
                    html += `</div></div>`;
                    layer.bindPopup(html);
                }
            }).addTo(lg);
        }
    }
    return total;
}

// ── Limpiar filtro ────────────────────────────────────────────────────
function _limpiarFiltro() {
    _barrioActivo = null;
    for (const clave in _layersFiltrables) {
        _layersFiltrables[clave]?.clearLayers();
    }
    _mostrarToast('🔄 Filtro eliminado');
}

// ── Cargar capa filtrable (parcelas) ──────────────────────────────────
// Los datos se guardan en memoria; solo se renderizan al seleccionar un barrio
async function cargarCapaFiltrable(url, layerGroup, clave) {
    try {
        const r = await fetch(url);
        if (!r.ok) throw new Error(`HTTP ${r.status} en ${url}`);
        const data = await r.json();
        _datosFiltrables[clave]  = data;
        _layersFiltrables[clave] = layerGroup;
        console.log(`portal-chascomus: Capa filtrable "${clave}" cargada (${data.features.length} features)`);
    } catch (err) {
        console.error('portal-chascomus: Error cargando capa filtrable:', url, err);
    }
}

// ── Cargar barrios con lógica de filtro ───────────────────────────────
async function cargarBarriosConFiltro(url, layerGroup) {
    await sincronizarPortal();
    try {
        const r = await fetch(url);
        if (!r.ok) throw new Error(`HTTP ${r.status} en ${url}`);
        const data = await r.json();

        // Guardar todos los anillos de barrios (para detectar features rurales)
        _todosLosAnillosBarrios = data.features.flatMap(f => _anillosBarrio(f));
        console.log(`portal-chascomus: ${_todosLosAnillosBarrios.length} anillos de barrios cargados.`);

        L.geoJSON(data, {
            style: feat => ({
                fillColor:   feat.properties.fill   || '#3498db',
                fillOpacity: feat.properties['fill-opacity'] ?? 0.3,
                color:       feat.properties.stroke || '#ffffff',
                weight:      1.5
            }),
            onEachFeature: (feature, layer) => {
                const nombre = feature.properties.name || 'Barrio';

                // Popup informativo
                layer.bindPopup(`
                    <div style="font-family:sans-serif;min-width:180px;border-radius:8px;overflow:hidden;">
                        <div style="background:#18224c;color:#b8d30f;padding:10px;text-align:center;">
                            <b style="font-size:14px;">🏘️ ${escHTML(nombre)}</b>
                        </div>
                        <div style="padding:10px;background:#fff;text-align:center;font-size:12px;color:#555;">
                            Tocá para ver las parcelas de este barrio
                        </div>
                    </div>
                `);

                // Click → filtrar parcelas
                layer.on('click', () => {
                    if (_barrioActivo === nombre) {
                        _limpiarFiltro();
                        layer.closePopup();
                        return;
                    }
                    _barrioActivo = nombre;
                    const anillos = _anillosBarrio(feature);
                    const total   = _renderizarFiltradas(anillos);

                    // Resaltar barrio seleccionado
                    layerGroup.eachLayer(l => {
                        if (l.setStyle) l.setStyle({ weight: 1.5, fillOpacity: 0.15 });
                    });
                    layer.setStyle({ weight: 3, fillOpacity: 0.5, color: '#b8d30f' });

                    _mostrarToast(`🏘️ ${nombre} — ${total} parcela${total !== 1 ? 's' : ''}`);
                    layer.closePopup();
                });

                // Hover
                layer.on('mouseover', () => {
                    if (_barrioActivo !== nombre)
                        layer.setStyle({ fillOpacity: 0.5, weight: 2.5 });
                });
                layer.on('mouseout', () => {
                    if (_barrioActivo !== nombre)
                        layer.setStyle({
                            fillColor:   feature.properties.fill   || '#3498db',
                            fillOpacity: feature.properties['fill-opacity'] ?? 0.3,
                            color:       feature.properties.stroke || '#ffffff',
                            weight:      1.5
                        });
                });
            }
        }).addTo(layerGroup);

    } catch (err) {
        console.error('portal-chascomus: Error cargando barrios:', url, err);
    }
}




// =====================================================================
// CARGA DE CAPAS
// =====================================================================

// Mapa de emojis por nombre de archivo GeoJSON (sin extensión, minúsculas)
const EMOJI_POR_CAPA = {
    // Territorio
    'barrios':         '🏘️',
    'sedesbarriales':  '🏠',
    // Producción
    'sosrural':        '🚜',
    'apiarios':        '🐝',
    'acacianegra':     '🌿',
    // Plazas y alojamientos
    'alojamientos': '🏨',
    'restaurantes':  '🎛️',
    'esp_recreativos': '🌳',
    //Habilitaciones comerciales
    'vigentes': '✅',
    'vencidas': '❌',
    // Comercios por rubro
    'alimentacion':    '🛒',
    'gastronomia':     '🍽️',
    'indumentaria':    '👗',
    'salud':           '🏥',
    'automotor':       '🔧',
    'construccion':    '🏗️',
    'belleza':         '💇',
    'turismo':         '🏨',
    'hogar':           '🏡',
    'tecnologia':      '💻',
    'educacion':       '📚',
    'agro':            '🌱',
    'otros':           '🏬',
    // Gestión
    'edimunicipales':  '🕋',
    'parcelas-urbanizadas':  '🗺️',
    'parcelas-rurales':      '🗺️',
    'subparcelas':           '🗺️',
    // Servicios
    'antenas':         '📡',
    'puntoswifi':      '🛜',
    // Seguridad
    'seguridad':       '🚨',
    'calles_chascomus':  '🚏',
    // Educación
    'escuelas_chascomus': '🏫'
};

function resolverEmoji(url) {
    const nombre = url.split('/').pop().replace('.geojson', '').toLowerCase();
    return EMOJI_POR_CAPA[nombre] || null;
}

// Genera un id único
function generarId() {
    return Math.random().toString(36).slice(2, 11);
}

// Escapa caracteres HTML para evitar XSS en popups
function escHTML(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

async function cargarCapaGeoJSON(url, destino, estiloPropio = null) {
    const emoji = resolverEmoji(url);

    try {
        // Carga el GeoJSON sin bloquear (no espera Sheets primero)
        const r = await fetch(url);
        if (!r.ok) throw new Error(`HTTP ${r.status} en ${url}`);
        const data = await r.json();

        // Espera los datos de Sheets en paralelo (ya puede estar lista)
        await sincronizarPortal();

        L.geoJSON(data, {
            // Soporte para puntos con icono emoji
            pointToLayer: (feature, latlng) => {
                if (emoji) {
                    return L.marker(latlng, {
                        icon: L.divIcon({
                            className: 'icono-emoji-transparente',
                            html: `<div class="emoji-marker">${emoji}</div>`,
                            iconSize: [30, 30],
                            iconAnchor: [15, 15]
                        })
                    });
                }
                return L.marker(latlng);
            },
            // Estilo para polígonos y líneas
            style: (feature) => {
                const props = (feature && feature.properties) || {};
                const nom = (props.name || props.nombre || "").toUpperCase();
                const dExcel = baseDeDatosMuni[nom] || {};
                return estiloPropio || {
                    fillColor:   dExcel.COLOR_OVERRIDE || props.fill || '#3498db',
                    fillOpacity: props['fill-opacity'] || 0.5,
                    color:       props.stroke || '#ffffff',
                    weight:      1.5
                };
            },
            onEachFeature: (feature, layer) => {
                const props = (feature && feature.properties) || {};
                const nom = props.name || props.nombre || "Sin Nombre";
                const id = generarId();
                const finalProps = Object.assign({}, props, baseDeDatosMuni[String(nom).toUpperCase()] || {});

                let html = `
                    <div style="min-width:260px; font-family:sans-serif; border-radius:8px; overflow:hidden;">
                        <div style="background:#2c3e50; color:#fff; padding:12px; text-align:center;">
                            <h4 style="margin:0; font-size:14px; text-transform:uppercase;">${escHTML(nom)}</h4>
                        </div>
                        <div id="body-${id}" style="padding:15px; background:#fff; max-height:220px; overflow-y:auto;">
                `;

                let hayDatosVisibles = false;

                for (let p in finalProps) {
                    const pLow = p.toLowerCase();
                    if (!LISTA_NEGRA.includes(pLow) && finalProps[p] !== null && finalProps[p] !== "") {
                        hayDatosVisibles = true;
                        html += `
                            <div style="margin-bottom:10px; border-bottom:1px solid #f8f9fa; padding-bottom:5px;">
                                <label style="font-size:9px; color:#a4b0be; text-transform:uppercase; font-weight:bold;">${escHTML(p)}</label>
                                <div class="dato-valor-${id}" data-campo="${escHTML(p)}" style="font-size:13px; color:#212529; font-weight:600;">${escHTML(finalProps[p])}</div>
                            </div>`;
                    }
                }

                if (!hayDatosVisibles) {
                    html += `<div style="text-align:center; color:#adb5bd; font-size:12px; font-style:italic; padding:10px;">Cargar datos de gestión.</div>`;
                }

                html += `
                        </div>
                    </div>
                `;
                layer.bindPopup(html);
            }
        }).addTo(destino);
    } catch (err) {
        console.error("portal-chascomus: Error cargando capa:", url, err);
    }
}