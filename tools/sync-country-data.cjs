const fs=require("node:fs");
const data=JSON.parse(fs.readFileSync("data/countries.json","utf8"));
const regions=["World","Africa","Asia","Europe","North America","South America","Oceania","Antarctica"];
fs.writeFileSync("browser/data.js","// Country data: mledoze/countries, ODbL-1.0. See DATA-SOURCES.md.\nconst countries = "+JSON.stringify(data)+";\nconst regions = "+JSON.stringify(regions)+";\n");
fs.writeFileSync("app/src/main/assets/countries.json",JSON.stringify(data)+"\n");
console.log("Generated "+data.length+" entries for browser and Android.");
