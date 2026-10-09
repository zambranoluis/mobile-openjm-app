import {readFile} from "node:fs/promises";
const languages=["en","es","pt","hi","zh","ru"];
let count=0;
for(const name of ["approved-web-copy","native-copy"]){const copy=JSON.parse(await readFile(`assets/locales/${name}.json`,"utf8"));for(const [source,translations] of Object.entries(copy)){if(translations.en !== source || languages.some(language=>typeof translations[language] !== "string" || !translations[language].trim()))throw new Error(`Incomplete locale entry: ${source}`);count++;}}
console.log(`${count} retained/native entries have all six supported languages. Native-specific fallback copy still requires translation review.`);
