# OpenCode Skill for Clawdbot

让 Clawdbot 可以调用 OpenCode AI 编码代理进行软件开发的 skill。

## 📦 安装

### 1. 安装 OpenCode CLI

```bash
# macOS/Linux
curl -fsSL https://opencode.ai/install | bash

# 或使用 Homebrew
brew install anomalyco/tap/opencode

# 或使用 npm
npm install -g opencode-ai
```

### 2. 配置 API Key

```bash
# 交互式配置
opencode auth login

# 或设置环境变量
export OPENAI_API_KEY="sk-xxx"
export ANTHROPIC_API_KEY="sk-ant-xxx"

# MiniMax 用户
export MINIMAX_API_KEY="your-minimax-key"
```

### 3. 初始化项目（首次使用）

```bash
cd /path/to/your/project
opencode
/init  # 创建 AGENTS.md
```

### 4. 验证安装

```bash
opencode run "Hello world" --format json
```

## 📁 文件结构

```
opencode/
├── SKILL.md           # 技能文档
├── opencode.js        # 主要工具代码
├── opencode-skill.sh  # CLI 封装脚本
└── README.md          # 本文件
```

## 🚀 使用方法

### 方式 1：在 Clawdbot 中使用

Clawdbot 会自动加载此 skill。直接用自然语言描述任务：

```
用户：帮我添加用户登录功能
→ Clawdbot 自动调用 OpenCode 执行任务
```

### 方式 2：直接使用 CLI

```bash
# 基本用法
./opencode-skill.sh "添加用户登录功能" /path/to/project

# 继续上一个会话
./opencode-skill.sh "继续实现" /path/to/project --continue

# 使用指定模型
./opencode-skill.sh "重构代码" /path/to/project --model anthropic/claude-3-5-sonnet
```

## 🔧 可用工具

### opencode_run

运行 OpenCode 开发任务。

```javascript
{
  command: "添加用户注册功能",
  directory: "/path/to/project",
  model: "anthropic/claude-3-5-sonnet",
  continue_session: false,
  share: false
}
```

### opencode_session

管理 OpenCode 会话。

```javascript
{
  action: "list",      // list, get, continue, share
  session_id: "xxx",
  max_count: 10
}
```

### opencode_analyze

分析项目结构。

```javascript
{
  directory: "/path/to/project"
}
```

### opencode_serve

启动 OpenCode 服务器（用于 SDK）。

```javascript
{
  port: 4096,
  hostname: "127.0.0.1"
}
```

### opencode_quick_task

快速执行简单任务（委派给子 agent）。

```javascript
{
  task: "修复登录 bug",
  directory: "/path/to/project"
}
```

## 💡 示例

### 示例 1：添加新功能

```
用户：在 currentproject 目录添加用户头像上传功能

Clawdbot 调用：
opencode_run({
  command: "实现用户头像上传功能，包含：1) 前端上传组件 2) 后端 API 3) 图片存储 4) 尺寸限制",
  directory: "/Users/chkj/currentproject"
})
```

### 示例 2：代码重构

```
用户：重构 authentication.ts 文件

Clawdbot 调用：
opencode_run({
  command: "重构 src/auth/authentication.ts，使用 TypeScript最佳实践，添加类型注解和错误处理",
  directory: "/Users/chkj/currentproject"
})
```

### 示例 3：Bug 修复

```
用户：修复登录页面输入框不响应的问题

Clawdbot 调用：
opencode_run({
  command: "调查并修复登录页面输入框不响应的问题，可能需要检查事件监听器",
  directory: "/Users/chkj/currentproject"
})
```

### 示例 4：项目分析

```
用户：分析这个项目的架构

Clawdbot 调用：
opencode_analyze({
  directory: "/Users/chkj/currentproject"
})
```

## ⚙️ 配置

### 环境变量

在 `~/.claude/settings.json` 或 shell 配置文件中：

```json
{
  "env": {
    "OPENAI_API_KEY": "sk-xxx",
    "ANTHROPIC_API_KEY": "sk-ant-xxx",
    "OPENCODE_SERVER_PASSWORD": "xxx",
    "OPENCODE_DISABLE_AUTOUPDATE": "true"
  }
}
```

### 配置文件

OpenCode 配置文件位置：
- macOS: `~/Library/Application Support/opencode/opencode.json`
- Linux: `~/.config/opencode/opencode.json`
- Windows: `%APPDATA%\opencode\opencode.json`

## 🐛 常见问题

### Q: opencode: command not found

确保 OpenCode 已正确安装：
```bash
which opencode
# 如果没有，添加到 PATH 或重新安装
```

### Q: API key 无效

重新配置认证：
```bash
opencode auth logout
opencode auth login
```

### Q: 权限被拒绝

检查 API Key 权限和配额。

### Q: 会话超时

增加超时时间或简化任务描述。

## 📚 相关资源

- [OpenCode 官方文档](https://opencode.ai/docs/)
- [GitHub 仓库](https://github.com/opencode-ai/opencode)
- [OpenCode Zen](https://opencode.ai/zen)

## 📝 更新日志

### v1.0.0 (2026-02-01)
- 初始版本
- 支持基本开发任务
- 支持会话管理
- 支持项目分析
