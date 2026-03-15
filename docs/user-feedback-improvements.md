# User Feedback Improvements Plan

## Feedback Summary

| # | Area | Feedback | Priority |
|---|------|----------|----------|
| 1 | Product Understanding | QA loops feel circular; no clear endpoint or summary | High |
| 2 | Meeting Minutes | 100 score feels too easy; wants model answer | Medium |
| 3 | Test Cases | Want to duplicate & edit submitted test cases | High |
| 4 | Test Cases | Beginners need foundational "what is X" content | Medium |
| 5 | Test Cases / Progress Map | Progress map should highlight low-scoring items | High |

---

## Raw Feedback (Original)

### プロダクト理解のメモ
- QA方式で深堀していくのはいいが、繰り返していくと同じ論点をぐるぐるまわっている気がする（AI Agentの限界？）
- 現状、AIが合格を出すまでやり取りを繰り返すか、自分で勝手に理解が済んだと思って終了するかの二択。正解はないのかもしれないけど、まとめとしてこのようなプロダクトです、ここまで理解してほしい、というのが出てほしいと思いました。

### 議事録のメモ
- 提出してみて100点だったが、もうちょっといい議事録が書ける気はしており、逆にこれで100点でいいのかと不安に思ってしまった。正解案みたいなので出るとうれしいかもしれない

### テスト仕様のメモ
- 似たような内容を入力する場合も多く、テストケースを複製して作成みたいなことができるとありがたい
- 既に提出したテストケースのあやまりに気づいたときに修正できるとありがたい
- 前提知識がなさすぎて何がわかっていないかすらわかっていない状況だった、というのを1回テストケースを提出して気づいた。ターゲットにしている人の知識レベルにも依るし、もっとAIアシストを使って、という話かもしれないですが、そもそも〇〇とは何ぞや、みたいな話があると初学者にはありがたいかも
- 要改善のところは、進捗マップ上もなにかしらハイライトしたほうがいいかと思った（10点でも100点でも同じ見え方になっている）

---

## Improvement Details

### 1. Product Understanding - Add Structured Conclusion

**Problem**: QA deep-dive goes in circles with no clear endpoint. Users are stuck choosing between repeating until AI passes them or self-declaring completion.

**Solution**:
- Add a "wrap-up" mechanism: after N exchanges (or user-triggered), the agent generates a **structured summary** ("このプロダクトの要点まとめ") with key points the user should understand
- Add a "理解度チェック" (comprehension check) phase that tests specific knowledge points rather than open-ended Q&A
- Provide a clear "ここまで理解してほしい" checklist so users know the target

**Files to modify**:
- `frontend/src/routes/scenario/ScenarioPage.tsx` - add wrap-up trigger
- `frontend/src/queries/scenarios.ts` - update scenario config with summary prompts
- Backend agent prompts - add structured conclusion generation

**Acceptance criteria**:
- [ ] After sufficient Q&A exchanges, user can trigger a summary
- [ ] Summary covers all key product understanding points
- [ ] Clear checklist of "what you should understand" is presented

---

### 2. Meeting Minutes - Model Answer & Stricter Scoring

**Problem**: Receiving 100 points feels unearned. Users want to see what a good answer looks like.

**Solution**:
- Add a **model answer** ("模範解答") section displayed after evaluation, so users can compare their work against a reference
- Review and tighten evaluation criteria/agent prompts for meeting minutes to be more discriminating

**Files to modify**:
- `frontend/src/routes/history/HistoryDetailPage.tsx` - add model answer display section
- `frontend/src/types/index.ts` - add `modelAnswer` field to Evaluation or Scenario type
- `frontend/src/queries/scenarios.ts` - add model answer content to scenario config
- `frontend/src/lib/scenarioEvaluationCriteria.ts` - tighten scoring guidelines

**Acceptance criteria**:
- [ ] Model answer is shown on the evaluation result page after scoring
- [ ] Model answer is clearly labeled as a reference, not the only correct answer
- [ ] Scoring criteria are reviewed and calibrated to avoid inflated scores

---

### 3. Test Cases - Duplicate & Edit Submitted Cases

**Problem**: Similar test cases require repetitive input. Already-submitted test cases cannot be corrected.

**Solution**:
- Add a **"複製" (duplicate)** button on each submitted test case that pre-fills the form
- Allow **editing** of submitted test cases (inline edit or re-open in form)

**Files to modify**:
- `frontend/src/components/scenario/TestCaseScenarioLayout.tsx` - add duplicate/edit buttons to submitted test case list
- `frontend/src/components/scenario/TestCaseForm.tsx` - support pre-fill and edit mode

**Acceptance criteria**:
- [ ] Each submitted test case has a "複製" button
- [ ] Clicking duplicate pre-fills the form with that test case's data (with a new ID)
- [ ] Each submitted test case has an "編集" button
- [ ] Clicking edit loads the test case back into the form for modification
- [ ] Edited test case replaces the original in the submitted list

---

### 4. Test Cases - Foundational Knowledge Support

**Problem**: Beginners lack prerequisite knowledge and don't know what they don't know until they submit and get feedback.

**Solution**:
- Add a **"テスト基礎知識" (Testing Fundamentals)** section to the scenario guide modal
- Cover key concepts: what is a test case, normal vs abnormal cases, boundary values, preconditions, expected results
- Consider making the guide more prominent or auto-showing for first-time users

**Files to modify**:
- `frontend/src/components/scenario/ScenarioCategoryGuideModal.tsx` - enhance with foundational content
- `frontend/src/queries/scenarios.ts` - add foundational knowledge content to test case scenario guides

**Acceptance criteria**:
- [ ] Guide modal includes a "基礎知識" section with key testing concepts
- [ ] Concepts explained: テストケースとは, 正常系/異常系, 境界値, 前提条件, 期待結果
- [ ] Guide is shown automatically on first visit to a test case scenario

---

### 5. Progress Map - Score-Based Visual Differentiation

**Problem**: Progress map treats all completed scenarios the same regardless of score (10 points and 100 points look identical).

**Solution**:
- Show **score badges** on completed scenarios, color-coded by performance
- Add a **"要改善" (needs improvement)** indicator for low-scoring items
- Differentiate visual states beyond idle/active/reached

**Color coding**:
- Green (80+): Excellent
- Amber (60-79): Good
- Red (<60): Needs improvement

**Files to modify**:
- `frontend/src/routes/home/HomePage.tsx` - add score badges and visual differentiation
- `frontend/src/routes/home/homeHelpers.ts` - add score retrieval logic for completed scenarios

**Acceptance criteria**:
- [ ] Completed scenarios show their score on the progress map
- [ ] Scores are color-coded (green/amber/red)
- [ ] Low-scoring items have a visible "要改善" indicator
- [ ] Users can quickly identify which scenarios need rework

---

## Implementation Priority

### P0 - Quick Wins (1-2 days each)
- **#3**: Duplicate & edit test cases - concrete UX improvement, well-scoped
- **#5**: Progress map score visualization - high visibility, straightforward

### P1 - Medium Effort (2-3 days each)
- **#1**: Structured conclusion for product understanding - requires agent prompt design
- **#4**: Foundational knowledge content - content creation + UI enhancement

### P2 - Needs Design (3-5 days)
- **#2**: Model answers & scoring calibration - requires content creation for each scenario + scoring review

---

## Notes
- Feedback collected: 2026-03-15
- All improvements should maintain existing test suite (TDD approach per CLAUDE.md)
- Agent prompt changes may need iteration and user testing
