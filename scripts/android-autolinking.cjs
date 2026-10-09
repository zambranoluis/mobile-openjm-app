const { execFileSync } = require("node:child_process");
const { statSync, mkdirSync, writeFileSync } = require("node:fs");
const { resolve, dirname, join } = require("node:path");
const alias = resolve(process.argv[2]);
const root = resolve(__dirname, "..");
const physicalRoot = resolve(process.argv[3]);
const sameDirectory = (a,b) => {const left=statSync(a,{bigint:true}),right=statSync(b,{bigint:true});return left.dev===right.dev && left.ino===right.ino;};
if (!sameDirectory(alias,physicalRoot) || !sameDirectory(root,physicalRoot)) throw new Error("Build alias does not resolve to this repository.");
const cli = join(dirname(require.resolve("expo-modules-autolinking/package.json", {paths:[require.resolve("expo/package.json")]})), "bin/expo-modules-autolinking.js");
const input = JSON.parse(execFileSync(process.execPath, [cli,"react-native-config","--json","--platform","android"], {cwd:alias,encoding:"utf8"}));
const physical = physicalRoot.replaceAll("\\", "/");
const short = alias.replaceAll("\\", "/");
function normalize(value) {
  if (typeof value === "string") {
    const path = value.replaceAll("\\", "/");
    if (path.toLowerCase() === physical.toLowerCase() || path.toLowerCase().startsWith(physical.toLowerCase()+"/")) return short+path.slice(physical.length);
    return value;
  }
  if (Array.isArray(value)) return value.map(normalize);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,normalize(item)]));
  return value;
}
const output = resolve(alias,".expo/local-android/autolinking.json");
const config = normalize(input);
if (!config.reactNativePath.toLowerCase().startsWith(short.toLowerCase()+"/")) throw new Error("React Native escaped the normalized build root.");
mkdirSync(dirname(output),{recursive:true});writeFileSync(output,JSON.stringify(config));
/* global __dirname */
