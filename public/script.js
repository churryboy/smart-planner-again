class TimeTracker {
  constructor() {
      this.isRecording = false;
      this.currentStartTime = null;
      this.currentHour = null;
      this.timeData = {};
      this.totalTime = 0;
      this.currentSessionTime = 0;
      this.updateInterval = null;
    this.timelineOrder = this.generateTimelineOrder(); // Dynamic order based on current time      this.draggedElement = null;
      this.scrollTimer = null;
      
      this.elements = {
          recordButton: document.getElementById('record-button'),
          statusDot: document.getElementById('status-dot'),
          statusText: document.getElementById('status-text'),
          currentTime: document.getElementById('current-time'),
          totalTime: document.getElementById('total-time'),
          timeline: document.getElementById('timeline')
      };
      
    
    // Update timeline order every minute to match current time
    this.timeUpdateInterval = null;      this.init();
  }
  
  init() {
      this.loadData();
    this.startTimeUpdateTimer();      this.generateTimeline();
      this.initializeEventListeners();
      this.setupScrollbarAutoHide();
      this.updateDisplay();
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
          
          timelineItem.innerHTML = `
              <div class="timeline-time">${timeString}</div>
              <div class="timeline-content">
                  <div class="timeline-duration" id="duration-${hour}">00:00:00</div>
                  <div class="progress-bar">
                      <div class="progress-fill" id="progress-${hour}"></div>
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
              this.reorderTimeline(draggedHour);
          }
      });
  }

  reorderTimeline(startHour) {
      this.timelineOrder = [];
      for (let i = 0; i < 24; i++) {
          this.timelineOrder.push((startHour + i) % 24);
      }
      
      this.generateTimeline();
      this.updateDisplay();
      this.saveData();
  }

  generateTimelineOrder() {
    const currentHour = this.getCurrentHour();
    const order = [];
    
    // Start with current hour
    for (let i = currentHour; i < 24; i++) {
      order.push(i);
    }
    
    // Add remaining hours from 0 to current-1
    for (let i = 0; i < currentHour; i++) {
      order.push(i);
    }
    
    console.log(`⏰ Timeline order updated for current hour: ${currentHour}`);
    return order;
  }
  
  updateTimelineOrder() {
    const newOrder = this.generateTimelineOrder();
    
    // Only update if order has changed (hour has changed)
    if (JSON.stringify(newOrder) !== JSON.stringify(this.timelineOrder)) {
      this.timelineOrder = newOrder;
      this.generateTimeline();
      this.updateDisplay();
      this.saveData();
      console.log(`🔄 Timeline reordered - current hour now at top`);
    }
  }
  
  startTimeUpdateTimer() {
    // Update timeline order every minute
    this.timeUpdateInterval = setInterval(() => {
      this.updateTimelineOrder();
    }, 60000); // Check every minute
    
    console.log(`⏰ Time update timer started - checking every minute`);
  }
  
  stopTimeUpdateTimer() {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
      console.log(`⏰ Time update timer stopped`);
    }
  }
  
  setupScrollbarAutoHide() {
      const timeline = this.elements.timeline;
      
      timeline.addEventListener('scroll', () => {
          if (this.draggedElement) return;
          
          timeline.classList.add('scrolling');
          
          if (this.scrollTimer) {
              clearTimeout(this.scrollTimer);
          }
          
          this.scrollTimer = setTimeout(() => {
              timeline.classList.remove('scrolling');
          }, 1500);
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
  
  getCurrentHour() {
      return new Date().getHours();
  }
  
  initializeEventListeners() {
      this.elements.recordButton.addEventListener('click', () => {
          this.toggleRecording();
      });
      
      window.addEventListener('beforeunload', () => {
      this.stopTimeUpdateTimer();          this.saveData();
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
      this.isRecording = true;
      this.currentStartTime = Date.now();
      this.currentHour = this.getCurrentHour();
      
      this.elements.recordButton.classList.add('recording');
      this.elements.recordButton.innerHTML = `
          <svg class="record-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="6" y="6" width="12" height="12"></rect>
          </svg>
          <span class="button-text">정지</span>
      `;
      this.elements.statusDot.classList.add('recording');
      this.elements.statusText.textContent = '기록 중';
      
      this.updateInterval = setInterval(() => {
          this.updateCurrentSession();
      }, 100);
      
      this.updateDisplay();
  }
  
  stopRecording() {
      if (!this.isRecording) return;
      
      const endTime = Date.now();
      const sessionTime = endTime - this.currentStartTime;
      
      if (!this.timeData[this.currentHour]) {
          this.timeData[this.currentHour] = 0;
      }
      this.timeData[this.currentHour] += sessionTime;
      this.totalTime += sessionTime;
      
      this.isRecording = false;
      this.currentStartTime = null;
      this.currentSessionTime = 0;
      
      if (this.updateInterval) {
          clearInterval(this.updateInterval);
          this.updateInterval = null;
      }
      
      this.elements.recordButton.classList.remove('recording');
      this.elements.recordButton.innerHTML = `
          <svg class="record-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="10,8 16,12 10,16 10,8"></polygon>
          </svg>
          <span class="button-text">시작</span>
      `;
      this.elements.statusDot.classList.remove('recording');
      this.elements.statusText.textContent = '대기 중';
      this.elements.currentTime.textContent = '00:00:00';
      
      this.updateDisplay();
      this.saveData();
  }
  
  updateCurrentSession() {
      if (!this.isRecording) return;
      
      const now = Date.now();
      this.currentSessionTime = now - this.currentStartTime;
      
      const currentHour = this.getCurrentHour();
      if (currentHour !== this.currentHour) {
          if (!this.timeData[this.currentHour]) {
              this.timeData[this.currentHour] = 0;
          }
          this.timeData[this.currentHour] += this.currentSessionTime;
          this.totalTime += this.currentSessionTime;
          
          this.currentHour = currentHour;
          this.currentStartTime = now;
          this.currentSessionTime = 0;
      }
      
      this.updateDisplay();
  }
  
  updateDisplay() {
      this.elements.currentTime.textContent = this.formatTime(this.currentSessionTime);
      
      const displayTotal = this.isRecording ? 
          this.totalTime + this.currentSessionTime : 
          this.totalTime;
      this.elements.totalTime.textContent = this.formatTime(displayTotal);
      
      this.timelineOrder.forEach(hour => {
          let duration = this.timeData[hour] || 0;
          
          if (this.isRecording && hour === this.currentHour) {
              duration += this.currentSessionTime;
          }
          
          const durationElement = document.getElementById(`duration-${hour}`);
          const progressElement = document.getElementById(`progress-${hour}`);
          
          if (durationElement) {
              durationElement.textContent = this.formatTime(duration);
          }
          
          if (progressElement) {
              const percentage = Math.min((duration / 3600000) * 100, 100);
              progressElement.style.width = `${percentage}%`;
          }
          
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
          this.timelineOrder = this.generateTimelineOrder(); // Always use current time order              } else {
                  this.resetData();
              }
          } catch (e) {
              console.error('Error loading saved data:', e);
              this.resetData();
          }
      } else {
          this.resetData();
      }
  }
  
  resetData() {
      this.timeData = {};
      this.totalTime = 0;
    this.timelineOrder = this.generateTimelineOrder(); // Dynamic order based on current time      this.saveData();
  }
  
  setTimelineStartHour(hour) {
      if (hour < 0 || hour >= 24) {
          console.error('Invalid hour. Please provide a value between 0 and 23.');
          return;
      }
      this.reorderTimeline(hour);
  }
  
  resetTimelineOrder() {
    this.timelineOrder = this.generateTimelineOrder(); // Dynamic order based on current time      this.generateTimeline();
      this.updateDisplay();
      this.saveData();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.timeTracker = new TimeTracker();
  console.log('⏱️ Time Tracker initialized with real-time timeline ordering');});