// CuriosityFast PWA – localStorage by date. Offline. No cloud.
const BUCKETS = ["Future","Past","Curiosity"];

const $ = sel => document.querySelector(sel);
const now = () => new Date();

function todayKey() {
  const d = now();
  return d.toISOString().slice(0,10); // YYYY-MM-DD
}

function readDay(key=todayKey()) {
  try {
    const raw = localStorage.getItem(`cf:${key}`);
    return raw ? JSON.parse(raw) : [];
  } catch(e) { return []; }
}

function writeDay(entries, key=todayKey()) {
  localStorage.setItem(`cf:${key}`, JSON.stringify(entries));
}

function pad(n){return n.toString().padStart(2,'0')}

function unlockTime() {
  // stored as "HH:MM"; default 21:00
  const t = localStorage.getItem('cf:unlock') || "21:00";
  return t;
}

function canReview() {
  const t = unlockTime();
  const [h,m] = t.split(':').map(x=>parseInt(x,10));
  const d = now();
  const unlock = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, 0, 0);
  return d >= unlock || localStorage.getItem('cf:early') === '1';
}

function setUnlockLabel(){
  $('#unlockLabel').textContent = unlockTime();
}

function showStatus(msg, cls='') {
  const s = $('#status');
  s.textContent = msg;
  s.className = 'hint ' + cls;
  setTimeout(()=>{ s.textContent=''; s.className='hint'; }, 1200);
}

// Capture modal
let activeBucket = 'Curiosity';
const modal = $('#modal');
$('#btn-future').onclick = ()=> openModal('Future');
$('#btn-past').onclick = ()=> openModal('Past');
$('#btn-curiosity').onclick = ()=> openModal('Curiosity');
$('#cancel').onclick = ()=> modal.style.display='none';
$('#save').onclick = saveEntry;

function openModal(bucket){
  activeBucket = bucket;
  $('#modalTitle').textContent = `Add to ${bucket}`;
  $('#entryText').value = '';
  modal.style.display='flex';
  $('#entryText').focus();
}

function saveEntry(){
  const txt = $('#entryText').value.trim();
  if(!txt){ modal.style.display='none'; return; }
  const entries = readDay();
  const d = now();
  entries.push({
    bucket: activeBucket,
    text: txt,
    timestamp: `${pad(d.getHours())}:${pad(d.getMinutes())}`
  });
  writeDay(entries);
  modal.style.display='none'; // vanish; no list
  showStatus('Saved', 'success');
}

// Review
const reviewModal = $('#reviewModal');
$('#btn-review').onclick = () => {
  if(!canReview()){
    showStatus(`Locked until ${unlockTime()}`, 'locked');
    return;
  }
  const entries = readDay();
  if(!entries.length){
    showStatus('No entries today'); return;
  }
  const order = ["Curiosity","Past","Future"]; // left→right feel
  let out = `TODAY: ${todayKey()}\n`;
  for(const b of order){
    out += `\n— ${b} —\n`;
    entries.filter(e=>e.bucket===b).forEach(e=>{
      out += `[${e.timestamp}] ${e.text}\n`;
    });
  }
  $('#reviewBody').textContent = out;
  reviewModal.style.display='flex';
};

$('#closeReview').onclick = ()=> reviewModal.style.display='none';

$('#exportBtn').onclick = ()=> {
  const entries = readDay();
  const blob = new Blob([JSON.stringify(entries, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${todayKey()}.json`;
  a.click();
};

// Settings
$('#btn-time').onclick = () => {
  const cur = unlockTime();
  const val = prompt('Set unlock time (24h HH:MM)', cur);
  if(!val) return;
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(val);
  if(!m){ alert('Invalid time. Use HH:MM (24h).'); return; }
  localStorage.setItem('cf:unlock', val);
  setUnlockLabel();
  showStatus('Unlock time saved','success');
};

$('#btn-early').onclick = () => {
  const v = localStorage.getItem('cf:early') === '1' ? '0':'1';
  localStorage.setItem('cf:early', v);
  showStatus(v==='1' ? 'Early review ON' : 'Early review OFF');
};

setUnlockLabel();
