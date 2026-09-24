const state = { rooms: [], schedules: [], meta: {} };
const $ = (id) => document.getElementById(id);
const dayNames = ["", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"];

function fillSelect(id, values, labeler = String) {
  const el = $(id);
  el.innerHTML = values.map(v => `<option value="${v}">${labeler(v)}</option>`).join("");
}

function unique(values) { return [...new Set(values.filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'zh-CN')); }

function isBorrowRecord(record) {
  const text = `${record.course || ""} ${record.teacher || ""}`;
  // The renderer defines ISTK=4 as "借用". This term's API also represents
  // borrowed rooms as the pseudo-course "临时教室长期使用".
  return String(record.type) === "4" || /借用|临时教室(?:长期)?使用/.test(text);
}

function occupies(record, week, weekday, start, end) {
  if (isBorrowRecord(record)) return false;
  const weeks = record.weeks || [];
  return weeks.includes(week) && Number(record.weekday) === weekday && Number(record.start) <= end && Number(record.end) >= start;
}

function query() {
  const week = Number($("week").value);
  const weekday = Number($("weekday").value);
  const start = Number($("startSection").value);
  const end = Math.max(start, Number($("endSection").value));
  $("endSection").value = end;
  const campus = $("campus").value;
  const building = $("building").value;
  const capacity = Number($("capacity").value || 0);
  const keyword = $("keyword").value.trim().toLowerCase();
  const occupied = new Set(state.schedules.filter(r => occupies(r, week, weekday, start, end)).map(r => r.classroomCode));
  const rooms = state.rooms.filter(r => !occupied.has(r.code))
    .filter(r => !campus || r.campus === campus)
    .filter(r => !building || r.building === building)
    .filter(r => Number(r.capacity || 0) >= capacity)
    .filter(r => !keyword || `${r.name} ${r.code} ${r.building}`.toLowerCase().includes(keyword));
  render(rooms);
  $("queryDescription").textContent = `第 ${week} 周 · ${dayNames[weekday]} · 第 ${start}–${end} 节 · 已排除课程/调课/考务/屏蔽，忽略借用`;
}

function render(rooms) {
  $("resultCount").textContent = rooms.length;
  const host = $("results"); host.innerHTML = "";
  if (!rooms.length) { host.innerHTML = '<p class="empty">当前条件下没有匹配的空教室</p>'; return; }
  const tpl = $("roomTemplate");
  rooms.forEach(room => {
    const node = tpl.content.cloneNode(true);
    node.querySelector('.building').textContent = room.building || '教学楼未标注';
    node.querySelector('.room-name').textContent = room.name;
    node.querySelector('.room-code').textContent = room.code;
    node.querySelector('.campus').textContent = room.campus || '校区未标注';
    node.querySelector('.capacity').textContent = `${room.capacity || 0} 座`;
    host.appendChild(node);
  });
}

async function init() {
  fillSelect('week', Array.from({length:22},(_,i)=>i+1), v=>`第 ${v} 周`);
  fillSelect('weekday', [1,2,3,4,5,6,7], v=>dayNames[v]);
  fillSelect('startSection', Array.from({length:12},(_,i)=>i+1), v=>`第 ${v} 节`);
  fillSelect('endSection', Array.from({length:12},(_,i)=>i+1), v=>`第 ${v} 节`);
  $('endSection').value = '2';
  try {
    const response = await fetch('data/classrooms.json');
    Object.assign(state, await response.json());
    [...state.rooms, ...state.schedules].forEach(() => {});
    unique(state.rooms.map(r=>r.campus)).forEach(v => $('campus').insertAdjacentHTML('beforeend', `<option>${v}</option>`));
    unique(state.rooms.map(r=>r.building)).forEach(v => $('building').insertAdjacentHTML('beforeend', `<option>${v}</option>`));
    const ignoredBorrowCount = state.schedules.filter(isBorrowRecord).length;
    $('dataStatus').textContent = `${state.meta.termName || '当前学期'} · ${state.rooms.length} 间教室 · ${state.schedules.length} 条课表 · 已忽略 ${ignoredBorrowCount} 条借用`;
    query();
  } catch (error) {
    $('dataStatus').textContent = '数据文件载入失败，请通过本地服务器打开';
    $('results').innerHTML = `<p class="empty">${error.message}</p>`;
  }
}

$('searchButton').addEventListener('click', query);
$('campus').addEventListener('change', () => {
  const campus = $('campus').value;
  const options = unique(state.rooms.filter(r=>!campus||r.campus===campus).map(r=>r.building));
  $('building').innerHTML = '<option value="">全部教学楼</option>' + options.map(v=>`<option>${v}</option>`).join('');
});
init();
