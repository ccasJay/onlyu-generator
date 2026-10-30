# 项目可靠性加固 执行计划

## 任务清单

- [x] //TODO 1. 完成工程基线：Lint、格式化、类型检查、基础测试与 PR 门禁
  - 落实标准：[8.1](./spec.md#spec-req-8-1), [8.2](./spec.md#spec-req-8-2)
  - 实施目标与场景：加入 ESLint flat config、Prettier、Vitest 基础配置与 `lint`、`format:check`、`typecheck`、`test`、`build` 脚本；新增 PR workflow，在 Ubuntu 上以 `npm ci` 执行 lint/typecheck/test/build，并在 `src-tauri` 变更时于 Windows 执行 `cargo check`。场景：故意引入格式或 lint 错误时本地检查失败；修改 Rust 文件时 PR 出现 cargo 检查任务；未修改 Rust 时不触发该任务。
  - 验证手段：运行 `npm run lint && npm run format:check && npm run typecheck && npm run test && npm run build`，并检查 workflow 的路径过滤与失败阻断配置。

- [x] //TODO 2. 完成草稿持久化闭环与启动恢复：本地存储、hydrate 与损坏回退
  - 落实标准：[1.1](./spec.md#spec-req-1-1), [1.3](./spec.md#spec-req-1-3), [1.4](./spec.md#spec-req-1-4), [1.6](./spec.md#spec-req-1-6), [5.1](./spec.md#spec-req-5-1), [5.2](./spec.md#spec-req-5-2)
  - 实施目标与场景：建立 IndexedDB `drafts`/`images` 仓库与 `hydrationStatus`，启动时先恢复 `currentTemplateId`、字段与照片，恢复完成前不写默认值；损坏或 schema 不支持时回退默认值并提示；模板新增字段用默认值补齐。场景：填写姓名并上传照片后重启应用，1 秒内恢复且不闪现默认值；删除或破坏草稿记录后启动得到默认值与非阻塞提示；模板新增字段后旧草稿仍保留原值。
  - 验证手段：用 `fake-indexeddb` 编写聚焦测试覆盖草稿往返、损坏回退、版本不支持和字段补齐；在 `npm run dev` 中手动刷新验证恢复时序，并用网络面板确认无上传请求。

- [x] //TODO 3. 完成自动保存状态与存储故障降级
  - 落实标准：[1.2](./spec.md#spec-req-1-2), [1.5](./spec.md#spec-req-1-5)
  - 实施目标与场景：表单变化后 1 秒内保存，并在表单区显示“保存中 / 已保存 / 保存失败”；IndexedDB 不可用或配额不足时保留内存数据、显示非阻塞警告，并在条件恢复后继续保存。场景：连续输入时状态从“保存中”变为“已保存”；模拟打开数据库失败或配额异常时仍可继续编辑，表单不被清空；恢复可用后下一次修改能成功写入。
  - 验证手段：用 mock IndexedDB 失败编写聚焦测试；在浏览器 DevTools 中模拟存储异常并检查状态提示与表单内容。

- [x] //TODO 4. 完成模板重置与切换隔离
  - 落实标准：[5.3](./spec.md#spec-req-5-3), [5.4](./spec.md#spec-req-5-4), [5.5](./spec.md#spec-req-5-5)
  - 实施目标与场景：提供唯一的重置、切换接口；重置删除当前模板草稿与照片并恢复默认值，切换先保存当前草稿再加载目标草稿或默认值，未知模板 ID 保留当前状态并警告。场景：用两个模板 ID 的测试数据切换后字段不串模板；重置模板 A 后模板 B 草稿仍在；传入不存在 ID 时当前表单不被清空。
  - 验证手段：编写 store 级聚焦测试覆盖重置、双向切换、未知 ID 和照片清理；手动触发重置确认与取消流程。

- [x] //TODO 5. 完成图片校验、压缩与上传状态
  - 落实标准：[2.1](./spec.md#spec-req-2-1), [2.2](./spec.md#spec-req-2-2), [2.3](./spec.md#spec-req-2-3), [2.4](./spec.md#spec-req-2-4), [2.5](./spec.md#spec-req-2-5), [2.6](./spec.md#spec-req-2-6)
  - 实施目标与场景：上传时校验 JPG/PNG/WebP 与 20MB 上限，最长边压缩到 2000px、优先 WebP 0.92 并保留透明通道；超过 8MB 时降到 1600px/0.88 重试一次；失败保留原照片；清除照片同步移除草稿；处理期间禁止导出。场景：3000px 透明 PNG 变为不超过 2000px 的透明 WebP；25MB 文件被拒绝且原图不变；压缩仍超限时提示失败；清除后重启仍无照片。
  - 验证手段：用 Playwright 页面真实 canvas 验证透明通道、尺寸和重试；用组件测试验证错误保留、清除和导出禁用；手动上传固定样例并检查网络面板无上传。

- [x] //TODO 6. 完成表单约束、必填校验与导出阻断
  - 落实标准：[3.1](./spec.md#spec-req-3-1), [3.2](./spec.md#spec-req-3-2), [3.3](./spec.md#spec-req-3-3), [3.4](./spec.md#spec-req-3-4), [3.5](./spec.md#spec-req-3-5), [3.6](./spec.md#spec-req-3-6)
  - 实施目标与场景：在字段元数据中声明必填、`maxLength` 与 `maxItems`，并在输入、标签、亮点组件中执行上限与规范化；导出前校验照片/姓名，缺失时阻止导出、聚焦首个错误并显示字段错误。场景：空照片或空姓名点击导出不会进入导出流程；输入第 9 个标签被阻止；` 上海 ` 存为 `上海` 且重复标签被忽略；纯空白姓名按必填错误处理；全部合法时允许继续导出。
  - 验证手段：用 Testing Library 编写聚焦组件测试覆盖必填、上限、去重、空白和错误清除；浏览器中手动检查聚焦与提示。

- [x] //TODO 7. 完成双通道导出：浏览器下载、Tauri 原生保存与安全写入
  - 落实标准：[4.1](./spec.md#spec-req-4-1), [4.2](./spec.md#spec-req-4-2), [4.3](./spec.md#spec-req-4-3), [4.4](./spec.md#spec-req-4-4), [4.5](./spec.md#spec-req-4-5), [4.6](./spec.md#spec-req-4-6), [4.7](./spec.md#spec-req-4-7), [4.8](./spec.md#spec-req-4-8)
  - 实施目标与场景：统一 `exportPoster()` 执行校验、等待字体与照片、2 倍渲染与保存；Tauri 通过 dialog 选择路径并调用窄职责 Rust 命令以临时文件替换目标，浏览器回退 `file-saver`；处理取消、写入失败、并发、资源加载失败、非法文件名与缩放无关性。场景：Tauri 中弹出默认文件名 `<姓名>_<日期>.png` 并写出 1800×2668 PNG；取消不产生文件；写入失败不留下半截文件；浏览器下载可打开且尺寸正确；损坏照片阻止导出并提示。
  - 验证手段：用 Playwright 下载并解析 PNG 头部尺寸与文件名；用 Rust `tempfile` 单元测试验证临时写入与替换；在 Windows 上按手工清单验证原生对话框、取消和只读目录写入失败。

- [x] //TODO 8. 完成排版边界、窗口尺寸与离线字体
  - 落实标准：[6.1](./spec.md#spec-req-6-1), [6.2](./spec.md#spec-req-6-2), [6.3](./spec.md#spec-req-6-3), [6.4](./spec.md#spec-req-6-4), [6.5](./spec.md#spec-req-6-5), [6.6](./spec.md#spec-req-6-6), [6.7](./spec.md#spec-req-6-7)
  - 实施目标与场景：将窗口调整为 1280×860、最小 1100×760；移除 Google Fonts `@import`，改用系统字体栈；把模板 CSS 变量与选择器限定在 `.nanny-poster`；为职位、姓名、薪资、亮点增加长度分级字号与换行约束。场景：1100×760 下无横向滚动；所有字段取上限时文字不越过海报、照片、信息卡片和品牌落款；离线启动无字体网络请求；强制 `sans-serif` 回退仍不溢出。
  - 验证手段：用 Playwright 设置最小视口与最大长度 fixture，检查 `scrollWidth`、关键元素 bounding box 并保存截图；用请求日志确认无 `fonts.googleapis.com`；用 `rg` 检查模板 CSS 作用域。

- [x] //TODO 9. 完成错误边界、用户可见错误与可访问性基础
  - 落实标准：[7.1](./spec.md#spec-req-7-1), [7.2](./spec.md#spec-req-7-2), [7.3](./spec.md#spec-req-7-3), [7.4](./spec.md#spec-req-7-4), [7.5](./spec.md#spec-req-7-5)
  - 实施目标与场景：加入 ErrorBoundary 与“重新加载 / 清除当前草稿并重新加载（二次确认）”；错误改为字段级、页面内或原生对话框呈现；补齐 `label` 关联、`aria-label`、键盘操作与焦点样式；重置、覆盖、清除草稿、安装更新均需可取消确认。场景：模板渲染抛错时显示兜底页而非白屏；Tab 可完成表单编辑与标签删除；取消重置不改变内容；键盘焦点始终可见。
  - 验证手段：用 Testing Library 注入渲染错误验证兜底与清除确认；用 Playwright 键盘流程检查标签、删除、重置和焦点；手动检查原生对话框的可取消性。

- [x] //TODO 10. 完成状态订阅收敛与动态列表稳定标识
  - 落实标准：[8.7](./spec.md#spec-req-8-7)
  - 实施目标与场景：将 `useFormStore()` 全量订阅拆为按字段/切片选择器，避免单个字段变化触发无关区域重渲染；标签、亮点、模板列表改用稳定 ID 而非数组下标。场景：修改城市时只有依赖该字段的表单控件与预览更新；删除中间标签后其余标签内容、删除按钮和顺序保持正确，不出现复用错位。
  - 验证手段：用 React Testing Library 的渲染计数断言验证订阅收敛；用组件测试删除中间标签并检查组内文本与操作按钮；浏览器中连续增删观察预览。

- [x] //TODO 11. 完成自动化回归套件与浏览器冒烟测试
  - 落实标准：[8.3](./spec.md#spec-req-8-3), [8.4](./spec.md#spec-req-8-4)
  - 实施目标与场景：补齐 Vitest/RTL 对草稿恢复/损坏/配额、表单校验、模板生命周期、文本上限与导出阻断的覆盖，并用 Playwright 覆盖真实 canvas 图片透明通道；加入 Playwright 冒烟测试覆盖加载、填写、实时预览、必填校验和浏览器下载导出；将 `test:e2e` 接入 PR CI。场景：测试不依赖真实网络或真实更新源；完整套件在本地与 CI 均通过；下载导出能被解析为有效 PNG。
  - 验证手段：运行 `npm run test && npm run test:e2e`；检查 CI 中 Playwright 安装与浏览器缓存步骤；用网络拦截断言无真实外部请求。

- [x] //TODO 12. 完成 README、发布与更新运维文档
  - 落实标准：[8.5](./spec.md#spec-req-8-5), [8.6](./spec.md#spec-req-8-6)
  - 实施目标与场景：README 记录安装、开发、构建、测试、Lint、版本发布、公开仓库、updater 签名密钥与 CI secrets 配置，以及原生保存/更新检查/安装的手工验证清单；明确 `0.1.0` 用户需手动安装一次 `0.2.0`。场景：新维护者按文档可完成本地构建和测试；手工清单覆盖保存、取消、写入失败、启动检查、手动检查、下载失败、重启确认。
  - 验证手段：逐段执行 README 中的安装、构建、测试命令；检查清单覆盖 Spec 8.5/8.6 要求；用链接检查或人工审阅确认引用有效。

- [x] //TODO 13. 完成版本统一与 Windows 发布流水线
  - 落实标准：[9.1](./spec.md#spec-req-9-1), [9.2](./spec.md#spec-req-9-2), [9.3](./spec.md#spec-req-9-3), [9.4](./spec.md#spec-req-9-4), [9.5](./spec.md#spec-req-9-5), [9.6](./spec.md#spec-req-9-6), [10.9](./spec.md#spec-req-10-9)
  - 实施目标与场景：将版本统一为 `0.2.0` 并增加版本一致性脚本；发布 workflow 由 `v*` 标签触发，只构建 Windows NSIS，启用 updater 产物、`npm ci`、缓存与并发控制；将安装包、签名文件和 `latest.json` 直接发布到当前公开仓库的 Release；缺少签名密钥时构建前失败，发布说明包含旧版本手动升级提示。场景：标签与版本不一致时 workflow 在构建前失败；删除测试环境 secret 时不产生未签名 Release；当前仓库 Release 只含安装包、签名和清单，不包含私钥。
  - 验证手段：运行 `npm run version:check`；在测试标签上执行一次发布并检查 `gh release view`、资产列表与 `latest.json` URL；在临时分支移除 secret 验证失败路径。当前仓库未公开或 secrets 未就绪时，该项标记为 blocked/pending-human，不宣称通过。

- [x] //TODO 14. 完成签名自动更新客户端与交互
  - 落实标准：[10.1](./spec.md#spec-req-10-1), [10.2](./spec.md#spec-req-10-2), [10.3](./spec.md#spec-req-10-3), [10.4](./spec.md#spec-req-10-4), [10.5](./spec.md#spec-req-10-5), [10.6](./spec.md#spec-req-10-6), [10.7](./spec.md#spec-req-10-7), [10.8](./spec.md#spec-req-10-8), [10.10](./spec.md#spec-req-10-10), [10.11](./spec.md#spec-req-10-11)
  - 实施目标与场景：接入 updater、process 与 dialog 插件及最小 capability，封装 `idle/checking/available/downloading/ready/error` 服务；应用就绪后静默检查一次，顶栏提供手动入口，发现更新时展示版本、纯文本说明和“下载并安装/稍后”，下载显示进度，完成后提示重启；非 Tauri 环境隐藏入口且不请求；只接受 HTTPS 与有效签名，拒绝降级；identifier 保持不变，更新后草稿仍可恢复。场景：浏览器中无检查入口且无网络请求；模拟无更新、可更新、下载失败、15 秒超时；拒绝重启后应用继续运行；篡改签名或降低版本时拒绝安装。
  - 验证手段：用 mock updater 编写状态机与超时测试；在 Windows 上使用当前仓库的测试 `latest.json` 验证手动检查、下载进度、重启和草稿保留；用 `git grep` 与产物解包确认无私钥；运行 `cargo check` 与构建检查 capability。真实 `0.2.0 → 0.2.1` 更新演练放入 Feature Verification，仓库公开与 secrets 未就绪时标记 blocked/pending-human。

## Feature Verification

### Planned Checks

| 验收项 | 对应需求 | 验证场景与预期结果 | 检查手段 / 命令入口 |
|---|---|---|---|
| 工程门禁与 PR CI | [8.1](./spec.md#spec-req-8-1), [8.2](./spec.md#spec-req-8-2) | 全量脚本通过；引入格式/lint 错误后检查失败；修改 `src-tauri` 时 Windows cargo 检查出现，未修改时不出现。 | `npm run lint && npm run format:check && npm run typecheck && npm run test && npm run build`；检查 PR workflow 运行记录；`cargo check --manifest-path src-tauri/Cargo.toml`。 |
| 草稿恢复与保存状态 | [1.1](./spec.md#spec-req-1-1), [1.2](./spec.md#spec-req-1-2), [1.3](./spec.md#spec-req-1-3), [5.1](./spec.md#spec-req-5-1), [5.2](./spec.md#spec-req-5-2) | 编辑姓名并上传照片后状态显示保存中→已保存；刷新/重启 1 秒内恢复且不闪现默认值；模板新增字段后旧值保留、新字段取默认值；首次启动只初始化一次。 | `npm run test -- draft`；Playwright 刷新恢复；手动关闭重开应用。 |
| 草稿异常与本地性 | [1.4](./spec.md#spec-req-1-4), [1.5](./spec.md#spec-req-1-5), [1.6](./spec.md#spec-req-1-6) | 损坏/不支持版本回退默认值并提示一次；模拟配额或打开失败仍可编辑、警告且可继续保存；网络面板无草稿/照片上传。 | `fake-indexeddb` 聚焦测试 + mock IDB 异常；Playwright 请求日志；手动断网验证。 |
| 模板生命周期 | [5.3](./spec.md#spec-req-5-3), [5.4](./spec.md#spec-req-5-4), [5.5](./spec.md#spec-req-5-5) | 两个模板草稿切换后不串字段；重置 A 后 A 为默认值、B 保留；未知 ID 只警告且不清空当前表单。 | store 单元测试；组件测试重置确认/取消。 |
| 图片校验、压缩与状态 | [2.1](./spec.md#spec-req-2-1), [2.2](./spec.md#spec-req-2-2), [2.3](./spec.md#spec-req-2-3), [2.4](./spec.md#spec-req-2-4), [2.5](./spec.md#spec-req-2-5), [2.6](./spec.md#spec-req-2-6) | 3000px 透明 PNG → 最长边≤2000px、透明 WebP、≤8MB；超 8MB 触发 1600px/0.88 重试；25MB/非法类型/解码失败保留原图并报错；清除后持久化无照片；处理期间导出禁用；无上传请求。 | Playwright 真实 canvas 测试 + 组件测试；手动样例上传；请求日志。 |
| 表单约束与导出阻断 | [3.1](./spec.md#spec-req-3-1), [3.2](./spec.md#spec-req-3-2), [3.3](./spec.md#spec-req-3-3), [3.4](./spec.md#spec-req-3-4), [3.5](./spec.md#spec-req-3-5), [3.6](./spec.md#spec-req-3-6) | 空照片/姓名导出被阻断并聚焦首个错误；第 9 个标签、第 5 条亮点、超长文本被阻止；标签去空白/去重、空白姓名按空值；合法数据允许导出。 | Testing Library 组件测试 + Playwright 表单流程。 |
| 浏览器导出 | [4.3](./spec.md#spec-req-4-3), [4.5](./spec.md#spec-req-4-5), [4.6](./spec.md#spec-req-4-6), [4.8](./spec.md#spec-req-4-8) | 浏览器下载得到可打开的 1800×2668 PNG；文件名清理非法字符且主体≤80 字符；连续点击只产生一个文件；改变预览缩放后输出尺寸不变。 | Playwright 下载并解析 PNG 头；手动检查文件名与重复点击。 |
| Tauri 原生保存 | [4.1](./spec.md#spec-req-4-1), [4.2](./spec.md#spec-req-4-2), [4.4](./spec.md#spec-req-4-4) | 弹出原生保存框且默认名为 `<姓名>_<日期>.png`；取消不写文件；只读目录/写入失败时报错且不留下半截文件、不破坏同名文件。 | Windows 手工清单；Rust `tempfile` 单元测试；检查临时文件清理。 |
| 导出资源失败 | [4.7](./spec.md#spec-req-4-7) | 照片数据损坏或字体加载异常时导出被阻断并提示原因，不生成占位图或缺失内容 PNG。 | 组件测试 mock 图片 `onerror`/字体异常；浏览器手动验证。 |
| 排版边界与字号 | [6.1](./spec.md#spec-req-6-1), [6.2](./spec.md#spec-req-6-2), [6.3](./spec.md#spec-req-6-3) | 1100×760 无横向滚动；所有字段取上限时文字不越过海报、照片、信息卡片与品牌落款；长职位/姓名/薪资/亮点缩小或换行，标签保持左列。 | Playwright 最小视口 + 最大长度 fixture，检查 bounding box/scrollWidth 并截图；手动缩放窗口。 |
| 字体、CSS 作用域与缩放 | [6.4](./spec.md#spec-req-6-4), [6.5](./spec.md#spec-req-6-5), [6.6](./spec.md#spec-req-6-6), [6.7](./spec.md#spec-req-6-7) | 模板变量只作用于 `.nanny-poster`；离线无 `fonts.googleapis.com` 请求；强制 `sans-serif` 仍不溢出；预览缩放改变但导出保持 1800×2668。 | `rg` 检查 CSS 作用域；Playwright 离线请求日志；导出尺寸解析。 |
| 异常兜底与可访问性 | [7.1](./spec.md#spec-req-7-1), [7.2](./spec.md#spec-req-7-2), [7.3](./spec.md#spec-req-7-3), [7.4](./spec.md#spec-req-7-4), [7.5](./spec.md#spec-req-7-5) | 渲染抛错显示兜底页且可重新加载/确认清除草稿；错误有可见提示；标签关联、`aria-label`、键盘删除、重置/更新确认可用；焦点可见。 | RTL 错误边界测试；Playwright 键盘流程；人工检查焦点与对话框取消。 |
| 自动化回归与列表稳定 | [8.3](./spec.md#spec-req-8-3), [8.4](./spec.md#spec-req-8-4), [8.7](./spec.md#spec-req-8-7) | 全量单元/组件/E2E 覆盖草稿异常、透明通道、校验、生命周期、文本上限和导出阻断；Playwright 冒烟通过；单字段变化不触发无关区域；删除中间标签内容正确。 | `npm run test && npm run test:e2e`；渲染计数断言；删除中间项组件测试。 |
| 文档与手工清单 | [8.5](./spec.md#spec-req-8-5), [8.6](./spec.md#spec-req-8-6) | README 覆盖开发/构建/测试/发布/updater secrets/公开仓库配置；手工清单覆盖原生保存与更新全流程；文档命令可执行。 | 逐段执行 README 命令；审阅清单；链接检查。 |
| 版本统一与发布 | [9.1](./spec.md#spec-req-9-1), [9.2](./spec.md#spec-req-9-2), [9.3](./spec.md#spec-req-9-3), [9.4](./spec.md#spec-req-9-4), [9.5](./spec.md#spec-req-9-5), [9.6](./spec.md#spec-req-9-6), [10.9](./spec.md#spec-req-10-9) | 四处版本为 0.2.0 且 `version:check` 通过；`v0.2.0` 触发 Windows NSIS、签名产物与公开 `latest.json`；版本不一致或缺失签名 secret 时构建前失败；当前仓库 Release 仅含安装包/签名/清单；说明 0.1.0 需手动升级；`latest.json` URL 指向当前仓库资产。 | `npm run version:check`；测试标签发布；`gh release view`；下载并检查 `latest.json`。当前仓库未公开或 secrets 未就绪时标记 blocked/pending-human。 |
| 更新客户端交互 | [10.1](./spec.md#spec-req-10-1), [10.2](./spec.md#spec-req-10-2), [10.3](./spec.md#spec-req-10-3), [10.5](./spec.md#spec-req-10-5), [10.6](./spec.md#spec-req-10-6), [10.10](./spec.md#spec-req-10-10), [10.11](./spec.md#spec-req-10-11) | 浏览器无入口无请求；启动静默检查且失败不打扰；手动检查显示最新/可更新/纯文本说明；下载进度与失败重试可见；重启确认可拒绝；15 秒超时按场景静默或报错。 | mock updater 单元测试；Windows 手工使用测试 `latest.json` 验证。 |
| 更新安全与数据保留 | [10.4](./spec.md#spec-req-10-4), [10.7](./spec.md#spec-req-10-7), [10.8](./spec.md#spec-req-10-8) | 非 HTTPS、无效签名、降级版本被拒绝；有效更新后 identifier 不变且草稿仍可恢复；仓库、日志、安装包中无签名私钥。 | mock 签名/版本异常测试；真实更新演练后检查草稿；`git grep` 与产物解包扫描。 |

### Latest Result

- 状态：pending-human
- 验证时间：2026-10-30 15:12（UTC+8）
- 验证对象：合并提交 `6372052`，发布标签 `v0.3.0`；上一版 `v0.2.1` 为 `006aaca`。
- 验证摘要：
  - 通过：`npm run lint`、`npm run format:check`、`npm run typecheck`、`npm run test`（18 个测试文件，51 个测试）、`npm run test:e2e`（6 个浏览器测试）、`npm run build`、`npm run version:check`。
  - 通过：`cargo test --manifest-path src-tauri/Cargo.toml`（1 个原子写入测试）；`cargo check` 与 `npm run tauri build -- --no-bundle` 成功。
  - 通过：浏览器 E2E 覆盖无远程字体请求、草稿刷新恢复、必填字段阻断、3000px 透明 PNG 压缩与 1800×2668 导出、1100×760 最大长度排版边界、键盘删除/焦点/重置取消、照片缩放 150% 与拖动位置。
  - 通过：GitHub Actions `Windows Release` 运行 `41017993000` 成功；v0.3.0 公开 Release 包含 `onlyu-generator_0.3.0_x64-setup.exe`（3,712,546 字节）、`.sig` 与 `latest.json`。
  - 通过：`latest.json` 版本为 `0.3.0`，安装包 URL 指向 `https://github.com/ccasJay/onlyu-generator/releases/download/v0.3.0/...`；仓库已公开且未包含签名私钥。
  - 新增：照片支持 50%–200% 缩放、在预览中拖动位置、重置照片位置；缩放/偏移写入草稿并参与导出。导出错误现在显示原始 Tauri 错误，并在自定义命令失败时回退到 `fs` 插件写入。
  - 待人工：在 Windows 上安装 v0.3.0，验证照片拖动与导出位置、原生保存对话框、取消/只读目录失败恢复；以及从 v0.2.1 自动更新到 v0.3.0 的下载/重启/草稿保留。
- 新鲜度：current（代码 `6372052`；v0.3.0 Release 由同一合并提交的标签构建）。
