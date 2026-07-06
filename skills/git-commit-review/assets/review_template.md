# Git Commit 代码审查报告

## 基本信息

**提交ID:** {{commit}}
**作者:** {{author}}
**提交时间:** {{date}}
**提交信息:** {{message}}

---

## 修改概览

### 统计信息
- **修改文件数量:** {{filesChanged}}
- **新增行数:** {{insertions}}
- **删除行数:** {{deletions}}
- **净变更:** {{netChanges}}

### 复杂度评估
- **复杂度等级:** {{complexityLevel}}
- **评估原因:** {{complexityReasons}}

---

## 文件变更详情

{{#each files}}
### 📁 `{{path}}`
- **状态:** {{status}}
- **修改行数:** +{{additions}} -{{deletions}}
- **文件类型:** {{fileType}}

{{#if changes}}
**主要变更:**
{{#each changes}}
- 第 {{oldStart}}-{{oldEnd}} 行: {{description}}
{{/each}}
{{/if}}

{{/each}}

---

## 审查评估

### 🔍 代码质量分析

#### ✅ 发现的优点
{{#each positives}}
- {{this}}
{{/each}}

#### ⚠️ 需要关注的问题
{{#each concerns}}
- **{{level}}:** {{description}}
  - **影响:** {{impact}}
  - **建议:** {{suggestion}}
{{/each}}

### 🎯 功能影响分析

#### 影响范围
- **主要影响:** {{primaryImpact}}
- **次要影响:** {{secondaryImpact}}
- **风险等级:** {{riskLevel}}

#### 依赖关系
{{#if dependencies}}
**上游依赖:**
{{#each dependencies.upstream}}
- {{this}}
{{/each}}

**下游影响:**
{{#each dependencies.downstream}}
- {{this}}
{{/each}}
{{/if}}

### 🧪 测试建议

#### 必要的测试
{{#each testingRecommendations.required}}
- **{{type}}:** {{description}}
{{/each}}

#### 建议的测试
{{#each testingRecommendations.suggested}}
- **{{type}}:** {{description}}
{{/each}}

---

## 总体评价

### 📊 评分 (1-10分)
- **代码质量:** {{scores.codeQuality}}/10
- **功能实现:** {{scores.functionality}}/10
- **安全性:** {{scores.security}}/10
- **性能影响:** {{scores.performance}}/10
- **可维护性:** {{scores.maintainability}}/10

**总体评分:** {{scores.overall}}/10

### 🎯 审查结论

{{reviewConclusion}}

### 📋 行动项

{{#each actionItems}}
- [ ] **{{priority}}:** {{description}}
  - 负责人: {{assignee}}
  - 截止时间: {{dueDate}}
{{/each}}

---

## 附加说明

{{additionalNotes}}

---
*此报告由 Git Commit Review 技能自动生成，基于代码静态分析。建议结合实际业务需求和团队标准进行最终评估。*