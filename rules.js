(function(root){
  "use strict";

  const TYPE_LABELS={agency:"기관추천",multi:"다자녀",newly:"신혼부부",elder:"노부모부양",first:"생애최초",baby:"신생아",general:"일반공급"};
  const PROFILE_LABELS={single:"미혼·자녀 없음",single_parent:"미혼·자녀 있음",engaged:"혼인 예정·미신고",married:"법률혼",former:"이혼·사별 등"};
  const INCOME_2025={
    year:2025,
    source:"월계 중흥S-클래스 입주자모집공고",
    base100:{3:7533763,4:8802202,5:9326985,6:9906263,7:10485541,8:11064819},
    incrementsAfter8:579278,
    published:{
      100:{3:7533763,4:8802202,5:9326985,6:9906263,7:10485541,8:11064819},
      120:{3:9040516,4:10562642,5:11192382,6:11887516,7:12582649,8:13277783},
      130:{3:9793892,4:11442863,5:12125081,6:12878142,7:13631203,8:14384265},
      140:{3:10547268,4:12323083,5:13057779,6:13868768,7:14679757,8:15490747},
      160:{3:12054021,4:14083523,5:14923176,6:15850021,7:16776866,8:17703710}
    }
  };

  function integer(value){return Math.max(0,Math.floor(Number(value)||0));}
  function clamp(value,min,max){return Math.max(min,Math.min(max,Number(value)||0));}
  function won(value){return Math.max(0,Math.round(Number(value)||0));}

  function pointRateForArea(area,rates){
    const a=Number(area)||0;
    if(a<=60)return clamp(rates.small,0,100);
    if(a<=85)return clamp(rates.medium,0,100);
    return clamp(rates.large,0,100);
  }

  function generalAllocation(supply,area,rates){
    const total=integer(supply);
    const pointRate=pointRateForArea(area,rates);
    const point=Math.min(total,Math.ceil(total*pointRate/100));
    const lottery=total-point;
    const noHomePriority=Math.min(lottery,Math.ceil(lottery*.75));
    return {total,area:Number(area)||0,pointRate,lotteryRate:100-pointRate,point,lottery,noHomePriority,lotteryRemainder:lottery-noHomePriority};
  }

  function specialAllocation(supply,firstRate=50,secondRate=20){
    const total=integer(supply);
    const stage1=Math.min(total,Math.ceil(total*clamp(firstRate,0,100)/100));
    const stage2=Math.min(total-stage1,Math.ceil(total*clamp(secondRate,0,100)/100));
    const stage3=Math.max(0,total-stage1-stage2);
    return {total,stage1,stage2,stage3,firstRate:Number(firstRate),secondRate:Number(secondRate)};
  }

  function clamp01(value){return Math.max(0,Math.min(1,Number(value)||0));}
  function specialWinProbability(entryStage,allocation,rate){
    rate=Number(rate)||0;
    if(rate<=0)return null;
    const stages=availableSpecialStages(entryStage,allocation);
    const seats=stages.reduce((total,stage)=>total+integer(allocation[`stage${stage}`]),0);
    if(!seats)return 0;
    const applicants=rate*Math.max(1,integer(allocation.total));
    return clamp01(seats/Math.max(seats,applicants));
  }
  function generalWinProbability(points,cutline,allocation,rate,noHome=true){
    cutline=Number(cutline)||0;rate=Number(rate)||0;
    const result={pPoint:null,pLottery:null,p:null,basis:[]};
    if(cutline>0&&integer(allocation.point)>0){
      result.pPoint=points>=cutline?1:0;
      result.basis.push(points>=cutline?`가점 ${points}점 ≥ 예상 커트라인 ${cutline}점`:`가점 ${points}점 < 예상 커트라인 ${cutline}점 · 추첨만 가능`);
    }
    if(rate>0){
      const seats=noHome?integer(allocation.lottery):integer(allocation.lotteryRemainder);
      const applicants=rate*Math.max(1,integer(allocation.total));
      result.pLottery=seats?clamp01(seats/Math.max(seats,applicants)):0;
      result.basis.push(`추첨 ${seats}세대 · 예상 경쟁률 ${rate}:1`);
    }
    result.p=result.pPoint===1?1:result.pLottery;
    return result;
  }

  function acquisitionCostEstimate(price,area,options={}){
    price=won(price);area=Number(area)||0;
    const mode=options.mode||"standard";
    if(mode==="manual"){
      const totalRate=clamp(options.manualTotalRate,0,20);
      const total=Math.round(price*totalRate/100);
      return {price,area,mode,acquisitionTax:total,localEducationTax:0,ruralSpecialTax:0,discount:0,total,totalRate};
    }
    let acquisitionRate=price<=600000000?.01:price<=900000000?(((price*2/300000000)-3)/100):.03;
    acquisitionRate=Math.round(acquisitionRate*1000000)/1000000;
    const grossAcquisitionTax=Math.round(price*acquisitionRate);
    const grossEducationTax=Math.round(price*acquisitionRate*.1);
    const ruralSpecialTax=area>85?Math.round(price*.002):0;
    const eligibleFirstHome=mode==="first_home"&&price<=1200000000;
    const discount=eligibleFirstHome?Math.min(2000000,grossAcquisitionTax):0;
    const discountRatio=grossAcquisitionTax?discount/grossAcquisitionTax:0;
    const acquisitionTax=Math.max(0,grossAcquisitionTax-discount);
    const localEducationTax=Math.max(0,Math.round(grossEducationTax*(1-discountRatio)));
    const total=acquisitionTax+localEducationTax+ruralSpecialTax;
    return {price,area,mode,acquisitionRate,grossAcquisitionTax,grossEducationTax,acquisitionTax,localEducationTax,ruralSpecialTax,discount,eligibleFirstHome,total,totalRate:price?total/price*100:0};
  }
  function availableSpecialStages(entryStage,allocation){
    const first=Math.max(1,integer(entryStage));
    return [1,2,3].filter(stage=>stage>=first&&integer(allocation?.[`stage${stage}`])>0);
  }

  function normalizeSplitDecimals(line){
    return String(line||"")
      .replace(/\b0\s+(\d{2,3})\.(\d{2})\s+(\d{2})([A-Z])\b/g,"0$1.$2$3$4")
      .replace(/\b0\s+(\d{2,3})\.(\d{2})\s+(\d{2})\b/g,"0$1.$2$3")
      .replace(/\b(\d{2,3})\.(\d{2})\s+(\d{2})([A-Z])\b/g,"$1.$2$3$4")
      .replace(/\b(\d{2,3})\.(\d{2})\s+(\d{2})\b/g,"$1.$2$3");
  }

  function supplySchema(lines,rowIndex,count){
    const header=(lines||[]).slice(Math.max(0,rowIndex-18),rowIndex).join(" ");
    const definitions=[
      {key:"agency",pattern:/기관|추천/},{key:"multi",pattern:/다자녀/},{key:"newly",pattern:/신혼/},
      {key:"elder",pattern:/노부모/},{key:"first",pattern:/생애/},{key:"baby",pattern:/신생아/}
    ];
    const found=definitions.map(item=>({key:item.key,index:header.search(item.pattern)})).filter(item=>item.index>=0).sort((a,b)=>a.index-b.index).map(item=>item.key);
    const fallback={2:["multi","elder"],3:["agency","multi","elder"],4:["agency","multi","newly","elder"],5:["agency","multi","newly","elder","first"],6:["agency","multi","newly","elder","first","baby"]}[count]||[];
    return found.length===count?found:fallback;
  }

  function parseSupplyRows(lines){
    const found=new Map();
    (lines||[]).forEach((raw,rowIndex)=>{
      const tokens=normalizeSplitDecimals(raw).replace(/,/g,"").replace(/[–—]/g,"-").split(/\s+/).filter(Boolean);
      let candidate=null;
      for(let length=10;length>=6&&!candidate;length--){
        for(let start=tokens.length-length;start>=0;start--){
          const window=tokens.slice(start,start+length);
          if(!window.every(token=>token==="-"||/^\d+$/.test(token)))continue;
          const values=window.map(token=>token==="-"?0:Number(token));
          const total=values[0],special=values[length-3],general=values[length-2],lowest=values[length-1],categories=values.slice(1,length-3);
          if(total>0&&total<=10000&&special===categories.reduce((value,current)=>value+current,0)&&total===special+general&&lowest<=total){
            candidate={start,total,special,general,lowest,categories};
            break;
          }
        }
      }
      if(!candidate)return;
      const prefix=tokens.slice(0,candidate.start).join(" ");
      const areas=[...prefix.matchAll(/\b0?(\d{2,3})\.(\d{2,4})([A-Z])?\b/g)].filter(match=>Number(match[1])>=20&&Number(match[1])<=400);
      if(!areas.length)return;
      const match=areas[0],base=String(Number(match[1])),suffix=match[3]||"";
      const after=prefix.slice((match.index||0)+match[0].length).trim();
      const short=after.match(new RegExp(`^${base}([A-Z][A-Z0-9]*)\\b`));
      const name=base+(suffix||short?.[1]||"");
      const row={name,area:Number(`${Number(match[1])}.${match[2]}`),total:candidate.total,agency:0,multi:0,newly:0,elder:0,first:0,baby:0,general:candidate.general};
      supplySchema(lines,rowIndex,candidate.categories.length).forEach((key,index)=>row[key]=candidate.categories[index]||0);
      if(!found.has(name))found.set(name,row);
    });
    return [...found.values()];
  }

  function parseRemainderSupply(lines){
    const clean=(lines||[]).map(line=>normalizeSplitDecimals(line).replace(/\s+/g," ").trim());
    const start=clean.findIndex(line=>/공급대상/.test(line)&&!/일정/.test(line));
    if(start<0)return [];
    const endOffset=clean.slice(start+1).findIndex(line=>/공급금액.*납부일정/.test(line));
    const seg=clean.slice(start,endOffset>=0?start+1+endOffset:start+60);
    const areaAt=[];
    seg.forEach((line,index)=>{
      for(const match of line.matchAll(/\b0?(\d{2,3})\.(\d{2,4})[A-Z]?\b/g)){
        const area=Number(`${Number(match[1])}.${match[2]}`);
        if(area>=20&&area<=400)areaAt.push({index,area});
      }
    });
    const found=new Map();
    seg.forEach((line,index)=>{
      for(const match of line.matchAll(/\b(\d{2,3}[A-Z]\d*)\s+(\d{1,3})\b/g)){
        const name=match[1],count=Number(match[2]);
        if(count<=0||count>500)continue;
        const base=name.match(/^\d+/)[0];
        let best=null;
        areaAt.forEach(item=>{
          const distance=Math.abs(item.index-index);
          if(String(Math.floor(item.area))===base&&distance<=3&&(!best||distance<best.distance))best={area:item.area,distance};
        });
        if(!best)continue;
        if(!found.has(name))found.set(name,{name,area:best.area,total:count,agency:0,multi:0,newly:0,elder:0,first:0,baby:0,general:count});
      }
    });
    return [...found.values()];
  }

  function moneyValues(line){
    return [...String(line||"").matchAll(/\d{1,3}(?:,\d{3}){2,}|\b\d{8,}\b/g)]
      .map(match=>({value:Number(match[0].replace(/,/g,"")),index:match.index}))
      .filter(item=>item.value>=10000000&&item.value<=100000000000);
  }

  function priceEntry(line,lineIndex){
    const money=moneyValues(line);
    for(let index=2;index<Math.min(money.length,6);index++){
      for(const count of [3,2]){
        if(index-count<0)continue;
        const partTotal=money.slice(index-count,index).reduce((value,current)=>value+current.value,0);
        const price=money[index].value;
        if(Math.abs(partTotal-price)>Math.max(2000,price*.001))continue;
        const paymentAmounts=money.slice(index+1).map(item=>item.value);
        const paymentTotal=paymentAmounts.reduce((value,current)=>value+current,0);
        return {lineIndex,line,price,paymentAmounts:Math.abs(paymentTotal-price)<=Math.max(5000,price*.001)?paymentAmounts:[],moneyStart:money[0].index};
      }
    }
    return null;
  }

  function canonicalSize(token,sizes){
    const clean=String(token||"").replace(/^0+(?=\d)/,"").toUpperCase();
    const exact=sizes.find(size=>size.name.toUpperCase()===clean);
    if(exact)return exact.name;
    const escaped=value=>value.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    const digitSuffix=sizes.find(size=>new RegExp(`^${escaped(size.name.toUpperCase())}\\d+$`).test(clean));
    if(digitSuffix)return digitSuffix.name;
    const tokenMatch=clean.match(/^(\d{2,3})([A-Z0-9]*)$/);
    if(!tokenMatch)return "";
    const base=tokenMatch[1],suffix=tokenMatch[2];
    const sameBase=sizes.filter(size=>size.name.match(/^\d{2,3}/)?.[0]===base);
    const fuzzy=sameBase.filter(size=>{
      const sizeSuffix=size.name.slice(base.length).toUpperCase();
      return sizeSuffix&&sizeSuffix.replace(/P/g,"")===suffix.replace(/P/g,"");
    });
    if(fuzzy.length===1)return fuzzy[0].name;
    if(sameBase.length===1&&sameBase[0].name===base&&suffix)return sameBase[0].name;
    return "";
  }

  function typeMarkers(section,sizes){
    const markers=[];
    section.forEach((line,lineIndex)=>{
      const firstMoney=moneyValues(line)[0]?.index??line.length;
      const prefix=line.slice(0,firstMoney),tokens=[];
      for(const match of prefix.matchAll(/\b0?(\d{2,3})\.\d{2,4}([A-Z])?\b/g))tokens.push(String(Number(match[1]))+(match[2]||""));
      for(const match of prefix.matchAll(/\b\d{2,3}[A-Z][A-Z0-9]*\b|\b\d{2,3}\b(?!\s*(?:동|호|층|F))/g))tokens.push(match[0]);
      [...new Set(tokens.map(token=>canonicalSize(token,sizes)).filter(Boolean))].forEach(name=>markers.push({name,lineIndex,line}));
    });
    return markers;
  }

  function entryClusters(entries){
    const clusters=[];
    entries.forEach(entry=>{
      const last=clusters.at(-1);
      if(!last||entry.lineIndex-last.at(-1).lineIndex>30)clusters.push([entry]);
      else last.push(entry);
    });
    return clusters;
  }

  function unitsForPriceEntry(entry){
    const prefix=entry.line.slice(0,entry.moneyStart).trim();
    let match=prefix.match(/(?:층|F)\s*(?:이상|이하)?\s*(\d+)\s*$/i);
    if(match)return Number(match[1]);
    match=prefix.match(/([\d,]+)\s*호\s*$/);
    if(match)return match[1].split(",").filter(Boolean).length;
    if(/(?:^|\s)\d{3,4}\s*$/.test(prefix))return 1;
    match=prefix.match(/(?:^|\s)(\d+)\s*$/);
    return match&&Number(match[1])<=200?Number(match[1]):0;
  }

  function paymentSection(lines,sizes){
    const start=(lines||[]).findIndex(line=>/공급금액.*(?:납부일정|표)|분양금액.*(?:납부일정|표)|공급대상.*공급금액/.test(line));
    if(start<0)return null;
    const section=lines.slice(start,start+650);
    const entries=section.map((line,index)=>priceEntry(line,index)).filter(Boolean);
    const clusters=entryClusters(entries);
    if(!clusters.length)return null;
    const main=[...clusters].sort((a,b)=>b.length-a.length)[0];
    const markers=typeMarkers(section,sizes).filter(marker=>main.some(entry=>Math.abs(entry.lineIndex-marker.lineIndex)<=25));
    return {section,entries:main,markers};
  }

  function groupPriceEntries(data,sizes,strict=true){
    const entries=data.entries,low=entries[0].lineIndex,high=entries.at(-1).lineIndex;
    const markers=data.markers.filter(marker=>marker.lineIndex>=low-20&&marker.lineIndex<=high+20);
    const ordered=sizes.map((size,supplyIndex)=>{
      const candidates=markers.filter(marker=>marker.name===size.name);
      const best=candidates.reduce((prior,marker)=>{
        const official=/\b0?\d{2,3}\.\d{2,4}[A-Z]?\b/.test(marker.line);
        const distance=Math.min(...entries.map(entry=>Math.abs(entry.lineIndex-marker.lineIndex)))-(strict?0:official?5:0);
        return !prior||distance<prior.distance?{lineIndex:marker.lineIndex,distance}:prior;
      },null);
      return {...size,supplyIndex,marker:best?.lineIndex??Number.MAX_SAFE_INTEGER};
    }).sort((a,b)=>a.marker-b.marker||a.supplyIndex-b.supplyIndex);
    const typeCount=ordered.length,entryCount=entries.length;
    const dp=Array.from({length:typeCount+1},()=>Array(entryCount+1).fill(null));
    dp[0][0]={cost:0,previous:-1};
    for(let typeIndex=0;typeIndex<typeCount;typeIndex++){
      const type=ordered[typeIndex];
      for(let start=0;start<=entryCount;start++){
        const state=dp[typeIndex][start];
        if(!state)continue;
        let known=0,unknown=0;
        const maxEnd=entryCount-(typeCount-typeIndex-1);
        for(let end=start+1;end<=maxEnd;end++){
          const units=unitsForPriceEntry(entries[end-1]);
          if(units)known+=units;else unknown++;
          if(strict&&known>type.total)break;
          if(strict){
            const feasible=unknown?known+unknown<=type.total:known===type.total;
            if(!feasible)continue;
          }
          const firstLine=entries[start].lineIndex,lastLine=entries[end-1].lineIndex;
          const rangeDistance=type.marker<firstLine?firstLine-type.marker:type.marker>lastLine?type.marker-lastLine:0;
          const center=(firstLine+lastLine)/2;
          const unitPenalty=strict?(unknown?Math.abs((type.total-known)-unknown)*.01:0):Math.abs(type.total-known)*2;
          const cost=state.cost+rangeDistance*(strict?20:30)+Math.abs(type.marker-center)*(strict?.1:.2)+unitPenalty;
          const prior=dp[typeIndex+1][end];
          if(!prior||cost<prior.cost)dp[typeIndex+1][end]={cost,previous:start};
        }
      }
    }
    if(!dp[typeCount][entryCount])return null;
    const groups=[];
    let end=entryCount;
    for(let typeIndex=typeCount;typeIndex>0;typeIndex--){
      const state=dp[typeIndex][end],start=state.previous;
      groups.push({type:ordered[typeIndex-1],entries:entries.slice(start,end)});
      end=start;
    }
    return groups.reverse();
  }

  function paymentHeader(data){
    const firstLine=data.entries[0].lineIndex;
    const header=data.section.slice(Math.max(0,firstLine-35),firstLine).join(" ");
    const rate=label=>{
      const match=header.match(new RegExp(label+"\\s*\\(?\\s*(\\d+(?:\\.\\d+)?)\\s*%"));
      return match?Number(match[1]):0;
    };
    const interim=rate("중도금");
    const numbered=[...header.matchAll(/\d+\s*(?:차|회)\s*\(\s*(\d+(?:\.\d+)?)\s*%\s*\)/g)].map(match=>Number(match[1]));
    let rates=[];
    for(let start=numbered.length-1;start>=0;start--){
      const tail=numbered.slice(start);
      if(Math.abs(tail.reduce((value,current)=>value+current,0)-interim)<.01){rates=tail;break}
    }
    const allDates=[...header.matchAll(/(20\d{2})[.\-/년]\s*(\d{1,2})[.\-/월]\s*(\d{1,2})/g)].map(match=>normalizeDate(`${match[1]}-${match[2]}-${match[3]}`)).filter(Boolean);
    return {interim,rates,allDates};
  }

  function buildPaymentRows(data,details){
    const detail=details.find(item=>item.paymentAmounts.length);
    const representative=detail?.paymentAmounts||[];
    if(representative.length<2)return [];
    const header=paymentHeader(data),beforeBalance=representative.slice(0,-1);
    let interimCount=0;
    if(header.interim>0){
      for(let start=beforeBalance.length-1;start>=0;start--){
        const total=beforeBalance.slice(start).reduce((value,current)=>value+current,0);
        if(Math.abs(total-detail.price*header.interim/100)<=Math.max(5000,detail.price*.001)){interimCount=beforeBalance.length-start;break}
      }
    }
    if(!interimCount&&header.rates.length&&header.rates.length<=representative.length-2)interimCount=header.rates.length;
    if(!interimCount&&header.allDates.length)interimCount=Math.min(representative.length-2,header.allDates.length);
    const contractCount=Math.max(1,representative.length-interimCount-1);
    const interimDates=header.allDates.slice(-interimCount);
    const contractDates=header.allDates.slice(0,Math.max(0,header.allDates.length-interimCount));
    return representative.map((amount,slot)=>{
      let kind,label,dueDate="",dueLabel="";
      if(slot<contractCount){
        kind="contract";label=contractCount===1?"계약금":`계약금 ${slot+1}차`;
        dueDate=slot?contractDates.at(-1)||"":"";dueLabel=slot?(dueDate?"":"공고문 계약기한"):"계약 시";
      }else if(slot<contractCount+interimCount){
        const index=slot-contractCount;
        kind="interim";label=`중도금 ${index+1}차`;dueDate=interimDates[index]||"";dueLabel=dueDate?"":"공고문 확인";
      }else{kind="balance";label="잔금";dueLabel="입주 지정일"}
      return {kind,label,rate:detail.price?amount/detail.price*100:0,dueDate,dueLabel,slot};
    });
  }

  function parsePaymentData(lines,sizeNames=[]){
    const clean=(lines||[]).map(line=>normalizeSplitDecimals(line).replace(/[–—]/g,"-").replace(/\s+/g," ").trim()).filter(Boolean);
    const sizes=[];
    (sizeNames||[]).forEach(item=>{
      const name=typeof item==="object"?String(item.name||item.size||""):String(item);
      if(name&&!sizes.some(row=>row.name===name))sizes.push({name,total:typeof item==="object"?integer(item.total):0});
    });
    if(!sizes.length)return {pricing:[],payments:[],confidence:0};
    const data=paymentSection(clean,sizes);
    if(!data)return {pricing:[],payments:[],confidence:0};
    const groups=groupPriceEntries(data,sizes,true)||groupPriceEntries(data,sizes,false);
    if(!groups)return {pricing:[],payments:[],confidence:0};
    const byName=new Map(groups.map(group=>[group.type.name,group.entries]));
    const pricing=sizes.map(size=>{
      const detailMap=new Map();
      (byName.get(size.name)||[]).forEach(entry=>{
        const prior=detailMap.get(entry.price);
        if(!prior||entry.paymentAmounts.length>prior.paymentAmounts.length)detailMap.set(entry.price,{price:entry.price,paymentAmounts:entry.paymentAmounts});
      });
      const details=[...detailMap.values()].sort((a,b)=>a.price-b.price);
      const options=details.map(detail=>detail.price);
      return {size:size.name,min:options[0]||0,max:options.at(-1)||0,options,details};
    }).filter(row=>row.max>0);
    const allDetails=pricing.flatMap(row=>row.details);
    const payments=buildPaymentRows(data,allDetails);
    const complete=pricing.length===sizes.length;
    const exactPayments=allDetails.filter(detail=>detail.paymentAmounts.length>=2).length;
    const confidence=Math.min(100,(complete?55:pricing.length?35:0)+(payments.length?25:0)+(exactPayments===allDetails.length?20:exactPayments?10:0));
    return {pricing,payments,confidence};
  }
  function parseInterimLoanPlan(text,payments=[]){
    const interim=payments.filter(row=>row.kind==="interim"),count=interim.length;
    if(!count)return {modes:[],source:"중도금 회차 없음"};
    const compact=String(text||"").replace(/\s+/g," ");
    const explicit=compact.match(/1\s*[~∼\-]\s*(\d+)\s*회차\s*(?:까지\s*)?(?:중도금\s*)?대출[\s\S]{0,100}?(\d+)\s*[~∼\-]\s*(\d+)\s*회차\s*중도금[\s\S]{0,50}?(?:직접\s*납부|자납)/);
    if(explicit){
      const loanThrough=Math.min(count,integer(explicit[1]));
      return {modes:interim.map((_,index)=>index<loanThrough?"loan":"self"),source:`공고문 1~${loanThrough}회차 대출·${loanThrough+1}~${count}회차 자납`};
    }
    const matches=[...compact.matchAll(/중도금\s*(?:대출|융자)[\s\S]{0,100}?(?:전체\s*)?(?:분양|공급)(?:대금|가격|금액)?(?:의)?\s*(\d+)\s*%\s*범위|(?:전체\s*)?(?:분양|공급)(?:대금|가격|금액)?(?:의)?\s*(\d+)\s*%\s*범위[\s\S]{0,80}?중도금\s*(?:대출|융자)/g)];
    const limit=matches.map(match=>integer(match[1]||match[2])).find(value=>value>0&&value<=100)||0;
    if(limit){
      let accumulated=0;
      const modes=interim.map(row=>{if(accumulated+(Number(row.rate)||0)<=limit+.01){accumulated+=Number(row.rate)||0;return "loan"}return "self"});
      return {modes,source:`공고문 대출 알선 ${limit}% 범위 · 회차는 확인 필요`};
    }
    return {modes:interim.map(()=>"review"),source:"대출 알선 회차를 공고문에서 확정하지 못함"};
  }
  function optionMoneyValues(line){
    return [...String(line||"").matchAll(/\d{1,3}(?:,\d{3})+/g)]
      .map(match=>({value:Number(match[0].replace(/,/g,"")),index:match.index,end:(match.index||0)+match[0].length}))
      .filter(item=>item.value>=100000&&item.value<=1000000000);
  }

  function optionCategory(line){
    const value=String(line||"").replace(/\s+/g," ");
    if(/발코니\s*확장/.test(value)&&(/공사비|금액|대금|계약|품목|비용|납부|선택/.test(value)||value.length<50))return "balcony";
    if(/시스템\s*에어컨|천장형\s*에어컨/.test(value)&&(/공급금액|가격|대금|계약|품목|옵션|납부|선택/.test(value)||value.length<55))return "system";
    if(/추가\s*선택품목|유상\s*(?:옵션|선택품목)|플러스\s*옵션|가전\s*옵션|마감재\s*옵션/.test(value))return "paid";
    return "";
  }

  function optionTotal(line){
    const values=optionMoneyValues(line);
    for(let index=0;index<values.length;index++){
      for(let count=4;count>=2;count--){
        if(index+count>=values.length)continue;
        const total=values[index].value;
        const parts=values.slice(index+1,index+1+count).map(item=>item.value);
        if(Math.abs(parts.reduce((sum,value)=>sum+value,0)-total)<=Math.max(2000,total*.001))return {total,parts,index:values[index].index,end:values[index+count].end};
      }
    }
    if(values.length===1)return {total:values[0].value,parts:[],index:values[0].index,end:values[0].end};
    return null;
  }

  function optionSizeNames(text,sizes){
    const value=String(text||"").toUpperCase(),found=[];
    const add=name=>{if(name&&!found.includes(name))found.push(name)};
    sizes.forEach(size=>{
      const escaped=size.name.toUpperCase().replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
      if(new RegExp(`(?:^|[^0-9A-Z])${escaped}(?![0-9A-Z])`).test(value))add(size.name);
    });
    for(const match of value.matchAll(/(?:^|[^0-9A-Z])(\d{2,3})([A-Z])(?:\s*[/,]\s*([A-Z]))+(?![0-9A-Z])/g)){
      const base=match[1];
      [match[2],...match[0].match(/[A-Z]/g).slice(1)].forEach(suffix=>add(canonicalSize(base+suffix,sizes)));
    }
    for(const match of value.matchAll(/\b0?(\d{2,3})\.\d{2,4}([A-Z])?\b/g))add(canonicalSize(String(Number(match[1]))+(match[2]||""),sizes));
    return found;
  }

  function optionName(prefix,category){
    let value=String(prefix||"")
      .replace(/\b0?\d{2,3}\.\d{2,4}[A-Z]?\b/g," ")
      .replace(/\b\d{2,3}[A-Z]?(?:\s*[/,]\s*[A-Z])?\b/g," ")
      .replace(/\b(?:VAT|부가세|단위|원|타입|주택형|선택)\b/gi," ")
      .replace(/[■□※()\[\]]/g," ").replace(/\s+/g," ").trim();
    if(category==="balcony")return "발코니 확장";
    if(!value)value=category==="system"?"시스템에어컨":"유상옵션";
    if(category==="system"&&!/에어컨/.test(value))value=`시스템에어컨 · ${value}`;
    return value.slice(0,80);
  }

  function optionId(size,category,name,price){
    const value=`${size}|${category}|${name}|${price}`;
    let hash=2166136261;
    for(let index=0;index<value.length;index++){hash^=value.charCodeAt(index);hash=Math.imul(hash,16777619)}
    return `opt-${(hash>>>0).toString(36)}`;
  }

  function parseOptionData(lines,sizeNames=[]){
    const sizes=[];
    (sizeNames||[]).forEach(item=>{
      const name=typeof item==="object"?String(item.name||item.size||""):String(item);
      if(name&&!sizes.some(row=>row.name===name))sizes.push({name});
    });
    if(!sizes.length)return [];
    const clean=(lines||[]).map(line=>normalizeSplitDecimals(line).replace(/[–—]/g,"-").replace(/\s+/g," ").trim());
    const entries=[],dedupe=new Set();
    let category="",headerLine=-999,currentSizes=[],matrixSizes=[];
    const reject=/가구당|평균소득|소득기준|예금주|계좌번호|금융기관|은행|주택도시보증공사|인지세|연체료|보증료/;
    const add=(targets,kind,name,total,parts,sourceLine)=>{
      targets.forEach(size=>{
        const key=`${size}|${kind}|${name}|${total}`;
        if(!total||dedupe.has(key))return;
        dedupe.add(key);entries.push({id:optionId(size,kind,name,total),size,category:kind,name,price:total,paymentAmounts:parts||[],sourceLine});
      });
    };
    clean.forEach((line,lineIndex)=>{
      if(!line)return;
      if(/^__PAGE_\d+__$/.test(line)){category="";headerLine=-999;currentSizes=[];matrixSizes=[];return}
      const foundCategory=optionCategory(line);
      if(foundCategory){
        category=foundCategory;headerLine=lineIndex;
        if(!optionMoneyValues(line).length){currentSizes=[];matrixSizes=[]}
      }
      if(!category||lineIndex-headerLine>220||reject.test(line))return;
      const mentioned=optionSizeNames(line,sizes);
      const money=optionMoneyValues(line);
      if(mentioned.length&&money.length===0){currentSizes=mentioned;if(mentioned.length>1&&mentioned.length>=matrixSizes.length)matrixSizes=mentioned;return}
      if(mentioned.length)currentSizes=mentioned;
      if(!money.length)return;
      const total=optionTotal(line);
      const prefix=line.slice(0,total?.index??money[0].index);
      const itemCategory=/발코니\s*확장/.test(line)?"balcony":category;
      const name=optionName(prefix,itemCategory);
      if(total){
        const maximum=itemCategory==="system"?50000000:itemCategory==="balcony"?150000000:200000000;
        if(total.total>maximum||/감리|감정평가|공사비용 총액|계약금\s*\d*%|잔금\s*\d*%/.test(name))return;
        const targets=mentioned.length?mentioned:currentSizes;
        if(targets.length)add(targets,itemCategory,name,total.total,total.parts,line);
        return;
      }
      if(matrixSizes.length&&money.length===matrixSizes.length){
        matrixSizes.forEach((size,index)=>{const maximum=category==="system"?50000000:category==="balcony"?150000000:200000000;if(money[index].value<=maximum)add([size],category,name,money[index].value,[],line)});
      }
    });
    return entries.sort((a,b)=>a.size.localeCompare(b.size,"ko",{numeric:true})||a.category.localeCompare(b.category)||a.price-b.price||a.name.localeCompare(b.name,"ko"));
  }
  function annuityPrincipal(monthlyPayment,annualRate,months){
    monthlyPayment=Math.max(0,Number(monthlyPayment)||0);
    months=Math.max(0,Math.floor(Number(months)||0));
    if(!monthlyPayment||!months)return 0;
    const rate=Math.max(0,Number(annualRate)||0)/1200;
    return rate?monthlyPayment*(1-Math.pow(1+rate,-months))/rate:monthlyPayment*months;
  }
  function mortgagePolicyCap(price,scope){
    price=won(price);
    if(scope!=="capital")return Infinity;
    if(price<=1500000000)return 600000000;
    if(price<=2500000000)return 400000000;
    return 200000000;
  }
  function calculateLoanCapacity(input={}){
    const price=won(input.price),collateralValue=won(input.collateralValue)||price,annualIncome=won(input.annualIncome),existingAnnualDebtService=won(input.existingAnnualDebtService);
    const hasIncomeInput=Object.prototype.hasOwnProperty.call(input,"annualIncome");
    const mortgageLtv=clamp(input.mortgageLtv,0,100),dsrLimit=clamp(input.dsrLimit||40,0,100);
    const mortgageInterestRate=clamp(input.mortgageInterestRate,0,30),stressRate=clamp(input.stressRate,0,10);
    const mortgageYears=Math.max(1,Math.min(50,Math.floor(Number(input.mortgageYears)||30)));
    const ltvLimit=Math.round(collateralValue*mortgageLtv/100);
    const annualRoom=Math.max(0,annualIncome*dsrLimit/100-existingAnnualDebtService);
    const dsrRate=mortgageInterestRate+stressRate;
    const dsrLimitAmount=Math.round(annuityPrincipal(annualRoom/12,dsrRate,mortgageYears*12));
    const policyCap=mortgagePolicyCap(collateralValue,input.policyScope||"none");
    const manualCap=won(input.manualMortgageCap);
    const limits=[
      {key:"ltv",label:"LTV",amount:ltvLimit},
      ...(hasIncomeInput?[{key:"dsr",label:"스트레스 DSR",amount:dsrLimitAmount}]:[]),
      ...(Number.isFinite(policyCap)?[{key:"policy",label:"수도권 주담대 총액상한",amount:policyCap}]:[]),
      ...(manualCap?[{key:"manual",label:"금융기관 별도한도",amount:manualCap}]:[])
    ];
    const binding=limits.reduce((lowest,row)=>row.amount<lowest.amount?row:lowest,limits[0]||{key:"none",label:"한도 없음",amount:0});
    return {collateralValue,annualIncome,existingAnnualDebtService,mortgageLtv,dsrLimit,mortgageInterestRate,stressRate,mortgageYears,dsrRate,annualRoom,ltvLimit,dsrLimitAmount,policyCap,manualCap,limits,binding,estimatedLimit:Math.max(0,binding.amount)};
  }
  function buildMonthlyInterestSchedule(loans,balanceDate,annualRate,paymentMode){
    balanceDate=normalizeDate(balanceDate);
    const valid=(loans||[]).filter(row=>row.amount>0&&normalizeDate(row.dueDate)).map(row=>({...row,dueDate:normalizeDate(row.dueDate)}));
    if(!valid.length||!balanceDate||annualRate<=0||paymentMode==="free")return [];
    const first=valid.map(row=>row.dueDate).sort()[0];
    const cursor=new Date(first+"T00:00:00"),end=new Date(balanceDate+"T00:00:00");
    cursor.setDate(1);
    const rows=[];
    let cumulativeInterest=0;
    while(cursor<end&&rows.length<600){
      const monthStart=new Date(cursor),nextMonth=new Date(cursor.getFullYear(),cursor.getMonth()+1,1);
      const periodEnd=nextMonth<end?nextMonth:end;
      let interest=0,outstanding=0;
      valid.forEach(loan=>{
        const due=new Date(loan.dueDate+"T00:00:00");
        if(due<periodEnd){
          const activeStart=due>monthStart?due:monthStart;
          const days=Math.max(0,(periodEnd-activeStart)/86400000);
          const yearDays=new Date(activeStart.getFullYear(),1,29).getMonth()===1?366:365;
          interest+=loan.amount*annualRate/100*days/yearDays;
          outstanding+=loan.amount;
        }
      });
      interest=Math.round(interest);cumulativeInterest+=interest;
      rows.push({month:`${monthStart.getFullYear()}-${String(monthStart.getMonth()+1).padStart(2,"0")}`,outstanding,interest,cumulativeInterest,paidInterest:paymentMode==="monthly"?interest:0});
      cursor.setMonth(cursor.getMonth()+1);
    }
    return rows;
  }
  function dailySimpleInterest(amount,from,to,annualRate){
    from=normalizeDate(from);to=normalizeDate(to);
    if(!from||!to||to<=from||annualRate<=0)return 0;
    let cursor=new Date(from+"T00:00:00"),end=new Date(to+"T00:00:00"),interest=0;
    while(cursor<end){
      const nextYear=new Date(cursor.getFullYear()+1,0,1),periodEnd=nextYear<end?nextYear:end;
      const days=(periodEnd-cursor)/86400000;
      const yearDays=new Date(cursor.getFullYear(),1,29).getMonth()===1?366:365;
      interest+=amount*annualRate/100*days/yearDays;
      cursor=periodEnd;
    }
    return Math.round(interest);
  }  function buildFundingPlan(input){
    const price=won(input.price),extras=won(input.extras),cashNow=won(input.cashNow),reserve=won(input.reserve),monthlySaving=won(input.monthlySaving);
    const contractDate=normalizeDate(input.contractDate),moveInDate=normalizeDate(input.moveInDate),baseDate=normalizeDate(input.baseDate)||contractDate;
    const legacyInterimLoanEnabled=clamp(Number(input.interimLoanRate)||0,0,100)>0;
    const interimInterestRate=clamp(Number(input.interimInterestRate)||0,0,30);
    const interestPaymentMode=input.interestPaymentMode||(input.includeInterimInterest?"deferred":"free");
    const includeInterimInterest=interestPaymentMode!=="free"&&interimInterestRate>0;
    const loanCapacity=calculateLoanCapacity({...input,price});
    const mortgageTarget=loanCapacity.estimatedLimit;
    const source=(input.payments||[]).map((payment,index)=>({...payment,index,rate:Number(payment.rate)||0}));
    const resolved=source.map(payment=>{
      const phase=payment.phaseKind||payment.kind;
      const dueDate=normalizeDate(payment.dueDate)||(phase==="contract"?contractDate:phase==="balance"?moveInDate:"");
      return {...payment,phaseKind:phase,dueDate,dueText:dueDate||payment.dueLabel||"날짜 확인"};
    }).sort((a,b)=>a.dueDate&&b.dueDate?a.dueDate.localeCompare(b.dueDate)||a.index-b.index:a.dueDate?-1:b.dueDate?1:a.index-b.index);
    const balanceDate=moveInDate||resolved.find(payment=>payment.phaseKind==="balance"&&payment.dueDate)?.dueDate||"";
    const interimLoans=resolved.filter(payment=>payment.kind==="interim"&&!payment.extra&&(payment.loanEnabled!==undefined?Boolean(payment.loanEnabled):legacyInterimLoanEnabled)).map(payment=>({label:payment.label,dueDate:payment.dueDate,amount:payment.fixedAmount!==undefined&&payment.fixedAmount!==null?won(payment.fixedAmount):Math.round(price*payment.rate/100)}));
    const interestSchedule=buildMonthlyInterestSchedule(interimLoans,balanceDate,interimInterestRate,interestPaymentMode);
    const installmentInterest=interimLoans.map(loan=>({...loan,interest:includeInterimInterest?dailySimpleInterest(loan.amount,loan.dueDate,balanceDate,interimInterestRate):0}));
    const totalInterimInterest=installmentInterest.reduce((total,row)=>total+row.interest,0);
    if(interestSchedule.length){
      const roundedTotal=interestSchedule.reduce((total,row)=>total+row.interest,0);
      interestSchedule.at(-1).interest+=totalInterimInterest-roundedTotal;
      let cumulative=0;interestSchedule.forEach(row=>{cumulative+=row.interest;row.cumulativeInterest=cumulative;row.paidInterest=interestPaymentMode==="monthly"?row.interest:0});
    }
    const deferredInterest=interestPaymentMode==="deferred"?totalInterimInterest:0;
    const monthlyPaidInterest=interestPaymentMode==="monthly"?totalInterimInterest:0;
    let interimOutstanding=0,cumulativeOwn=0,worstShortage=0,firstShortage=null,peakInterim=0;
    const interestIncomplete=includeInterimInterest&&interimLoans.some(row=>!row.dueDate);
    const usableStart=Math.max(0,cashNow-reserve);
    const rows=resolved.map(payment=>{
      const scheduled=payment.fixedAmount!==undefined&&payment.fixedAmount!==null?won(payment.fixedAmount):Math.round(price*payment.rate/100);
      const phase=payment.phaseKind||payment.kind;
      let gross=scheduled,financing=0,own=scheduled,note=payment.extra?"공고문 선택품목 · 자기자금 납부":"자기자금 납부",interest=0,closingExtras=0;
      if(payment.kind==="interim"&&!payment.extra){
        const loanEnabled=payment.loanEnabled!==undefined?Boolean(payment.loanEnabled):legacyInterimLoanEnabled;
        financing=loanEnabled?scheduled:0;
        own=scheduled-financing;
        interimOutstanding+=financing;
        peakInterim=Math.max(peakInterim,interimOutstanding);
        interest=installmentInterest.find(row=>row.label===payment.label&&row.dueDate===payment.dueDate)?.interest||0;
        note=loanEnabled?`해당 회차 전액 대출 실행${interest?` · 발생이자 ${interest.toLocaleString("ko-KR")}원 예상`:""}`:"해당 회차 전액 자납";
      }else if(payment.kind==="balance"&&!payment.extra){
        const closingNeed=scheduled+interimOutstanding;
        financing=Math.min(closingNeed,mortgageTarget);
        closingExtras=extras+deferredInterest;
        own=Math.max(0,closingNeed-financing)+closingExtras;
        gross=scheduled+closingExtras;
        note=`주담대로 중도금대출 ${interimOutstanding.toLocaleString("ko-KR")}원 상환${closingExtras?` · 세금·기타비용 ${closingExtras.toLocaleString("ko-KR")}원 포함`:""}`;
        interimOutstanding=0;
      }
      const elapsedMonths=baseDate&&payment.dueDate?Math.max(0,Math.floor(monthsBetween(baseDate,payment.dueDate)+1e-6)):0;
      const accumulatedSavingGross=monthlySaving*elapsedMonths;
      const paidInterestToDate=interestPaymentMode==="monthly"&&payment.dueDate?interestSchedule.filter(row=>row.month<payment.dueDate.slice(0,7)).reduce((total,row)=>total+row.paidInterest,0):0;
      const accumulatedSaving=accumulatedSavingGross-paidInterestToDate;
      const cashBefore=usableStart+accumulatedSaving-cumulativeOwn;
      const cashAfter=cashBefore-own;
      cumulativeOwn+=own;
      const shortage=Math.max(0,-cashAfter);
      if(shortage&&!firstShortage)firstShortage={label:payment.label,dueText:payment.dueText,shortage};
      worstShortage=Math.max(worstShortage,shortage);
      return {...payment,phaseKind:phase,gross,scheduled,financing,own,cashBefore,cashAfter,shortage,elapsedMonths,accumulatedSaving,accumulatedSavingGross,paidInterestToDate,note,interest,closingExtras};
    });
    const totalOwn=rows.reduce((total,row)=>total+row.own,0);
    const optionTotal=source.filter(row=>row.extra).reduce((total,row)=>total+won(row.fixedAmount),0);
    const monthsToMoveIn=baseDate&&balanceDate?Math.max(0,Math.floor(monthsBetween(baseDate,balanceDate)+1e-6)):0;
    const grossSavingToMoveIn=monthlySaving*monthsToMoveIn;
    const ownCapitalAtMoveIn=usableStart+grossSavingToMoveIn;
    const netOwnCapitalAfterMonthlyInterest=ownCapitalAtMoveIn-monthlyPaidInterest;
    const totalCost=price+extras+optionTotal+totalInterimInterest;
    const mortgageRequired=Math.max(0,totalCost-ownCapitalAtMoveIn);
    const loanShortage=Math.max(0,mortgageRequired-mortgageTarget);
    const finalSurplus=Math.max(0,ownCapitalAtMoveIn+mortgageTarget-totalCost);
    let cumulativePrincipal=0,cumulativeInstallmentInterest=0;
    const interestByInstallment=installmentInterest.map(row=>{cumulativePrincipal+=row.amount;cumulativeInstallmentInterest+=row.interest;return {...row,cumulativePrincipal,cumulativeInterest:cumulativeInstallmentInterest}});
    return {price,extras,optionTotal,totalCost,cashNow,reserve,usableStart,monthlySaving,baseDate,interimInterestRate,interestPaymentMode,includeInterimInterest,deferredInterest,monthlyPaidInterest,totalInterimInterest,interestSchedule,interestByInstallment,interestIncomplete,loanCapacity,mortgageLtv:loanCapacity.mortgageLtv,mortgageTarget,peakInterim,totalOwn,ownCapitalAtMoveIn,netOwnCapitalAfterMonthlyInterest,grossSavingToMoveIn,mortgageRequired,loanShortage,finalSurplus,worstShortage,firstShortage,rows,rateTotal:source.filter(row=>!row.extra).reduce((total,row)=>total+row.rate,0),closingRow:rows.find(row=>row.kind==="balance"&&!row.extra)||null};
  }
  function normalizeDate(value){
    const raw=String(value||"").trim();
    if(!raw)return "";
    const digits=raw.replace(/\D/g,"");
    if(digits.length!==8)return "";
    const normalized=`${digits.slice(0,4)}-${digits.slice(4,6)}-${digits.slice(6,8)}`;
    const date=new Date(normalized+"T00:00:00");
    if(Number.isNaN(date.getTime())||date.getFullYear()!==Number(digits.slice(0,4))||date.getMonth()+1!==Number(digits.slice(4,6))||date.getDate()!==Number(digits.slice(6,8)))return "";
    return normalized;
  }

  function yearsBetween(from,to){
    from=normalizeDate(from);to=normalizeDate(to);
    if(!from||!to)return 0;
    const a=new Date(from+"T00:00:00"),b=new Date(to+"T00:00:00");
    if(Number.isNaN(a.getTime())||Number.isNaN(b.getTime())||b<a)return 0;
    let years=b.getFullYear()-a.getFullYear();
    const anniversaryPassed=b.getMonth()>a.getMonth()||(b.getMonth()===a.getMonth()&&b.getDate()>=a.getDate());
    if(!anniversaryPassed)years--;
    const lastAnniversary=new Date(a);lastAnniversary.setFullYear(a.getFullYear()+Math.max(0,years));
    const nextAnniversary=new Date(lastAnniversary);nextAnniversary.setFullYear(lastAnniversary.getFullYear()+1);
    const fraction=(b-lastAnniversary)/(nextAnniversary-lastAnniversary);
    return Math.max(0,years+fraction);
  }
  function monthsBetween(from,to){return yearsBetween(from,to)*12;}

  function profileType(profile){return PROFILE_LABELS[profile.profileType]?profile.profileType:"single";}
  function hasLegalSpouse(profile){return profileType(profile)==="married";}
  function hasSecondApplicant(profile){return hasLegalSpouse(profile);}
  function specialChildCount(profile){return integer(profile.children)+integer(profile.fetuses);}
  function generalChildCount(profile){return integer(profile.children);}
  function automaticHouseholdSize(profile){
    const adults=hasLegalSpouse(profile)?2:1;
    return Math.max(1,adults+integer(profile.children)+integer(profile.fetuses));
  }

  function incomeBase100(size){
    const count=Math.max(1,integer(size));
    if(count<=3)return INCOME_2025.base100[3];
    if(count<=8)return INCOME_2025.base100[count];
    return INCOME_2025.base100[8]+INCOME_2025.incrementsAfter8*(count-8);
  }
  function publishedIncomeThreshold(size,pct){
    const count=Math.max(1,integer(size));
    if(count<=8&&INCOME_2025.published[pct])return INCOME_2025.published[pct][Math.max(3,count)];
    return Math.round(incomeBase100(count)*Number(pct)/100);
  }
  function incomeMetrics(profile){
    const size=Math.max(1,integer(profile.householdSize)||automaticHouseholdSize(profile));
    const aIncome=won(profile.people?.a?.monthlyIncome);
    const bIncome=hasLegalSpouse(profile)?won(profile.people?.b?.monthlyIncome):0;
    const total=aIncome+bIncome;
    const base=incomeBase100(size);
    const pct=base?total/base*100:0;
    const dualIncome=hasLegalSpouse(profile)&&aIncome>0&&bIncome>0;
    return {year:INCOME_2025.year,size,aIncome,bIncome,total,base,pct,dualIncome,thresholds:{
      100:publishedIncomeThreshold(size,100),120:publishedIncomeThreshold(size,120),130:publishedIncomeThreshold(size,130),140:publishedIncomeThreshold(size,140),160:publishedIncomeThreshold(size,160)
    }};
  }

  function addYears(dateValue,years){
    const normalized=normalizeDate(dateValue);
    if(!normalized)return "";
    const date=new Date(normalized+"T00:00:00");
    const month=date.getMonth();
    date.setFullYear(date.getFullYear()+years);
    if(date.getMonth()!==month)date.setDate(0);
    return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
  }
  function laterDate(...values){return values.map(normalizeDate).filter(Boolean).sort().pop()||"";}
  function accountTablePoints(years){
    const months=years*12;
    return months<6?1:months<12?2:Math.min(17,Math.floor(years)+2);
  }
  function ownAccountPoints(account,noticeDate){
    if(!normalizeDate(account)||!normalizeDate(noticeDate))return {points:0,years:0,complete:false};
    const years=yearsBetween(account,noticeDate);
    return {points:accountTablePoints(years),years,complete:true};
  }
  function spouseAccountPoints(account,noticeDate){
    if(!normalizeDate(account)||!normalizeDate(noticeDate))return {points:0,years:0};
    const years=yearsBetween(account,noticeDate);
    return {points:Math.min(3,Math.round(accountTablePoints(years)/2)),years};
  }
  function generalNoHomePoints(person,profile,noticeDate){
    const missing=[];
    if(!profile.noHome)return {points:0,years:0,start:"",complete:true,missing};
    if(!normalizeDate(person.birth)){missing.push("생년월일");return {points:0,years:0,start:"",complete:false,missing};}
    if(!normalizeDate(noticeDate)){missing.push("공고일");return {points:0,years:0,start:"",complete:false,missing};}
    const age30=addYears(person.birth,30);
    const married=hasLegalSpouse(profile)&&normalizeDate(profile.marriageDate);
    if(!married&&normalizeDate(noticeDate)<age30)return {points:0,years:0,start:age30,complete:true,missing};
    let start=married&&normalizeDate(profile.marriageDate)<age30?normalizeDate(profile.marriageDate):age30;
    if(!profile.neverHome){
      const disposal=normalizeDate(profile.lastHomeDisposal);
      if(!disposal){missing.push("최근 주택 처분일");return {points:0,years:0,start:"",complete:false,missing};}
      start=laterDate(start,disposal);
    }
    const years=yearsBetween(start,noticeDate);
    const points=years>=15?32:years<1?2:Math.min(32,(Math.floor(years)+1)*2);
    return {points,years,start,complete:true,missing};
  }
  function generalScore(personKey,profile,notice){
    const person=profile.people[personKey];
    const spouse=profile.people[personKey==="a"?"b":"a"];
    const noHome=generalNoHomePoints(person,profile,notice.noticeDate);
    const own=ownAccountPoints(person.account,notice.noticeDate);
    const spouseAccount=hasLegalSpouse(profile)?spouseAccountPoints(spouse.account,notice.noticeDate):{points:0,years:0};
    const accountPoints=Math.min(17,own.points+spouseAccount.points);
    const childDependents=hasLegalSpouse(profile)||profile.unmarriedChildRegistered?integer(profile.children):0;
    const dependents=Math.max(0,(hasLegalSpouse(profile)?1:0)+childDependents+integer(person.otherDependents));
    const dependentPoints=Math.min(35,(Math.min(6,dependents)+1)*5);
    const missing=[...noHome.missing];
    if(!own.complete)missing.push("청약통장 가입일");
    return {points:noHome.points+dependentPoints+accountPoints,noHomePoints:noHome.points,noHomeYears:noHome.years,dependentPoints,dependents,accountPoints,ownAccountPoints:own.points,spouseAccountPoints:spouseAccount.points,complete:missing.length===0,missing:[...new Set(missing)]};
  }
  function multiNoHomePoints(person,profile,noticeDate){
    const missing=[];
    if(!profile.noHome)return {points:0,years:0,complete:true,missing};
    if(!normalizeDate(person.birth)){missing.push("생년월일");return {points:0,years:0,complete:false,missing};}
    let start=addYears(person.birth,19);
    if(!profile.neverHome){
      const disposal=normalizeDate(profile.lastHomeDisposal);
      if(!disposal){missing.push("최근 주택 처분일");return {points:0,years:0,complete:false,missing};}
      start=laterDate(start,disposal);
    }
    const years=yearsBetween(start,noticeDate);
    return {points:years>=10?20:years>=5?15:years>=1?10:0,years,complete:true,missing};
  }
  function multiScore(personKey,profile,notice){
    const person=profile.people[personKey];
    const children=specialChildCount(profile);
    const infants=integer(profile.infants)+integer(profile.fetuses);
    const childPoints=children>=4?40:children===3?35:children===2?25:0;
    const infantPoints=Math.min(15,infants*5);
    const householdPoints=person.threeGeneration||person.singleParent5?5:0;
    const noHome=multiNoHomePoints(person,profile,notice.noticeDate);
    const residenceValid=normalizeDate(profile.residenceStart)&&normalizeDate(notice.noticeDate);
    const residenceYears=residenceValid?yearsBetween(profile.residenceStart,notice.noticeDate):0;
    const residencePoints=residenceYears>=10?15:residenceYears>=5?10:residenceYears>=1?5:0;
    const accountValid=normalizeDate(person.account)&&normalizeDate(notice.noticeDate);
    const accountYears=accountValid?yearsBetween(person.account,notice.noticeDate):0;
    const accountPoints=accountYears>=10?5:0;
    const missing=[...noHome.missing];
    if(!residenceValid)missing.push("연속 거주 시작일");
    if(!accountValid)missing.push("청약통장 가입일");
    return {points:childPoints+infantPoints+householdPoints+noHome.points+residencePoints+accountPoints,childPoints,children,infantPoints,infants,householdPoints,noHomePoints:noHome.points,noHomeYears:noHome.years,residencePoints,residenceYears,accountPoints,accountYears,complete:missing.length===0,missing:[...new Set(missing)]};
  }
  function incomeStage(type,profile){
    const income=incomeMetrics(profile);
    const pct=income.pct;
    if(type==="newly"){
      const stage1Limit=income.dualIncome?120:100;
      const stage2Limit=income.dualIncome?160:140;
      const stage1IndividualOk=!income.dualIncome||Math.min(income.aIncome,income.bIncome)<=income.thresholds[100];
      const stage2IndividualOk=!income.dualIncome||Math.min(income.aIncome,income.bIncome)<=income.thresholds[140];
      if(income.total<=income.thresholds[stage1Limit]&&stage1IndividualOk)return {stage:1,label:"1단계 우선공급",reason:`가구소득 ${pct.toFixed(1)}%`,income};
      if(income.total<=income.thresholds[stage2Limit]&&stage2IndividualOk)return {stage:2,label:"2단계 일반공급",reason:`가구소득 ${pct.toFixed(1)}%`,income};
      if(profile.assetOk)return {stage:3,label:"3단계 추첨공급",reason:"소득 초과·자산기준 충족",income};
      return {stage:0,label:"소득·자산 부적격",reason:"상위소득은 자산기준 필요",income};
    }
    if(type==="first"||type==="baby"){
      if(income.total<=income.thresholds[130])return {stage:1,label:"1단계 우선공급",reason:`가구소득 ${pct.toFixed(1)}%`,income};
      if(income.total<=income.thresholds[160])return {stage:2,label:"2단계 일반공급",reason:`가구소득 ${pct.toFixed(1)}%`,income};
      if(profile.assetOk)return {stage:3,label:"3단계 추첨공급",reason:"소득 초과·자산기준 충족",income};
      return {stage:0,label:"소득·자산 부적격",reason:"상위소득은 자산기준 필요",income};
    }
    return {stage:null,label:"배점·순위",reason:"소득단계 없음",income};
  }

  function profileSummary(profile,noticeDate){
    const type=profileType(profile);
    const marriageYears=hasLegalSpouse(profile)&&normalizeDate(profile.marriageDate)&&normalizeDate(noticeDate)?yearsBetween(profile.marriageDate,noticeDate):null;
    let label=PROFILE_LABELS[type];
    if(type==="married")label=profile.marriageDate?(marriageYears<=7?"법률혼 · 혼인 7년 이내":"법률혼 · 혼인 7년 초과"):"법률혼 · 혼인신고일 입력 필요";
    return {type,label,marriageYears,legalSpouse:hasLegalSpouse(profile),secondApplicant:hasSecondApplicant(profile),specialChildren:specialChildCount(profile),generalChildren:generalChildCount(profile),automaticHouseholdSize:automaticHouseholdSize(profile)};
  }

  function eligibility(personKey,profile,notice){
    const p=profile.people[personKey];
    const type=profileType(profile);
    const secondAllowed=personKey!=="b"||hasSecondApplicant(profile);
    if(notice.remainder){
      const blocked=key=>({ok:false,reason:"무순위 공고에는 "+TYPE_LABELS[key]+" 없음"});
      const result={agency:blocked("agency"),multi:blocked("multi"),newly:blocked("newly"),elder:blocked("elder"),first:blocked("first"),baby:blocked("baby"),
        general:{ok:secondAllowed&&profile.reWinClean,reason:secondAllowed&&profile.reWinClean?"무순위 추첨 · 통장·가점 무관(세부 자격은 공고문 확인)":"재당첨 제한 확인 필요"}};
      return result;
    }
    const accountMonths=monthsBetween(p.account,notice.noticeDate);
    const marriageYears=hasLegalSpouse(profile)&&normalizeDate(profile.marriageDate)&&normalizeDate(notice.noticeDate)?yearsBetween(profile.marriageDate,notice.noticeDate):99;
    const childAge=normalizeDate(profile.youngestBirth)&&normalizeDate(notice.noticeDate)?yearsBetween(profile.youngestBirth,notice.noticeDate):99;
    const specialChildren=specialChildCount(profile);
    const base=secondAllowed&&profile.noHome&&profile.specialClean&&profile.reWinClean&&p.deposit;
    const headOk=notice.generalHeadRequired==="no"||p.head;
    const generalMonthsRequired=Number(notice.generalMonths||24);
    const firstRankMissing=[];
    if(!headOk)firstRankMissing.push("세대주 아님(규제지역은 세대주만 1순위)");
    if(!profile.reWinClean)firstRankMissing.push("재당첨 제한 체크 해제됨");
    if(!p.deposit)firstRankMissing.push("예치금 체크 해제됨");
    if(accountMonths<generalMonthsRequired)firstRankMissing.push(`통장 ${Math.floor(accountMonths)}개월/${generalMonthsRequired}개월 필요 (가입일 ${normalizeDate(p.account)||"미입력"} → 공고일 ${normalizeDate(notice.noticeDate)||"미입력"} 기준)`);
    const firstRank=secondAllowed&&firstRankMissing.length===0;
    const registeredUnmarriedChild=integer(profile.children)>0&&Boolean(profile.unmarriedChildRegistered);
    const normalFirstHome=hasLegalSpouse(profile)||registeredUnmarriedChild;
    const singleHousehold=!hasLegalSpouse(profile)&&specialChildren===0;
    const singleHouseholdAreaLimited=singleHousehold&&profile.singleHouseholdKind!=="not_solo";
    const result={
      agency:{ok:base&&p.agency&&accountMonths>=Number(notice.specialMonths||6),reason:p.agency?"기관추천 확인":"기관추천 대상 확인 필요"},
      multi:{ok:base&&specialChildren>=2&&accountMonths>=Number(notice.specialMonths||6),reason:specialChildren>=2?`특공 자녀 ${specialChildren}명(태아 포함)`:"태아 포함 미성년 자녀 2명 이상 필요"},
      newly:{ok:base&&type==="married"&&Boolean(profile.marriageDate)&&marriageYears<=7&&accountMonths>=Number(notice.specialMonths||6),reason:type!=="married"?"법적 혼인신고가 된 배우자 필요":!profile.marriageDate?"혼인신고일 입력 필요":marriageYears<=7?`혼인 ${marriageYears.toFixed(1)}년 · ${integer(profile.marriageChildren)>0?"1순위":"2순위"}`:"혼인기간 7년 초과",newlyRank:integer(profile.marriageChildren)>0?1:2},
      elder:{ok:base&&firstRank&&p.elder3&&p.elderNoHome,reason:p.elder3&&p.elderNoHome?"부양·무주택 확인":"노부모 3년 부양·무주택 확인 필요"},
      first:{ok:base&&firstRank&&profile.neverHome&&p.tax5&&(normalFirstHome||singleHousehold),reason:profile.neverHome&&p.tax5?(singleHousehold?(singleHouseholdAreaLimited?"1인 단독세대 · 추첨 · 60㎡ 이하":"1인 비단독세대 · 추첨공급"):!hasLegalSpouse(profile)&&specialChildren>0&&!registeredUnmarriedChild?"미혼 자녀 주민등록표 등재 필요":"생애최초·소득세 요건 확인"):"과거소유·소득세 요건 확인 필요",singleHousehold,singleHouseholdAreaLimited},
      baby:{ok:base&&firstRank&&(integer(profile.fetuses)>0||childAge<=2),reason:integer(profile.fetuses)>0?`태아 ${integer(profile.fetuses)}명`:childAge<=2?`막내 ${childAge.toFixed(1)}세`:"공고일 현재 2세 이하 자녀 또는 태아 필요"},
      general:{ok:firstRank,reason:firstRank?"민영주택 1순위 입력요건 충족":firstRankMissing.join(" · ")||"현재 프로필에는 법적 배우자 B가 없음"}
    };
    if(!secondAllowed){Object.values(result).forEach(item=>{item.ok=false;item.reason="현재 프로필에는 법적 배우자 B가 없음"});}
    ["newly","first","baby"].forEach(supplyType=>{
      const band=incomeStage(supplyType,profile);
      result[supplyType].band=band;
      if(band.stage===0){result[supplyType].ok=false;result[supplyType].reason=band.label;}
    });
    return result;
  }

  const api={TYPE_LABELS,PROFILE_LABELS,INCOME_2025,normalizeDate,pointRateForArea,generalAllocation,specialAllocation,availableSpecialStages,specialWinProbability,generalWinProbability,acquisitionCostEstimate,parseSupplyRows,parseRemainderSupply,parsePaymentData,parseInterimLoanPlan,parseOptionData,annuityPrincipal,mortgagePolicyCap,calculateLoanCapacity,buildMonthlyInterestSchedule,buildFundingPlan,yearsBetween,monthsBetween,profileType,hasLegalSpouse,hasSecondApplicant,specialChildCount,generalChildCount,automaticHouseholdSize,incomeBase100,publishedIncomeThreshold,incomeMetrics,addYears,ownAccountPoints,spouseAccountPoints,generalNoHomePoints,generalScore,multiNoHomePoints,multiScore,incomeStage,profileSummary,eligibility};
  root.SubscriptionRules=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
