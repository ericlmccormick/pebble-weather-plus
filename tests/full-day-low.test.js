// A daily low must include all 00:00-24:00 local hours, not just the
// remaining NWS/MET forecast hours after the current time.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/plugin/index.js','utf8');
const start=source.indexOf('async function fullCalendarDayExtrema(');
const end=source.indexOf('async function forecast(',start);
assert.ok(start>0&&end>start,'Full-day helper and hourly aggregator are present');
assert.match(source,/const key="wxplus:v7:/,'Old truncated forecast cache is discarded');
assert.match(source,/await fullCalendarDayExtrema\(place\)/);
assert.match(source,/d.high=null;d.low=null;/,
  'If the full-day forecast fails, do not substitute the rest-of-day low');
const D=86400,H=3600,offset=-10*3600;
const localDay=23000;
const now=localDay*D-offset+14*H;
const startOfDay=localDay*D-offset;
let response={
 utc_offset_seconds:offset,timezone:'Pacific/Honolulu',
 daily:{
  time:Array.from({length:9},(_,i)=>startOfDay+i*D),
  temperature_2m_min:[18,17,19,20,19,18,18,17,16],
  temperature_2m_max:[30,29,28,31,29,28,30,29,28]
 }
};
const context={Date:{now:()=>now*1000},json:async()=>response,Map,Math,Number,Error,Array,Object};
const methods=vm.runInNewContext('const D=86400,H=3600;'+source.slice(start,end)+
  ';({fullCalendarDayExtrema,applyFullDayExtrema,aggregate})',context);
(async()=>{
  const hours=Array.from({length:48},(_,i)=>({
    time:now+i*H,temperature:26+Math.sin(i/4)*2,
    precipitation:3,condition_code:'sun'
  }));
  const partial=methods.aggregate(hours,offset);
  assert.ok(partial[0].low>23,'Future-only hours cannot contain the overnight low');
  const official=await methods.fullCalendarDayExtrema({lat:21.44,lon:-157.83});
  assert.equal(official.days[0].low,18);
  assert.equal(official.days[0].high,30);
  const corrected=methods.applyFullDayExtrema({
    hours,days:[],offset:0,provider:'NWS'},official);
  assert.equal(corrected.days[0].low,18,'Full local-day low must be used');
  assert.equal(corrected.days[0].high,30);
  assert.equal(corrected.offset,offset,'Provider-local offset must be applied');
  assert.equal(corrected.days[0].condition_code,'sun','Keep hourly-only provider conditions');
  assert.ok(corrected.dailyExtremaSource.includes('full local day'));
  const changingTime=now+5*H;
  context.Date.now=()=>changingTime*1000;
  const second=await methods.fullCalendarDayExtrema({lat:21.44,lon:-157.83});
  assert.equal(second.days[0].low,18,'Clock advancing must not trim prior hours');
  response={...response,daily:{...response.daily,
    time:response.daily.time.map(t=>t+D)}};
  await assert.rejects(()=>methods.fullCalendarDayExtrema({lat:21,lon:-157}),
    /misaligned/,'Shifted daily series must be rejected');
  response={...response,daily:{...response.daily,
    time:response.daily.time.map(t=>t-D),
    temperature_2m_min:[null,...response.daily.temperature_2m_min.slice(1)]}};
  await assert.rejects(()=>methods.fullCalendarDayExtrema({lat:21,lon:-157}),
    /Incomplete/,'Null official low must not become zero');
  console.log('Full calendar-day NWS/MET low, local timezone and missing data tests passed');
})().catch(e=>{console.error(e);process.exitCode=1});
