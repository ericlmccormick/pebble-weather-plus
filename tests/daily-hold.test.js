// Freeze today's forecast hi/lo at first valid check. Let current temperature,
// tomorrow and subsequent dates refresh. Reset at local midnight or >=40 km travel.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('src/plugin/index.js','utf8');
const start=source.indexOf('const DAILY_EXTREMA_HOLD_KEY=');
const end=source.indexOf('function envelope(',start);
assert.ok(start>0&&end>start);
const cache=new Map();
const storage={getItem:k=>cache.get(k)||null,setItem:(k,v)=>cache.set(k,v)};
const D=86400,offset=-10*3600;
let localDay=24000;
let now=(localDay*D-offset)+7*3600;
function init() {
 const ctx={Date:{now:()=>now*1000},D,Math,Number,localStorage:storage,JSON};
 return vm.runInNewContext(source.slice(start,end)+';holdTodayExtrema',ctx);
}
const first=init();
const place={lat:21.4,lon:-157.8};
const row=(day,high,low)=>({time:day*D-offset,high,low});
const data=(high,low)=>({offset,
 days:[row(localDay,high,low),row(localDay+1,26,17)]});
now=(localDay*D-offset)+4*3600;
let early=first(place,data(27,16));
assert.equal(early.days[0].low,16,'Forecast can update normally before 6am');
assert.equal(cache.size,0,'A pre-dawn check must not pin tomorrow morning values');
now=(localDay*D-offset)+7*3600;
let reading=first(place,data(29,19));
assert.equal(reading.days[0].low,19);
assert.equal(reading.days[0].high,29);
reading=first(place,data(33,23));
assert.equal(reading.days[0].low,19,'Same-day hourly refresh may not move low');
assert.equal(reading.days[0].high,29,'Same-day forecast reissue may not move high');
assert.equal(reading.days[1].high,26,'Future-day forecasts still update');
const afterRestart=init();
now+=8*3600;
reading=afterRestart({lat:21.5,lon:-157.83},data(31,25));
assert.equal(reading.days[0].low,19,'Restart and nearby movement retain morning low');
assert.equal(reading.days[0].high,29);
reading=afterRestart({lat:21.95,lon:-157.8},data(31,25));
assert.equal(reading.days[0].low,25,'Travel beyond 40km resets location baseline');
assert.equal(reading.days[0].high,31);
reading=afterRestart({lat:21.95,lon:-157.8},data(35,26));
assert.equal(reading.days[0].low,25,'New location baseline remains pinned');
now=(localDay+1)*D-offset+7*3600;
localDay++;
reading=afterRestart({lat:21.95,lon:-157.8},data(27,16));
assert.equal(reading.days[0].low,16,'Local midnight opens a fresh baseline');
assert.equal(reading.days[0].high,27);
reading=afterRestart({lat:21.95,lon:-157.8},data(24,12));
assert.equal(reading.days[0].low,16);
const before=cache.get('weatherplus.dailyExtremaHold.v1');
reading=afterRestart({lat:22.7,lon:-157.8},data(null,null));
assert.equal(reading.days[0].low,null,'Missing new-location extrema are not frozen');
assert.equal(cache.get('weatherplus.dailyExtremaHold.v1'),before,
 'Bad source data cannot replace a valid baseline');
assert.ok(!source.includes('dailyExtremaHeld:!!result.dailyExtremaHeld'),
 'Do not add undocumented Weather+ fields to registered source instance');
console.log('Daily hi/lo lock persists, rolls over at local midnight and resets beyond 40km');
