/**
 * OpenCode Skill - 使用 OpenCode AI 编码代理进行软件开发
 * 
 * 最佳实践：通过 tmux 交互式会话调用 OpenCode（不是直接 exec run）
 * 
 * 工具函数：
 * - opencode_run: 使用 tmux 交互式会话运行 OpenCode 任务
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
 * 在 tmux 会话中运行 OpenCode 任务（交互式方式）
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
    // 1. 创建 tmux 会话（后台运行）
    await exec({
      command: `tmux new-session -d -s ${sessionId} "${opencodeCmd}"`,
      security: "allowlist"
    })

    // 2. 等待任务完成（轮询检查输出）
    const startTime = Date.now()
    let output = ""
    let isComplete = false

    while (Date.now() - startTime < DEFAULT_TIMEOUT && !isComplete) {
      await sleep(3000) // 每3秒检查一次

      // 捕获 tmux 输出
      const result = await exec({
        command: `tmux capture-pane -p -t ${sessionId} -S -50`,
        security: "allowlist"
      })

      output = result.stdout || ""

      // 检查是否完成（看到 OpenCode 提示符）
      if (output.includes("❯") || output.includes("›")) {
        isComplete = true
      }

      // 检查是否出错
      if (output.toLowerCase().includes("error") && !output.includes("noReply")) {
        isComplete = true
      }
    }

    // 3. 获取最终输出
    const finalResult = await exec({
      command: `tmux capture-pane -p -t ${sessionId} -S -100`,
      security: "allowlist"
    })

    // 4. 清理 tmux 会话
    await exec({
      command: `tmux kill-session -t ${sessionId} 2>/dev/null || true`,
      security: "allowlist"
    })

    // 5. 解析输出
    const cleanedOutput = cleanOutput(finalResult.stdout || "")

    return {
      success: !cleanedOutput.toLowerCase().includes("error"),
      session_id: sessionId,
      output: cleanedOutput,
      truncated: cleanedOutput.length > 10000
    }

  } catch (error) {
    // 清理 tmux 会话
    await exec({
      command: `tmux kill-session -t ${sessionId} 2>/dev/null || true`,
      security: "allowlist"
    })

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
 * 在后台启动 OpenCode 任务（不等待完成）
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
    // 创建 tmux 会话
    await exec({
      command: `tmux new-session -d -s ${sessionId} "${opencodeCmd}"`,
      security: "allowlist"
    })

    return {
      success: true,
      session_id: sessionId,
      message: `任务已在 tmux 会话 ${sessionId} 中启动`,
      hint: "使用 opencode_status 检查进度，使用 opencode_output 获取输出"
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
  opencode_status,
  opencode_output,
  opencode_send,
  opencode_kill,
  opencode_list
}

export const skill = {
  name: "opencode",
  description: "使用 OpenCode AI 编码代理进行软件开发（通过 tmux 交互式会话）",
  version: "2.0.0",
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
    use_tmux: true
  },
  
  info: {
    prerequisites: [
      "安装 OpenCode CLI: curl -fsSL https://opencode.ai/install | bash",
      "配置 API Key: opencode auth login",
      "安装 tmux（系统包管理器）"
    ]
  }
}

export default skill
