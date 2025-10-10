/**
 * Diagnosis-related prompts and configurations
 * Contains all diagnostic analysis logic and messages
 */

/**
 * Study time balance assessment messages
 */
const BALANCE_ASSESSMENTS = {
  VERY_HIGH: (ratio) => `🔥 학습 집중도: 매우 높음 (${ratio.toFixed(1)}%)
- 전체 시간 중 ${ratio.toFixed(1)}%를 학습에 투자하고 있습니다
- 번아웃 위험이 있으니 적절한 휴식이 필요합니다
- 효율성보다 시간에 의존하는 경향이 보입니다`,

  OPTIMAL: (ratio) => `✅ 학습 집중도: 적정 수준 (${ratio.toFixed(1)}%)
- 학습과 휴식의 균형이 양호합니다
- 현재 패턴을 유지하면서 효율성을 높일 여지가 있습니다`,

  LOW: (ratio) => `⚠️ 학습 집중도: 부족 (${ratio.toFixed(1)}%)
- 학습 시간 비중이 낮습니다
- 목표 달성을 위해 학습 시간 증대가 필요합니다`,

  VERY_LOW: (ratio) => `❌ 학습 집중도: 매우 부족 (${ratio.toFixed(1)}%)
- 학습 시간이 현저히 부족합니다
- 시급한 학습 패턴 개선이 필요합니다`
};

/**
 * Habit analysis messages
 */
const HABIT_ANALYSIS = {
  NO_DATA: "- 아직 학습 데이터가 부족하여 습관 분석이 어렵습니다\n- 체계적인 학습 추적을 시작해야 합니다",
  
  DIVERSITY: {
    EXCELLENT: (count) => `✅ 학습 다양성: 우수 (${count}개 활동)`,
    GOOD: (count) => `🟡 학습 다양성: 보통 (${count}개 활동)`,
    POOR: (count) => `🔴 학습 다양성: 부족 (${count}개 활동)\n- 더 다양한 학습 방법이 필요합니다`
  },
  
  FOCUS: {
    EXCELLENT: (minutes) => `✅ 집중 지속력: 우수 (평균 ${minutes}분)`,
    GOOD: (minutes) => `🟡 집중 지속력: 보통 (평균 ${minutes}분)`,
    POOR: (minutes) => `🔴 집중 지속력: 부족 (평균 ${minutes}분)\n- 더 긴 집중 시간이 필요합니다`
  }
};

/**
 * Goal achievability assessment messages
 */
const ACHIEVABILITY_ASSESSMENTS = {
  HIGH: (probability, current, required, exam) => `🟢 목표 달성 가능성: 높음 (${probability.toFixed(0)}%)
- 현재 학습량: 일평균 ${current.toFixed(1)}시간
- 권장 학습량: 일평균 ${required}시간
- ${exam} 합격 가능성이 높습니다
- 현재 패턴을 유지하면서 효율성을 높이세요`,

  MEDIUM: (probability, current, required, gap) => `🟡 목표 달성 가능성: 보통 (${probability.toFixed(0)}%)
- 현재 학습량: 일평균 ${current.toFixed(1)}시간
- 권장 학습량: 일평균 ${required}시간
- 학습량을 ${gap.toFixed(1)}시간 더 늘려야 합니다
- 계획적인 학습 강화가 필요합니다`,

  LOW: (probability, current, required, gap) => `🟠 목표 달성 가능성: 낮음 (${probability.toFixed(0)}%)
- 현재 학습량: 일평균 ${current.toFixed(1)}시간
- 권장 학습량: 일평균 ${required}시간
- 학습량을 ${gap.toFixed(1)}시간 더 늘려야 합니다
- 즉시 학습 전략을 대폭 수정해야 합니다`,

  VERY_LOW: (probability, current, required) => `🔴 목표 달성 가능성: 매우 낮음 (${probability.toFixed(0)}%)
- 현재 학습량: 일평균 ${current.toFixed(1)}시간
- 권장 학습량: 일평균 ${required}시간
- 현재 속도로는 목표 달성이 어렵습니다
- 목표 재설정 또는 전면적인 학습 계획 수정이 필요합니다`
};

/**
 * Exam-specific study requirements (hours per day)
 */
const EXAM_REQUIREMENTS = {
  토익: { long: 1.5, short: 2.5, threshold: 60 },
  toeic: { long: 1.5, short: 2.5, threshold: 60 },
  공무원: { long: 4, short: 6, threshold: 180 },
  공시: { long: 4, short: 6, threshold: 180 },
  기말: { long: 2, short: 4, threshold: 14 },
  중간: { long: 2, short: 4, threshold: 14 },
  자격증: { long: 2, short: 3, threshold: 90 },
  기사: { long: 2, short: 3, threshold: 90 },
  default: { long: 2, short: 3, threshold: 30 }
};

module.exports = {
  BALANCE_ASSESSMENTS,
  HABIT_ANALYSIS,
  ACHIEVABILITY_ASSESSMENTS,
  EXAM_REQUIREMENTS
};
