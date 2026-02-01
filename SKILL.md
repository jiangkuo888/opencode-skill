# OpenCode Skill（v2.2）

**重要更新（2026-02-01）**：使用 **tmux attach 模式**，让用户能看到 OpenCode 窗口！

## ⚠️ 使用模式：必须用 attach 模式！

**✅ 正确方式**：
```bash
# 1. 我启动任务（自动创建 tmux 会话）
tmux new-session -s opencode-task "cd project && opencode run '任务'"

# 2. 你查看窗口
tmux attach -t opencode-task

# 3. 你想干别的 → 直接关这个窗口，开新的 Terminal 做别的

# 4. 任务完成了
tmux kill-session -t opencode-task
```

**❌ 错误方式（已禁用）**：
```bash
tmux new-session -d -s opencode-task "..."  # 后台模式，用户看不到！
opencode run "任务"  # 直接执行，丢失交互式输出
```

## 核心概念：为什么用 tmux attach？

OpenCode 是**交互式**程序，需要 TTY（终端）环境。

**attach 模式的优势**：
- ✅ 用户能看到 OpenCode 窗口
- ✅ 实时监控进度
- ✅ 随时可以干预（Ctrl+C 终止）
- ✅ 任务在后台持续运行，不阻塞主会话
- ✅ 用户想干活就开新的 Terminal，互不干扰

**简单理解**：
```bash
# 你想看 → tmux attach -t opencode-task
# 你想干活 → 开新的 Terminal
# 完成了 → tmux kill-session -t opencode-task
```

## 功能

- **代码开发**：使用 OpenCode 进行代码编写、修改、重构（通过 tmux attach 会话）
- **任务管理**：attach 查看、状态检查、输出获取、终止任务
- **多模型支持**：支持 OpenAI、Anthropic、MiniMax 等多种模型

## 使用场景

当用户需要：
- 进行软件开发任务（写代码、改 bug、重构）
- 使用 AI 编码代理代替自己编码
- 长时间运行的任务（不阻塞主会话）

## 前置条件

1. **安装 OpenCode**：
   ```bash
   curl -fsSL https://opencode.ai/install | bash
   ```

2. **配置 API Key**：
   ```bash
   opencode auth login
   # 或设置环境变量
   export OPENAI_API_KEY="sk-xxx"
   export ANTHROPIC_API_KEY="sk-ant-xxx"
   ```

3. **安装 tmux**：
   ```bash
   # macOS
   brew install tmux
   
   # Linux
   sudo apt install tmux
   
   # Windows (WSL)
   sudo apt install tmux
   ```

4. **初始化项目**（首次使用）：
   ```bash
   cd /path/to/project
   opencode
   /init  # 创建 AGENTS.md
   ```

## 工具

### opencode_run

**在 tmux attach 会话中运行 OpenCode 任务**。用户会看到 tmux 窗口，可以实时监控和干预。

**输入参数**：
- `command`: 要执行的开发任务描述
- `directory`: 项目目录（可选，默认当前工作目录）
- `model`: 使用的模型（可选）

**返回**：
- `session_id`: tmux 会话 ID
- `output`: 任务输出
- `success`: 是否成功
- `truncated`: 输出是否被截断

**使用流程**：
```bash
# 1. 启动任务（用户会看到 tmux 窗口）
tmux new-session -s opencode-task "cd /path && opencode run '任务'"

# 2. 你想看 → attach 查看
tmux attach -t opencode-task

# 3. 你想干活 → 关这个窗口，开新的 Terminal 做别的

# 4. 完成了 → kill 清理
tmux kill-session -t opencode-task
```

**示例**：
```javascript
{
  command: "添加用户登录功能，包含注册、登录、登出",
  directory: "/Users/chkj/project/myapp",
  model: "anthropic/claude-3-5-sonnet"
}
```

### opencode_attach

**Attach 到正在运行的 OpenCode 会话**。这是关键功能，让用户能够实时看到 OpenCode 窗口！

**输入参数**：
- `session_id`: tmux 会话 ID（可选，默认最后一个 opencode 会话）

**返回**：
- `session_id`: tmux 会话 ID
- `command`: attach 命令（用户可以在终端执行）

**示例**：
```bash
# 查看 OpenCode 窗口
tmux attach -t opencode-task

# 想干活就开新的 Terminal，做完了再来看
```

### opencode_background

在后台启动 OpenCode 任务（不等待完成）。**仍会显示窗口，但不在前台阻塞**。

**输入参数**：
- `command`: 要执行的开发任务描述
- `directory`: 项目目录

**返回**：
- `session_id`: tmux 会话 ID
- `message`: 启动信息 + attach 命令

**后续操作**：
- 用 `opencode_attach` 查看窗口
- 用 `opencode_status` 检查进度
- 用 `opencode_output` 获取输出
- 用 `opencode_kill` 终止任务

### opencode_status

检查任务状态。

**输入参数**：
- `session_id`: tmux 会话 ID

**返回**：
- `is_running`: 是否还在运行
- `output`: 当前输出
- `prompt_visible`: OpenCode 提示符是否可见（表示任务完成）

### opencode_output

获取任务完整输出。

**输入参数**：
- `session_id`: tmux 会话 ID
- `lines`: 获取最后 N 行（默认 50）

### opencode_send

向任务发送输入（如确认 "y"）。

**输入参数**：
- `session_id`: tmux 会话 ID
- `input`: 要发送的输入（默认 "y"）

### opencode_kill

终止任务。

**输入参数**：
- `session_id`: tmux 会话 ID

### opencode_list

列出所有运行中的 OpenCode 任务。

## 使用示例

### 示例 1：简单任务（等待完成）

```
用户：帮我添加用户登录功能

→ 调用 opencode_run({
  command: "实现用户登录功能，包含：1) 登录表单 2) 密码验证 3) Session 管理 4) 登出功能",
  directory: "/Users/chkj/project"
})
```

### 示例 2：长时间任务（后台运行）

```
用户：重构整个后端代码

→ 调用 opencode_background({
  command: "重构后端代码，使用最佳实践，添加类型注解和错误处理",
  directory: "/Users/chkj/project/backend"
})

→ 返回 session_id
→ 用户可以稍后用 opencode_status 检查进度
```

### 示例 3：需要确认的任务

```
用户：删除测试文件

→ 调用 opencode_run
→ OpenCode 询问 "确认删除？"
→ 调用 opencode_send({ session_id: "xxx", input: "y" })
→ 任务继续
```

## 集成方式

### 方式 1：通过 Clawdbot skill（推荐）

Clawdbot 自动加载 skill，直接用自然语言：

```
用户：用 OpenCode 帮我添加单元测试
→ Clawdbot 自动调用 opencode_run
```

### 方式 2：直接使用 tmux（手动）

```bash
# 创建会话（用户会看到窗口）
tmux new-session -s my-task "cd project && opencode run '任务'"

# 查看进度
tmux attach -t my-task

# 想干活就开新的 Terminal，做完了再来看

# 获取输出
tmux capture-pane -p -t my-task

# 清理
tmux kill-session -t my-task
```

## 最佳实践

1. **明确任务描述**：像和初级开发者说话一样描述需求
2. **使用计划模式**：复杂功能先让 OpenCode 创建计划
   ```
   用户：先创建计划，再实现
   → opencode_run: "创建用户认证功能的详细计划"
   → 用户确认计划
   → opencode_run: "实现上述计划"
   ```
3. **长时间任务用 background**：不阻塞主会话
4. **及时检查状态**：用 `opencode_status` 确认任务完成
5. **清理会话**：任务完成后 tmux 会话会自动清理

## 常见问题

### Q: 任务卡住不动

检查状态：
```javascript
opencode_status({ session_id: "xxx" })
```
如果 `prompt_visible` 为 true，说明任务已完成，只是输出还没读取。

### Q: 如何知道任务完成了？

当 `opencode_status` 返回 `prompt_visible: true` 时，表示 OpenCode 提示符出现，任务完成。

### Q: 需要发送多个输入怎么办？

多次调用 `opencode_send`：
```javascript
opencode_send({ session_id: "xxx", input: "y" })
opencode_send({ session_id: "xxx", input: "n" })
opencode_send({ session_id: "xxx", input: "confirm" })
```

### Q: tmux 命令不存在

安装 tmux：
```bash
# macOS
brew install tmux

# Ubuntu/Debian
sudo apt install tmux

# Fedora
sudo dnf install tmux
```

## 限制

- 需要安装 tmux
- 需要配置有效的 API Key
- 默认超时 5 分钟
- 长时间任务建议用 background 模式

## 相关资源

- [OpenCode 官方文档](https://opencode.ai/docs/)
- [GitHub 仓库](https://github.com/opencode-ai/opencode)
- [Coding Agent Skill（参考实现）](https://github.com/clawdbot/clawdbot/blob/main/skills/coding-agent/SKILL.md)
