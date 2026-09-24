/* 在云南大学“教室课程表”页面的开发者控制台运行。脚本使用当前登录会话批量抓取，不逐间点击。 */
(async () => {
  const termCode = document.querySelector('#dqxnxq')?.getAttribute('value') || '2025-2026-2';
  const termName = document.querySelector('#dqxnxq')?.textContent?.trim() || termCode;
  const base = '/jwapp/sys/kcbcx';
  const post = async (path, params) => {
    const body = new URLSearchParams(params);
    const response = await fetch(base + path, {method:'POST', credentials:'include', headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8','X-Requested-With':'XMLHttpRequest'}, body});
    if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
    return response.json();
  };
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const querySetting = JSON.stringify([{name:'SFYPK',builder:'equal',linkOpt:'AND',value:'1'}]);
  console.log('正在读取教室列表…');
  const listJson = await post('/modules/jskcb/jscx.do', {pageSize:'1000',pageNumber:'1',XNXQDM:termCode,querySetting});
  const roomRows = listJson?.datas?.jscx?.rows || [];
  if (!roomRows.length) throw new Error('没有读取到教室列表，请确认已登录且位于教室课程表页面');
  const rooms = roomRows.map(r => ({
    code:r.JASDM, name:r.JASMC, campus:r.XXXQDM_DISPLAY || r.XXXQMC || '',
    building:r.JXLDM_DISPLAY || r.JXLMC || '', capacity:Number(r.SKZWS || 0)
  }));
  const schedules = [];
  const parseWeeks = value => {
    const text = String(value || '');
    const result = [];
    for (const part of text.split(/[,，]/)) {
      const nums = part.match(/\d+/g)?.map(Number) || [];
      if (!nums.length) continue;
      const [a,b=a] = nums; for(let n=a;n<=b;n++) result.push(n);
    }
    return [...new Set(result)];
  };
  for (let i=0;i<rooms.length;i++) {
    const room = rooms[i];
    const detail = await post('/modules/jskcb/jaskcb.do', {XNXQDM:termCode,JASDM:room.code});
    const rows = detail?.datas?.jaskcb?.rows || [];
    rows.forEach(r => schedules.push({
      classroomCode:room.code, course:r.KCM || '', teacher:r.SKJS || '',
      weeks:parseWeeks(r.ZCMC), weekday:Number(r.SKXQ), start:Number(r.KSJC), end:Number(r.JSJC),
      type:String(r.ISTK ?? '')
    }));
    console.log(`已抓取 ${i+1}/${rooms.length}：${room.name}`);
    // 顺序、低频访问，避免给学校系统造成集中负载。
    if (i < rooms.length - 1) await wait(1200);
  }
  const output = {meta:{termCode,termName,source:'云南大学全校课表查询',complete:true,generatedAt:new Date().toISOString(),borrowType:'ISTK=4（查询时忽略）'},rooms,schedules};
  const blob = new Blob([JSON.stringify(output,null,2)],{type:'application/json'});
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='classrooms.json'; a.click(); URL.revokeObjectURL(a.href);
  console.log(`完成：${rooms.length} 间教室，${schedules.length} 条课表记录`);
})();
