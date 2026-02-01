/**
 * OpenCode Skill - 使用 OpenCode AI 编码代理进行软件开发
 * 
 * 工具函数：
 * - opencode_run: 运行 OpenCode 开发任务
 * - opencode_session: 管理 OpenCode 会话
 * - opencode_analyze: 分析项目结构
 */

import { exec, sessions_spawn } from "../tooltronic.js"

// ============================================================================
// Tool: opencode_run
// ============================================================================

/**
 * 在指定目录运行 OpenCode 命令
 * 
 * @param {Object} args
 * @param {string} args.command - 要执行的开发任务描述
 * @param {string} args.directory - 项目目录（可选，默认当前工作目录）
 * @param {string} args.model - 使用的模型（可选）
 * @param {boolean} args.continue_session - 是否继续上一个会话
 * @param {boolean} args.share - 是否分享会话
 * @returns {Promise<Object>}
 */
async function opencode_run(args) {
  const {
    command,
    directory = process.cwd(),
    model = null,
    continue_session = false,
    share = false
  } = args

  // 构建命令
  let cmd = `cd "${directory}" && opencode run "${command.replace(/"/g, '\\"')}" --format json`
  
  if (continue_session) {
    cmd += " --continue"
  }
  
  if (share) {
    cmd += " --share"
  }
  
  if (model) {
    cmd += ` --model ${model}`
  }

  try {
    const result = await exec({
      command: cmd,
      timeout: 300000, // 5分钟超时
      security: "allowlist"
    })

    // 解析 JSON 输出
    let output = result.stdout || result.stderr
    
    try {
      // 尝试解析 JSON
      const jsonOutput = JSON.parse(output)
      return {
        success: true,
        output: jsonOutput,
        session_url: jsonOutput.share_url || null
      }
    } catch {
      // 如果不是 JSON，返回原始输出
      return {
        success: true,
        output: output,
        session_url: null
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      hint: "确保已安装 OpenCode CLI 并配置了 API Key"
    }
  }
}

// ============================================================================
// Tool: opencode_session
// ============================================================================

/**
 * 管理 OpenCode 会话
 * 
 * @param {Object} args
 * @param {string} args.action - 操作类型：list, get, continue, share
 * @param {string} args.session_id - 会话 ID（对于 get, continue 操作）
 * @param {number} args.max_count - 列出最多 N 个会话
 * @returns {Promise<Object>}
 */
async function opencode_session(args) {
  const { action, session_id = null, max_count = 10 } = args

  switch (action) {
    case "list":
      return await list_sessions(max_count)
    
    case "get":
      if (!session_id) {
        return { success: false, error: "需要提供 session_id" }
      }
      return await get_session(session_id)
    
    case "continue":
      if (!session_id) {
        return { success: false, error: "需要提供 session_id" }
      }
      return await continue_session(session_id)
    
    case "share":
      if (!session_id) {
        return { success: false, error: "需要提供 session_id" }
      }
      return await share_session(session_id)
    
    default:
      return { 
        success: false, 
        error: `未知的操作: ${action}`,
        hint: "支持的 action: list, get, continue, share"
      }
  }
}

async function list_sessions(max_count) {
  try {
    const result = await exec({
      command: `opencode session list --max-count ${max_count} --format json`,
      security: "allowlist"
    })
    
    return {
      success: true,
      sessions: JSON.parse(result.stdout || "[]")
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

async function get_session(session_id) {
  try {
    const result = await exec({
      command: `opencode export ${session_id}`,
      security: "allowlist"
    })
    
    return {
      success: true,
      session: JSON.parse(result.stdout || "{}")
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

async function continue_session(session_id) {
  // 返回继续会话的命令，用户可以在需要时执行
  return {
    success: true,
    command: `opencode run --session ${session_id} "继续之前的任务"`,
    session_id
  }
}

async function share_session(session_id) {
  try {
    const result = await exec({
      command: `opencode session share ${session_id}`,
      security: "allowlist"
    })
    
    return {
      success: true,
      share_url: result.stdout.trim() || null
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

// ============================================================================
// Tool: opencode_analyze
// ============================================================================

/**
 * 分析项目结构并创建 AGENTS.md
 * 
 * @param {Object} args
 * @param {string} args.directory - 项目目录
 * @returns {Promise<Object>}
 */
async function opencode_analyze(args) {
  const { directory = process.cwd() } = args

  try {
    // 运行 init 命令
    const result = await exec({
      command: `cd "${directory}" && opencode /init`,
      timeout: 120000,
      security: "allowlist"
    })

    // 读取生成的 AGENTS.md
    const agentsPath = `${directory}/AGENTS.md`
    
    try {
      const agentsContent = await readFile(agentsPath)
      return {
        success: true,
        agents_md: agentsContent,
        message: "项目分析完成，AGENTS.md 已创建"
      }
    } catch {
      return {
        success: true,
        message: "项目分析完成，但未找到 AGENTS.md",
        output: result.stdout
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      hint: "确保目录存在且包含代码文件"
    }
  }
}

// ============================================================================
// Tool: opencode_serve
// ============================================================================

/**
 * 启动 OpenCode 服务器（用于 SDK 连接）
 * 
 * @param {Object} args
 * @param {number} args.port - 端口（默认 4096）
 * @param {string} args.hostname - 主机名（默认 127.0.0.1）
 * @returns {Promise<Object>}
 */
async function opencode_serve(args) {
  const { port = 4096, hostname = "127.0.0.1" } = args

  const cmd = `opencode serve --port ${port} --hostname ${hostname}`
  
  // 在后台启动
  await exec({
    command: cmd,
    background: true,
    security: "allowlist"
  })

  return {
    success: true,
    message: `OpenCode 服务器已在 ${hostname}:${port} 启动`,
    hint: "使用 SDK 连接: createOpencodeClient({ baseUrl: 'http://localhost:4096' })"
  }
}

// ============================================================================
// Tool: opencode_quick_task (简化的任务执行)
// ============================================================================

/**
 * 快速执行简单的开发任务（委派给子 agent）
 * 
 * @param {Object} args
 * @param {string} args.task - 任务描述
 * @param {string} args.directory - 项目目录
 * @returns {Promise<Object>}
 */
async function opencode_quick_task(args) {
  const { task, directory = process.cwd() } = args

  // 委派给专门的 OpenCode agent
  const result = await sessions_spawn({
    agentId: "opencode_dev",
    task: `在目录 "${directory}" 中执行以下开发任务：\n\n${task}`,
    label: `OpenCode: ${task.substring(0, 50)}...`,
    timeoutSeconds: 600
  })

  return result
}

// ============================================================================
// 工具函数辅助
// ============================================================================

async function readFile(path) {
  const fs = await import("fs")
  return fs.readFileSync(path, "utf-8")
}

// ============================================================================
// Skill 导出
// ============================================================================

export const tools = {
  opencode_run,
  opencode_session,
  opencode_analyze,
  opencode_serve,
  opencode_quick_task
}

export const skill = {
  name: "opencode",
  description: "使用 OpenCode AI 编码代理进行软件开发",
  version: "1.0.0",
  author: "Clawdbot",
  
  triggers: [
    "opencode",
    "open code",
    "帮我写代码",
    "AI 编程",
    "编程代理"
  ],
  
  tools: Object.keys(tools),
  
  default_config: {
    model: null,
    directory: process.cwd(),
    timeout: 300000
  }
}

export default skill
