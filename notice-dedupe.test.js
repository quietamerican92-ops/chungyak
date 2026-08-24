const assert=require("assert");
const D=require("./notice-dedupe.js");

const base={
  noticeDate:"2026-09-02",projectName:"써밋 클라비온",sourceFile:"써밋 클라비온 입주자모집공고.pdf",
  sizes:[{name:"59A"}],pricing:[],payments:[],options:[],expectations:{}
};
const records={
  first:{...base,id:"first"},
  rich:{...base,id:"rich",houseManageNo:"2026000999",verified:true,pricing:[{size:"59A",max:900000000}]},
  repeated:{...base,id:"repeated",houseManageNo:"2026000999",sourceFile:"다시받은파일.pdf"}
};
const cleaned=D.dedupe(records,"first");
assert.strictEqual(cleaned.removed,2);
assert.deepStrictEqual(Object.keys(cleaned.notices),["rich"]);
assert.strictEqual(cleaned.activeId,"rich");
assert.strictEqual(cleaned.notices.rich.pricing[0].max,900000000);

assert.strictEqual(D.findDuplicateId({rich:records.rich},{...base,id:"new-upload"}),"rich");
assert.strictEqual(D.sameIdentity(
  {...base,id:"a",sourceFile:"원본.pdf"},
  {...base,id:"b",sourceFile:"다른파일.pdf"}
),true);
assert.strictEqual(D.sameIdentity(
  {...base,id:"a",projectName:"민영주택",sourceFile:"원본.pdf"},
  {...base,id:"b",projectName:"민영주택",sourceFile:"다른파일.pdf"}
),false);

const conflicting=D.dedupe({
  a:{...base,id:"a",houseManageNo:"2026000001"},
  missing:{...base,id:"missing",houseManageNo:""},
  b:{...base,id:"b",houseManageNo:"2026000002"}
},"missing");
assert.strictEqual(Object.keys(conflicting.notices).length,2);
assert.notStrictEqual(conflicting.notices.a?.houseManageNo,conflicting.notices.b?.houseManageNo);

assert.strictEqual(D.sameIdentity(
  {...base,houseManageNo:"2026000001"},
  {...base,houseManageNo:"2026000002"}
),false);

console.log("notice dedupe tests passed");
