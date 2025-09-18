#!/usr/bin/env node
/**
 * Tool Metrics Collection Hook for Manager Dashboard (Node.js Implementation)
 * Captures tool usage patterns, performance, and productivity metrics
 * 
 * Performance Requirements:
 * - Execution time: ≤50ms (Target: ≤30ms)
 * - Memory usage: ≤32MB (Target: ≤20MB)
 * - Zero Python dependencies (eliminated cchooks)
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { formatISO } = require('date-fns');
const { MetricsApiClient, sendToBackendWithFallback } = require('./metrics-api-client');

/**
 * Log metrics data to JSONL format for analytics processing and send to backend API.
 * Maintains backward compatibility with local storage while adding API integration.
 * @param {Object} data - Metrics data to log
 * @returns {Promise<Object>} Result with success status and method used
 */
async function logMetrics(data) {
    // Local storage fallback function
    const localFallback = async (metricsData) => {
        const metricsDir = path.join(os.homedir(), '.ai-mesh', 'metrics');
        await fs.ensureDir(metricsDir);
        
        // Main metrics log
        const metricsLog = path.join(metricsDir, 'tool-metrics.jsonl');
        await fs.appendFile(metricsLog, JSON.stringify(metricsData) + '\n');
        
        // Real-time activity log for dashboard
        const realtimeDir = path.join(metricsDir, 'realtime');
        await fs.ensureDir(realtimeDir);
        
        const activityFile = path.join(realtimeDir, 'activity.log');
        const timestamp = metricsData.timestamp || formatISO(new Date());
        const toolName = metricsData.tool_name || 'unknown';
        const status = metricsData.status || 'unknown';
        
        await fs.appendFile(activityFile, `${timestamp}|tool_complete|${toolName}|${status}\n`);
    };

    try {
        // Initialize API client
        const apiClient = new MetricsApiClient();
        
        // Send to backend with local fallback
        const result = await sendToBackendWithFallback(
            apiClient,
            apiClient.submitToolMetrics,
            data,
            localFallback
        );
        
        return result;
        
    } catch (error) {
        console.error('Warning: Failed to log metrics:', error);
        // Ensure local fallback is executed even if API client fails
        try {
            await localFallback(data);
            return {
                success: true,
                method: 'local_fallback',
                message: 'API client failed, data stored locally',
                error: error.message
            };
        } catch (fallbackError) {
            return {
                success: false,
                method: 'local_fallback',
                message: 'Both API and local storage failed',
                error: fallbackError.message
            };
        }
    }
}

/**
 * Get current session ID with fallback mechanism.
 * Resolves session ID consistency issue between hooks.
 * @returns {Promise<string>} Session ID or default fallback
 */
async function getCurrentSessionId() {
    // Primary: Environment variable (set by session-start)
    let sessionId = process.env.CLAUDE_SESSION_ID;
    
    if (!sessionId) {
        // Fallback: Read from persistent file
        try {
            const metricsDir = path.join(os.homedir(), '.ai-mesh', 'metrics');
            const sessionIdFile = path.join(metricsDir, '.current-session-id');
            if (await fs.pathExists(sessionIdFile)) {
                sessionId = (await fs.readFile(sessionIdFile, 'utf8')).trim();
            }
        } catch (error) {
            console.warn('Could not read session ID file:', error.message);
        }
    }
    
    // Last resort: Use default session
    return sessionId || 'default-session';
}

/**
 * Create hook context object (replaces cchooks PostToolUseContext).
 * Native Node.js context creation with tool execution details.
 * @param {Object} toolData - Tool execution data
 * @returns {Object} Hook context
 */
function createPostToolUseContext(toolData) {
    return {
        tool_name: toolData.toolName || 'unknown',
        tool_input: toolData.toolInput || {},
        error: toolData.error || null,
        timestamp: formatISO(new Date()),
        environment: {
            nodeVersion: process.version,
            platform: process.platform,
            architecture: process.arch
        }
    };
}

/**
 * Update real-time productivity indicators for dashboard.
 * Direct port of Python indicator update logic.
 * @param {Object} metrics - Metrics data
 * @returns {Promise<void>}
 */
async function updateProductivityIndicators(metrics) {
    try {
        const metricsDir = path.join(os.homedir(), '.ai-mesh', 'metrics');
        const indicatorsFile = path.join(metricsDir, 'productivity-indicators.json');
        
        // Load existing indicators or initialize
        let indicators;
        if (await fs.pathExists(indicatorsFile)) {
            indicators = await fs.readJSON(indicatorsFile);
        } else {
            indicators = {
                session_start: formatISO(new Date()),
                commands_executed: 0,
                tools_used: {},
                files_modified: 0,
                lines_changed: 0,
                agents_invoked: {},
                success_rate: 100.0,
                last_activity: null
            };
        }
        
        // Update indicators based on current metrics
        indicators.commands_executed += 1;
        indicators.last_activity = metrics.timestamp;
        
        const toolName = metrics.tool_name;
        if (!indicators.tools_used) indicators.tools_used = {};
        indicators.tools_used[toolName] = (indicators.tools_used[toolName] || 0) + 1;
        
        if (['Edit', 'Write'].includes(toolName) && 'file_path' in metrics) {
            indicators.files_modified += 1;
        }
        
        if ('net_lines' in metrics) {
            indicators.lines_changed += Math.abs(metrics.net_lines);
        } else if ('lines_written' in metrics) {
            indicators.lines_changed += metrics.lines_written;
        }
        
        if (metrics.subagent_type) {
            const agent = metrics.subagent_type;
            if (!indicators.agents_invoked) indicators.agents_invoked = {};
            indicators.agents_invoked[agent] = (indicators.agents_invoked[agent] || 0) + 1;
        }
        
        // Calculate success rate
        const totalCommands = indicators.commands_executed;
        if (totalCommands > 0) {
            if (!metrics.success) {
                // Adjust success rate down slightly
                indicators.success_rate = Math.max(0, indicators.success_rate - (1.0 / totalCommands));
            }
            // If successful, maintain current success rate
        }
        
        // Save updated indicators
        await fs.writeJSON(indicatorsFile, indicators, { spaces: 2 });
        
        // Signal dashboard update if active
        const dashboardSignal = path.join(metricsDir, '.dashboard-active');
        if (await fs.pathExists(dashboardSignal)) {
            const realtimeLog = path.join(metricsDir, 'realtime.log');
            const timeStr = new Date().toLocaleTimeString('en-US', { hour12: false });
            const logMessage = `📊 [${timeStr}] ${toolName} completed - Productivity: ${indicators.commands_executed} commands, ${indicators.files_modified} files\n`;
            await fs.appendFile(realtimeLog, logMessage);
        }
        
    } catch (error) {
        console.error('Warning: Failed to update productivity indicators:', error);
    }
}

/**
 * Extract tool-specific metrics based on tool type.
 * Direct port of Python tool-specific metric collection.
 * @param {Object} context - Hook context
 * @returns {Object} Tool-specific metrics
 */
function extractToolSpecificMetrics(context) {
    const metrics = {};
    const toolName = context.tool_name;
    const toolInput = context.tool_input || {};
    
    switch (toolName) {
        case 'Read':
            // File read metrics
            const filePath = toolInput.file_path || '';
            try {
                const fileSize = fs.existsSync(filePath) ? fs.statSync(filePath).size : 0;
                Object.assign(metrics, {
                    file_path: filePath,
                    file_size_bytes: fileSize,
                    lines_requested: toolInput.limit || 'all'
                });
            } catch (error) {
                // File doesn't exist or access error
                Object.assign(metrics, {
                    file_path: filePath,
                    file_size_bytes: 0,
                    lines_requested: toolInput.limit || 'all'
                });
            }
            break;
            
        case 'Edit':
            // File edit metrics
            const editFilePath = toolInput.file_path || '';
            const oldString = toolInput.old_string || '';
            const newString = toolInput.new_string || '';
            
            const linesRemoved = oldString ? oldString.split('\n').length : 0;
            const linesAdded = newString ? newString.split('\n').length : 0;
            
            Object.assign(metrics, {
                file_path: editFilePath,
                lines_added: linesAdded,
                lines_removed: linesRemoved,
                net_lines: linesAdded - linesRemoved,
                replace_all: toolInput.replace_all || false
            });
            break;
            
        case 'Write':
            // File write metrics
            const writeFilePath = toolInput.file_path || '';
            const content = toolInput.content || '';
            
            Object.assign(metrics, {
                file_path: writeFilePath,
                content_length: content.length,
                lines_written: content ? content.split('\n').length : 0,
                file_type: writeFilePath ? path.extname(writeFilePath) : 'unknown'
            });
            break;
            
        case 'Bash':
            // Command execution metrics
            const command = toolInput.command || '';
            Object.assign(metrics, {
                command: command,
                command_type: command ? command.split(' ')[0] : 'unknown',
                background: toolInput.run_in_background || false,
                timeout: toolInput.timeout || null
            });
            break;
            
        case 'Task':
            // Sub-agent invocation metrics
            const subagentType = toolInput.subagent_type || 'unknown';
            const description = toolInput.description || '';
            
            Object.assign(metrics, {
                subagent_type: subagentType,
                task_description: description,
                delegation: true
            });
            break;
            
        default:
            // Generic tool metrics
            Object.assign(metrics, {
                generic_tool: true,
                input_keys: Object.keys(toolInput)
            });
            break;
    }
    
    return metrics;
}

/**
 * Main hook execution for tool metrics collection.
 * Performance-optimized Node.js implementation.
 * @param {Object} toolData - Tool execution data (replaces cchooks context)
 * @returns {Promise<Object>} Hook execution result
 */
async function main(toolData = {}) {
    const startTime = process.hrtime.bigint();
    
    try {
        // Create context (replaces cchooks.safe_create_context())
        const context = createPostToolUseContext(toolData);
        
        // Capture tool execution metrics
        const timestamp = formatISO(new Date());
        const sessionId = await getCurrentSessionId();
        
        // Basic tool metrics
        const metricsData = {
            event_type: 'tool_execution',
            timestamp: timestamp,
            tool_name: context.tool_name,
            success: !context.error,
            execution_time_ms: Math.round(toolData.executionTime || 0),
            user: process.env.USER || 'unknown',
            session_id: sessionId
        };
        
        // Extract tool-specific metrics
        const toolSpecificMetrics = extractToolSpecificMetrics(context);
        Object.assign(metricsData, toolSpecificMetrics);
        
        // Handle Task tool agent performance tracking
        if (context.tool_name === 'Task') {
            const agentMetrics = {
                event_type: 'agent_invocation',
                timestamp: timestamp,
                agent_name: toolSpecificMetrics.subagent_type,
                task_description: toolSpecificMetrics.task_description,
                success: !context.error,
                execution_time_ms: metricsData.execution_time_ms
            };
            await logMetrics(agentMetrics);
        }
        
        // Add error details if present
        if (context.error) {
            metricsData.error = true;
            metricsData.error_message = String(context.error);
        }
        
        // Log the metrics (both to backend API and local storage)
        const logResult = await logMetrics(metricsData);
        
        // Update productivity indicators
        await updateProductivityIndicators(metricsData);
        
        // Calculate execution time and memory usage
        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
        const memoryUsage = process.memoryUsage().heapUsed;
        const memoryUsageMB = memoryUsage / 1024 / 1024;
        
        // Performance monitoring
        if (executionTime > 30) {
            console.warn(`[Performance] Tool metrics took ${executionTime.toFixed(2)}ms (target: ≤30ms)`);
        }
        
        if (memoryUsageMB > 20) {
            console.warn(`[Performance] Memory usage: ${memoryUsageMB.toFixed(1)}MB (target: ≤20MB)`);
        }
        
        return {
            success: true,
            executionTime: Math.round(executionTime * 100) / 100,
            memoryUsage: memoryUsage,
            metrics: { 
                toolName: context.tool_name,
                successful: !context.error,
                metricsLogged: logResult.success,
                apiMethod: logResult.method,
                apiMessage: logResult.message
            }
        };
        
    } catch (error) {
        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1000000;
        
        console.error('❌ Tool metrics hook failed:', error);
        
        return {
            success: false,
            executionTime: Math.round(executionTime * 100) / 100,
            errorMessage: error.message
        };
    }
}

/**
 * Simulate tool execution for testing (when run directly).
 * @param {Array} args - Command line arguments
 * @returns {Promise<void>}
 */
async function simulateToolExecution(args) {
    if (args.length < 3) {
        console.log('Usage: node tool-metrics.js <tool_name> [tool_input_json] [success]');
        console.log('Examples:');
        console.log('  node tool-metrics.js Read \'{"file_path": "/tmp/test.txt"}\' true');
        console.log('  node tool-metrics.js Edit \'{"file_path": "/tmp/test.txt", "old_string": "old", "new_string": "new"}\' true');
        console.log('  node tool-metrics.js Task \'{"subagent_type": "frontend-developer", "description": "Create component"}\' true');
        return;
    }
    
    const toolName = args[2];
    const toolInput = args[3] ? JSON.parse(args[3]) : {};
    const success = args[4] !== 'false';
    
    const toolData = {
        toolName: toolName,
        toolInput: toolInput,
        error: success ? null : new Error('Simulated tool failure'),
        executionTime: Math.random() * 100 + 10 // Random execution time between 10-110ms
    };
    
    console.log(`🔧 Simulating ${toolName} tool execution...`);
    console.log(`📝 Input: ${JSON.stringify(toolInput, null, 2)}`);
    console.log(`✅ Success: ${success}`);
    
    const result = await main(toolData);
    
    if (result.success) {
        console.log(`✅ Tool metrics logged successfully in ${result.executionTime}ms`);
    } else {
        console.error(`❌ Tool metrics failed: ${result.errorMessage}`);
    }
}

// CLI execution support
if (require.main === module) {
    simulateToolExecution(process.argv)
        .then(() => process.exit(0))
        .catch(error => {
            console.error('❌ Hook execution failed:', error);
            process.exit(1);
        });
}

module.exports = {
    main,
    logMetrics,
    updateProductivityIndicators,
    extractToolSpecificMetrics,
    createPostToolUseContext,
    getCurrentSessionId
};