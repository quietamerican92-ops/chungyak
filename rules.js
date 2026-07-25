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
  function buildFundingPlan(input){
    const price=won(input.price),extras=won(input.extras),cashNow=won(input.cashNow),reserve=won(input.reserve),monthlySaving=won(input.monthlySaving);
    const contractDate=normalizeDate(input.contractDate),moveInDate=normalizeDate(input.moveInDate),baseDate=normalizeDate(input.baseDate)||contractDate;
    const interimLoanRate=clamp(Number(input.interimLoanRate)||0,0,100),mortgageLtv=clamp(Number(input.mortgageLtv)||0,0,100);
    const mortgageTarget=Math.round(price*mortgageLtv/100);
    const source=(input.payments||[]).map((payment,index)=>({...payment,index,rate:Number(payment.rate)||0}));
    const resolved=source.map(payment=>{
      const dueDate=normalizeDate(payment.dueDate)||(payment.kind==="contract"?contractDate:payment.kind==="balance"?moveInDate:"");
      return {...payment,dueDate,dueText:dueDate||payment.dueLabel||"날짜 확인"};
    }).sort((a,b)=>a.dueDate&&b.dueDate?a.dueDate.localeCompare(b.dueDate):a.dueDate?-1:b.dueDate?1:a.index-b.index);
    let interimOutstanding=0,cumulativeOwn=0,worstShortage=0,firstShortage=null,peakInterim=0;
    const usableStart=Math.max(0,cashNow-reserve);
    const rows=resolved.map(payment=>{
      const scheduled=payment.fixedAmount!==undefined&&payment.fixedAmount!==null?won(payment.fixedAmount):Math.round(price*payment.rate/100);
      let gross=scheduled,financing=0,own=scheduled,note="자기자금 납부";
      if(payment.kind==="interim"){
        financing=Math.round(scheduled*interimLoanRate/100);
        own=scheduled-financing;
        interimOutstanding+=financing;
        peakInterim=Math.max(peakInterim,interimOutstanding);
        note=`중도금 대출 ${interimLoanRate.toFixed(0)}% 가정`;
      }else if(payment.kind==="balance"){
        const closingNeed=scheduled+interimOutstanding;
        financing=Math.min(closingNeed,mortgageTarget);
        own=Math.max(0,closingNeed-financing)+extras;
        gross=scheduled+extras;
        note=`주담대에서 중도금 대출 ${interimOutstanding.toLocaleString("ko-KR")}원 상환 포함`;
        interimOutstanding=0;
      }
      const elapsedMonths=baseDate&&payment.dueDate?Math.max(0,Math.floor(monthsBetween(baseDate,payment.dueDate)+1e-6)):0;
      const accumulatedSaving=monthlySaving*elapsedMonths;
      const cashBefore=usableStart+accumulatedSaving-cumulativeOwn;
      const cashAfter=cashBefore-own;
      cumulativeOwn+=own;
      const shortage=Math.max(0,-cashAfter);
      if(shortage&&!firstShortage)firstShortage={label:payment.label,dueText:payment.dueText,shortage};
      worstShortage=Math.max(worstShortage,shortage);
      return {...payment,gross,scheduled,financing,own,cashBefore,cashAfter,shortage,elapsedMonths,accumulatedSaving,note};
    });
    return {price,extras,totalCost:price+extras,cashNow,reserve,usableStart,monthlySaving,baseDate,interimLoanRate,mortgageLtv,mortgageTarget,peakInterim,totalOwn:rows.reduce((total,row)=>total+row.own,0),worstShortage,firstShortage,rows,rateTotal:source.reduce((total,row)=>total+row.rate,0)};
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
  function ownAccountPoints(account,noticeDate){
    if(!normalizeDate(account)||!normalizeDate(noticeDate))return {points:0,years:0,complete:false};
    const years=yearsBetween(account,noticeDate),months=years*12;
    const points=months<6?1:months<12?2:Math.min(17,Math.floor(years)+2);
    return {points,years,complete:true};
  }
  function spouseAccountPoints(account,noticeDate){
    if(!normalizeDate(account)||!normalizeDate(noticeDate))return {points:0,years:0};
    const years=yearsBetween(account,noticeDate);
    return {points:years<1?1:years<2?2:3,years};
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
    const accountMonths=monthsBetween(p.account,notice.noticeDate);
    const marriageYears=hasLegalSpouse(profile)&&normalizeDate(profile.marriageDate)&&normalizeDate(notice.noticeDate)?yearsBetween(profile.marriageDate,notice.noticeDate):99;
    const childAge=normalizeDate(profile.youngestBirth)&&normalizeDate(notice.noticeDate)?yearsBetween(profile.youngestBirth,notice.noticeDate):99;
    const specialChildren=specialChildCount(profile);
    const base=secondAllowed&&profile.noHome&&profile.specialClean&&profile.reWinClean&&p.deposit;
    const headOk=notice.generalHeadRequired==="no"||p.head;
    const firstRank=secondAllowed&&headOk&&profile.reWinClean&&p.deposit&&accountMonths>=Number(notice.generalMonths||24);
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
      general:{ok:firstRank,reason:firstRank?"민영주택 1순위 입력요건 충족":"세대주·통장기간·예치금·당첨제한 확인"}
    };
    if(!secondAllowed){Object.values(result).forEach(item=>{item.ok=false;item.reason="현재 프로필에는 법적 배우자 B가 없음"});}
    ["newly","first","baby"].forEach(supplyType=>{
      const band=incomeStage(supplyType,profile);
      result[supplyType].band=band;
      if(band.stage===0){result[supplyType].ok=false;result[supplyType].reason=band.label;}
    });
    return result;
  }

  const api={TYPE_LABELS,PROFILE_LABELS,INCOME_2025,normalizeDate,pointRateForArea,generalAllocation,specialAllocation,availableSpecialStages,parseSupplyRows,parsePaymentData,buildFundingPlan,yearsBetween,monthsBetween,profileType,hasLegalSpouse,hasSecondApplicant,specialChildCount,generalChildCount,automaticHouseholdSize,incomeBase100,publishedIncomeThreshold,incomeMetrics,addYears,ownAccountPoints,spouseAccountPoints,generalNoHomePoints,generalScore,multiNoHomePoints,multiScore,incomeStage,profileSummary,eligibility};
  root.SubscriptionRules=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);