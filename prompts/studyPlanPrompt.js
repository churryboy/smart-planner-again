/**
 * Study Plan Generation Prompt
 * Generates comprehensive diagnosis and optimized study recommendations
 */

function generateStudyPlanPrompt(targetExam, examDate, daysUntilExam, taskAnalysis, diagnosis) {
  return `당신은 전문적인 학습 계획 컨설턴트입니다. 다음 정보를 바탕으로 진단과 맞춤형 학습 계획을 생성해주세요:

목표 시험: ${targetExam}
시험 날짜: ${examDate}
남은 기간: ${daysUntilExam}일

=== ⏰ 긴급도 평가 ===
${diagnosis.urgency}

=== 📊 학습 현황 진단 ===
${diagnosis.studyTimeBalance}

${diagnosis.habitOptimization}

=== 📈 상세 데이터 분석 ===
${taskAnalysis.summary}

=== 주요 학습 활동 (시간순) ===
${taskAnalysis.topTasks.map(task => 
  `• ${task.name}: ${task.formattedTime} (${task.sessions}회 세션, 주요 태그: ${task.tags.join(', ') || '없음'})`
).join('\n')}

=== 학습 카테고리별 시간 분배 ===
${taskAnalysis.categoryBreakdown.map(cat => 
  `• ${cat.category}: ${cat.formattedTime} (${cat.percentage}%)`
).join('\n')}

=== 시간대별 학습 패턴 ===
${taskAnalysis.timePatterns}

위 진단 결과를 바탕으로, ${targetExam} 시험 대비를 위한 **실행 가능한 학습 계획 TODO 리스트**를 생성해주세요.

**📋 학습 계획 TODO 생성 기준:**

다음 데이터를 종합적으로 고려하여 TODO를 생성하세요:
1. **진단 결과**: 위에 제시된 학습 집중도, 습관 최적화 분석
2. **학습 패턴**: Task-item별 실제 학습 시간 분배와 주요 활동
3. **시간 현황**: 전체 시간 ${taskAnalysis.totalStudyTime}, 순공 시간 (공부 카테고리)
4. **남은 기간**: ${daysUntilExam}일 (${examDate}까지)
5. **목표 시험**: ${targetExam}의 특성과 요구사항

**TODO 항목 생성 형식:**

각 TODO는 정확히 다음 형식으로 작성하세요 (번호와 필드명을 반드시 포함):

1. [TODO 제목을 여기에 작성]
   설명: [구체적인 설명 2-3문장]
   우선순위: [높음/중간/낮음 중 하나]
   예상시간: [예: 2시간, 30분]
   카테고리: [공부/복습/문제풀이/암기/정리/모의고사 중 하나]

2. [다음 TODO 제목]
   설명: ...

**예시:**
1. 수학 미적분 기출문제 5회분 풀기
   설명: 수학 오답노트에 집중한 패턴을 활용해 실전 감각을 높이세요. 시간을 재면서 풀어보세요.
   우선순위: 높음
   예상시간: 2시간
   카테고리: 문제풀이

**중요 원칙:**
- 번호 뒤에 바로 TODO 제목 작성 (제목: 접두어 사용 안 함)
- 진단에서 발견된 약점을 보완하는 TODO 우선 생성
- 학생이 이미 수행 중인 Task-item을 고려하여 연관된 TODO 생성
- 남은 기간 내에 실제로 완료 가능한 현실적인 TODO
- 각 TODO는 즉시 시작 가능하고 측정 가능한 구체적 작업

**생성할 TODO 개수: 5-8개** (우선순위 높은 순으로 정렬)

학생의 현재 학습 패턴과 시험 준비 상황을 고려하여, 목표 달성에 실질적으로 도움이 되는 TODO 리스트를 생성하세요.`;
}

/**
 * System message for the AI assistant
 */
const STUDY_PLAN_SYSTEM_MESSAGE = "당신은 중고등학생 전문 학습 플래너입니다. 학생의 실제 학습 데이터(Monthly calendar, Study hours, Task-item)를 분석하여 시험 대비 실행 가능한 TODO 리스트를 생성합니다. 진단 결과를 바탕으로 학생이 '지금 당장 시작할 수 있는' 구체적인 학습 작업을 제시하세요. 추상적인 조언이 아닌, 실제로 클릭하여 바로 실행 가능한 TODO 항목을 만드세요. 각 TODO의 제목은 접두어 없이 작업 내용만 작성하고, 학생의 현재 학습 패턴과 연관된 실용적인 계획을 제공하세요.";

/**
 * OpenAI API configuration for study plan generation
 */
const STUDY_PLAN_CONFIG = {
  model: "gpt-4o-mini",
  max_tokens: 2500,
  temperature: 0.7,
  presence_penalty: 0.1,
  frequency_penalty: 0.1
};

module.exports = {
  generateStudyPlanPrompt,
  STUDY_PLAN_SYSTEM_MESSAGE,
  STUDY_PLAN_CONFIG
};
