const qrcode = require(process.cwd() + "/node_modules/qrcode-generator");
const fs = require("fs");
const out = process.argv[2];
const L = { facebook: "Facebook", instagram: "Instagram", tiktok: "TikTok" };
for (const k of Object.keys(L)) {
  const url = `https://hunt-jade.vercel.app/?utm_source=${k}&utm_medium=oglas&utm_campaign=crolovac`;
  const q = qrcode(0, "M"); q.addData(url); q.make();
  fs.writeFileSync(`${out}/${k}.svg`, q.createSvgTag({ cellSize: 20, margin: 2, scalable: true }));
  fs.writeFileSync(`${out}/${k}.txt`, url);
}
