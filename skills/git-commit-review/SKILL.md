---
name: git-commit-review
description: Analyze and review Git commit changes. Use when examining code changes from git show output, evaluating commit impact, or generating code review reports.
---

# Git Commit Review Skill

Analyze and review Git commit changes by parsing `git show` output and generating comprehensive review reports.

## Usage

Provide the output of `git show <commit-hash>` and receive:
- Detailed change analysis
- Code quality assessment  
- Impact evaluation
- Review recommendations

## Workflow

1. **Parse Git Show Output**
   ```bash
   node scripts/parse_git_show.cjs "<git-show-output>"
   ```
   Extracts commit metadata, file changes, and complexity metrics.

2. **Analyze Changes**
   Use parsed data to evaluate:
   - Modification type (feature, bugfix, refactor, etc.)
   - File impact assessment
   - Risk level evaluation

3. **Generate Review Report**
   Create structured review using `assets/review_template.md` with:
   - Change summary and statistics
   - Code quality analysis
   - Security and performance considerations
   - Actionable recommendations

## Review Analysis Framework

### Complexity Assessment
- **Low**: <5 files, <100 lines, documentation/tests
- **Medium**: 5-10 files, 100-500 lines, business logic
- **High**: >10 files, >500 lines, critical systems

### Risk Evaluation
Consider:
- File types (config, database, API)
- Change patterns (new feature vs bugfix)
- Dependencies and integration points
- Security implications

### Quality Checks
Review for:
- Code style and naming consistency
- Error handling completeness
- Performance implications
- Test coverage needs

## Reference Materials

- **`references/review_checklist.md`**: Comprehensive code review checklist
- **`references/impact_analysis.md`**: Guide for assessing change impact and risk

Use these references when detailed evaluation criteria are needed for specific review aspects.

## Output Format

Generate structured markdown reports following the template in `assets/review_template.md`, including:

- Executive summary with risk level
- File-by-file change breakdown
- Quality assessment with scores
- Specific improvement recommendations
- Testing strategy suggestions

Focus on actionable insights that help developers understand the impact and quality of their changes.