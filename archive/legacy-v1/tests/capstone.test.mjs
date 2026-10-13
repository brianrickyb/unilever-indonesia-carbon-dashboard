import test from 'node:test';
import assert from 'node:assert/strict';
import {assess, comparePeriods, tableauCsv} from '../dist/capstone-model.mjs';
import {sampleRows, actionTemplates} from '../dist/model.mjs';
const base = {year:2025, rows:sampleRows, actions:actionTemplates, statuses:{}};
const previous = {year:2024, scopes:[3000,12000,45000], source:'Example baseline', comparable:true};
test('demo inventory surfaces evidence gaps and three traceable insights',()=>{
 const a=assess(base); assert.equal(a.insights.length,3); assert.equal(a.recommendations.length,3);
 assert.ok(a.alerts.some(a=>a.id==='illustrative')); assert.equal(a.quality.duplicates,0);
 assert.equal(a.quality.unassessed,10); assert.equal(a.insights[0].value,38400);
 assert.ok(a.recommendations.every(r=>r.metric&&r.next&&r.owner));
});
test('duplicates and absent sources are flagged without deleting rows',()=>{
 const rows=[{...sampleRows[0],source:''},{...sampleRows[0],id:'copy',source:''}];
 const a=assess({...base,rows}); assert.equal(a.quality.duplicates,1); assert.equal(a.quality.unsourced,2);
 assert.ok(a.alerts.some(a=>a.id==='duplicates')); assert.equal(a.calculation.results.length,2);
});
test('YoY only compares documented adjacent periods with confirmed boundaries',()=>{
 for(const p of [null,{...previous,source:''},{...previous,comparable:false},{...previous,year:2023}])
  assert.equal(comparePeriods(base.rows,base.year,p).ready,false);
 const c=comparePeriods(base.rows,base.year,previous);assert.equal(c.ready,true);
 assert.ok(c.alerts.some(a=>a.id==='scope2-rise'));assert.equal(c.alerts.some(a=>a.id==='total-rise'),false);
});
test('missing scope inputs do not become zero or a false decline',()=>{
 const rows=sampleRows.map(r=>r.scope===2?{...r,quantity:null}:r);
 const c=comparePeriods(rows,2025,previous);assert.equal(c.metrics[0].current,null);assert.equal(c.metrics[2].current,null);
 assert.equal(c.alerts.length,0);
});
test('zero baselines and exact thresholds are handled without infinity or false alerts',()=>{
 const rows=[1,2,3].map((scope)=>({...sampleRows[0],id:String(scope),scope,category:scope===3?1:0,quantity:scope===2?115:0,factor:1000}));
 const c=comparePeriods(rows,2025,{...previous,scopes:[0,100,0]});
 assert.equal(c.metrics[1].percent,null);assert.equal(c.alerts.some(a=>a.id==='scope2-rise'),false);
 assert.ok(c.alerts.some(a=>a.id==='total-rise'));
});
test('empty inventory has no invented insights or savings',()=>{
 const a=assess({...base,rows:[]});assert.equal(a.insights.length,0);assert.equal(a.recommendations.length,0);
 assert.ok(a.alerts.some(a=>a.id==='empty'));
});
test('Tableau export is rectangular and keeps missing emissions blank',()=>{
 const csv=tableauCsv([{...sampleRows[0],name:'=SUM(A1)',quantity:null}],{company:'Example',year:2025});
 assert.equal(csv.split('\r\n').length,2);assert.ok(csv.includes("'=SUM(A1)"));
 assert.ok(csv.includes('Missing inputs'));assert.ok(!csv.includes('Unknown'));
});
