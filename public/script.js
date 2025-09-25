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
    
    this.elements = {
      recordButton: document.getElementById('record-button'),
      statusDot: document.querySelector('.status-dot'),
      statusText: document.getElementById('status-text'),
      currentTime: document.getElementById('current-time'),
      totalTime: document.getElementById('total-time'),
      timeline: document.getElementById('timeline')
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
      this.toggleRecording();
    });
    
    window.addEventListener('beforeunload', () => {
      this.stopTimeUpdateTimer();
      this.saveData();
    });
    
    setInterval(() => {
      this.saveData();
    }, 30000);
  }
  
  toggleRecording() {
    if (this.isRecording) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }
  
  startRecording() {
    const timeInfo = this.getCurrentTimeInfo();
    
    this.isRecording = true;
    this.currentStartTime = Date.now();
    this.currentHour = timeInfo.hour;
    this.currentStartMinute = timeInfo.minute;
    
    // Initialize current hour data
    this.initializeCurrentHourProgress();
    
    // Update UI
    this.elements.recordButton.classList.add('recording');
    this.elements.recordButton.innerHTML = `<svg class="record-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="6" y="6" width="12" height="12"></rect></svg>정지`;
    this.elements.statusDot.classList.add('recording');
    this.elements.statusText.textContent = '기록 중';
    
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
    this.elements.statusDot.classList.remove('recording');
    this.elements.statusText.textContent = '대기 중';
    this.elements.currentTime.textContent = '00:00:00';
    
    this.updateDisplay();
    this.saveData();
    
    console.log(`⏹️ Recording stopped - session time: ${this.formatTime(sessionTime)}`);
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
          
          // Add current session contribution if recording
          if (this.isRecording && hour === this.currentHour) {
            const currentMinute = this.getCurrentMinute();
            if (minute === currentMinute) {
              // Add partial current session time for current minute
              const sessionInCurrentMinute = this.currentSessionTime % 60000; // Time in current minute
              displayTime += sessionInCurrentMinute;
            } else if (minute > this.currentStartMinute && minute < currentMinute) {
              // Full minutes between start and current
              displayTime += 60000; // Full minute
            }
          }
          
          // Calculate fill percentage (0-100% per minute)
          const fillPercentage = Math.min((displayTime / 60000) * 100, 100);
          
          // Update block appearance
          if (fillPercentage > 0) {
            block.style.background = `linear-gradient(to right, var(--orange-50) ${fillPercentage}%, var(--neutral-80) ${fillPercentage}%)`;
            block.style.borderColor = fillPercentage > 50 ? "var(--orange-50)" : "var(--neutral-80)";            block.classList.add('has-time');
          } else {
            block.style.background = 'var(--neutral-80)';
            block.style.borderColor = "var(--neutral-80)";            block.classList.remove('has-time');
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
          this.updateDisplay();
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
    this.updateDisplay();
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
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.timeTracker = new TimeTracker();
  console.log('⏱️ Time Tracker initialized with minute-based timeline');
  console.log('🔄 Use timeTracker.resetAllData() to clear all minute blocks');
  console.log('🕐 Recording starts from current system minute');
});
