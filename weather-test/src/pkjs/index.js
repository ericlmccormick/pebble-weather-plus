/* Diagnostic consumer: counts fields received through the Pebble weather/location source API.
 * Uses the same selected weather plugin as other consumer apps; does not call providers directly.
 */
var BASE=['name','provider','updated_at','last_fetched_at','utc_offset','temperature','feels_like','high','low','condition','condition_code','uv_index','precipitation','humidity','wind_speed','wind_direction','sunrise','sunset'];
var HOURLY=['temperature','feels_like','dew_point','humidity','precipitation','precipitation_amount','rain','snowfall','wind_speed','wind_gust','wind_direction','uv_index','cloud_cover','pressure','visibility','weather_code','condition_code','is_day','solar_radiation','cape'];
var DAILY=['high','low','precipitation','precipitation_amount','rain','snowfall','uv_index','sunrise','sunset','weather_code','condition_code'];
var PROPS=BASE.concat(HOURLY.map(function(x){return 'hourly_'+x;}),DAILY.map(function(x){return 'daily_'+x;}));
var subscriptions=[];
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
 Pebble.sendAppMessage({summary:summary,details:details,status:status||''},function(){},function(e){console.log('test send failed '+JSON.stringify(e));});
}
function onData(env){
 var instances=(env&&env.instances)||[];
 var p=instances[0]&&instances[0].properties||{};
 var x=inspect(p);
 var fetched=p.last_fetched_at&&p.last_fetched_at.timestamp&&p.last_fetched_at.timestamp.value;
 var provider=p.provider&&p.provider.shortText&&p.provider.shortText.text||'selected plugin';
 var summary='Fields '+x.keys+'\nScalars '+x.scalar+' Series '+x.series+'\nSamples '+x.available+'/'+x.values+'\nUV '+x.uv+'h  Hour '+x.hours+'\nDaily '+x.days+'d';
 var details=provider+' | '+instances.length+' locations\n'+(fetched?'Fetched '+new Date(fetched*1000).toLocaleString():'No fetch timestamp')+'\nSELECT: recheck';
 console.log('WEATHER_TEST '+JSON.stringify({provider:provider,instances:instances.length,counts:x,receivedProperties:Object.keys(p),lastFetchedAt:fetched||null}));
 send(summary,details,'');
}
function subscribe(){
 subscriptions.forEach(function(s){try{s.unsubscribe();}catch(e){}});
 subscriptions=[];
 send('Requesting plugin data...','SELECT: recheck','');
 // Subscribe to all declared Weather+ fields. Unknown fields from other plugins
 // may be omitted by the source framework; compare the received keys in logs.
 subscriptions.push(Pebble.subscribeToSource({category:'weather',item:'location',properties:PROPS,onData:onData,onError:function(err){
  var msg='Source error: '+(err&&err.code||JSON.stringify(err));console.log(msg);send(msg,'Check selected weather plugin','');
 }}));
}
Pebble.addEventListener('ready',function(){subscribe();});
Pebble.addEventListener('appmessage',function(e){if(e.payload&&e.payload.refresh)subscribe();});
