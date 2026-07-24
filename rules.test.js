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

console.log("rules.test.js: allocation, scoring, income, profile and date checks passed");
