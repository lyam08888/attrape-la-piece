// Character creator module
// Builds the UI inside the creatorMenu overlay and allows downloading a pixel avatar

document.addEventListener('DOMContentLoaded', () => {
  const partsContainer = document.getElementById('creatorParts');
  const previewCanvas = document.getElementById('creatorPreview');
  const downloadBtn = document.getElementById('creatorDownload');
  if (!partsContainer || !previewCanvas || !downloadBtn) return;

  const PARTS = [
    { key: 'head',      label: 'T\u00eate',       styles: ['Classique','Carr\u00e9e','Ronde'], defaultColor: '#ffe0b0' },
    { key: 'trunk',     label: 'Tronc',      styles: ['Bleu','Vert','Rouge'],        defaultColor: '#4976d0' },
    { key: 'armLeft',   label: 'Bras G.',    styles: ['Normal','Muscl\u00e9','Robot'],    defaultColor: '#ffe0b0' },
    { key: 'armRight',  label: 'Bras D.',    styles: ['Normal','Muscl\u00e9','Robot'],    defaultColor: '#ffe0b0' },
    { key: 'handLeft',  label: 'Main G.',    styles: ['Normale','Grande','Gant'],    defaultColor: '#ffe0b0' },
    { key: 'handRight', label: 'Main D.',    styles: ['Normale','Grande','Gant'],    defaultColor: '#ffe0b0' },
    { key: 'legLeft',   label: 'Jambe G.',   styles: ['Jean','Noire','Robot'],       defaultColor: '#4862a3' },
    { key: 'legRight',  label: 'Jambe D.',   styles: ['Jean','Noire','Robot'],       defaultColor: '#4862a3' },
    { key: 'footLeft',  label: 'Pied G.',    styles: ['Rouge','Bleu','Marron'],      defaultColor: '#c13925' },
    { key: 'footRight', label: 'Pied D.',    styles: ['Rouge','Bleu','Marron'],      defaultColor: '#c13925' },
    { key: 'eye',       label: 'Yeux',       styles: ['Noirs','Bleus','Verts'],      defaultColor: '#181c28' },
    { key: 'mouth',     label: 'Bouche',     styles: ['Sourire','Triste','O'],       defaultColor: '#be6a1e' },
    { key: 'nose',      label: 'Nez',        styles: ['Petit','Long','Pointu'],      defaultColor: '#efbc93' },
    { key: 'earLeft',   label: 'Oreille G.', styles: ['Ronde','Pointue','Absente'],  defaultColor: '#ffe0b0' },
    { key: 'earRight',  label: 'Oreille D.', styles: ['Ronde','Pointue','Absente'],  defaultColor: '#ffe0b0' },
  ];

  const defaultSkinTones = [
    '#ffe0b0','#f2c29c','#efbc93','#c68642','#ae7b52','#a1622b','#82551e','#5c2c06'
  ];

  const state = {};
  PARTS.forEach(p => { state[p.key] = { style:0, color:p.defaultColor }; });

  PARTS.forEach(part => {
    const div = document.createElement('div');
    div.className = 'creator-part';

    const label = document.createElement('label');
    label.textContent = part.label;
    const select = document.createElement('select');
    part.styles.forEach((style, i) => {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = style;
      select.appendChild(opt);
    });
    select.value = 0;
    select.onchange = e => { state[part.key].style = +e.target.value; drawAll(); };
    div.appendChild(label);
    div.appendChild(document.createElement('br'));
    div.appendChild(select);

    if (["head","armLeft","armRight","handLeft","handRight","earLeft","earRight","nose"].includes(part.key)) {
      const toneSel = document.createElement('select');
      defaultSkinTones.forEach(col => {
        const opt = document.createElement('option');
        opt.value = col;
        opt.textContent = col;
        opt.style.background = col;
        toneSel.appendChild(opt);
      });
      toneSel.value = part.defaultColor;
      toneSel.onchange = e => { state[part.key].color = e.target.value; drawAll(); };
      div.appendChild(document.createElement('br'));
      div.appendChild(toneSel);
      const pick = document.createElement('input');
      pick.type = 'color';
      pick.value = part.defaultColor;
      pick.oninput = e => { state[part.key].color = e.target.value; drawAll(); };
      div.appendChild(document.createElement('br'));
      div.appendChild(pick);
    }
    partsContainer.appendChild(div);
  });

  function drawAll() {
    const ctx = previewCanvas.getContext('2d');
    ctx.clearRect(0,0,48,48);
    ctx.fillStyle = state.trunk.color;
    ctx.fillRect(18,22,12,15);

    ctx.fillStyle = state.head.color;
    if(state.head.style === 0) ctx.fillRect(14,8,20,16);
    else if(state.head.style === 1) ctx.fillRect(14,10,20,12);
    else { ctx.beginPath(); ctx.arc(24,16,10,0,2*Math.PI); ctx.fill(); }

    ctx.fillStyle = state.earLeft.color;
    if(state.earLeft.style!==2){ if(state.earLeft.style===0) ctx.fillRect(11,14,4,6); else {ctx.beginPath();ctx.arc(13,18,3,Math.PI/2,3*Math.PI/2);ctx.fill();}}
    ctx.fillStyle = state.earRight.color;
    if(state.earRight.style!==2){ if(state.earRight.style===0) ctx.fillRect(33,14,4,6); else {ctx.beginPath();ctx.arc(35,18,3,-Math.PI/2,Math.PI/2);ctx.fill();}}

    ctx.fillStyle = state.armLeft.style===2 ? '#b8d0d6' : state.armLeft.color;
    ctx.fillRect(10,22,6,15);
    ctx.fillStyle = state.armRight.style===2 ? '#b8d0d6' : state.armRight.color;
    ctx.fillRect(32,22,6,15);

    ctx.fillStyle = state.handLeft.style===2 ? '#aee7e0' : state.handLeft.color;
    ctx.fillRect(10,37,6,5);
    ctx.fillStyle = state.handRight.style===2 ? '#aee7e0' : state.handRight.color;
    ctx.fillRect(32,37,6,5);

    if(state.legLeft.style===0) ctx.fillStyle='#4862a3';
    else if(state.legLeft.style===1) ctx.fillStyle='#111';
    else ctx.fillStyle='#b8d0d6';
    ctx.fillRect(16,38,6,8);
    if(state.legRight.style===0) ctx.fillStyle='#4862a3';
    else if(state.legRight.style===1) ctx.fillStyle='#111';
    else ctx.fillStyle='#b8d0d6';
    ctx.fillRect(26,38,6,8);

    if(state.footLeft.style===0) ctx.fillStyle='#c13925';
    else if(state.footLeft.style===1) ctx.fillStyle='#3678c7';
    else ctx.fillStyle='#6e4033';
    ctx.fillRect(16,45,6,3);
    if(state.footRight.style===0) ctx.fillStyle='#c13925';
    else if(state.footRight.style===1) ctx.fillStyle='#3678c7';
    else ctx.fillStyle='#6e4033';
    ctx.fillRect(26,45,6,3);

    if(state.eye.style===0) ctx.fillStyle='#181c28';
    else if(state.eye.style===1) ctx.fillStyle='#38adfd';
    else ctx.fillStyle='#44fd8c';
    ctx.fillRect(20,15,3,3); ctx.fillRect(28,15,3,3);

    if(state.mouth.style===0){ ctx.strokeStyle='#e05d41'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(22,21); ctx.lineTo(26,23); ctx.lineTo(30,21); ctx.stroke(); }
    else if(state.mouth.style===1){ ctx.strokeStyle='#453e3e'; ctx.lineWidth=2; ctx.beginPath(); ctx.moveTo(22,23); ctx.lineTo(26,21); ctx.lineTo(30,23); ctx.stroke(); }
    else{ ctx.strokeStyle='#be6a1e'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(26,21,3,0,Math.PI); ctx.stroke(); }

    ctx.fillStyle = state.nose.color;
    if(state.nose.style===0){ ctx.fillRect(25,18,2,4); }
    else if(state.nose.style===1){ ctx.fillRect(24,17,4,7); }
    else{ ctx.beginPath(); ctx.moveTo(26,18); ctx.lineTo(28,22); ctx.lineTo(26,24); ctx.fill(); }
  }

  drawAll();

  downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.href = previewCanvas.toDataURL();
    link.download = 'pixel_personnage.png';
    link.click();
  });
});
