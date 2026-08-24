(function(root){
  "use strict";

  const GENERIC_NAMES=new Set(["민영주택","공공주택","국민주택","이름없는공고",""]);
  const clone=value=>JSON.parse(JSON.stringify(value));
  const number=value=>Math.max(0,Number(value)||0);

  function token(value){
    return String(value||"").normalize("NFKC").toLowerCase()
      .replace(/입주자\s*모집\s*공고|모집\s*공고문|\.pdf$/gi,"")
      .replace(/[^0-9a-z가-힣]/g,"");
  }
  function normalizeDate(value){
    const digits=String(value||"").replace(/\D/g,"");
    return digits.length>=8?`${digits.slice(0,4)}-${digits.slice(4,6)}-${digits.slice(6,8)}`:"";
  }
  function meaningfulName(value){
    const normalized=token(value);
    return GENERIC_NAMES.has(normalized)?"":normalized;
  }
  function identity(item){
    const manageNo=String(item?.houseManageNo||"").replace(/\D/g,"");
    return {
      manageNo:manageNo.length>=8?manageNo:"",
      date:normalizeDate(item?.noticeDate||item?.announceDate),
      file:token(item?.sourceFile),
      name:meaningfulName(item?.projectName)
    };
  }
  function sameIdentity(a,b){
    const left=identity(a),right=identity(b);
    if(left.manageNo&&right.manageNo)return left.manageNo===right.manageNo;
    if(!left.date||left.date!==right.date)return false;
    if(left.file&&right.file&&left.file===right.file)return true;
    return Boolean(left.name&&right.name&&left.name===right.name);
  }
  function completeness(item){
    const priced=(item?.pricing||[]).filter(row=>number(row.max)>0).length;
    const payments=(item?.payments||[]).filter(row=>number(row.rate)>0).length;
    return (item?.verified?100000:0)+(identity(item).manageNo?5000:0)+
      (item?.sizes?.length||0)*250+priced*120+payments*35+
      (item?.options?.length||0)*15+number(item?.parseConfidence)+
      (meaningfulName(item?.projectName)?100:0);
  }
  function mergeGroup(group){
    const ordered=[...group].sort((a,b)=>completeness(b)-completeness(a));
    const best=clone(ordered[0]);
    ordered.slice(1).forEach(item=>{
      ["houseManageNo","announceDate","noticeDate","rceptStart","rceptEnd","pblancUrl","location","priorityRegion","sourceFile","expectedContractDate","expectedMoveInDate","expectedMoveInLabel"].forEach(key=>{
        if(!best[key]&&item[key])best[key]=clone(item[key]);
      });
      ["sizes","pricing","payments","options","interimLoanModes"].forEach(key=>{
        if((item[key]?.length||0)>(best[key]?.length||0))best[key]=clone(item[key]);
      });
      best.expectations={...(item.expectations||{}),...(best.expectations||{})};
      if(best.expectationsSource!=="actual"&&item.expectationsSource==="actual")best.expectationsSource="actual";
    });
    return best;
  }
  function canJoinGroup(group,candidate){
    if(!group.some(item=>sameIdentity(item,candidate)))return false;
    const manageNos=new Set([...group,candidate].map(item=>identity(item).manageNo).filter(Boolean));
    return manageNos.size<=1;
  }
  function dedupe(collection,currentId,defaultId="default"){
    const entries=Object.values(collection||{}).filter(item=>item&&item.id)
      .sort((a,b)=>completeness(b)-completeness(a));
    const groups=[];
    entries.forEach(item=>{
      const group=groups.find(candidate=>canJoinGroup(candidate,item));
      if(group)group.push(item);else groups.push([item]);
    });
    const notices={},idMap={};
    let removed=0;
    groups.forEach(group=>{
      const merged=mergeGroup(group);
      notices[merged.id]=merged;
      group.forEach(item=>{idMap[item.id]=merged.id;});
      removed+=group.length-1;
    });
    return {
      notices,
      activeId:idMap[currentId]||currentId||Object.keys(notices)[0]||defaultId,
      removed
    };
  }
  function findDuplicateId(collection,candidate){
    return Object.values(collection||{}).filter(item=>item?.id&&sameIdentity(item,candidate))
      .sort((a,b)=>completeness(b)-completeness(a))[0]?.id||"";
  }

  const api={token,identity,sameIdentity,completeness,dedupe,findDuplicateId};
  root.NoticeDeduper=api;
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
