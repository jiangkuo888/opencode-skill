# OpenCode Skill for Clawdbot (v2.0)

让 Clawdbot 可以调用 OpenCode AI 编码代理进行软件开发的 skill。

**v2.0 更新**：现在使用 **tmux 交互式会话**，这是 OpenCode 官方推荐的调用方式！

## 📦 安装

### 1. 安装依赖

```bash
# 安装 OpenCode CLI
curl -fsSL https://opencode.ai/install | bash

# 安装 tmux（必需）
brew install tmux  # macOS
sudo apt install tmux  # Linux
```

### 2. 配置 API Key

```bash
# 交互式配置
opencode auth login

# 或设置环境变量
export OPENAI_API_KEY="sk-xxx"
export ANTHROPIC_API_KEY="sk-ant-xxx"
```

### 3. 初始化项目（首次使用）

```bash
cd /path/to/your/project
opencode
/init  # 创建 AGENTS.md
```

### 4. 验证安装

```bash
# 测试 OpenCode
which opencode

# 测试 tmux
which tmux
```

## 📁 文件结构

```
opencode/
├── SKILL.md           # 技能使用文档（必读）
├── opencode.js        # 主要工具代码
├── opencode-skill.sh  # CLI 封装脚本（已废弃）
└── README.md          # 本文件
```

## 🚀 使用方法

### 在 Clawdbot 中使用

Clawdbot 会自动加载此 skill。直接用自然语言描述任务：

```
用户：用 OpenCode 帮我添加用户登录功能
→ Clawdbot 自动调用 opencode_run，在 tmux 会话中运行任务
```

### 工具列表

| 工具 | 功能 | 使用场景 |
|-----|------|---------|
| `opencode_run` | 交互式运行任务（等待完成） | 简单任务 |
| `opencode_background` | 后台启动任务 | 长时间任务 |
| `opencode_status` | 检查任务状态 | 监控进度 |
| `opencode_output` | 获取任务输出 | 查看结果 |
| `opencode_send` | 发送输入 | 需要确认时 |
| `opencode_kill` | 终止任务 | 取消任务 |
| `opencode_list` | 列出所有任务 | 查看运行中 |

## 💡 使用示例

### 示例 1：简单任务

```javascript
// 自动调用
用户：添加用户登录功能

// 等效于调用
opencode_run({
  command: "实现用户登录功能，包含登录表单、密码验证、Session 管理",
  directory: "/Users/chkj/project"
})
```

### 示例 2：长时间任务

```javascript
// 后台启动
opencode_background({
  command: "重构整个后端代码",
  directory: "/Users/chkj/project/backend"
})
// 返回 { session_id: "opencode-xxx", ... }

// 稍后检查状态
opencode_status({ session_id: "opencode-xxx" })
// 返回 { is_running: true/false, output: "...", prompt_visible: true/false }
```

### 示例 3：需要确认的任务

```javascript
// 启动任务
const result = opencode_run({
  command: "删除所有测试文件",
  directory: "/Users/chkj/project"
})

// 如果 OpenCode 询问确认
opencode_send({
  session_id: result.session_id,
  input: "y"
})
```

## 🔧 核心概念

### 为什么用 tmux？

OpenCode 是**交互式**程序，需要 TTY 环境：

```
❌ 错误方式（直接 exec）：
opencode run "任务"  # 丢失交互式输出

✅ 正确方式（tmux）：
tmux new-session -d -s task "cd project && opencode run '任务'"
tmux capture-pane -p -t task  # 实时捕获输出
tmux kill-session -t task     # 清理
```

### 工作流程

```
1. 创建 tmux 会话
2. 启动 OpenCode
3. 轮询检查输出
4. 检测完成（看到提示符 ❯）
5. 获取并清理输出
6. 删除 tmux 会话
```

## 📖 文档

- **完整文档**：见 [SKILL.md](SKILL.md)
- **OpenCode 官方文档**：https://opencode.ai/docs/

## 🐛 常见问题

### tmux: command not found

```bash
# macOS
brew install tmux

# Linux
sudo apt install tmux
```

### 任务卡住不动

检查任务状态：
```javascript
opencode_status({ session_id: "xxx" })
```

### 如何知道任务完成？

当 `prompt_visible: true` 时，表示 OpenCode 提示符出现，任务完成。

## 📝 更新日志

### v2.0 (2026-02-01)
- **重大更新**：改用 tmux 交互式会话
- 新增工具：`opencode_background`、`opencode_status`、`opencode_output`、`opencode_send`、`opencode_kill`、`opencode_list`
- 废弃工具：`opencode_session`、`opencode_analyze`（合并到新工具）
- 更好的错误处理和输出清理

### v1.0 (2026-02-01)
- 初始版本
- 直接使用 `opencode run`（不推荐）

## 📚 相关资源

- [OpenCode 官方文档](https://opencode.ai/docs/)
- [GitHub 仓库](https://github.com/opencode-ai/opencode)
- [Clawdbot Coding Agent Skill](https://github.com/clawdbot/clawdbot/blob/main/skills/coding-agent/SKILL.md)
- [awesome-clawdbot-skills](https://github.com/VoltAgent/awesome-clawdbot-skills)

---

**提示**：查看 [SKILL.md](SKILL.md) 获取完整使用文档！
