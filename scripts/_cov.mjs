import { readFileSync } from 'node:fs'
const cov = JSON.parse(readFileSync('./coverage/coverage-final.json', 'utf8'))
let tot = 0,
  covd = 0
const rows = []
for (const [f, d] of Object.entries(cov)) {
  const s = Object.values(d.s || {})
  if (!s.length) continue
  const c = s.filter((x) => x > 0).length
  tot += s.length
  covd += c
  const short = f.split('ZarNama')[1].replace(/^[\\/]+/, '').replaceAll('\\', '/')
  rows.push([short, (c / s.length) * 100])
}
console.log('TOTAL src/lib:', ((covd / tot) * 100).toFixed(2) + '%', `(${covd}/${tot} stmts)`)
rows.sort((a, b) => a[1] - b[1])
for (const [f, p] of rows) console.log(String(p.toFixed(0)).padStart(5) + '%  ' + f)
