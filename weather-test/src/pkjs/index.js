/* Diagnostic consumer: counts fields received through the Pebble weather/location source API.
 * Uses the same selected weather plugin as other consumer apps; does not call providers directly.
 */
var BASE=['name','provider','updated_at','last_fetched_at','utc_offset','temperature','feels_like','high','low','condition','condition_code','uv_index','precipitation','humidity','wind_speed','wind_direction','sunrise','sunset'];
var HOURLY=['temperature','feels_like','dew_point','humidity','precipitation','precipitation_amount','rain','snowfall','wind_speed','wind_gust','wind_direction','uv_index','cloud_cover','pressure','visibility','weather_code','condition_code','is_day','solar_radiation','cape'];
var DAILY=['high','low','precipitation','precipitation_amount','rain','snowfall','uv_index','sunrise','sunset','weather_code','condition_code'];
var PROPS=BASE.concat(HOURLY.map(function(x){return 'hourly_'+x;}),DAILY.map(function(x){return 'daily_'+x;}));
var subscriptions=[];
var selectedPlugin=localStorage.getItem('weatherTestPlugin')||'';
function weatherPlugins(){
 var result=[];
 try{Pebble.enumeratePlugins().forEach(function(p){(p.sources||[]).forEach(function(src){if(src.category==='weather'&&(src.items||[]).indexOf('location')!==-1){result.push({uuid:p.uuid,name:p.name||p.uuid,properties:src.properties||{}});}});});}catch(e){console.log('Weather plugin discovery failed: '+e);}
 return result;
}
function selectedSource(){var list=weatherPlugins();return list.filter(function(p){return p.uuid===selectedPlugin;})[0]||list[0]||null;}

var lastReport='Waiting for first weather response. Open the watch app to request data.';
var lastStatus='Waiting';
function populated(x){if(x===null||x===undefined)return false;if(typeof x==='number')return isFinite(x);if(typeof x==='string')return x.length>0;return true;}
function inspect(props){
 var scalar=0,series=0,values=0,missing=0,available=0,uv=0,hours=0,days=0;
 Object.keys(props||{}).forEach(function(k){
   var p=props[k];if(!p)return;
   if(p.series){
     series++;var s=p.series,shape=s.numericValue||s.shortText||s.longText||s.timestamp||s.image||{};
     var a=shape.values||[];values+=a.length;
     a.forEach(function(v){if(populated(v))available++;else missing++;});
     if(k==='hourly_uv_index')uv=a.filter(populated).length;
     if(k.indexOf('hourly_')===0)hours=Math.max(hours,a.length);
     if(k.indexOf('daily_')===0)days=Math.max(days,a.length);
   }else{scalar++;}
 });
 return {scalar:scalar,series:series,values:values,available:available,missing:missing,uv:uv,hours:hours,days:days,keys:Object.keys(props||{}).length};
}
function send(summary,details,status){
 lastStatus=status||'Data received';
 Pebble.sendAppMessage({summary:summary,details:details,status:status||''},function(){},function(e){console.log('test send failed '+JSON.stringify(e));});
}
function onData(env){
 var instances=(env&&env.instances)||[];
 var p=instances[0]&&instances[0].properties||{};
 var x=inspect(p);
 var fetched=p.last_fetched_at&&p.last_fetched_at.timestamp&&p.last_fetched_at.timestamp.value;
 var chosen=selectedSource();
 var provider=chosen?chosen.name:'No weather plugin';
 var summary='Fields '+x.keys+'\nScalars '+x.scalar+' Series '+x.series+'\nSamples '+x.available+'/'+x.values+'\nUV '+x.uv+'h  Hour '+x.hours+'\nDaily '+x.days+'d';
 var details=provider+' | '+instances.length+' locations\n'+(fetched?'Fetched '+new Date(fetched*1000).toLocaleString():'No fetch timestamp')+'\nSELECT: recheck';
 var report={capturedAt:new Date().toISOString(),source:'weather/location',provider:provider,instances:instances.length,counts:x,receivedProperties:Object.keys(p),lastFetchedAt:fetched||null,watchSummary:summary,watchDetails:details};
 lastReport=JSON.stringify(report,null,2);
 console.log('WEATHER_TEST '+JSON.stringify(report));
 send(summary,details,'');
}
function subscribe(){
 subscriptions.forEach(function(s){try{s.unsubscribe();}catch(e){}});
 subscriptions=[];
 send('Requesting plugin data...','SELECT: recheck','');
 // Subscribe to all declared Weather+ fields. Unknown fields from other plugins
 // may be omitted by the source framework; compare the received keys in logs.
 var chosen=selectedSource();
 if(!chosen){lastReport='No installed weather/location plugins found.';send(lastReport,'Install a weather plugin','');return;}
 selectedPlugin=chosen.uuid;
 var declared=Object.keys(chosen.properties||{});
 var requested=declared.length?declared:PROPS;
 subscriptions.push(Pebble.subscribeToSource({category:'weather',item:'location',plugin:chosen.uuid,properties:requested,onData:onData,onError:function(err){
  var msg='Source error: '+(err&&err.code||JSON.stringify(err));lastReport=msg;console.log(msg);send(msg,'Check selected weather plugin',msg);
 }}));
}
Pebble.addEventListener('ready',function(){subscribe();});
Pebble.addEventListener('appmessage',function(e){if(e.payload&&e.payload.refresh)subscribe();});


Pebble.addEventListener('configmessage',function(e){
 var m=e.data||{};
 if(m.type==='getReport'){e.respond({report:lastReport,status:lastStatus,plugins:weatherPlugins(),selected:selectedPlugin});return;}
 if(m.type==='selectSource'){
  var p=weatherPlugins().filter(function(p){return p.uuid===m.uuid;})[0];
  if(!p){e.respond({error:'Weather plugin not installed'});return;}
  selectedPlugin=p.uuid;localStorage.setItem('weatherTestPlugin',selectedPlugin);
  lastReport='Selected '+p.name+'. Press Refresh weather to poll.';
  e.respond({ok:true,selected:selectedPlugin,report:lastReport});return;
 }
 if(m.type==='refresh'){subscribe();e.respond({ok:true});return;}
 e.respond({error:'Unknown request'});
});
