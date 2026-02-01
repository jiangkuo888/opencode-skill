# OpenCode Skill

使用 OpenCode AI 编码代理进行软件开发的 skill。OpenCode 是一个开源的 AI 编程代理，支持多种 LLM 提供商，可以通过 CLI 或 SDK 调用。

## 功能

- **代码开发**：使用 OpenCode 进行代码编写、修改、重构
- **项目分析**：让 OpenCode 分析项目结构和代码模式
- **计划模式**：先查看实现计划，再执行
- **会话管理**：创建、继续、分享 OpenCode 会话
- **多模型支持**：支持 OpenAI、Anthropic、MiniMax 等多种模型

## 使用场景

当用户需要：
- 进行软件开发任务（写代码、改 bug、重构）
- 分析项目代码结构
- 生成代码计划
- 使用 AI 编码代理代替自己编码

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

3. **初始化项目**（首次使用）：
   ```bash
   cd /path/to/project
   opencode
   /init  # 创建 AGENTS.md
   ```

## 使用方法

### 基本开发任务

```
用户：帮我添加用户登录功能
→ 调用 opencode_run 任务："在当前项目中实现用户登录功能，包含注册、登录、登出..."
```

### 代码分析

```
用户：分析这个项目的架构
→ 调用 opencode_run 任务："分析当前项目的架构和代码结构"
```

### 重构任务

```
用户：重构这个函数，让它更易读
→ 调用 opencode_run 任务："重构 src/auth.ts 中的 login 函数，使其更易读"
```

### 先计划后执行

```
用户：创建一个计划，实现消息推送功能
→ 调用 opencode_run 任务："创建实现消息推送功能的详细计划"
```

## 工具

### opencode_run

在指定目录运行 OpenCode 命令。

**输入参数**：
- `command`: 要执行的开发任务描述
- `directory`: 项目目录（可选，默认当前工作目录）
- `model`: 使用的模型（可选，默认使用配置中的模型）
- `continue_session`: 是否继续上一个会话
- `share`: 是否分享会话

**返回**：
- OpenCode 的输出结果
- 会话 ID（可用于后续操作）

**示例**：
```javascript
{
  command: "添加用户注册功能，包含表单验证和密码加密",
  directory: "/Users/chkj/project/myapp",
  model: "anthropic/claude-3-5-sonnet"
}
```

### opencode_session

管理 OpenCode 会话。

**输入参数**：
- `action`: 操作类型（list、get、continue、share）
- `session_id`: 会话 ID（对于 get、continue 操作）
- `max_count`: 列出最多 N 个会话

**返回**：
- 会话列表或指定会话详情

### opencode_analyze

分析项目并创建 AGENTS.md。

**输入参数**：
- `directory`: 项目目录

**返回**：
- 分析结果和 AGENTS.md 内容

## 配置

### 环境变量

```bash
# 认证
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
MINIMAX_API_KEY=xxx

# 服务器
OPENCODE_SERVER_PASSWORD=xxx

# 功能开关
OPENCODE_DISABLE_AUTOUPDATE=true
OPENCODE_EXPERIMENTAL_LSP_TOOL=true
```

### 配置文件

OpenCode 使用 `~/Library/Application Support/opencode/opencode.json`（macOS）或 `~/.config/opencode/opencode.json`（Linux）作为配置文件。

## 集成方式

### 方式 1：直接调用 CLI（推荐）

使用 `exec` 工具直接调用 `opencode run` 命令：

```bash
opencode run "添加用户登录功能" --dir /path/to/project
```

### 方式 2：启动服务器 + SDK

1. 启动 OpenCode 服务器：
   ```bash
   opencode serve --port 4096
   ```

2. 使用 SDK 连接：
   ```typescript
   import { createOpencodeClient } from "@opencode-ai/sdk"
   
   const client = createOpencodeClient({
     baseUrl: "http://localhost:4096"
   })
   
   await client.session.prompt({
     path: { id: sessionId },
     body: { parts: [{ type: "text", text: "任务描述" }] }
   })
   ```

## 最佳实践

1. **明确任务描述**：像和初级开发者说话一样描述需求
2. **使用计划模式**：复杂功能先看计划再执行
3. **版本控制**：提交前检查 git 变更
4. **会话管理**：重要任务创建独立会话，方便回溯
5. **安全敏感**：不要在提示中包含密钥或密码

## 限制

- 需要安装 OpenCode CLI
- 需要配置有效的 API Key
- 某些功能需要较长的上下文窗口
- 复杂项目首次初始化可能需要较长时间

## 相关资源

- [OpenCode 官方文档](https://opencode.ai/docs/)
- [GitHub 仓库](https://github.com/opencode-ai/opencode)
- [OpenCode Zen（精选模型）](https://opencode.ai/zen)
