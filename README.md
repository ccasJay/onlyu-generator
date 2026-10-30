# ONLY YOU 宣传图生成器

欧利优家政服务有限公司的家政员工推荐海报生成器。填写职位、姓名、薪资、标签和亮点，上传阿姨照片，实时预览并导出 PNG。应用基于 React + Tauri，草稿和照片只保存在本机。

## 技术栈

- React 19 + TypeScript + Vite
- Zustand 状态管理
- IndexedDB 本地草稿存储
- html-to-image 海报导出
- Tauri 2 桌面壳（Windows 发布）
- Vitest + Testing Library + Playwright

## 环境要求

- Node.js 22 或更高版本
- npm 10 或更高版本
- Rust stable（仅桌面端开发和发布需要）
- Windows 发布需要 WebView2 与 NSIS 工具链（GitHub Actions 的 `windows-latest` 已包含）

## 本地开发

```bash
npm install
npm run dev
```

浏览器开发模式使用 `http://localhost:5173`。桌面端开发：

```bash
npm run tauri dev
```

## 常用脚本

| 命令                    | 说明                      |
| ----------------------- | ------------------------- |
| `npm run dev`           | 启动 Vite 开发服务器      |
| `npm run tauri dev`     | 启动 Tauri 桌面开发模式   |
| `npm run lint`          | ESLint 检查               |
| `npm run format:check`  | Prettier 格式检查         |
| `npm run format`        | 写入 Prettier 格式        |
| `npm run typecheck`     | TypeScript 类型检查       |
| `npm run test`          | Vitest 单元与组件测试     |
| `npm run test:e2e`      | Playwright 浏览器冒烟测试 |
| `npm run build`         | 前端生产构建              |
| `npm run tauri build`   | 构建桌面安装包            |
| `npm run version:check` | 校验各版本源一致          |

首次运行 Playwright 前需要安装 Chromium：

```bash
npx playwright install chromium
```

## 数据与隐私

- 草稿、照片和表单内容保存在本机 IndexedDB，不会上传到服务器。
- 清理浏览器站点数据或 Tauri 应用数据会删除本地草稿。
- 除启动/手动检查更新外，应用不发起业务网络请求；导出和对图片的处理都在本地完成。

## 版本与发布

当前版本基线为 `0.2.0`。发布前确认以下文件版本一致：

- `package.json`
- `package-lock.json` 根版本
- `src-tauri/tauri.conf.json`
- `src-tauri/Cargo.toml`

```bash
npm run version:check
```

发布标签使用 `v0.2.0` 格式。推送标签后，Windows Release workflow 会构建 NSIS 安装包和 updater 产物，并把安装包、签名文件与 `latest.json` 发布到当前公开仓库的 Release。

> `0.1.0` 没有自动更新能力，现有用户需要手动安装一次 `0.2.0`；自动更新从 `0.2.0` 起生效。

### 公开仓库与发布

当前源码仓库需要公开，updater 才能匿名读取：

```text
https://github.com/ccasJay/onlyu-generator/releases/latest/download/latest.json
```

公开后应开启分支保护、secret scanning，并限制 tag 推送权限。Release 只应包含安装包、`.sig` 签名和 `latest.json`，不得包含私钥或其他敏感材料。

### 更新签名密钥

先生成一次 Tauri updater 密钥对：

```bash
npx tauri signer generate -w ~/.tauri/onlyu.key
```

将命令输出的公钥写入 `src-tauri/tauri.conf.json` 的 `plugins.updater.pubkey`。私钥和密码只配置到 GitHub Actions secrets：

| Secret                               | 用途             |
| ------------------------------------ | ---------------- |
| `TAURI_SIGNING_PRIVATE_KEY`          | updater 私钥内容 |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | updater 私钥密码 |

私钥不得提交到仓库、写入日志或打包进安装包。当前仓库已配置一个开发用公钥，发布前请确认 CI secrets 使用与之匹配的私钥。

## 手工验证清单

自动化测试覆盖草稿、图片、校验、排版和浏览器导出；以下 Tauri 专属流程在 Windows 发布前手工验证：

### 原生保存

- [ ] 填写完整信息并上传照片，点击“导出海报”，出现原生保存对话框。
- [ ] 默认文件名为 `<姓名>_<YYYY-MM-DD>.png`。
- [ ] 选择可写目录保存，文件可打开且尺寸为 1800×2668。
- [ ] 取消保存，不产生文件、不出现错误提示。
- [ ] 在只读目录或磁盘空间不足时保存，出现可重试错误，原文件不被破坏。
- [ ] 连续点击导出只产生一次保存流程。

### 自动更新

- [ ] 启动应用后后台检查更新，无更新或断网时不出现打扰提示。
- [ ] 顶栏“检查更新”可用；无更新时提示“已是最新版本”。
- [ ] 使用测试 `latest.json` 发现新版本，弹窗显示版本和纯文本更新说明。
- [ ] 选择“下载并安装”，显示进度；失败后可以重试，应用仍可编辑。
- [ ] 安装完成后提示重启；取消重启时应用继续运行。
- [ ] 使用无效签名或降级版本时拒绝安装。
- [ ] 更新完成后 IndexedDB 草稿仍可恢复，Tauri identifier 保持 `com.sawyerlau.onlyu`。

### 更新发布

- [ ] 版本源与标签一致，否则 workflow 在构建前失败。
- [ ] 缺少签名或 releases 凭据时 workflow 失败，不发布未签名产物。
- [ ] 公开仓库 Release 只包含安装包、签名和 `latest.json`，不包含源码。
- [ ] `latest.json` 内的安装包 URL 指向公开仓库资产。

## 故障排查

- **草稿没有恢复**：检查浏览器/系统是否清理了站点数据，或应用 identifier 是否被修改。
- **图片无法上传**：仅支持 JPG、PNG、WebP，原文件不超过 20MB，压缩后不能超过 8MB。
- **导出按钮不可用**：等待图片处理完成；若已处理完成，检查照片和姓名是否填写。
- **原生保存失败**：确认目标目录可写，且文件名未被其他程序占用。
- **检查更新失败**：确认网络可访问公开仓库的 Release，`latest.json` 与签名文件完整。
