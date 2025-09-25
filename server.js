const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// OpenAI API endpoint
app.post('/api/generate-study-plan', async (req, res) => {
  try {
    const { targetExam, examDate, userData } = req.body;
    
    if (!targetExam || !examDate) {
      return res.status(400).json({ error: '목표 시험과 시험 날짜를 모두 입력해주세요.' });
    }

    // Import OpenAI here to avoid issues if not installed
    const { OpenAI } = require('openai');
    
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Calculate days until exam
    const today = new Date();
    const examDateObj = new Date(examDate);
    const daysUntilExam = Math.ceil((examDateObj - today) / (1000 * 60 * 60 * 24));

    // Analyze user's task patterns and create detailed summary
    const taskAnalysis = analyzeUserTasks(userData);
    
    const prompt = `당신은 전문적인 학습 계획 컨설턴트입니다. 다음 정보를 바탕으로 맞춤형 학습 계획을 생성해주세요:

목표 시험: ${targetExam}
시험 날짜: ${examDate}
남은 기간: ${daysUntilExam}일

=== 사용자의 상세한 학습 패턴 분석 ===
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

위의 상세한 분석을 바탕으로, 사용자의 기존 학습 패턴과 ${targetExam} 시험의 특성을 고려하여 다음 형식으로 4-6개의 구체적인 학습 할일을 추천해주세요:

1. 제목: 구체적이고 실행 가능한 할일 (기존 학습 활동과 연계)
   설명: 왜 이 할일이 중요한지, 기존 패턴을 어떻게 활용할지 상세히 설명
   우선순위: 높음/중간/낮음
   예상시간: 사용자의 평균 학습 시간을 고려한 현실적인 시간
   카테고리: 암기/이해/문제풀이/복습 중 하나

특히 사용자가 자주 하는 "${taskAnalysis.mostFrequentTask}" 활동과 가장 많은 시간을 투자한 "${taskAnalysis.longestTask}" 활동을 고려하여 추천해주세요.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "당신은 학습 계획 전문가입니다. 사용자의 목표 시험과 남은 기간을 고려하여 실용적이고 구체적인 학습 계획을 제공합니다."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0].message.content;
    
    // Parse the AI response into structured recommendations
    const recommendations = parseAIResponse(aiResponse, targetExam, daysUntilExam);
    
    res.json({ recommendations, rawResponse: aiResponse });

  } catch (error) {
    console.error('OpenAI API Error:', error);
    res.status(500).json({ 
      error: 'AI 학습 계획 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      details: error.message 
    });
  }
});

// Comprehensive task analysis function
function analyzeUserTasks(userData) {
  const { timeData = {}, taskSessions = {}, taskTagSessions = {}, taskHistory = [], totalTime = 0 } = userData || {};
  
  // Calculate task statistics
  const taskStats = {};
  const categoryStats = {};
  const hourlyActivity = {};
  
  // Process all task sessions
  Object.keys(taskSessions).forEach(hour => {
    const hourTasks = taskSessions[hour] || {};
    const hourTags = taskTagSessions[hour] || {};
    
          Object.keys(hourTasks).forEach(minute => {
        const taskName = hourTasks[minute];
        const tags = hourTags[minute] || [];
        const minuteTime = (timeData && timeData[hour] && timeData[hour][minute]) || 60000; // Default to 1 minute if no time data
        
        if (taskName) {
        // Task statistics
        if (!taskStats[taskName]) {
          taskStats[taskName] = {
            totalTime: 0,
            sessions: 0,
            tags: new Set(),
            hours: new Set()
          };
        }
        
        taskStats[taskName].totalTime += minuteTime;
        taskStats[taskName].sessions += 1;
        taskStats[taskName].hours.add(parseInt(hour));
        tags.forEach(tag => taskStats[taskName].tags.add(tag));
        
        // Category statistics (from tags)
        tags.forEach(tag => {
          if (!categoryStats[tag]) {
            categoryStats[tag] = 0;
          }
          categoryStats[tag] += minuteTime;
        });
        
        // Hourly activity
        if (!hourlyActivity[hour]) {
          hourlyActivity[hour] = 0;
        }
        hourlyActivity[hour] += minuteTime;
      }
    });
  });
  
  // Format time helper
  const formatTime = (ms) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    }
    return `${minutes}분`;
  };
  
  // Sort tasks by total time
  const sortedTasks = Object.entries(taskStats)
    .map(([name, stats]) => ({
      name,
      totalTime: stats.totalTime,
      formattedTime: formatTime(stats.totalTime),
      sessions: stats.sessions,
      tags: Array.from(stats.tags),
      hours: Array.from(stats.hours).sort((a, b) => a - b)
    }))
    .sort((a, b) => b.totalTime - a.totalTime);
  
  // Sort categories by time
  const sortedCategories = Object.entries(categoryStats)
    .map(([category, time]) => ({
      category,
      time,
      formattedTime: formatTime(time),
      percentage: totalTime > 0 ? Math.round((time / totalTime) * 100) : 0
    }))
    .sort((a, b) => b.time - a.time);
  
  // Analyze time patterns
  const activeHours = Object.entries(hourlyActivity)
    .filter(([hour, time]) => time > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  const timePatterns = activeHours.length > 0 
    ? `주로 ${activeHours.map(([hour, time]) => `${hour}시(${formatTime(time)})`).join(', ')} 시간대에 활동`
    : '시간대별 패턴 데이터 부족';
  
  // Generate summary
  const totalTasks = sortedTasks.length;
  const totalStudyTime = formatTime(totalTime);
  const avgSessionTime = totalTasks > 0 ? formatTime(Math.floor(totalTime / totalTasks)) : '0분';
  const mostFrequentTask = sortedTasks[0]?.name || '아직 기록된 학습 활동이 없습니다';
  const longestTask = sortedTasks[0]?.name || '아직 기록된 학습 활동이 없습니다';
  const topCategory = sortedCategories[0]?.category || '미분류';
  
  let summary;
  if (totalTasks === 0) {
    summary = `아직 학습 활동이 기록되지 않았습니다. 시간 측정기를 사용하여 학습을 시작해보세요!`;
  } else {
    summary = `총 ${totalTasks}개의 서로 다른 학습 활동을 ${totalStudyTime} 동안 수행했습니다. 평균 세션 시간은 ${avgSessionTime}이며, 주로 "${topCategory}" 카테고리의 학습을 선호합니다. 가장 많은 시간을 투자한 활동은 "${mostFrequentTask}"입니다.`;
  }
  
  return {
    summary,
    topTasks: sortedTasks.slice(0, 10), // Top 10 tasks
    categoryBreakdown: sortedCategories,
    timePatterns,
    mostFrequentTask,
    longestTask,
    totalTasks,
    totalStudyTime,
    avgSessionTime
  };
}

// Helper function to parse AI response
function parseAIResponse(response, targetExam, daysUntilExam) {
  // Try to parse structured response from AI
  const lines = response.split('\n').filter(line => line.trim());
  const recommendations = [];
  
  let currentRec = null;
  
  for (const line of lines) {
    // Look for numbered items (1., 2., etc.)
    const numberMatch = line.match(/^\d+\.\s*(.+)/);
    if (numberMatch) {
      if (currentRec) {
        recommendations.push(currentRec);
      }
      currentRec = {
        title: numberMatch[1].trim(),
        description: '',
        priority: '중간',
        estimatedTime: '1시간',
        category: '학습'
      };
    } else if (currentRec) {
      // Parse structured fields
      if (line.includes('설명:')) {
        currentRec.description = line.replace(/.*설명:\s*/, '').trim();
      } else if (line.includes('우선순위:')) {
        const priority = line.replace(/.*우선순위:\s*/, '').trim();
        currentRec.priority = priority;
      } else if (line.includes('예상시간:')) {
        const time = line.replace(/.*예상시간:\s*/, '').trim();
        currentRec.estimatedTime = time;
      } else if (line.includes('카테고리:')) {
        const category = line.replace(/.*카테고리:\s*/, '').trim();
        currentRec.category = category;
      } else if (line.trim() && !currentRec.description) {
        // If no explicit description field, use the line as description
        currentRec.description = line.trim();
      }
    }
  }
  
  // Add the last recommendation
  if (currentRec) {
    recommendations.push(currentRec);
  }
  
  // Fallback if parsing fails
  if (recommendations.length === 0) {
    return [
      {
        title: `${targetExam} 맞춤형 학습 계획`,
        description: "AI가 생성한 개인화된 학습 추천입니다. 기존 학습 패턴을 분석하여 최적화된 계획을 제공합니다.",
        priority: "높음",
        estimatedTime: "2시간",
        category: "종합"
      }
    ];
  }
  
  return recommendations;
}

// Serve index.html for all routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Time Tracker running on port ${PORT}`);
  console.log(`📱 Access your app at http://localhost:${PORT}`);
  console.log(`🤖 OpenAI API integration ready`);
});
