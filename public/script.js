// ==============================================
// Time Tracker with Minute-Based Timeline
// ==============================================

class TimeTracker {
  constructor() {
    this.isRecording = false;
    this.currentStartTime = null;
    this.currentHour = null;
    this.timeData = {}; // Store time data for each hour: { hour: [minute0, minute1, ...minute59] }
    this.totalTime = 0;
    this.currentSessionTime = 0;
    this.updateInterval = null;
    this.timelineOrder = this.generateTimelineOrder();
    this.draggedElement = null;
    this.scrollTimer = null;
    this.timeUpdateInterval = null;
    this.currentTaskName = ""; // Stores the name of the current task being recorded
    this.currentTaskTags = []; // Stores the tags for the current task
    this.taskSessions = {}; // Stores task names for recorded minutes: { hour: { minute: taskName } }
    this.taskTagSessions = {}; // Stores task tags for recorded minutes: { hour: { minute: [tags] } }
    
    // Tag color mapping
    this.tagColors = {
      '공부': '#3B82F6', // Blue
      '휴식': '#10B981', // Green
      '식사': '#F59E0B', // Amber
      '이동': '#8B5CF6', // Purple
      // Default colors for custom tags
      'default': ['#EF4444', '#F97316', '#84CC16', '#06B6D4', '#6366F1', '#A855F7', '#EC4899', '#14B8A6', '#F97316', '#6B7280']
    };
    this.customTagColorIndex = 0;
    
    this.elements = {
      recordButton: document.getElementById('record-button'),
      statusDot: document.querySelector('.status-dot'),
      statusText: document.getElementById('status-text'),
      currentTime: document.getElementById('current-time'),
      totalTime: document.getElementById('total-time'),
      timeline: document.getElementById('timeline'),
      currentTaskNameDisplay: document.getElementById('current-task-name'),
      taskNameModal: document.getElementById('task-name-modal'),
      taskNameInput: document.getElementById('task-name-input'),
      taskSuggestionsContainer: document.getElementById('task-suggestions'),
      taskCancelBtn: document.getElementById('task-cancel-btn'),
      taskConfirmBtn: document.getElementById('task-confirm-btn'),
      customTagInput: document.getElementById('custom-tag-input'),
      addCustomTagBtn: document.getElementById('add-custom-tag'),
      selectedTagsContainer: document.getElementById('selected-tags')
    };
    
    this.init();
  }
  
  init() {
    this.generateTimeline();
    this.initializeEventListeners();
    this.setupScrollbarAutoHide();
    this.updateDisplay();
    this.loadData();
    this.startTimeUpdateTimer();
    this.initializeCurrentHourProgress();
    this.updateTaskLabels(); // Initial render of task labels
  }
  
  generateTimeline() {
    const timeline = this.elements.timeline;
    timeline.innerHTML = '';
    
    this.timelineOrder.forEach(hour => {
      const timelineItem = document.createElement('div');
      timelineItem.className = 'timeline-item';
      timelineItem.dataset.hour = hour;
      timelineItem.draggable = true;
      
      const timeString = this.formatHour(hour);
      
      // Create 60 minute blocks
      const minuteBlocks = [];
      for (let minute = 0; minute < 60; minute++) {
        minuteBlocks.push(`<div class="minute-block" data-minute="${minute}"></div>`);
      }
      
      timelineItem.innerHTML = `
        <div class="timeline-time">${timeString}</div>
        <div class="timeline-content">
          <div class="timeline-duration" id="duration-${hour}">00:00:00</div>
          <div class="progress-container">
            <div class="minute-grid" id="minutes-${hour}">
              ${minuteBlocks.join('')}
            </div>
          </div>
        </div>
      `;
      
      this.addDragListeners(timelineItem);
      timeline.appendChild(timelineItem);
    });
  }

  addDragListeners(item) {
    item.addEventListener('dragstart', (e) => {
      this.draggedElement = item;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', item.outerHTML);
    });

    item.addEventListener('dragend', (e) => {
      item.classList.remove('dragging');
      this.draggedElement = null;
      document.querySelectorAll('.timeline-item').forEach(el => {
        el.classList.remove('drag-over');
      });
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });

    item.addEventListener('dragenter', (e) => {
      e.preventDefault();
      if (item !== this.draggedElement) {
        item.classList.add('drag-over');
      }
    });

    item.addEventListener('dragleave', (e) => {
      if (!item.contains(e.relatedTarget)) {
        item.classList.remove('drag-over');
      }
    });

    item.addEventListener('drop', (e) => {
      e.preventDefault();
      item.classList.remove('drag-over');
      
      if (this.draggedElement && item !== this.draggedElement) {
        const draggedHour = parseInt(this.draggedElement.dataset.hour);
        const targetHour = parseInt(item.dataset.hour);
        this.reorderTimeline(draggedHour, targetHour);
      }
    });
  }

  reorderTimeline(draggedHour, targetHour) {
    const draggedIndex = this.timelineOrder.indexOf(draggedHour);
    const targetIndex = this.timelineOrder.indexOf(targetHour);
    
    this.timelineOrder.splice(draggedIndex, 1);
    const newTargetIndex = targetIndex > draggedIndex ? targetIndex : targetIndex + 1;
    this.timelineOrder.splice(newTargetIndex, 0, draggedHour);
    
    this.generateTimeline();
    this.updateDisplay();
    this.saveData();
  }

  generateTimelineOrder() {
    const currentHour = this.getCurrentHour();
    const order = [];
    
    for (let i = currentHour; i < 24; i++) {
      order.push(i);
    }
    
    for (let i = 0; i < currentHour; i++) {
      order.push(i);
    }
    
    return order;
  }
  
  updateTimelineOrder() {
    const newOrder = this.generateTimelineOrder();
    
    if (JSON.stringify(newOrder) !== JSON.stringify(this.timelineOrder)) {
      this.timelineOrder = newOrder;
      this.generateTimeline();
      this.initializeCurrentHourProgress();
      this.updateDisplay();
      this.saveData();
    }
  }
  
  startTimeUpdateTimer() {
    this.timeUpdateInterval = setInterval(() => {
      this.updateTimelineOrder();
    }, 60000);
  }
  
  stopTimeUpdateTimer() {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
  }

  getCurrentHour() {
    return new Date().getHours();
  }
  
  getCurrentMinute() {
    return new Date().getMinutes();
  }
  
  getCurrentTimeInfo() {
    const now = new Date();
    return {
      hour: now.getHours(),
      minute: now.getMinutes(),
      second: now.getSeconds(),
      millisecond: now.getMilliseconds()
    };
  }

  initializeCurrentHourProgress() {
    const currentHour = this.getCurrentHour();
    
    // Initialize hour data as array of 60 minutes if not exists
    if (!this.timeData[currentHour]) {
      this.timeData[currentHour] = new Array(60).fill(0);
    }
    
    console.log(`⏰ Initialized hour ${currentHour} with minute-based tracking`);
  }

  setupScrollbarAutoHide() {
    const timeline = this.elements.timeline;
    
    timeline.addEventListener('scroll', (e) => {
      if (this.draggedElement) return;
      
      timeline.classList.add('scrolling');
      
      if (this.scrollTimer) {
        clearTimeout(this.scrollTimer);
      }
      
      this.scrollTimer = setTimeout(() => {
        timeline.classList.remove('scrolling');
      }, 1500);
    });
    
    timeline.addEventListener('mouseenter', () => {
      timeline.classList.add('scrolling');
    });
    
    timeline.addEventListener('mouseleave', () => {
      if (this.scrollTimer) {
        clearTimeout(this.scrollTimer);
      }
      this.scrollTimer = setTimeout(() => {
        timeline.classList.remove('scrolling');
      }, 500);
    });
  }
  
  formatHour(hour) {
    return hour.toString().padStart(2, '0') + ':00';
  }
  
  formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  initializeEventListeners() {
    this.elements.recordButton.addEventListener('click', () => {
      if (this.isRecording) {
        this.stopRecording();
      } else {
        this.showTaskModal(); // Show modal before starting recording
      }
    });

    this.elements.taskCancelBtn.addEventListener('click', () => {
      this.currentTaskTags = []; // Clear tags when cancelling
      this.hideTaskModal();
    });

    this.elements.taskConfirmBtn.addEventListener('click', () => {
      this.startRecordingWithTask();
    });

    this.elements.taskNameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.startRecordingWithTask();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.hideTaskModal();
      }
    });

    this.elements.taskNameModal.addEventListener('click', (e) => {
      if (e.target === this.elements.taskNameModal) {
        this.hideTaskModal();
      }
    });

    // Tag functionality event listeners
    this.elements.addCustomTagBtn.addEventListener('click', () => {
      this.addCustomTag();
    });

    this.elements.customTagInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.addCustomTag();
      }
    });

    // Predefined tag buttons
    document.querySelectorAll('.tag-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tag = e.target.dataset.tag;
        this.togglePredefinedTag(tag, e.target);
      });
    });
    
    window.addEventListener('beforeunload', () => {
      this.stopTimeUpdateTimer();
      this.saveData();
    });
    
    setInterval(() => {
      this.saveData();
    }, 30000);
  }

    showTaskModal() {
    this.elements.taskNameModal.classList.add('visible');
    this.elements.taskNameInput.value = '';
    this.currentTaskTags = [];
    this.updateSelectedTags();
    this.resetPredefinedTags();
    this.elements.taskNameInput.focus();
    
    // Show all task history when modal opens
    this.updateTaskSuggestions('');
    
    // Add event listeners for task suggestions
    this.setupTaskInputListeners();
  }

  setupTaskInputListeners() {
    const input = this.elements.taskNameInput;
    const suggestionsContainer = document.getElementById('task-suggestions');
    
    if (!input || !suggestionsContainer) return;
    
    // Input event for showing suggestions
    input.addEventListener('input', (e) => {
      this.updateTaskSuggestions(e.target.value);
    });
    
    // Click outside to hide suggestions
    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !suggestionsContainer.contains(e.target)) {
        this.hideTaskSuggestions();
      }
    });
    
    // Click on suggestions
    suggestionsContainer.addEventListener('click', (e) => {
      const suggestionItem = e.target.closest('.task-suggestion-item');
      if (suggestionItem) {
        const taskName = suggestionItem.dataset.task;
        this.selectTaskSuggestion(taskName);
      }
    });
    
    // Keyboard navigation
    input.addEventListener('keydown', (e) => {
      const suggestions = suggestionsContainer.querySelectorAll('.task-suggestion-item');
      const selected = suggestionsContainer.querySelector('.task-suggestion-item.selected');
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (selected) {
          const next = selected.nextElementSibling;
          if (next) {
            selected.classList.remove('selected');
            next.classList.add('selected');
          }
        } else if (suggestions.length > 0) {
          suggestions[0].classList.add('selected');
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (selected) {
          const prev = selected.previousElementSibling;
          if (prev) {
            selected.classList.remove('selected');
            prev.classList.add('selected');
          }
        }
      } else if (e.key === 'Enter' && selected) {
        e.preventDefault();
        const taskName = selected.dataset.task;
        this.selectTaskSuggestion(taskName);
      } else if (e.key === 'Escape') {
        this.hideTaskSuggestions();
      }
    });
  }

  hideTaskModal() {
    this.elements.taskNameModal.classList.remove('visible');
    // Don't clear currentTaskTags here - they need to be preserved for the recording session
    // currentTaskTags will be cleared when recording stops
  }

  togglePredefinedTag(tag, buttonElement) {
    // For single selection, first clear all other predefined tags
    document.querySelectorAll('.tag-btn').forEach(btn => {
      btn.classList.remove('selected');
    });
    
    // Remove all predefined tags from current selection
    this.currentTaskTags = this.currentTaskTags.filter(t => 
      !['공부', '휴식', '식사', '이동'].includes(t)
    );

    if (this.currentTaskTags.includes(tag)) {
      // If clicking the same tag, just remove it (deselect)
      this.currentTaskTags = this.currentTaskTags.filter(t => t !== tag);
      console.log(`🏷️ Removed tag "${tag}". Current tags:`, this.currentTaskTags);
    } else {
      // Add the new tag
      this.currentTaskTags.push(tag);
      buttonElement.classList.add('selected');
      console.log(`🏷️ Added tag "${tag}". Current tags:`, this.currentTaskTags);
    }
    
    this.updateSelectedTags();
  }

  addCustomTag() {
    const tagText = this.elements.customTagInput.value.trim();
    
    if (!tagText) return;
    
    // Count only custom tags (not predefined categories)
    const customTagCount = this.currentTaskTags.filter(t => 
      !['공부', '휴식', '식사', '이동'].includes(t)
    ).length;
    
    if (customTagCount >= 9) { // 9 custom tags + 1 category = 10 total
      alert('최대 9개의 커스텀 태그만 추가할 수 있습니다.');
      return;
    }
    
    if (this.currentTaskTags.includes(tagText)) {
      alert('이미 선택된 태그입니다.');
      return;
    }
    
    // Check if it's a predefined category name
    if (['공부', '휴식', '식사', '이동'].includes(tagText)) {
      alert('미리 정의된 카테고리 이름은 사용할 수 없습니다.');
      return;
    }
    
    this.currentTaskTags.push(tagText);
    this.elements.customTagInput.value = '';
    this.updateSelectedTags();
  }

  removeTag(tag) {
    this.currentTaskTags = this.currentTaskTags.filter(t => t !== tag);
    this.updateSelectedTags();
    
    // Update predefined tag button if it exists
    const predefinedBtn = document.querySelector(`[data-tag="${tag}"]`);
    if (predefinedBtn) {
      predefinedBtn.classList.remove('selected');
    }
  }

  updateSelectedTags() {
    const container = this.elements.selectedTagsContainer;
    
    // Handle case where selected tags container doesn't exist (removed from HTML)
    if (!container) {
      console.log('🏷️ Selected tags container not found, skipping visual update');
      return;
    }
    
    container.innerHTML = '';
    
    this.currentTaskTags.forEach(tag => {
      const tagElement = document.createElement('div');
      tagElement.className = 'selected-tag';
      const tagColor = this.getTagColor(tag);
      tagElement.style.backgroundColor = tagColor;
      tagElement.innerHTML = `
        <span>${tag}</span>
        <button class="remove-tag" onclick="timeTracker.removeTag('${tag}')">&times;</button>
      `;
      container.appendChild(tagElement);
    });
    
    // Update add button state - disable if we have 9 custom tags (plus potentially 1 category)
    const customTagCount = this.currentTaskTags.filter(t => 
      !['공부', '휴식', '식사', '이동'].includes(t)
    ).length;
    if (this.elements.addCustomTagBtn) {
      this.elements.addCustomTagBtn.disabled = customTagCount >= 9;
    }
  }

  resetPredefinedTags() {
    document.querySelectorAll('.tag-btn').forEach(btn => {
      btn.classList.remove('selected');
    });
  }

  getTagColor(tag) {
    // Check if it's a predefined tag
    if (this.tagColors[tag]) {
      return this.tagColors[tag];
    }
    
    // For custom tags, assign a color from the default palette
    const defaultColors = this.tagColors.default;
    const colorIndex = this.customTagColorIndex % defaultColors.length;
    this.customTagColorIndex++;
    return defaultColors[colorIndex];
  }

  getTagsGradient(tags) {
    if (!tags || tags.length === 0) {
      return '#ED5000'; // Default orange color as hex
    }
    
    if (tags.length === 1) {
      return this.getTagColor(tags[0]);
    }
    
    // Create gradient for multiple tags
    const colors = tags.map(tag => this.getTagColor(tag));
    const step = 100 / colors.length;
    let gradientStops = [];
    
    colors.forEach((color, index) => {
      const start = index * step;
      const end = (index + 1) * step;
      gradientStops.push(`${color} ${start}%`);
      gradientStops.push(`${color} ${end}%`);
    });
    
    return `linear-gradient(to right, ${gradientStops.join(', ')})`;
  }

  extractFirstColor(gradient) {
    // Extract the first color from a gradient string
    if (gradient.includes('linear-gradient')) {
      const match = gradient.match(/#[0-9A-Fa-f]{6}|rgb\([^)]+\)|var\([^)]+\)/);
      return match ? match[0] : '#ED5000';
    }
    return gradient;
  }

  startRecordingWithTask() {
    const taskName = this.elements.taskNameInput.value.trim();
    if (taskName) {
      this.currentTaskName = taskName;
      
      // Add to task history
      this.addToTaskHistory(taskName);
      
      // Debug: Log current task tags when starting recording
      console.log('🏷️ Starting recording with task:', {
        taskName: this.currentTaskName,
        currentTaskTags: this.currentTaskTags,
        tagsLength: this.currentTaskTags.length
      });
      
      this.hideTaskModal();
      
      // Debug: Check tags after hiding modal
      console.log('🔍 Tags after hideTaskModal:', this.currentTaskTags);
      
      this.startRecording();
    } else {
      alert('작업 이름을 입력해주세요!'); // Simple alert for now
    }
  }
  
  toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.showTaskModal();
    }
  }
  
  startRecording() {
    const timeInfo = this.getCurrentTimeInfo();
    
    // Debug: Check tags at the very start of startRecording
    console.log('🔍 Tags at start of startRecording:', this.currentTaskTags);
    
    this.isRecording = true;
    this.currentStartTime = Date.now();
    this.currentHour = timeInfo.hour;
    this.currentStartMinute = timeInfo.minute;
    
    // Debug: Check tags after setting recording state
    console.log('🔍 Tags after setting recording state:', this.currentTaskTags);
    
    // Initialize current hour data
    this.initializeCurrentHourProgress();
    
    // Debug: Check tags after initializeCurrentHourProgress
    console.log('🔍 Tags after initializeCurrentHourProgress:', this.currentTaskTags);
    
    // Update UI
    this.elements.recordButton.classList.add('recording');
    this.elements.recordButton.innerHTML = `<svg class="record-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="6" y="6" width="12" height="12"></rect></svg>정지`;
    if (this.elements.statusDot) this.elements.statusDot.classList.add('recording');
    if (this.elements.statusText) this.elements.statusText.textContent = '기록 중';
    this.elements.currentTaskNameDisplay.textContent = this.currentTaskName;
    this.elements.currentTaskNameDisplay.classList.add('recording');
    
    // Debug: Check tags after UI updates
    console.log('🔍 Tags after UI updates:', this.currentTaskTags);
    
    // Reset debug flag
    this.loggedTagsOnce = false;
    
    // Start update interval
    this.updateInterval = setInterval(() => {
      this.updateCurrentSession();
    }, 100);
    
    this.updateDisplay();
    
    console.log(`🎯 Recording started at ${timeInfo.hour}:${timeInfo.minute.toString().padStart(2, '0')}`);
  }
  
  stopRecording() {
    if (!this.isRecording) return;
    
    const endTime = Date.now();
    const sessionTime = endTime - this.currentStartTime;
    
    // Store task name and tags for each minute recorded in this session
    const startMinute = this.currentStartMinute;
    const endMinute = new Date(endTime).getMinutes();
    const currentHour = this.currentHour;

    if (!this.taskSessions[currentHour]) {
      this.taskSessions[currentHour] = {};
    }
    if (!this.taskTagSessions[currentHour]) {
      this.taskTagSessions[currentHour] = {};
    }

    for (let m = startMinute; m <= endMinute; m++) {
      this.taskSessions[currentHour][m] = this.currentTaskName;
      this.taskTagSessions[currentHour][m] = [...this.currentTaskTags];
      
      // Debug: Log what's being saved
      console.log(`💾 Saving for minute ${m}:`, {
        taskName: this.currentTaskName,
        tags: [...this.currentTaskTags],
        hour: currentHour
      });
    }
    
    // Add session time to total
    this.totalTime += sessionTime;
    
    // Distribute session time across minutes
    this.distributeSessionTime(sessionTime);
    
    // Reset recording state
    this.isRecording = false;
    this.currentStartTime = null;
    this.currentSessionTime = 0;
    this.currentStartMinute = null;
    
    // Clear update interval
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    // Update UI
    this.elements.recordButton.classList.remove('recording');
    this.elements.recordButton.innerHTML = `<svg class="record-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><polygon points="10,8 16,12 10,16 10,8"></polygon></svg>시작`;
    if (this.elements.statusDot) this.elements.statusDot.classList.remove('recording');
    if (this.elements.statusText) this.elements.statusText.textContent = '대기 중';
    this.elements.currentTime.textContent = '00:00:00';
    this.elements.currentTaskNameDisplay.textContent = '작업을 시작하세요';
    this.elements.currentTaskNameDisplay.classList.remove('recording');
    this.currentTaskName = '';
    this.currentTaskTags = [];
    
    this.updateDisplay();
    this.updateTaskLabels(); // Update labels after stopping
    this.saveData();
    
    console.log(`⏹️ Recording stopped - session time: ${this.formatTime(sessionTime)}`);
  }

  updateTaskLabels() {
    this.timelineOrder.forEach(hour => {
      const hourTaskSessions = this.taskSessions[hour] || {};
      const minuteGrid = document.getElementById(`minutes-${hour}`);
      
      if (minuteGrid) {
        const minuteBlocks = minuteGrid.querySelectorAll('.minute-block');
        
        minuteBlocks.forEach((block, minute) => {
          const taskName = hourTaskSessions[minute];
          const taskTags = (this.taskTagSessions[hour] && this.taskTagSessions[hour][minute]) || [];
          
          // Remove existing click listeners
          block.replaceWith(block.cloneNode(true));
          const newBlock = minuteGrid.children[minute];
          
          if (taskName) {
            // Add click listener to show tooltip
            newBlock.addEventListener('click', (e) => {
              e.stopPropagation();
              this.showTaskTooltip(e, taskName, taskTags, hour, minute);
            });
            
            // Add cursor pointer for clickable indication
            newBlock.style.cursor = 'pointer';
            
            // Store task name as data attribute for reference
            newBlock.dataset.taskName = taskName;
          } else {
            newBlock.style.cursor = 'default';
            delete newBlock.dataset.taskName;
          }
        });
      }
    });
  }

  showTaskTooltip(event, taskName, taskTags, hour, minute) {
    // Remove any existing tooltip
    this.hideTaskTooltip();
    
    const tooltip = document.createElement('div');
    tooltip.className = 'task-tooltip';
    tooltip.id = 'active-task-tooltip';
    
    // Create tooltip content with task name and tags
    let tooltipContent = `<div class="tooltip-task-name">${taskName}</div>`;
    if (taskTags && taskTags.length > 0) {
      tooltipContent += `<div class="tooltip-tags">`;
      taskTags.forEach(tag => {
        const tagColor = this.getTagColor(tag);
        tooltipContent += `<span class="tooltip-tag" style="background-color: ${tagColor};">${tag}</span>`;
      });
      tooltipContent += `</div>`;
    }
    
    tooltip.innerHTML = tooltipContent;
    
    // Position tooltip near the clicked element
    const rect = event.target.getBoundingClientRect();
    tooltip.style.position = 'fixed';
    tooltip.style.left = rect.left + 'px';
    tooltip.style.top = (rect.top - 35) + 'px';
    tooltip.style.zIndex = '1001';
    
    document.body.appendChild(tooltip);
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.hideTaskTooltip();
    }, 3000);
    
    // Hide on click outside
    document.addEventListener('click', this.hideTaskTooltipHandler);
  }

  hideTaskTooltip() {
    const existingTooltip = document.getElementById('active-task-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }
    document.removeEventListener('click', this.hideTaskTooltipHandler);
  }

  hideTaskTooltipHandler = () => {
    this.hideTaskTooltip();
  }
  
  distributeSessionTime(sessionTime) {
    const startTime = this.currentStartTime;
    const endTime = startTime + sessionTime;
    
    let currentTime = startTime;
    
    while (currentTime < endTime) {
      const date = new Date(currentTime);
      const hour = date.getHours();
      const minute = date.getMinutes();
      
      // Calculate time remaining in current minute
      const nextMinute = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute + 1, 0, 0);
      const timeInThisMinute = Math.min(nextMinute.getTime() - currentTime, endTime - currentTime);
      
      // Initialize hour data if needed
      if (!this.timeData[hour]) {
        this.timeData[hour] = new Array(60).fill(0);
      }
      
      // Add time to this minute
      this.timeData[hour][minute] += timeInThisMinute;
      
      currentTime = nextMinute.getTime();
    }
  }
  
  updateCurrentSession() {
    if (!this.isRecording) return;
    
    const now = Date.now();
    this.currentSessionTime = now - this.currentStartTime;
    
    // Debug: Check if tags are still there during session update (only log once per session)
    if (!this.loggedTagsOnce) {
      console.log('🔍 Tags during updateCurrentSession:', this.currentTaskTags);
      this.loggedTagsOnce = true;
    }
    
    // Check if hour has changed
    const currentHour = this.getCurrentHour();
    if (currentHour !== this.currentHour) {
      // Distribute current session time and start fresh
      this.distributeSessionTime(this.currentSessionTime);
      this.totalTime += this.currentSessionTime;
      
      // Start new session for new hour
      this.currentHour = currentHour;
      this.currentStartTime = now;
      this.currentSessionTime = 0;
      this.currentStartMinute = this.getCurrentMinute();
      
      this.initializeCurrentHourProgress();
    }
    
    this.updateDisplay();
  }
  
  updateDisplay() {
    // Update current session time
    this.elements.currentTime.textContent = this.formatTime(this.currentSessionTime);
    
    // Update total time
    this.elements.totalTime.textContent = this.formatTime(this.totalTime);
    
    // Update timeline items
    this.timelineOrder.forEach(hour => {
      const hourData = this.timeData[hour] || new Array(60).fill(0);
      const totalDuration = hourData.reduce((sum, minuteTime) => sum + minuteTime, 0);
      
      // Update duration display
      const durationElement = document.getElementById(`duration-${hour}`);
      if (durationElement) {
        let displayDuration = totalDuration;
        
        // Add current session time if recording and this is the current hour
        if (this.isRecording && hour === this.currentHour) {
          displayDuration += this.currentSessionTime;
        }
        
        durationElement.textContent = this.formatTime(displayDuration);
      }
      
      // Update minute blocks
      const minuteGrid = document.getElementById(`minutes-${hour}`);
      if (minuteGrid) {
        const minuteBlocks = minuteGrid.querySelectorAll('.minute-block');
        
        minuteBlocks.forEach((block, minute) => {
          const minuteTime = hourData[minute] || 0;
          let displayTime = minuteTime;
          
          // Get tag information for this minute
          const minuteTags = (this.taskTagSessions[hour] && this.taskTagSessions[hour][minute]) || [];
          let tagColor = '#ED5000'; // Default orange color
          

          
          // Add current session contribution if recording
          if (this.isRecording && hour === this.currentHour) {
            const currentMinute = this.getCurrentMinute();
            if (minute === currentMinute) {
              // Add partial current session time for current minute
              const sessionInCurrentMinute = this.currentSessionTime % 60000; // Time in current minute
              displayTime += sessionInCurrentMinute;
              // Use current session tags for color
              tagColor = this.getTagsGradient(this.currentTaskTags);
              console.log(`Current minute ${minute} - tags:`, this.currentTaskTags, `Color:`, tagColor);
            } else if (minute > this.currentStartMinute && minute < currentMinute) {
              // Full minutes between start and current
              displayTime += 60000; // Full minute
              // Use current session tags for color
              tagColor = this.getTagsGradient(this.currentTaskTags);
              console.log(`Past minute ${minute} - tags:`, this.currentTaskTags, `Color:`, tagColor);
            } else if (minuteTags.length > 0) {
              // Use stored tags for color
              tagColor = this.getTagsGradient(minuteTags);
            }
          } else if (minuteTags.length > 0) {
            // Use stored tags for color
            tagColor = this.getTagsGradient(minuteTags);
          }
          
          // Calculate fill percentage (0-100% per minute)
          const fillPercentage = Math.min((displayTime / 60000) * 100, 100);
          
          // Update block appearance
          if (fillPercentage > 0) {
            block.style.background = `linear-gradient(to right, ${tagColor} ${fillPercentage}%, var(--neutral-80) ${fillPercentage}%)`;
            // Extract first color for border (for gradients, use the first color)
            const borderColor = tagColor.includes('linear-gradient') ? this.extractFirstColor(tagColor) : tagColor;
            block.style.borderColor = fillPercentage > 50 ? borderColor : "var(--neutral-80)";
            block.classList.add('has-time');
          } else {
            block.style.background = 'var(--neutral-80)';
            block.style.borderColor = "var(--neutral-80)";
            block.classList.remove('has-time');
          }
          
          // Highlight current minute if recording
          if (this.isRecording && hour === this.currentHour && minute === this.getCurrentMinute()) {
            block.classList.add('current-minute');
          } else {
            block.classList.remove('current-minute');
          }
        });
      }
      
      // Highlight current hour if recording
      const timelineItem = document.querySelector(`[data-hour="${hour}"]`);
      if (timelineItem) {
        if (this.isRecording && hour === this.currentHour) {
          timelineItem.classList.add('active');
        } else {
          timelineItem.classList.remove('active');
        }
      }
    });
  }
  
  saveData() {
    const data = {
      timeData: this.timeData,
      totalTime: this.totalTime,
      timelineOrder: this.timelineOrder,
      taskSessions: this.taskSessions, // Save task sessions
      taskTagSessions: this.taskTagSessions, // Save task tag sessions
      taskHistory: this.taskHistory, // Save task history
      lastSaved: Date.now()
    };
    localStorage.setItem('timeTracker', JSON.stringify(data));
  }
  
  loadData() {
    const saved = localStorage.getItem('timeTracker');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        
        const lastSaved = new Date(data.lastSaved);
        const today = new Date();
        
        if (lastSaved.toDateString() === today.toDateString()) {
          this.timeData = data.timeData || {};
          this.totalTime = data.totalTime || 0;
          this.timelineOrder = this.generateTimelineOrder();
          this.taskSessions = data.taskSessions || {}; // Load task sessions
          this.taskHistory = data.taskHistory || []; // Load task history          this.taskTagSessions = data.taskTagSessions || {}; // Load task tag sessions
          this.updateDisplay();
          this.updateTaskLabels(); // Update labels after loading
        } else {
          this.resetData();
        }
      } catch (e) {
        console.error('Error loading saved data:', e);
        this.resetData();
      }
    }
  }
  
  resetData() {
    this.timeData = {};
    this.totalTime = 0;
    this.timelineOrder = this.generateTimelineOrder();
    this.taskSessions = {}; // Clear task sessions
    this.taskTagSessions = {}; // Clear task tag sessions
    this.currentTaskName = "";
    this.currentTaskTags = [];
    this.elements.currentTaskNameDisplay.textContent = "작업을 시작하세요";
    this.elements.currentTaskNameDisplay.classList.remove("recording");
    this.updateDisplay();
    this.updateTaskLabels(); // Clear task labels from display
    this.saveData();
    console.log('🔄 All data reset - minute blocks cleared');
  }
  
  resetAllData() {
    if (this.isRecording) {
      this.stopRecording();
    }
    
    this.resetData();
    console.log('✅ All minute blocks have been reset to empty');
  }
  // ==============================================
  // Task History Methods
  // ==============================================

  addToTaskHistory(taskName) {
    if (!taskName || taskName.trim() === "") return;
    
    // Remove if already exists to move to top
    this.taskHistory = this.taskHistory.filter(item => item.name !== taskName);
    this.taskHistory.unshift({ name: taskName, count: 1 });
    
    // Keep only the last 20 items
    this.taskHistory = this.taskHistory.slice(0, 20);
    this.saveData();
  }

  showTaskSuggestions(query) {
    const suggestionsContainer = this.elements.taskSuggestionsContainer;
    if (!suggestionsContainer) {
      console.log('❌ Task suggestions container not found');
      return;
    }

    console.log('📝 Showing task suggestions for query:', query);
    console.log('📚 Task history:', this.taskHistory);

    suggestionsContainer.innerHTML = "";
    const filteredSuggestions = this.taskHistory.filter(item =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );

    if (filteredSuggestions.length > 0) {
      suggestionsContainer.style.display = "block";
      filteredSuggestions.forEach((item, index) => {
        const suggestionElement = document.createElement("div");
        suggestionElement.className = "task-suggestion-item";
        suggestionElement.textContent = item.name;
        suggestionElement.setAttribute("data-task-name", item.name);
        suggestionElement.addEventListener("click", () => this.selectSuggestion(item.name));
        suggestionsContainer.appendChild(suggestionElement);
      });
    } else {
      suggestionsContainer.style.display = "none";
    }
  }

  hideTaskSuggestions() {
    const suggestionsContainer = this.elements.taskSuggestionsContainer;
    if (suggestionsContainer) {
      suggestionsContainer.style.display = "none";
    }
  }

  selectSuggestion(taskName) {
    this.elements.taskNameInput.value = taskName;
    this.hideTaskSuggestions();
    this.elements.taskNameInput.focus();
  }

  updateTaskSuggestions(query) {
    this.showTaskSuggestions(query);
  }
}

// ==============================================
// Analytics System
// ==============================================

class AnalyticsManager {
  constructor(timeTracker) {
    this.timeTracker = timeTracker;
    this.currentPeriod = '24h';
    this.initializeAnalytics();
  }

  initializeAnalytics() {
    // Initialize period dropdown
    const periodSelect = document.getElementById('period-select');
    if (periodSelect) {
      periodSelect.addEventListener('change', (e) => {
        const period = e.target.value;
        this.switchPeriod(period);
      });
      
      // Set initial value
      periodSelect.value = this.currentPeriod;
    }

    // Initialize refresh button
    const refreshButton = document.getElementById('refresh-button');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => {
        this.refreshData();
      });
    }

    // Initial data load
    this.updateAnalytics();
  }

  switchPeriod(period) {
    if (this.currentPeriod === period) return;

    // Update dropdown value
    const periodSelect = document.getElementById('period-select');
    if (periodSelect) {
      periodSelect.value = period;
    }

    this.currentPeriod = period;
    this.updateAnalytics();
    
    console.log(`📊 Switched to ${period} analytics view`);
  }

  refreshData() {
    const refreshButton = document.getElementById('refresh-button');
    
    // Add refreshing state
    if (refreshButton) {
      refreshButton.classList.add('refreshing');
      refreshButton.disabled = true;
    }

    // Debug: Log current TimeTracker data before refresh
    console.log('🔍 TimeTracker data before refresh:', {
      timeData: Object.keys(this.timeTracker.timeData),
      taskSessions: Object.keys(this.timeTracker.taskSessions),
      taskTagSessions: Object.keys(this.timeTracker.taskTagSessions)
    });

    // Force TimeTracker to save current state and ensure data is up to date
    this.timeTracker.saveData();
    
    // Also ensure the TimeTracker display is updated (this might trigger data updates)
    this.timeTracker.updateDisplay();
    this.timeTracker.updateTaskLabels();

    // Simulate a brief loading state for better UX
    setTimeout(() => {
      // Debug: Log TimeTracker data after forcing updates
      console.log('🔍 TimeTracker data after forced updates:', {
        timeData: Object.keys(this.timeTracker.timeData),
        taskSessions: Object.keys(this.timeTracker.taskSessions),
        taskTagSessions: Object.keys(this.timeTracker.taskTagSessions)
      });
      
      // Update analytics with fresh data
      this.updateAnalytics();
      
      // Remove refreshing state
      if (refreshButton) {
        refreshButton.classList.remove('refreshing');
        refreshButton.disabled = false;
      }
      
      console.log('🔄 Analytics data refreshed');
    }, 300);
  }

  updateAnalytics() {
    const data = this.getAnalyticsData(this.currentPeriod);
    this.updateTimeMetrics(data);
    this.updateTimelineReplica(data);
    this.updateTaskSummary(data);
  }

  getAnalyticsData(period) {
    const now = new Date();
    let startDate;

    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '1m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case '6m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      default:
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    return this.aggregateData(startDate, now);
  }

  aggregateData(startDate, endDate) {
    const data = {
      totalTime: 0,
      totalTasks: 0,
      categories: {},
      tasks: {},
      dailyActivity: {},
      timelineData: {},
      periodDays: this.getDaysBetween(startDate, endDate),
      startDate: startDate,
      endDate: endDate
    };

    // Aggregate data from timeTracker
    console.log('📊 Aggregating data for period:', this.currentPeriod);
    console.log('📊 Available hours in timeData:', Object.keys(this.timeTracker.timeData));
    
    Object.keys(this.timeTracker.timeData).forEach(hour => {
      const hourData = this.timeTracker.timeData[hour];
      const hourTaskSessions = this.timeTracker.taskSessions[hour] || {};
      const hourTagSessions = this.timeTracker.taskTagSessions[hour] || {};
      
      // Debug: Log data for hours after 14:00
      if (parseInt(hour) >= 14) {
        console.log(`📊 Hour ${hour} data:`, {
          totalMinutes: hourData.reduce((sum, time) => sum + (time > 0 ? 1 : 0), 0),
          totalTime: hourData.reduce((sum, time) => sum + time, 0),
          tasks: Object.keys(hourTaskSessions),
          taskNames: Object.values(hourTaskSessions).filter(name => name)
        });
      }

      // Store timeline data for replica
      data.timelineData[hour] = {
        hourData: [...hourData],
        taskSessions: { ...hourTaskSessions },
        tagSessions: { ...hourTagSessions }
      };

      hourData.forEach((minuteTime, minute) => {
        if (minuteTime > 0) {
          data.totalTime += minuteTime;

          const taskName = hourTaskSessions[minute];
          const taskTags = hourTagSessions[minute] || [];

          if (taskName) {
            // Debug: Log task and tags for specific tasks
            if (taskName.includes('바이브') || taskName.includes('코딩')) {
              console.log(`📋 Processing task "${taskName}" at ${hour}:${minute}:`, {
                taskTags,
                minuteTime
              });
            }
            
            // Count unique tasks
            if (!data.tasks[taskName]) {
              data.tasks[taskName] = { time: 0, categories: new Set() };
              data.totalTasks++;
            }
            data.tasks[taskName].time += minuteTime;

            // Aggregate by categories
            taskTags.forEach(tag => {
              data.tasks[taskName].categories.add(tag);
              if (!data.categories[tag]) {
                data.categories[tag] = 0;
              }
              data.categories[tag] += minuteTime;
            });
          }

          // Daily activity (simplified - using current day)
          const today = new Date().toDateString();
          if (!data.dailyActivity[today]) {
            data.dailyActivity[today] = 0;
          }
          data.dailyActivity[today] += minuteTime;
        }
      });
    });

    // Debug: Log final aggregated data
    console.log('📊 Final aggregated data:', {
      totalTime: data.totalTime,
      totalTasks: data.totalTasks,
      taskNames: Object.keys(data.tasks),
      categories: Object.keys(data.categories),
      timelineHours: Object.keys(data.timelineData)
    });

    return data;
  }

  getDaysBetween(startDate, endDate) {
    const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    return Math.max(1, days);
  }

  updateTimeMetrics(data) {
    // Calculate total time
    const totalTime = data.totalTime;
    document.getElementById('total-time-metric').textContent = this.timeTracker.formatTime(totalTime);

    // Calculate study time (time with "공부" category)
    const studyTime = data.categories['공부'] || 0;
    document.getElementById('study-time-metric').textContent = this.timeTracker.formatTime(studyTime);
  }

  updateTimelineReplica(data) {
    const replicaContainer = document.getElementById('timeline-replica');
    
    if (Object.keys(data.timelineData).length === 0) {
      replicaContainer.innerHTML = '<div class="replica-no-data">선택한 기간에 기록된 데이터가 없습니다</div>';
      return;
    }

    // Filter hours based on the selected period
    const filteredHours = this.filterHoursByPeriod(data.timelineData, data.startDate, data.endDate);
    
    if (filteredHours.length === 0) {
      replicaContainer.innerHTML = '<div class="replica-no-data">선택한 기간에 기록된 데이터가 없습니다</div>';
      return;
    }

    // Sort hours chronologically
    const sortedHours = filteredHours.sort((a, b) => parseInt(a) - parseInt(b));

    replicaContainer.innerHTML = sortedHours.map(hour => {
      const hourData = data.timelineData[hour];
      const totalDuration = hourData.hourData.reduce((sum, minuteTime) => sum + minuteTime, 0);
      
      if (totalDuration === 0) return ''; // Skip hours with no data

      const timeString = this.formatHour(parseInt(hour));
      
      // Create minute blocks
      const minuteBlocks = hourData.hourData.map((minuteTime, minute) => {
        const hasTime = minuteTime > 0;
        const taskTags = hourData.tagSessions[minute] || [];
        let blockStyle = '';
        
        if (hasTime && taskTags.length > 0) {
          const tagColor = this.timeTracker.getTagsGradient(taskTags);
          const fillPercentage = Math.min((minuteTime / 60000) * 100, 100);
          blockStyle = `style="background: linear-gradient(to right, ${tagColor} ${fillPercentage}%, var(--neutral-80) ${fillPercentage}%)"`;
        }
        
        return `<div class="replica-minute-block ${hasTime ? 'has-time' : ''}" ${blockStyle}></div>`;
      }).join('');

      return `
        <div class="replica-timeline-item">
          <div class="replica-timeline-time">${timeString}</div>
          <div class="replica-timeline-content">
            <div class="replica-timeline-duration">${this.timeTracker.formatTime(totalDuration)}</div>
            <div class="replica-progress-container">
              <div class="replica-minute-grid">
                ${minuteBlocks}
              </div>
            </div>
          </div>
        </div>
      `;
    }).filter(html => html !== '').join('');
  }

  filterHoursByPeriod(timelineData, startDate, endDate) {
    const now = new Date();
    const currentHour = now.getHours();
    
    switch (this.currentPeriod) {
      case '24h':
        // Show last 24 hours
        const hours24 = [];
        for (let i = 23; i >= 0; i--) {
          const hour = (currentHour - i + 24) % 24;
          if (timelineData[hour]) {
            hours24.push(hour.toString());
          }
        }
        return hours24;
        
      case '7d':
      case '1m':
      case '6m':
        // For longer periods, show all available hours with data
        // In a real implementation, you'd filter by actual dates
        return Object.keys(timelineData).filter(hour => {
          const hourData = timelineData[hour];
          return hourData.hourData.some(minuteTime => minuteTime > 0);
        });
        
      default:
        return Object.keys(timelineData);
    }
  }

  formatHour(hour) {
    return `${hour.toString().padStart(2, '0')}:00`;
  }

  updateTaskSummary(data) {
    const summaryContainer = document.getElementById('task-summary-list');
    
    if (Object.keys(data.tasks).length === 0) {
      summaryContainer.innerHTML = '<div class="no-data">데이터가 없습니다</div>';
      return;
    }

    // Sort tasks by time spent (descending order)
    const sortedTasks = Object.entries(data.tasks)
      .sort(([,a], [,b]) => b.time - a.time);

    summaryContainer.innerHTML = sortedTasks.map(([taskName, taskData]) => {
      // Debug: Log task data to see what categories are available
      console.log(`📋 Task "${taskName}":`, {
        categories: taskData.categories,
        categoriesType: typeof taskData.categories,
        categoriesArray: Array.from(taskData.categories || []),
        time: taskData.time
      });
      
      const categories = Array.from(taskData.categories || []).join(', ') || '카테고리 없음';
      
      return `
        <div class="task-summary-item">
          <div class="task-summary-info">
            <div class="task-summary-name">${taskName}</div>
            <div class="task-summary-categories">${categories}</div>
          </div>
          <div class="task-summary-time">${this.timeTracker.formatTime(taskData.time)}</div>
        </div>
      `;
    }).join('');
  }

  updateSummaryCards(data) {
    // Total time
    document.getElementById('total-period-time').textContent = this.timeTracker.formatTime(data.totalTime);
    
    // Total tasks
    document.getElementById('total-tasks').textContent = data.totalTasks.toString();
    
    // Average daily time
    const avgDaily = data.totalTime / data.periodDays;
    document.getElementById('avg-daily-time').textContent = this.timeTracker.formatTime(avgDaily);
    
    // Top category
    const topCategory = Object.keys(data.categories).reduce((a, b) => 
      data.categories[a] > data.categories[b] ? a : b, Object.keys(data.categories)[0]);
    document.getElementById('top-category').textContent = topCategory || '-';
  }

  updateCategoryChart(data) {
    const chartContainer = document.getElementById('category-chart');
    
    if (Object.keys(data.categories).length === 0) {
      chartContainer.innerHTML = '<div class="no-data">데이터가 없습니다</div>';
      return;
    }

    const totalTime = data.totalTime;
    const sortedCategories = Object.entries(data.categories)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5); // Top 5 categories

    const categoryColors = ['#ED5000', '#FA6616', '#FEF1EB', '#FB2D36', '#1198FF'];

    chartContainer.innerHTML = sortedCategories.map(([category, time], index) => {
      const percentage = ((time / totalTime) * 100).toFixed(1);
      const color = categoryColors[index % categoryColors.length];
      
      return `
        <div class="category-item">
          <div class="category-info">
            <div class="category-color" style="background-color: ${color}"></div>
            <span class="category-name">${category}</span>
          </div>
          <div>
            <span class="category-time">${this.timeTracker.formatTime(time)}</span>
            <span class="category-percentage">${percentage}%</span>
          </div>
        </div>
      `;
    }).join('');
  }

  updateActivityChart(data) {
    const chartContainer = document.getElementById('activity-chart');
    
    if (Object.keys(data.dailyActivity).length === 0) {
      chartContainer.innerHTML = '<div class="no-data">데이터가 없습니다</div>';
      return;
    }

    // Simple text-based activity display for now
    const activities = Object.entries(data.dailyActivity);
    chartContainer.innerHTML = activities.map(([date, time]) => `
      <div class="activity-item">
        <span class="activity-date">${new Date(date).toLocaleDateString('ko-KR')}</span>
        <span class="activity-time">${this.timeTracker.formatTime(time)}</span>
      </div>
    `).join('');
  }

  updateTaskBreakdown(data) {
    const listContainer = document.getElementById('task-breakdown-list');
    
    if (Object.keys(data.tasks).length === 0) {
      listContainer.innerHTML = '<div class="no-data">데이터가 없습니다</div>';
      return;
    }

    const sortedTasks = Object.entries(data.tasks)
      .sort(([,a], [,b]) => b.time - a.time)
      .slice(0, 10); // Top 10 tasks

    listContainer.innerHTML = sortedTasks.map(([taskName, taskData]) => `
      <div class="task-item">
        <div class="task-info">
          <div class="task-name">${taskName}</div>
          <div class="task-category">${Array.from(taskData.categories).join(', ') || '카테고리 없음'}</div>
        </div>
        <div class="task-time">${this.timeTracker.formatTime(taskData.time)}</div>
      </div>
    `).join('');
  }
}

// ==============================================
// Navigation System
// ==============================================

class NavigationManager {
  constructor(timeTracker) {
    this.timeTracker = timeTracker;
    this.currentView = 'tracker';
    this.analyticsManager = null;
    this.initializeNavigation();
  }

  initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const targetView = item.getAttribute('data-view');
        this.switchView(targetView);
      });
    });
  }

  switchView(viewName) {
    if (this.currentView === viewName) return;

    // Hide current view
    const currentViewElement = document.getElementById(`${this.currentView}-view`);
    if (currentViewElement) {
      currentViewElement.classList.add('hidden');
    }

    // Show target view
    const targetViewElement = document.getElementById(`${viewName}-view`);
    if (targetViewElement) {
      targetViewElement.classList.remove('hidden');
    }

    // Update app header title
    this.updateAppHeader(viewName);

    // Initialize analytics manager when switching to analyzer view
    if (viewName === 'analyzer' && !this.analyticsManager) {
      this.analyticsManager = new AnalyticsManager(this.timeTracker);
    } else if (viewName === 'analyzer' && this.analyticsManager) {
      // Refresh analytics data when returning to analyzer view
      this.analyticsManager.updateAnalytics();
    }

    // Update navigation active state
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    
    const activeNavItem = document.querySelector(`[data-view="${viewName}"]`);
    if (activeNavItem) {
      activeNavItem.classList.add('active');
    }

    // Update current view
    this.currentView = viewName;
    
    console.log(`📱 Switched to ${viewName} view`);
  }

  updateAppHeader(viewName) {
    const headerTitle = document.querySelector('.header-title');
    if (headerTitle) {
      if (viewName === 'analyzer') {
        headerTitle.textContent = '시간 분석기';
      } else {
        headerTitle.textContent = '타임 트래커';
      }
    }
  }

  getCurrentView() {
    return this.currentView;
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.timeTracker = new TimeTracker();
  window.navigationManager = new NavigationManager(window.timeTracker);
  
  console.log('⏱️ Time Tracker initialized with minute-based timeline');
  console.log('📱 Navigation system initialized');
  console.log('📊 Analytics system ready');
  console.log('🔄 Use timeTracker.resetAllData() to clear all minute blocks');
  console.log('🕐 Recording starts from current system minute');
});
