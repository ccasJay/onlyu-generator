import { readFileSync, writeFileSync } from 'node:fs'

const [file, sourceRepo, targetRepo] = process.argv.slice(2)

if (!file || !sourceRepo || !targetRepo) {
    console.error('用法：node scripts/rewrite-latest-json.mjs <file> <source-repo> <target-repo>')
    process.exit(1)
}

const manifest = JSON.parse(readFileSync(file, 'utf8'))
const platforms = manifest.platforms

if (!platforms || typeof platforms !== 'object') {
    console.error('latest.json 缺少 platforms 字段')
    process.exit(1)
}

const sourceBase = `https://github.com/${sourceRepo}/releases/download/`
const targetBase = `https://github.com/${targetRepo}/releases/download/`
let rewritten = 0

for (const entry of Object.values(platforms)) {
    if (entry && typeof entry === 'object' && typeof entry.url === 'string') {
        if (entry.url.startsWith(sourceBase)) {
            entry.url = entry.url.replace(sourceBase, targetBase)
            rewritten += 1
        }
    }
}

if (rewritten === 0) {
    console.error('latest.json 中没有可改写的安装包 URL')
    process.exit(1)
}

writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`已改写 ${rewritten} 个更新 URL 指向 ${targetRepo}`)
