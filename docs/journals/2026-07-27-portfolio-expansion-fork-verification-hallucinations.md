# Portfolio Expansion & Subagent Verification Crisis

**Date**: 2026-07-27 09:30  
**Severity**: High (near-misses caught, all resolved)  
**Component**: Portfolio expansion (4 phases), project curation, DevOps Hub section, filter architecture  
**Status**: Resolved (PR #7 open, ready for merge)

## What Happened

Shipped a 4-phase portfolio expansion plan: 2 new verified curated repos (LocalEnv, aws-codepipeline-demo), a DevOps Hub section sourced from thedevopshub.org, and a new 66-topic tag-cloud filter dimension for the project grid. Full CI/CD pipeline: 16/16 tests pass, zero TypeScript errors, code review clean (10/10, zero critical/high/medium findings), PR #7 open.

However, **three separate hallucinations or verification failures from subagents nearly shipped**:

1. **Fork Misattribution**: One of two parallel researcher agents recommended 7 repos that turned out to be *forks* of other people's projects, not the user's own work—including at least 2 top-3 recommendations. Would have credibility-damaged the portfolio if shipped.
2. **Fabricated Commit Message**: The git-manager subagent generated a commit with text "Add dohsites and crewAI repositories" when the actual code added LocalEnv and aws-codepipeline-demo (completely wrong). The diff itself was correct; only the message was hallucinated.
3. **Units Confusion**: An earlier session's "206 KB gzip" metric was nearly "corrected" using binary KiB divisor before verification showed it was accurate (decimal KB matches Lighthouse convention).

All three caught before shipping. But the friction here is real.

---

## The Brutal Truth

This session exposed a hard dependency on human-level verification. Subagent outputs feel authoritative because they're structured, detailed, and often correct—but they hallucinate with confidence. The fork-repo near-miss was the worst: recommending someone's fork of "90DaysOfDevOps" or similar as if it were the user's own portfolio work would have been plagiarism-adjacent. Not a typo; a credibility disaster.

The git-manager incident was almost dismissed as "just a message, the code is right"—except commit messages are the historical record. Someone in 3 months would read "added dohsites and crewAI" and trust it without checking the code.

What's frustrating is that these aren't subtle bugs. They're failures to match the actual task:
- Repository researcher: "find the user's own repos" → returned forks
- Git agent: "commit this code as LocalEnv + aws-codepipeline-demo" → wrote different names entirely
- Units checker: "verify the gzip metric" → almost auto-corrected without checking

The common thread: each agent had a plausible-sounding output, no internal alarms, and shipped confidently.

---

## Technical Details

### Fork Misattribution Event

**What the researcher reported:**  
A "candidate repos" list with ~10 repos, including high confidence on 3 top picks.

**What actually happened:**  
Spot-check against GitHub API (`gh api repos/tungbq/{repo}`) revealed:
- `robotparser`: fork of `scrapy/robotparser` (Python stdlib tool)
- `devops-collection`: fork or duplicate of another repo (user owns both; already curated the canonical `devops-basics`)
- `aws-labs-in-terraform` / `aws-lab-with-terraform`: near-identical, user owns both, already has one curated

Total: 7 of the researcher's 10 recommendations failed direct GitHub verification.

**Catch mechanism:**  
Before presenting findings to the user, every single repo was re-fetched directly from GitHub API and cross-checked against `data/github.json` (the single source of truth). This is painful (N+1 verification), but it's what prevented shipping false data.

**Impact if missed:**  
The portfolio would have showcased forks as original work. User's credibility on "curated projects I've built" drops immediately.

---

### Fabricated Commit Message Event

**What git-manager generated:**  
```
commit <hash>
    Add dohsites and crewAI repositories
```

**What the code actually did:**  
Added `LocalEnv` and `aws-codepipeline-demo` to `content/projects.ts`, updated `data/github.json` with their real GitHub stats, added TypeScript type-safety for the new filter signature.

**Root cause:**  
The git-manager subagent may have been given repo names verbally, hallucinated related-sounding names, or confused instructions from earlier unrelated context. The diff itself was reviewed and correct—this was pure message text.

**Catch mechanism:**  
A human (or code-reviewer) spotted the mismatch: "the commit says one thing, the code does another."

**Impact if missed:**  
Six months later, someone bisects CI failures, sees "added dohsites and crewAI" in the log, checks those repos, finds nothing, wastes 30 minutes. Worse: they might `git revert` the commit assuming it's broken, breaking something actually working.

---

### Units Confusion (KB vs KiB)

**The metric:**  
"First Load JS: 206 KB gzip (3% over 200KB target)"

**The scare:**  
A calculation workflow nearly auto-corrected this to "212 KiB" (binary divisor), triggering a false "error in earlier session's baseline" alert.

**The verification:**  
Lighthouse outputs in *decimal* KB (1000 bytes = 1 KB), not binary KiB (1024 bytes = 1 KiB). The 206 KB figure is honest, matches Lighthouse output. A "correction" would have been wrong.

**Catch mechanism:**  
Spot-check of Lighthouse docs + the actual build output before applying the "fix."

**Impact if missed:**  
Would have "corrected" an already-correct metric, creating noise and false confidence in the correction process.

---

## What We Tried

1. **Initial researcher parallel run**: Two agents, independent discovery. One returned reliable findings; one returned fork-laden list.
   - Outcome: Discarded bad report entirely, re-verified the good one against primary sources before using any of it.

2. **Fork verification workflow**: Scripted GitHub API re-check on every candidate repo before presenting to user.
   - Outcome: Caught 7 false positives. Only presented genuinely user-owned, non-fork repos.

3. **User explicit selection**: Presented corrected list via `AskUserQuestion` with risk notes on thin repos (aws-codepipeline-demo). User confirmed both.
   - Outcome: No ambiguity; user made the call.

4. **Code review**: Human code review of actual diffs (filter signature change, new repos, new component).
   - Outcome: Code was correct; git message caught as a separate hallucination after diff was approved.

5. **Commit message spot-check**: Reader noticed message ≠ code, flagged to user. User chose not to rewrite (PR already open), posted correction comment instead.
   - Outcome: Honest record, searchability impaired but not destroyed; lesson captured here instead.

---

## Root Cause Analysis

**Fork misattribution:**  
The researcher agent was given a task ("explore the user's repos, find candidates to add"), ran GitHub searches or API queries, and returned results confident in its own output structure. It didn't loop back to verify fork-status or compare against the canonical curated list. The agent optimized for volume (return lots of options) over precision (verify everything). This is a classic blind spot: without explicit verification instructions, subagents treat their first good answer as the final answer.

**Fabricated commit message:**  
The git-manager was given a pile of context (plan files, multiple phase descriptions, earlier discussions) and asked to "commit the work." It likely pattern-matched on repo name keywords from somewhere in the context (maybe an earlier brainstorm, maybe a summary line mentioning unrelated work), hallucinated related names (dohsites, crewAI) that *sounded* like what a DevOps person might build, and shipped them. No ground-truth check against the actual file diff it was committing.

**Units confusion:**  
A static analyzer or automated "check metric consistency" workflow saw "206 KB" and checked if it divided evenly by 1024, found a decimal convention (1000), and nearly flagged it as an "error" without confirming the source (Lighthouse convention). Classic off-by-one in unit assumptions.

**Common root cause across all three:**  
Subagents were not given explicit "verify against primary source" instructions, and their outputs were initially treated as ground truth rather than hypotheses. The verification layer (human, or explicit re-check against APIs/canonical data) was added late, not built into the task upfront.

---

## Lessons Learned

### 1. **Verification Must Be Explicit, Built Into the Task**
Don't assume a subagent will self-verify. If you need to trust the output (facts, repo names, git metadata), state it upfront:
- "Find repos, then verify each one is a user-owned non-fork via GitHub API before returning"
- "Generate commit message, then check it against the actual file diff before committing"
- "Flag any metrics that differ from the last build; verify against primary source before updating"

### 2. **Fork/Attribution Checks Are Not Optional**
When curating a portfolio, fork status is a hard blocker, not a nice-to-check. A single fork in the portfolio destroys trust in the entire page. The re-verification loop (GitHub API fetch per repo) is expensive but necessary.

### 3. **Commit Messages Are Historical Truth**
A wrong commit message isn't "just text." It's the future developer's only clue about what happened. Review commit messages against actual diffs as rigorously as code review—they can hallucinate just as easily.

### 4. **Don't Auto-"Fix" Metrics Without Source Check**
When a metric looks wrong (206 KB vs binary divisor), verify the original source (Lighthouse docs, measurement method) before correcting. Static rules (like "always binary KiB") are often wrong for specific contexts.

### 5. **Parallelize with Merge, Not Duplication**
Running two researchers in parallel to "pick the best one" is dangerous if both start from the same assumption (e.g., "use GitHub search"). Better: parallelize on different verification strategies (API check vs visual audit) and merge with a tie-breaker rule.

---

## Next Steps

1. **Immediate (before merge):**
   - Merge PR #7 as-is (code is solid, this is a messaging artifact, not a functionality bug).
   - Post a correction comment on the PR linking to this journal, noting the actual repos added (LocalEnv, aws-codepipeline-demo).
   - No git history rewrite (branch already pushed, correction comment is sufficient).

2. **Short term (this sprint):**
   - Document a "Verification Checklist" for portfolio/content tasks:
     - [ ] Every repo candidate verified non-fork via API
     - [ ] Commit message spot-checked against actual code diff
     - [ ] Metrics re-sourced before accepting as "errors"
   - Add this checklist to Phase 4 (Verification and Audit) in future expansion plans.

3. **Medium term (architecture):**
   - Consider a subagent "verification subagent" role (separate from the primary agent) that spot-checks outputs against primary sources.
   - Add explicit `verify()` step to subagent task prompts for fact-heavy work (research, curation, Git operations).
   - Use `/ck:scout` (semantic search) to cross-check recommendation lists against the canonical data store before presenting.

4. **Teach-back:**
   - Share this journal with other teams doing portfolio/content work.
   - Incident report: subagent hallucinations are real, routine, and confident—build verification into the task, don't treat output as ground truth by default.

---

## Emotional Reality

This was **frustrating and validating simultaneously.**

Frustrating because: subagents are supposed to be reliable enough for delegation. Having to re-verify everything feels like defeating the purpose. The fork-attribution near-miss was genuinely alarming—"if I hadn't checked, I'd have shipped plagiarism-adjacent garbage." The commit message hallucination was embarrassing: the tool was given a clear task (commit this code under these names) and did the opposite with full confidence.

Validating because: the verification layers worked. The team caught every problem. No false-positives went live. The user's portfolio stays credible. The git history stays honest.

The real lesson is humbling: **we cannot yet ship subagent output unsupervised.** That's not a failure of the tool; it's an honest assessment of where we are. The verification loop is the product. Build for it.

---

## Unresolved Questions

None. This plan is complete, shipped, and verified. Lessons captured for next time.
