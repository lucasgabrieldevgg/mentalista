/* Suíte do Mentalista — carregamento + estrutura + fixes + identidade + segurança
   Padrão da casa: jsdom + asserts no DOM/texto real, contador no fim. */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
let ok = 0, fail = 0;
function t(nome, cond) {
  if (cond) { ok++; console.log('  ✓ ' + nome); }
  else { fail++; console.log('  ✗ ' + nome); }
}

// mocks (rede/mídia/sensores)
global.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}), text: () => Promise.resolve('') });
global.matchMedia = global.matchMedia || (() => ({ matches: false, addListener(){}, removeListener(){}, addEventListener(){}, removeEventListener(){} }));
global.Audio = global.Audio || class { play(){ return Promise.resolve(); } pause(){} };
global.AudioContext = global.AudioContext || class { constructor(){ this.state='running'; } resume(){ return Promise.resolve(); } close(){ return Promise.resolve(); } createGain(){ return {gain:{value:0,setValueAtTime(){},linearRampToValueAtTime(){}},connect(){}} } createOscillator(){ return {connect(){},start(){},stop(){},frequency:{value:0,setValueAtTime(){}},type:''} } };
global.speechSynthesis = global.speechSynthesis || { speak(){}, cancel(){}, getVoices(){ return []; } };
global.SpeechSynthesisUtterance = global.SpeechSynthesisUtterance || class {};

let dom = null, doc = null;
try {
  dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'https://lucasgabrieldevgg.github.io/mentalista/' });
  doc = dom.window.document;
} catch (e) { console.log('CRASH no carregamento: ' + e.message); }

console.log('\n🔍 suíte Mentalista\n');

// ─── carregamento ───
t('index.html carrega no jsdom sem crash', !!dom);
t('título menciona Mentalista', /mentalista/i.test(doc ? doc.title : ''));

// ─── estrutura essencial ───
t('lema da casa presente ("…só precisa observar")', !!doc.querySelector('.frase-j') && /precisa observar/.test(doc.body.textContent));
t('9 abas de navegação existem', ['b-hoje','b-prog','b-diario','b-mentor','b-desaf','b-faces','b-patentes','b-home','b-escola'].every(id => !!doc.querySelector('#' + id)));
t('views principais existem', ['v-land','v-hoje','v-prog','v-diario','v-mentor','v-desafios','v-faces','v-patentes','v-escola'].every(id => !!doc.querySelector('#' + id)));
t('configurações (⚙️) existe', !!doc.querySelector('#b-config'));

// ─── fixes históricos não podem regredir ───
t('FIX anti-farm multi-aba: listener de storage presente', /addEventListener\('storage'/.test(html));
t('biblioteca de rostos v8 (Duchenne) presente', /Duchenne/.test(html));
t('programa de 84 missões presente', /\/84|84 miss/.test(html));

// ─── identidade noir (não pode virar AI slop) ───
t('display em Special Elite (máquina de escrever)', /h1\{font-family:'Special Elite'/.test(html));
t('Special Elite carregada no Google Fonts', /family=Special\+Elite/.test(html));
t('favicon 🧠 data-URI único', (html.match(/rel="icon"/g) || []).length === 1 && /rel="icon"/.test(html));
t('prefers-reduced-motion respeitado', /@media \(prefers-reduced-motion:reduce\)/.test(html));
t('nav mobile com affordance de scroll (fade)', /mask-image:linear-gradient/.test(html));

// ─── segurança ───
t('sem segredo no index.html', !/ghp_[A-Za-z0-9]{20,}|sk-or-v1-|sk-ant-|vcp_[A-Za-z0-9]{20,}/.test(html));

console.log('\n══════════════════════════');
console.log(`RESULTADO: ${ok} ✓ / ${fail} ✗ ${fail === 0 ? '— MENTALISTA ÍNTEGRO 🔍' : '— HÁ REGRESSÕES!'}`);
process.exit(fail === 0 ? 0 : 1);
