import {calculate, coverage, project, groups} from './model.mjs';
const n=v=>new Intl.NumberFormat('en-GB',{maximumFractionDigits:1}).format(v);
const alert=(id,title,detail)=>({id,title,detail});
export function comparePeriods(rows,year,previous){
 const x=calculate(rows);
 const valid=previous&&previous.year===year-1&&previous.comparable===true&&String(previous.source??'').trim()&&Array.isArray(previous.scopes)&&previous.scopes.length===3&&previous.scopes.every(v=>Number.isFinite(v)&&v>=0);
 if(!valid)return {ready:false,metrics:[],alerts:[]};
 const current=x.scopes.map((v,i)=>x.results.some(r=>r.scope===i+1)&&!x.results.some(r=>r.scope===i+1&&r.tonnes===null)?v:null);
 const values=[current.every(v=>v!==null)?x.total:null,...current];
 const old=[previous.scopes.reduce((a,b)=>a+b,0),...previous.scopes];
 const metrics=values.map((value,i)=>({label:['Calculated subtotal','Scope 1','Scope 2','Scope 3'][i],current:value,previous:old[i],percent:value!==null&&old[i]>0?(value-old[i])/old[i]*100:null}));
 const alerts=[];
 for(const [index,threshold,id,label] of [[0,10,'total-rise','Total'],[2,15,'scope2-rise','Scope 2']]){
  const m=metrics[index];
  if(m.percent!==null&&m.percent>threshold+1e-9)alerts.push(alert(id,`${label} increased ${n(m.percent)}% year over year`,`${n(m.previous)} → ${n(m.current)} t CO₂e exceeds the >${threshold}% screening threshold. Review activity volumes, factors and the reporting boundary before attributing a cause.`));
 }
 return {ready:true,metrics,alerts};
}
const guidance={
 suppliers:{metric:'Supplier-specific footprint coverage (%) and raw-material t CO₂e',next:'Within 30 days, rank suppliers by purchased material emissions and request product footprints from the top five.'},
 energy:{metric:'Purchased kWh per tonne of product and Scope 2 location-based t CO₂e',next:'Within 30 days, meter the highest-use production line and audit compressed air, motors and chillers.'},
 packaging:{metric:'Packaging kg per tonne of product and packaging t CO₂e',next:'Within 30 days, select one high-volume package for a lightweighting trial and test product protection.'},
 heat:{metric:'Fuel use per tonne of product and Scope 1 fuel t CO₂e',next:'Within 30 days, inspect steam traps and log boiler fuel use against production.'},
 transport:{metric:'Freight tonne-km per tonne of product and load factor (%)',next:'Within 30 days, review inbound routes and test consolidated deliveries with one carrier.'},
 leaks:{metric:'Refrigerant kg leaked and associated Scope 1 t CO₂e',next:'Within 30 days, reconcile top-up logs and inspect the equipment with the largest losses.'},
 waste:{metric:'Waste kg per tonne of product and waste-treatment t CO₂e',next:'Within 30 days, measure waste by production line and investigate the largest rejection stream.'}
};
export function assess(state){
 const x=calculate(state.rows),c=coverage(state.rows,state.statuses),seen=new Set();let duplicates=0;
 for(const r of state.rows){const key=JSON.stringify([String(r.name).trim().toLowerCase(),r.scope,r.category,r.group,r.quantity,r.unit,r.factor,r.factorUnit]);if(seen.has(key))duplicates++;seen.add(key);}
 const quality={missing:x.missing,unsourced:state.rows.filter(r=>!String(r.source??'').trim()).length,illustrative:state.rows.filter(r=>r.quality==='illustrative').length,duplicates,unassessed:c.filter(v=>v.status==='unassessed'||v.status==='incomplete').length,calculatedCategories:c.filter(v=>v.status==='calculated').length};
 const comparison=comparePeriods(state.rows,state.year,state.previous),alerts=[...comparison.alerts];
 if(!state.rows.length)alerts.push(alert('empty','No inventory entered','Add activity quantities and matching emission factors before interpreting results.'));
 if(quality.missing)alerts.push(alert('missing',`${quality.missing} activities have missing inputs`,'Enter the missing quantity or factor. These activities are excluded from the subtotal, not counted as zero.'));
 if(quality.unsourced)alerts.push(alert('sources',`${quality.unsourced} factors have no source note`,'Record publisher, year, geography, unit and factor reference in Activity data.'));
 if(duplicates)alerts.push(alert('duplicates',`${duplicates} possible duplicate activities`,'Rows share the same normalized name, scope, category, source group, quantity and factor. Check the underlying records; no rows were removed automatically.'));
 if(quality.illustrative)alerts.push(alert('illustrative',`${quality.illustrative} activities still use illustrative assumptions`,'Replace sample quantities and factors with traceable company records before presenting these as business results.'));
 if(quality.unassessed)alerts.push(alert('coverage',`${quality.unassessed} Scope 3 categories need review`,'Assess relevance and data gaps in Activity data. One calculated row does not establish complete category coverage.'));
 const top=Object.entries(x.byGroup).sort((a,b)=>b[1]-a[1]);
 const insights=[];
 if(x.calculated&&x.total>0){
  const [group,value]=top[0],scope=x.scopes.indexOf(Math.max(...x.scopes))+1;
  insights.push({title:'Start with the largest source',value,observation:`${groups[group]??group} contribute ${n(value)} t CO₂e (${n(value/x.total*100)}% of the entered subtotal).`,meaning:'This source offers the largest baseline for investigating operational or purchasing changes; its share does not prove the cause.',next:'Validate the underlying records and compare feasible interventions in Reduction plan.'});
  insights.push({title:'Choose the right decision owner',observation:`Scope ${scope} contributes ${n(x.scopes[scope-1]/x.total*100)}% of calculated emissions.`,meaning:scope===3?'Most calculated emissions sit in the value chain, so procurement and supplier engagement are central.':scope===2?'Purchased energy is the largest scope in the entered inventory, making engineering and energy management central.':'Direct operations dominate the entered inventory, making operations and maintenance central.',next:'Assign an accountable department and monitor an activity-based KPI alongside emissions.'});
  insights.push({title:'Read the result with its evidence limits',observation:`${quality.calculatedCategories} of 15 Scope 3 categories have calculated rows; ${quality.missing} activities lack inputs.`,meaning:'The subtotal is not a complete corporate footprint. Missing categories can change the ranking of priorities.',next:'Review all unassessed categories and document justified exclusions before drawing company-wide conclusions.'});
 }
 const recommendations=(state.actions??[]).map(a=>({...a,impact:project(state.rows,[{...a,enabled:true}]).avoided,...guidance[a.id]})).filter(a=>a.impact>0&&a.metric).sort((a,b)=>b.impact-a.impact).slice(0,3);
 return {calculation:x,quality,alerts,insights,recommendations,comparison};
}
function cell(v){let s=String(v??'');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
export function tableauCsv(rows,meta){
 const data=[['Company','Reporting year','Activity ID','Activity','Scope','Scope 3 category','Source group','Quantity','Activity unit','Factor kg CO2e per unit','Factor denominator unit','Factor source or assumption','Evidence status','Emissions t CO2e','Calculation status','Inventory boundary','Scope 2 basis']];
 for(const r of calculate(rows).results)data.push([meta.company,meta.year,r.id,r.name,r.scope,r.scope===3?r.category:'',groups[r.group]??r.group,r.quantity,r.unit,r.factor,r.factorUnit,r.source,r.quality??'user-supplied',r.tonnes,r.tonnes===null?'Missing inputs':'Calculated','Partial inventory','Location-based']);
 return data.map(r=>r.map(cell).join(',')).join('\r\n');
}
