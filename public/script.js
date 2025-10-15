// ==============================================
// Time Tracker with Minute-Based Timeline
// ==============================================

// Multi-task management class
class MultiTaskManager {
  constructor(timeTracker) {
    this.timeTracker = timeTracker;
    this.tasks = new Map(); // taskId -> { name, startTime, totalTime, isRecording, element }
    this.taskIdCounter = 0;
    
    this.elements = {
      addTaskButton: document.getElementById('add-task-button'),
      tasksList: document.getElementById('tasks-list'),
      totalTime: document.getElementById('total-time')
    };
    
    this.init();
  }
  
  init() {
    this.setupEventListeners();
    // Don't add initial task here - it will be handled by TimeTracker initialization
  }
  
  setupEventListeners() {
    this.elements.addTaskButton.addEventListener('click', () => {
      this.addNewTask();
    });
  }
  
  addInitialTask() {
    this.addNewTask('첫 번째 작업');
  }
  
  addNewTask(defaultName = '') {
    const taskId = ++this.taskIdCounter;
    const taskData = {
      id: taskId,
      name: defaultName,
      startTime: null,
      totalTime: 0,
      isRecording: false,
      hasBeenRecorded: false, // Track if task has been recorded before
      category: '공부', // Default category
      element: null
    };
    
    const taskElement = this.createTaskElement(taskData);
    taskData.element = taskElement;
    
    this.tasks.set(taskId, taskData);
    this.elements.tasksList.appendChild(taskElement);
    
    // Track task addition
    if (window.analytics && defaultName) {
      window.analytics.trackTaskAdded(defaultName);
    }
    
    // Focus on the input if it's empty
    if (!defaultName) {
      const input = taskElement.querySelector('.task-input');
      input.focus();
    }
    
    return taskId;
  }
  
  createTaskElement(taskData) {
    const taskItem = document.createElement('div');
    taskItem.className = 'task-item';
    taskItem.dataset.taskId = taskData.id;
    
    taskItem.innerHTML = `
      <input type="text" class="task-input" placeholder="작업 이름을 입력하세요..." value="${taskData.name}">
      <div class="task-controls">
        <span class="task-time">00:00:00</span>
        <button class="task-record-button" title="기록 시작/정지">
          <svg class="record-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <polygon points="10,8 16,12 10,16 10,8"></polygon>
          </svg>
        </button>
        <button class="task-delete-button" title="작업 삭제">
          <svg class="delete-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;
    
    this.setupTaskEventListeners(taskItem, taskData);
    return taskItem;
  }
  
  setupTaskEventListeners(taskElement, taskData) {
    const input = taskElement.querySelector('.task-input');
    const recordButton = taskElement.querySelector('.task-record-button');
    const deleteButton = taskElement.querySelector('.task-delete-button');
    
    // Input change handler
    input.addEventListener('input', (e) => {
      taskData.name = e.target.value;
      this.saveTasksData();
    });
    
    input.addEventListener('blur', (e) => {
      const taskName = e.target.value.trim();
      
      if (!taskName) {
        e.target.value = `작업 ${taskData.id}`;
        taskData.name = e.target.value;
      } else {
        // Track task name entered when user finishes typing
        if (window.analytics) {
          window.analytics.trackTaskNameEntered(taskName, taskName.length);
        }
      }
    });
    
    // Record button handler
    recordButton.addEventListener('click', () => {
      this.toggleTaskRecording(taskData.id);
    });
    
    // Delete button handler
    deleteButton.addEventListener('click', () => {
      this.deleteTask(taskData.id);
    });
  }
  
  toggleTaskRecording(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) return;
    
    if (task.isRecording) {
      this.stopTaskRecording(taskId);
    } else {
      // Stop all other recordings first
      this.stopAllRecordings();
      this.startTaskRecording(taskId);
    }
  }
  
  startTaskRecording(taskId) {
    const task = this.tasks.get(taskId);
    if (!task || task.isRecording) return;
    
    // Update task name if empty
    const input = task.element.querySelector('.task-input');
    if (!task.name.trim()) {
      task.name = `작업 ${taskId}`;
      input.value = task.name;
    }
    
    task.isRecording = true;
    task.startTime = Date.now();
    
    // Update UI
    task.element.classList.add('recording');
    const recordButton = task.element.querySelector('.task-record-button');
    recordButton.classList.add('recording');
    recordButton.innerHTML = `
      <svg class="record-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="6" y="6" width="12" height="12"></rect>
      </svg>
    `;
    
    // Disable input while recording
    input.disabled = true;
    
    // Update timeline title with current task name
    this.updateTimelineTitle(task.name);
    
    // Start the original TimeTracker recording with this task
    this.timeTracker.currentTaskName = task.name;
    this.timeTracker.currentTaskTags = ['멀티태스킹'];
    this.timeTracker.startRecording();
    
    // Track analytics
    if (window.analytics) {
      window.analytics.trackTaskStart(task.name, ['멀티태스킹']);
    }
    
    console.log(`▶️ Started recording task: ${task.name}`);
  }
  
  stopTaskRecording(taskId) {
    const task = this.tasks.get(taskId);
    if (!task || !task.isRecording) return;
    
    console.log(`⏹️ Stopping recording for task: ${task.name}`);
    console.log(`   Current TimeTracker taskName: ${this.timeTracker.currentTaskName}`);
    
    const sessionTime = Date.now() - task.startTime;
    task.totalTime += sessionTime;
    task.isRecording = false;
    task.startTime = null;
    task.hasBeenRecorded = true; // Mark as recorded
    
    // Update UI
    task.element.classList.remove('recording');
    const recordButton = task.element.querySelector('.task-record-button');
    recordButton.classList.remove('recording');
    recordButton.innerHTML = `
      <svg class="record-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <polygon points="10,8 16,12 10,16 10,8"></polygon>
      </svg>
    `;
    
    // Keep input disabled after recording (don't re-enable)
    const input = task.element.querySelector('.task-input');
    input.disabled = true;
    
    // Reset timeline title to default
    this.updateTimelineTitle('현재 시간 타임라인');
    
    // Stop the original TimeTracker recording
    this.timeTracker.stopRecording();
    
    console.log(`   After stopping, taskSessions:`, this.timeTracker.taskSessions);
    
    // Track analytics
    if (window.analytics) {
      window.analytics.trackTaskStop(task.name, sessionTime, ['멀티태스킹']);
    }
    
    this.updateTaskTimeDisplay(taskId);
    this.updateTotalTime();
    this.updateStudyTime(); // Update study time after stopping
    this.saveTasksData();
    
    console.log(`✅ Stopped recording task: ${task.name} - Session: ${this.formatTime(sessionTime)}`);
  }
  
  stopAllRecordings() {
    this.tasks.forEach((task, taskId) => {
      if (task.isRecording) {
        this.stopTaskRecording(taskId);
      }
    });
  }
  
  deleteTask(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) return;
    
    // Track task deletion
    if (window.analytics && task.name) {
      window.analytics.trackTaskDeleted(task.name, task.totalTime);
    }
    
    // Stop recording if active
    if (task.isRecording) {
      this.stopTaskRecording(taskId);
    }
    
    // Remove from DOM
    task.element.remove();
    
    // Remove from tasks map
    this.tasks.delete(taskId);
    
    // Update total time
    this.updateTotalTime();
    this.saveTasksData();
    
    console.log(`🗑️ Deleted task: ${task.name}`);
  }
  
  updateTaskTimeDisplay(taskId) {
    const task = this.tasks.get(taskId);
    if (!task) return;
    
    let displayTime = task.totalTime;
    
    // Add current session time if recording
    if (task.isRecording && task.startTime) {
      displayTime += Date.now() - task.startTime;
    }
    
    const timeElement = task.element.querySelector('.task-time');
    timeElement.textContent = this.formatTime(displayTime);
  }
  
  updateTotalTime() {
    // Total time is now managed by TimeTracker based on actual recorded minute data
    // MultiTaskManager no longer updates the total-time display
    // This prevents conflicts and flickering
    
    // We can still calculate task totals for internal use if needed
    let totalTime = 0;
    this.tasks.forEach(task => {
      totalTime += task.totalTime;
      if (task.isRecording && task.startTime) {
        totalTime += Date.now() - task.startTime;
      }
    });
    
    // Don't update the display - let TimeTracker handle it
    return totalTime;
  }
  
  formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  updateTimelineTitle(title) {
    const timelineTitle = document.querySelector('.timeline-title');
    if (timelineTitle) {
      timelineTitle.textContent = title;
    }
  }
  
  updateStudyTime() {
    // Calculate total study time (tasks with '공부' category)
    // Only counts saved/completed time, not currently recording time
    let studyTime = 0;
    
    console.log('📚 Calculating study time (saved only):');
    this.tasks.forEach(task => {
      console.log(`  Task: "${task.name}", Category: "${task.category}", TotalTime: ${task.totalTime}, IsRecording: ${task.isRecording}`);
      
      if (task.category === '공부') {
        studyTime += task.totalTime;
        console.log(`    ✅ Added ${this.formatTime(task.totalTime)}`);
      } else {
        console.log(`    ❌ Skipped (category: ${task.category})`);
      }
    });
    
    console.log(`📊 Total study time (saved): ${this.formatTime(studyTime)}`);
    
    // Update the study time display in analyzer view
    const studyTimeElement = document.getElementById('study-time-metric');
    if (studyTimeElement) {
      studyTimeElement.textContent = this.formatTime(studyTime);
    }
  }
  
  saveTasksData() {
    const tasksData = Array.from(this.tasks.entries()).map(([id, task]) => ({
      id,
      name: task.name,
      totalTime: task.totalTime,
      isRecording: task.isRecording,
      hasBeenRecorded: task.hasBeenRecorded || false,
      category: task.category || '공부'
    }));
    
    // Use date-specific storage key to keep tasks separate per day
    const today = new Date();
    const dateStr = this.timeTracker.formatDateForStorage(today);
    const storageKey = `multiTasks_${this.timeTracker.currentNickname}_${dateStr}`;
    localStorage.setItem(storageKey, JSON.stringify(tasksData));
    console.log(`💾 Saved ${tasksData.length} tasks for ${dateStr}`);
  }
  
  loadTasksData() {
    // Use date-specific storage key to load only today's tasks
    const today = new Date();
    const dateStr = this.timeTracker.formatDateForStorage(today);
    const storageKey = `multiTasks_${this.timeTracker.currentNickname}_${dateStr}`;
    const saved = localStorage.getItem(storageKey);
    
    if (!saved) {
      console.log(`📂 No tasks found for ${dateStr}, starting fresh`);
      return false;
    }
    
    try {
      const tasksData = JSON.parse(saved);
      
      if (!tasksData || tasksData.length === 0) {
        return false;
      }
      
      // Clear existing tasks
      this.tasks.clear();
      this.elements.tasksList.innerHTML = '';
      
      // Restore tasks for today only
      tasksData.forEach(taskData => {
        const task = {
          id: taskData.id,
          name: taskData.name,
          startTime: null,
          totalTime: taskData.totalTime || 0, // Default to 0 if not set
          isRecording: false, // Don't restore recording state
          hasBeenRecorded: taskData.hasBeenRecorded || false,
          category: taskData.category || '공부',
          element: null
        };
        
        const taskElement = this.createTaskElement(task);
        task.element = taskElement;
        
        // Disable input if task has been recorded before
        if (task.hasBeenRecorded) {
          const input = taskElement.querySelector('.task-input');
          input.disabled = true;
        }
        
        this.tasks.set(task.id, task);
        this.elements.tasksList.appendChild(taskElement);
        
        this.updateTaskTimeDisplay(task.id);
        
        // Update counter
        this.taskIdCounter = Math.max(this.taskIdCounter, task.id);
      });
      
      this.updateTotalTime();
      this.updateStudyTime(); // Update study time after loading tasks
      console.log(`📂 Loaded ${tasksData.length} tasks for ${dateStr}`);
      return true;
    } catch (error) {
      console.error('Failed to load tasks data:', error);
      return false;
    }
  }
  
  // Start update timer for recording tasks
  startUpdateTimer() {
    setInterval(() => {
      let hasRecording = false;
      
      this.tasks.forEach((task, taskId) => {
        if (task.isRecording) {
          this.updateTaskTimeDisplay(taskId);
          hasRecording = true;
        }
      });
      
      if (hasRecording) {
        this.updateTotalTime();
        // updateStudyTime() removed - only show saved time, not real-time
      }
    }, 1000);
  }
}

class TimeTracker {
  constructor() {
    this.isRecording = false;
    this.currentStartTime = null;
    this.currentHour = null;
    this.timeData = {}; // Store time data for each hour: { hour: [minute0, minute1, ...minute59] }
    // totalTime is now calculated dynamically from timeData
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
    
    // Nickname system
    this.currentNickname = null;
    this.storageKey = 'timeTracker'; // Will be updated with nickname
    this.taskHistory = []; // Initialize task history
    this.profileMenuSetup = false; // Track if profile menu is set up
    
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
    
    // Task color mapping - each task name gets a distinct color
    // Colors arranged for maximum contrast between consecutive tasks
    this.taskColorMapping = {}; // { taskName: color }
    this.taskColorPalette = [
      '#FF6B6B', // 1. Bright Red
      '#4ECDC4', // 2. Teal (cyan-green)
      '#F7DC6F', // 3. Yellow
      '#118AB2', // 4. Deep Blue
      '#E76F51', // 5. Terracotta (orange-red)
      '#52B788', // 6. Green
      '#F72585', // 7. Magenta
      '#85C1E2', // 8. Soft Blue
      '#F8B739', // 9. Orange
      '#2A9D8F', // 10. Dark Teal
      '#EF476F', // 11. Pink
      '#98D8C8', // 12. Mint
      '#C77DFF', // 13. Lavender
      '#06A77D', // 14. Emerald
      '#FFD166', // 15. Gold
      '#45B7D1', // 16. Sky Blue
      '#E9C46A', // 17. Sand
      '#BB8FCE', // 18. Light Purple
      '#FFA07A', // 19. Light Salmon
      '#90E0EF'  // 20. Light Cyan
    ];
    this.taskColorIndex = 0;
    
    this.elements = {
      recordButton: document.getElementById('record-button'), // May be null with new UI
      statusDot: document.querySelector('.status-dot'),
      statusText: document.getElementById('status-text'),
      currentTime: document.getElementById('current-time'),
      totalTime: document.getElementById('total-time'),
      timeline: document.getElementById('timeline'),
      currentTaskNameDisplay: document.getElementById('current-task-name'), // May be null with new UI
      taskNameModal: document.getElementById('task-name-modal'),
      taskNameInput: document.getElementById('task-name-input'),
      taskSuggestionsContainer: document.getElementById('task-suggestions'),
      taskCancelBtn: document.getElementById('task-cancel-btn'),
      taskConfirmBtn: document.getElementById('task-confirm-btn'),
      customTagInput: document.getElementById('custom-tag-input'),
      addCustomTagBtn: document.getElementById('add-custom-tag'),
      selectedTagsContainer: document.getElementById('selected-tags'),
      // Nickname modal elements
      nicknameModal: document.getElementById('nickname-modal'),
      nicknameInput: document.getElementById('nickname-input'),
      nicknameConfirmBtn: document.getElementById('nickname-confirm-btn'),
      userNickname: document.getElementById('user-nickname'),
      // Profile menu elements
      profileButton: document.getElementById('profile-button'),
      profileDropdown: document.getElementById('profile-dropdown'),
      dropdownNickname: document.getElementById('dropdown-nickname'),
      logoutBtn: document.getElementById('logout-btn')
    };
    
    this.init();
  }
  
  init() {
    // Check if nickname exists, if not show nickname modal
    if (this.checkNicknameExists()) {
      this.initializeApp();
    } else {
      this.showNicknameModal();
    }
  }
  
  initializeApp() {
    this.generateTimeline();
    this.initializeEventListeners();
    this.setupScrollbarAutoHide();
    this.updateDisplay();
    this.loadData();
    this.startTimeUpdateTimer();
    this.initializeCurrentHourProgress();
    this.updateTaskLabels(); // Initial render of task labels
    
    // Ensure profile menu is set up (important for re-login)
    this.setupProfileMenu();
    
    // Initialize multi-task manager
    this.initializeMultiTaskManager();
  }
  
  initializeMultiTaskManager() {
    // Prevent multiple initializations
    if (window.multiTaskManager) {
      console.log('📋 Multi-task manager already initialized, skipping...');
      return;
    }
    
    // Initialize multi-task manager if elements exist
    if (document.getElementById('add-task-button') && document.getElementById('tasks-list')) {
      window.multiTaskManager = new MultiTaskManager(this);
      
      // Load saved tasks first, if none exist, the initial task will be created
      const hasExistingTasks = window.multiTaskManager.loadTasksData();
      
      // If no existing tasks were loaded, create initial task
      if (!hasExistingTasks) {
        window.multiTaskManager.addInitialTask();
      }
      
      window.multiTaskManager.startUpdateTimer();
      console.log('📋 Multi-task manager initialized');
    } else {
      console.warn('⚠️ Multi-task manager elements not found');
    }
  }
  
  checkNicknameExists() {
    const savedNickname = localStorage.getItem('userNickname');
    if (savedNickname) {
      this.currentNickname = savedNickname;
      this.storageKey = this.getStorageKeyForDate(new Date()); // Use date-specific key
      this.updateNicknameDisplay();
      
      // Identify existing user for analytics
      if (window.analytics) {
        window.analytics.identify(savedNickname);
        window.analytics.trackUserLogin(savedNickname);
      }
      
      return true;
    }
    return false;
  }
  
  // Helper methods for date-specific storage
  getStorageKeyForDate(date) {
    const dateStr = this.formatDateForStorage(date);
    return `timeTracker_${this.currentNickname}_${dateStr}`;
  }
  
  formatDateForStorage(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  getAllStorageDates() {
    if (!this.currentNickname) return [];
    
    const dates = [];
    const prefix = `timeTracker_${this.currentNickname}_`;
    
    // Scan localStorage for all keys matching this user
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const dateStr = key.substring(prefix.length);
        // Validate date format YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          dates.push(dateStr);
        }
      }
    }
    
    return dates.sort(); // Sort chronologically
  }
  
  getDataForDate(dateStr) {
    const key = `timeTracker_${this.currentNickname}_${dateStr}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(`Error parsing data for ${dateStr}:`, e);
        return null;
      }
    }
    return null;
  }
  
  showNicknameModal() {
    this.elements.nicknameModal.style.display = 'flex';
    this.elements.nicknameModal.classList.add('visible');
    this.elements.nicknameInput.focus();
    
    // Add event listeners for nickname modal
    this.setupNicknameEventListeners();
  }
  
  hideNicknameModal() {
    this.elements.nicknameModal.classList.remove('visible');
    setTimeout(() => {
      this.elements.nicknameModal.style.display = 'none';
    }, 300);
  }
  
  setupNicknameEventListeners() {
    // Confirm button
    this.elements.nicknameConfirmBtn.addEventListener('click', () => {
      this.registerNickname();
    });
    
    // Mobile touch support
    this.elements.nicknameConfirmBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.registerNickname();
    });
    
    // Enter key support
    this.elements.nicknameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.registerNickname();
      }
    });
  }
  
  registerNickname() {
    const nickname = this.elements.nicknameInput.value.trim();
    
    if (!nickname) {
      alert('닉네임을 입력해주세요!');
      return;
    }
    
    if (nickname.length < 2) {
      alert('닉네임은 2글자 이상 입력해주세요!');
      return;
    }
    
    // Save nickname
    this.currentNickname = nickname;
    this.storageKey = `timeTracker_${nickname}`;
    localStorage.setItem('userNickname', nickname);
    
    // Track user registration
    if (window.analytics) {
      window.analytics.identify(nickname);
      window.analytics.trackUserRegistration(nickname);
    }
    
    // Update display
    this.updateNicknameDisplay();
    
    // Hide modal and initialize app
    this.hideNicknameModal();
    
    // Reset app data for new user
    this.resetAppForNewUser();
    this.initializeApp();
    
    console.log(`👋 Welcome ${nickname}! Your data will be saved under this nickname.`);
  }
  
  updateNicknameDisplay() {
    if (this.elements.userNickname && this.currentNickname) {
      this.elements.userNickname.textContent = this.currentNickname;
    }
    if (this.elements.dropdownNickname && this.currentNickname) {
      this.elements.dropdownNickname.textContent = this.currentNickname;
    }
  }
  
  resetAppForNewUser() {
    // Reset all data for new user
    this.timeData = {};
    // totalTime is calculated dynamically, no need to reset
    this.currentSessionTime = 0;
    this.taskSessions = {};
    this.taskTagSessions = {};
    this.taskHistory = [];
    this.currentTaskName = "";
    this.currentTaskTags = [];
    
    // Reset recording state
    this.isRecording = false;
    this.currentStartTime = null;
    this.currentHour = null;
    this.currentStartMinute = null;
    
    // Clear any intervals
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    // Reset timeline order
    this.timelineOrder = this.generateTimelineOrder();
    
    console.log('🔄 App reset for new user:', this.currentNickname);
  }
  
  setupProfileMenu() {
    if (!this.elements.profileButton || !this.elements.profileDropdown || !this.elements.logoutBtn) {
      return;
    }
    
    // Prevent duplicate event listeners
    if (this.profileMenuSetup) {
      return;
    }
    this.profileMenuSetup = true;
    
    // Profile button click to toggle dropdown
    this.elements.profileButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleProfileDropdown();
    });
    
    // Mobile touch support
    this.elements.profileButton.addEventListener('touchend', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleProfileDropdown();
    });
    
    // Logout button
    this.elements.logoutBtn.addEventListener('click', () => {
      this.logout();
    });
    
    // Mobile touch support for logout
    this.elements.logoutBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.logout();
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.elements.profileButton.contains(e.target) && 
          !this.elements.profileDropdown.contains(e.target)) {
        this.hideProfileDropdown();
      }
    });
  }
  
  toggleProfileDropdown() {
    if (this.elements.profileDropdown.classList.contains('visible')) {
      this.hideProfileDropdown();
    } else {
      this.showProfileDropdown();
    }
  }
  
  showProfileDropdown() {
    this.elements.profileDropdown.classList.add('visible');
  }
  
  hideProfileDropdown() {
    this.elements.profileDropdown.classList.remove('visible');
  }
  
  logout() {
    // Confirm logout
    if (confirm('정말 로그아웃하시겠습니까? 현재 진행 중인 작업이 있다면 저장됩니다.')) {
      console.log('👋 Logging out user:', this.currentNickname);
      
      // Track user logout
      if (window.analytics && this.currentNickname) {
        window.analytics.trackUserLogout(this.currentNickname);
      }
      
      // Stop any active recording
      if (this.isRecording) {
        this.stopRecording();
      }
      
      // Clear nickname from localStorage
      localStorage.removeItem('userNickname');
      
      // Reset app state
      this.currentNickname = null;
      this.storageKey = 'timeTracker';
      
      // Hide profile dropdown
      this.hideProfileDropdown();
      
      // Reset app for logout
      this.resetAppForNewUser();
      
      // Reset UI elements
          if (this.elements.currentTaskNameDisplay) {
      this.elements.currentTaskNameDisplay.textContent = "작업을 시작하세요";
      this.elements.currentTaskNameDisplay.classList.remove("recording");
    }
    if (this.elements.recordButton) {
      this.elements.recordButton.classList.remove('recording');
      this.elements.recordButton.innerHTML = `<svg class="record-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><polygon points="10,8 16,12 10,16 10,8"></polygon></svg>시작`;
    }
      
      // Show nickname modal again
      this.showNicknameModal();
      
      console.log('✅ Logout complete - ready for new user');
    }
  }
  
  generateTimeline() {
    const timeline = this.elements.timeline;
    timeline.innerHTML = '';
    
    // Only show the current hour
    const currentHour = this.getCurrentHour();
    
    const timelineItem = document.createElement('div');
    timelineItem.className = 'timeline-item';
    timelineItem.dataset.hour = currentHour;
    timelineItem.draggable = false; // Disable dragging since we only show one item
    
    const timeString = this.formatHour(currentHour);
    
    // Create 60 minute blocks
    const minuteBlocks = [];
    for (let minute = 0; minute < 60; minute++) {
      minuteBlocks.push(`<div class="minute-block" data-minute="${minute}"></div>`);
    }
    
    timelineItem.innerHTML = `
      <div class="timeline-time">${timeString}</div>
      <div class="timeline-content">
        <div class="timeline-duration" id="duration-${currentHour}">00:00:00</div>
        <div class="progress-container">
          <div class="minute-grid" id="minutes-${currentHour}">
            ${minuteBlocks.join('')}
          </div>
        </div>
      </div>
    `;
    
    timeline.appendChild(timelineItem);
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
    // Skip record button event listener as we now use MultiTaskManager
    if (this.elements.recordButton) {
      this.elements.recordButton.addEventListener('click', () => {
        if (this.isRecording) {
          this.stopRecording();
        } else {
          this.showTaskModal(); // Show modal before starting recording
        }
      });
    }

    if (this.elements.taskCancelBtn) {
      this.elements.taskCancelBtn.addEventListener('click', () => {
        this.currentTaskTags = []; // Clear tags when cancelling
        this.hideTaskModal();
      });
    }

    if (this.elements.taskConfirmBtn) {
      this.elements.taskConfirmBtn.addEventListener('click', (e) => {
        console.log('🖱️ Task confirm button clicked');
        e.preventDefault();
        this.startRecordingWithTask();
      });
      
      this.elements.taskConfirmBtn.addEventListener('touchend', (e) => {
        console.log('👆 Task confirm button touched');
        e.preventDefault();
        this.startRecordingWithTask();
      });
    }
    
    if (this.elements.taskNameInput) {
      this.elements.taskNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.startRecordingWithTask();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          this.hideTaskModal();
        }
      });
    }

    if (this.elements.taskNameModal) {
      this.elements.taskNameModal.addEventListener('click', (e) => {
        if (e.target === this.elements.taskNameModal) {
          this.hideTaskModal();
        }
      });
    }

    // Tag functionality event listeners
    if (this.elements.addCustomTagBtn) {
      this.elements.addCustomTagBtn.addEventListener('click', () => {
        this.addCustomTag();
      });

      this.elements.addCustomTagBtn.addEventListener('touchend', (e) => {
        console.log('👆 Add custom tag button touched');
        e.preventDefault();
        this.addCustomTag();
      });
    }

    if (this.elements.customTagInput) {
      this.elements.customTagInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.addCustomTag();
        }
      });
    }

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
    console.log('📱 Modal opened on device');
    console.log('📱 Task confirm button element:', this.elements.taskConfirmBtn);
    console.log('📱 Button disabled state:', this.elements.taskConfirmBtn?.disabled);
    
    if (this.elements.taskNameModal) {
      this.elements.taskNameModal.classList.add('visible');
      
      // Add fallback touch handling for mobile
      this.elements.taskNameModal.addEventListener('touchend', (e) => {
        if (e.target.id === 'task-confirm-btn' || e.target.closest('#task-confirm-btn')) {
          console.log('📱 Fallback touch handler triggered');
          e.preventDefault();
          this.startRecordingWithTask();
        }
      });
    }
    
    if (this.elements.taskNameInput) {
      this.elements.taskNameInput.value = '';
      this.elements.taskNameInput.focus();
    }
    
    this.currentTaskTags = [];
    this.updateSelectedTags();
    this.resetPredefinedTags();
    
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
      // Silently skip visual update - tags are still tracked internally
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
  
  getTaskColor(taskName) {
    // Return default color if no task name
    if (!taskName) {
      return '#ED5000'; // Default orange
    }
    
    // Check if we already assigned a color to this task
    if (this.taskColorMapping[taskName]) {
      return this.taskColorMapping[taskName];
    }
    
    // Assign a new color from the palette
    const color = this.taskColorPalette[this.taskColorIndex % this.taskColorPalette.length];
    this.taskColorMapping[taskName] = color;
    this.taskColorIndex++;
    
    console.log(`🎨 Assigned color ${color} to task "${taskName}"`);
    
    return color;
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

  startTrackingWithTodoTitle(todoTitle) {
    console.log('📋 Starting tracking with todo title:', todoTitle);
    
    // Use MultiTaskManager to create a new task and start recording
    if (window.multiTaskManager) {
      // Add a new task with the todo title
      const taskId = window.multiTaskManager.addNewTask(todoTitle);
      
      // Start recording on this task immediately
      window.multiTaskManager.startTaskRecording(taskId);
      
      console.log('✅ Todo tracking started successfully with task ID:', taskId);
    } else {
      console.error('❌ MultiTaskManager not found');
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
    
    // Note: Analytics tracking is handled by MultiTaskManager to avoid duplicates
    
    // Debug: Check tags after setting recording state
    console.log('🔍 Tags after setting recording state:', this.currentTaskTags);
    
    // Initialize current hour data
    this.initializeCurrentHourProgress();
    
    // Debug: Check tags after initializeCurrentHourProgress
    console.log('🔍 Tags after initializeCurrentHourProgress:', this.currentTaskTags);
    
    // Update UI
    if (this.elements.recordButton) {
      this.elements.recordButton.classList.add('recording');
      this.elements.recordButton.innerHTML = `<svg class="record-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="6" y="6" width="12" height="12"></rect></svg>정지`;
    }
    if (this.elements.statusDot) this.elements.statusDot.classList.add('recording');
    if (this.elements.statusText) this.elements.statusText.textContent = '기록 중';
    if (this.elements.currentTaskNameDisplay) {
      this.elements.currentTaskNameDisplay.textContent = this.currentTaskName;
      this.elements.currentTaskNameDisplay.classList.add('recording');
    }
    
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
    // Handle cross-hour recordings properly
    const startDate = new Date(this.currentStartTime);
    const endDate = new Date(endTime);
    
    let currentTime = this.currentStartTime;
    
    while (currentTime < endTime) {
      const date = new Date(currentTime);
      const hour = date.getHours();
      const minute = date.getMinutes();
      
      // Initialize hour data if needed
      if (!this.taskSessions[hour]) {
        this.taskSessions[hour] = {};
      }
      if (!this.taskTagSessions[hour]) {
        this.taskTagSessions[hour] = {};
      }
      
      // Store task name and tags for this minute
      this.taskSessions[hour][minute] = this.currentTaskName;
      this.taskTagSessions[hour][minute] = [...this.currentTaskTags];
      
      // Debug: Log what's being saved
      console.log(`💾 Saving for minute ${minute} in hour ${hour}:`, {
        taskName: this.currentTaskName,
        tags: [...this.currentTaskTags],
        hour: hour
      });
      
      // Move to next minute
      currentTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute + 1, 0, 0).getTime();
    }
    
    // Note: Analytics tracking is handled by MultiTaskManager to avoid duplicates
    
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
    if (this.elements.recordButton) {
      this.elements.recordButton.classList.remove('recording');
      this.elements.recordButton.innerHTML = `<svg class="record-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><polygon points="10,8 16,12 10,16 10,8"></polygon></svg>시작`;
    }
    if (this.elements.statusDot) this.elements.statusDot.classList.remove('recording');
    if (this.elements.statusText) this.elements.statusText.textContent = '대기 중';
    if (this.elements.currentTime) this.elements.currentTime.textContent = '00:00:00';
    if (this.elements.currentTaskNameDisplay) {
      this.elements.currentTaskNameDisplay.textContent = '작업을 시작하세요';
      this.elements.currentTaskNameDisplay.classList.remove('recording');
    }
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
  
  distributeSessionTime(sessionTime, customStartTime = null) {
    const startTime = customStartTime || this.currentStartTime;
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
      // Store task names for the completed hour session
      const prevHour = this.currentHour;
      const prevStartMinute = this.currentStartMinute;
      const prevEndMinute = 59; // End of previous hour
      
      // Initialize hour data if needed
      if (!this.taskSessions[prevHour]) {
        this.taskSessions[prevHour] = {};
      }
      if (!this.taskTagSessions[prevHour]) {
        this.taskTagSessions[prevHour] = {};
      }
      
      // Store task name for all minutes in the previous hour session
      for (let m = prevStartMinute; m <= prevEndMinute; m++) {
        this.taskSessions[prevHour][m] = this.currentTaskName;
        this.taskTagSessions[prevHour][m] = [...this.currentTaskTags];
        
        console.log(`💾 Hour transition - saving minute ${m} in hour ${prevHour}:`, {
          taskName: this.currentTaskName,
          tags: [...this.currentTaskTags]
        });
      }
      
      // Distribute current session time and start fresh
      this.distributeSessionTime(this.currentSessionTime);
      
      // Start new session for new hour
      this.currentHour = currentHour;
      this.currentStartTime = now;
      this.currentSessionTime = 0;
      this.currentStartMinute = this.getCurrentMinute();
      
      this.initializeCurrentHourProgress();
    }
    
    this.updateDisplay();
  }
  
  calculateTotalTimeFromData() {
    // Calculate total time from all recorded minutes in timeData
    let total = 0;
    
    // Sum up all recorded time from all hours
    Object.keys(this.timeData).forEach(hour => {
      const hourData = this.timeData[hour];
      if (hourData && Array.isArray(hourData)) {
        total += hourData.reduce((sum, minuteTime) => sum + minuteTime, 0);
      }
    });
    
    // Add current session time if recording
    if (this.isRecording && this.currentSessionTime > 0) {
      total += this.currentSessionTime;
    }
    
    return total;
  }
  
  updateDisplay() {
    // Update current session time
    if (this.elements.currentTime) {
      this.elements.currentTime.textContent = this.formatTime(this.currentSessionTime);
    }
    
    // Calculate and update total time from actual recorded minute data
    const calculatedTotalTime = this.calculateTotalTimeFromData();
    if (this.elements.totalTime) {
      this.elements.totalTime.textContent = this.formatTime(calculatedTotalTime);
    }
    
    // Update timeline items - only current hour
    const currentHour = this.getCurrentHour();
    const hourData = this.timeData[currentHour] || new Array(60).fill(0);
    const totalDuration = hourData.reduce((sum, minuteTime) => sum + minuteTime, 0);
    
    // Update duration display
    const durationElement = document.getElementById(`duration-${currentHour}`);
    if (durationElement) {
      let displayDuration = totalDuration;
      
      // Add current session time if recording
      if (this.isRecording && currentHour === this.currentHour) {
        displayDuration += this.currentSessionTime;
      }
      
      durationElement.textContent = this.formatTime(displayDuration);
    }
    
    // Update minute blocks
    const minuteGrid = document.getElementById(`minutes-${currentHour}`);
    if (minuteGrid) {
        const minuteBlocks = minuteGrid.querySelectorAll('.minute-block');
        
        minuteBlocks.forEach((block, minute) => {
          const minuteTime = hourData[minute] || 0;
          let displayTime = minuteTime;
          
          // Get task name for this minute
          const minuteTaskName = (this.taskSessions[currentHour] && this.taskSessions[currentHour][minute]) || null;
          let taskColor = '#ED5000'; // Default orange color
          

          
          // Add current session contribution if recording
          if (this.isRecording && currentHour === this.currentHour) {
            const currentMinute = this.getCurrentMinute();
            if (minute === currentMinute) {
              // Add partial current session time for current minute
              const sessionInCurrentMinute = this.currentSessionTime % 60000; // Time in current minute
              displayTime += sessionInCurrentMinute;
              // Use current task color
              taskColor = this.getTaskColor(this.currentTaskName);
              console.log(`Current minute ${minute} - task:`, this.currentTaskName, `Color:`, taskColor);
            } else if (minute > this.currentStartMinute && minute < currentMinute) {
              // Full minutes between start and current
              displayTime += 60000; // Full minute
              // Use current task color
              taskColor = this.getTaskColor(this.currentTaskName);
              console.log(`Past minute ${minute} - task:`, this.currentTaskName, `Color:`, taskColor);
            } else if (minuteTaskName) {
              // Use stored task color
              taskColor = this.getTaskColor(minuteTaskName);
            }
          } else if (minuteTaskName) {
            // Use stored task color
            taskColor = this.getTaskColor(minuteTaskName);
          }
          
          // Calculate fill percentage (0-100% per minute)
          const fillPercentage = Math.min((displayTime / 60000) * 100, 100);
          
          // Update block appearance
          if (fillPercentage > 0) {
            block.style.background = `linear-gradient(to right, ${taskColor} ${fillPercentage}%, var(--neutral-80) ${fillPercentage}%)`;
            block.classList.add('has-time');
          } else {
            block.style.background = 'var(--neutral-80)';
            block.classList.remove('has-time');
          }
          
          // Highlight current minute if recording
          if (this.isRecording && currentHour === this.currentHour && minute === this.getCurrentMinute()) {
            block.classList.add('current-minute');
          } else {
            block.classList.remove('current-minute');
          }
        });
      }
      
      // Highlight current hour if recording
      const timelineItem = document.querySelector(`[data-hour="${currentHour}"]`);
      if (timelineItem) {
        if (this.isRecording && currentHour === this.currentHour) {
          timelineItem.classList.add('active');
        } else {
          timelineItem.classList.remove('active');
        }
      }
  }
  
  saveData() {
    const today = new Date();
    const dateStr = this.formatDateForStorage(today);
    const storageKey = this.getStorageKeyForDate(today);
    
    const data = {
      date: dateStr, // Store the date this data belongs to
      timeData: this.timeData,
      // totalTime is now calculated dynamically from timeData
      timelineOrder: this.timelineOrder,
      taskSessions: this.taskSessions, // Save task sessions
      taskTagSessions: this.taskTagSessions, // Save task tag sessions
      taskHistory: this.taskHistory, // Save task history
      taskColorMapping: this.taskColorMapping, // Save task color assignments
      taskColorIndex: this.taskColorIndex, // Save color index
      lastSaved: Date.now(),
      // Save active recording state for recovery
      activeRecording: this.isRecording ? {
        startTime: this.currentStartTime,
        taskName: this.currentTaskName,
        taskTags: [...this.currentTaskTags],
        startHour: this.currentHour,
        startMinute: this.currentStartMinute
      } : null
    };
    
    localStorage.setItem(storageKey, JSON.stringify(data));
    console.log(`💾 Data saved for ${dateStr}`);
  }
  
  loadData() {
    const today = new Date();
    const dateStr = this.formatDateForStorage(today);
    const storageKey = this.getStorageKeyForDate(today);
    const saved = localStorage.getItem(storageKey);
    
    if (saved) {
      try {
        const data = JSON.parse(saved);
        
        // Load today's data
        this.timeData = data.timeData || {};
        // totalTime is now calculated dynamically from timeData
        this.timelineOrder = this.generateTimelineOrder();
        this.taskSessions = data.taskSessions || {}; // Load task sessions
        this.taskHistory = data.taskHistory || []; // Load task history          
        this.taskTagSessions = data.taskTagSessions || {}; // Load task tag sessions
        this.taskColorMapping = data.taskColorMapping || {}; // Load task color assignments
        this.taskColorIndex = data.taskColorIndex || 0; // Load color index
        
        // Check for interrupted recording session and recover it
        this.recoverInterruptedSession(data.activeRecording);
        
        this.updateDisplay();
        this.updateTaskLabels(); // Update labels after loading
        
        console.log(`📂 Loaded data for ${dateStr}`);
      } catch (e) {
        console.error('Error loading saved data:', e);
        // Start with fresh data but don't delete historical data
        this.resetData();
      }
    } else {
      console.log(`📂 No data found for ${dateStr}, starting fresh`);
      // No data for today yet, start fresh (but don't delete historical data)
    }
  }
  
  recoverInterruptedSession(activeRecording) {
    if (!activeRecording) return;
    
    const now = Date.now();
    const timeSinceStart = now - activeRecording.startTime;
    
    // Only recover if the interruption was recent (within 24 hours)
    if (timeSinceStart > 24 * 60 * 60 * 1000) {
      console.log('🔄 Interrupted session too old, not recovering');
      return;
    }
    
    console.log('🔄 Recovering interrupted session:', {
      taskName: activeRecording.taskName,
      timeSinceStart: this.formatTime(timeSinceStart),
      tags: activeRecording.taskTags
    });
    
    // Distribute the interrupted session time across minutes
    this.distributeSessionTime(timeSinceStart, activeRecording.startTime);
    
    // Store task names and tags for the interrupted session
    this.storeInterruptedSessionTasks(activeRecording, timeSinceStart);
    
    console.log(`✅ Recovered ${this.formatTime(timeSinceStart)} of interrupted session`);
  }
  
  storeInterruptedSessionTasks(activeRecording, sessionTime) {
    const startTime = activeRecording.startTime;
    const endTime = startTime + sessionTime;
    let currentTime = startTime;
    
    while (currentTime < endTime) {
      const date = new Date(currentTime);
      const hour = date.getHours();
      const minute = date.getMinutes();
      
      // Initialize hour data if needed
      if (!this.taskSessions[hour]) {
        this.taskSessions[hour] = {};
      }
      if (!this.taskTagSessions[hour]) {
        this.taskTagSessions[hour] = {};
      }
      
      // Store task name and tags for this minute
      this.taskSessions[hour][minute] = activeRecording.taskName;
      this.taskTagSessions[hour][minute] = [...activeRecording.taskTags];
      
      // Move to next minute
      currentTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute + 1, 0, 0).getTime();
    }
  }

  resetData() {
    this.timeData = {};
    // totalTime is calculated dynamically, no need to reset
    this.timelineOrder = this.generateTimelineOrder();
    this.taskSessions = {}; // Clear task sessions
    this.taskTagSessions = {}; // Clear task tag sessions
    this.taskColorMapping = {}; // Clear task color assignments
    this.taskColorIndex = 0; // Reset color index
    this.currentTaskName = "";
    this.currentTaskTags = [];
    if (this.elements.currentTaskNameDisplay) {
      this.elements.currentTaskNameDisplay.textContent = "작업을 시작하세요";
      this.elements.currentTaskNameDisplay.classList.remove("recording");
    }
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
    
    // Initialize taskHistory if undefined
    if (!this.taskHistory) {
      this.taskHistory = [];
    }
    
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

    // Initialize taskHistory if undefined
    if (!this.taskHistory) {
      this.taskHistory = [];
    }

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
    this.currentDate = new Date();
    // Default to today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.selectedDate = today;
    this.initializeAnalytics();
  }

  initializeAnalytics() {
    // Initialize calendar
    this.initializeCalendar();

    // Initial data load - will show today's data by default
    this.updateAnalytics();
  }

  initializeCalendar() {
    // Set up navigation buttons
    const prevBtn = document.getElementById('prev-month-btn');
    const nextBtn = document.getElementById('next-month-btn');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.selectedDate = null; // Clear selected date when changing months
        this.renderCalendar();
        this.updateMonthMetrics(); // Update time metrics for new month
        
        // Track month change
        if (window.analytics) {
          window.analytics.trackCalendarMonthChanged(
            this.currentDate.getFullYear(),
            this.currentDate.getMonth()
          );
        }
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.selectedDate = null; // Clear selected date when changing months
        this.renderCalendar();
        this.updateMonthMetrics(); // Update time metrics for new month
        
        // Track month change
        if (window.analytics) {
          window.analytics.trackCalendarMonthChanged(
            this.currentDate.getFullYear(),
            this.currentDate.getMonth()
          );
        }
      });
    }
    
    // Render initial calendar
    this.renderCalendar();
    this.updateMonthMetrics(); // Initialize monthly summary
  }

  renderCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // Update title
    const title = document.getElementById('calendar-title');
    if (title) {
      title.textContent = `${year}년 ${month + 1}월`;
    }
    
    // Get calendar data
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const prevLastDay = new Date(year, month, 0);
    
    const firstDayOfWeek = firstDay.getDay();
    const lastDate = lastDay.getDate();
    const prevLastDate = prevLastDay.getDate();
    
    // Build calendar grid
    const calendarGrid = document.getElementById('calendar-grid');
    if (!calendarGrid) return;
    
    let daysHTML = '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Previous month days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = prevLastDate - i;
      daysHTML += `
        <div class="calendar-day other-month">
          <span class="calendar-day-number">${day}</span>
        </div>
      `;
    }
    
    // Current month days
    for (let day = 1; day <= lastDate; day++) {
      const date = new Date(year, month, day);
      date.setHours(0, 0, 0, 0);
      
      const isToday = date.getTime() === today.getTime();
      const isSelected = this.selectedDate && date.getTime() === this.selectedDate.getTime();
      
      // Check if this date has recorded time
      const dateKey = this.getDateKey(date);
      const dayTime = this.getDayTotalTime(date);
      const studyTime = this.getDayStudyTime(date);
      const hasData = dayTime > 0;
      
      // Calculate heat level based on study time
      const heatLevel = this.getHeatLevel(studyTime);
      
      let classes = 'calendar-day';
      if (isToday) classes += ' today';
      if (isSelected) classes += ' selected';
      if (hasData) classes += ' has-data';
      classes += ` heat-${heatLevel}`;
      
      daysHTML += `
        <div class="${classes}" data-date="${dateKey}">
          <span class="calendar-day-number">${day}</span>
          ${hasData ? `<span class="calendar-day-time">${this.formatCalendarTime(studyTime)}</span>` : ''}
        </div>
      `;
    }
    
    // Next month days
    const remainingDays = 42 - (firstDayOfWeek + lastDate);
    for (let day = 1; day <= remainingDays; day++) {
      daysHTML += `
        <div class="calendar-day other-month">
          <span class="calendar-day-number">${day}</span>
        </div>
      `;
    }
    
    calendarGrid.innerHTML = daysHTML;
    
    // Add click listeners to calendar days
    calendarGrid.querySelectorAll('.calendar-day:not(.other-month)').forEach(dayEl => {
      dayEl.addEventListener('click', () => {
        const dateKey = dayEl.dataset.date;
        this.selectDate(dateKey);
      });
    });
  }

  getDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  getDayTotalTime(date) {
    const dateStr = this.timeTracker.formatDateForStorage(date);
    const dayData = this.timeTracker.getDataForDate(dateStr);
    
    if (!dayData) return 0;
    
    // Aggregate time from all hours of this date
    let totalTime = 0;
    const timeData = dayData.timeData || {};
    Object.keys(timeData).forEach(hour => {
      const hourData = timeData[hour];
      if (hourData && Array.isArray(hourData)) {
        totalTime += hourData.reduce((sum, minuteTime) => sum + minuteTime, 0);
      }
    });
    
    return totalTime;
  }

  getDayStudyTime(date) {
    const dateStr = this.timeTracker.formatDateForStorage(date);
    const dayData = this.timeTracker.getDataForDate(dateStr);
    
    if (!dayData) return 0;
    
    // Aggregate study time (공부 category) from recorded data
    let studyTime = 0;
    const timeData = dayData.timeData || {};
    const taskSessions = dayData.taskSessions || {};
    
    Object.keys(timeData).forEach(hour => {
      const hourData = timeData[hour];
      const hourTaskSessions = taskSessions[hour] || {};
      
      hourData.forEach((minuteTime, minute) => {
        if (minuteTime > 0) {
          const taskName = hourTaskSessions[minute];
          if (taskName) {
            // Check task category - default to 공부 if not found
            let taskCategory = '공부';
            if (window.multiTaskManager) {
              window.multiTaskManager.tasks.forEach((task) => {
                if (task.name === taskName) {
                  taskCategory = task.category || '공부';
                }
              });
            }
            
            if (taskCategory === '공부') {
              studyTime += minuteTime;
            }
          }
        }
      });
    });
    
    return studyTime;
  }

  getHeatLevel(studyTimeMs) {
    const hours = studyTimeMs / 3600000;
    
    if (hours === 0) return 0;           // 0 hours: no color
    if (hours <= 0.5) return 1;          // 0-0.5 hours
    if (hours <= 1) return 2;            // 0.5-1 hours
    if (hours <= 1.5) return 3;          // 1-1.5 hours
    if (hours <= 2) return 4;            // 1.5-2 hours
    if (hours <= 2.5) return 5;          // 2-2.5 hours
    if (hours <= 3) return 6;            // 2.5-3 hours
    if (hours <= 4) return 7;            // 3-4 hours
    if (hours <= 5) return 8;            // 4-5 hours
    return 9;                            // 5+ hours
  }

  formatCalendarTime(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    
    if (hours > 0) {
      return `${hours}h`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    }
    return '';
  }

  selectDate(dateKey) {
    const [year, month, day] = dateKey.split('-').map(Number);
    this.selectedDate = new Date(year, month - 1, day);
    this.selectedDate.setHours(0, 0, 0, 0);
    
    // Get study time for this date
    const studyTime = this.getDayStudyTime(this.selectedDate);
    
    // Track date selection
    if (window.analytics) {
      window.analytics.trackCalendarDateSelected(dateKey, studyTime);
    }
    
    // Re-render calendar to show selection
    this.renderCalendar();
    
    // Update analytics to show data for selected date
    this.updateAnalytics();
    
    console.log('📅 Selected date:', dateKey, 'Updating analytics for this specific date');
  }

  resetToToday() {
    // Reset to today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    this.selectedDate = today;
    
    // Update current date to today's month if different
    const todayMonth = today.getMonth();
    const todayYear = today.getFullYear();
    if (this.currentDate.getMonth() !== todayMonth || this.currentDate.getFullYear() !== todayYear) {
      this.currentDate = new Date(todayYear, todayMonth, 1);
    }
    
    // Re-render calendar to show today selected
    this.renderCalendar();
    
    // Update analytics to show today's data
    this.updateAnalytics();
    
    // Update monthly summary
    this.updateMonthMetrics();
    
    console.log('📅 Reset to today:', this.getDateKey(today));
  }

  updateMonthMetrics() {
    // Update only the time metrics for the current month (without timeline/task summary)
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // Get first and last day of the month
    const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
    
    console.log('📅 Updating metrics for month:', `${year}-${month + 1}`);
    
    const data = this.aggregateData(startOfMonth, endOfMonth);
    this.updateTimeMetrics(data);
    this.updateMonthlySummary(data); // Update monthly cumulative time
  }
  
  updateMonthlySummary(data) {
    // Update monthly cumulative time display
    const totalTime = data.totalTime || 0;
    const studyTime = data.categories['공부'] || 0;
    
    const monthlyTotalElement = document.getElementById('monthly-total-time');
    const monthlyStudyElement = document.getElementById('monthly-study-time');
    
    if (monthlyTotalElement) {
      monthlyTotalElement.textContent = this.timeTracker.formatTime(totalTime);
    }
    
    if (monthlyStudyElement) {
      monthlyStudyElement.textContent = this.timeTracker.formatTime(studyTime);
    }
    
    console.log(`📊 Monthly Summary - Total: ${this.timeTracker.formatTime(totalTime)}, Study: ${this.timeTracker.formatTime(studyTime)}`);
  }

  updateAnalytics() {
    const data = this.getAnalyticsData();
    this.updateSectionTitles();
    this.updateTimeMetrics(data);
    this.updateTimelineReplica(data);
    this.updateTaskSummary(data);
    
    // Refresh calendar to update heatmap
    this.renderCalendar();
  }

  updateSectionTitles() {
    // Update section titles based on selected date
    const replicaTitle = document.getElementById('replica-title');
    const taskSummaryTitle = document.getElementById('task-summary-title');
    
    if (this.selectedDate) {
      // Show date-specific titles (without year)
      const month = this.selectedDate.getMonth() + 1;
      const day = this.selectedDate.getDate();
      
      if (replicaTitle) {
        replicaTitle.textContent = `${month}월 ${day}일 타임라인`;
      }
      if (taskSummaryTitle) {
        taskSummaryTitle.textContent = `${month}월 ${day}일 작업별 시간 요약`;
      }
    } else {
      // Show default titles for month view
      if (replicaTitle) {
        replicaTitle.textContent = '기간별 타임라인';
      }
      if (taskSummaryTitle) {
        taskSummaryTitle.textContent = '작업별 시간 요약';
      }
    }
  }

  getAnalyticsData() {
    // If a specific date is selected, show data only for that date
    if (this.selectedDate) {
      const startOfDay = new Date(this.selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(this.selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      console.log('📅 Getting analytics for selected date:', this.getDateKey(this.selectedDate));
      return this.aggregateData(startOfDay, endOfDay);
    }
    
    // Otherwise, use current month
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
    
    console.log('📅 Getting analytics for month:', `${year}-${month + 1}`);
    return this.aggregateData(startOfMonth, endOfMonth);
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

    // Get all dates in the range
    const startDay = new Date(startDate);
    startDay.setHours(0, 0, 0, 0);
    const endDay = new Date(endDate);
    endDay.setHours(23, 59, 59, 999);
    
    console.log('📊 Aggregating data:', {
      period: this.currentPeriod,
      startDate: startDate.toDateString(),
      endDate: endDate.toDateString()
    });

    // Load data for each date in the range
    let currentDay = new Date(startDay);
    const datesProcessed = [];
    
    while (currentDay <= endDay) {
      const dateStr = this.timeTracker.formatDateForStorage(currentDay);
      const dayData = this.timeTracker.getDataForDate(dateStr);
      
      if (dayData) {
        datesProcessed.push(dateStr);
        console.log(`📊 Processing data for ${dateStr}`);
        
        // Aggregate data from this date
        const timeData = dayData.timeData || {};
        const taskSessions = dayData.taskSessions || {};
        const tagSessions = dayData.taskTagSessions || {};
        
        Object.keys(timeData).forEach(hour => {
          const hourData = timeData[hour];
          const hourTaskSessions = taskSessions[hour] || {};
          const hourTagSessions = tagSessions[hour] || {};

          // Store timeline data for replica (only for selected single date)
          if (this.selectedDate) {
            const selectedDateStr = this.timeTracker.formatDateForStorage(this.selectedDate);
            if (dateStr === selectedDateStr) {
              data.timelineData[hour] = {
                hourData: [...hourData],
                taskSessions: { ...hourTaskSessions },
                tagSessions: { ...hourTagSessions }
              };
            }
          }

          // Sum up total time from minute blocks
          hourData.forEach((minuteTime, minute) => {
            if (minuteTime > 0) {
              data.totalTime += minuteTime;

              // Daily activity - track by actual date
              const dayStr = currentDay.toDateString();
              if (!data.dailyActivity[dayStr]) {
                data.dailyActivity[dayStr] = 0;
              }
              data.dailyActivity[dayStr] += minuteTime;
              
              // Aggregate task data
              const taskName = hourTaskSessions[minute];
              if (taskName) {
                // Get category from MultiTaskManager if available
                let taskCategory = '공부'; // default
                if (window.multiTaskManager) {
                  window.multiTaskManager.tasks.forEach((task) => {
                    if (task.name === taskName) {
                      taskCategory = task.category || '공부';
                    }
                  });
                }
                
                // Count unique tasks
                if (!data.tasks[taskName]) {
                  data.tasks[taskName] = { time: 0, categories: new Set() };
                  data.totalTasks++;
                }
                data.tasks[taskName].time += minuteTime;
                data.tasks[taskName].categories.add(taskCategory);
                
                // Aggregate by categories
                if (!data.categories[taskCategory]) {
                  data.categories[taskCategory] = 0;
                }
                data.categories[taskCategory] += minuteTime;
              }
            }
          });
        });
      }
      
      // Move to next day
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    console.log(`📊 Processed ${datesProcessed.length} dates:`, datesProcessed);

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
    // Update metric labels based on selected date
    const totalTimeLabel = document.getElementById('total-time-label');
    const studyTimeLabel = document.getElementById('study-time-label');
    
    if (this.selectedDate) {
      // Show date-specific labels
      const month = this.selectedDate.getMonth() + 1;
      const day = this.selectedDate.getDate();
      
      if (totalTimeLabel) {
        totalTimeLabel.textContent = `${month}월 ${day}일 전체 시간`;
      }
      if (studyTimeLabel) {
        studyTimeLabel.textContent = `${month}월 ${day}일 순공 시간`;
      }
    } else {
      // Show default labels for month view
      if (totalTimeLabel) {
        totalTimeLabel.textContent = '전체 시간';
      }
      if (studyTimeLabel) {
        studyTimeLabel.textContent = '순공 시간';
      }
    }
    
    // Calculate total time
    const totalTime = data.totalTime;
    document.getElementById('total-time-metric').textContent = this.timeTracker.formatTime(totalTime);

    // Calculate study time (time with "공부" category)
    const studyTime = data.categories['공부'] || 0;
    document.getElementById('study-time-metric').textContent = this.timeTracker.formatTime(studyTime);
    
    // Update reward points
    this.updateRewardPoints(studyTime);
  }
  
  updateRewardPoints(studyTimeMs) {
    // Calculate points: 50 points per 2 minutes of study time
    const studyMinutes = studyTimeMs / (1000 * 60);
    const points = Math.floor((studyMinutes / 3) * 10);
    
    // Update points display
    const pointsElement = document.getElementById('reward-points');
    if (pointsElement) {
      pointsElement.textContent = points.toLocaleString();
    }
    
    // Update progress bar (max at 1000 points)
    const progressFill = document.getElementById('reward-progress-fill');
    if (progressFill) {
      const progressPercent = Math.min((points / 1000) * 100, 100);
      progressFill.style.width = `${progressPercent}%`;
    }
    
    // Check if reward was already claimed today
    const today = new Date();
    const dateStr = this.timeTracker.formatDateForStorage(today);
    const rewardClaimKey = `rewardClaimed_${this.timeTracker.currentNickname}_${dateStr}`;
    const alreadyClaimed = localStorage.getItem(rewardClaimKey) === 'true';
    
    // Update info text based on claim status
    const infoElement = document.getElementById('reward-info');
    if (infoElement) {
      if (alreadyClaimed) {
        infoElement.textContent = '✅ 오늘 수령 완료';
        infoElement.style.color = 'rgba(255, 255, 255, 0.9)';
        infoElement.style.fontWeight = '600';
      } else {
        infoElement.textContent = '1,000p = 네이버 1,000 포인트';
        infoElement.style.color = 'rgba(255, 255, 255, 0.7)';
        infoElement.style.fontWeight = '400';
      }
    }
    
    // Enable/disable claim button
    // Button is enabled only if: points >= 1000 AND not claimed today
    const claimBtn = document.getElementById('reward-claim-btn');
    if (claimBtn) {
      if (points >= 1000 && !alreadyClaimed) {
        claimBtn.disabled = false;
        claimBtn.title = '포인트 받기 (1회 가능)';
      } else if (alreadyClaimed) {
        claimBtn.disabled = true;
        claimBtn.title = '오늘은 이미 받았습니다';
      } else {
        claimBtn.disabled = true;
        claimBtn.title = `${1000 - points}p 더 필요합니다`;
      }
    }
  }
  
  markRewardAsClaimed() {
    // Mark reward as claimed for today
    const today = new Date();
    const dateStr = this.timeTracker.formatDateForStorage(today);
    const rewardClaimKey = `rewardClaimed_${this.timeTracker.currentNickname}_${dateStr}`;
    localStorage.setItem(rewardClaimKey, 'true');
    
    // Update button state immediately
    const claimBtn = document.getElementById('reward-claim-btn');
    if (claimBtn) {
      claimBtn.disabled = true;
      claimBtn.title = '오늘은 이미 받았습니다';
    }
    
    // Update info text immediately
    const infoElement = document.getElementById('reward-info');
    if (infoElement) {
      infoElement.textContent = '✅ 오늘 수령 완료';
      infoElement.style.color = 'rgba(255, 255, 255, 0.9)';
      infoElement.style.fontWeight = '600';
    }
  }

  updateTimelineReplica(data) {
    const replicaContainer = document.getElementById('timeline-replica');
    
    // Update the title to show selected date if applicable
    const replicaTitle = document.querySelector('.replica-title');
    if (replicaTitle) {
      if (this.selectedDate) {
        const dateStr = this.selectedDate.toLocaleDateString('ko-KR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        replicaTitle.textContent = `${dateStr} 타임라인`;
      } else {
        replicaTitle.textContent = '기간별 타임라인';
      }
    }
    
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
        const taskName = hourData.taskSessions[minute] || null;
        let blockStyle = '';
        
        if (hasTime && taskName) {
          const taskColor = this.timeTracker.getTaskColor(taskName);
          const fillPercentage = Math.min((minuteTime / 60000) * 100, 100);
          blockStyle = `style="background: linear-gradient(to right, ${taskColor} ${fillPercentage}%, var(--neutral-80) ${fillPercentage}%);"`;
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
    
    // Get task categories from multiTaskManager
    const taskCategories = new Map();
    if (window.multiTaskManager) {
      window.multiTaskManager.tasks.forEach((task, taskId) => {
        taskCategories.set(task.name, task.category || '기타');
      });
    }
    
    if (Object.keys(data.tasks).length === 0) {
      summaryContainer.innerHTML = '<div class="no-data">데이터가 없습니다</div>';
      return;
    }

    // Sort tasks by time spent (descending order)
    const sortedTasks = Object.entries(data.tasks)
      .sort(([,a], [,b]) => b.time - a.time);

    summaryContainer.innerHTML = sortedTasks.map(([taskName, taskData]) => {
      const currentCategory = taskCategories.get(taskName) || '공부';
      const taskColor = this.timeTracker.getTaskColor(taskName);
      
      return `
        <div class="task-summary-item" data-task-name="${taskName}">
          <div class="task-color-badge" style="background-color: ${taskColor};"></div>
          <div class="task-summary-info">
            <div class="task-summary-name">${taskName}</div>
            <select class="task-summary-category-select" data-task-name="${taskName}">
              <option value="공부" ${currentCategory === '공부' ? 'selected' : ''}>공부</option>
              <option value="이동" ${currentCategory === '이동' ? 'selected' : ''}>이동</option>
              <option value="식사" ${currentCategory === '식사' ? 'selected' : ''}>식사</option>
              <option value="휴식" ${currentCategory === '휴식' ? 'selected' : ''}>휴식</option>
              <option value="기타" ${currentCategory === '기타' ? 'selected' : ''}>기타</option>
            </select>
          </div>
          <div class="task-summary-time">${this.timeTracker.formatTime(taskData.time)}</div>
        </div>
      `;
    }).join('');
    
    // Add event listeners to dropdowns
    this.setupTaskSummaryListeners();
  }
  
  setupTaskSummaryListeners() {
    const selects = document.querySelectorAll('.task-summary-category-select');
    selects.forEach(select => {
      select.addEventListener('change', (e) => {
        const taskName = e.target.dataset.taskName;
        const newCategory = e.target.value;
        
        // Update the category in multiTaskManager
        if (window.multiTaskManager) {
          window.multiTaskManager.tasks.forEach((task, taskId) => {
            if (task.name === taskName) {
              task.category = newCategory;
              window.multiTaskManager.saveTasksData();
              window.multiTaskManager.updateStudyTime();
            }
          });
        }
        
        // Update monthly summary to reflect category change
        this.updateMonthMetrics();
        
        // Update current analytics view (timeline, task summary)
        this.updateAnalytics();
        
        console.log(`📝 Updated task "${taskName}" category to "${newCategory}"`);
      });
    });
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
// AI Todo Recommendation System
// ==============================================

class AITodoManager {
  constructor(timeTracker, navigationManager) {
    this.timeTracker = timeTracker;
    this.navigationManager = navigationManager;
    this.currentRecommendations = [];
    this.currentDiagnosis = null;
    this.initializeAITodo();
    this.loadSavedRecommendations();
  }

  initializeAITodo() {
    const generateBtn = document.getElementById('generate-recommendations');
    if (generateBtn) {
      generateBtn.addEventListener('click', () => {
        this.generateRecommendations();
      });
      
      // Mobile touch support
      generateBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        this.generateRecommendations();
      });
    }
  }

  loadSavedRecommendations() {
    // Load previously generated recommendations from localStorage
    try {
      const saved = localStorage.getItem('aiRecommendations');
      if (saved) {
        const data = JSON.parse(saved);
        this.currentRecommendations = data.recommendations || [];
        this.currentDiagnosis = data.diagnosis || null;
        
        // Display the saved recommendations if they exist
        if (this.currentRecommendations.length > 0) {
          console.log('📋 Loading saved AI recommendations');
          this.displayRecommendations(this.currentRecommendations, this.currentDiagnosis);
        }
      }
    } catch (error) {
      console.error('Error loading saved recommendations:', error);
    }
  }

  saveRecommendations(recommendations, diagnosis) {
    // Save recommendations to localStorage
    try {
      const data = {
        recommendations,
        diagnosis,
        timestamp: Date.now()
      };
      localStorage.setItem('aiRecommendations', JSON.stringify(data));
      console.log('💾 Saved AI recommendations to localStorage');
    } catch (error) {
      console.error('Error saving recommendations:', error);
    }
  }

  async generateRecommendations() {
    const targetExam = document.getElementById('target-exam').value.trim();
    const examDate = document.getElementById('exam-date').value;
    
    // Clear old cached recommendations before generating new ones
    localStorage.removeItem('aiRecommendations');
    console.log('🗑️ Cleared old AI recommendations from cache');
    
    // Log the actual input values submitted
    console.log('📋 Target Exam Input Value:', targetExam);
    console.log('📅 Exam Date Input Value:', examDate);
    
    // Validation
    if (!targetExam) {
      alert('목표 시험을 입력해주세요.');
      return;
    }
    
    if (!examDate) {
      alert('시험 날짜를 선택해주세요.');
      return;
    }
    
    // Check if exam date is in the future
    const today = new Date();
    const selectedDate = new Date(examDate);
    if (selectedDate <= today) {
      alert('시험 날짜는 오늘 이후로 선택해주세요.');
      return;
    }
    
    console.log('🤖 Generating AI recommendations for:', targetExam, examDate);
    this.showLoadingState();
    
    try {
      // Prepare user data for AI analysis
      // Include MultiTaskManager data for accurate task analysis
      const multiTaskData = window.multiTaskManager ? {
        tasks: Array.from(window.multiTaskManager.tasks.values()).map(task => ({
          name: task.name,
          totalTime: task.totalTime,
          category: task.category,
          isRecording: task.isRecording,
          startTime: task.startTime
        }))
      } : { tasks: [] };
      
      // Calculate total time from MultiTaskManager (more accurate)
      let totalTimeMs = 0;
      if (window.multiTaskManager) {
        window.multiTaskManager.tasks.forEach(task => {
          totalTimeMs += task.totalTime;
          if (task.isRecording && task.startTime) {
            totalTimeMs += Date.now() - task.startTime;
          }
        });
      }
      
      // Fallback to TimeTracker if MultiTaskManager has no tasks
      if (totalTimeMs === 0) {
        totalTimeMs = this.timeTracker.calculateTotalTimeFromData();
      }
      
      const userData = {
        timeData: this.timeTracker.timeData,
        taskSessions: this.timeTracker.taskSessions,
        taskTagSessions: this.timeTracker.taskTagSessions,
        taskHistory: this.timeTracker.taskHistory || [],
        totalTime: totalTimeMs,
        multiTaskData: multiTaskData
      };
      
      console.log('📊 Sending userData to AI:');
      console.log('  - totalTime:', userData.totalTime, 'ms =', (userData.totalTime / (1000 * 60 * 60)).toFixed(2), 'hours');
      console.log('  - multiTaskCount:', multiTaskData.tasks.length);
      console.log('  - multiTasks details:');
      multiTaskData.tasks.forEach((task, idx) => {
        const hours = (task.totalTime / (1000 * 60 * 60)).toFixed(2);
        console.log(`    Task ${idx + 1}: "${task.name}" | ${task.totalTime}ms (${hours}h) | Category: ${task.category}`);
      });
      console.log('  - Full multiTaskData:', JSON.stringify(multiTaskData, null, 2));
      
      // Call OpenAI API
      const response = await fetch('/api/generate-study-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetExam,
          examDate,
          userData
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API 호출 실패');
      }
      
      const data = await response.json();
      
      // Track AI recommendation generation
      if (window.analytics) {
        window.analytics.trackAIRecommendationGenerated(targetExam, examDate, data.recommendations.length);
      }
      
      this.displayRecommendations(data.recommendations, data.diagnosis);
      
    } catch (error) {
      console.error('AI recommendation error:', error);
      
      // Track error
      if (window.analytics) {
        window.analytics.trackError('AI Recommendation', error.message, {
          targetExam,
          examDate
        });
      }
      
      this.showErrorState(error.message);
    }
  }

  showLoadingState() {
    const container = document.getElementById('recommendations-container');
    if (container) {
      container.innerHTML = `
        <div class="loading-state">
          <div class="loading-spinner"></div>
          <div class="loading-text">AI가 맞춤형 학습 계획을 생성하고 있습니다...</div>
        </div>
      `;
    }
  }
  
  showErrorState(errorMessage) {
    const container = document.getElementById('recommendations-container');
    if (container) {
      container.innerHTML = `
        <div class="error-state">
          <div class="error-icon">⚠️</div>
          <h3>오류가 발생했습니다</h3>
          <p>${errorMessage}</p>
          <button class="retry-btn" onclick="window.location.reload()">다시 시도</button>
        </div>
      `;
    }
  }

  analyzeUserData() {
    // Analyze user's time tracking data
    const timeData = this.timeTracker.timeData;
    const taskSessions = this.timeTracker.taskSessions;
    const taskHistory = this.timeTracker.taskHistory || [];
    
    // Simple AI logic - generate recommendations based on patterns
    const recommendations = [
      {
        title: "집중 시간 늘리기",
        description: "최근 데이터를 보면 집중 시간이 부족해 보입니다. 25분 집중 + 5분 휴식의 포모도로 기법을 시도해보세요.",
        priority: "높음",
        estimatedTime: "25분",
        category: "생산성"
      },
      {
        title: "규칙적인 휴식 취하기",
        description: "장시간 작업 후 적절한 휴식이 필요합니다. 1시간마다 5-10분씩 휴식을 취해보세요.",
        priority: "중간",
        estimatedTime: "10분",
        category: "건강"
      },
      {
        title: "새로운 기술 학습",
        description: "학습 패턴을 보면 새로운 도전이 필요한 시점입니다. 관심 있는 새로운 기술을 학습해보세요.",
        priority: "낮음",
        estimatedTime: "30분",
        category: "성장"
      }
    ];

    return recommendations;
  }

  displayRecommendations(recommendations, diagnosis) {
    const container = document.getElementById('recommendations-container');
    if (!container) return;

    // Store recommendations for later use
    this.currentRecommendations = recommendations;
    this.currentDiagnosis = diagnosis;
    
    // Save to localStorage for persistence
    this.saveRecommendations(recommendations, diagnosis);

    // Generate diagnosis HTML if available
    let diagnosisHTML = '';
    if (diagnosis) {
      diagnosisHTML = `
        <div class="diagnosis-section">
          <h3 class="diagnosis-title">📊 학습 현황 진단</h3>
          <div class="diagnosis-content">
            ${diagnosis.urgency ? `
            <div class="diagnosis-item urgency-item">
              <h4>⏰ 긴급도 평가</h4>
              <p>${diagnosis.urgency.replace(/\n/g, '<br>')}</p>
            </div>
            ` : ''}
            <div class="diagnosis-item">
              <h4>학습 집중도 분석</h4>
              <p>${diagnosis.studyTimeBalance.replace(/\n/g, '<br>')}</p>
            </div>
            <div class="diagnosis-item">
              <h4>학습 습관 최적화</h4>
              <p>${diagnosis.habitOptimization.replace(/\n/g, '<br>')}</p>
            </div>
          </div>
        </div>
      `;
    }

    const recommendationsHTML = recommendations.map((rec, index) => {
      // Map priority to full Korean text
      const priorityText = rec.priority === '높음' ? '중요도 높음' 
                         : rec.priority === '중간' ? '중요도 중간'
                         : rec.priority === '낮음' ? '중요도 낮음'
                         : rec.priority;
      
      return `
        <div class="recommendation-item clickable" data-todo-index="${index}">
          <div class="recommendation-header">
            <h4 class="recommendation-title">${rec.title}</h4>
            <span class="recommendation-priority" data-priority="${rec.priority}">${priorityText}</span>
          </div>
          <p class="recommendation-description">${rec.description}</p>
          <div class="recommendation-meta">
            <span>예상 시간: ${rec.estimatedTime}</span>
            <span>카테고리: ${rec.category}</span>
            ${rec.improvementEffect ? `<span>개선효과: ${rec.improvementEffect}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      ${diagnosisHTML}
      <div class="recommendations-section">
        <h3 class="recommendations-title">📋 최적화된 학습 계획</h3>
        <div class="recommendations-list">
          ${recommendationsHTML}
        </div>
      </div>
    `;

    // Add click event listeners to recommendation items
    this.setupRecommendationClickHandlers();
  }

  setupRecommendationClickHandlers() {
    const recommendationItems = document.querySelectorAll('.recommendation-item.clickable');
    console.log('🔍 Setting up click handlers for', recommendationItems.length, 'recommendation items');
    
    recommendationItems.forEach((item, index) => {
      console.log('📋 Setting up handler for item', index, 'with dataset:', item.dataset);
      item.addEventListener('click', (e) => {
        console.log('🖱️ Recommendation item clicked!', e.currentTarget.dataset);
        const todoIndex = parseInt(e.currentTarget.dataset.todoIndex);
        const todo = this.currentRecommendations[todoIndex];
        console.log('📝 Todo found:', todo);
        if (todo) {
          this.showTodoConfirmModal(todo);
        } else {
          console.error('❌ No todo found for index:', todoIndex);
        }
      });
    });
  }

  showTodoConfirmModal(todo) {
    console.log('🔔 showTodoConfirmModal called with:', todo);
    
    // Track AI recommendation click
    if (window.analytics) {
      window.analytics.trackAIRecommendationClicked(todo);
    }
    
    const modal = document.getElementById('todo-confirm-modal');
    const titleEl = document.getElementById('todo-preview-title');
    const descriptionEl = document.getElementById('todo-preview-description');
    const timeEl = document.getElementById('todo-preview-time');
    const categoryEl = document.getElementById('todo-preview-category');

    console.log('🔍 Modal elements found:', {
      modal: !!modal,
      titleEl: !!titleEl,
      descriptionEl: !!descriptionEl,
      timeEl: !!timeEl,
      categoryEl: !!categoryEl
    });

    if (modal && titleEl && descriptionEl && timeEl && categoryEl) {
      titleEl.textContent = todo.title;
      descriptionEl.textContent = todo.description;
      timeEl.textContent = `예상 시간: ${todo.estimatedTime}`;
      categoryEl.textContent = `카테고리: ${todo.category}`;

      // Store the todo for later use
      this.selectedTodo = todo;

      // Show modal
      console.log('🔔 Showing modal, adding visible class');
      modal.classList.add('visible');
      console.log('🔔 Modal classes:', modal.className);
      
      // Check computed styles
      const computedStyle = window.getComputedStyle(modal);
      console.log('🔍 Modal computed styles:', {
        display: computedStyle.display,
        opacity: computedStyle.opacity,
        visibility: computedStyle.visibility,
        zIndex: computedStyle.zIndex,
        position: computedStyle.position
      });
      
      // Setup modal event listeners
      this.setupTodoModalHandlers();
      console.log('✅ Modal should now be visible');
    }
  }

  setupTodoModalHandlers() {
    const modal = document.getElementById('todo-confirm-modal');
    const cancelBtn = document.getElementById('todo-cancel-btn');
    const startBtn = document.getElementById('todo-start-btn');

    // Remove existing listeners to prevent duplicates
    const newCancelBtn = cancelBtn.cloneNode(true);
    const newStartBtn = startBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
    startBtn.parentNode.replaceChild(newStartBtn, startBtn);

    // Cancel button
    newCancelBtn.addEventListener('click', () => {
      modal.classList.remove('visible');
      this.selectedTodo = null;
    });

    // Start button
    newStartBtn.addEventListener('click', () => {
      if (this.selectedTodo) {
        this.startTrackingWithTodo(this.selectedTodo);
        modal.classList.remove('visible');
        this.selectedTodo = null;
      }
    });

    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('visible');
        this.selectedTodo = null;
      }
    });
  }

  startTrackingWithTodo(todo) {
    // Track AI recommendation started
    if (window.analytics) {
      window.analytics.trackAIRecommendationStarted(todo);
    }
    
    // Switch to tracker view
    if (this.navigationManager) {
      this.navigationManager.switchView('tracker');
    }

    // Start tracking with the todo title
    this.timeTracker.startTrackingWithTodoTitle(todo.title);
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
    this.aiTodoManager = null;
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

    // Track view switch
    if (window.analytics) {
      window.analytics.trackViewSwitch(this.currentView, viewName);
    }

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
    if (viewName === 'analyzer') {
      if (!this.analyticsManager) {
        this.analyticsManager = new AnalyticsManager(this.timeTracker);
      } else {
        // Reset to today's data when returning to analyzer view
        this.analyticsManager.resetToToday();
      }
      
      // Track analytics view (once per view switch)
      if (window.analytics) {
        window.analytics.trackAnalyticsView('all');
      }
    }

    // AI Todo Manager is now initialized at startup (window.aiTodoManager)
    // No need to initialize it here

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
      } else if (viewName === 'ai-todo') {
        headerTitle.textContent = 'AI 할일 추천';
      } else {
        headerTitle.textContent = '타임 트래커';
      }
    }
  }

  getCurrentView() {
    return this.currentView;
  }
}

// Initialize analytics
async function initializeAnalytics() {
  try {
    console.log('🔄 Initializing analytics...');
    const response = await fetch('/api/analytics-config');
    
    if (!response.ok) {
      throw new Error(`Analytics config request failed: ${response.status} ${response.statusText}`);
    }
    
    const config = await response.json();
    console.log('📋 Analytics config received:', { 
      hasToken: !!config.mixpanelToken, 
      hasAnalytics: !!window.analytics 
    });
    
    if (config.mixpanelToken && window.analytics) {
      window.analytics.init(config.mixpanelToken);
      
      // Wait a moment for initialization, then track session start
      setTimeout(() => {
        if (window.analytics.isInitialized) {
          window.analytics.trackSessionStart();
        } else {
          console.warn('⚠️ Analytics not initialized after timeout');
        }
      }, 1000);
    } else {
      if (!config.mixpanelToken) {
        console.error('❌ No Mixpanel token in config - check MIXPANEL_PROJECT_TOKEN environment variable');
      }
      if (!window.analytics) {
        console.error('❌ Analytics object not found - check analytics.js loading');
      }
    }
  } catch (error) {
    console.error('❌ Failed to initialize analytics:', error);
    console.error('This usually means:');
    console.error('1. MIXPANEL_PROJECT_TOKEN not set in production');
    console.error('2. Network connectivity issues');
    console.error('3. Server not responding to /api/analytics-config');
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize analytics first
  await initializeAnalytics();
  
  window.timeTracker = new TimeTracker();
  window.navigationManager = new NavigationManager(window.timeTracker);
  
  // Initialize AI Todo Manager at startup to load saved recommendations
  window.aiTodoManager = new AITodoManager(window.timeTracker, window.navigationManager);
  
  // Multi-task manager is now initialized inside TimeTracker.initializeMultiTaskManager()
  // No need to initialize it here again
  
  console.log('⏱️ Time Tracker initialized with minute-based timeline');
  console.log('📱 Navigation system initialized');
  console.log('📊 Analytics system ready');
  console.log('🤖 AI Todo Manager initialized');
  console.log('🔄 Use timeTracker.resetAllData() to clear all minute blocks');
  console.log('🕐 Recording starts from current system minute');
});
