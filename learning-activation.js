(function () {
  "use strict";
  const POLICY_VERSION = "0.1";
  const CATEGORIES = [
    {kind:"question", heading:"問い｜まず自分で判断する", prompt:"このテーマについて、結果はどうなると思う？ どの条件が影響する？", reveal:["A/B/分からないを心の中で選ぶ","理由を一つ予想する"], note:"挙手や突然の指名を要求しない。答えはまだ示さない。"},
    {kind:"gap", heading:"何を知れば確かめられる？", prompt:"判断するには、どんな情報・測定・比較が必要だろう？", reveal:["必要な条件を整理する","不足している知識を確認する"], note:"失敗を非難せず、必要な情報を特定する。"},
    {kind:"explanation", heading:"科学的な仕組みと根拠", prompt:"重要な用語・原理・定量的関係を確認しよう。", reveal:["現象・観察","仕組み・モデル","条件・例外"], note:"授業担当者が根拠資料を確認し、正確な科学図を追加。説明を省略しない。"},
    {kind:"revisit", heading:"もう一度判断しよう", prompt:"最初の答えは変わった？ その理由は何？", reveal:["最初の判断を確認","根拠を使って再判断"], note:"答えを変えなくてもよい。正しさと根拠の質を区別する。"},
    {kind:"transfer", heading:"別の場面でも使える？", prompt:"同じ考え方を、別の食品・広告・実験・日常の判断に使えるだろうか？", reveal:["新しい条件を提示","判断と理由を短く記録"], note:"自動的な転移を仮定しない。別場面で練習させる。"}
  ];
  function buildLessonPlan(topic) {
    const clean = String(topic || "").trim().replace(/\s+/g, " ");
    if (!clean) throw new Error("授業テーマを入力してください");
    return {
      schema:"learning-activation-plan-v1", learningActivationPolicyVersion:POLICY_VERSION,
      outputTarget:"keynote-editable-pptx", topic:clean,
      slides:CATEGORIES.map((stage, index)=>({
        id:"activation-" + (index + 1), role:stage.kind,
        title:stage.heading, topic:clean, studentPrompt:stage.prompt,
        revealSteps:stage.reveal, participation:index === 0 ? "無言でA/B/分からないを選ぶ" : "一語・短文での応答も可",
        visual:index === 2 ? "編集可能な科学図・根拠データ（教師が具体化）" : "問いや条件の視覚的整理",
        teacherNotes:stage.note, evidenceStatus:"具体的な科学的主張は制作時に検証"
      }))
    };
  }
  function auditLessonPlan(plan) {
    const roles = (plan.slides || []).map(s=>s.role);
    return {
      policyVersion:POLICY_VERSION,
      valid: ["question","gap","explanation","revisit","transfer"].every((v,i)=>roles[i]===v),
      needsScienceReview:true, needsKeynoteImportVerification:true
    };
  }
  function formatForNotes(plan) {
    return "【Keynote授業構成｜Learning Activation v" + POLICY_VERSION + "】\n" +
      "単元：" + plan.topic + "\n" +
      "※この構成は授業の骨格です。科学的解説・図・実験条件は別途検証して仕上げます。\n\n" +
      plan.slides.map((s,i) => "[" + (i+1) + "] " + s.title + "（" + s.topic + "）\n" +
        "生徒への問い：" + s.studentPrompt + "\n" +
        "段階表示：" + s.revealSteps.join(" → ") + "\n" +
        "参加方法：" + s.participation + "\n" +
        "図：" + s.visual + "\n" +
        "教師用：" + s.teacherNotes).join("\n\n");
  }
  function mount() {
    const panel = document.getElementById("knowledgePresenterPanel");
    const notes = document.getElementById("studyNotes");
    if (!panel || !notes || document.getElementById("learningActivationGenerateBtn")) return;
    const wrapper = document.createElement("div");
    wrapper.className = "col";
    wrapper.style.marginTop = "10px";
    const button = document.createElement("button");
    button.type="button"; button.id="learningActivationGenerateBtn";
    button.className="btn primary"; button.textContent="学習起動型の授業構成を作成（Keynote用）";
    const status=document.createElement("div");status.className="help";status.setAttribute("role","status");
    status.textContent="授業テーマをノート欄に入力して実行。科学的内容とKeynote編集の最終確認は必要です。";
    button.addEventListener("click", () => {
      const topic=notes.value.trim().split(/\n/)[0];
      if (!topic){status.textContent="先に授業テーマを入力してください。";return;}
      try {
        const plan=buildLessonPlan(topic),audit=auditLessonPlan(plan);
        if(!audit.valid) throw new Error("授業構成の検査に失敗しました");
        notes.value=formatForNotes(plan);
        notes.dispatchEvent(new Event("input",{bubbles:true}));
        status.textContent="5段階の授業構成を生成しました。科学内容を補強してから画面へ送ってください。";
      }catch(err){status.textContent=err.message;}
    });
    wrapper.append(button,status);panel.appendChild(wrapper);
  }
  window.TeachingOSLearningActivation = Object.freeze({buildLessonPlan,auditLessonPlan,formatForNotes,policyVersion:POLICY_VERSION});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();