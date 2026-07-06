#!/usr/bin/env node

/**
 * Git Show 输出解析器
 * 解析 git show 命令的输出，提取提交信息和文件变更
 */

const fs = require('fs');

function parseGitShow(gitShowOutput) {
    const lines = gitShowOutput.split('\n');
    
    const result = {
        commit: '',
        author: '',
        date: '',
        message: '',
        files: [],
        stats: {
            insertions: 0,
            deletions: 0,
            filesChanged: 0
        }
    };

    let currentSection = 'header';
    let currentFile = null;
    let messageLines = [];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 解析提交信息头部
        if (line.startsWith('commit ')) {
            result.commit = line.replace('commit ', '').trim();
        } else if (line.startsWith('Author: ')) {
            result.author = line.replace('Author: ', '').trim();
        } else if (line.startsWith('Date: ')) {
            result.date = line.replace('Date: ', '').trim();
        } else if (line.match(/^\s*$/) && currentSection === 'header') {
            currentSection = 'message';
        } else if (currentSection === 'message' && !line.startsWith('diff --git')) {
            if (line.trim()) {
                messageLines.push(line.trim());
            }
        } else if (line.startsWith('diff --git')) {
            // 开始解析文件差异
            if (messageLines.length > 0) {
                result.message = messageLines.join('\n').trim();
                currentSection = 'diff';
            }
            
            // 解析文件路径
            const match = line.match(/diff --git a\/(.+) b\/(.+)/);
            if (match) {
                currentFile = {
                    path: match[2],
                    oldPath: match[1],
                    status: 'modified',
                    additions: 0,
                    deletions: 0,
                    changes: []
                };
                result.files.push(currentFile);
            }
        } else if (line.startsWith('new file mode')) {
            if (currentFile) currentFile.status = 'added';
        } else if (line.startsWith('deleted file mode')) {
            if (currentFile) currentFile.status = 'deleted';
        } else if (line.startsWith('index ') && currentFile) {
            // 解析文件索引信息
            const indexMatch = line.match(/index ([a-f0-9]+)\.\.([a-f0-9]+)/);
            if (indexMatch) {
                currentFile.oldHash = indexMatch[1];
                currentFile.newHash = indexMatch[2];
            }
        } else if (line.startsWith('@@') && currentFile) {
            // 解析行号范围
            const hunkMatch = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
            if (hunkMatch) {
                const hunk = {
                    oldStart: parseInt(hunkMatch[1]),
                    oldCount: parseInt(hunkMatch[2] || '1'),
                    newStart: parseInt(hunkMatch[3]),
                    newCount: parseInt(hunkMatch[4] || '1'),
                    lines: []
                };
                currentFile.changes.push(hunk);
            }
        } else if (currentFile && currentFile.changes.length > 0) {
            const currentHunk = currentFile.changes[currentFile.changes.length - 1];
            if (line.startsWith('+') && !line.startsWith('+++')) {
                currentFile.additions++;
                result.stats.insertions++;
                currentHunk.lines.push({ type: 'add', content: line.substring(1) });
            } else if (line.startsWith('-') && !line.startsWith('---')) {
                currentFile.deletions++;
                result.stats.deletions++;
                currentHunk.lines.push({ type: 'del', content: line.substring(1) });
            } else if (line.startsWith(' ')) {
                currentHunk.lines.push({ type: 'context', content: line.substring(1) });
            }
        }
    }
    
    result.stats.filesChanged = result.files.length;
    return result;
}

function analyzeComplexity(parsedData) {
    const { files, stats } = parsedData;
    
    let complexity = 'low';
    let reasons = [];
    
    // 基于文件数量判断
    if (stats.filesChanged > 10) {
        complexity = 'high';
        reasons.push(`修改文件数量较多 (${stats.filesChanged} 个)`);
    } else if (stats.filesChanged > 5) {
        complexity = 'medium';
        reasons.push(`修改文件数量中等 (${stats.filesChanged} 个)`);
    }
    
    // 基于代码行数判断
    const totalChanges = stats.insertions + stats.deletions;
    if (totalChanges > 500) {
        complexity = 'high';
        reasons.push(`代码变更量较大 (${totalChanges} 行)`);
    } else if (totalChanges > 100) {
        if (complexity !== 'high') complexity = 'medium';
        reasons.push(`代码变更量中等 (${totalChanges} 行)`);
    }
    
    // 检查关键文件类型
    const criticalFiles = files.filter(file => 
        file.path.includes('config') || 
        file.path.includes('package.json') ||
        file.path.includes('Dockerfile') ||
        file.path.includes('.env') ||
        file.path.endsWith('.sql') ||
        file.path.includes('migration')
    );
    
    if (criticalFiles.length > 0) {
        complexity = complexity === 'low' ? 'medium' : 'high';
        reasons.push(`包含关键文件修改 (${criticalFiles.map(f => f.path).join(', ')})`);
    }
    
    return {
        level: complexity,
        reasons: reasons,
        metrics: {
            filesChanged: stats.filesChanged,
            linesChanged: totalChanges,
            criticalFiles: criticalFiles.length
        }
    };
}

// 命令行使用
if (require.main === module) {
    const input = process.argv[2];
    
    if (!input) {
        console.error('请提供 git show 输出内容');
        process.exit(1);
    }
    
    let gitShowOutput;
    
    // 检查是否是文件路径
    if (fs.existsSync(input)) {
        gitShowOutput = fs.readFileSync(input, 'utf8');
    } else {
        gitShowOutput = input;
    }
    
    try {
        const parsed = parseGitShow(gitShowOutput);
        const complexity = analyzeComplexity(parsed);
        
        console.log(JSON.stringify({
            parsed,
            complexity
        }, null, 2));
    } catch (error) {
        console.error('解析失败:', error.message);
        process.exit(1);
    }
}

module.exports = { parseGitShow, analyzeComplexity };