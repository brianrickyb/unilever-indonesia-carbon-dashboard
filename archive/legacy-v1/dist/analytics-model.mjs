import {calculate,project} from './model.mjs';
export function analyticsData(rows,actions,filter={scope:0,group:''}){
 const full=calculate(rows),scopeRows=rows.filter(r=>!filter.scope||r.scope===filter.scope),selected=scopeRows.filter(r=>!filter.group||r.group===filter.group);
 const calc=calculate(selected),context=calculate(scopeRows),projection=project(selected,actions);
 let previous=projection.baseline;const applied=[],waterfall=[];
 for(const action of actions){if(!action.enabled)continue;applied.push(action);const next=project(selected,applied).projected;const saving=Math.max(0,previous-next);if(saving>1e-10)waterfall.push({id:action.id,title:action.title,before:previous,after:next,saving});previous=next;}
 const sources=Object.entries(context.byGroup).filter(([,value])=>value>0).map(([group,value])=>({group,value,scopes:[...new Set(scopeRows.filter(r=>r.group===group).map(r=>r.scope))],scopeValues:[1,2,3].map(scope=>context.results.filter(r=>r.group===group&&r.scope===scope).reduce((sum,r)=>sum+(r.tonnes??0),0))})).sort((a,b)=>b.value-a.value);
 return {...projection,fullScopes:full.scopes,fullTotal:full.total,scopeRows,selectedRows:calc.results,calculated:calc.calculated,missing:calc.missing,sources,waterfall};
}
export function treemapLayout(items,width,height){
 const list=items.filter(i=>Number.isFinite(i.value)&&i.value>0).sort((a,b)=>b.value-a.value),result=[];
 function split(nodes,x,y,w,h){if(!nodes.length)return;if(nodes.length===1){result.push({...nodes[0],x,y,width:w,height:h});return;}const total=nodes.reduce((s,n)=>s+n.value,0);let cut=1,sum=nodes[0].value;while(cut<nodes.length-1&&Math.abs(sum+nodes[cut].value-total/2)<Math.abs(sum-total/2)){sum+=nodes[cut].value;cut++;}const ratio=sum/total;if(w>=h){split(nodes.slice(0,cut),x,y,w*ratio,h);split(nodes.slice(cut),x+w*ratio,y,w*(1-ratio),h);}else{split(nodes.slice(0,cut),x,y,w,h*ratio);split(nodes.slice(cut),x,y+h*ratio,w,h*(1-ratio));}}
 split(list,0,0,width,height);return result;
}
