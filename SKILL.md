# OpenCode Skill（v2.0）

**重要更新（2026-02-01）**：现在使用 **tmux 交互式会话**调用 OpenCode，这是官方推荐的最佳实践！

OpenCode 是交互式 AI 编码代理，需要 TTY 环境。直接 exec 会丢失交互能力，通过 tmux 会话可以：
- 保持交互式会话
- 实时捕获输出
- 支持发送输入（如确认）
- 任务完成后自动清理

## 功能

- **代码开发**：使用 OpenCode 进行代码编写、修改、重构（通过 tmux 交互式会话）
- **任务管理**：后台启动、状态检查、输出获取、终止任务
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

## 核心概念：为什么用 tmux？

OpenCode 是**交互式**程序，需要 TTY（终端）环境。直接 exec 会丢失交互能力。

**正确方式（tmux）**：
```bash
# 创建 tmux 会话
tmux new-session -d -s opencode-task "cd project && opencode run '任务'"

# 实时捕获输出
tmux capture-pane -p -t opencode-task

# 发送输入（如需要确认）
tmux send-keys -t opencode-task "y" Enter

# 检查是否完成（看到提示符）
tmux capture-pane -p -t opencode-task -S -3 | grep -q "❯" && echo "Done!"

# 清理
tmux kill-session -t opencode-task
```

**错误方式（直接 exec）**：
```bash
opencode run "任务"  # 丢失交互式输出，可能无法正常返回结果
```

## 工具

### opencode_run

**在 tmux 会话中运行 OpenCode 任务（推荐）**。任务完成后自动清理会话。

**输入参数**：
- `command`: 要执行的开发任务描述
- `directory`: 项目目录（可选，默认当前工作目录）
- `model`: 使用的模型（可选）

**返回**：
- `session_id`: tmux 会话 ID
- `output`: 任务输出
- `success`: 是否成功
- `truncated`: 输出是否被截断

**示例**：
```javascript
{
  command: "添加用户登录功能，包含注册、登录、登出",
  directory: "/Users/chkj/project/myapp",
  model: "anthropic/claude-3-5-sonnet"
}
```

### opencode_background

在后台启动 OpenCode 任务（不等待完成）。适合长时间运行的任务。

**输入参数**：
- `command`: 要执行的开发任务描述
- `directory`: 项目目录

**返回**：
- `session_id`: tmux 会话 ID
- `message`: 启动信息

**后续操作**：
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
# 创建会话
tmux new-session -d -s my-task "cd project && opencode run '任务'"

# 监控进度
tmux capture-pane -p -t my-task -S -20

# 发送确认
tmux send-keys -t my-task "y" Enter

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
