(function(){
  "use strict";
  const R=window.SubscriptionRules;
  const $=id=>document.getElementById(id);
  const clone=value=>JSON.parse(JSON.stringify(value));
  const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const num=(value,fallback=0)=>{const parsed=Number(String(value??"").replace(/,/g,"").trim());return Number.isFinite(parsed)?parsed:fallback};
  const sum=(rows,key)=>rows.reduce((total,row)=>total+num(row[key]),0);
  const PROFILE_KEY="subscription_profile_v3";
  const NOTICES_KEY="subscription_notices_v3";
  const ACTIVE_KEY="subscription_active_notice_v3";
  const FINANCE_KEY="subscription_funding_v3";

  const DEFAULT_NOTICE={
    id:"wolgyesclass-20260716",
    houseManageNo:"2026000355",
    announceDate:"2026-08-05",
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
    options:[
      {id:"opt-wolgye-36-balcony",size:"36",category:"balcony",name:"발코니 확장",price:8000000,paymentAmounts:[800000,800000,6400000]},
      {id:"opt-wolgye-59a-balcony",size:"59A",category:"balcony",name:"발코니 확장",price:17000000,paymentAmounts:[1700000,1700000,13600000]},
      {id:"opt-wolgye-59b-balcony",size:"59B",category:"balcony",name:"발코니 확장",price:17000000,paymentAmounts:[1700000,1700000,13600000]},
      {id:"opt-wolgye-84a-balcony",size:"84A",category:"balcony",name:"발코니 확장",price:22000000,paymentAmounts:[2200000,2200000,17600000]}
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
    expectedContractDate:"2026-08-18",expectedMoveInDate:"2029-05-01",expectedMoveInLabel:"2029년 05월 예정",interimLoanModes:["loan","loan","loan","loan","self","self"],interimLoanSource:"공고문 1~4회차 대출·5~6회차 자납",paymentConfidence:100
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
  const FINANCE_IDS=["planSize","planPrice","planExtras","cashNow","cashReserve","monthlySaving","contractDate","moveInDate","interimInterestRate","interestPaymentMode","collateralValue","annualIncome","existingAnnualDebtService","mortgageLtv","mortgageInterestRate","stressRate","dsrLimit","mortgageYears","policyScope","manualMortgageCap","taxMode","taxManualRate","includeAcquisitionTax"];
  const FINANCE_CHECK_IDS=new Set(["includeAcquisitionTax"]);
  let notices=readStorage(NOTICES_KEY,{});
  if(!Object.keys(notices).length)notices[DEFAULT_NOTICE.id]=clone(DEFAULT_NOTICE);
  let activeId=localStorage.getItem(ACTIVE_KEY)||DEFAULT_NOTICE.id;
  let notice=clone(notices[activeId]||DEFAULT_NOTICE);
  if(notice.id===DEFAULT_NOTICE.id&&!notice.houseManageNo)notice.houseManageNo=DEFAULT_NOTICE.houseManageNo;
  if(notice.id===DEFAULT_NOTICE.id&&!notice.announceDate)notice.announceDate=DEFAULT_NOTICE.announceDate;
  Object.values(notices).forEach(item=>{if(item.id===DEFAULT_NOTICE.id){if(!item.houseManageNo)item.houseManageNo=DEFAULT_NOTICE.houseManageNo;if(!item.announceDate)item.announceDate=DEFAULT_NOTICE.announceDate}});
  let saveTimer,financeSaveTimer;

  function readStorage(key,fallback){
    try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}
  }
  function normalizeNoticeFinance(target){
    if(!Array.isArray(target.pricing)||!target.pricing.length)target.pricing=(target.sizes||[]).map(row=>({size:row.name,min:0,max:0,options:[]}));
    if(!Array.isArray(target.payments))target.payments=[];
    target.pricing=target.pricing.map(row=>({...row,options:Array.isArray(row.options)?row.options.map(value=>num(value)).filter(Boolean):[],details:Array.isArray(row.details)?row.details.map(detail=>({price:num(detail.price),paymentAmounts:Array.isArray(detail.paymentAmounts)?detail.paymentAmounts.map(value=>num(value)).filter(Boolean):[]})).filter(detail=>detail.price):[]}));
    target.options=Array.isArray(target.options)?target.options.map((row,index)=>({id:String(row.id||`option-${index}`),size:String(row.size||""),category:String(row.category||"paid"),name:String(row.name||"유상옵션"),price:num(row.price),paymentAmounts:Array.isArray(row.paymentAmounts)?row.paymentAmounts.map(value=>num(value)).filter(Boolean):[]})).filter(row=>row.size&&row.price):[];
    target.payments=target.payments.map((row,index)=>({...row,slot:Number.isInteger(Number(row.slot))?Number(row.slot):index}));
    if(!Array.isArray(target.interimLoanModes))target.interimLoanModes=target.payments.filter(row=>row.kind==="interim").map(()=>"review");
    target.interimLoanModes=target.interimLoanModes.map(value=>["loan","self","review"].includes(value)?value:"review");
    target.paymentConfidence=num(target.paymentConfidence);
    target.expectations=target.expectations&&typeof target.expectations==="object"&&!Array.isArray(target.expectations)?target.expectations:{};
    target.expectationsSource=["actual","model"].includes(target.expectationsSource)?target.expectationsSource:(target.expectationsActual?"actual":"");
    delete target.expectationsActual;
    return target;
  }
  function expectationSourceLabel(){return notice.expectationsSource==="actual"?"실제":notice.expectationsSource==="model"?"과거데이터":"예상"}
  function sizeExpectation(sizeName){
    const raw=notice.expectations?.[sizeName]||{};
    return {cutline:num(raw.cutline),generalRate:num(raw.generalRate),specialRate:num(raw.specialRate)};
  }
  function renderExpectations(){
    normalizeNoticeFinance(notice);
    if($("applyhomeManageNo"))$("applyhomeManageNo").value=notice.houseManageNo||"";
    const badge=$("expectationSourceBadge");
    if(badge){
      const source=notice.expectationsSource;
      badge.classList.toggle("is-hidden",!source);
      if(source){badge.textContent=source==="actual"?"실제 접수결과 적용됨":"과거 유사단지 추정 적용";badge.className="badge "+(source==="actual"?"ok":"warn")}
      if(source!=="model"&&$("modelNote"))$("modelNote").innerHTML="";
    }
    $("expectationRows").innerHTML=notice.sizes.length?notice.sizes.map(row=>{
      const exp=sizeExpectation(row.name);
      return `<tr data-exp-size="${esc(row.name)}">
      <td><b>${esc(row.name)}</b> <span class="muted">${num(row.area).toFixed(2)}㎡</span></td>
      <td class="num-cell"><input data-exp-field="cutline" type="number" min="0" max="84" step="1" value="${exp.cutline||""}" placeholder="예: 63"></td>
      <td class="num-cell"><input data-exp-field="generalRate" type="number" min="0" step="0.1" value="${exp.generalRate||""}" placeholder="예: 45"></td>
      <td class="num-cell"><input data-exp-field="specialRate" type="number" min="0" step="0.1" value="${exp.specialRate||""}" placeholder="예: 12"></td></tr>`;
    }).join(""):`<tr><td colspan="4" class="muted">먼저 모집공고에서 평형을 입력해 주세요.</td></tr>`;
  }
  function toast(message){
    $("toast").textContent=message;$("toast").classList.add("show");
    clearTimeout(toast.timer);toast.timer=setTimeout(()=>$("toast").classList.remove("show"),2200);
  }
  function setPanel(id){
    document.querySelectorAll(".panel,.step").forEach(el=>el.classList.remove("active"));
    $(id).classList.add("active");
    document.querySelector(`.step[data-panel="${id}"]`)?.classList.add("active");
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function wrapSuffixInputs(){
    document.querySelectorAll("label > .suffix").forEach(suffix=>{
      const input=suffix.previousElementSibling;
      if(!input||!/^(INPUT|SELECT)$/.test(input.tagName)||input.closest(".input-wrap"))return;
      const wrap=document.createElement("span");
      wrap.className="input-wrap";
      input.parentNode.insertBefore(wrap,input);
      wrap.appendChild(input);wrap.appendChild(suffix);
    });
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

  function formatNumberInput(value){
    const amount=Math.round(num(value));
    return amount?amount.toLocaleString("ko-KR"):"0";
  }
  function setupMoneyInputs(root=document){
    root.querySelectorAll(".money-input").forEach(input=>{
      input.value=formatNumberInput(input.value);
      if(input.dataset.moneyBound)return;
      input.dataset.moneyBound="true";
      input.addEventListener("input",()=>{
        const digits=input.value.replace(/\D/g,"");
        input.value=digits?Number(digits).toLocaleString("ko-KR"):"";
      });
      input.addEventListener("focus",()=>{requestAnimationFrame(()=>input.select())});
      input.addEventListener("blur",()=>{input.value=formatNumberInput(input.value)});
    });
  }
  function attachMoneyEcho(){
    ["quickIncomeA","quickIncomeB","quickCash","quickSaving"].forEach(id=>{
      const input=$(id);
      if(!input||input.dataset.echoBound)return;
      input.dataset.echoBound="1";
      const echo=document.createElement("small");
      echo.className="money-echo";
      input.closest("label").appendChild(echo);
      const update=()=>{const value=num(input.value);echo.textContent=value?`= ${formatWonShort(value)}`:""};
      input.addEventListener("input",update);
      input.addEventListener("blur",update);
      update();
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
    renderCompareChoices();
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
    renderExpectations();
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
    $("priceRows").innerHTML=notice.pricing.length?notice.pricing.map((row,index)=>`<tr data-price-index="${index}"><td><b>${esc(row.size)}</b></td><td class="num-cell"><input data-price-field="min" class="money-input" type="text" inputmode="numeric" value="${formatNumberInput(row.min)}"></td><td class="num-cell"><input data-price-field="max" class="money-input" type="text" inputmode="numeric" value="${formatNumberInput(row.max)}"></td><td class="num-cell">${Array.isArray(row.options)?row.options.length:0}개</td></tr>`).join(""):`<tr><td colspan="4" class="muted">분양가를 찾지 못했습니다. 공고문에서 직접 확인해 주세요.</td></tr>`;
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
    setupDateInputs();setupMoneyInputs($("priceRows"));
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

  async function extractPdf(file,statusEl){
    statusEl=statusEl||$("parseStatus");
    statusEl.textContent="PDF 분석 도구를 불러오는 중…";
    const pdfjs=await import("https://cdn.jsdelivr.net/npm/pdfjs-dist@5.7.284/build/pdf.min.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc="https://cdn.jsdelivr.net/npm/pdfjs-dist@5.7.284/build/pdf.worker.min.mjs";
    const pdf=await pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
    const pages=pdf.numPages,lines=[];
    for(let pageNo=1;pageNo<=pages;pageNo++){
      statusEl.textContent=`PDF ${pageNo}/${pages}쪽에서 공급표·분양가·납부일정을 찾는 중…`;
      const page=await pdf.getPage(pageNo),viewport=page.getViewport({scale:1}),content=await page.getTextContent(),groups=[];
      content.items.filter(item=>item.str?.trim()).forEach(item=>{
        const transformed=pdfjs.Util.transform(viewport.transform,item.transform);
        const y=Math.round(transformed[5]*2)/2;
        let group=groups.find(current=>Math.abs(current.y-y)<=1.5);
        if(!group){group={y,items:[]};groups.push(group)}
        group.items.push({x:transformed[4],width:item.width,text:item.str.trim()});
      });
      lines.push(`__PAGE_${pageNo}__`);
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
    const isPrivate=/민영/.test(text)||/민간택지/.test(text);
    const overheated=/투기과열지구/.test(text);
    const adjusted=/청약과열지역/.test(text);
    const rates=isPrivate?(overheated?{small:40,medium:70,large:80}:adjusted?{small:40,medium:70,large:50}:{small:40,medium:40,large:0}):{small:0,medium:0,large:0};
    const paymentData=R.parsePaymentData(lines,sizes);
    const options=R.parseOptionData(lines,sizes);
    const pricing=paymentData.pricing.length?paymentData.pricing:sizes.map(row=>({size:row.name,min:0,max:0,options:[]}));
    const payments=paymentData.payments;
    const interimPlan=R.parseInterimLoanPlan(text,payments);
    const moveInMatch=text.match(/입주시기\s*:\s*(20\d{2})년\s*(\d{1,2})월/);
    const monthReqs=[...text.matchAll(/가입[^0-9]{0,60}?(\d{1,2})\s*개월/g)].map(match=>num(match[1])).filter(value=>[1,3,6,12,24].includes(value));
    const manageRow=text.match(/\b(20\d{8})\b\s+\d{2}\s+0?\d{2,3}\.\d{2,4}/);
    const manageContext=text.match(/주택\s*관리\s*번호[\s\S]{0,2500}?\b(20\d{8})\b/);
    const manageFile=fileName.match(/\b(20\d{8})\b/);
    const announceMatch=text.match(/당첨자\s*발표[^0-9]{0,40}?(20\d{2})[.\-/년\s]*(\d{1,2})[.\-/월\s]*(\d{1,2})/);
    return {
      id:"notice-"+Date.now(),projectName:projectName||"이름 없는 공고",noticeDate:date,location,houseManageNo:manageRow?.[1]||manageContext?.[1]||manageFile?.[1]||"",announceDate:announceMatch?R.normalizeDate(`${announceMatch[1]}-${announceMatch[2]}-${announceMatch[3]}`):"",
      housingType:isPrivate?"private":/국민주택|공공주택/.test(text)?"public":"unsupported",
      priorityRegion,priorityYears:yearMatch?num(yearMatch[1]):0,specialMonths:monthReqs.length?Math.min(...monthReqs):6,
      generalMonths:monthReqs.length?Math.max(...monthReqs):24,generalHeadRequired:overheated||adjusted?"yes":"no",pointRates:rates,verified:false,
      sourceFile:fileName,parseConfidence:sizes.length?Math.min(95,55+sizes.length*10):20,sizes,
      pricing,payments,options,interimLoanModes:interimPlan.modes,interimLoanSource:interimPlan.source,paymentConfidence:paymentData.confidence,expectedContractDate:"",expectedMoveInDate:moveInMatch?`${moveInMatch[1]}-${String(moveInMatch[2]).padStart(2,"0")}-01`:"",expectedMoveInLabel:moveInMatch?`${moveInMatch[1]}년 ${String(moveInMatch[2]).padStart(2,"0")}월 예정`:""
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
        let seats=supply,seatText=`${supply}세대`,score=25+Math.log2(supply+1)*12+(priority?12:0),winChance=null;
        const exp=sizeExpectation(size.name);
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
          if(exp.specialRate>0){winChance=R.specialWinProbability(stage,alloc,exp.specialRate);reasons.push(`특공 ${expectationSourceLabel()} 경쟁률 ${exp.specialRate}:1 기준`);}
        }
        if(["agency","multi","elder"].includes(type)&&exp.specialRate>0){
          winChance=Math.max(0,Math.min(1,1/exp.specialRate));
          reasons.push(`특공 ${expectationSourceLabel()} 경쟁률 ${exp.specialRate}:1 기준`);
        }
        if(type==="general"){
          const alloc=R.generalAllocation(supply,size.area,notice.pointRates);
          seatText=`가점 ${alloc.point} + 추첨 ${alloc.lottery}`;
          score+=(generalScore.points-45)*.45+alloc.lottery*1.4;
          reasons.push(`가점 ${generalScore.points}점${generalScore.complete?"":"(일부 입력 필요)"}`,seatText);
          const gw=R.generalWinProbability(generalScore.points,exp.cutline,alloc,exp.generalRate,profile.noHome);
          const basis=notice.expectationsSource?gw.basis.map(item=>item.replace(/예상/g,expectationSourceLabel())):gw.basis;
          if(gw.p!==null&&gw.p!==undefined){winChance=gw.p;reasons.push(...basis);}
          else if(gw.pPoint===1){score+=30;reasons.push(...basis);}
          else if(gw.pPoint===0){score-=20;reasons.push(...basis);}
        }
        if(type==="multi"){score+=(multiScore.points-50)*.4;reasons.push(`다자녀 ${multiScore.points}점${multiScore.complete?"":"(일부 입력 필요)"}`)}
        if(mode==="probability"){score-=num(size.area)*.04;reasons.push("당첨기회 우선: 작은 면적에 상대 가중치");}
        if(mode==="quality"){score+=num(size.area)*.22;reasons.push("주거품질 우선: 넓은 면적에 상대 가중치");}
        if(mode==="balance"){score+=Math.min(85,num(size.area))*.08;reasons.push("균형형: 물량과 면적을 함께 반영");}
        if(winChance!==null)score=winChance>=1?99:Math.max(1,Math.min(90,winChance*300));
        rows.push({personKey,personLabel,type,size:size.name,area:size.area,supply,seats,seatText,reasons,winChance,score:Math.max(1,Math.min(99,score))});
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
  function chanceLabel(row){
    if(row.winChance===null||row.winChance===undefined)return `전략지수 ${row.score.toFixed(1)}`;
    if(row.winChance>=1)return "가점 당첨권";
    const source=notice.expectationsSource==="actual"?"실제 경쟁률 기반":notice.expectationsSource==="model"?"과거데이터 추정":"추정";
    return `${source} 당첨확률 ${(row.winChance*100).toFixed(row.winChance<.1?1:0)}%`;
  }
  function appLine(label,row){
    return `<div class="application"><div><small>${label}</small><br>${row?esc(R.TYPE_LABELS[row.type]):"미신청"}${row?`<span class="strategy-reason">근거 · ${esc(row.reasons.join(" · "))}</span>`:""}</div><b>${row?`${esc(row.size)}<br><small>${esc(row.seatText)} · ${esc(chanceLabel(row))}</small>`:"—"}</b></div>`;
  }
  function buildPlans(aRows,bRows,profile){
    const a=pickPlan(aRows);
    const useB=R.hasSecondApplicant(profile)&&$("bothApply").checked;
    const anchor=a.special?.size||a.general?.size;
    const b=useB?pickPlan(bRows,anchor):{special:null,general:null};
    return {a,b,useB};
  }
  function renderRecommendation(aRows,bRows,profile){
    const {a,b,useB}=buildPlans(aRows,bRows,profile);
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
    if(!rows.length){$("candidateTable").innerHTML="<p class='muted'>추천 후보가 없습니다.</p>";return;}
    const cards=rows.slice(0,24).map((row,i)=>{
      const hasChance=row.winChance!==null&&row.winChance!==undefined;
      const win=hasChance&&row.winChance>=1;
      const chance=hasChance?(win?"당첨권":(row.winChance*100).toFixed(row.winChance<.1?1:0)+"%"):row.score.toFixed(0);
      const chanceLabel=hasChance?(win?"가점 당첨권":"당첨확률"):"전략지수";
      const personCls=row.personKey==="b"?"pB":"pA";
      return `<div class="cand">
        <div class="cand-head">
          <span class="cand-rank">${i+1}</span>
          <div class="cand-id"><b>${esc(row.size)} · ${R.TYPE_LABELS[row.type]}</b><span class="cand-person ${personCls}">${esc(row.personLabel)}</span></div>
          <div class="cand-chance ${win?"win":""}"><em>${esc(chance)}</em><small>${chanceLabel}</small></div>
        </div>
        <p class="cand-reason">${esc(row.reasons.slice(1).join(" · "))}</p>
        <div class="cand-foot"><span class="cand-seat">실제 물량 <b>${esc(row.seatText)}</b></span><div class="bar"><i style="width:${row.score}%"></i></div></div>
      </div>`;
    }).join("");
    $("candidateTable").innerHTML=`<div class="cand-list">${cards}</div>`;
  }
  function renderEligibility(profile){
    const people=R.hasSecondApplicant(profile)?["a","b"]:["a"];
    const types=Object.keys(R.TYPE_LABELS);
    $("eligibilityTable").innerHTML=`<table><thead><tr><th>유형</th>${people.map(key=>`<th>${key==="a"?"신청자 A":"배우자 B"}</th>`).join("")}</tr></thead><tbody>${types.map(type=>`<tr><td><b>${R.TYPE_LABELS[type]}</b></td>${people.map(key=>{
      const item=R.eligibility(key,profile,notice)[type];
      return `<td class="eligibility-cell"><span class="eligibility-mark ${item.ok?"yes":"no"}">${item.ok?"O":"X"}</span><br><span class="muted">${esc(item.reason)}${item.band?.stage?` · ${esc(item.band.label)}`:""}</span></td>`;
    }).join("")}</tr>`).join("")}</tbody></table>`;
  }

  function renderStrategyTips(profile,rows){
    const tips=[];
    const married=R.hasSecondApplicant(profile);
    const aGeneral=R.generalScore("a",profile,notice);
    const cutlines=notice.sizes.map(size=>sizeExpectation(size.name).cutline).filter(Boolean);
    const anySpecial=rows.some(row=>row.type!=="general");
    const childAge=R.normalizeDate(profile.youngestBirth)&&R.normalizeDate(notice.noticeDate)?R.yearsBetween(profile.youngestBirth,notice.noticeDate):99;
    if(cutlines.length){
      const minCut=Math.min(...cutlines);
      if(aGeneral.points>=minCut)tips.push({stat:`가점 ${aGeneral.points}점`,title:"가점제 1지망 직행",body:`최저 커트라인 ${minCut}점 돌파. 커트라인 낮은 주택형의 가점 물량을 1지망으로 박는 게 정석.`,source:"입력한 커트라인 기준"});
      else tips.push({stat:`커트라인 ${minCut-aGeneral.points}점 부족`,title:"가점 버리고 추첨 우회",body:`가점 ${aGeneral.points}점은 사실상 소진용. 추첨 비중 큰 85㎡ 초과·비선호(저층·향·코너)로 돌리면 실제 확률이 뒤집힌다.`,source:"KB부동산 2026 전략형 청약"});
    }
    if(anySpecial)tips.push({stat:"1인 2건 풀가동",title:"특공 먼저, 칸부터 채워라",body:"특공은 일반보다 경쟁률↓, 떨어져도 다음 단계·일반 추첨으로 자동 승계. 특공+일반 동시신청은 무조건 채운다.",source:"청약Home 제도 안내"});
    if((num(profile.fetuses)>0||childAge<=2))tips.push({stat:"특공 물량 10%",title:"신생아 특공 신설",body:"2026.6.15부터 민영 특공의 10%가 신생아 몫. 혼인 7년 초과로 신혼특공이 막혀도 2세 미만·태아면 신청 가능.",source:"국토부 2026.6 제도개편"});
    if(married)tips.push({stat:"부부 최대 4건",title:"부부는 카드가 4장",body:"각자 특공+일반. 중복당첨되면 접수 빠른 건만 유효 → 첫날 이른 시간 접수, 유형 분산(A 신혼·B 생애최초).",source:"주택공급규칙 §55조의2 · 공고문 확인"});
    tips.push({stat:"소형 최대 20배차",title:"소형 쏠림을 역이용",body:"2026 상반기 1순위 경쟁률 60㎡↓ 14:1 vs 85㎡↑ 3.4:1. 같은 단지 59가 84보다 20배 붐빈 사례도. 자금 되면 중대형이 확률상 유리.",source:"부동산R114·언론 집계 2026.7"});
    tips.push({stat:"예비 500%",title:"낙첨해도 한 사이클 더",body:"수도권 예비당첨은 공급물량의 500%까지. 번호 앞이면 계약포기분, 이어 무순위(줍줍)까지 발표 후 일정을 챙겨라.",source:"청약Home 제도 안내"});
    if(notice.generalHeadRequired==="yes")tips.push({stat:"재당첨 최대 10년",title:"당첨엔 의무가 따라온다",body:"규제지역(세대주 요건) 공고 — 재당첨 제한·전매제한·실거주 의무. 계약 전 해당 조항 필수 확인.",source:"공고문·주택공급규칙"});
    $("strategyTips").innerHTML=tips.length?`<article class="card tips-card"><div class="card-head"><div><span class="kicker">STRATEGY TIPS</span><h3>지금 시장에서 통하는 전략 포인트</h3><p>2026년 상반기 청약 시장 데이터와 제도 개편을 반영한 참고 전략입니다.</p></div></div><div class="tips-grid">${tips.map(tip=>`<div class="tip">${tip.stat?`<span class="tip-stat">${esc(tip.stat)}</span>`:""}<b>${esc(tip.title)}</b><p>${esc(tip.body)}</p><small>근거 · ${esc(tip.source)}</small></div>`).join("")}</div></article>`:"";
  }

  function loadFundingInputs(){
    const data=readStorage(FINANCE_KEY,{});
    FINANCE_IDS.forEach(id=>{
      if(!$(id)||data[id]===undefined)return;
      FINANCE_CHECK_IDS.has(id)?$(id).checked=Boolean(data[id]):$(id).value=data[id];
    });
    if(data.annualIncome===undefined&&$("annualIncome")){const profile=profileData();$("annualIncome").value=formatNumberInput((num(profile.people.a.monthlyIncome)+num(profile.people.b.monthlyIncome))*12)}
    if(data.policyScope===undefined&&$("policyScope"))$("policyScope").value=/(서울|경기|인천)/.test(String(notice.location||""))?"capital":"none";
    setupMoneyInputs($("finance"));
  }
  function saveFundingInputs(){
    const prior=readStorage(FINANCE_KEY,{}),data={selectedOptions:Array.from(document.querySelectorAll("[data-option-id]:checked")).map(input=>input.dataset.optionId),interimNoticeId:notice.id,interimLoanModes:Array.from(document.querySelectorAll("[data-interim-mode]")).map(select=>select.value)};
    FINANCE_IDS.forEach(id=>data[id]=FINANCE_CHECK_IDS.has(id)?Boolean($(id)?.checked):$(id)?.value??"");
    if(!document.querySelector("[data-option-id]"))data.selectedOptions=Array.isArray(prior.selectedOptions)?prior.selectedOptions:[];
    localStorage.setItem(FINANCE_KEY,JSON.stringify(data));
  }
  function selectedOptionIds(){return new Set(Array.from(document.querySelectorAll("[data-option-id]:checked")).map(input=>input.dataset.optionId))}
  function renderOptionChoices(){
    normalizeNoticeFinance(notice);
    const selectedSize=$("planSize").value,rows=notice.options.filter(row=>row.size===selectedSize),saved=new Set(readStorage(FINANCE_KEY,{}).selectedOptions||[]);
    const categoryLabels={balcony:"발코니",system:"시스템에어컨",paid:"유상옵션"};
    $("optionChoices").innerHTML=rows.length?rows.map(row=>{
      const paymentText=row.paymentAmounts.length>1?row.paymentAmounts.map(value=>`${Math.round(value/row.price*100)}%`).join(" · "):"납부일정 확인";
      return `<label class="option-choice"><input type="checkbox" data-option-id="${esc(row.id)}"${saved.has(row.id)?" checked":""}><span><b>${esc(row.name)}</b><small>${esc(categoryLabels[row.category]||"선택품목")} · ${esc(paymentText)}</small></span><strong>${formatWon(row.price)}</strong></label>`;
    }).join(""):`<div class="option-empty">${selectedSize?`${esc(selectedSize)}형의 발코니·유상옵션 가격을 찾지 못했습니다. 공고문이 이미지 표이거나 별도 계약문서에 수록됐을 수 있습니다.`:"주택형을 먼저 선택해 주세요."}</div>`;
    updateOptionSummary();
  }
  function updateOptionSummary(){
    const ids=selectedOptionIds(),total=notice.options.filter(row=>ids.has(row.id)).reduce((sum,row)=>sum+num(row.price),0);
    $("optionSummary").textContent=formatWon(total);
  }
  function renderInterimFundingChoices(){
    const interim=notice.payments.filter(row=>row.kind==="interim"),saved=readStorage(FINANCE_KEY,{});
    const modes=saved.interimNoticeId===notice.id&&Array.isArray(saved.interimLoanModes)&&saved.interimLoanModes.length===interim.length?saved.interimLoanModes:notice.interimLoanModes;
    const price=num($("planPrice").value);
    $("interimFundingChoices").innerHTML=interim.length?`<div class="interim-source-note">${esc(notice.interimLoanSource||"공고문 대출 회차 확인 필요")}</div>${interim.map((row,index)=>{
      const mode=modes[index]||"review",amount=Math.round(price*num(row.rate)/100);
      return `<label class="interim-funding-row"><span><b>${esc(row.label)}</b><small>${esc((row.dueDate||row.dueLabel||"날짜 확인").replaceAll("-","."))} · ${formatWon(amount)}</small></span><select data-interim-mode="${index}"><option value="loan"${mode==="loan"?" selected":""}>대출 실행</option><option value="self"${mode==="self"?" selected":""}>자납</option><option value="review"${mode==="review"?" selected":""}>확인 필요</option></select></label>`;
    }).join("")}`:`<div class="option-empty">중도금 회차가 없습니다.</div>`;
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
    if(resetPrice||!num($("planPrice").value))$("planPrice").value=formatNumberInput(selected?.max);
    if(resetPrice||!num($("collateralValue").value))$("collateralValue").value=formatNumberInput(selected?.max);
    $("priceChips").innerHTML=selected&&num(selected.max)?[
      num(selected.min)&&num(selected.min)!==num(selected.max)?`<button type="button" class="price-chip" data-price="${num(selected.min)}">최저가 ${formatWonShort(selected.min)}</button>`:"",
      `<button type="button" class="price-chip" data-price="${num(selected.max)}">최고가 ${formatWonShort(selected.max)}</button>`
    ].filter(Boolean).join(""):"";
    if(!$("contractDate").value&&notice.expectedContractDate)$("contractDate").value=notice.expectedContractDate;
    if(!$("moveInDate").value&&notice.expectedMoveInDate)$("moveInDate").value=notice.expectedMoveInDate;
    setupDateInputs();setupMoneyInputs($("finance"));renderOptionChoices();renderInterimFundingChoices();
  }
  function fundingInput(){
    const now=new Date();
    const today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
    const price=num($("planPrice").value),size=$("planSize").value;
    const pricing=notice.pricing.find(row=>row.size===size),sizeRow=notice.sizes.find(row=>row.name===size);
    const detail=pricing?.details?.find(row=>num(row.price)===price&&Array.isArray(row.paymentAmounts));
    const interimModes=Array.from(document.querySelectorAll("[data-interim-mode]")).map(select=>select.value);
    let interimIndex=0;
    const basePayments=(notice.payments||[]).map((payment,index)=>{
      const slot=Number.isInteger(Number(payment.slot))?Number(payment.slot):index;
      const fixedAmount=detail?.paymentAmounts?.[slot];
      const resolved=fixedAmount===undefined?{...payment}:{...payment,fixedAmount,rate:price?fixedAmount/price*100:num(payment.rate)};
      if(payment.kind==="interim"){
        const mode=interimModes[interimIndex++]||"review";
        resolved.loanMode=mode;resolved.loanEnabled=mode==="loan";
      }
      return resolved;
    });
    const selectedIds=selectedOptionIds(),selectedOptions=notice.options.filter(row=>row.size===size&&selectedIds.has(row.id));
    const contractDate=R.normalizeDate($("contractDate").value),moveInDate=R.normalizeDate($("moveInDate").value);
    const interimDates=basePayments.filter(row=>row.kind==="interim").map(row=>R.normalizeDate(row.dueDate)).filter(Boolean);
    const extraPayments=selectedOptions.flatMap(option=>{
      const parsedParts=option.paymentAmounts.map(value=>num(value)).filter(Boolean);
      const parts=parsedParts.length&&Math.abs(parsedParts.reduce((sum,value)=>sum+value,0)-num(option.price))<=Math.max(2000,num(option.price)*.001)?parsedParts:[num(option.price)];
      return parts.map((fixedAmount,index)=>{
        const last=index===parts.length-1;
        const phaseKind=parts.length===1?"contract":index===0?"contract":last?"balance":"interim";
        const dueDate=phaseKind==="contract"?contractDate:phaseKind==="balance"?moveInDate:interimDates[Math.min(index-1,Math.max(0,interimDates.length-1))]||"";
        const dueLabel=phaseKind==="contract"?(parts.length===1?"공고문 납부일정 확인":"옵션 계약 시"):phaseKind==="balance"?"입주 지정일":"옵션 중도금 시점";
        return {kind:"other",phaseKind,extra:true,optionId:option.id,label:parts.length>1?`${option.name} ${index+1}차`:option.name,rate:0,fixedAmount,dueDate,dueLabel};
      });
    });
    const tax=R.acquisitionCostEstimate(price,num(sizeRow?.area),{mode:$("taxMode").value,manualTotalRate:num($("taxManualRate").value)});
    const manualExtras=num($("planExtras").value),includedTax=$("includeAcquisitionTax").checked?tax.total:0;
    return {baseDate:today,price,size,area:num(sizeRow?.area),manualExtras,tax,includedTax,extras:manualExtras+includedTax,optionTotal:selectedOptions.reduce((sum,row)=>sum+num(row.price),0),selectedOptions,interimModes,cashNow:num($("cashNow").value),reserve:num($("cashReserve").value),monthlySaving:num($("monthlySaving").value),contractDate,moveInDate,interimInterestRate:num($("interimInterestRate").value),interestPaymentMode:$("interestPaymentMode").value,collateralValue:num($("collateralValue").value),annualIncome:num($("annualIncome").value),existingAnnualDebtService:num($("existingAnnualDebtService").value),mortgageLtv:num($("mortgageLtv").value),mortgageInterestRate:num($("mortgageInterestRate").value),stressRate:num($("stressRate").value),dsrLimit:num($("dsrLimit").value),mortgageYears:num($("mortgageYears").value),policyScope:$("policyScope").value,manualMortgageCap:num($("manualMortgageCap").value),payments:[...basePayments,...extraPayments]};
  }
  function minimumMonthlySaving(input){
    const zero={...input,monthlySaving:0};
    if(!R.buildFundingPlan(zero).worstShortage)return 0;
    let high=100000;
    while(high<=1000000000&&R.buildFundingPlan({...zero,monthlySaving:high}).worstShortage)high*=2;
    if(high>1000000000)return null;
    let low=0;
    for(let index=0;index<34;index++){
      const middle=Math.floor((low+high)/2);
      if(R.buildFundingPlan({...zero,monthlySaving:middle}).worstShortage)low=middle+1;else high=middle;
    }
    return Math.ceil(high/10000)*10000;
  }
  function renderTaxPreview(input){
    const tax=input.tax,manual=tax.mode==="manual";
    $("taxManualRate").disabled=!manual;
    const rows=manual?[`총 세율 ${tax.totalRate.toFixed(2)}%`]:[
      `취득세 ${formatWon(tax.acquisitionTax)}`,
      `지방교육세 ${formatWon(tax.localEducationTax)}`,
      `농어촌특별세 ${tax.ruralSpecialTax?formatWon(tax.ruralSpecialTax):"비과세(85㎡ 이하)"}`,
      tax.discount?`생애최초 감면 −${formatWon(tax.discount)}`:""
    ].filter(Boolean);
    $("taxPreview").innerHTML=`<span>${$("includeAcquisitionTax").checked?"잔금 반영 예상세액":"계산만 하고 잔금에서 제외"}</span><b>${formatWon(tax.total)}</b><small>${rows.map(esc).join(" · ")}</small>`;
  }
  function phaseLabel(kind){return kind==="contract"?"계약":kind==="interim"?"중도금":"잔금·입주"}
  function renderFundingPhases(plan){
    const byPhase=kind=>plan.rows.filter(row=>(row.phaseKind||row.kind)===kind);
    const contractRows=byPhase("contract"),interimRows=byPhase("interim"),closingRows=byPhase("balance");
    const loanRows=interimRows.filter(row=>row.financing>0),selfRows=interimRows.filter(row=>!row.financing);
    const plannedLoan=Math.min(plan.mortgageRequired,plan.loanCapacity.estimatedLimit);
    const monthlyPayment=Math.round(monthlyLoanPayment(plannedLoan,plan.loanCapacity.mortgageInterestRate,plan.loanCapacity.mortgageYears));
    const maxShort=rows=>rows.reduce((maximum,row)=>Math.max(maximum,row.shortage),0);
    const moments=[
      {step:"01",title:"계약",date:contractRows[0]?.dueText||"날짜 확인",need:sum(contractRows,"own"),note:`계약금${contractRows.length>1?` ${contractRows.length}회`:""} — 전액 내 현금`,shortage:maxShort(contractRows)},
      {step:"02",title:"중도금 자납",date:selfRows.length?`${selfRows[0].dueText}${selfRows.length>1?` 외 ${selfRows.length-1}회`:""}`:(loanRows.length?"현금 부담 없음":"회차 없음"),need:sum(interimRows,"own"),note:loanRows.length?`${loanRows.length}회는 대출로 자동 처리 · 자납 ${selfRows.length}회만 현금${plan.monthlyPaidInterest?` · 이자 매월 납부`:""}`:"전 회차 자납",shortage:maxShort(interimRows)},
      {step:"03",title:"잔금·입주",date:closingRows[0]?.dueText||"입주 지정일",need:sum(closingRows,"own"),note:`잔금+후불이자+세금 − 잔금대출 ${formatWonShort(sum(closingRows,"financing"))}`,shortage:maxShort(closingRows)},
      {step:"04",title:"입주 후 매달",date:"대출 상환 기간",need:monthlyPayment,monthly:true,note:`잔금대출 ${formatWonShort(plannedLoan)} · ${plan.loanCapacity.mortgageYears}년 원리금균등 · 금리 ${plan.loanCapacity.mortgageInterestRate.toFixed(1)}% 가정`,shortage:0}
    ];
    $("fundingPhases").innerHTML=moments.map(m=>`<div class="moment ${m.shortage?"moment-risk":""}">
      <div class="moment-top"><span>${m.step}</span><small>${esc(String(m.date).replaceAll("-","."))}</small></div>
      <h4>${esc(m.title)}</h4><b>${formatWonShort(m.need)}${m.monthly?'<small class="per-month">/월</small>':""}</b>
      <small class="moment-note">${esc(m.note)}</small>
      ${m.shortage?`<em>▲ ${formatWonShort(m.shortage)} 부족</em>`:m.monthly?"":'<em class="moment-ok">✓ 충당 가능</em>'}
    </div>`).join('<i class="phase-arrow">→</i>');
  }
  function renderFundingTimeline(plan){
    const maximum=Math.max(1,...plan.rows.map(row=>row.own+row.financing));
    $("fundingTimeline").innerHTML=`<div class="cashflow-list">${plan.rows.map((row,index)=>{
      const source=row.own+row.financing,loanWidth=source?row.financing/source*100:0,scale=source/maximum*100;
      return `<article class="cashflow-row ${row.shortage?"cashflow-risk":""}"><div class="cashflow-sequence"><span>${String(index+1).padStart(2,"0")}</span><i></i></div><div class="cashflow-date"><b>${esc(row.dueText.replaceAll("-","."))}</b><small>${phaseLabel(row.phaseKind||row.kind)}</small></div><div class="cashflow-main"><div><h4>${esc(row.label)}</h4><span>${row.extra?"선택품목":`${row.rate.toFixed(1)}%`} · ${esc(row.note)}</span></div><b>${formatWon(row.gross)}</b><div class="cashflow-scale" style="width:${Math.max(18,scale)}%"><i style="width:${loanWidth}%"></i></div><div class="cashflow-split"><span>내 현금 <b>${formatWonShort(row.own)}</b></span><span>대출 <b>${row.financing?formatWonShort(row.financing):"없음"}</b></span><span>누적저축 <b>${formatWonShort(row.accumulatedSaving)}</b></span></div></div><div class="cashflow-balance ${row.cashAfter<0?"negative":""}"><small>납부 후 가용현금</small><b>${formatWonShort(row.cashAfter)}</b>${row.shortage?`<em>${formatWonShort(row.shortage)} 부족</em>`:"<span>O</span>"}</div></article>`;
    }).join("")}</div>`;
  }
  function monthlyLoanPayment(principal,annualRate,years){const rate=num(annualRate)/1200,months=Math.max(1,num(years)*12);return rate?principal*rate*Math.pow(1+rate,months)/(Math.pow(1+rate,months)-1):principal/months}
  function renderLoanCapacity(plan){
    const capacity=plan.loanCapacity,plannedLoan=Math.min(plan.mortgageRequired,capacity.estimatedLimit),plannedPayment=Math.round(monthlyLoanPayment(plannedLoan,capacity.mortgageInterestRate,capacity.mortgageYears));
    const limitItems=capacity.limits.map(row=>`<div class="limit-item ${row.key===capacity.binding.key?"binding":""}"><span>${esc(row.label)}</span><b>${formatWonShort(row.amount)}</b>${row.key===capacity.binding.key?"<em>최종 적용</em>":""}</div>`).join("");
    const annualRoom=Math.max(0,capacity.annualRoom),monthlyRoom=annualRoom/12;
    $("loanCapacityDetail").innerHTML=`<div class="loan-capacity-result"><div class="limit-result-head"><div><span>예상 잔금대출 한도</span><strong>${formatWonShort(capacity.estimatedLimit)}</strong></div><p><b>${esc(capacity.binding.label)}</b>이 가장 먼저 한도를 막습니다.<br>담보가치 ${formatWonShort(capacity.collateralValue)} · DSR 심사금리 ${capacity.dsrRate.toFixed(1)}%<br>실제금리 ${capacity.mortgageInterestRate.toFixed(1)}% 가정 시 필요대출 월 상환액 약 ${formatWonShort(plannedPayment)}</p></div><div class="limit-lane">${limitItems}</div><small>원리금균등 ${capacity.mortgageYears}년 가정. 은행 인정소득·금리유형·기존대출 만기와 실제 입주 시점 규제로 결과가 달라질 수 있습니다.</small></div>`;
  }
  function renderInterestAnalysis(plan){
    const modeLabels={deferred:"이자후불 · 입주 때 납부",monthly:"매월 직접 납부",free:"무이자"};
    $("interestModeBadge").innerHTML=`<span class="mode-badge">${esc(modeLabels[plan.interestPaymentMode]||modeLabels.deferred)}</span>`;
    const installmentRows=plan.interestByInstallment||[];
    $("installmentInterest").innerHTML=installmentRows.length?`<div class="interest-overview"><div><span>대출 실행 회차</span><b>${installmentRows.length}회</b></div><div><span>최대 중도금대출</span><b>${formatWonShort(plan.peakInterim)}</b></div><div><span>총 발생이자</span><b>${formatWonShort(plan.totalInterimInterest)}</b></div><div><span>입주 때 낼 후불이자</span><b>${formatWonShort(plan.deferredInterest)}</b></div></div><div class="table-scroll"><table class="finance-table"><thead><tr><th>회차</th><th>실행일</th><th>실행 원금</th><th>이 회차 발생이자</th><th>누적 대출원금</th><th>누적 발생이자</th></tr></thead><tbody>${installmentRows.map(row=>`<tr><td>${esc(row.label)}</td><td>${esc(row.dueDate.replaceAll("-","."))}</td><td class="num-cell">${formatWon(row.amount)}</td><td class="num-cell">${formatWon(row.interest)}</td><td class="num-cell">${formatWon(row.cumulativePrincipal)}</td><td class="num-cell interest-accent">${formatWon(row.cumulativeInterest)}</td></tr>`).join("")}</tbody></table></div>`:`<div class="option-empty">대출 실행으로 선택한 중도금 회차가 없거나 이율·날짜가 입력되지 않았습니다.</div>`;
    const monthly=plan.interestSchedule||[],maxInterest=Math.max(0,...monthly.map(row=>row.interest)),average=monthly.length?Math.round(plan.totalInterimInterest/monthly.length):0;
    $("monthlyInterest").innerHTML=monthly.length?`<div class="monthly-stats"><span>월 최대 발생이자 <b>${formatWon(maxInterest)}</b></span><span>월평균 발생이자 <b>${formatWon(average)}</b></span><span>입주까지 총이자 <b>${formatWon(plan.totalInterimInterest)}</b></span></div><div class="monthly-interest-grid"><div class="interest-chart">${monthly.map(row=>`<div class="interest-bar-row"><span>${esc(row.month.replace("-","."))}</span><i><b style="width:${maxInterest?Math.max(2,row.interest/maxInterest*100):0}%"></b></i><strong>${formatWonShort(row.interest)}</strong></div>`).join("")}</div><div class="table-scroll monthly-table-wrap"><table class="finance-table"><thead><tr><th>월</th><th>대출잔액</th><th>월 발생이자</th><th>실제 월 납부</th><th>이자 반영 순저축</th><th>누적 발생이자</th></tr></thead><tbody>${monthly.map(row=>{const net=plan.monthlySaving-row.paidInterest;return `<tr><td>${esc(row.month.replace("-","."))}</td><td class="num-cell">${formatWon(row.outstanding)}</td><td class="num-cell">${formatWon(row.interest)}</td><td class="num-cell">${row.paidInterest?formatWon(row.paidInterest):"0원"}</td><td class="num-cell ${net<0?"money-negative":""}">${formatWon(net)}</td><td class="num-cell interest-accent">${formatWon(row.cumulativeInterest)}</td></tr>`}).join("")}</tbody></table></div></div>`:`<div class="option-empty">월별 이자표를 만들려면 대출 회차, 이율, 실행일과 잔금일이 필요합니다.</div>`;
  }
  function renderFundingPlan(){
    const input=fundingInput();
    renderTaxPreview(input);
    updateOptionSummary();
    const cashExcess=Math.max(0,input.reserve-input.cashNow),usable=Math.max(0,input.cashNow-input.reserve);
    $("cashReserve").setAttribute("aria-invalid",cashExcess?"true":"false");
    $("usableCashPreview").className=`usable-cash-preview${cashExcess?" is-invalid":""}`;
    $("usableCashPreview").textContent=cashExcess?`남겨둘 금액이 현재 현금보다 ${formatWon(cashExcess)} 큽니다. 이 항목은 추가 자금이 아니라 현재 현금에서 빼놓는 돈이므로 청약에 쓸 시작 현금은 0원입니다.`:`청약에 투입 가능한 시작 현금 ${formatWon(usable)} = 현재 현금 ${formatWon(input.cashNow)} − 남겨둘 금액 ${formatWon(input.reserve)}`;
    if(!input.price||!Array.isArray(input.payments)||!input.payments.length){
      $("financeWarning").innerHTML="<div class='alert bad'>분양가 또는 납부일정이 없습니다. 모집공고 화면에서 자동 추출값을 확인하거나 직접 입력해 주세요.</div>";
      ["fundingHero","fundingSummary","loanCapacityDetail","installmentInterest","monthlyInterest","fundingPhases","fundingTimeline"].forEach(id=>$(id).innerHTML="");return;
    }
    const plan=R.buildFundingPlan(input),minimumSaving=minimumMonthlySaving(input),warnings=[];
    if(input.interimModes.includes("review")||String(notice.interimLoanSource||"").includes("확인 필요"))warnings.push({type:"warn",message:"대출 실행 여부가 확인되지 않은 중도금 회차가 있습니다. 공고문 또는 집단대출 안내에 따라 대출·자납을 선택하세요."});
    if(input.reserve>input.cashNow)warnings.push({type:"bad",message:`남겨둘 금액 ${formatWonShort(input.reserve)}은 추가 자금이 아닙니다. 현재 현금 ${formatWonShort(input.cashNow)}에서 차감되므로 시작 현금은 0원입니다.`});
    if(!input.annualIncome)warnings.push({type:"bad",message:"부부 합산 연소득이 0원이어서 DSR 기준 잔금대출 한도가 0원으로 계산됩니다."});
    if(Math.abs(plan.rateTotal-100)>.01)warnings.push({type:"bad",message:`납부비율 합계가 ${plan.rateTotal.toFixed(1)}%입니다. 공고문 표를 다시 대조하세요.`});
    if(!input.contractDate)warnings.push({type:"warn",message:"예상 계약일을 입력하면 계약일까지 모을 수 있는 돈을 계산합니다."});
    if(!input.moveInDate)warnings.push({type:"warn",message:"예상 입주·잔금일을 입력하면 중도금 이자와 잔금일 자기자본을 계산합니다."});
    if(plan.interestIncomplete)warnings.push({type:"warn",message:"일부 중도금 실행일이 없어 이자를 전부 계산하지 못했습니다."});
    if(input.tax.mode==="first_home"&&!input.tax.eligibleFirstHome)warnings.push({type:"warn",message:"분양가가 12억원을 초과해 생애최초 취득세 감면을 적용하지 않았습니다."});
    if(plan.firstShortage)warnings.push({type:"bad",message:`납부 일정상 첫 자금공백은 ${plan.firstShortage.dueText} ${plan.firstShortage.label}, ${formatWonShort(plan.firstShortage.shortage)}입니다.`});
    $("financeWarning").innerHTML=warnings.map(item=>`<div class="alert ${item.type}">${esc(item.message)}</div>`).join("");
    const finalGap=plan.loanShortage,hasScheduleGap=Boolean(plan.firstShortage),isRisk=finalGap>0||hasScheduleGap;
    const verdict=finalGap?`최종적으로 ${formatWonShort(finalGap)} 부족합니다`:hasScheduleGap?"총액은 맞지만 납부 중 자금공백이 있습니다":"현재 가정으로 가능합니다";
    const verdictCopy=finalGap?`필요 대출 ${formatWonShort(plan.mortgageRequired)}보다 예상 한도 ${formatWonShort(plan.mortgageTarget)}가 작습니다.`:hasScheduleGap?`${plan.firstShortage.dueText}까지 현금 투입 시점을 앞당겨야 합니다.`:`입주까지 마련할 자기자본과 예상 대출 한도가 총 필요자금을 충족합니다.`;
    const coverage=plan.totalCost?Math.max(0,Math.min(100,(plan.ownCapitalAtMoveIn+plan.mortgageTarget)/plan.totalCost*100)):100;
    const savingText=minimumSaving===null?"계약 전 현금 보강 필요":minimumSaving?`${formatWonShort(minimumSaving)}/월`:"현재 저축액으로 충족";
    const solutions=[];
    if(isRisk){
      if(minimumSaving===null)solutions.push("저축만으로는 계약 시점 공백을 못 메웁니다. 계약 전 현금(신용대출·가족 지원 등) 보강이 필요합니다.");
      else if(minimumSaving>input.monthlySaving)solutions.push(`월 저축을 ${formatWonShort(input.monthlySaving)} → ${formatWonShort(minimumSaving)}로 올리면 납부 일정을 전부 통과합니다.`);
      const pricingRow=notice.pricing.find(row=>row.size===input.size);
      const lowPrice=num(pricingRow?.min);
      if(lowPrice&&lowPrice<input.price){
        const lowPlan=R.buildFundingPlan({...input,price:lowPrice,collateralValue:lowPrice,payments:input.payments.map(row=>({...row,fixedAmount:undefined}))});
        solutions.push(lowPlan.loanShortage<=0&&!lowPlan.firstShortage?`같은 주택형 최저가(저층) ${formatWonShort(lowPrice)} 기준이면 현재 조건으로 가능합니다.`:`최저가(저층) ${formatWonShort(lowPrice)} 기준으로도 ${formatWonShort(lowPlan.loanShortage||lowPlan.firstShortage?.shortage||0)} 부족합니다.`);
      }
      if(plan.loanCapacity.binding.key==="dsr"){
        const longer=R.calculateLoanCapacity({...input,mortgageYears:40});
        const gain=longer.estimatedLimit-plan.mortgageTarget;
        if(gain>0)solutions.push(`상환기간을 40년으로 늘리면 대출한도가 ${formatWonShort(gain)} 늘어납니다${gain>=finalGap&&finalGap>0?" — 부족분 해소 가능":""}.`);
      }
    }
    $("fundingHero").innerHTML=`<article class="funding-hero ${isRisk?"is-risk":"is-safe"}"><div class="funding-hero-copy"><span class="kicker">FUNDING VERDICT</span><h3>${verdict}</h3><p>${esc(verdictCopy)}</p><div class="capital-equation"><span><small>입주까지 자기자본</small><b>${formatWonShort(plan.ownCapitalAtMoveIn)}</b></span><i>+</i><span><small>예상 대출한도</small><b>${formatWonShort(plan.mortgageTarget)}</b></span><i>−</i><span><small>총 필요자금</small><b>${formatWonShort(plan.totalCost)}</b></span></div><div class="readiness-track"><i style="width:${coverage}%"></i></div><small>총 필요자금 충족도 ${coverage.toFixed(0)}%</small>${solutions.length?`<div class="solution-list"><b>부족을 줄이는 현실적 선택지</b><ul>${solutions.map(item=>`<li>${esc(item)}</li>`).join("")}</ul></div>`:""}</div><div class="funding-hero-metrics"><div><span>실제로 필요한 잔금대출</span><b>${formatWonShort(plan.mortgageRequired)}</b></div><div><span>대출한도를 막는 기준</span><b>${esc(plan.loanCapacity.binding.label)}</b></div><div><span>필요 월저축액</span><b>${savingText}</b></div><div><span>총 중도금 이자</span><b>${formatWonShort(plan.totalInterimInterest)}</b></div></div></article>`;
    const needRows=[["분양가",plan.price],["발코니·유상옵션",plan.optionTotal],["취득세·기타비용",input.extras],["중도금 이자",plan.totalInterimInterest]].filter(([,value])=>value>0);
    const haveRows=[["시작 현금(남길 돈 제외)",plan.usableStart],["입주까지 저축",plan.grossSavingToMoveIn],["잔금대출 한도",plan.mortgageTarget]];
    const haveTotal=plan.ownCapitalAtMoveIn+plan.mortgageTarget;
    $("fundingSummary").innerHTML=`<div class="fund-cols"><div class="fund-col need"><h4>총 필요자금 <b>${formatWonShort(plan.totalCost)}</b></h4><ul>${needRows.map(([label,value])=>`<li><span>${esc(label)}</span><b>${formatWonShort(value)}</b></li>`).join("")}</ul></div><div class="fund-col have"><h4>투입 가능액 <b>${formatWonShort(haveTotal)}</b></h4><ul>${haveRows.map(([label,value])=>`<li><span>${esc(label)}</span><b>${formatWonShort(value)}</b></li>`).join("")}<li class="cap"><span>한도 결정 기준</span><b>${esc(plan.loanCapacity.binding.label)}</b></li></ul></div></div><div class="fund-net ${finalGap?"bad":"ok"}">${finalGap?`▲ 부족 ${formatWonShort(finalGap)}`:`✓ 여유 ${formatWonShort(plan.finalSurplus)}`}</div>`;
    $("scheduleFoldInfo").textContent=[input.contractDate,input.moveInDate].filter(Boolean).map(value=>value.slice(2).replaceAll("-",".")).join(" → ")||"날짜 미입력";
    $("interimFoldInfo").textContent=`${plan.interestByInstallment.length?`대출 ${plan.interestByInstallment.length}회`:"전액 자납"} · 연 ${input.interimInterestRate}%`;
    $("loanFoldInfo").textContent=`예상 한도 ${formatWonShort(plan.mortgageTarget)}`;
    $("taxFoldInfo").textContent=formatWonShort(input.tax.total);
    $("interestFoldInfo").textContent=`총 ${formatWonShort(plan.totalInterimInterest)}`;
    renderLoanCapacity(plan);renderInterestAnalysis(plan);renderFundingPhases(plan);renderFundingTimeline(plan);queueFundingSave();
  }
  const UI_MODE_KEY="subscription_ui_mode_v3";
  const QUICK_FIELD_MAP=[["quickBirth","aBirth"],["quickAccount","aAccount"],["quickBirthB","bBirth"],["quickAccountB","bAccount"],["quickMarriage","marriageDate"],["quickChildren","children"],["quickFetuses","fetuses"],["quickRegion","residenceRegion"],["quickResidence","residenceStart"],["quickIncomeA","aMonthlyIncome"],["quickIncomeB","bMonthlyIncome"],["quickCash","cashNow"],["quickSaving","monthlySaving"]];
  function quickFamily(){return document.querySelector('input[name="quickFamily"]:checked')?.value||"single"}
  function updateQuickVisibility(){
    const married=quickFamily()==="married";
    $("quickMarriageField").classList.toggle("is-hidden",!married);
    $("quickBirthBField").classList.toggle("is-hidden",!married);
    $("quickAccountBField").classList.toggle("is-hidden",!married);
    $("quickIncomeBField").classList.toggle("is-hidden",!married);
  }
  function syncQuickToDetail(){
    const family=quickFamily();
    const radio=document.querySelector(`input[name="profileType"][value="${family}"]`);
    if(radio)radio.checked=true;
    QUICK_FIELD_MAP.forEach(([from,to])=>{if($(from)&&$(to))$(to).value=$(from).value});
    $("noHome").checked=$("quickNoHome").checked;
    $("neverHome").checked=$("quickNeverHome").checked;
    $("aHead").checked=$("quickHead").checked;
    if(family==="married"){
      $("bothApply").checked=true;
      if(num($("quickChildren").value)>0&&!num($("marriageChildren").value))$("marriageChildren").value=$("quickChildren").value;
    }
    const annualIncome=(num($("quickIncomeA").value)+(family==="married"?num($("quickIncomeB").value):0))*12;
    if(annualIncome>0)$("annualIncome").value=formatNumberInput(annualIncome);
    renderProfileSummary();queueProfileSave();queueFundingSave();
  }
  function initQuickFromDetail(){
    const type=selectedProfileType();
    const family=["single","married","single_parent"].includes(type)?type:"single";
    const radio=document.querySelector(`input[name="quickFamily"][value="${family}"]`);
    if(radio)radio.checked=true;
    QUICK_FIELD_MAP.forEach(([from,to])=>{if($(to)&&$(from))$(from).value=$(to).value});
    $("quickNoHome").checked=$("noHome").checked;
    $("quickNeverHome").checked=$("neverHome").checked;
    $("quickHead").checked=$("aHead").checked;
    updateQuickVisibility();
    $("quickNoticeName").textContent=notice.projectName||"공고 없음";
    setupMoneyInputs($("quick"));
  }
  function setUiMode(simple,panel){
    document.body.classList.toggle("simple-mode",simple);
    localStorage.setItem(UI_MODE_KEY,simple?"simple":"advanced");
    if(simple){initQuickFromDetail();setPanel("quick")}
    else setPanel(panel||"profile");
  }
  function quickFundingCheck(sizeName){
    const pricing=(notice.pricing||[]).find(row=>row.size===sizeName);
    const price=num(pricing?.max);
    if(!price||!Array.isArray(notice.payments)||!notice.payments.length)return null;
    const modes=notice.interimLoanModes||[];
    let interimIndex=0;
    const payments=notice.payments.map(payment=>{
      const resolved={...payment};
      if(payment.kind==="interim")resolved.loanEnabled=modes[interimIndex++]!=="self";
      return resolved;
    });
    const now=new Date(),today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
    const area=num((notice.sizes||[]).find(row=>row.name===sizeName)?.area);
    const annualIncome=(num($("aMonthlyIncome").value)+(R.hasLegalSpouse(profileData())?num($("bMonthlyIncome").value):0))*12;
    return R.buildFundingPlan({
      baseDate:today,price,extras:R.acquisitionCostEstimate(price,area,{mode:"standard"}).total,
      cashNow:num($("cashNow").value),reserve:0,monthlySaving:num($("monthlySaving").value),
      contractDate:notice.expectedContractDate||"",moveInDate:notice.expectedMoveInDate||"",
      interimInterestRate:4.5,interestPaymentMode:"deferred",
      annualIncome,collateralValue:price,mortgageLtv:40,mortgageInterestRate:4.5,stressRate:1.5,dsrLimit:40,mortgageYears:30,
      policyScope:/(서울|경기|인천)/.test(String(notice.location||notice.priorityRegion||""))?"capital":"none",
      payments
    });
  }
  function renderQuickResult(){
    const profile=profileData();
    const aRows=candidateRows("a",profile),bRows=R.hasSecondApplicant(profile)?candidateRows("b",profile):[];
    const plans=buildPlans(aRows,bRows,profile);
    const picks=[
      {person:"나",label:"특별공급",row:plans.a.special},
      {person:"나",label:"일반공급",row:plans.a.general},
      ...(plans.useB?[{person:"배우자",label:"특별공급",row:plans.b.special},{person:"배우자",label:"일반공급",row:plans.b.general}]:[])
    ].filter(pick=>pick.row);
    if(!picks.length){
      $("quickResult").innerHTML=`<div class="quick-empty"><b>현재 입력으로 신청 가능한 유형이 없습니다.</b><br>통장 가입일(일반 1순위는 보통 24개월), 무주택 체크, 생년월일이 채워졌는지 확인해 주세요. 세부 요건(예치금·재당첨 제한 등)은 상세 모드의 '자격 체크' 표에서 확인할 수 있습니다.</div>`;
      return;
    }
    const planCache={};
    const planFor=size=>{if(!(size in planCache))planCache[size]=quickFundingCheck(size);return planCache[size]};
    const pickLines=picks.map((pick,index)=>{
      const row=pick.row;
      const plan=planFor(row.size);
      let badge,detail="";
      if(!plan)badge=`<span class="fund-badge warn">자금 미확인</span>`;
      else if(plan.loanShortage>0)badge=`<span class="fund-badge bad">▲ 부족 ${formatWonShort(plan.loanShortage)}</span>`;
      else if(plan.firstShortage)badge=`<span class="fund-badge warn">△ 중간공백 ${formatWonShort(plan.firstShortage.shortage)}</span>`;
      else badge=`<span class="fund-badge ok">✓ 여유 ${formatWonShort(plan.finalSurplus)}</span>`;
      if(plan){
        const haveTotal=plan.ownCapitalAtMoveIn+plan.mortgageTarget;
        detail=`<div class="quick-pick-detail is-hidden"><div class="fund-cols"><div class="fund-col need"><h5>필요자금 ${formatWonShort(plan.totalCost)}</h5><ul><li><span>분양가(최고가 기준)</span><b>${formatWonShort(plan.price)}</b></li><li><span>취득세 예상</span><b>${formatWonShort(plan.extras)}</b></li>${plan.totalInterimInterest?`<li><span>중도금 이자</span><b>${formatWonShort(plan.totalInterimInterest)}</b></li>`:""}<li class="cap"><span>발코니·옵션</span><b>상세 모드에서 선택</b></li></ul></div><div class="fund-col have"><h5>투입 가능 ${formatWonShort(haveTotal)}</h5><ul><li><span>지금 현금</span><b>${formatWonShort(plan.usableStart)}</b></li><li><span>입주까지 저축</span><b>${formatWonShort(plan.grossSavingToMoveIn)}</b></li><li><span>잔금대출 한도</span><b>${formatWonShort(plan.mortgageTarget)}</b></li><li class="cap"><span>한도 결정 기준</span><b>${esc(plan.loanCapacity.binding.label)}</b></li></ul></div></div><div class="fund-net ${plan.loanShortage>0?"bad":plan.firstShortage?"warn":"ok"}">${plan.loanShortage>0?`▲ 부족 ${formatWonShort(plan.loanShortage)} — 저축 증액·낮은 평형·저층 가격 검토`:plan.firstShortage?`△ 총액은 가능하지만 ${esc(plan.firstShortage.dueText)} ${esc(plan.firstShortage.label)}에 ${formatWonShort(plan.firstShortage.shortage)} 공백`:`✓ 여유 ${formatWonShort(plan.finalSurplus)} — 현재 조건으로 가능`}</div></div>`;
      }
      return `<div class="quick-pick" data-pick="${index}"><div class="quick-pick-row"><div class="quick-pick-type"><small>${esc(pick.person)} · ${esc(pick.label)}</small><b>${esc(R.TYPE_LABELS[row.type])}</b></div><div class="quick-pick-main"><b>${esc(row.size)} 주택형</b><small>${esc(row.seatText)} · ${esc(row.reasons.slice(1,3).join(" · "))}</small><span class="quick-pick-chance">${esc(chanceLabel(row))}</span></div><div class="quick-pick-side">${badge}<small class="tap-hint">탭하여 자금 상세 ▾</small></div></div>${detail}</div>`;
    }).join("");
    const sizes=[...new Set(picks.map(pick=>pick.row.size))];
    const verifiedNote=notice.verified?"":`<p class="quick-hero-warn">⚠ 이 공고 숫자는 아직 검수 전입니다. 상세 모드 '모집공고'에서 원문과 대조하면 정확도가 올라갑니다.</p>`;
    $("quickResult").innerHTML=`<article class="quick-hero"><span class="kicker">RECOMMENDATION</span><h3>${esc(notice.projectName||"공고")} — 이렇게 넣으세요</h3><p>자격·물량·소득단계${sizes.some(size=>sizeExpectation(size).generalRate||sizeExpectation(size).cutline)?"·경쟁률 데이터":""}를 반영한 추천입니다. 부부는 각자 특공+일반까지 총 4장이 가능합니다.</p>${verifiedNote}<div class="quick-picks">${pickLines}</div><div class="quick-result-actions"><button type="button" class="ghost" data-quick-go="strategy">전체 후보·근거 보기</button><button type="button" class="ghost" data-quick-go="finance">자금 플랜 자세히</button><button type="button" class="ghost" data-quick-go="notice">다른 공고 넣기</button></div></article>`;
  }
  const APPLYHOME_KEY_STORE="subscription_applyhome_key_v3";
  const APPLYHOME_BASE="https://api.odcloud.kr/api/ApplyhomeInfoCmpetRtSvc/v1";
  let applyhomeLastRates=[],applyhomeLastHouse="";
  function applyhomeVal(row,...keys){for(const key of keys){const value=row?.[key];if(value!==undefined&&value!==null&&value!=="")return value}return ""}
  function applyhomeKey(){
    const raw=$("applyhomeKey").value.trim();
    try{return raw.includes("%")?decodeURIComponent(raw):raw}catch{return raw}
  }
  async function applyhomeGet(url){
    const res=await fetch(url);
    let data=null;try{data=await res.json()}catch{}
    if(!res.ok||!data||(typeof data.code==="number"&&data.code<0))throw new Error(data?.msg||`HTTP ${res.status}`);
    return data;
  }
  async function applyhomeSearchProjects(){
    const key=applyhomeKey(),query=$("applyhomeQuery").value.trim();
    if(!key||!query){$("applyhomeResults").innerHTML="<p class='muted'>인증키와 단지명을 모두 입력해 주세요. 주택관리번호를 알면 검색 없이 바로 조회할 수 있습니다.</p>";return}
    localStorage.setItem(APPLYHOME_KEY_STORE,$("applyhomeKey").value.trim());
    $("applyhomeResults").innerHTML="<p class='muted'>청약홈 분양정보를 검색하는 중…</p>";
    try{
      const url=`https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1/getAPTLttotPblancDetail?page=1&perPage=15&serviceKey=${encodeURIComponent(key)}&cond%5BHOUSE_NM%3A%3ALIKE%5D=${encodeURIComponent(query)}`;
      const data=await applyhomeGet(url);
      const rows=(data.data||[]).sort((a,b)=>String(applyhomeVal(b,"RCRIT_PBLANC_DE")).localeCompare(String(applyhomeVal(a,"RCRIT_PBLANC_DE"))));
      $("applyhomeResults").innerHTML=rows.length?`<div class="applyhome-list">${rows.map(row=>{
        const moveIn=String(applyhomeVal(row,"MVN_PREARNGE_YM"));
        return `<button type="button" class="applyhome-item" data-house="${esc(applyhomeVal(row,"HOUSE_MANAGE_NO"))}"><b>${esc(applyhomeVal(row,"HOUSE_NM"))}</b><small>${esc(String(applyhomeVal(row,"HSSPLY_ADRES")))}</small><small>공고 ${esc(String(applyhomeVal(row,"RCRIT_PBLANC_DE")))} · 접수 ${esc(String(applyhomeVal(row,"RCEPT_BGNDE"))||"-")} · 발표 ${esc(String(applyhomeVal(row,"PRZWNER_PRESNATN_DE"))||"-")}${moveIn.length===6?` · 입주 ${moveIn.slice(0,4)}.${moveIn.slice(4)}`:""}</small></button>`;
      }).join("")}</div><div id="applyhomeRateResult"></div>`:"<p class='muted'>검색 결과가 없습니다. 단지명을 핵심 단어만 짧게 입력해 보세요.</p>";
    }catch(error){$("applyhomeResults").innerHTML=`<p class='muted'>단지명 검색 실패: ${esc(error.message)} — 단지명 검색에는 「청약홈 분양정보 조회 서비스」(data.go.kr 15098547)를 별도로 활용신청해야 합니다. 경쟁률 키만 있다면 아래처럼 주택관리번호로 바로 조회하세요(공고문 공급대상 표·청약홈 URL에 있음).</p>`}
  }
  async function applyhomeLoadRates(house,options={}){
    const key=applyhomeKey();
    house=String(house||"").trim();
    if(!key||!house){
      $("applyhomeResults").innerHTML="<p class='muted'>인증키와 주택관리번호를 입력해 주세요.</p>";
      document.querySelector(".applyhome-panel").open=true;
      toast(key?"주택관리번호를 입력해 주세요.":"공공데이터포털 인증키를 먼저 입력해 주세요.");
      return false;
    }
    localStorage.setItem(APPLYHOME_KEY_STORE,$("applyhomeKey").value.trim());
    const target=$("applyhomeRateResult")||$("applyhomeResults");
    target.innerHTML="<p class='muted'>경쟁률·당첨가점·특공 신청현황을 불러오는 중…</p>";
    const cond=`&cond%5BHOUSE_MANAGE_NO%3A%3AEQ%5D=${encodeURIComponent(house)}`;
    const fetchOp=op=>applyhomeGet(`${APPLYHOME_BASE}/${op}?page=1&perPage=300&serviceKey=${encodeURIComponent(key)}${cond}`).then(data=>data.data||[]).catch(()=>null);
    try{
      const [cmpet,score,spsply]=await Promise.all([fetchOp("getAPTLttotPblancCmpet"),fetchOp("getAptLttotPblancScore"),fetchOp("getAPTSpsplyReqstStus")]);
      if(!cmpet||!cmpet.length){target.innerHTML="<p class='muted'>이 관리번호의 접수 결과가 없습니다. 접수 전이거나 번호가 다를 수 있습니다(공고문 공급대상 표의 주택관리번호 확인). 접수 전 단지라면 단지명 검색으로 같은 지역 최근 단지를 참고하세요.</p>";document.querySelector(".applyhome-panel").open=true;return false}
      const byType=new Map();
      const entry=type=>{const clean=String(type).trim();if(!byType.has(clean))byType.set(clean,{type:clean,supply:0,requests:0,cutline:0,cutlineEtc:0,avg:0,special:null});return byType.get(clean)};
      cmpet.forEach(row=>{
        const item=entry(applyhomeVal(row,"HOUSE_TY"));
        item.supply=Math.max(item.supply,num(applyhomeVal(row,"SUPLY_HSHLDCO")));
        item.requests+=num(applyhomeVal(row,"REQ_CNT"));
      });
      (score||[]).forEach(row=>{
        const item=entry(applyhomeVal(row,"HOUSE_TY"));
        const low=num(applyhomeVal(row,"LWET_SCORE")),average=num(applyhomeVal(row,"AVRG_SCORE"));
        if(String(applyhomeVal(row,"RESIDE_SECD"))==="01"&&low>0){item.cutline=low;item.avg=average}
        else if(low>0)item.cutlineEtc=Math.max(item.cutlineEtc,low);
      });
      const SPECIAL_TYPES=[["다자녀","MNYCH"],["신혼","NWWDS_NMTW"],["생애최초","LFE_FRST"],["청년","YGMN"],["노부모","OPS"],["신생아","NWBB_NWBBSHR"]];
      (spsply||[]).forEach(row=>{
        const item=entry(applyhomeVal(row,"HOUSE_TY"));
        const supply=num(applyhomeVal(row,"SPSPLY_HSHLDCO"));
        let requests=0;const parts=[];
        SPECIAL_TYPES.forEach(([label,code])=>{
          const count=num(row[`CRSPAREA_${code}_CNT`])+num(row[`CTPRVN_${code}_CNT`])+num(row[`ETC_AREA_${code}_CNT`]);
          const supplyKey=code==="OPS"?"OLD_PARNTS_SUPORT_HSHLDCO":`${code}_HSHLDCO`;
          const typeSupply=num(row[supplyKey]);
          requests+=count;
          if(typeSupply>0||count>0)parts.push(`${label} ${typeSupply}세대 ${count}명${typeSupply?` (${(count/typeSupply).toFixed(1)}:1)`:""}`);
        });
        requests+=num(row.INSTT_RECOMEND_DCSN_CNT)+num(row.INSTT_RECOMEND_PREPAR_CNT)+num(row.TRANSR_INSTT_ENFSN_CNT);
        item.special={supply,requests,rate:supply?Math.round(requests/supply*10)/10:0,parts};
      });
      applyhomeLastRates=[...byType.values()].map(item=>({...item,rate:item.supply?Math.round(item.requests/item.supply*10)/10:0,cutline:item.cutline||item.cutlineEtc}));
      applyhomeLastHouse=house;
      target.innerHTML=`<div class="table-wrap"><table><thead><tr><th>주택형</th><th>일반공급</th><th>일반 접수</th><th>일반 경쟁률</th><th>최저가점<small>(해당지역)</small></th><th>평균가점</th><th>특공 경쟁률</th></tr></thead><tbody>${applyhomeLastRates.map(item=>`<tr><td><b>${esc(item.type)}</b>${item.special?.parts.length?`<br><span class="muted">${esc(item.special.parts.join(" · "))}</span>`:""}</td><td class="num-cell">${item.supply}</td><td class="num-cell">${item.requests.toLocaleString("ko-KR")}</td><td class="num-cell">${item.rate?item.rate+":1":"-"}</td><td class="num-cell">${item.cutline||"-"}</td><td class="num-cell">${item.avg||"-"}</td><td class="num-cell">${item.special?.rate?item.special.rate+":1":"-"}</td></tr>`).join("")}</tbody></table></div><button type="button" id="applyhomeApply" class="ghost">전용면적이 일치하는 주택형에 경쟁률·커트라인 일괄 적용</button><p class="hint">다른 단지 실적을 참고값으로 쓸 때는 입지·분양가 차이를 감안해 직접 보정하세요. 특공 경쟁률은 유형 합산 평균이며 유형별 격차는 위 상세를 참고하세요.</p>`;
      if(options.autoApply&&applyhomeLastRates.length)applyhomeApplyRates();
      return true;
    }catch(error){target.innerHTML=`<p class='muted'>조회 실패: ${esc(error.message)}</p>`;document.querySelector(".applyhome-panel").open=true;return false}
  }
  function applyhomeApplyRates(){
    normalizeNoticeFinance(notice);
    let applied=0;
    notice.sizes.forEach(size=>{
      let best=null;
      applyhomeLastRates.forEach(item=>{
        const area=parseFloat(String(item.type).replace(/[^0-9.]/g,""));
        if(!area)return;
        const diff=Math.abs(area-num(size.area));
        if(diff<0.005&&(!best||diff<best.diff))best={item,diff};
      });
      const match=best?.item;
      if(!match)return;
      const exp={...notice.expectations[size.name]};
      if(match.rate>0)exp.generalRate=match.rate;
      if(match.cutline>0)exp.cutline=match.cutline;
      if(match.special?.rate>0)exp.specialRate=match.special.rate;
      notice.expectations[size.name]=exp;applied++;
    });
    notice.expectationsSource=applied>0&&String(applyhomeLastHouse)===String(notice.houseManageNo||"")?"actual":"";
    renderExpectations();saveCurrentNotice(false);calculate();
    toast(applied?`${applied}개 주택형에 경쟁률·커트라인을 적용했습니다.`:"전용면적이 일치하는 주택형이 없어 자동 적용하지 못했습니다. 표를 보고 직접 입력해 주세요.");
  }
  const APPLYHOME_DETAIL_BASE="https://api.odcloud.kr/api/ApplyhomeInfoDetailSvc/v1";
  const LIVE_CACHE_KEY="subscription_live_notices_v3";
  let liveNotices=[],liveIndex=0,liveTimer=null;
  function todayStr(){const n=new Date();return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`}
  function addDaysStr(days){const n=new Date();n.setDate(n.getDate()+days);return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`}
  function liveStatus(row){
    const today=todayStr();
    if(row.start&&row.end){
      if(today<row.start)return {label:`접수예정 ${row.start.slice(5).replace("-",".")}`,cls:"soon"};
      if(today<=row.end)return {label:"접수중",cls:"open"};
    }
    return {label:`접수마감${row.announce?` · 발표 ${row.announce.slice(5).replace("-",".")}`:""}`,cls:"closed"};
  }
  function startLiveRotation(){
    clearInterval(liveTimer);
    if(!liveNotices.length)return;
    const render=()=>{
      const row=liveNotices[liveIndex%liveNotices.length];
      const status=liveStatus(row);
      $("liveBannerText").textContent=`[${row.area}] ${row.name} · ${status.label}`;
      $("liveBannerMain").dataset.house=row.no;
    };
    render();
    liveTimer=setInterval(()=>{if($("liveBannerList").classList.contains("is-hidden")){liveIndex++;render()}},2000);
  }
  async function loadLiveNotices(){
    const key=applyhomeKey();
    if(!key){$("liveBannerText").textContent="공공데이터포털 키를 등록하면 서울·경기 실시간 공고가 표시됩니다 (탭하여 등록)";$("liveBannerMain").dataset.house="";return}
    const today=todayStr();
    const cached=readStorage(LIVE_CACHE_KEY,null);
    if(cached&&cached.date===today&&Array.isArray(cached.rows)&&cached.rows.length){liveNotices=cached.rows;startLiveRotation();return}
    try{
      const since=addDaysStr(-80);
      const fetchArea=area=>applyhomeGet(`${APPLYHOME_DETAIL_BASE}/getAPTLttotPblancDetail?page=1&perPage=100&serviceKey=${encodeURIComponent(key)}&cond%5BSUBSCRPT_AREA_CODE_NM%3A%3AEQ%5D=${encodeURIComponent(area)}&cond%5BRCRIT_PBLANC_DE%3A%3AGTE%5D=${since}`).then(data=>data.data||[]);
      const [seoul,gyeonggi]=await Promise.all([fetchArea("서울"),fetchArea("경기")]);
      const statusOrder={open:0,soon:1,closed:2};
      liveNotices=[...seoul,...gyeonggi].map(row=>({no:String(applyhomeVal(row,"HOUSE_MANAGE_NO")),name:String(applyhomeVal(row,"HOUSE_NM")),area:String(applyhomeVal(row,"SUBSCRPT_AREA_CODE_NM")),notice:String(applyhomeVal(row,"RCRIT_PBLANC_DE")),start:String(applyhomeVal(row,"RCEPT_BGNDE")),end:String(applyhomeVal(row,"RCEPT_ENDDE")),announce:String(applyhomeVal(row,"PRZWNER_PRESNATN_DE"))}))
        .filter(row=>row.no&&(row.end>=today||row.notice>=addDaysStr(-35)))
        .sort((a,b)=>statusOrder[liveStatus(a).cls]-statusOrder[liveStatus(b).cls]||String(a.end).localeCompare(String(b.end)));
      localStorage.setItem(LIVE_CACHE_KEY,JSON.stringify({date:today,rows:liveNotices}));
      if(liveNotices.length)startLiveRotation();
      else $("liveBannerText").textContent="현재 서울·경기에 진행 중인 모집공고가 없습니다";
    }catch(error){$("liveBannerText").textContent="실시간 공고 조회 실패 — 인증키와 트래픽을 확인하세요"}
  }
  function renderLiveList(){
    const items=liveNotices.length?liveNotices.map(row=>{
      const status=liveStatus(row);
      return `<button type="button" class="live-item" data-live-house="${esc(row.no)}"><span class="live-status ${status.cls}">${esc(status.label)}</span><b>${esc(row.name)}</b><small>${esc(row.area)} · 공고 ${esc(row.notice)}${row.announce?` · 발표 ${esc(row.announce)}`:""}</small></button>`;
    }).join(""):`<div class="live-empty">표시할 공고가 없습니다. 인증키 등록 후 새로고침해 주세요.</div>`;
    $("liveBannerList").innerHTML=items+`<div class="live-list-foot"><button type="button" id="liveRefresh">목록 지금 새로고침</button><small>공공데이터 API는 청약홈 사이트 게시보다 최대 하루가량 늦게 반영될 수 있습니다. 방금 올라온 공고는 PDF 업로드로 먼저 분석하세요.</small></div>`;
  }
  async function applyRemoteNotice(house){
    const key=applyhomeKey();
    if(!key||!house)return;
    toast("청약홈에서 공고 정보를 불러오는 중…");
    try{
      const cond=`&cond%5BHOUSE_MANAGE_NO%3A%3AEQ%5D=${encodeURIComponent(house)}`;
      const [detailData,mdlData]=await Promise.all([
        applyhomeGet(`${APPLYHOME_DETAIL_BASE}/getAPTLttotPblancDetail?page=1&perPage=3&serviceKey=${encodeURIComponent(key)}${cond}`),
        applyhomeGet(`${APPLYHOME_DETAIL_BASE}/getAPTLttotPblancMdl?page=1&perPage=50&serviceKey=${encodeURIComponent(key)}${cond}`)
      ]);
      const detail=(detailData.data||[])[0],mdl=mdlData.data||[];
      if(!detail||!mdl.length){toast("공고 상세를 불러오지 못했습니다. PDF 업로드를 이용해 주세요.");return}
      const typeName=raw=>{const match=String(raw).trim().match(/^0*(\d+)\.\d+\s*([A-Z]*)$/);return match?String(Number(match[1]))+(match[2]||""):String(raw).trim()};
      const sizes=mdl.map(m=>{
        const general=num(m.SUPLY_HSHLDCO),special=num(m.SPSPLY_HSHLDCO);
        return {name:typeName(m.HOUSE_TY),area:parseFloat(String(m.HOUSE_TY).trim())||num(m.SUPLY_AR)||0,total:general+special,agency:num(m.INSTT_RECOMEND_HSHLDCO),multi:num(m.MNYCH_HSHLDCO),newly:num(m.NWWDS_HSHLDCO),elder:num(m.OLD_PARNTS_SUPORT_HSHLDCO),first:num(m.LFE_FRST_HSHLDCO),baby:num(m.NWBB_HSHLDCO),general};
      });
      const pricing=mdl.map(m=>({size:typeName(m.HOUSE_TY),min:num(m.LTTOT_TOP_AMOUNT)*10000,max:num(m.LTTOT_TOP_AMOUNT)*10000,options:[]}));
      const contractDate=R.normalizeDate(applyhomeVal(detail,"CNTRCT_CNCLS_BGNDE"));
      const moveInRaw=String(applyhomeVal(detail,"MVN_PREARNGE_YM"));
      const moveInDate=moveInRaw.length===6?`${moveInRaw.slice(0,4)}-${moveInRaw.slice(4)}-01`:"";
      const interimDates=[];
      if(contractDate&&moveInDate){
        const startMs=new Date(contractDate+"T00:00:00").getTime()+90*86400000;
        const endMs=new Date(moveInDate+"T00:00:00").getTime()-90*86400000;
        if(endMs>startMs)for(let index=0;index<6;index++){const t=new Date(startMs+(endMs-startMs)*index/5);interimDates.push(`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`)}
      }
      const payments=[{kind:"contract",label:"계약금",rate:10,dueDate:"",dueLabel:"계약 시"},...Array.from({length:6},(_,index)=>({kind:"interim",label:`중도금 ${index+1}차`,rate:10,dueDate:interimDates[index]||"",dueLabel:interimDates[index]?"":"공고문 확인"})),{kind:"balance",label:"잔금",rate:30,dueDate:"",dueLabel:"입주 지정일"}];
      const overheated=String(applyhomeVal(detail,"SPECLT_RDN_EARTH_AT")).toUpperCase()==="Y";
      const adjusted=String(applyhomeVal(detail,"MDAT_TRGET_AREA_SECD")).toUpperCase().startsWith("Y");
      const areaName=String(applyhomeVal(detail,"SUBSCRPT_AREA_CODE_NM"));
      const existingId=Object.values(notices).find(item=>String(item.houseManageNo)===String(house))?.id;
      notice={
        id:existingId||"applyhome-"+house,houseManageNo:String(house),projectName:String(applyhomeVal(detail,"HOUSE_NM")),
        noticeDate:R.normalizeDate(applyhomeVal(detail,"RCRIT_PBLANC_DE")),location:String(applyhomeVal(detail,"HSSPLY_ADRES")),
        announceDate:R.normalizeDate(applyhomeVal(detail,"PRZWNER_PRESNATN_DE")),
        housingType:"private",priorityRegion:areaName==="서울"?"서울특별시":areaName==="경기"?"경기도":areaName,priorityYears:2,
        specialMonths:6,generalMonths:24,generalHeadRequired:overheated||adjusted?"yes":"no",
        pointRates:overheated?{small:40,medium:70,large:80}:adjusted?{small:40,medium:70,large:50}:{small:40,medium:40,large:0},
        verified:false,sourceFile:"청약홈 API 자동 구성",parseConfidence:70,
        sizes,pricing,payments,options:[],interimLoanModes:payments.filter(row=>row.kind==="interim").map(()=>"review"),
        interimLoanSource:"납부일정·중도금 대출은 표준(10/60/30) 가정 — 공고문 PDF 검수 권장",paymentConfidence:40,
        expectedContractDate:contractDate,expectedMoveInDate:moveInDate,expectedMoveInLabel:moveInRaw.length===6?`${moveInRaw.slice(0,4)}년 ${moveInRaw.slice(4)}월 예정`:"",expectations:{}
      };
      $("planPrice").value="";
      saveCurrentNotice(false);renderNotice();initQuickFromDetail();calculate();
      $("liveBannerList").classList.add("is-hidden");
      applyModelPrediction(true);
      if(document.body.classList.contains("simple-mode")){setPanel("quick");if($("quickResult").innerHTML)renderQuickResult()}
      toast(`'${notice.projectName}' 공고를 적용했습니다. 물량·분양가는 청약홈 기준, 납부일정은 표준 가정, 경쟁률은 과거 유사단지 추정입니다.`);
    }catch(error){console.error(error);toast("공고 적용 실패: "+error.message)}
  }
  function noticeSido(){
    const value=String(notice.priorityRegion||notice.location||"");
    return /서울/.test(value)?"서울":/인천/.test(value)?"인천":/경기/.test(value)?"경기":"";
  }
  function noticeGu(){
    const match=String(notice.location||"").match(/(?:서울|경기|인천)[^\s]*\s+([가-힣]+[시군구])/);
    return match?match[1]:"";
  }
  function modelSegmentFor(area){
    const M=window.SubscriptionModel;
    const sido=noticeSido();
    if(!M||!sido)return null;
    const gu=noticeGu();
    const band=area<=60?"s":area<=85?"m":"l";
    const tries=[["gu_band",[sido,gu,band]],["gu",[sido,gu]],["sido_band",[sido,band]],["sido",[sido]]];
    for(const [name,parts] of tries){
      if(name.startsWith("gu")&&!gu)continue;
      const seg=M.segments[`${name}::${parts.join("|")}`];
      if(seg)return {...seg,level:name,sido,gu,band};
    }
    return null;
  }
  function applyModelPrediction(auto=false){
    normalizeNoticeFinance(notice);
    if(notice.expectationsSource==="actual"){if(!auto)toast("이미 실제 접수결과가 적용되어 있어 예측으로 덮지 않습니다.");return false}
    let applied=0;
    const lines=[];
    notice.sizes.forEach(size=>{
      const seg=modelSegmentFor(num(size.area));
      if(!seg)return;
      const exp={...notice.expectations[size.name]};
      if(!exp.generalRate&&seg.r50>0){exp.generalRate=seg.r50;applied++}
      if(!exp.cutline&&seg.c50){exp.cutline=seg.c50;applied++}
      notice.expectations[size.name]=exp;
      lines.push(`${size.name} — 일반 ${seg.r25}~${seg.r75}:1 (중앙 ${seg.r50})${seg.c50?` · 커트라인 ${seg.c25}~${seg.c75}점 (중앙 ${seg.c50})`:""} · ${seg.level.startsWith("gu")?seg.gu:seg.sido} 유사사례 ${seg.n}건`);
    });
    if(!applied){if(!auto)toast("채울 값이 없습니다. 이미 입력돼 있거나 이 지역의 과거 데이터가 부족합니다.");return false}
    notice.expectationsSource="model";
    $("modelNote").innerHTML=`<b>과거 유사단지 분포 (수도권 2021.01~2026.08 · 838단지)</b><br>${lines.map(esc).join("<br>")}<br><small>시간 홀드아웃 검증: 실측의 39%만 위 25~75% 범위 안, 63%가 그 2.2배 확장범위 안이었습니다. 개별 단지의 입지·분양가 매력에 따라 크게 벗어날 수 있는 참고 범위입니다.</small>`;
    renderExpectations();saveCurrentNotice(false);calculate();
    if(!auto)toast("과거 데이터 기반 예측을 채웠습니다.");
    return true;
  }
  function withNotice(target,fn){
    const saved=notice;
    notice=normalizeNoticeFinance(clone(target));
    try{return fn()}finally{notice=saved}
  }
  function renderCompareChoices(){
    if(!$("compareChoices"))return;
    const list=Object.values(notices).sort((a,b)=>String(b.noticeDate).localeCompare(String(a.noticeDate)));
    $("compareChoices").innerHTML=list.length>=2?list.map(item=>`<label class="compare-choice"><input type="checkbox" data-compare-id="${esc(item.id)}"${item.id===notice.id?" checked":""}><span><b>${esc(item.projectName||"이름 없음")}</b><small>공고 ${esc(item.noticeDate||"-")} · 발표 ${esc(item.announceDate||"미확인")}</small></span></label>`).join(""):`<p class="muted">비교하려면 공고가 2개 이상 필요합니다. 상단 실시간 배너를 탭하거나 PDF를 올려 공고를 불러오면 자동으로 저장 목록에 쌓입니다.</p>`;
  }
  function evaluateNoticeForCompare(target){
    return withNotice(target,()=>{
      const profile=profileData();
      const aRows=candidateRows("a",profile),bRows=R.hasSecondApplicant(profile)?candidateRows("b",profile):[];
      const plans=buildPlans(aRows,bRows,profile);
      const rank=rows=>rows.filter(Boolean).sort((x,y)=>((y.winChance??y.score/300))-((x.winChance??x.score/300)))[0]||null;
      const best=rank([plans.a.special,plans.a.general]);
      const bBest=plans.useB?rank([plans.b.special,plans.b.general]):null;
      const funding=best?quickFundingCheck(best.size):null;
      const metric=best?(best.winChance!==null&&best.winChance!==undefined?best.winChance:best.score/300):-1;
      return {id:target.id,name:target.projectName||"이름 없음",announce:target.announceDate||"",best,bBest,funding,metric,verified:target.verified};
    });
  }
  function runCompare(){
    const ids=[...document.querySelectorAll("[data-compare-id]:checked")].map(input=>input.dataset.compareId).slice(0,4);
    if(ids.length<2){$("compareResult").innerHTML="<p class='muted'>2개 이상 선택해 주세요.</p>";return}
    const results=ids.map(id=>evaluateNoticeForCompare(notices[id])).sort((a,b)=>b.metric-a.metric);
    const knownAnnounce=results.filter(row=>row.announce);
    const sameAnnounce=knownAnnounce.length===results.length&&new Set(results.map(row=>row.announce)).size===1;
    const married=R.hasSecondApplicant(profileData())&&$("bothApply").checked;
    const rowsHtml=results.map((row,index)=>{
      const pickText=row.best?`${R.TYPE_LABELS[row.best.type]} · ${row.best.size} (${chanceLabel(row.best)})`:"신청 가능 유형 없음";
      const fundText=!row.funding?"분양가·일정 미확인":row.funding.loanShortage>0?`부족 ${formatWonShort(row.funding.loanShortage)}`:row.funding.firstShortage?`중간 공백 ${formatWonShort(row.funding.firstShortage.shortage)}`:`가능 · 여유 ${formatWonShort(row.funding.finalSurplus)}`;
      const fundCls=!row.funding?"warn":row.funding.loanShortage>0?"bad":row.funding.firstShortage?"warn":"ok";
      return `<tr class="${index===0?"compare-winner":""}"><td>${index===0?"🏆 ":""}<b>${esc(row.name)}</b>${row.verified?"":"<br><small class='muted'>미검수</small>"}</td><td>${esc(row.announce||"미확인")}</td><td>${esc(pickText)}</td><td><span class="compare-fund ${fundCls}">${esc(fundText)}</span></td></tr>`;
    }).join("");
    let verdict="";
    if(knownAnnounce.length<results.length)verdict+=`일부 단지의 발표일이 미확인이라 규정 판정이 불완전합니다(공고 화면에서 발표일 입력 가능). `;
    if(sameAnnounce){
      const first=results[0],second=results[1];
      verdict+=`이 단지들은 당첨자 발표일(${esc(first.announce)})이 같아 <b>1인은 한 단지에만 신청</b>할 수 있습니다(같은 단지 내 특공+일반 각 1건은 예외, 위반 시 모두 무효). `;
      verdict+=married&&second?`추천 배분 — <b>나는 ${esc(first.name)}</b>${first.best?` (${esc(R.TYPE_LABELS[first.best.type])} ${esc(first.best.size)})`:""}, <b>배우자는 ${esc(second.name)}</b>${(second.bBest||second.best)?` (${esc(R.TYPE_LABELS[(second.bBest||second.best).type])} ${esc((second.bBest||second.best).size)})`:""}. 부부는 각자 1건씩 가능하므로 두 단지를 나눠 커버하고, 중복당첨 시 접수일시가 빠른 건이 유효하니 첫날 이른 시간에 접수하세요.`:`추천 — <b>${esc(first.name)}</b> 한 곳에 집중하세요.`;
    }else{
      verdict+=`발표일이 서로 달라 전부 신청할 수 있습니다. 단 <b>발표일이 빠른 단지에 당첨되면 늦은 단지의 당첨은 자동 취소</b>되므로, 더 원하는 단지의 발표가 늦다면 앞 단지는 '당첨돼도 계약할 단지'인지 확인 후 넣으세요. 종합 우선순위: ${results.map((row,index)=>`<b>${index+1}. ${esc(row.name)}</b>`).join(" → ")}`;
    }
    $("compareResult").innerHTML=`<div class="compare-verdict">${verdict}</div><div class="table-wrap"><table><thead><tr><th>단지</th><th>당첨자 발표일</th><th>내 최선 신청</th><th>자금 판정</th></tr></thead><tbody>${rowsHtml}</tbody></table><p class="hint">순위 = 당첨확률(경쟁률·커트라인 입력 시) 또는 전략지수 기준. 규정 근거: 주택공급규칙 — 동일 발표일 주택 1인 1건, 부부 각자 신청 가능, 부부 중복당첨 시 접수 빠른 건 유효.</p>`;
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
    const expCount=notice.sizes.filter(size=>{const exp=sizeExpectation(size.name);return exp.cutline||exp.generalRate||exp.specialRate}).length;
    if(expCount&&expCount<notice.sizes.length)warnings.push(`경쟁률·커트라인이 ${expCount}/${notice.sizes.length}개 주택형에만 입력되어, 확률 추정 주택형과 전략지수 주택형의 순위 비교가 왜곡될 수 있습니다. 가능하면 모든 주택형에 입력하세요.`);
    $("strategyWarning").innerHTML=warnings.map(message=>`<div class="alert warn">${esc(message)}</div>`).join("");
    renderGeneralSeats();renderSpecialSeats(profile);
    const aRows=candidateRows("a",profile),bRows=R.hasSecondApplicant(profile)?candidateRows("b",profile):[];
    renderRecommendation(aRows,bRows,profile);
    renderCandidates([...aRows,...bRows].sort((a,b)=>b.score-a.score));
    renderEligibility(profile);
    renderStrategyTips(profile,[...aRows,...bRows]);
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
    if(field==="name"){
      const price=notice.pricing?.find(row=>row.size===previousName);if(price)price.size=input.value;
      (notice.options||[]).forEach(row=>{if(row.size===previousName)row.size=input.value});
      if(notice.expectations?.[previousName]&&!notice.expectations[input.value]){notice.expectations[input.value]=notice.expectations[previousName];delete notice.expectations[previousName]}
    }
    markUnverified();renderSupplyTotal();
  });
  $("supplyRows").addEventListener("click",event=>{
    const button=event.target.closest("[data-delete]");if(!button)return;
    const index=num(button.dataset.delete),removed=notice.sizes[index];notice.sizes.splice(index,1);notice.pricing=(notice.pricing||[]).filter(row=>row.size!==removed?.name);notice.options=(notice.options||[]).filter(row=>row.size!==removed?.name);if(notice.expectations)delete notice.expectations[removed?.name];markUnverified();renderSupplyRows();renderPaymentNotice();renderFinanceControls(true);renderExpectations();
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
    notice={...clone(DEFAULT_NOTICE),id:"notice-"+Date.now(),projectName:"",noticeDate:"",location:"",priorityRegion:"",priorityYears:0,verified:false,sourceFile:"",parseConfidence:0,sizes:[],pricing:[],payments:[],options:[],interimLoanModes:[],interimLoanSource:"",paymentConfidence:0,expectedContractDate:"",expectedMoveInDate:"",expectedMoveInLabel:""};
    $("planPrice").value="";renderNotice();renderFundingPlan();toast("빈 공고를 만들었습니다.");
  });
  async function importPdf(file,statusEl){
    if(!file)return;
    statusEl=statusEl||$("parseStatus");
    try{
      const extracted=await extractPdf(file,statusEl);
      notice=parseAnnouncement(extracted.lines,file.name);$("planPrice").value="";
      renderNotice();
      const message=notice.sizes.length
        ?`${extracted.pages}쪽 분석 완료 · 주택형 ${notice.sizes.length}개 · 분양가 ${notice.pricing.filter(row=>num(row.max)>0).length}개 · 납부회차 ${notice.payments.length}개 · 발코니·옵션 ${notice.options.length}개 감지. 모든 숫자를 원문과 대조해 주세요.`
        :`${extracted.pages}쪽을 읽었지만 공급표를 찾지 못했습니다. 표가 이미지이거나 주택형이 가로로 나열된 특수 양식일 수 있습니다. 상세 모드에서 평형·물량을 직접 입력해 주세요.`;
      $("parseStatus").textContent=message;
      $("quickParseStatus").textContent=message;
      initQuickFromDetail();
      calculate();
      applyModelPrediction(true);
      if(document.body.classList.contains("simple-mode")&&$("quickResult").innerHTML)renderQuickResult();
      toast("PDF 분석 초안을 만들었습니다.");
    }catch(error){
      console.error(error);
      const failure="PDF 자동 분석에 실패했습니다. 인터넷 연결을 확인하거나 상세 모드에서 숫자를 직접 입력해 주세요.";
      $("parseStatus").textContent=failure;
      $("quickParseStatus").textContent=failure;
    }
  }
  $("pdfFile").addEventListener("change",event=>{importPdf(event.target.files[0],$("parseStatus"));event.target.value=""});
  $("quickPdfFile").addEventListener("change",event=>{importPdf(event.target.files[0],$("quickParseStatus"));event.target.value=""});
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
  let expectationTimer;
  $("expectationRows").addEventListener("input",event=>{
    const input=event.target.closest("[data-exp-field]");if(!input)return;
    const sizeName=input.closest("tr").dataset.expSize,field=input.dataset.expField;
    normalizeNoticeFinance(notice);
    notice.expectations[sizeName]={...notice.expectations[sizeName],[field]:num(input.value)};
    notice.expectationsSource="";
    $("expectationSourceBadge")?.classList.add("is-hidden");
    clearTimeout(expectationTimer);expectationTimer=setTimeout(()=>{saveCurrentNotice(false);calculate()},400);
  });
  $("applyhomeSearch").addEventListener("click",applyhomeSearchProjects);
  $("applyhomeDirect").addEventListener("click",()=>applyhomeLoadRates($("applyhomeManageNo").value));
  $("autoApplyData").addEventListener("click",()=>applyhomeLoadRates($("applyhomeManageNo").value||notice.houseManageNo,{autoApply:true}));
  ["minArea","mode","bothApply","allowSpecialGeneral","diversify"].forEach(id=>$(id)?.addEventListener("change",calculate));
  $("applyhomeResults").addEventListener("click",event=>{
    const item=event.target.closest(".applyhome-item");
    if(item){$("applyhomeManageNo").value=item.dataset.house;applyhomeLoadRates(item.dataset.house);return}
    if(event.target.closest("#applyhomeApply"))applyhomeApplyRates();
  });
  $("applyhomeKey").value=localStorage.getItem(APPLYHOME_KEY_STORE)||"";
  let applyhomeKeySaveTimer;
  $("applyhomeKey").addEventListener("input",()=>{
    clearTimeout(applyhomeKeySaveTimer);
    applyhomeKeySaveTimer=setTimeout(()=>{
      localStorage.setItem(APPLYHOME_KEY_STORE,$("applyhomeKey").value.trim());
      if(applyhomeKey()){localStorage.removeItem(LIVE_CACHE_KEY);toast("인증키를 저장했습니다. 실시간 공고를 불러옵니다.");loadLiveNotices()}
    },600);
  });
  $("openAdvanced").addEventListener("click",()=>setUiMode(false));
  $("backToQuick").addEventListener("click",()=>setUiMode(true));
  document.querySelectorAll('input[name="quickFamily"]').forEach(input=>input.addEventListener("change",updateQuickVisibility));
  let quickSyncTimer;
  const quickLiveSync=()=>{clearTimeout(quickSyncTimer);quickSyncTimer=setTimeout(()=>{syncQuickToDetail();if($("quickResult").innerHTML){calculate();renderQuickResult()}},500)};
  QUICK_FIELD_MAP.forEach(([from])=>$(from)?.addEventListener("input",quickLiveSync));
  ["quickNoHome","quickNeverHome","quickHead"].forEach(id=>$(id)?.addEventListener("change",quickLiveSync));
  document.querySelectorAll('input[name="quickFamily"]').forEach(input=>input.addEventListener("change",quickLiveSync));
  $("quickCalculate").addEventListener("click",()=>{syncQuickToDetail();calculate();renderQuickResult()});
  $("quickResult").addEventListener("click",event=>{
    const button=event.target.closest("[data-quick-go]");
    if(button){setUiMode(false,button.dataset.quickGo);return}
    const pick=event.target.closest(".quick-pick");
    if(pick)pick.querySelector(".quick-pick-detail")?.classList.toggle("is-hidden");
  });
  $("priceChips").addEventListener("click",event=>{
    const chip=event.target.closest("[data-price]");
    if(!chip)return;
    $("planPrice").value=formatNumberInput(chip.dataset.price);
    $("collateralValue").value=formatNumberInput(chip.dataset.price);
    queueFundingSave();renderFundingPlan();
  });
  $("liveBannerToggle").addEventListener("click",()=>{
    const list=$("liveBannerList");
    if(list.classList.contains("is-hidden")){renderLiveList();list.classList.remove("is-hidden");$("liveBannerToggle").textContent="▴"}
    else{list.classList.add("is-hidden");$("liveBannerToggle").textContent="▾"}
  });
  $("liveBannerMain").addEventListener("click",()=>{
    const house=$("liveBannerMain").dataset.house;
    if(house)applyRemoteNotice(house);
    else{setUiMode(false,"strategy");document.querySelector(".applyhome-panel").open=true;$("applyhomeKey").focus()}
  });
  $("liveBannerList").addEventListener("click",async event=>{
    if(event.target.closest("#liveRefresh")){
      localStorage.removeItem(LIVE_CACHE_KEY);
      $("liveBannerText").textContent="서울·경기 실시간 공고 다시 불러오는 중…";
      await loadLiveNotices();
      renderLiveList();
      toast(`공고 ${liveNotices.length}건을 다시 불러왔습니다.`);
      return;
    }
    const item=event.target.closest("[data-live-house]");
    if(item)applyRemoteNotice(item.dataset.liveHouse);
  });
  $("runCompare").addEventListener("click",runCompare);
  $("modelFill").addEventListener("click",()=>applyModelPrediction(false));
$("planSize").addEventListener("change",()=>{renderFinanceControls(true);renderFundingPlan()});
  $("optionChoices").addEventListener("change",event=>{if(!event.target.matches("[data-option-id]"))return;updateOptionSummary();saveFundingInputs();renderFundingPlan()});
  $("interimFundingChoices").addEventListener("change",event=>{if(!event.target.matches("[data-interim-mode]"))return;saveFundingInputs();renderFundingPlan()});
  let fundingRenderTimer;
  FINANCE_IDS.filter(id=>id!=="planSize").forEach(id=>$(id)?.addEventListener("input",()=>{queueFundingSave();clearTimeout(fundingRenderTimer);fundingRenderTimer=setTimeout(renderFundingPlan,250)}));
  $("calculateFunding").addEventListener("click",renderFundingPlan);

  wrapSuffixInputs();setupDateInputs();loadProfile();setupMoneyInputs();attachMoneyEcho();loadFundingInputs();renderNotice();renderProfileSummary();calculate();renderFundingPlan();
  setUiMode((localStorage.getItem(UI_MODE_KEY)||"simple")==="simple");
  loadLiveNotices();
})();
