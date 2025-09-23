/**
 * Smart Planner - Optimized JavaScript
 * Design System Compliant
 * Version: 2.0.0
 */

// ==============================================
// Application Configuration
// ==============================================
const APP_CONFIG = {
  storageKey: 'smart-planner-events',
  dateFormat: 'ko-KR',
  categories: ['study', 'daily', 'entertainment', 'other'],
  priorities: ['low', 'medium', 'high']
};

// ==============================================
// Main Application Class
// ==============================================
class SmartPlannerApp {
  constructor() {
    this.events = [];
    this.currentDate = new Date();
    this.selectedDate = null;
    this.currentSection = 'calendar';
    this.editingEvent = null;
    
    // Cache DOM elements for performance
    this.elements = this.cacheElements();
    
    // Initialize app
    this.init();
  }
  
  // ==============================================
  // Initialization
  // ==============================================
  init() {
    this.loadEvents();
    this.renderCalendar();
    this.attachEventListeners();
    this.updateStats();
  }
  
  cacheElements() {
    return {
      // Calendar elements
      calendarDays: document.getElementById('calendar-days'),
      currentMonth: document.getElementById('current-month'),
      calendarSection: document.getElementById('calendar-section'),
      
      // Timeline elements
      timelineSection: document.getElementById('timeline-section'),
      timelineContent: document.getElementById('timeline-content'),
      timelineTitle: document.getElementById('timeline-title'),
      
      // Tasks elements
      tasksSection: document.getElementById('tasks-section'),
      tasksList: document.getElementById('tasks-list'),
      
      // Stats elements
      statsSection: document.getElementById('stats-section'),
      monthEvents: document.getElementById('month-events'),
      completedEvents: document.getElementById('completed-events'),
      categoryStats: document.getElementById('category-stats'),
      
      // Settings elements
      settingsSection: document.getElementById('settings-section'),
      
      // Modal elements
      modal: document.getElementById('schedule-modal'),
      modalTitle: document.getElementById('modal-title'),
      form: document.getElementById('schedule-form'),
      eventTitle: document.getElementById('event-title'),
      eventDate: document.getElementById('event-date'),
      eventEndDate: document.getElementById('event-end-date'),
      eventStartTime: document.getElementById('event-start-time'),
      eventEndTime: document.getElementById('event-end-time'),
      eventDescription: document.getElementById('event-description'),
      
      // Toast container
      toastContainer: document.getElementById('toast-container')
    };
  }
  
  // ==============================================
  // Event Management
  // ==============================================
  loadEvents() {
    try {
      const stored = localStorage.getItem(APP_CONFIG.storageKey);
      this.events = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load events:', error);
      this.events = [];
      this.showToast('Failed to load saved events', 'error');
    }
  }
  
  saveEvents() {
    try {
      localStorage.setItem(APP_CONFIG.storageKey, JSON.stringify(this.events));
    } catch (error) {
      console.error('Failed to save events:', error);
      this.showToast('Failed to save events', 'error');
    }
  }
  
  addEvent(eventData) {
    const event = {
      ...eventData,
      id: Date.now().toString(),
      created: new Date().toISOString(),
      completed: false
    };
    
    this.events.push(event);
    this.saveEvents();
    this.updateStats();
    
    return event;
  }
  
  updateEvent(eventId, eventData) {
    const index = this.events.findIndex(e => e.id === eventId);
    if (index !== -1) {
      this.events[index] = {
        ...this.events[index],
        ...eventData,
        updated: new Date().toISOString()
      };
      this.saveEvents();
      this.updateStats();
      return this.events[index];
    }
    return null;
  }
  
  deleteEvent(eventId) {
    const index = this.events.findIndex(e => e.id === eventId);
    if (index !== -1) {
      this.events.splice(index, 1);
      this.saveEvents();
      this.updateStats();
      return true;
    }
    return false;
  }
  
  getEventsForDate(dateStr) {
    return this.events.filter(event => {
      const eventDate = event.date || event.start_date;
      return eventDate === dateStr;
    });
  }
  
  getEventsForMonth(year, month) {
    return this.events.filter(event => {
      const eventDate = new Date(event.date || event.start_date);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    });
  }
  
  // ==============================================
  // Calendar Rendering
  // ==============================================
  renderCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // Update month title
    this.elements.currentMonth.textContent = 
      `${year}년 ${month + 1}월`;
    
    // Clear calendar
    this.elements.calendarDays.innerHTML = '';
    
    // Calculate days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Add empty cells for alignment
    for (let i = 0; i < firstDay; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'calendar-day empty';
      this.elements.calendarDays.appendChild(emptyDay);
    }
    
    // Add days of the month
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEl = this.createCalendarDay(year, month, day, today);
      this.elements.calendarDays.appendChild(dayEl);
    }
  }
  
  createCalendarDay(year, month, day, today) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    
    const dateStr = this.formatDate(year, month, day);
    const events = this.getEventsForDate(dateStr);
    
    // Check if today
    if (year === today.getFullYear() && 
        month === today.getMonth() && 
        day === today.getDate()) {
      dayEl.classList.add('today');
    }
    
    // Check if selected
    if (this.selectedDate === dateStr) {
      dayEl.classList.add('selected');
    }
    
    // Create day content
    const dayNumber = document.createElement('span');
    dayNumber.textContent = day;
    dayEl.appendChild(dayNumber);
    
    // Add event indicators
    if (events.length > 0) {
      const indicators = document.createElement('div');
      indicators.className = 'event-indicators';
      
      events.slice(0, 3).forEach(event => {
        const dot = document.createElement('div');
        dot.className = 'event-dot';
        dot.style.backgroundColor = `var(--category-${event.category || 'other'})`;
        indicators.appendChild(dot);
      });
      
      dayEl.appendChild(indicators);
    }
    
    // Add click handler
    dayEl.addEventListener('click', () => this.selectDate(dateStr));
    
    return dayEl;
  }
  
  formatDate(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  
  selectDate(dateStr) {
    this.selectedDate = dateStr;
    this.showTimeline(dateStr);
  }
  
  // ==============================================
  // Timeline Rendering
  // ==============================================
  showTimeline(dateStr) {
    // Update selected date
    this.selectedDate = dateStr;
    
    // Hide other sections and show timeline
    this.hideAllSections();
    this.elements.timelineSection.classList.remove('hidden');
    
    // Update title
    const date = new Date(dateStr);
    this.elements.timelineTitle.textContent = 
      date.toLocaleDateString(APP_CONFIG.dateFormat, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    
    // Render timeline
    this.renderTimeline(dateStr);
  }
  
  renderTimeline(dateStr) {
    const events = this.getEventsForDate(dateStr);
    this.elements.timelineContent.innerHTML = '';
    
    // Group events by time
    const allDayEvents = events.filter(e => !e.start_time);
    const timedEvents = events.filter(e => e.start_time);
    
    // Show all-day events
    if (allDayEvents.length > 0) {
      const allDayHour = this.createTimelineHour('종일', allDayEvents);
      this.elements.timelineContent.appendChild(allDayHour);
    }
    
    // Create hourly timeline (6 AM to 11 PM)
    for (let hour = 6; hour <= 23; hour++) {
      const hourEvents = timedEvents.filter(event => {
        const eventHour = parseInt(event.start_time.split(':')[0]);
        return eventHour === hour;
      });
      
      const hourEl = this.createTimelineHour(`${hour}:00`, hourEvents);
      this.elements.timelineContent.appendChild(hourEl);
    }
  }
  
  createTimelineHour(label, events) {
    const hourEl = document.createElement('div');
    hourEl.className = 'timeline-hour';
    
    const labelEl = document.createElement('div');
    labelEl.className = 'hour-label text-caption1';
    labelEl.textContent = label;
    
    const eventsEl = document.createElement('div');
    eventsEl.className = 'hour-events';
    
    events.forEach(event => {
      const eventEl = this.createTimelineEvent(event);
      eventsEl.appendChild(eventEl);
    });
    
    hourEl.appendChild(labelEl);
    hourEl.appendChild(eventsEl);
    
    return hourEl;
  }
  
  createTimelineEvent(event) {
    const eventEl = document.createElement('div');
    eventEl.className = 'timeline-event';
    eventEl.style.borderLeftColor = `var(--category-${event.category || 'other'})`;
    
    const titleEl = document.createElement('div');
    titleEl.className = 'event-title';
    titleEl.textContent = event.title;
    
    eventEl.appendChild(titleEl);
    
    if (event.start_time) {
      const timeEl = document.createElement('div');
      timeEl.className = 'event-time';
      timeEl.textContent = event.end_time ? 
        `${event.start_time} - ${event.end_time}` : 
        event.start_time;
      eventEl.appendChild(timeEl);
    }
    
    // Add click handler for editing
    eventEl.addEventListener('click', () => {
      this.openModal(null, event);
    });
    
    return eventEl;
  }
  
  // ==============================================
  // Tasks Rendering
  // ==============================================
  renderTasks() {
    // Sort events by date
    const sortedEvents = [...this.events].sort((a, b) => {
      const dateA = new Date(a.date || a.start_date);
      const dateB = new Date(b.date || b.start_date);
      return dateA - dateB;
    });
    
    this.elements.tasksList.innerHTML = '';
    
    if (sortedEvents.length === 0) {
      this.elements.tasksList.innerHTML = 
        '<p class="empty-state">등록된 일정이 없습니다.</p>';
      return;
    }
    
    // Group events by month
    const groupedEvents = this.groupEventsByMonth(sortedEvents);
    
    // Render grouped events
    Object.entries(groupedEvents).forEach(([monthKey, events]) => {
      // Create month header
      const monthHeader = document.createElement('h3');
      monthHeader.className = 'text-headline';
      monthHeader.style.marginTop = 'var(--space-lg)';
      monthHeader.style.marginBottom = 'var(--space-base)';
      monthHeader.textContent = monthKey;
      this.elements.tasksList.appendChild(monthHeader);
      
      // Add ChatGPT analysis panel
      const analysisPanel = this.createAnalysisPanel(monthKey, events);
      this.elements.tasksList.appendChild(analysisPanel);      
      // Render events for this month
      events.forEach(event => {
        const taskEl = this.createTaskItem(event);
        this.elements.tasksList.appendChild(taskEl);
      });
    });
  }
  
  groupEventsByMonth(events) {
    const grouped = {};
    
    events.forEach(event => {
      const date = new Date(event.date || event.start_date);
      const monthKey = date.toLocaleDateString(APP_CONFIG.dateFormat, {
        year: 'numeric',
        month: 'long'
      });
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(event);
    });
    
    return grouped;
  }
  
  createTaskItem(event) {
    const taskEl = document.createElement('div');
    taskEl.className = 'task-item';
    
    // Category indicator
    const indicator = document.createElement('div');
    indicator.className = 'task-indicator';
    indicator.style.backgroundColor = `var(--category-${event.category || 'other'})`;
    
    // Content
    const content = document.createElement('div');
    content.className = 'task-content';
    
    const title = document.createElement('div');
    title.className = 'task-title';
    title.textContent = event.title;
    
    const meta = document.createElement('div');
    meta.className = 'task-meta';
    const date = new Date(event.date || event.start_date);
    meta.textContent = date.toLocaleDateString(APP_CONFIG.dateFormat);
    
    if (event.start_time) {
      meta.textContent += ` ${event.start_time}`;
    }
    
    content.appendChild(title);
    content.appendChild(meta);
    
    // Actions
    const actions = document.createElement('div');
    actions.className = 'task-actions';
    
    const editBtn = document.createElement('button');
    editBtn.className = 'task-btn';
    editBtn.innerHTML = '<svg class="icon" style="width:16px;height:16px" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.openModal(null, event);
    });
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'task-btn';
    deleteBtn.innerHTML = '<svg class="icon" style="width:16px;height:16px" viewBox="0 0 24 24"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('이 일정을 삭제하시겠습니까?')) {
        this.deleteEvent(event.id);
        this.renderTasks();
        this.renderCalendar();
        this.showToast('일정이 삭제되었습니다', 'success');
      }
    });
    
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    
    taskEl.appendChild(indicator);
    taskEl.appendChild(content);
    taskEl.appendChild(actions);
    
    // Add click handler to entire task item
    taskEl.addEventListener("click", () => {
      this.openModal(null, event);
    });
    
    // Prevent event bubbling on action buttons
    actions.addEventListener("click", (e) => {
      e.stopPropagation();
    });    
    return taskEl;
  }
  
  // ==============================================
  // Stats Rendering
  // ==============================================
  updateStats() {
    // Calculate stats
    const currentMonth = new Date();
    const monthEvents = this.getEventsForMonth(
      currentMonth.getFullYear(),
      currentMonth.getMonth()
    );
    
    const completedEvents = this.events.filter(e => e.completed).length;
    
    // Update stat numbers
    if (this.elements.monthEvents) {
      this.elements.monthEvents.textContent = monthEvents.length;
    }
    
    if (this.elements.completedEvents) {
      this.elements.completedEvents.textContent = completedEvents;
    }
    
    // Update category stats
    if (this.elements.categoryStats) {
      this.renderCategoryStats();
    }
  }
  
  renderCategoryStats() {
    const categoryCount = {};
    const total = this.events.length;
    
    // Count events by category
    this.events.forEach(event => {
      const category = event.category || 'other';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });
    
    // Clear existing stats
    this.elements.categoryStats.innerHTML = '';
    
    // Render each category
    APP_CONFIG.categories.forEach(category => {
      const count = categoryCount[category] || 0;
      const percentage = total > 0 ? (count / total * 100).toFixed(1) : 0;
      
      const statEl = document.createElement('div');
      statEl.className = 'category-stat';
      
      statEl.innerHTML = `
        <span class="text-caption1">${this.getCategoryLabel(category)}</span>
        <div class="category-bar">
          <div class="category-fill" style="
            width: ${percentage}%;
            background-color: var(--category-${category});
          "></div>
        </div>
        <span class="text-caption1">${count}</span>
      `;
      
      this.elements.categoryStats.appendChild(statEl);
    });
  }
  
  getCategoryLabel(category) {
    const labels = {
      study: '공부',
      daily: '일상',
      entertainment: '놀이',
      other: '기타'
    };
    return labels[category] || category;
  }
  
  // ==============================================
  // Modal Management
  // ==============================================
  openModal(date = null, eventData = null) {
    this.editingEvent = eventData;
    
    // Update modal title
    this.elements.modalTitle.textContent = eventData ? '일정 수정' : '일정 추가';
    
    // Clear or fill form
    if (eventData) {
      this.fillForm(eventData);
    } else {
      this.clearForm();
      if (date) {
        this.elements.eventDate.value = date;
      }
    }
    
    // Show/hide delete button
    const deleteBtn = document.getElementById("modal-delete");
    if (deleteBtn) {
      deleteBtn.style.display = eventData ? "inline-flex" : "none";
    }    // Show modal
    this.elements.modal.classList.add('active');
    this.elements.eventTitle.focus();
  }
  
  closeModal() {
    this.elements.modal.classList.remove('active');
    this.clearForm();
    this.editingEvent = null;
  }
  
  fillForm(eventData) {
    this.elements.eventTitle.value = eventData.title || '';
    this.elements.eventDate.value = eventData.date || eventData.start_date || '';
    this.elements.eventEndDate.value = eventData.end_date || '';
    this.elements.eventStartTime.value = eventData.start_time || '';
    this.elements.eventEndTime.value = eventData.end_time || '';
    this.elements.eventDescription.value = eventData.description || '';
    
    // Set radio buttons
    const categoryRadio = document.querySelector(`input[name="category"][value="${eventData.category || 'other'}"]`);
    if (categoryRadio) categoryRadio.checked = true;
    
    const priorityRadio = document.querySelector(`input[name="priority"][value="${eventData.priority || 'medium'}"]`);
    if (priorityRadio) priorityRadio.checked = true;
  }
  
  clearForm() {
    this.elements.form.reset();
    
    // Set defaults
    document.querySelector('input[name="category"][value="other"]').checked = true;
    document.querySelector('input[name="priority"][value="medium"]').checked = true;
  }
  
  handleSubmit() {
    // Validate form
    if (!this.elements.form.checkValidity()) {
      this.elements.form.reportValidity();
      return;
    }
    
    // Collect form data
    const eventData = {
      title: this.elements.eventTitle.value.trim(),
      date: this.elements.eventDate.value,
      end_date: this.elements.eventEndDate.value || this.elements.eventDate.value,
      start_time: this.elements.eventStartTime.value,
      end_time: this.elements.eventEndTime.value,
      description: this.elements.eventDescription.value.trim(),
      category: document.querySelector('input[name="category"]:checked')?.value || 'other',
      priority: document.querySelector('input[name="priority"]:checked')?.value || 'medium'
    };
    
    // Additional validation
    if (!eventData.title) {
      this.showToast('제목을 입력해주세요', 'error');
      return;
    }
    
    if (!eventData.date) {
      this.showToast('날짜를 선택해주세요', 'error');
      return;
    }
    
    // Save event
    if (this.editingEvent) {
      this.updateEvent(this.editingEvent.id, eventData);
      this.showToast('일정이 수정되었습니다', 'success');
    } else {
      this.addEvent(eventData);
      this.showToast('일정이 추가되었습니다', 'success');
    }
    
    // Update views
    this.renderCalendar();
    if (this.currentSection === 'tasks') {
      this.renderTasks();
    }
    
    // Close modal
    this.closeModal();
  }
  
  // ==============================================
  // Navigation
  // ==============================================
  switchSection(section) {
    this.currentSection = section;
    
    // Hide all sections
    this.hideAllSections();
    
    // Show selected section
    switch (section) {
      case 'calendar':
        this.elements.calendarSection.classList.remove('hidden');
        this.renderCalendar();
        break;
      case 'tasks':
        this.elements.tasksSection.classList.remove('hidden');
        this.renderTasks();
        break;
      case 'stats':
        this.elements.statsSection.classList.remove('hidden');
        this.updateStats();
        break;
      case 'settings':
        this.elements.settingsSection.classList.remove('hidden');
        break;
    }
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', 
        item.getAttribute('data-section') === section);
    });
  }
  
  hideAllSections() {
    this.elements.calendarSection.classList.add('hidden');
    this.elements.timelineSection.classList.add('hidden');
    this.elements.tasksSection.classList.add('hidden');
    this.elements.statsSection.classList.add('hidden');
    this.elements.settingsSection.classList.add('hidden');
  }
  
  // ==============================================
  // Settings Management
  // ==============================================
  handleBackup() {
    const data = {
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      events: this.events
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smart-planner-backup-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    this.showToast('백업 파일이 다운로드되었습니다', 'success');
  }
  
  handleRestore() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (data.events && Array.isArray(data.events)) {
            this.events = data.events;
            this.saveEvents();
            this.renderCalendar();
            this.updateStats();
            this.showToast('데이터가 복원되었습니다', 'success');
          } else {
            throw new Error('Invalid backup file');
          }
        } catch (error) {
          this.showToast('유효하지 않은 백업 파일입니다', 'error');
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  }
  
  handleClearData() {
    if (confirm('모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      this.events = [];
      this.saveEvents();
      this.renderCalendar();
      this.updateStats();
      this.switchSection('calendar');
      this.showToast('모든 데이터가 삭제되었습니다', 'success');
    }
  }
  
  // ==============================================
  // Utilities
  // ==============================================
  showToast(message, type = 'success', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    this.elements.toastContainer.appendChild(toast);
    
    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });
    
    // Remove toast
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
  
  // ==============================================
  // Event Listeners
  // ==============================================
  attachEventListeners() {
    // Calendar navigation
    document.getElementById('prev-month').addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.renderCalendar();
    });
    
    document.getElementById('next-month').addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.renderCalendar();
    });
    
    // Timeline navigation
    document.getElementById('timeline-back').addEventListener('click', () => {
      this.switchSection('calendar');
    });
    
    document.getElementById('timeline-prev').addEventListener('click', () => {
      const date = new Date(this.selectedDate);
      date.setDate(date.getDate() - 1);
      this.showTimeline(this.formatDate(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      ));
    });
    
    document.getElementById('timeline-next').addEventListener('click', () => {
      const date = new Date(this.selectedDate);
      date.setDate(date.getDate() + 1);
      this.showTimeline(this.formatDate(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      ));
    });
    
    // Bottom navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        this.switchSection(item.getAttribute('data-section'));
      });
    });
    
    // Modal controls
    document.getElementById('fab').addEventListener('click', () => {
      this.openModal(this.selectedDate);
    });
    
    document.getElementById('add-task').addEventListener('click', () => {
      this.openModal();
    });
    
    document.getElementById('modal-close').addEventListener('click', () => {
      this.closeModal();
    });
    
    document.getElementById('modal-cancel').addEventListener('click', () => {
      this.closeModal();
    });
    
    document.getElementById('modal-save').addEventListener('click', () => {
      this.handleSubmit();
    });
    
    // Delete button event listener
    document.getElementById('modal-delete').addEventListener('click', () => {
      if (this.editingEvent && confirm('이 일정을 삭제하시겠습니까?')) {
        this.deleteEvent(this.editingEvent.id);
        this.renderCalendar();
        this.renderTasks();
        
        // Also refresh timeline if it's currently visible
        if (!this.elements.timelineSection.classList.contains('hidden') && this.selectedDate) {
          this.renderTimeline(this.selectedDate);
        }
        
        this.closeModal();
      }
    });
    
    // Form submission
    this.elements.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSubmit();
    });
    
    // Modal backdrop click
    this.elements.modal.addEventListener('click', (e) => {
      if (e.target === this.elements.modal) {
        this.closeModal();
      }
    });
    
    // Settings handlers
    document.getElementById('backup-data')?.addEventListener('click', () => {
      this.handleBackup();
    });
    
    document.getElementById('restore-data')?.addEventListener('click', () => {
      this.handleRestore();
    });
    
    document.getElementById('clear-data')?.addEventListener('click', () => {
      this.handleClearData();
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // ESC to close modal
      if (e.key === 'Escape' && this.elements.modal.classList.contains('active')) {
        this.closeModal();
      }
      
      // Ctrl/Cmd + N for new event
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        this.openModal();
      }
    });
  }
  // ==============================================
  // LLM Analysis Methods
  // ==============================================
  async analyzeTasksWithChatGPT(events, monthKey) {
    if (!events || events.length === 0) {
      return "이번 달에는 등록된 일정이 없습니다.";
    }

    // Prepare task data for analysis
    const taskSummary = events.map(event => {
      const date = new Date(event.date || event.start_date);
      const timeInfo = event.start_time ? 
        `${event.start_time.substring(0, 5)}` : 
        "종일";
      const categoryNames = {
        "study": "공부",
        "daily": "일상",
        "entertainment": "놀이",
        "other": "기타"
      };
      return `${date.getDate()}일 ${timeInfo} - ${event.title} (${categoryNames[event.category] || event.category})`;
    }).join("\n");

    const prompt = `다음은 ${monthKey}의 일정 목록입니다. 학습 전략 분석 전문가로서 다음 일정의 효과성을 평가하고 전략적 개선안을 5문장 이내로 제공해주세요:

${taskSummary}

출력 형식:
📋 진단 (2-3문장): 시간 배분 비율(%), 효율성 점수(1-10점), 현재 계획의 문제점 분석
🎯 행동 제안 (2-3문장): 구체적 시간 조정안(분/시간), 우선순위 변경, 목표 수치가 포함된 실행 계획


반드시 📋 진단과 🎯 행동 제안 섹션으로 구분하여 작성하고, 각 섹션에 구체적인 숫자를 포함하세요. 각 문장 사이에 줄바꿈을 넣고 가독성을 높여주세요.`;

    try {
      const response = await fetch("/api/config");
      const config = await response.json();
      
      if (!config.openaiApiKey || config.openaiApiKey === "your-api-key-here") {
        return "ChatGPT 분석을 위해 OpenAI API 키를 설정해주세요.";
      }

      const chatResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.openaiApiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "당신은 데이터 기반 학습 전략 분석가입니다. 응답을 📋 진단과 🎯 행동 제안 두 섹션으로 명확히 구분하여 작성하세요. 각 섹션에 구체적인 숫자와 데이터를 포함하세요."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 400,
          temperature: 0.7
        })
      });

      if (!chatResponse.ok) {
        throw new Error(`ChatGPT API Error: ${chatResponse.status}`);
      }

      const data = await chatResponse.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error("ChatGPT Analysis Error:", error);
      return "분석을 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
    }
  }

  createAnalysisPanel(monthKey, events) {
    const panel = document.createElement("div");
    panel.className = "analysis-panel";
    
    // Create panel structure strictly following design system
    panel.innerHTML = `
      <div class="analysis-header">
        <div class="analysis-header-content">
          <div class="analysis-icon-container">
            <svg class="analysis-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </div>
          <div class="analysis-text-content">
            <h3 class="analysis-title">${monthKey} AI 분석</h3>
            <p class="analysis-subtitle">ChatGPT 일정 분석</p>
          </div>
        </div>
        <button class="analysis-refresh-btn" type="button" aria-label="분석 새로고침">
          <svg class="refresh-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
            <path d="M21 3v5h-5"></path>
            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
            <path d="M3 21v-5h5"></path>
          </svg>
        </button>
      </div>
      <div class="analysis-body">
        <div class="analysis-initial-state">
          <p class="analysis-prompt-text">새로고침 버튼을 클릭하여 AI 분석을 시작하세요.</p>
        </div>
      </div>
    `;

    // Add click handler for refresh button
    const refreshBtn = panel.querySelector(".analysis-refresh-btn");
    refreshBtn.addEventListener("click", () => {
      this.runAnalysis(panel, events, monthKey);
    });

    return panel;
  }

  runAnalysis(panel, events, monthKey) {
    const bodyElement = panel.querySelector(".analysis-body");
    const refreshBtn = panel.querySelector(".analysis-refresh-btn");
    
    // Show loading state
    bodyElement.innerHTML = `
      <div class="analysis-loading-state">
        <div class="loading-spinner"></div>
        <span class="loading-message">AI가 일정을 분석하고 있습니다...</span>
      </div>
    `;
    
    // Disable refresh button during analysis
    refreshBtn.disabled = true;
    refreshBtn.classList.add("disabled");

    // Load analysis asynchronously
    this.analyzeTasksWithChatGPT(events, monthKey).then(analysis => {
      bodyElement.innerHTML = `
        <div class="analysis-result">
          <p class="analysis-result-text">${analysis.replace(/\n/g, "<br>")}</p>
        </div>
      `;
    }).catch(error => {
      bodyElement.innerHTML = `
        <div class="analysis-error-state">
          <p class="analysis-error-message">분석을 불러올 수 없습니다. API 설정을 확인해주세요.</p>
        </div>
      `;
    }).finally(() => {
      // Re-enable refresh button
      refreshBtn.disabled = false;
      refreshBtn.classList.remove("disabled");
    });
  }}

// ==============================================
// Initialize Application
// ==============================================
document.addEventListener('DOMContentLoaded', () => {
  window.smartPlanner = new SmartPlannerApp();
});