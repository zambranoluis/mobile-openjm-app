import {test} from "node:test";
import assert from "node:assert/strict";
import {language,translated} from "../../src/ui/languageModel.ts";
test("locale selection accepts only supported languages and never rewrites unknown data",()=>{
  assert.equal(language("es"),"es");assert.equal(language("ar"),"en");assert.equal(language(null),"en");
  const copy={Account:{en:"Account",es:"Cuenta"}};
  assert.equal(translated(copy,"Account","es"),"Cuenta");assert.equal(translated(copy,"Fictional conversation content","es"),"Fictional conversation content");
});
