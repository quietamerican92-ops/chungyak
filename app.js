(function(){
  "use strict";
  const R=window.SubscriptionRules;
  const $=id=>document.getElementById(id);
  const clone=value=>JSON.parse(JSON.stringify(value));
  const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const num=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
  const sum=(rows,key)=>rows.reduce((total,row)=>total+num(row[key]),0);
  const PROFILE_KEY="subscription_profile_v3";
  const NOTICES_KEY="subscription_notices_v3";
  const ACTIVE_KEY="subscription_active_notice_v3";
  const FINANCE_KEY="subscription_funding_v3";

  const DEFAULT_NOTICE={
    id:"wolgyesclass-20260716",
    projectName:"월계 중흥S-클래스 리비에르",
    noticeDate:"2026-07-16",
    location:"서울특별시 노원구",
    housingType:"private",
    priorityRegion:"서울특별시",
    priorityYears:2,
    specialMonths:6,
    generalMonths:24,
    generalHeadRequired:"yes",
    pointRates:{small:40,medium:70,large:80},
    verified:true,
    sourceFile:"월계중흥S클래스.pdf",
    parseConfidence:100,
    sizes:[
      {name:"36",area:36.9533,total:20,agency:2,multi:2,newly:3,elder:0,first:1,baby:2,general:10},
      {name:"59A",area:59.9667,total:71,agency:7,multi:7,newly:10,elder:2,first:5,baby:7,general:33},
      {name:"59B",area:59.9424,total:42,agency:5,multi:5,newly:6,elder:1,first:3,baby:5,general:17},
      {name:"84A",area:84.9807,total:2,agency:0,multi:0,newly:0,elder:0,first:0,baby:0,general:2}
    ],
    pricing:[
      {size:"36",min:682000000,max:695900000,options:[682000000,692400000,695900000]},
      {size:"59A",min:1187700000,max:1263500000,options:[1187700000,1194000000,1215500000,1238200000,1257200000,1263500000]},
      {size:"59B",min:1167500000,max:1242000000,options:[1167500000,1173700000,1194800000,1217200000,1235800000,1242000000]},
      {size:"84A",min:1499100000,max:1499100000,options:[1499100000]}
    ],
    payments:[
      {kind:"contract",label:"계약금",rate:10,dueDate:"",dueLabel:"계약 시"},
      {kind:"interim",label:"중도금 1차",rate:10,dueDate:"2027-01-30",dueLabel:""},
      {kind:"interim",label:"중도금 2차",rate:10,dueDate:"2027-05-31",dueLabel:""},
      {kind:"interim",label:"중도금 3차",rate:10,dueDate:"2027-10-29",dueLabel:""},
      {kind:"interim",label:"중도금 4차",rate:10,dueDate:"2028-03-30",dueLabel:""},
      {kind:"interim",label:"중도금 5차",rate:10,dueDate:"2028-08-30",dueLabel:""},
      {kind:"interim",label:"중도금 6차",rate:10,dueDate:"2029-01-30",dueLabel:""},
      {kind:"balance",label:"잔금",rate:30,dueDate:"",dueLabel:"입주 지정일"}
    ],
    expectedContractDate:"2026-08-18",expectedMoveInDate:"2029-05-01",expectedMoveInLabel:"2029년 05월 예정",paymentConfidence:100
  };

  const PROFILE_IDS=[
    "residenceRegion","residenceStart","lastHomeDisposal","noHome","neverHome","specialClean","reWinClean",
    "singleHouseholdKind","unmarriedChildRegistered","marriageDate","children","fetuses","marriageChildren","infants","youngestBirth","assetOk",
    "householdSize","householdSizeAuto","aMonthlyIncome","bMonthlyIncome",
    "aAccount","aBirth","aOtherDependents","aHead","aDeposit","aTax5","aElder3","aElderNoHome","aAgency","aThreeGeneration","aSingleParent5",
    "bAccount","bBirth","bOtherDependents","bHead","bDeposit","bTax5","bElder3","bElderNoHome","bAgency","bThreeGeneration","bSingleParent5",
    "minArea","mode","bothApply","allowSpecialGeneral","diversify"
  ];
  const CHECK_IDS=new Set(["unmarriedChildRegistered","noHome","neverHome","specialClean","reWinClean","assetOk","aHead","aDeposit","aTax5","aElder3","aElderNoHome","aAgency","aThreeGeneration","aSingleParent5","bHead","bDeposit","bTax5","bElder3","bElderNoHome","bAgency","bThreeGeneration","bSingleParent5","bothApply","allowSpecialGeneral","diversify"]);
  const NOTICE_FIELDS=["projectName","noticeDate","location","housingType","priorityRegion","priorityYears","specialMonths","generalMonths","generalHeadRequired"];
  const FINANCE_IDS=["planSize","planPrice","planExtras","cashNow","cashReserve","monthlySaving","contractDate","moveInDate","interimLoanRate","mortgageLtv"];
  let notices=readStorage(NOTICES_KEY,{});
  if(!Object.keys(notices).length)notices[DEFAULT_NOTICE.id]=clone(DEFAULT_NOTICE);
  let activeId=localStorage.getItem(ACTIVE_KEY)||DEFAULT_NOTICE.id;
  let notice=clone(notices[activeId]||DEFAULT_NOTICE);
  let saveTimer,financeSaveTimer;

  function readStorage(key,fallback){
    try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}
  }
  function normalizeNoticeFinance(target){
    if(!Array.isArray(target.pricing)||!target.pricing.length){
      target.pricing=String(target.projectName||"").includes("월계 중흥")?clone(DEFAULT_NOTICE.pricing):(target.sizes||[]).map(row=>({size:row.name,min:0,max:0,options:[]}));
    }
    if(!Array.isArray(target.payments)||!target.payments.length){
      target.payments=String(target.projectName||"").includes("월계 중흥")?clone(DEFAULT_NOTICE.payments):[];
    }
    target.pricing=target.pricing.map(row=>({...row,options:Array.isArray(row.options)?row.options.map(value=>num(value)).filter(Boolean):[],details:Array.isArray(row.details)?row.details.map(detail=>({price:num(detail.price),paymentAmounts:Array.isArray(detail.paymentAmounts)?detail.paymentAmounts.map(value=>num(value)).filter(Boolean):[]})).filter(detail=>detail.price):[]}));
    target.payments=target.payments.map((row,index)=>({...row,slot:Number.isInteger(Number(row.slot))?Number(row.slot):index}));
    target.paymentConfidence=num(target.paymentConfidence);
    return target;
  }
  function toast(message){
    $("toast").textContent=message;$("toast").classList.add("show");
    clearTimeout(toast.timer);toast.timer=setTimeout(()=>$("toast").classList.remove("show"),2200);
  }
  function setPanel(id){
    document.querySelectorAll(".panel,.step").forEach(el=>el.classList.remove("active"));
    $(id).classList.add("active");
    document.querySelector(`.step[data-panel="${id}"]`).classList.add("active");
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function setupDateInputs(){
    document.querySelectorAll(".manual-date").forEach(input=>{
      if(input.closest(".date-control"))return;
      const wrapper=document.createElement("span");wrapper.className="date-control";
      input.parentNode.insertBefore(wrapper,input);wrapper.appendChild(input);
      const picker=document.createElement("input");picker.type="date";picker.className="native-date-picker";picker.tabIndex=-1;picker.setAttribute("aria-hidden","true");
      const button=document.createElement("button");button.type="button";button.className="calendar-button";button.setAttribute("aria-label","달력에서 날짜 선택");button.textContent="달력";
      wrapper.appendChild(button);wrapper.appendChild(picker);
      const syncTyped=()=>{const value=R.normalizeDate(input.value);input.setAttribute("aria-invalid",input.value&&!value?"true":"false");if(value)picker.value=value;return value};
      input.addEventListener("input",syncTyped);
      input.addEventListener("blur",()=>{const value=syncTyped();if(value){input.value=value;input.dispatchEvent(new Event("input",{bubbles:true}))}});
      picker.addEventListener("change",()=>{input.value=picker.value;input.setAttribute("aria-invalid","false");input.dispatchEvent(new Event("input",{bubbles:true}));input.dispatchEvent(new Event("change",{bubbles:true}))});
      button.addEventListener("click",()=>{if(typeof picker.showPicker==="function")picker.showPicker();else picker.click()});
    });
  }

  function selectedProfileType(){return document.querySelector('input[name="profileType"]:checked')?.value||"single";}
  function saveProfile(){
    const data={profileType:selectedProfileType()};
    PROFILE_IDS.forEach(id=>{const el=$(id);if(el)data[id]=CHECK_IDS.has(id)?el.checked:el.value});
    localStorage.setItem(PROFILE_KEY,JSON.stringify(data));
    $("profileSaveState").textContent="저장됨 · "+new Date().toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"});
  }
  function queueProfileSave(){
    $("profileSaveState").textContent="저장 중…";
    clearTimeout(saveTimer);saveTimer=setTimeout(saveProfile,250);
  }
  function loadProfile(){
    const data=readStorage(PROFILE_KEY,{});
    if(!data.profileType&&data.marriageDate)data.profileType="married";
    if(data.pregnant&&data.fetuses===undefined)data.fetuses="1";
    Object.entries(data).forEach(([id,value])=>{
      if(id==="profileType"){
        const radio=document.querySelector(`input[name="profileType"][value="${value}"]`);
        if(radio)radio.checked=true;
        return;
      }
      const el=$(id);if(!el)return;
      CHECK_IDS.has(id)?el.checked=Boolean(value):el.value=value;
    });
  }
  function profileData(){
    const v=id=>$(id).value;
    const d=id=>R.normalizeDate($(id).value);
    const c=id=>$(id).checked;
    const person=key=>({
      account:d(key+"Account"),monthlyIncome:num(v(key+"MonthlyIncome")),birth:d(key+"Birth"),otherDependents:num(v(key+"OtherDependents")),
      head:c(key+"Head"),deposit:c(key+"Deposit"),tax5:c(key+"Tax5"),elder3:c(key+"Elder3"),elderNoHome:c(key+"ElderNoHome"),agency:c(key+"Agency"),
      threeGeneration:c(key+"ThreeGeneration"),singleParent5:c(key+"SingleParent5")
    });
    const partial={
      profileType:selectedProfileType(),singleHouseholdKind:v("singleHouseholdKind"),unmarriedChildRegistered:c("unmarriedChildRegistered"),residenceRegion:v("residenceRegion"),residenceStart:d("residenceStart"),lastHomeDisposal:d("lastHomeDisposal"),
      noHome:c("noHome"),neverHome:c("neverHome"),specialClean:c("specialClean"),reWinClean:c("reWinClean"),
      marriageDate:d("marriageDate"),children:num(v("children")),fetuses:num(v("fetuses")),marriageChildren:num(v("marriageChildren")),infants:num(v("infants")),
      youngestBirth:d("youngestBirth"),assetOk:c("assetOk"),householdSize:num(v("householdSize")),people:{a:person("a"),b:person("b")}
    };
    if(v("householdSizeAuto")==="yes")partial.householdSize=R.automaticHouseholdSize(partial);
    return partial;
  }
  function formatWon(value){return Math.round(num(value)).toLocaleString("ko-KR")+"원";}
  function formatWonShort(value){const amount=Math.round(num(value));if(Math.abs(amount)>=100000000)return (amount/100000000).toLocaleString("ko-KR",{maximumFractionDigits:2})+"억원";if(Math.abs(amount)>=10000)return (amount/10000).toLocaleString("ko-KR",{maximumFractionDigits:0})+"만원";return formatWon(amount);}
  function renderProfileSummary(){
    const profile=profileData();
    const summary=R.profileSummary(profile,notice.noticeDate);
    const income=R.incomeMetrics(profile);
    const married=summary.legalSpouse;
    const onePerson=!married&&summary.specialChildren===0;
    $("marriageDateField").classList.toggle("is-hidden",!married);
    $("lastHomeDisposalField").classList.toggle("is-hidden",profile.neverHome);
    $("singleHouseholdKindField").classList.toggle("is-hidden",!onePerson);
    $("unmarriedChildRegisteredField").classList.toggle("is-hidden",married||summary.specialChildren===0);
    $("personBCard").classList.toggle("is-hidden",!married);
    $("bIncomeField").classList.toggle("is-hidden",!married);
    $("bothApplyField").classList.toggle("is-hidden",!married);
    $("personBTitle").textContent=married?"배우자 B":"신청자 B";
    if(!married)$("bothApply").checked=false;
    if($("householdSizeAuto").value==="yes")$("householdSize").value=summary.automaticHouseholdSize;
    $("householdSize").disabled=$("householdSizeAuto").value==="yes";
    $("derivedProfileBadge").textContent=summary.label;
    const notes={
      single:$("singleHouseholdKind").value==="solo"?"민영 생애최초는 1인 가구 추첨공급만 가능하며 단독세대는 전용 60㎡ 이하로 제한됩니다.":"미혼·무자녀 비단독세대는 생애최초 1인 가구 추첨공급을 검토합니다.",
      single_parent:"법적 배우자는 없지만 미혼 자녀 요건에 따라 생애최초 일반유형을 검토합니다.",
      engaged:"혼인신고 전에는 민영 신혼부부 특공의 배우자로 보지 않습니다. 현재 화면은 신청자 A 단독 기준입니다.",
      married:summary.marriageYears===null?"혼인신고일을 넣으면 신혼부부 7년 요건을 자동 판정합니다.":summary.marriageYears<=7?"공고일 기준 혼인 7년 이내로 신혼부부 특공을 검토합니다.":"공고일 기준 혼인 7년을 초과해 신혼부부 특공 대상에서 제외합니다.",
      former:"현재 법적 배우자가 없는 신청자 A 단독 기준으로 계산합니다."
    };
    $("profileTypeNote").textContent=notes[summary.type];
    $("childCountSummary").innerHTML=`<div><b>${summary.specialChildren}명</b><span>특공 자녀 수<br><small>출생 ${profile.children} + 태아 ${profile.fetuses}</small></span></div><div><b>${summary.generalChildren}명</b><span>일반공급 자녀 수<br><small>주민등록된 출생자녀 기준</small></span></div><div><b>${summary.automaticHouseholdSize}명</b><span>소득 가구원 자동값<br><small>태아 포함</small></span></div>`;
    const incomeBand=income.total<=income.thresholds[100]?"100% 이하":income.total<=income.thresholds[120]?"100~120%":income.total<=income.thresholds[130]?"120~130%":income.total<=income.thresholds[140]?"130~140%":income.total<=income.thresholds[160]?"140~160%":"160% 초과";
    $("incomeSummary").innerHTML=`<div><span>가구 합산 월소득</span><b>${formatWon(income.total)}</b><small>A ${formatWon(income.aIncome)}${married?` · B ${formatWon(income.bIncome)}`:""}</small></div><div><span>100% 기준액</span><b>${formatWon(income.base)}</b><small>${income.size}인 가구 · 2025 기준</small></div><div class="income-percent"><span>도시근로자 소득비율</span><b>${income.pct.toFixed(1)}%</b><small>${income.dualIncome?"맞벌이":"외벌이·단독소득"}</small></div><div><span>자동 구간</span><b>${incomeBand}</b><small>공고문 원단위 상한으로 판정</small></div><div class="income-thresholds"><span>${income.size}인 가구 월소득 상한</span><b>100% ${formatWon(income.thresholds[100])} · 120% ${formatWon(income.thresholds[120])} · 130% ${formatWon(income.thresholds[130])} · 140% ${formatWon(income.thresholds[140])} · 160% ${formatWon(income.thresholds[160])}</b></div>`;
    ["a","b"].forEach(key=>{
      const general=R.generalScore(key,profile,notice),multi=R.multiScore(key,profile,notice);
      $(key+"GeneralScore").textContent=`${general.points}점`;
      $(key+"GeneralBreakdown").textContent=`무주택 ${general.noHomePoints} + 부양가족 ${general.dependentPoints} + 통장 ${general.accountPoints}${general.complete?"":` · 입력 필요: ${general.missing.join(", ")}`}`;
      $(key+"MultiScore").textContent=`${multi.points}점`;
      $(key+"MultiBreakdown").textContent=`자녀 ${multi.childPoints} + 영유아 ${multi.infantPoints} + 세대 ${multi.householdPoints} + 무주택 ${multi.noHomePoints} + 거주 ${multi.residencePoints} + 통장 ${multi.accountPoints}${multi.complete?"":` · 입력 필요: ${multi.missing.join(", ")}`}`;
    });
  }

  function refreshLibrary(){
    $("noticeLibrary").innerHTML=Object.values(notices).sort((a,b)=>String(b.noticeDate).localeCompare(String(a.noticeDate))).map(n=>`<option value="${esc(n.id)}"${n.id===notice.id?" selected":""}>${esc(n.projectName||"이름 없는 공고")} · ${esc(n.noticeDate||"날짜 없음")}</option>`).join("");
  }
  function saveCurrentNotice(showToast=true){
    if(!notice.id)notice.id="notice-"+Date.now();
    notices[notice.id]=clone(notice);
    localStorage.setItem(NOTICES_KEY,JSON.stringify(notices));
    localStorage.setItem(ACTIVE_KEY,notice.id);
    activeId=notice.id;
    refreshLibrary();
    if(showToast)toast("현재 모집공고를 이 기기에 저장했습니다.");
  }
  function markUnverified(){
    notice.verified=false;
    $("verifiedBadge").className="badge warn";
    $("verifiedBadge").textContent="검수 필요";
  }
  function renderNotice(){
    NOTICE_FIELDS.forEach(id=>{$(id).value=notice[id]??""});
    $("pointRateSmall").value=notice.pointRates?.small??40;
    $("pointRateMedium").value=notice.pointRates?.medium??70;
    $("pointRateLarge").value=notice.pointRates?.large??80;
    renderSupplyRows();
    renderPaymentNotice();
    renderFinanceControls();
    $("verifiedBadge").className="badge "+(notice.verified?"ok":"warn");
    $("verifiedBadge").textContent=notice.verified?"검수 완료":"검수 필요";
    refreshLibrary();
    if($("incomeSummary"))renderProfileSummary();
  }
  function renderSupplyRows(){
    $("supplyRows").innerHTML=notice.sizes.map((row,index)=>`<tr data-index="${index}">
      <td><input class="name" data-field="name" value="${esc(row.name)}"></td>
      <td class="num-cell"><input data-field="area" type="number" min="0" step=".0001" value="${num(row.area)}"></td>
      <td class="num-cell"><input data-field="total" type="number" min="0" value="${num(row.total)}"></td>
      ${["agency","multi","newly","elder","first","baby","general"].map(field=>`<td class="num-cell"><input data-field="${field}" type="number" min="0" value="${num(row[field])}"></td>`).join("")}
      <td><button class="icon-delete" data-delete="${index}" aria-label="${esc(row.name)} 삭제">×</button></td>
    </tr>`).join("");
    renderSupplyTotal();
  }
  function renderSupplyTotal(){
    const keys=["total","agency","multi","newly","elder","first","baby","general"];
    $("supplyTotal").innerHTML=`<tr><td>합계</td><td></td>${keys.map(key=>`<td class="num-cell">${sum(notice.sizes,key)}</td>`).join("")}<td></td></tr>`;
  }
  function renderPaymentNotice(){
    normalizeNoticeFinance(notice);
    $("priceRows").innerHTML=notice.pricing.length?notice.pricing.map((row,index)=>`<tr data-price-index="${index}"><td><b>${esc(row.size)}</b></td><td class="num-cell"><input data-price-field="min" type="number" min="0" step="1000000" value="${num(row.min)}"></td><td class="num-cell"><input data-price-field="max" type="number" min="0" step="1000000" value="${num(row.max)}"></td><td class="num-cell">${Array.isArray(row.options)?row.options.length:0}개</td></tr>`).join(""):`<tr><td colspan="4" class="muted">분양가를 찾지 못했습니다. 공고문에서 직접 확인해 주세요.</td></tr>`;
    $("paymentRows").innerHTML=notice.payments.length?notice.payments.map((row,index)=>`<tr data-payment-index="${index}">
      <td><select data-payment-field="kind"><option value="contract"${row.kind==="contract"?" selected":""}>계약금</option><option value="interim"${row.kind==="interim"?" selected":""}>중도금</option><option value="balance"${row.kind==="balance"?" selected":""}>잔금</option><option value="other"${row.kind==="other"?" selected":""}>기타</option></select></td>
      <td><input data-payment-field="label" value="${esc(row.label)}"></td>
      <td class="num-cell"><input data-payment-field="rate" type="number" min="0" max="100" step=".1" value="${num(row.rate)}"></td>
      <td><input data-payment-field="dueDate" type="text" class="manual-date" inputmode="numeric" placeholder="YYYY.MM.DD" value="${esc(row.dueDate||"")}" autocomplete="off"></td>
      <td><input data-payment-field="dueLabel" value="${esc(row.dueLabel||"")}" placeholder="계약 시·입주 지정일"></td>
      <td><button class="icon-delete" data-payment-delete="${index}" aria-label="${esc(row.label)} 삭제">×</button></td></tr>`).join(""):`<tr><td colspan="6" class="muted">납부일정을 찾지 못했습니다. 회차를 직접 추가해 주세요.</td></tr>`;
    const total=notice.payments.reduce((value,row)=>value+num(row.rate),0);
    $("paymentTotal").innerHTML=`<tr><td colspan="2">합계</td><td class="num-cell">${total.toFixed(1)}%</td><td colspan="3">${Math.abs(total-100)<.01?"분양대금 100%":"비율 합계 확인 필요"}</td></tr>`;
    const ready=notice.pricing.some(row=>num(row.max)>0)&&notice.payments.length>0&&Math.abs(total-100)<.01;
    $("paymentExtractBadge").className="badge "+(ready?"ok":"warn");
    $("paymentExtractBadge").textContent=ready?(notice.verified?"검수 완료":"추출 완료"):"직접 입력 필요";
    setupDateInputs();
  }
  function syncNoticeMeta(){
    NOTICE_FIELDS.forEach(id=>notice[id]=["priorityYears","specialMonths","generalMonths"].includes(id)?num($(id).value):id==="noticeDate"?R.normalizeDate($(id).value):$(id).value);
    notice.pointRates={small:num($("pointRateSmall").value),medium:num($("pointRateMedium").value),large:num($("pointRateLarge").value)};
    markUnverified();
    renderProfileSummary();
  }

  function joinPdfItems(items){
    items.sort((a,b)=>a.x-b.x);
    let output="",end=null;
    items.forEach(item=>{
      const gap=end===null?Infinity:item.x-end;
      if(output&&gap>1.5)output+=" ";
      output+=item.text;
      end=item.x+num(item.width);
    });
    return output.replace(/\s+/g," ").trim();
  }

  async function extractPdf(file){
    $("parseStatus").textContent="PDF 분석 도구를 불러오는 중…";
    const pdfjs=await import("https://cdn.jsdelivr.net/npm/pdfjs-dist@5.7.284/build/pdf.min.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc="https://cdn.jsdelivr.net/npm/pdfjs-dist@5.7.284/build/pdf.worker.min.mjs";
    const pdf=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
    const pages=Math.min(pdf.numPages,25),lines=[];
    for(let pageNo=1;pageNo<=pages;pageNo++){
      $("parseStatus").textContent=`PDF ${pageNo}/${pages}쪽에서 공급표·분양가·납부일정을 찾는 중…`;
      const page=await pdf.getPage(pageNo),viewport=page.getViewport({scale:1}),content=await page.getTextContent(),groups=[];
      content.items.filter(item=>item.str?.trim()).forEach(item=>{
        const transformed=pdfjs.Util.transform(viewport.transform,item.transform);
        const y=Math.round(transformed[5]*2)/2;
        let group=groups.find(current=>Math.abs(current.y-y)<=1.5);
        if(!group){group={y,items:[]};groups.push(group)}
        group.items.push({x:transformed[4],width:item.width,text:item.str.trim()});
      });
      groups.sort((a,b)=>a.y-b.y).forEach(group=>{
        const line=joinPdfItems(group.items);
        if(line)lines.push(line);
      });
    }
    return {lines,pages,totalPages:pdf.numPages};
  }
  function parseAnnouncement(lines,fileName){
    const text=lines.join("\n");
    const projectLine=lines.find(line=>/입주자\s*모집공고/.test(line)&&line.length<90&&!/최초|현재|공고일/.test(line));
    const projectName=(projectLine||fileName.replace(/\.pdf$/i,"")).replace(/\s*입주자\s*모집공고.*$/,"").trim();
    const dateContext=text.match(/입주자\s*모집공고일[\s\S]{0,260}?(20\d{2})[.\-/년]\s*(\d{1,2})[.\-/월]\s*(\d{1,2})/);
    const anyDate=text.match(/(20\d{2})[.\-/년]\s*(\d{1,2})[.\-/월]\s*(\d{1,2})/);
    const dm=dateContext||anyDate;
    const date=dm?`${dm[1]}-${String(dm[2]).padStart(2,"0")}-${String(dm[3]).padStart(2,"0")}`:"";
    const locationLine=lines.find(line=>/공급위치\s*:/.test(line));
    const location=locationLine?locationLine.replace(/^.*공급위치\s*:\s*/,"").split(/\s{2,}|\(/)[0].trim():"";
    let priorityRegion="";
    if(/서울특별시\s*\d+년\s*이상/.test(text))priorityRegion="서울특별시";
    else if(/인천광역시\s*\d+년\s*이상/.test(text))priorityRegion="인천광역시";
    else if(/경기도\s*\d+년\s*이상/.test(text))priorityRegion="경기도";
    const yearMatch=text.match(new RegExp((priorityRegion||"해당지역").replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"\\s*(\\d+)년\\s*이상"));
    const sizes=R.parseSupplyRows(lines);
    const oldByName=new Map(notice.sizes.map(row=>[row.name,row]));
    const merged=sizes.map(row=>oldByName.has(row.name)?{...oldByName.get(row.name),...row}:row);
    if(projectName.includes("월계 중흥")&&!merged.some(row=>row.name==="84A"))merged.push(clone(DEFAULT_NOTICE.sizes.find(row=>row.name==="84A")));
    const isPrivate=/민영/.test(text)||/민간택지/.test(text);
    const overheated=/투기과열지구/.test(text);
    const adjusted=/청약과열지역/.test(text);
    const rates=isPrivate?{small:40,medium:70,large:overheated?80:adjusted?50:0}:{small:0,medium:0,large:0};
    const paymentData=R.parsePaymentData(lines,merged);
    const wolgye=projectName.includes("월계 중흥");
    const pricing=paymentData.pricing.length?paymentData.pricing:wolgye?clone(DEFAULT_NOTICE.pricing):merged.map(row=>({size:row.name,min:0,max:0,options:[]}));
    const payments=paymentData.payments.length?paymentData.payments:wolgye?clone(DEFAULT_NOTICE.payments):[];
    const moveInMatch=text.match(/입주시기\s*:\s*(20\d{2})년\s*(\d{1,2})월/);
    const expectedMoveInDate=moveInMatch?`${moveInMatch[1]}-${String(moveInMatch[2]).padStart(2,"0")}-01`:wolgye?DEFAULT_NOTICE.expectedMoveInDate:"";
    return {
      id:"notice-"+Date.now(),projectName:projectName||"이름 없는 공고",noticeDate:date,location,
      housingType:isPrivate?"private":/국민주택|공공주택/.test(text)?"public":"unsupported",
      priorityRegion,priorityYears:yearMatch?num(yearMatch[1]):0,specialMonths:/6개월\s*(?:이상|경과)/.test(text)?6:6,
      generalMonths:/24개월\s*(?:이상|경과)/.test(text)?24:12,generalHeadRequired:overheated||adjusted?"yes":"no",pointRates:rates,verified:false,
      sourceFile:fileName,parseConfidence:sizes.length?Math.min(95,55+sizes.length*10):20,sizes:merged,
      pricing,payments,paymentConfidence:paymentData.confidence,expectedContractDate:wolgye?DEFAULT_NOTICE.expectedContractDate:"",expectedMoveInDate,expectedMoveInLabel:moveInMatch?`${moveInMatch[1]}년 ${String(moveInMatch[2]).padStart(2,"0")}월 예정`:wolgye?DEFAULT_NOTICE.expectedMoveInLabel:""
    };
  }

  function exportNotice(){
    const blob=new Blob([JSON.stringify(notice,null,2)],{type:"application/json"});
    const link=document.createElement("a");
    link.href=URL.createObjectURL(blob);
    link.download=(notice.projectName||"청약공고").replace(/[\\/:*?"<>|]/g,"_")+".json";
    link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);
  }

  function residencePriority(profile){
    const regionMatch=notice.priorityRegion&&profile.residenceRegion.includes(notice.priorityRegion.replace(/특별시|광역시|도$/,""));
    return Boolean(regionMatch&&R.yearsBetween(profile.residenceStart,notice.noticeDate)>=num(notice.priorityYears));
  }
  function generalSeatRows(){
    return notice.sizes.map(size=>({...size,...R.generalAllocation(size.general,size.area,notice.pointRates)}));
  }
  function specialSeatRows(){
    const rows=[];
    notice.sizes.forEach(size=>["newly","first","baby"].forEach(type=>{
      if(num(size[type])>0)rows.push({...R.specialAllocation(size[type]),size:size.name,area:size.area,type});
    }));
    return rows;
  }
  function renderGeneralSeats(){
    const rows=generalSeatRows();
    $("generalSeats").innerHTML=`<table><thead><tr><th>주택형</th><th>실제 전용</th><th>일반공급</th><th>가점 비율</th><th>가점 물량</th><th>추첨 물량</th><th>추첨 중 무주택 우선</th><th>잔여 추첨</th></tr></thead><tbody>${rows.map(row=>`<tr>
      <td><b>${esc(row.name)}</b></td><td class="num-cell">${row.area.toFixed(4)}㎡</td><td class="num-cell">${row.total}</td><td class="num-cell">${row.pointRate}%</td>
      <td class="num-cell"><span class="tag">${row.point}</span></td><td class="num-cell"><span class="tag lottery">${row.lottery}</span></td>
      <td class="num-cell">${row.noHomePriority}</td><td class="num-cell">${row.lotteryRemainder}</td></tr>`).join("")}</tbody>
      <tfoot><tr><td>합계</td><td></td><td class="num-cell">${sum(rows,"total")}</td><td></td><td class="num-cell">${sum(rows,"point")}</td><td class="num-cell">${sum(rows,"lottery")}</td><td class="num-cell">${sum(rows,"noHomePriority")}</td><td class="num-cell">${sum(rows,"lotteryRemainder")}</td></tr></tfoot></table>`;
  }
  function stageApplicants(profile,type,stage,value){
    if(num(value)<=0)return [];
    const people=R.hasSecondApplicant(profile)?["a","b"]:["a"];
    return people.filter(key=>{
      const item=R.eligibility(key,profile,notice)[type];
      return item.ok&&item.band?.stage>=1&&item.band.stage<=stage;
    });
  }
  function stageCell(value,type,stage,profile){
    const applicants=stageApplicants(profile,type,stage,value);
    const active=applicants.length>0;
    return `<td class="num-cell stage-cell ${active?"stage-active":"stage-inactive"}">${active?`<span class="stage-checks">${applicants.map(key=>`<i class="${key==="b"?"person-b":""}" title="${key==="a"?"신청자 A":"배우자 B"} 진입 가능" aria-label="${key==="a"?"신청자 A":"배우자 B"} 진입 가능">✓</i>`).join("")}</span>`:""}<span class="tag ${stage===3?"lottery":""}">${value}</span></td>`;
  }
  function renderSpecialSeats(profile){
    const rows=specialSeatRows();
    const people=R.hasSecondApplicant(profile)?["a","b"]:["a"];
    const summaries=[];
    ["newly","first","baby"].forEach(type=>people.forEach(key=>{
      const item=R.eligibility(key,profile,notice)[type];
      const hasVolume=item.ok&&item.band?.stage&&rows.some(row=>row.type===type&&R.availableSpecialStages(item.band.stage,row).length);
      if(hasVolume)summaries.push(`<span><i class="stage-legend-check ${key==="b"?"person-b":""}">✓</i>${key.toUpperCase()} · ${R.TYPE_LABELS[type]}: 실제 물량 있는 ${item.band.stage}단계 이후 진입</span>`);
    }));
    $("specialSeats").innerHTML=rows.length?`${summaries.length?`<div class="stage-summary">${summaries.join("")}</div>`:"<div class='stage-summary'><span>현재 입력으로 진입 가능한 소득단계가 없습니다.</span></div>"}<table><thead><tr><th>주택형</th><th>유형</th><th>유형 물량</th><th>1단계 우선 50%</th><th>2단계 일반 20%</th><th>3단계 추첨</th><th>해석</th></tr></thead><tbody>${rows.map(row=>`<tr>
      <td><b>${esc(row.size)}</b></td><td>${R.TYPE_LABELS[row.type]}</td><td class="num-cell">${row.total}</td>
      ${stageCell(row.stage1,row.type,1,profile)}${stageCell(row.stage2,row.type,2,profile)}${stageCell(row.stage3,row.type,3,profile)}
      <td class="muted">${row.stage3?`올림 후 추첨 ${row.stage3}세대`:"소수점 올림으로 3단계 기본물량 없음"}</td></tr>`).join("")}</tbody>
      <tfoot><tr><td>합계</td><td></td><td class="num-cell">${sum(rows,"total")}</td><td class="num-cell">${sum(rows,"stage1")}</td><td class="num-cell">${sum(rows,"stage2")}</td><td class="num-cell">${sum(rows,"stage3")}</td><td>미달 물량은 다음 단계 이월</td></tr></tfoot></table>`:"<p class='muted'>단계형 특별공급 물량이 없습니다.</p>";
  }
  function candidateRows(personKey,profile){
    const personLabel=personKey==="a"?"신청자 A":"배우자 B";
    const e=R.eligibility(personKey,profile,notice);
    const generalScore=R.generalScore(personKey,profile,notice);
    const multiScore=R.multiScore(personKey,profile,notice);
    const priority=residencePriority(profile);
    const mode=$("mode").value,minArea=num($("minArea").value);
    const rows=[];
    notice.sizes.forEach(size=>{
      if(num(size.area)<minArea)return;
      Object.keys(R.TYPE_LABELS).forEach(type=>{
        const supply=num(size[type]);
        if(!supply||!e[type]?.ok)return;
        if(type==="first"&&e.first.singleHouseholdAreaLimited&&num(size.area)>60)return;
        let seats=supply,seatText=`${supply}세대`,score=25+Math.log2(supply+1)*12+(priority?12:0);
        const reasons=[`배정 ${supply}세대`,priority?"해당지역 우선":"기타지역 경쟁"];
        if(["newly","first","baby"].includes(type)){
          const alloc=R.specialAllocation(supply);
          const stage=e[type].band.stage;
          const availableStages=R.availableSpecialStages(stage,alloc);
          seats=availableStages.reduce((total,current)=>total+alloc[`stage${current}`],0);
          if(!seats)return;
          seatText=`${e[type].band.label} · 진입가능 ${seats}세대`;
          score+=stage===1?16:stage===2?8:0;
          reasons.push(e[type].band.label,`${availableStages.join("·")}단계 실제 물량 ${seats}세대`);
          if(type==="newly"){score+=e.newly.newlyRank===1?10:-6;reasons.push(`신혼부부 ${e.newly.newlyRank}순위`);}
        }
        if(type==="general"){
          const alloc=R.generalAllocation(supply,size.area,notice.pointRates);
          seatText=`가점 ${alloc.point} + 추첨 ${alloc.lottery}`;
          score+=(generalScore.points-45)*.45+alloc.lottery*1.4;
          reasons.push(`가점 ${generalScore.points}점${generalScore.complete?"":"(일부 입력 필요)"}`,seatText);
        }
        if(type==="multi"){score+=(multiScore.points-50)*.4;reasons.push(`다자녀 ${multiScore.points}점${multiScore.complete?"":"(일부 입력 필요)"}`)}
        if(mode==="probability"){score-=num(size.area)*.04;reasons.push("당첨기회 우선: 작은 면적에 상대 가중치");}
        if(mode==="quality"){score+=num(size.area)*.22;reasons.push("주거품질 우선: 넓은 면적에 상대 가중치");}
        if(mode==="balance"){score+=Math.min(85,num(size.area))*.08;reasons.push("균형형: 물량과 면적을 함께 반영");}
        rows.push({personKey,personLabel,type,size:size.name,area:size.area,supply,seats,seatText,reasons,score:Math.max(1,Math.min(99,score))});
      });
    });
    return rows.sort((a,b)=>b.score-a.score);
  }

  function pickPlan(rows,avoidSize){
    const specials=rows.filter(row=>row.type!=="general");
    const generals=rows.filter(row=>row.type==="general");
    const choose=list=>{
      if(!$("diversify").checked||!avoidSize)return list[0]||null;
      return list.find(row=>row.size!==avoidSize&&row.score>=((list[0]?.score||0)-9))||list[0]||null;
    };
    let special=choose(specials),general=choose(generals);
    if(!$("allowSpecialGeneral").checked){
      const best=[special,general].filter(Boolean).sort((a,b)=>b.score-a.score)[0]||null;
      special=best?.type==="general"?null:best;general=best?.type==="general"?best:null;
    }
    return {special,general};
  }
  function appLine(label,row){
    return `<div class="application"><div><small>${label}</small><br>${row?esc(R.TYPE_LABELS[row.type]):"미신청"}${row?`<span class="strategy-reason">근거 · ${esc(row.reasons.join(" · "))}</span>`:""}</div><b>${row?`${esc(row.size)}<br><small>${esc(row.seatText)} · 전략지수 ${row.score.toFixed(1)}</small>`:"—"}</b></div>`;
  }
  function renderRecommendation(aRows,bRows,profile){
    const a=pickPlan(aRows);
    const useB=R.hasSecondApplicant(profile)&&$("bothApply").checked;
    const anchor=a.special?.size||a.general?.size;
    const b=useB?pickPlan(bRows,anchor):{special:null,general:null};
    const top=[a.special,a.general,b.special,b.general].filter(Boolean);
    if(!top.length){$("recommendation").innerHTML="<div class='alert bad'>현재 입력으로 추천 가능한 신청이 없습니다. 자격과 통장기간을 확인하세요.</div>";return}
    $("recommendation").innerHTML=`<div class="recommend-hero">
      <span class="kicker">RECOMMENDED PLAN</span>
      <h3>${esc(notice.projectName)} 신청안</h3>
      <p>같은 신청자의 가능한 조합 중 실제 물량·현재 진입단계·지역우선·자동 배점을 비교해 전략지수가 높은 안을 골랐습니다.</p>
      <div class="recommend-grid ${useB?"":"one"}">
        <div class="recommend-person"><h4>신청자 A</h4>${appLine("특별공급",a.special)}${appLine("일반공급",a.general)}</div>
        ${useB?`<div class="recommend-person"><h4>배우자 B</h4>${appLine("특별공급",b.special)}${appLine("일반공급",b.general)}</div>`:""}
      </div></div>`;
  }
  function renderCandidates(rows){
    $("candidateTable").innerHTML=rows.length?`<table><thead><tr><th>신청자</th><th>주택형·유형</th><th>실제 물량</th><th>전략지수</th></tr></thead><tbody>${rows.slice(0,24).map(row=>`<tr>
      <td>${row.personLabel}</td><td><b>${esc(row.size)} · ${R.TYPE_LABELS[row.type]}</b><br><span class="muted">${esc(row.reasons.slice(1).join(" · "))}</span></td>
      <td class="num-cell">${esc(row.seatText)}</td><td class="num-cell"><span class="seat-main">${row.score.toFixed(1)}</span><div class="bar"><i style="width:${row.score}%"></i></div></td></tr>`).join("")}</tbody></table>`:"<p class='muted'>추천 후보가 없습니다.</p>";
  }
  function renderEligibility(profile){
    const people=R.hasSecondApplicant(profile)?["a","b"]:["a"];
    const types=Object.keys(R.TYPE_LABELS);
    $("eligibilityTable").innerHTML=`<table><thead><tr><th>유형</th>${people.map(key=>`<th>${key==="a"?"신청자 A":"배우자 B"}</th>`).join("")}</tr></thead><tbody>${types.map(type=>`<tr><td><b>${R.TYPE_LABELS[type]}</b></td>${people.map(key=>{
      const item=R.eligibility(key,profile,notice)[type];
      return `<td class="eligibility-cell"><span class="eligibility-mark ${item.ok?"yes":"no"}">${item.ok?"O":"X"}</span><br><span class="muted">${esc(item.reason)}${item.band?.stage?` · ${esc(item.band.label)}`:""}</span></td>`;
    }).join("")}</tr>`).join("")}</tbody></table>`;
  }

  function loadFundingInputs(){
    const data=readStorage(FINANCE_KEY,{});
    FINANCE_IDS.forEach(id=>{if($(id)&&data[id]!==undefined)$(id).value=data[id]});
  }
  function saveFundingInputs(){
    const data={};FINANCE_IDS.forEach(id=>data[id]=$(id)?.value??"");
    localStorage.setItem(FINANCE_KEY,JSON.stringify(data));
  }
  function queueFundingSave(){clearTimeout(financeSaveTimer);financeSaveTimer=setTimeout(saveFundingInputs,200)}
  function renderFinanceControls(resetPrice=false){
    if(!$("planSize"))return;
    normalizeNoticeFinance(notice);
    const rows=notice.pricing.length?notice.pricing:(notice.sizes||[]).map(row=>({size:row.name,min:0,max:0,options:[]}));
    const current=$("planSize").value;
    $("planSize").innerHTML=rows.map(row=>`<option value="${esc(row.size)}">${esc(row.size)} · 최고 ${row.max?formatWonShort(row.max):"가격 확인"}</option>`).join("");
    if(rows.some(row=>row.size===current))$("planSize").value=current;
    const selected=rows.find(row=>row.size===$("planSize").value)||rows[0];
    if(resetPrice||!num($("planPrice").value))$("planPrice").value=num(selected?.max);
    if(!$("contractDate").value&&notice.expectedContractDate)$("contractDate").value=notice.expectedContractDate;
    if(!$("moveInDate").value&&notice.expectedMoveInDate)$("moveInDate").value=notice.expectedMoveInDate;
    setupDateInputs();
  }
  function fundingInput(){
    const now=new Date();
    const today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
    const price=num($("planPrice").value),size=$("planSize").value;
    const pricing=notice.pricing.find(row=>row.size===size);
    const detail=pricing?.details?.find(row=>num(row.price)===price&&Array.isArray(row.paymentAmounts));
    const payments=(notice.payments||[]).map((payment,index)=>{
      const slot=Number.isInteger(Number(payment.slot))?Number(payment.slot):index;
      const fixedAmount=detail?.paymentAmounts?.[slot];
      return fixedAmount===undefined?payment:{...payment,fixedAmount,rate:price?fixedAmount/price*100:num(payment.rate)};
    });
    return {baseDate:today,price,extras:num($("planExtras").value),cashNow:num($("cashNow").value),reserve:num($("cashReserve").value),monthlySaving:num($("monthlySaving").value),contractDate:R.normalizeDate($("contractDate").value),moveInDate:R.normalizeDate($("moveInDate").value),interimLoanRate:num($("interimLoanRate").value),mortgageLtv:num($("mortgageLtv").value),payments};
  }
  function renderFundingPlan(){
    const input=fundingInput();
    if(!input.price||!Array.isArray(input.payments)||!input.payments.length){
      $("financeWarning").innerHTML="<div class='alert bad'>분양가 또는 납부일정이 없습니다. 모집공고 화면에서 자동 추출값을 확인하거나 직접 입력해 주세요.</div>";
      $("fundingSummary").innerHTML="";$("fundingTimeline").innerHTML="";return;
    }
    const plan=R.buildFundingPlan(input);
    const warnings=[];
    if(Math.abs(plan.rateTotal-100)>.01)warnings.push(`납부비율 합계가 ${plan.rateTotal.toFixed(1)}%입니다. 공고문 표와 다시 대조하세요.`);
    if(!input.contractDate)warnings.push("예상 계약일이 없어 계약 시점까지의 저축액을 계산하지 않았습니다.");
    if(!input.moveInDate)warnings.push("예상 입주·잔금일이 없어 잔금 시점까지의 저축액을 계산하지 않았습니다.");
    if(plan.firstShortage)warnings.push(`${plan.firstShortage.dueText} ${plan.firstShortage.label}에서 ${formatWonShort(plan.firstShortage.shortage)}가 부족합니다.`);
    $("financeWarning").innerHTML=warnings.map(message=>`<div class="alert ${plan.firstShortage?"bad":"warn"}">${esc(message)}</div>`).join("");
    $("fundingSummary").innerHTML=`<div><span>총 취득예산</span><b>${formatWonShort(plan.totalCost)}</b><small>분양가 + 입력 부대비용</small></div><div><span>예상 주담대</span><b>${formatWonShort(plan.mortgageTarget)}</b><small>LTV ${plan.mortgageLtv.toFixed(0)}% 가정</small></div><div><span>최대 중도금대출 잔액</span><b>${formatWonShort(plan.peakInterim)}</b><small>입주 시 상환·전환 가정</small></div><div><span>총 자기자금 필요액</span><b>${formatWonShort(plan.totalOwn)}</b><small>비상예비자금 별도</small></div><div class="${plan.worstShortage?"funding-risk":"funding-safe"}"><span>최대 예상 부족액</span><b>${plan.worstShortage?formatWonShort(plan.worstShortage):"부족 없음"}</b><small>월 저축과 납부 후 잔액 기준</small></div>`;
    $("fundingTimeline").innerHTML=`<table><thead><tr><th>예정일</th><th>납부회차</th><th>비율</th><th>납부·정산액</th><th>대출 투입</th><th>내 현금</th><th>납부 후 가용현금</th><th>판정</th></tr></thead><tbody>${plan.rows.map(row=>`<tr class="${row.shortage?"funding-row-short":""}"><td>${esc(row.dueText.replaceAll("-","."))}</td><td><b>${esc(row.label)}</b><br><small class="muted">${esc(row.note)}</small></td><td class="num-cell">${row.rate.toFixed(1)}%</td><td class="num-cell">${formatWon(row.gross)}</td><td class="num-cell">${row.financing?formatWon(row.financing):"-"}</td><td class="num-cell">${formatWon(row.own)}</td><td class="num-cell ${row.cashAfter<0?"money-negative":""}">${formatWon(row.cashAfter)}</td><td class="funding-status"><span class="eligibility-mark ${row.shortage?"no":"yes"}">${row.shortage?"X":"O"}</span>${row.shortage?`<small>${formatWonShort(row.shortage)} 부족</small>`:""}</td></tr>`).join("")}</tbody></table>`;
    queueFundingSave();
  }

  function calculate(){
    renderProfileSummary();saveProfile();
    const profile=profileData();
    const summary=R.profileSummary(profile,notice.noticeDate);
    const warnings=[];
    if(!notice.verified)warnings.push("이 공고의 자동 추출 숫자가 아직 검수되지 않았습니다.");
    if(notice.housingType!=="private")warnings.push("현재 전략 엔진은 민영주택 분양을 우선 지원합니다. 국민·공공주택은 선정규칙 모듈을 별도로 적용해야 합니다.");
    if(summary.type==="engaged")warnings.push("혼인 예정·미신고 상태는 민영 신혼부부 특별공급의 법적 배우자로 인정되지 않아 신청자 A 단독으로 계산했습니다.");
    if(summary.type==="married"&&!profile.marriageDate)warnings.push("혼인신고일이 없어 신혼부부 7년 요건을 판정할 수 없습니다.");
    $("strategyWarning").innerHTML=warnings.map(message=>`<div class="alert warn">${esc(message)}</div>`).join("");
    renderGeneralSeats();renderSpecialSeats(profile);
    const aRows=candidateRows("a",profile),bRows=R.hasSecondApplicant(profile)?candidateRows("b",profile):[];
    renderRecommendation(aRows,bRows,profile);
    renderCandidates([...aRows,...bRows].sort((a,b)=>b.score-a.score));
    renderEligibility(profile);
  }

  document.querySelectorAll(".step").forEach(button=>button.addEventListener("click",()=>setPanel(button.dataset.panel)));
  document.querySelectorAll("[data-go]").forEach(button=>button.addEventListener("click",()=>setPanel(button.dataset.go)));
  function onProfileInput(){renderProfileSummary();queueProfileSave();}
  PROFILE_IDS.forEach(id=>$(id)?.addEventListener("input",onProfileInput));
  document.querySelectorAll('input[name="profileType"]').forEach(input=>input.addEventListener("change",onProfileInput));
  NOTICE_FIELDS.concat(["pointRateSmall","pointRateMedium","pointRateLarge"]).forEach(id=>$(id).addEventListener("input",syncNoticeMeta));

  $("supplyRows").addEventListener("input",event=>{
    const input=event.target.closest("[data-field]");if(!input)return;
    const index=num(input.closest("tr").dataset.index),field=input.dataset.field;
    const previousName=notice.sizes[index].name;
    notice.sizes[index][field]=field==="name"?input.value:num(input.value);
    if(field==="name"){const price=notice.pricing?.find(row=>row.size===previousName);if(price)price.size=input.value}
    markUnverified();renderSupplyTotal();
  });
  $("supplyRows").addEventListener("click",event=>{
    const button=event.target.closest("[data-delete]");if(!button)return;
    const index=num(button.dataset.delete),removed=notice.sizes[index];notice.sizes.splice(index,1);notice.pricing=(notice.pricing||[]).filter(row=>row.size!==removed?.name);markUnverified();renderSupplyRows();renderPaymentNotice();renderFinanceControls(true);
  });
  $("priceRows").addEventListener("input",event=>{
    const input=event.target.closest("[data-price-field]");if(!input)return;
    const index=num(input.closest("tr").dataset.priceIndex),field=input.dataset.priceField;
    notice.pricing[index][field]=num(input.value);notice.pricing[index].details=[];markUnverified();renderFinanceControls();
  });
  $("paymentRows").addEventListener("input",event=>{
    const input=event.target.closest("[data-payment-field]");if(!input)return;
    const index=num(input.closest("tr").dataset.paymentIndex),field=input.dataset.paymentField;
    notice.payments[index][field]=field==="rate"?num(input.value):input.value;notice.pricing.forEach(row=>row.details=[]);
    markUnverified();
    const total=notice.payments.reduce((value,row)=>value+num(row.rate),0);
    $("paymentTotal").innerHTML=`<tr><td colspan="2">합계</td><td class="num-cell">${total.toFixed(1)}%</td><td colspan="3">${Math.abs(total-100)<.01?"분양대금 100%":"비율 합계 확인 필요"}</td></tr>`;
    $("paymentExtractBadge").className="badge warn";$("paymentExtractBadge").textContent="검수 필요";
  });
  $("paymentRows").addEventListener("click",event=>{
    const button=event.target.closest("[data-payment-delete]");if(!button)return;
    notice.payments.splice(num(button.dataset.paymentDelete),1);markUnverified();renderPaymentNotice();renderFundingPlan();
  });
  $("addPayment").addEventListener("click",()=>{notice.payments.push({kind:"other",label:"추가 납부",rate:0,dueDate:"",dueLabel:""});markUnverified();renderPaymentNotice()});
  $("addSize").addEventListener("click",()=>{const name="새 평형";notice.sizes.push({name,area:0,total:0,agency:0,multi:0,newly:0,elder:0,first:0,baby:0,general:0});notice.pricing.push({size:name,min:0,max:0,options:[]});markUnverified();renderSupplyRows();renderPaymentNotice()});
  $("saveNotice").addEventListener("click",()=>saveCurrentNotice());
  $("exportNotice").addEventListener("click",exportNotice);
  $("noticeLibrary").addEventListener("change",event=>{
    saveCurrentNotice(false);notice=clone(notices[event.target.value]);activeId=notice.id;localStorage.setItem(ACTIVE_KEY,activeId);$("planPrice").value="";renderNotice();renderFundingPlan();toast("저장된 공고를 불러왔습니다.");
  });
  $("blankNotice").addEventListener("click",()=>{
    notice={...clone(DEFAULT_NOTICE),id:"notice-"+Date.now(),projectName:"",noticeDate:"",location:"",priorityRegion:"",priorityYears:0,verified:false,sourceFile:"",parseConfidence:0,sizes:[],pricing:[],payments:[],paymentConfidence:0,expectedContractDate:"",expectedMoveInDate:"",expectedMoveInLabel:""};
    $("planPrice").value="";renderNotice();renderFundingPlan();toast("빈 공고를 만들었습니다.");
  });
  $("pdfFile").addEventListener("change",async event=>{
    const file=event.target.files[0];if(!file)return;
    try{
      const extracted=await extractPdf(file);
      notice=parseAnnouncement(extracted.lines,file.name);$("planPrice").value="";
      renderNotice();
      $("parseStatus").textContent=`${extracted.pages}쪽 분석 완료 · 주택형 ${notice.sizes.length}개 · 분양가 ${notice.pricing.filter(row=>num(row.max)>0).length}개 · 납부회차 ${notice.payments.length}개 감지. 모든 숫자를 원문과 대조해 주세요.`;
      toast("PDF 분석 초안을 만들었습니다.");
    }catch(error){
      console.error(error);
      $("parseStatus").textContent="PDF 자동 분석에 실패했습니다. 인터넷 연결을 확인하거나 빈 공고에 숫자를 직접 입력해 주세요.";
    }
  });
  $("jsonFile").addEventListener("change",async event=>{
    const file=event.target.files[0];if(!file)return;
    try{
      const parsed=JSON.parse(await file.text());
      if(!Array.isArray(parsed.sizes))throw new Error("sizes missing");
      notice={...clone(DEFAULT_NOTICE),...parsed,id:parsed.id||"notice-"+Date.now(),verified:false};
      $("planPrice").value="";renderNotice();renderFundingPlan();toast("JSON 공고를 불러왔습니다. 숫자를 검수해 주세요.");
    }catch{toast("올바른 공고 JSON 파일이 아닙니다.")}
  });
  $("confirmNotice").addEventListener("click",()=>{
    syncNoticeMeta();
    const invalid=notice.sizes.some(row=>!row.name||num(row.area)<=0||num(row.total)!==sum([row],"agency")+sum([row],"multi")+sum([row],"newly")+sum([row],"elder")+sum([row],"first")+sum([row],"baby")+sum([row],"general"));
    if(!notice.projectName||!notice.noticeDate||!notice.sizes.length||invalid){toast("단지명·공고일·평형별 총물량을 확인해 주세요.");return}
    notice.verified=true;saveCurrentNotice(false);renderNotice();calculate();setPanel("strategy");toast("검수된 물량으로 전략을 계산했습니다.");
  });
  $("calculate").addEventListener("click",calculate);
  $("planSize").addEventListener("change",()=>{renderFinanceControls(true);renderFundingPlan()});
  FINANCE_IDS.filter(id=>id!=="planSize").forEach(id=>$(id)?.addEventListener("input",()=>{queueFundingSave();renderFundingPlan()}));
  $("calculateFunding").addEventListener("click",renderFundingPlan);

  setupDateInputs();loadProfile();loadFundingInputs();renderNotice();renderProfileSummary();calculate();renderFundingPlan();
})();
