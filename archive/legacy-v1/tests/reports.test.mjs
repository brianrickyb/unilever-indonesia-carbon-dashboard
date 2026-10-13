import test from 'node:test';
import assert from 'node:assert/strict';
import {reports,scope3Breakdown,yearChange,reportScenario,reportCsv} from '../dist/reports-data.mjs';
test('all five official years reconcile fuel and refrigerants to Scope 1',()=>{
 assert.deepEqual(reports.map(r=>r.year),[2021,2022,2023,2024,2025]);
 for(const r of reports){assert.ok(Math.abs(r.fuel+r.refrigerants-r.scope1)<1e-8);assert.equal(r.operational,r.scope1);assert.ok(r.url.startsWith('https://www.unilever.co.id/files/'));}
 assert.equal(reports[4].scope1,7869.19);assert.equal(reports[0].scope1,20858.4);
});
test('historical Scope 3 remains reported only in 2021; dashes are not zero',()=>{
 assert.equal(reports[0].scope3,2843661);assert.equal(scope3Breakdown.reduce((s,r)=>s+r.value,0),2843661);
 for(const r of reports.slice(1))assert.equal(r.scope3,null);
 for(const r of reports)assert.equal(r.scope2,null);
 assert.equal(reports[0].fullValueChain,2864519.4);
});
test('year changes do not bridge missing Scope 3 data',()=>{
 assert.equal(yearChange(2025,'scope3'),null);assert.equal(yearChange(2021,'scope1'),null);
 assert.ok(Math.abs(yearChange(2025,'scope1')+28.203589)<.0001);
 assert.ok(yearChange(2025,'refrigerants')>11);
});
test('scenario changes only explicit operational components, bounded 0 to 100 percent',()=>{
 const r=reports[4];assert.equal(reportScenario(2025,0,0).projected,r.operational);
 const p=reportScenario(2025,10,20);assert.ok(Math.abs(p.avoided-(759.051+55.736))<1e-8);
 assert.equal(reportScenario(2025,100,100).projected,0);
 assert.throws(()=>reportScenario(2025,-1,20));assert.throws(()=>reportScenario(2025,101,0));
});
test('report export carries sources and missing-value status rather than invented zeros',()=>{
 const csv=reportCsv();assert.ok(csv.includes('not_disclosed'));assert.ok(csv.includes('reported_dash'));assert.ok(csv.includes('2843661'));
 assert.ok(csv.includes('https://www.unilever.co.id/files/'));assert.ok(csv.includes('manufacturing_only'));
});
