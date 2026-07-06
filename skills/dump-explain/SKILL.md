---
name: dump-explain
description: 分析应用闪退/崩溃的根本原因。当用户提供 CrashHunter dump 页面 URL（包含 unisdk.nie.netease.com/appdump）、询问"为什么闪退/崩溃原因是什么"、或需要调试 Native Crash 时使用。内置 crashhunter CLI 安装包，开箱即用。
---

# Dump Explain — 闪退原因分析

扮演崩溃分析专家。通过 `crashhunter` CLI 获取崩溃数据，分析所有证据，给出根因定位和修复建议。

## 第零步：确认 crashhunter CLI 可用

执行 `crashhunter --help` 检查是否已安装。

如果提示命令不存在，从内置资源安装：

```bash
npm install -g <本skill路径>/assets/zhengyicun-crashhunter-mcp-1.0.0.tgz
```

如果提示"未登录或登录已过期"，先执行登录：

```bash
crashhunter login g37   # 指定项目
```

> 执行后会弹出浏览器窗口完成 SSO 登录，Cookie 会自动保存到本地，后续无需重复登录。

## 第一步：构建 Dump URL

如果用户只提供了 issue id（如 `fa063e5dc17aaf6df388aa32165c3986`），需要先拼出完整的 dump URL：

```
https://unisdk.nie.netease.com/appdump/g37/identify-detail?identify={issue_id}&time={start_ts}-{end_ts}
```

**时间参数自动计算（最近一天）：**
- `end_ts` = 当前时间的毫秒时间戳
- `start_ts` = `end_ts` - 86400000（24小时的毫秒数）

**示例（假设当前时间戳为 1774562820000）：**
```
https://unisdk.nie.netease.com/appdump/g37/identify-detail?identify=fa063e5dc17aaf6df388aa32165c3986&time=1774476420000-1774562820000
```

> 💡 **提示**：可用 JavaScript 快速计算：`Date.now()` 获取当前毫秒时间戳。

## 第二步：下载闪退关联文件

**先清理本地缓存**（避免旧文件干扰分析）：

```bash
# Windows
if exist crash_files rmdir /s /q crash_files

# macOS / Linux
rm -rf crash_files
```

然后获取完整的崩溃上下文：

```bash
crashhunter download "<dump_url>" --output-dir ./crash_files
```

> **URL 必须加引号** — 因为 URL 中包含 `&` 等特殊字符。

该命令会直接输出文本文件内容，并将二进制文件保存到磁盘：

| 文件 | 分析价值 |
|------|---------|
| **di**（设备信息） | CPU、内存、GPU 驱动、崩溃时间 vs 启动时间 |
| **crashHunterParam.txt** | 应用版本、引擎版本、用户 ID、平台信息 |
| **log.txt / UniTrace.log** | 崩溃前日志、错误信息、状态变化 |
| **dmp**（minidump） | 二进制文件，需用 WinDbg 分析（仅保存到磁盘） |
| **{identify}-analyze** | 完整 minidump 分析报告，包含所有线程堆栈（仅保存到磁盘，需要时再读取） |

## 第三步：获取解析后的堆栈信息

```bash
crashhunter analyze "<dump_url>"
crashhunter analyze "<dump_url>" --no-local-vars  # 不含局部变量，缩短输出
```

返回内容：基本信息、设备信息、关键调用栈摘要、完整崩溃线程堆栈、局部变量（前 10 帧）。

## 第三步半（仅 Android）：获取 Tombstone 详情

```bash
crashhunter tombstone "<dump_url>"
crashhunter tombstone "<dump_url>" --sections maps,fd
```

可用信息段：`maps`（加载的 so 库）、`fd`（打开的文件描述符）、`threads`（线程名和函数调用）。

## 第四步：综合分析闪退原因

结合所有下载的文件和堆栈信息，从以下维度分析：

1. **崩溃类型** — 根据 Error Type / Crash Reason 判断（空指针、越界访问、栈溢出、非法指令等）
2. **堆栈分析** — 找到最顶层属于项目代码的函数（跳过系统库/第三方库），追踪调用链路
3. **局部变量** — 检查崩溃帧附近的空指针、异常值、未初始化变量
4. **设备信息（di）** — 检查存活时间（launch_time vs crash_time 判断是否启动即崩），可用内存、GPU 驱动
5. **日志文件** — 搜索崩溃前的错误/警告、状态变化、资源加载失败
6. **crashHunterParam** — 确认版本号、平台、构建配置
7. **源码定位** — 如果工作区包含相关源码，定位到具体代码行，分析触发条件
8. **{identify}-analyze 文件** — 如需深入分析其他线程，读取此文件获取所有线程堆栈

## 第五步：输出分析报告

1. **崩溃摘要** — 一句话概括闪退根因
2. **详细分析** — 逐步推理过程，附带证据
3. **关键证据** — 关键堆栈帧、变量值、日志条目
4. **修复建议** — 具体的代码修改方案
5. **预防措施** — 如何避免同类问题

## 错误处理

| 错误 | 处理方式 |
|------|---------|
| `command not found: crashhunter` | 从内置资源安装（见第零步） |
| "未登录或登录已过期" | 执行 `crashhunter login` |
| "No dump data found" | 请用户确认 URL 是否正确 |
| 超时 / 网络错误 | 检查网络后重试 |
