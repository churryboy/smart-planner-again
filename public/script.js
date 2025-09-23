// API Configuration
const API_BASE = window.location.origin + '/api';
const OPENAI_API_KEY = window.OPENAI_API_KEY || 'your-api-key-here';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Global state
let currentUser = null;
let currentEvents = [];
let currentTodos = [];

// Toast notification function
function showToast(message, type = 'success', duration = 2000) {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;

  toastContainer.appendChild(toast);

  // Trigger animation
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  // Remove toast after duration
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, duration);
}

// Check if authentication is required
const requireAuth = window.APP_CONFIG?.requireAuth ?? true;

// ========================================
// Storage Manager (localStorage fallback)
// ========================================
class StorageManager {
  static getEvents() {
    const events = localStorage.getItem('smart-planner-events');
    return events ? JSON.parse(events) : [];
  }

  static saveEvents(events) {
    localStorage.setItem('smart-planner-events', JSON.stringify(events));
  }

  static getTodos() {
    const todos = localStorage.getItem('smart-planner-todos');
    return todos ? JSON.parse(todos) : [];
  }

  static saveTodos(todos) {
    localStorage.setItem('smart-planner-todos', JSON.stringify(todos));
  }

  static addEvent(event) {
    const events = this.getEvents();
    event.id = Date.now().toString();
    events.push(event);
    this.saveEvents(events);
    return event;
  }

  static addTodo(todo) {
    const todos = this.getTodos();
    todo.id = Date.now().toString();
    todo.completed = false;
    todos.push(todo);
    this.saveTodos(todos);
    return todo;
  }

  static updateTodo(todoId, updates) {
    const todos = this.getTodos();
    const index = todos.findIndex(t => t.id === todoId);
    if (index !== -1) {
      todos[index] = { ...todos[index], ...updates };
      this.saveTodos(todos);
      return todos[index];
    }
    return null;
  }
}

// ========================================
// App Manager
// ========================================
class AppManager {
  constructor() {
    this.initializeApp();
  }

  initializeApp() {
    if (requireAuth) {
      // Show authentication modal
      this.showAuthModal();
    } else {
      // Skip authentication, use static mode
      this.setStaticUser();
    }
  }

  setStaticUser() {
    currentUser = window.APP_CONFIG?.defaultUser || {
      id: 'local-user',
      name: '사용자',
      email: 'user@local.com'
    };

    // Hide auth modal and show app
    document.getElementById('auth-overlay').style.display = 'none';
    document.getElementById('app-container').style.display = 'block';
    document.getElementById('user-name').textContent = currentUser.name;

    // Initialize app components
    this.initializeComponents();
    this.loadLocalData();
  }

  initializeComponents() {
    window.globalCalendar = new Calendar();
    window.globalScheduleModal = new ScheduleModal();
    window.globalBottomSheet = new BottomSheet();
    window.globalChatManager = new ChatManager();
  }

  loadLocalData() {
    currentEvents = StorageManager.getEvents();
    currentTodos = StorageManager.getTodos();
    
    window.globalCalendar?.renderCalendar();
    this.renderTodos();
  }

  renderTodos() {
    const todoList = document.getElementById('todo-list');
    if (!todoList) return;

    todoList.innerHTML = '';

    if (currentTodos.length === 0) {
      todoList.innerHTML = '<p class="empty-state">할 일이 없습니다.</p>';
      return;
    }

    currentTodos.forEach(todo => {
      const todoItem = document.createElement('div');
      todoItem.className = 'todo-item';
      todoItem.innerHTML = `
        <label class="todo-checkbox">
          <input type="checkbox" ${todo.completed ? 'checked' : ''} 
                 onchange="appManager.toggleTodo('${todo.id}', this.checked)">
          <span class="checkmark"></span>
        </label>
        <div class="todo-content">
          <div class="todo-title ${todo.completed ? 'completed' : ''}">${todo.title}</div>
          ${todo.due_date ? `<div class="todo-time">${new Date(todo.due_date).toLocaleDateString('ko-KR')}</div>` : ''}
        </div>
      `;
      todoList.appendChild(todoItem);
    });
  }

  toggleTodo(todoId, completed) {
    const updatedTodo = StorageManager.updateTodo(todoId, { completed });
    if (updatedTodo) {
      const todo = currentTodos.find(t => t.id === todoId);
      if (todo) {
        todo.completed = completed;
        this.renderTodos();
      }
    }
  }

  showAuthModal() {
    document.getElementById('auth-overlay').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
  }
}

// ========================================
// Calendar Class
// ========================================
class Calendar {
  constructor() {
    this.currentDate = new Date();
    this.selectedDate = null;
    this.initializeEventListeners();
    this.renderCalendar();
  }

  initializeEventListeners() {
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');

    prevBtn?.addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.renderCalendar();
    });

    nextBtn?.addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.renderCalendar();
    });
  }

  renderCalendar() {
    const monthTitle = document.getElementById('current-month');
    const calendarDays = document.getElementById('calendar-days');

    if (!monthTitle || !calendarDays) return;

    // Update month title
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    monthTitle.textContent = `${year}년 ${month + 1}월`;

    // Clear previous days
    calendarDays.innerHTML = '';

    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'calendar-day empty';
      calendarDays.appendChild(emptyDay);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement('div');
      dayElement.className = 'calendar-day';
      
      const currentDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const eventsForDay = this.getEventsForDate(currentDateStr);
      
      // Check if it's today
      const today = new Date();
      if (year === today.getFullYear() && month === today.getMonth() && day === today.getDate()) {
        dayElement.classList.add('today');
      }

      dayElement.innerHTML = `
        <span class="day-number">${day}</span>
        ${eventsForDay.length > 0 ? `<div class="event-indicators">${eventsForDay.slice(0, 3).map(event => 
          `<div class="event-dot ${event.category || 'other'}"></div>`
        ).join('')}</div>` : ''}
      `;

      dayElement.addEventListener('click', (e) => {
        this.selectDate(currentDateStr, e.target);
      });

      calendarDays.appendChild(dayElement);
    }
  }

  getEventsForDate(dateStr) {
    const events = currentEvents.filter(event => {
      const eventDate = event.start_date?.split('T')[0] || event.start_date;
      return eventDate === dateStr;
    });
    console.log(`Events for ${dateStr}:`, events);
    return events;
  }

  selectDate(dateStr, targetElement = null) {
    console.log('selectDate called with:', dateStr);
    this.selectedDate = dateStr;
    
    // Remove previous selection
    document.querySelectorAll('.calendar-day.selected').forEach(day => {
      day.classList.remove('selected');
    });

    // Add selection to clicked day
    if (targetElement) {
      targetElement.closest('.calendar-day').classList.add('selected');
    }

    // Show timeline view
    console.log('Calling showTimelineView');
    this.showTimelineView(dateStr);
  }

  showTimelineView(dateStr) {
    console.log('showTimelineView called with:', dateStr);
    const timelineSection = document.getElementById('timeline-section');
    const calendarSection = document.querySelector('.calendar-section');
    const todoSection = document.querySelector('.todo-section');
    const timelineTitle = document.getElementById('timeline-title');

    console.log('Timeline elements found:', {
      timelineSection: !!timelineSection,
      calendarSection: !!calendarSection,
      todoSection: !!todoSection,
      timelineTitle: !!timelineTitle
    });

    if (!timelineSection) {
      console.error('Timeline section not found!');
      return;
    }

    // Reload events from localStorage to ensure we have the latest data
    currentEvents = StorageManager.getEvents();

    // Hide calendar section and show timeline
    console.log('Hiding calendar and showing timeline');
    if (calendarSection) calendarSection.style.display = 'none';
    if (todoSection) todoSection.style.display = 'none';
    timelineSection.style.display = 'block';
    console.log('Timeline display set to block');

    // Update timeline title
    const date = new Date(dateStr);
    timelineTitle.textContent = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;

    // Render timeline
    this.renderTimeline(dateStr);

    // Setup back button
    const backBtn = document.getElementById('timeline-back-btn');
    backBtn.onclick = () => {
      timelineSection.style.display = 'none';
      if (calendarSection) calendarSection.style.display = 'block';
      if (todoSection) todoSection.style.display = 'block';
    };

    // Setup navigation buttons
    const prevBtn = document.getElementById('timeline-prev-day');
    const nextBtn = document.getElementById('timeline-next-day');
    
    prevBtn.onclick = () => {
      const currentDate = new Date(dateStr);
      currentDate.setDate(currentDate.getDate() - 1);
      const newDateStr = currentDate.toISOString().split('T')[0];
      this.showTimelineView(newDateStr);
    };
    
    nextBtn.onclick = () => {
      const currentDate = new Date(dateStr);
      currentDate.setDate(currentDate.getDate() + 1);
      const newDateStr = currentDate.toISOString().split('T')[0];
      this.showTimelineView(newDateStr);
    };

    // Setup swipe navigation
    this.setupSwipeNavigation(timelineSection, dateStr);
  }

  renderTimeline(dateStr) {
    const timelineContent = document.getElementById('timeline-content');
    if (!timelineContent) return;

    timelineContent.innerHTML = '';

    // Get all events for the day
    const allDayEvents = this.getEventsForDate(dateStr);
    
    // Show all-day events (events without specific times) at the top
    const allDayEventsWithoutTime = allDayEvents.filter(event => !event.start_time);
    if (allDayEventsWithoutTime.length > 0) {
      const allDaySection = document.createElement('div');
      allDaySection.className = 'timeline-all-day';
      allDaySection.innerHTML = `
        <div class="hour-label">종일</div>
        <div class="hour-events">
          ${allDayEventsWithoutTime.map(event => `
            <div class="timeline-event ${event.category || 'other'}">
              <div class="event-title">${event.title}</div>
              <div class="event-time">종일 일정</div>
            </div>
          `).join('')}
        </div>
      `;
      timelineContent.appendChild(allDaySection);
    }

    // Create timeline hours (6 AM to 11 PM)
    for (let hour = 6; hour <= 23; hour++) {
      const hourElement = document.createElement('div');
      hourElement.className = 'timeline-hour';
      
      const eventsForHour = this.getEventsForHour(dateStr, hour);
      
      hourElement.innerHTML = `
        <div class="hour-label">${hour}:00</div>
        <div class="hour-events">
          ${eventsForHour.map(event => `
            <div class="timeline-event ${event.category || 'other'}">
              <div class="event-title">${event.title}</div>
              <div class="event-time">
                ${event.start_time ? event.start_time.substring(0, 5) : ''} - 
                ${event.end_time ? event.end_time.substring(0, 5) : ''}
              </div>
            </div>
          `).join('')}
        </div>
      `;

      timelineContent.appendChild(hourElement);
    }
  }

  getEventsForHour(dateStr, hour) {
    const eventsForDay = this.getEventsForDate(dateStr);
    return eventsForDay.filter(event => {
      if (!event.start_time) return false;
      const eventHour = parseInt(event.start_time.split(':')[0]);
      return eventHour === hour;
    });
  }

  setupSwipeNavigation(element, currentDateStr) {
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;

    element.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    });

    element.addEventListener('touchend', (e) => {
      endX = e.changedTouches[0].clientX;
      endY = e.changedTouches[0].clientY;
      
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      
      // Check if horizontal swipe is more significant than vertical
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        const currentDate = new Date(currentDateStr);
        
        if (deltaX > 0) {
          // Swipe right - previous day
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          // Swipe left - next day
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        const newDateStr = currentDate.toISOString().split('T')[0];
        this.showTimelineView(newDateStr);
      }
    });
  }
}

// ========================================
// Schedule Modal
// ========================================
class ScheduleModal {
  constructor() {
    this.modal = document.getElementById('schedule-modal');
    this.form = document.getElementById('schedule-form');
    this.selectedDate = null;
    this.editingEvent = null;
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    const closeBtn = document.getElementById('schedule-close');
    const cancelBtn = document.getElementById('schedule-cancel');

    closeBtn?.addEventListener('click', () => this.close());
    cancelBtn?.addEventListener('click', () => this.close());
    this.form?.addEventListener('submit', (e) => this.handleSubmit(e));

    // Close on overlay click
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.close();
      }
    });

    // ESC key handler
    if (!this.escListenerBound) {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.modal?.classList.contains('active')) {
          this.close();
        }
      });
      this.escListenerBound = true;
    }
  }

  open(selectedDate = null, eventData = null) {
    this.selectedDate = selectedDate;
    this.editingEvent = eventData;
    
    // Set modal title
    const title = document.querySelector('.modal-title');
    const confirmBtn = document.getElementById('schedule-confirm');
    
    if (eventData) {
      title.textContent = '일정 수정';
      confirmBtn.textContent = '일정 수정';
      this.fillForm(eventData);
    } else {
      title.textContent = '일정 추가';
      confirmBtn.textContent = '일정 추가';
      this.clearForm();
      
      // Set default date only if provided, otherwise leave empty
      if (selectedDate) {
        document.getElementById('event-date').value = selectedDate;
      }
    }

    this.modal.classList.add('active');
  }

  close() {
    this.modal.classList.remove('active');
    this.clearForm();
    this.selectedDate = null;
    this.editingEvent = null;
  }

  fillForm(eventData) {
    document.getElementById('event-title').value = eventData.title || '';
    document.getElementById('event-date').value = eventData.start_date?.split('T')[0] || '';
    document.getElementById('event-end-date').value = eventData.end_date?.split('T')[0] || '';
    document.getElementById('event-start-time').value = eventData.start_time || '';
    document.getElementById('event-end-time').value = eventData.end_time || '';
    document.getElementById('event-description').value = eventData.description || '';
    
    // Set category radio button
    const categoryRadio = document.querySelector(`input[name="category"][value="${eventData.category || ''}"]`);
    if (categoryRadio) {
      categoryRadio.checked = true;
    }
    
    // Set priority radio button
    const priorityRadio = document.querySelector(`input[name="priority"][value="${eventData.priority || 'medium'}"]`);
    if (priorityRadio) {
      priorityRadio.checked = true;
    }
    
    // Set reminder radio button
    const reminderRadio = document.querySelector(`input[name="reminder"][value="${eventData.reminder || ''}"]`);
    if (reminderRadio) {
      reminderRadio.checked = true;
    }
  }

  clearForm() {
    this.form.reset();
    
    // Set default priority to medium
    const mediumPriority = document.querySelector('input[name="priority"][value="medium"]');
    if (mediumPriority) {
      mediumPriority.checked = true;
    }
    
    // Set default reminder to none
    const noReminder = document.querySelector('input[name="reminder"][value=""]');
    if (noReminder) {
      noReminder.checked = true;
    }
  }

  handleSubmit(e) {
    e.preventDefault();

    const eventData = {
      title: document.getElementById('event-title').value,
      description: document.getElementById('event-description').value,
      start_date: document.getElementById('event-date').value,
      end_date: document.getElementById('event-end-date').value || document.getElementById('event-date').value,
      start_time: document.getElementById('event-start-time').value || null,
      end_time: document.getElementById('event-end-time').value || null,
      category: document.querySelector('input[name="category"]:checked')?.value,
      priority: document.querySelector('input[name="priority"]:checked')?.value || 'medium',
      reminder: parseInt(document.querySelector('input[name="reminder"]:checked')?.value) || null
    };

    // Validation
    if (!eventData.title || !eventData.start_date || !eventData.category) {
      showToast('제목, 날짜, 카테고리는 필수입니다.', 'error');
      return;
    }

    try {
      if (this.editingEvent) {
        // Update existing event
        const index = currentEvents.findIndex(e => e.id === this.editingEvent.id);
        if (index !== -1) {
          currentEvents[index] = { ...currentEvents[index], ...eventData };
          StorageManager.saveEvents(currentEvents);
        }
      } else {
        // Create new event
        const newEvent = StorageManager.addEvent(eventData);
        currentEvents.push(newEvent);
      }

      // Refresh calendar
      window.globalCalendar?.renderCalendar();

      // Show success message
      showToast('일정이 성공적으로 저장되었습니다!', 'success');

      this.close();
    } catch (error) {
      console.error('Failed to save event:', error);
      showToast('일정 저장 중 오류가 발생했습니다.', 'error');
    }
  }
}

// ========================================
// Bottom Sheet Class
// ========================================
class BottomSheet {
  constructor() {
    this.bottomSheet = document.getElementById('bottom-sheet');
    this.isOpen = false;
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    const closeBtn = document.getElementById('chat-close');
    closeBtn?.addEventListener('click', () => this.close());

    // Close on overlay click
    this.bottomSheet?.addEventListener('click', (e) => {
      if (e.target === this.bottomSheet) {
        this.close();
      }
    });
  }

  open() {
    if (this.bottomSheet) {
      this.bottomSheet.classList.add('active');
      this.isOpen = true;
      
      // Focus on chat input
      const chatInput = document.getElementById('chat-input');
      setTimeout(() => chatInput?.focus(), 300);
    }
  }

  close() {
    if (this.bottomSheet) {
      this.bottomSheet.classList.remove('active');
      this.isOpen = false;
    }
  }
}

// ========================================
// Chat Manager
// ========================================
class ChatManager {
  constructor() {
    this.messages = [];
    this.initializeEventListeners();
    this.initializeChat();
  }

  initializeEventListeners() {
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');

    chatInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendMessage();
      }
    });

    sendBtn?.addEventListener('click', () => this.sendMessage());
  }

  initializeChat() {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    messagesContainer.innerHTML = `
      <div class="message bot-message">
        <div class="message-content">
          안녕하세요! 일정을 추가해드릴게요. 어떤 일정을 만들어드릴까요?
        </div>
      </div>
    `;
  }

  async sendMessage() {
    const chatInput = document.getElementById('chat-input');
    const message = chatInput?.value.trim();

    if (!message) return;

    // Add user message to chat
    this.addMessage(message, 'user');
    chatInput.value = '';

    // Show typing indicator
    this.showTypingIndicator();

    try {
      // Get AI response
      const aiResponse = await this.getAIResponse(message);
      
      // Remove typing indicator
      this.hideTypingIndicator();
      
      // Add AI response to chat
      this.addMessage(aiResponse, 'bot');

      // Check if this is a schedule creation request
      if (this.isScheduleCreationRequest(aiResponse)) {
        setTimeout(() => {
          this.handleScheduleCreation(aiResponse);
        }, 1000);
      }
    } catch (error) {
      console.error('Chat error:', error);
      this.hideTypingIndicator();
      this.addMessage('죄송합니다. 오류가 발생했습니다. 다시 시도해주세요.', 'bot');
    }
  }

  addMessage(content, sender) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    messageDiv.innerHTML = `<div class="message-content">${content}</div>`;

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  showTypingIndicator() {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message typing-indicator';
    typingDiv.innerHTML = `
      <div class="message-content">
        <div class="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    `;

    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  hideTypingIndicator() {
    const typingIndicator = document.querySelector('.typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  async getAIResponse(userMessage) {
    const systemPrompt = `당신은 한국어 일정 관리 도우미입니다. 사용자가 일정을 추가하고 싶어할 때, 다음 정보를 한 번에 모두 물어보세요:

1) 일정 제목
2) 시작 날짜와 종료 날짜 (YYYY-MM-DD 형식)
3) 시작 시간과 종료 시간 (HH:MM 형식, 선택사항)
4) 중요도 (낮음/보통/높음)
5) 세부 내용 (선택사항)

사용자가 모든 정보를 제공하면, 다음 형식으로 정확히 응답하세요:
"일정을 추가하겠습니다:
제목: [제목]
날짜: [시작날짜] ~ [종료날짜]
시간: [시작시간] ~ [종료시간]
중요도: [중요도]
내용: [내용]

이 정보로 일정을 추가할까요?"

간단하고 친근하게 대화하세요.`;

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error('AI API request failed');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  isScheduleCreationRequest(aiResponse) {
    return aiResponse.includes('일정을 추가하겠습니다:') || 
           aiResponse.includes('이 정보로 일정을 추가할까요?');
  }

  handleScheduleCreation(aiResponse) {
    try {
      // Parse the AI response to extract schedule data
      const scheduleData = this.parseScheduleFromAI(aiResponse);
      
      if (scheduleData) {
        // Close bottom sheet
        window.globalBottomSheet?.close();
        
        // Open schedule modal with pre-filled data
        window.globalScheduleModal?.open(scheduleData.start_date, scheduleData);
      }
    } catch (error) {
      console.error('Failed to parse schedule data:', error);
    }
  }

  parseScheduleFromAI(aiResponse) {
    try {
      const lines = aiResponse.split('\n');
      const scheduleData = {};

      lines.forEach(line => {
        if (line.includes('제목:')) {
          scheduleData.title = line.split('제목:')[1]?.trim();
        } else if (line.includes('날짜:')) {
          const dateStr = line.split('날짜:')[1]?.trim();
          const dates = dateStr.split('~').map(d => d.trim());
          scheduleData.start_date = dates[0];
          scheduleData.end_date = dates[1] || dates[0];
        } else if (line.includes('시간:')) {
          const timeStr = line.split('시간:')[1]?.trim();
          if (timeStr && !timeStr.includes('없음')) {
            const times = timeStr.split('~').map(t => t.trim());
            scheduleData.start_time = times[0];
            scheduleData.end_time = times[1] || times[0];
          }
        } else if (line.includes('중요도:')) {
          const priority = line.split('중요도:')[1]?.trim();
          if (priority.includes('높음')) scheduleData.priority = 'high';
          else if (priority.includes('낮음')) scheduleData.priority = 'low';
          else scheduleData.priority = 'medium';
        } else if (line.includes('내용:')) {
          scheduleData.description = line.split('내용:')[1]?.trim();
        }
      });

      return scheduleData;
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return null;
    }
  }
}

// ========================================
// Initialize App
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  // Initialize app manager
  window.appManager = new AppManager();

  // Navigation functionality
  const navItems = document.querySelectorAll('.nav-item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // Add todo functionality
  const todoAddBtn = document.getElementById('todo-add-btn');
  todoAddBtn?.addEventListener('click', () => {
    const title = prompt('할 일을 입력하세요:');
    if (title) {
      const newTodo = StorageManager.addTodo({ title });
      currentTodos.push(newTodo);
      window.appManager?.renderTodos();
    }
  });

  // FAB functionality - open schedule modal
  const fab = document.getElementById('fab');
  fab?.addEventListener('click', () => {
    // Open modal without pre-filling date
    window.globalScheduleModal?.open();
  });

  // Chat button functionality - open chat bottom sheet
  const chatButton = document.getElementById('chat-button');
  chatButton?.addEventListener('click', () => {
    window.globalBottomSheet?.open();
  });
});
