# Keynote Learning Activation Policy v0.1

## Scope and trigger
Automatically apply this policy to **every lesson slide generation request** whose output is Apple Keynote, Keynote-editable PPTX, or a lesson deck intended for later Keynote editing. This policy is a slide-generation requirement, not a separately requested lesson topic.

## Objective
Teach rigorous subject knowledge while letting reluctant learners experience why learning, recording, checking evidence and revising judgments are valuable. Avoid moralizing about effort, intelligence, grades, or future worth.

## Non-negotiable slide sequence
Use the following loop throughout an ordinary 50-minute science lesson; do not force all five stages into every individual topic:
1. **Prediction / genuine dilemma**: relatable question that needs a judgment before detailed instruction. Low-risk response possible (silent A/B, pointing, one word). Do not demand public explanation immediately.
2. **Knowledge gap**: reveal what information, definitions, measurements, or conditions are needed; avoid humiliating learners.
3. **Disciplinary explanation**: scientifically sound diagrams, quantities, underlying mechanisms, caveats, and evidence. No lowering of content standard.
4. **Revisit**: return to the original judgment with a new reason; allow unchanged answers when supported.
5. **Transfer**: a different context where the same reading, note-taking, comparison, or inference procedure can be practiced explicitly.

## Format
- Prefer alternating **question slide → evidence/explanation slide**, progressive reveals, and staged animations.
- Place no answer on the initial question slide.
- Each slide needs: student-facing content, reveal steps, visual specification, participation option, teacher note, evidence status.
- Keynote editable: build using text and vector objects where possible; diagrams remain separate/editable; if delivering PPTX, note limitations of animations and verify import.
- Keep teacher-only instructional intent in presenter notes; student-facing slides must focus on authentic science questions rather than a disguised lecture about studying.
- Every generated deck carries metadata `learningActivationPolicyVersion: "0.1"` and a checklist in teacher notes or a separate report.

## Learner considerations
- Avoid terms such as 「当たり前」「さっき言った」「覚えて」 and labels that shame learners.
- Avoid surprise public calling, forced confession, ranking by participation, or fabricated statistics.
- Provide small participation on-ramps, including nonverbal choices.
- Distinguish fatigue, insufficient prerequisite knowledge, avoidance and environmental factors as hypotheses, never diagnoses.
- Do not equate sleepiness with laziness or claim all nonparticipation has the same cause.

## Validation before export
Verify all of:
[ ] First genuine question precedes the explanation
[ ] A safe, immediate participation opportunity exists in the first few minutes
[ ] At least one explicit initial judgment → evidence → revised judgment loop
[ ] At least one skill is reused in a different context
[ ] Explanation meets scientific accuracy and includes important conditions
[ ] Student-facing content does not admonish students to study
[ ] Teacher notes explain participation support and what to observe
[ ] Scientific sources/evidence uncertainty are marked where appropriate
[ ] Output can be opened and edited with Keynote
If a criterion fails, revise the deck before delivery, or explicitly flag the unmet criterion.

## Integration
Slide-generation pipeline should resolve `outputTarget` and `contentType` before composing slide plans.
When `contentType === "lesson"` and `outputTarget in ["keynote", "keynote-editable-pptx"]`, inject this policy into planning, speaker notes, and validation phases.
Never treat this policy as a request to add a separate motivational lecture slide.
