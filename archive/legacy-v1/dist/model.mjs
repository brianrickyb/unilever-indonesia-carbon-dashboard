export const categories=['Purchased goods & services','Capital goods','Fuel & energy-related activities','Upstream transport & distribution','Waste generated in operations','Business travel','Employee commuting','Upstream leased assets','Downstream transport & distribution','Processing of sold products','Use of sold products','End-of-life of sold products','Downstream leased assets','Franchises','Investments'];
export const groups={fuel:'Fuel & process energy',refrigerant:'Refrigerants',electricity:'Purchased electricity',materials:'Raw materials',packaging:'Packaging',freight:'Freight',waste:'Operational waste',travel:'Business travel',commuting:'Employee commuting',other:'Other activities'};
export const units=['litre','kWh','kg','tonne','tonne-km','passenger-km','unit','kg CO2e'];
const sample=(id,name,scope,category,group,quantity,unit,factor)=>({id,name,scope,category,group,quantity,unit,factor,factorUnit:unit,source:'Illustrative scenario assumption — replace with a verified factor',quality:'illustrative'});
export const sampleRows=[
 sample('gas','Natural gas · process heat',1,0,'fuel',12500000,'kWh',.202),
 sample('diesel','Diesel · generators & owned vehicles',1,0,'fuel',165000,'litre',2.68),
 sample('cooling','Refrigerant leakage · R-134a',1,0,'refrigerant',80,'kg',1430),
 sample('power','Purchased grid electricity',2,0,'electricity',18000000,'kWh',.82),
 sample('ingredients','Ingredients & chemical inputs',3,1,'materials',16000000,'kg',2.4),
 sample('plastic','Plastic packaging',3,1,'packaging',1800000,'kg',2.7),
 sample('board','Paper & board packaging',3,1,'packaging',1200000,'kg',.9),
 sample('haulage','Inbound third-party road freight',3,4,'freight',9000000,'tonne-km',.1),
 sample('waste','Non-hazardous waste treatment',3,5,'waste',700000,'kg',.45),
 sample('travel','Business air travel',3,6,'travel',1200000,'passenger-km',.15),
 sample('commute','Employee commuting',3,7,'commuting',3200000,'passenger-km',.08)
];
export const actionTemplates=[
 {id:'suppliers',title:'Work with high-impact suppliers',groups:['materials'],percent:15,enabled:true,owner:'Procurement',effort:'Medium investment',horizon:'6–18 months',description:'Request product carbon footprints for key ingredients and chemicals. Prioritize verified lower-emission suppliers and reduce material losses.',assumption:'Reduces the weighted emission factor of raw materials by the selected percentage; purchasing volumes stay constant.'},
 {id:'energy',title:'Use less electricity per batch',groups:['electricity'],percent:10,enabled:true,owner:'Engineering',effort:'Low–medium investment',horizon:'3–12 months',description:'Meter major production lines, repair compressed-air leaks, and optimize motor and chiller schedules before adding equipment.',assumption:'Reduces purchased electricity consumption by the selected percentage at the same grid factor.'},
 {id:'packaging',title:'Reduce packaging material',groups:['packaging'],percent:12,enabled:false,owner:'Packaging & R&D',effort:'Medium investment',horizon:'6–18 months',description:'Lightweight bottles and cartons without compromising product protection. Validate supplier footprints before switching to recycled materials.',assumption:'Reduces packaging mass by the selected percentage. Emission factors stay constant.'},
 {id:'heat',title:'Improve boiler & steam efficiency',groups:['fuel'],percent:12,enabled:false,owner:'Utilities',effort:'Low–medium investment',horizon:'3–12 months',description:'Inspect steam traps, return condensate, insulate hot surfaces, and tune combustion. Confirm savings with fuel meters.',assumption:'Reduces the fuel inventory by the selected percentage. Feasibility differs between process heat and vehicles.'},
 {id:'transport',title:'Consolidate inbound deliveries',groups:['freight'],percent:15,enabled:false,owner:'Supply chain',effort:'Low investment',horizon:'1–6 months',description:'Increase vehicle load factors and reduce unnecessary journeys with suppliers and transport partners.',assumption:'Reduces freight tonne-kilometres by the selected percentage at the same factor.'},
 {id:'leaks',title:'Prevent refrigerant leakage',groups:['refrigerant'],percent:30,enabled:false,owner:'Maintenance',effort:'Low–medium investment',horizon:'1–6 months',description:'Track refrigerant top-ups, test for leaks, and plan equipment replacement using lower-GWP refrigerants where suitable.',assumption:'Reduces leaked refrigerant mass by the selected percentage; no additional replacement benefit is counted.'},
 {id:'waste',title:'Prevent production waste',groups:['waste'],percent:20,enabled:false,owner:'Operations',effort:'Low investment',horizon:'3–12 months',description:'Measure waste by line, investigate quality rejects, and agree recovery routes with waste contractors.',assumption:'Reduces operational waste-treatment emissions only. No upstream material savings or recycling credits are added.'}
];
export function validateRow(r){
 if(![1,2,3].includes(r.scope)||!Number.isInteger(r.category)||(r.scope===3?(r.category<1||r.category>15):r.category!==0))throw new Error('Choose a valid scope and category.');
 if(!units.includes(r.unit)||r.factorUnit!==r.unit)throw new Error('Activity and emission-factor units must match.');
 for(const key of ['quantity','factor'])if(r[key]!==null&&(typeof r[key]!=='number'||!Number.isFinite(r[key])||r[key]<0||r[key]>1e15))throw new Error('Enter a non-negative number below 1,000,000,000,000,000.');
 if(r.quantity!==null&&r.factor!==null&&!Number.isFinite(r.quantity*r.factor))throw new Error('The calculated value is too large.');
 return r;
}
export function calculate(rows){
 const scopes=[0,0,0],byGroup={},results=[];let missing=0;
 for(const r of rows){validateRow(r);const t=r.quantity===null||r.factor===null?null:r.quantity*r.factor/1000;results.push({...r,tonnes:t});if(t===null){missing++;continue;}scopes[r.scope-1]+=t;byGroup[r.group]=(byGroup[r.group]??0)+t;}
 return {total:scopes.reduce((a,b)=>a+b,0),scopes,byGroup,results,missing,calculated:rows.length-missing};
}
export function project(rows,actions){
 for(const a of actions)if(!Number.isFinite(a.percent)||a.percent<0||a.percent>100)throw new Error('Reduction must be between 0 and 100%.');
 const base=calculate(rows);let projected=0;
 for(const r of base.results){if(r.tonnes===null)continue;let value=r.tonnes;for(const a of actions)if(a.enabled&&a.groups.includes(r.group))value*=1-a.percent/100;projected+=value;}
 const avoided=Math.max(0,base.total-projected);return {baseline:base.total,projected,avoided,percent:base.total?avoided/base.total*100:0};
}
export function coverage(rows,statuses={}){return categories.map((name,i)=>{const list=rows.filter(r=>r.scope===3&&r.category===i+1);return {id:i+1,name,status:list.length?(list.some(r=>r.quantity===null||r.factor===null)?'incomplete':'calculated'):statuses[i+1]==='na'?'na':'unassessed'};});}
function csvCell(value){let text=String(value??'');if(/^[=+\-@\t\r]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';}
export function exportCsv(rows,meta){
 const data=calculate(rows);const records=[['Company',meta.company],['Year',meta.year],['Basis','Screening estimate; illustrative factors unless replaced; scope 2 location-based'],['Coverage','Partial inventory; unassessed categories excluded, not zero'],[],['Activity','Scope','Scope 3 category','Quantity','Unit','Factor kg CO2e/unit','Source / assumption','Data status','t CO2e']];
 for(const r of data.results)records.push([r.name,r.scope,r.scope===3?categories[r.category-1]:'',r.quantity??'Unknown',r.unit,r.factor??'Unknown',r.source,r.quality??'user-entered',r.tonnes??'Unknown']);
 records.push([],['Calculated subtotal t CO2e',data.total],['Rows missing data',data.missing]);return records.map(r=>r.map(csvCell).join(',')).join('\r\n');
}
