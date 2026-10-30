import { readFileSync } from 'node:fs'

function readJson(path) {
    return JSON.parse(readFileSync(path, 'utf8'))
}

const packageJson = readJson('package.json')
const packageLock = readJson('package-lock.json')
const tauriConfig = readJson('src-tauri/tauri.conf.json')
const cargoToml = readFileSync('src-tauri/Cargo.toml', 'utf8')
const cargoVersion = cargoToml.match(/^version = "([^"]+)"$/m)?.[1]

const versions = {
    'package.json': packageJson.version,
    'package-lock.json': packageLock.version,
    'src-tauri/tauri.conf.json': tauriConfig.version,
    'src-tauri/Cargo.toml': cargoVersion,
}

const unique = new Set(Object.values(versions))
if (unique.size !== 1 || unique.has(undefined)) {
    console.error('版本不一致：')
    for (const [file, version] of Object.entries(versions)) {
        console.error(`  ${file}: ${version ?? '<missing>'}`)
    }
    process.exit(1)
}

console.log(`版本一致：${packageJson.version}`)
