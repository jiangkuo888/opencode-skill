/**
 * OpenCode Skill - 使用 OpenCode AI 编码代理进行软件开发
 * 
 * 最佳实践：通过 tmux attach 模式调用 OpenCode
 * - 用户可以看到 OpenCode 窗口
 * - 子代理可以自动化管理任务
 * 
 * 工具函数：
 * - opencode_run: 使用 tmux attach 模式运行 OpenCode 任务
 * - opencode_attach: attach 到会话查看进度
 * - opencode_status: 检查任务状态
 * - opencode_kill: 终止任务
 * - opencode_send: 发送输入（如确认信息）
 */

import { exec, process } from "../tooltronic.js"

// ============================================================================
// 配置
// ============================================================================

const DEFAULT_TIMEOUT = 300000; // 5分钟
const SESSION_PREFIX = "opencode-";

// ============================================================================
// Tool: opencode_run
// ============================================================================

/**
 * 在 tmux attach 会话中运行 OpenCode 任务
 * 用户可以看到窗口，子代理可以自动化管理
 * 
 * @param {Object} args
 * @param {string} args.command - 要执行的开发任务描述
 * @param {string} args.directory - 项目目录（可选，默认当前工作目录）
 * @param {string} args.model - 使用的模型（可选）
 * @returns {Promise<Object>}
 */
async function opencode_run(args) {
  const {
    command,
    directory = process.cwd(),
    model = null
  } = args

  // 生成唯一会话名
  const sessionId = `${SESSION_PREFIX}${Date.now()}`
  
  // 构建 OpenCode 命令
  let opencodeCmd = `cd "${directory}" && opencode run "${command.replace(/"/g, '\\"')}" --format json`
  if (model) {
    opencodeCmd += ` --model ${model}`
  }

  try {
    // 1. 创建 tmux 会话（attach 模式，用户能看到窗口）
    await exec({
      command: `tmux new-session -s ${sessionId} "${opencodeCmd}"`,
      security: "allowlist"
    })

    // 返回 attach 命令，让用户可以查看
    return {
      success: true,
      session_id: sessionId,
      message: `任务已在 tmux 会话 ${sessionId} 中启动`,
      attach_command: `tmux attach -t ${sessionId}`,
      hint: "执行 tmux attach -t ${sessionId} 查看窗口",
      output: "",
      truncated: false
    }

  } catch (error) {
    return {
      success: false,
      error: error.message,
      session_id: sessionId,
      hint: "确保 tmux 已安装且 OpenCode CLI 配置正确"
    }
  }
}

// ============================================================================
// Tool: opencode_background
// ============================================================================

/**
 * 在后台启动 OpenCode 任务（attach 模式，用户能看到窗口）
 * 
 * @param {Object} args
 * @param {string} args.command - 要执行的开发任务描述
 * @param {string} args.directory - 项目目录
 * @returns {Promise<Object>}
 */
async function opencode_background(args) {
  const { command, directory = process.cwd() } = args

  const sessionId = `${SESSION_PREFIX}${Date.now()}`
  const opencodeCmd = `cd "${directory}" && opencode run "${command.replace(/"/g, '\\"')}"`

  try {
    // 创建 tmux 会话（attach 模式）
    await exec({
      command: `tmux new-session -s ${sessionId} "${opencodeCmd}"`,
      security: "allowlist"
    })

    return {
      success: true,
      session_id: sessionId,
      message: `任务已在 tmux 会话 ${sessionId} 中启动`,
      attach_command: `tmux attach -t ${sessionId}`,
      hint: "执行 tmux attach -t ${sessionId} 查看窗口"
    }

  } catch (error) {
    return {
      success: false,
      error: error.message,
      hint: "确保 tmux 已安装"
    }
  }
}

// ============================================================================
// Tool: opencode_attach
// ============================================================================

/**
 * Attach 到正在运行的 OpenCode 会话
 * 
 * @param {Object} args
 * @param {string} args.session_id - tmux 会话 ID（可选，默认最后一个）
 * @returns {Promise<Object>}
 */
async function opencode_attach(args) {
  const { session_id = null } = args

  let targetSession = session_id

  // 如果没有指定，查找最后一个会话
  if (!targetSession) {
    try {
      const result = await exec({
        command: `tmux list-sessions -F "#{session_name}" 2>/dev/null | grep ${SESSION_PREFIX} | tail -1`,
        security: "allowlist"
      })
      targetSession = result.stdout.trim()
    } catch {
      return {
        success: false,
        error: "未找到运行中的 OpenCode 会话",
        hint: "使用 opencode_run 或 opencode_background 先启动任务"
      }
    }
  }

  if (!targetSession) {
    return {
      success: false,
      error: "未找到运行中的 OpenCode 会话",
      hint: "使用 opencode_run 或 opencode_background 先启动任务"
    }
  }

  return {
    success: true,
    session_id: targetSession,
    attach_command: `tmux attach -t ${targetSession}`,
    hint: "执行 tmux attach -t ${targetSession} 查看窗口",
    manual_attach: "或者直接开新的 Terminal 执行上述命令"
  }
}

// ============================================================================
// Tool: opencode_status
// ============================================================================

/**
 * 检查 OpenCode 任务状态
 * 
 * @param {Object} args
 * @param {string} args.session_id - tmux 会话 ID
 * @returns {Promise<Object>}
 */
async function opencode_status(args) {
  const { session_id } = args

  try {
    // 检查会话是否存在
    const checkResult = await exec({
      command: `tmux has-session -t ${session_id} 2>&1 && echo "running" || echo "not_found"`,
      security: "allowlist"
    })

    const isRunning = checkResult.stdout.includes("running")

    // 获取输出
    let output = ""
    if (isRunning) {
      const captureResult = await exec({
        command: `tmux capture-pane -p -t ${session_id} -S -30`,
        security: "allowlist"
      })
      output = cleanOutput(captureResult.stdout || "")
    }

    return {
      success: true,
      session_id,
      is_running: isRunning,
      output: output,
      prompt_visible: output.includes("❯") || output.includes("›")
    }

  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

// ============================================================================
// Tool: opencode_output
// ============================================================================

/**
 * 获取 OpenCode 任务输出
 * 
 * @param {Object} args
 * @param {string} args.session_id - tmux 会话 ID
 * @param {number} args.lines - 获取最后 N 行（默认 50）
 * @returns {Promise<Object>}
 */
async function opencode_output(args) {
  const { session_id, lines = 50 } = args

  try {
    const result = await exec({
      command: `tmux capture-pane -p -t ${session_id} -S -${lines}`,
      security: "allowlist"
    })

    return {
      success: true,
      session_id,
      output: cleanOutput(result.stdout || "")
    }

  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

// ============================================================================
// Tool: opencode_send
// ============================================================================

/**
 * 向 OpenCode 发送输入（如确认 "y"）
 * 
 * @param {Object} args
 * @param {string} args.session_id - tmux 会话 ID
 * @param {string} args.input - 要发送的输入
 * @returns {Promise<Object>}
 */
async function opencode_send(args) {
  const { session_id, input = "y" } = args

  try {
    await exec({
      command: `tmux send-keys -t ${session_id} "${input}" Enter`,
      security: "allowlist"
    })

    return {
      success: true,
      message: `已向会话 ${session_id} 发送: ${input}`
    }

  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

// ============================================================================
// Tool: opencode_kill
// ============================================================================

/**
 * 终止 OpenCode 任务
 * 
 * @param {Object} args
 * @param {string} args.session_id - tmux 会话 ID
 * @returns {Promise<Object>}
 */
async function opencode_kill(args) {
  const { session_id } = args

  try {
    await exec({
      command: `tmux kill-session -t ${session_id}`,
      security: "allowlist"
    })

    return {
      success: true,
      message: `会话 ${session_id} 已终止`
    }

  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

// ============================================================================
// Tool: opencode_list
// ============================================================================

/**
 * 列出所有 OpenCode 任务会话
 * 
 * @returns {Promise<Object>}
 */
async function opencode_list() {
  try {
    const result = await exec({
      command: `tmux list-sessions -F "#{session_name}" 2>/dev/null | grep ${SESSION_PREFIX} || echo ""`,
      security: "allowlist"
    })

    const sessions = result.stdout
      .split("\n")
      .filter(s => s && s.startsWith(SESSION_PREFIX))
      .map(s => ({
        session_id: s,
        status: "running"
      }))

    return {
      success: true,
      sessions
    }

  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

// ============================================================================
// 辅助函数
// ============================================================================

function cleanOutput(output) {
  // 移除 ANSI 颜色码
  let cleaned = output.replace(/\x1b\[[0-9;]*m/g, "")
  
  // 移除 tmux 状态行
  cleaned = cleaned.replace(/\[%Y-%m-%d %H:%M\].*\n/g, "")
  
  // 移除多余空行
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n")
  
  return cleaned.trim()
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ============================================================================
// Skill 导出
// ============================================================================

export const tools = {
  opencode_run,
  opencode_background,
  opencode_attach,
  opencode_status,
  opencode_output,
  opencode_send,
  opencode_kill,
  opencode_list
}

export const skill = {
  name: "opencode",
  description: "使用 OpenCode AI 编码代理进行软件开发（通过 tmux attach 模式）",
  version: "2.2.0",
  author: "Clawdbot",
  
  triggers: [
    "opencode",
    "open code",
    "AI 编程",
    "编程代理",
    "帮我写代码"
  ],
  
  tools: Object.keys(tools),
  
  default_config: {
    model: null,
    directory: process.cwd(),
    timeout: 300000,
    use_tmux: true,
    tmux_mode: "attach"  // 改为 attach 模式
  },
  
  info: {
    prerequisites: [
      "安装 OpenCode CLI: curl -fsSL https://opencode.ai/install | bash",
      "配置 API Key: opencode auth login",
      "安装 tmux（系统包管理器）"
    ],
    usage: [
      "1. 使用 opencode_run 或 opencode_background 启动任务",
      "2. 用户执行 tmux attach -t <session_id> 查看窗口",
      "3. 子代理可以使用 opencode_status 检查状态",
      "4. 任务完成后使用 opencode_kill 清理会话"
    ]
  }
}

export default skill
