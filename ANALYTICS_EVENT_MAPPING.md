# Analytics Event Mapping

Complete mapping of UI interactions to Mixpanel tracking events

## Overview
This document maps every button, click, and interaction in the Smart Planner app to its corresponding Mixpanel event.

---

## 📱 User Authentication Events

### Login/Registration Modal
| UI Element | Location | Event Name | Properties | Code Reference |
|------------|----------|------------|------------|----------------|
| Nickname Submit | Nickname Modal | `User Registered` | nickname, registration_method | script.js:618 |
| Existing User Login | Nickname Modal | `User Login` | nickname | script.js:552 |
| Logout Button | Profile Dropdown | `User Logout` | nickname | script.js:739 |

---

## ⏱️ Time Tracker View (시간 측정기)

### Multi-Task Management
| UI Element | Location | Event Name | Properties | Code Reference |
|------------|----------|------------|------------|----------------|
| 작업 추가 Button | Tracker View | `Task Added` | task_name | analytics.js:185 |
| ▶️ Record Button | Task Item | `Task Started` | task_name, tags, tag_count | script.js:171 |
| ⏹ Stop Button | Task Item | `Task Stopped` | task_name, duration_minutes, duration_seconds, tags, tag_count | script.js:215 |
| 🗑️ Delete Button | Task Item | `Task Deleted` | task_name, total_time_minutes | analytics.js:191 |

### Task Input Modal
| UI Element | Location | Event Name | Properties | Code Reference |
|------------|----------|------------|------------|----------------|
| 시작 Button | Task Modal | `Task Started` | task_name, tags, tag_count | script.js:1395 |
| 취소 Button | Task Modal | *(No event)* | - | - |

---

## 📊 Analyzer View (시간 분석기)

### Calendar Interactions
| UI Element | Location | Event Name | Properties | Code Reference |
|------------|----------|------------|------------|----------------|
| ◀ Previous Month | Calendar Header | `Calendar Month Changed` | year, month, month_name | analytics.js:167 |
| ▶ Next Month | Calendar Header | `Calendar Month Changed` | year, month, month_name | analytics.js:167 |
| Calendar Date Click | Calendar Grid | `Calendar Date Selected` | selected_date, day_of_week, study_time_minutes, has_data | analytics.js:175 |
| View Switch to Analyzer | Bottom Nav | `View Switched` + `Analytics Viewed` | from_view, to_view, time_range | script.js:3086, 3116 |

### Task Summary
| UI Element | Location | Event Name | Properties | Code Reference |
|------------|----------|------------|------------|----------------|
| Category Dropdown | Task Summary Item | `Task Category Changed` | task_name, old_category, new_category | analytics.js:198 |

---

## 🤖 AI Todo View (AI 할일 추천)

### Recommendation Generation
| UI Element | Location | Event Name | Properties | Code Reference |
|------------|----------|------------|------------|----------------|
| 추천 받기 Button | AI Todo View | `AI Recommendation Generated` | exam_type, exam_date, recommendation_count, days_until_exam | script.js:2794 |
| Recommendation Card Click | AI Todo List | `AI Recommendation Clicked` | recommendation_title, recommendation_priority, recommendation_category, estimated_time | script.js:2959 |
| 시작하기 Button | Todo Confirm Modal | `AI Recommendation Started` | recommendation_title, recommendation_priority, recommendation_category, estimated_time | script.js:3044 |

### Input Fields
| UI Element | Location | Event Name | Properties | Code Reference |
|------------|----------|------------|------------|----------------|
| 목표 시험 Input | AI Todo View | *(No event)* | - | - |
| 시험 날짜 Input | AI Todo View | *(No event)* | - | - |

---

## 🧭 Navigation Events

### Bottom Navigation Bar
| UI Element | Location | Event Name | Properties | Code Reference |
|------------|----------|------------|------------|----------------|
| 시간 측정기 Tab | Bottom Nav | `View Switched` | from_view: current, to_view: 'tracker' | script.js:3086 |
| 시간 분석기 Tab | Bottom Nav | `View Switched` + `Analytics Viewed` | from_view: current, to_view: 'analyzer' | script.js:3086, 3116 |
| AI 할일 추천 Tab | Bottom Nav | `View Switched` | from_view: current, to_view: 'ai-todo' | script.js:3086 |

---

## 🔧 System Events

### Session Management
| Event | Trigger | Properties | Code Reference |
|-------|---------|------------|----------------|
| `Session Started` | Page Load (after analytics init) | user_agent, screen_width, screen_height, viewport_width, viewport_height | script.js:3181 |
| `Session Ended` | Page Unload | session_duration_minutes | analytics.js:186 |

### Error Tracking
| Event | Trigger | Properties | Code Reference |
|-------|---------|------------|----------------|
| `Error Occurred` | API/JS Error | error_type, error_message, context | script.js:2804 |

---

## 📋 Event Properties Reference

### Common Properties (All Events)
- `userId`: Current user's nickname
- `timestamp`: ISO timestamp of event
- `url`: Current page URL
- `userAgent`: Browser user agent string

### Task-Related Properties
- `task_name`: Name of the task
- `tags`: Array of category tags (e.g., ['멀티태스킹', '공부'])
- `tag_count`: Number of tags
- `duration_minutes`: Task duration in minutes
- `duration_seconds`: Task duration in seconds
- `total_time_minutes`: Total accumulated time

### Calendar Properties
- `year`: Selected year (number)
- `month`: Selected month (0-11)
- `month_name`: Localized month name (Korean)
- `selected_date`: Date string (YYYY-MM-DD)
- `day_of_week`: Localized day name (Korean)
- `study_time_minutes`: Study time for that date
- `has_data`: Boolean, whether date has recorded data

### AI Recommendation Properties
- `exam_type`: Target exam name
- `exam_date`: Exam date string
- `days_until_exam`: Days remaining until exam
- `recommendation_count`: Number of recommendations generated
- `recommendation_title`: Title of recommendation
- `recommendation_priority`: 높음/중간/낮음
- `recommendation_category`: Category of recommendation
- `estimated_time`: Estimated time to complete

### Category Options
- 공부
- 이동
- 식사
- 휴식
- 기타

---

## 🚀 Implementation Status

### ✅ Currently Tracked
- User authentication (login, register, logout)
- Task recording (start, stop, pause)
- View navigation
- AI recommendations (generate, click, start)
- Analytics views
- Session management
- Error tracking

### ⚠️ Needs Implementation
The following events are defined but need to be wired up in script.js:

1. **Calendar Events** (NEW)
   - `trackCalendarMonthChanged()` - Add to month navigation buttons
   - `trackCalendarDateSelected()` - Add to calendar date click handler

2. **Multi-Task Events** (NEW)
   - `trackTaskAdded()` - Add to "작업 추가" button
   - `trackTaskDeleted()` - Add to delete button click
   - `trackTaskCategoryChanged()` - Add to category dropdown change

---

## 📝 Usage Example

```javascript
// Track calendar date selection
if (window.analytics) {
  window.analytics.trackCalendarDateSelected(
    '2025-10-10',  // date
    7200000        // studyTime in ms (2 hours)
  );
}

// Track task addition
if (window.analytics) {
  window.analytics.trackTaskAdded('Math Homework');
}

// Track month change
if (window.analytics) {
  window.analytics.trackCalendarMonthChanged(2025, 9); // October 2025
}
```

---

## 🔍 Debugging

To enable debug mode and see all tracked events in console:
1. Open app on localhost, OR
2. Add `?debug=true` to URL

Debug mode will log every tracked event with full properties.

---

## 📊 Mixpanel Dashboard

View tracked events at: https://mixpanel.com/
- Project: Smart Planner
- Token: Set in `MIXPANEL_PROJECT_TOKEN` environment variable

---

*Last Updated: 2025-10-10*
*Version: 2.0*

