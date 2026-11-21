'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('src/plugin/index.js', 'utf8');
const context = {Pebble:{
  registerSourceHandler(){}, registerActionHandler(){}, registerConfigHandler(){}
}};
vm.createContext(context);
vm.runInContext(source, context);
const manifest = JSON.parse(fs.readFileSync('package.json'));
assert.ok(manifest.pebble.plugin.sources.some(source =>
  JSON.stringify(source).includes('"timezone":["shortText"]')));
const result = context.envelope({id:'sample', name:'Sample'}, {
  timezone:'America/Denver', offset:-21600, hours:[], days:[]
}, {});
assert.match(JSON.stringify(result), /"timezone":\{"shortText":\{"text":"America\/Denver"/);
assert.match(JSON.stringify(result), /"utc_offset":\{"numericValue":\{"value":-360/);
console.log('Weather+ exposes IANA timezone with the existing offset fallback');
