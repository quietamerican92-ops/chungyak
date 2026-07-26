const assert=require("assert");
const R=require("./rules.js");
const rates={small:40,medium:70,large:80};

assert.deepStrictEqual(R.generalAllocation(10,36.9533,rates),{total:10,area:36.9533,pointRate:40,lotteryRate:60,point:4,lottery:6,noHomePriority:5,lotteryRemainder:1});
assert.strictEqual(R.generalAllocation(33,59.9667,rates).point,14);
assert.strictEqual(R.generalAllocation(33,59.9667,rates).lottery,19);
assert.strictEqual(R.generalAllocation(17,59.9424,rates).point,7);
assert.strictEqual(R.generalAllocation(2,84.9807,rates).point,2);
assert.strictEqual(R.generalAllocation(2,84.9807,rates).lottery,0);

assert.deepStrictEqual(R.specialAllocation(3),{total:3,stage1:2,stage2:1,stage3:0,firstRate:50,secondRate:20});
assert.deepStrictEqual(R.specialAllocation(6),{total:6,stage1:3,stage2:2,stage3:1,firstRate:50,secondRate:20});
assert.deepStrictEqual(R.specialAllocation(1),{total:1,stage1:1,stage2:0,stage3:0,firstRate:50,secondRate:20});
assert.deepStrictEqual(R.availableSpecialStages(3,R.specialAllocation(3)),[]);
assert.deepStrictEqual(R.availableSpecialStages(2,R.specialAllocation(3)),[2]);
assert.deepStrictEqual(R.availableSpecialStages(2,R.specialAllocation(6)),[2,3]);

const marriedProfile={
  profileType:"married",marriageDate:"2022-07-01",children:1,fetuses:1,infants:0,residenceStart:"2010-01-01",householdSize:4,assetOk:true,
  noHome:true,neverHome:true,specialClean:true,reWinClean:true,youngestBirth:"2025-08-01",
  people:{
    a:{account:"2020-01-01",birth:"1990-01-01",otherDependents:0,monthlyIncome:5000000,head:true,deposit:true,tax5:true,elder3:false,elderNoHome:false,agency:false,threeGeneration:false,singleParent5:false},
    b:{account:"2020-01-01",birth:"1992-01-01",otherDependents:0,monthlyIncome:4000000,head:false,deposit:true,tax5:true,elder3:false,elderNoHome:false,agency:false,threeGeneration:false,singleParent5:false}
  }
};
const notice={noticeDate:"2026-07-16",specialMonths:6,generalMonths:24,generalHeadRequired:"yes"};
assert.strictEqual(R.specialChildCount(marriedProfile),2);
assert.strictEqual(R.generalChildCount(marriedProfile),1);
assert.strictEqual(R.automaticHouseholdSize(marriedProfile),4);
assert.strictEqual(R.incomeBase100(1),7533763);
assert.strictEqual(R.incomeBase100(4),8802202);
assert.strictEqual(R.incomeBase100(9),11644097);
assert.strictEqual(R.publishedIncomeThreshold(4,130),11442863);
assert.strictEqual(R.incomeMetrics(marriedProfile).dualIncome,true);
assert.strictEqual(R.incomeStage("newly",marriedProfile).stage,1);
const stage2Profile=JSON.parse(JSON.stringify(marriedProfile));
stage2Profile.people.a.monthlyIncome=6000000;
stage2Profile.people.b.monthlyIncome=6000000;
assert.strictEqual(R.incomeStage("newly",stage2Profile).stage,2);
const stage3Profile=JSON.parse(JSON.stringify(marriedProfile));
stage3Profile.people.a.monthlyIncome=9000000;
stage3Profile.people.b.monthlyIncome=9000000;
assert.strictEqual(R.incomeStage("newly",stage3Profile).stage,3);
assert.strictEqual(R.eligibility("a",marriedProfile,notice).multi.ok,true);
assert.strictEqual(R.eligibility("a",marriedProfile,notice).newly.ok,true);
assert.strictEqual(R.eligibility("a",marriedProfile,notice).newly.newlyRank,2);
const generalA=R.generalScore("a",marriedProfile,notice);
assert.deepStrictEqual({total:generalA.points,noHome:generalA.noHomePoints,dependents:generalA.dependentPoints,account:generalA.accountPoints},{total:40,noHome:14,dependents:15,account:11});
const multiA=R.multiScore("a",marriedProfile,notice);
assert.deepStrictEqual({total:multiA.points,children:multiA.childPoints,infants:multiA.infantPoints,noHome:multiA.noHomePoints,residence:multiA.residencePoints,account:multiA.accountPoints},{total:65,children:25,infants:5,noHome:20,residence:15,account:0});
const cappedAccountProfile=JSON.parse(JSON.stringify(marriedProfile));
cappedAccountProfile.people.a.account="2000-01-01";
assert.strictEqual(R.generalScore("a",cappedAccountProfile,notice).accountPoints,17);
const maxScoreProfile=JSON.parse(JSON.stringify(marriedProfile));
maxScoreProfile.children=4;maxScoreProfile.fetuses=0;maxScoreProfile.infants=3;maxScoreProfile.residenceStart="2000-01-01";
maxScoreProfile.people.a.birth="1970-01-01";maxScoreProfile.people.a.account="2000-01-01";maxScoreProfile.people.a.otherDependents=1;maxScoreProfile.people.a.threeGeneration=true;
assert.strictEqual(R.generalScore("a",maxScoreProfile,notice).points,84);
assert.strictEqual(R.multiScore("a",maxScoreProfile,notice).points,100);

const singleProfile=JSON.parse(JSON.stringify(marriedProfile));
singleProfile.profileType="single";singleProfile.singleHouseholdKind="solo";
singleProfile.children=0;singleProfile.fetuses=0;singleProfile.householdSize=1;singleProfile.people.a.monthlyIncome=3000000;
assert.strictEqual(R.hasSecondApplicant(singleProfile),false);
assert.strictEqual(R.eligibility("a",singleProfile,notice).newly.ok,false);
assert.strictEqual(R.eligibility("a",singleProfile,notice).first.singleHousehold,true);
assert.strictEqual(R.eligibility("a",singleProfile,notice).first.singleHouseholdAreaLimited,true);
assert.strictEqual(R.eligibility("b",singleProfile,notice).general.ok,false);

assert.strictEqual(R.normalizeDate("2026.07.16"),"2026-07-16");
assert.strictEqual(R.normalizeDate("20260716"),"2026-07-16");
assert.strictEqual(R.normalizeDate("2026-02-30"),"");

const paymentFixture=[
  "■ 공급금액 및 납부일정 (단위 : 원)",
  "계약금 (10%) 중도금(60%) 잔금(30%)",
  "1차(10%) 2차(10%) 3차(10%) 4차(10%) 5차(10%) 6차(10%) 입주",
  "계약시 2027.01.30. 2027.05.31. 2027.10.29. 2028.03.30. 2028.08.30. 2029.01.30. 지정일",
  "36 20 5~9층 6 395,560,000 286,440,000 682,000,000 68,200,000 68,200,000 68,200,000 68,200,000 68,200,000 68,200,000 68,200,000 204,600,000",
  "10~14층 9 401,592,000 290,808,000 692,400,000 69,240,000 69,240,000 69,240,000 69,240,000 69,240,000 69,240,000 69,240,000 207,720,000",
  "15~19층 5 403,622,000 292,278,000 695,900,000 69,590,000 69,590,000 69,590,000 69,590,000 69,590,000 69,590,000 69,590,000 208,770,000",
  "59A 71 2층 7 688,866,000 498,834,000 1,187,700,000 118,770,000 118,770,000 118,770,000 118,770,000 118,770,000 118,770,000 118,770,000 356,310,000"
];
const parsedPayments=R.parsePaymentData(paymentFixture,[{name:"36",total:20},{name:"59A",total:7}]);
assert.deepStrictEqual(parsedPayments.payments.map(row=>row.rate),[10,10,10,10,10,10,10,30]);
assert.strictEqual(parsedPayments.payments[1].dueDate,"2027-01-30");
assert.deepStrictEqual(parsedPayments.pricing.map(row=>({size:row.size,min:row.min,max:row.max})),[
  {size:"36",min:682000000,max:695900000},{size:"59A",min:1187700000,max:1187700000}
]);
const comma=value=>Math.round(value).toLocaleString("en-US");
const priceLine=(floor,units,price)=>`${floor} ${units} ${comma(price*.58)} ${comma(price*.42)} ${comma(price)} ${comma(price*.1)} ${comma(price*.1)} ${comma(price*.3)}`;
const pdfJsSpacingFixture=[
  "■ 공급금액 및 납부일정 ( 단위 : 원 )",
  "공급금액 중도금 (60%) 잔금 (30%)",
  "계약금 (10%) 1 차 (10%) 2 차 (10%) 3 차 (10%) 4 차 (10%) 5 차 (10%) 6 차 (10%)",
  "2027.01.30. 2027.05.31. 2027.10.29. 2028.03.30. 2028.08.30. 2029.01.30.",
  priceLine("5~9 층",6,682000000),
  `36 20 ${priceLine("10~14 층",9,692400000)}`,
  priceLine("15~19 층",5,695900000),
  priceLine("2 층",7,1187700000),
  priceLine("3 층",7,1194000000),
  priceLine("4 층",7,1215500000),
  "59A 71",
  priceLine("5~9 층",35,1238200000),
  priceLine("10~14 층",10,1257200000),
  priceLine("15~18 층",5,1263500000),
  priceLine("2 층",3,1167500000),
  priceLine("3 층",3,1173700000),
  priceLine("4 층",3,1194800000),
  "59B 42",
  priceLine("5~9 층",15,1217200000),
  priceLine("10~14 층",7,1235800000),
  priceLine("15~20 층",11,1242000000),
  `84A 2 ${priceLine("20 층",2,1499100000)}`
];
const parsedPdfJsSpacing=R.parsePaymentData(pdfJsSpacingFixture,[{name:"36",total:20},{name:"59A",total:71},{name:"59B",total:42},{name:"84A",total:2}]);
assert.deepStrictEqual(parsedPdfJsSpacing.pricing.map(row=>({size:row.size,min:row.min,max:row.max})),[
  {size:"36",min:682000000,max:695900000},
  {size:"59A",min:1187700000,max:1263500000},
  {size:"59B",min:1167500000,max:1242000000},
  {size:"84A",min:1499100000,max:1499100000}
]);
const billionSchedule=[{kind:"contract",label:"계약금",rate:10,dueDate:"",dueLabel:"계약 시"},...Array.from({length:6},(_,index)=>({kind:"interim",label:`중도금 ${index+1}차`,rate:10,dueDate:`2027-0${index+1}-01`,dueLabel:"",loanEnabled:index<4})),{kind:"balance",label:"잔금",rate:30,dueDate:"",dueLabel:"입주 지정일"}];
const funding=R.buildFundingPlan({baseDate:"2026-01-01",price:1000000000,extras:0,cashNow:200000000,reserve:50000000,monthlySaving:0,contractDate:"2026-08-01",moveInDate:"2029-05-01",mortgageLtv:40,payments:billionSchedule});
assert.strictEqual(funding.mortgageTarget,400000000);
assert.strictEqual(funding.peakInterim,400000000);
assert.strictEqual(funding.totalOwn,600000000);
assert.strictEqual(funding.worstShortage,450000000);
assert.strictEqual(funding.firstShortage.label,"중도금 5차");

const sixCategorySupply=R.parseSupplyRows([
  "기관추천 다자녀 신혼부부 노부모부양 생애최초 신생아 특별공급 계 일반공급 최하층",
  "059.9667 59A 71 7 7 10 2 5 7 38 33 1"
]);
assert.deepStrictEqual(sixCategorySupply,[{name:"59A",area:59.9667,total:71,agency:7,multi:7,newly:10,elder:2,first:5,baby:7,general:33}]);
const twoCategorySupply=R.parseSupplyRows([
  "다자녀 노부모부양 특별공급 계 일반공급 최하층",
  "100.1234 100 10 5 15 85 1"
]);
assert.deepStrictEqual(twoCategorySupply,[{name:"100",area:100.1234,total:100,agency:0,multi:10,newly:0,elder:5,first:0,baby:0,general:85}]);
const exactFunding=R.buildFundingPlan({price:1000000000,cashNow:1000000000,payments:[{kind:"contract",label:"계약금 1차",rate:1,fixedAmount:12345678}]});
assert.strictEqual(exactFunding.rows[0].scheduled,12345678);
const taxSix=R.acquisitionCostEstimate(600000000,84,{mode:"standard"});
assert.strictEqual(taxSix.acquisitionTax,6000000);
assert.strictEqual(taxSix.localEducationTax,600000);
assert.strictEqual(taxSix.ruralSpecialTax,0);
assert.strictEqual(taxSix.total,6600000);
const taxMid=R.acquisitionCostEstimate(750000000,84,{mode:"standard"});
assert.strictEqual(taxMid.acquisitionRate,.02);
assert.strictEqual(taxMid.total,16500000);
const taxLarge=R.acquisitionCostEstimate(1000000000,100,{mode:"standard"});
assert.strictEqual(taxLarge.total,35000000);
const taxFirst=R.acquisitionCostEstimate(600000000,84,{mode:"first_home"});
assert.strictEqual(taxFirst.discount,2000000);
assert.strictEqual(taxFirst.total,4400000);
const interestPlan=R.buildFundingPlan({price:1000000000,cashNow:1000000000,moveInDate:"2028-01-01",interimInterestRate:5,includeInterimInterest:true,payments:[{kind:"interim",label:"중도금",rate:10,dueDate:"2027-01-01",loanEnabled:true},{kind:"balance",label:"잔금",rate:30,dueDate:"2028-01-01"}]});
assert.strictEqual(interestPlan.deferredInterest,5000000);
assert.strictEqual(interestPlan.closingRow.own,405000000);
const wolgyeLoanPlan=R.parseInterimLoanPlan("본 아파트의 중도금 대출은 이자후불제이며, 전체 분양대금의 40% 범위 내에서 중도금 융자 알선을 시행할 예정이며, 1~4회차 대출을 받았을 경우 5~6회차 중도금(분양대금의 20%)은 계약자가 직접 납부해야 합니다.",billionSchedule);
assert.deepStrictEqual(wolgyeLoanPlan.modes,["loan","loan","loan","loan","self","self"]);
const genericLoanPlan=R.parseInterimLoanPlan("총 분양가격의 60% 범위 내에서 중도금 융자 알선을 시행할 예정입니다.",billionSchedule);
assert.deepStrictEqual(genericLoanPlan.modes,["loan","loan","loan","loan","loan","loan"]);
const optionFixture=[
  "__PAGE_41__",
  "발코니 확장공사비 공급금액 계약금 중도금 잔금",
  "36 8,000,000 800,000 800,000 6,400,000",
  "59A/B 17,000,000 1,700,000 1,700,000 13,600,000",
  "__PAGE_42__",
  "가구당 월평균소득 579,278 702,038",
  "__PAGE_43__",
  "추가 선택품목(유상옵션) 공급금액 계약금 중도금 잔금",
  "36 붙박이장 1,100,000 110,000 110,000 880,000"
];
const parsedOptions=R.parseOptionData(optionFixture,["36","59A","59B"]);
assert.deepStrictEqual(parsedOptions.filter(row=>row.category==="balcony").map(row=>[row.size,row.price]),[["36",8000000],["59A",17000000],["59B",17000000]]);
assert.strictEqual(parsedOptions.find(row=>row.category==="paid").price,1100000);
assert.ok(parsedOptions.every(row=>!String(row.price).includes("579278")));
const fundingWithOption=R.buildFundingPlan({price:1000000000,extras:0,cashNow:1100000000,contractDate:"2026-08-01",moveInDate:"2029-01-01",payments:[{kind:"contract",label:"계약금",rate:10},{kind:"balance",label:"잔금",rate:90},{kind:"other",phaseKind:"contract",extra:true,label:"발코니 확장",rate:0,fixedAmount:8000000}]});
assert.strictEqual(fundingWithOption.optionTotal,8000000);
assert.strictEqual(fundingWithOption.totalCost,1008000000);
assert.strictEqual(fundingWithOption.rateTotal,100);
const overReserved=R.buildFundingPlan({price:100000000,cashNow:300000000,reserve:600000000,payments:[{kind:"contract",label:"계약금",rate:10}]});
assert.strictEqual(overReserved.usableStart,0);
assert.strictEqual(overReserved.firstShortage.shortage,10000000);
const capacity=R.calculateLoanCapacity({price:1450000000,annualIncome:120000000,existingAnnualDebtService:0,mortgageLtv:40,mortgageInterestRate:4.5,stressRate:3,dsrLimit:40,mortgageYears:30,policyScope:"capital"});
assert.strictEqual(capacity.ltvLimit,580000000);
assert.strictEqual(capacity.policyCap,600000000);
assert.strictEqual(capacity.binding.key,"dsr");
assert.ok(capacity.estimatedLimit>570000000&&capacity.estimatedLimit<573000000);
const cappedCapacity=R.calculateLoanCapacity({price:2000000000,annualIncome:500000000,mortgageLtv:70,mortgageInterestRate:4,stressRate:3,dsrLimit:40,mortgageYears:30,policyScope:"capital"});
assert.strictEqual(cappedCapacity.estimatedLimit,400000000);
assert.strictEqual(cappedCapacity.binding.key,"policy");
const monthlyInterestPlan=R.buildFundingPlan({baseDate:"2026-07-01",price:1000000000,cashNow:300000000,reserve:50000000,monthlySaving:3000000,moveInDate:"2028-01-01",annualIncome:120000000,mortgageLtv:40,mortgageInterestRate:4.5,stressRate:3,dsrLimit:40,mortgageYears:30,policyScope:"capital",interimInterestRate:5,interestPaymentMode:"monthly",payments:[{kind:"interim",label:"중도금 1차",rate:10,dueDate:"2027-01-01",loanEnabled:true},{kind:"interim",label:"중도금 2차",rate:10,dueDate:"2027-07-01",loanEnabled:true},{kind:"balance",label:"잔금",rate:80,dueDate:"2028-01-01"}]});
assert.strictEqual(monthlyInterestPlan.interestSchedule.length,12);
assert.strictEqual(monthlyInterestPlan.interestByInstallment.length,2);
assert.ok(monthlyInterestPlan.interestSchedule[6].interest>monthlyInterestPlan.interestSchedule[5].interest*1.9);
assert.strictEqual(monthlyInterestPlan.monthlyPaidInterest,monthlyInterestPlan.totalInterimInterest);
assert.strictEqual(monthlyInterestPlan.deferredInterest,0);
assert.strictEqual(monthlyInterestPlan.ownCapitalAtMoveIn,304000000);
assert.strictEqual(monthlyInterestPlan.netOwnCapitalAfterMonthlyInterest,monthlyInterestPlan.ownCapitalAtMoveIn-monthlyInterestPlan.totalInterimInterest);
assert.strictEqual(monthlyInterestPlan.loanShortage,monthlyInterestPlan.mortgageRequired-monthlyInterestPlan.mortgageTarget);console.log("rules.test.js: allocation, scoring, income, profile, payment parsing and funding checks passed");
