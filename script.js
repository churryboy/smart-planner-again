// ChatGPT API 설정
const OPENAI_API_KEY = window.OPENAI_API_KEY || 'your-api-key-here';
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// API 연결 테스트 함수
async function testOpenAIConnection() {
  console.log('🔍 OpenAI API 연결 테스트 시작...');
  console.log('🔑 API 키 (마지막 4자리):', OPENAI_API_KEY.slice(-4));
  
  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello, this is a test message.' }],
        max_tokens: 10
      })
    });
    
    console.log('📡 테스트 응답 상태:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API 연결 성공!', data);
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ API 연결 실패:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ API 테스트 오류:', error);
    if (error.message.includes('CORS')) {
      console.error('🌐 CORS 오류 - 브라우저에서 직접 OpenAI API 호출 불가');
      console.log('💡 해결방법: 프록시 서버 또는 백엔드 API 필요');
    }
    return false;
  }
}

// 캘린더 기능
class Calendar {
  constructor() {
    this.currentDate = new Date();
    this.selectedDate = null;
    this.events = new Map(); // 날짜 문자열로 이벤트 저장
    this.timelineView = new TimelineView();
    this.bottomSheet = new BottomSheet();
    this.init();
  }

  init() {
    this.renderCalendar();
    this.bindEvents();
    this.loadSampleEvents();
  }

  bindEvents() {
    // 네비게이션 버튼
    document.getElementById('prev-month').addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.renderCalendar();
    });

    document.getElementById('next-month').addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.renderCalendar();
    });

    // 캘린더 날짜 클릭 - 타임라인 뷰 열기
    document.getElementById('calendar-days').addEventListener('click', (e) => {
      if (e.target.classList.contains('calendar-day')) {
        const day = parseInt(e.target.textContent);
        if (!isNaN(day)) {
          this.selectDate(day);
          this.timelineView.show(this.selectedDate, this.getEventsForDate(this.selectedDate));
        }
      }
    });

    // 타임라인 뒤로가기 버튼
    document.getElementById('timeline-back-btn').addEventListener('click', () => {
      this.timelineView.hide();
    });

    // 타임라인 일정 추가 버튼
    document.getElementById('timeline-add-btn').addEventListener('click', () => {
      if (this.selectedDate && globalScheduleModal) {
        const scheduleData = {
          date: this.selectedDate.toISOString().split('T')[0],
          title: '',
          startTime: '',
          endTime: '',
          priority: '보통',
          description: '',
          reminder: 'none'
        };
        globalScheduleModal.open(scheduleData);
      }
    });

    // FAB 버튼
    document.getElementById('fab').addEventListener('click', () => {
      if (globalScheduleModal) {
        const scheduleData = {
          date: new Date().toISOString().split('T')[0], // 오늘 날짜로 기본 설정
          title: '',
          startTime: '',
          endTime: '',
          priority: '보통',
          description: '',
          reminder: 'none'
        };
        globalScheduleModal.open(scheduleData);
      }
    });

    // 하단 네비게이션
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        this.handleNavigation(e.currentTarget);
      });
    });
  }

  renderCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // 월 제목 업데이트
    const monthNames = [
      '1월', '2월', '3월', '4월', '5월', '6월',
      '7월', '8월', '9월', '10월', '11월', '12월'
    ];
    document.getElementById('current-month').textContent = 
      `${year}년 ${monthNames[month]}`;

    // 월의 첫 번째 날과 일수 가져오기
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // 이전 날짜들 지우기
    const calendarDays = document.getElementById('calendar-days');
    calendarDays.innerHTML = '';

    // 월의 첫 번째 날 이전의 빈 셀들 추가
    for (let i = 0; i < startingDayOfWeek; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'calendar-day other-month';
      calendarDays.appendChild(emptyDay);
    }

    // 월의 날짜들 추가
    for (let day = 1; day <= daysInMonth; day++) {
      const dayElement = document.createElement('div');
      dayElement.className = 'calendar-day';
      dayElement.textContent = day;

      // 오늘인지 확인
      const today = new Date();
      if (year === today.getFullYear() && 
          month === today.getMonth() && 
          day === today.getDate()) {
        dayElement.classList.add('today');
      }

      // 선택된 날짜인지 확인
      if (this.selectedDate && 
          year === this.selectedDate.getFullYear() && 
          month === this.selectedDate.getMonth() && 
          day === this.selectedDate.getDate()) {
        dayElement.classList.add('selected');
      }

      // 이벤트가 있는지 확인
      const dateKey = this.getDateKey(year, month, day);
      if (this.events.has(dateKey)) {
        dayElement.classList.add('has-event');
      }

      calendarDays.appendChild(dayElement);
    }

    // 주의 나머지 날짜들을 위한 빈 셀들 추가
    const totalCells = startingDayOfWeek + daysInMonth;
    const remainingCells = 7 - (totalCells % 7);
    if (remainingCells < 7) {
      for (let i = 0; i < remainingCells; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendarDays.appendChild(emptyDay);
      }
    }
  }

  selectDate(day) {
    // 이전 선택 제거
    document.querySelectorAll('.calendar-day.selected').forEach(el => {
      el.classList.remove('selected');
    });

    // 클릭된 날짜에 선택 추가
    const dayElements = document.querySelectorAll('.calendar-day');
    const dayIndex = day - 1 + new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1).getDay();
    if (dayElements[dayIndex]) {
      dayElements[dayIndex].classList.add('selected');
    }

    // 선택된 날짜 업데이트
    this.selectedDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
  }

  getDateKey(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  addEvent(date, title, description = '') {
    const dateKey = this.getDateKey(date.getFullYear(), date.getMonth(), date.getDate());
    if (!this.events.has(dateKey)) {
      this.events.set(dateKey, []);
    }
    this.events.get(dateKey).push({ title, description });
    this.renderCalendar();
    
    // 타임라인 뷰가 열려있고 같은 날짜라면 업데이트
    if (this.timelineView.isVisible && this.selectedDate && 
        this.getDateKey(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), this.selectedDate.getDate()) === dateKey) {
      this.timelineView.show(this.selectedDate, this.getEventsForDate(this.selectedDate));
    }
  }

  getEventsForDate(date) {
    const dateKey = this.getDateKey(date.getFullYear(), date.getMonth(), date.getDate());
    return this.events.get(dateKey) || [];
  }

  loadSampleEvents() {
    // 샘플 이벤트 추가
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    this.addEvent(today, '팀 미팅', '주간 스탠드업 미팅');
    this.addEvent(tomorrow, '의사 예약', '연간 건강검진');
    this.addEvent(nextWeek, '프로젝트 마감', '최종 보고서 제출');
  }



  handleNavigation(navItem) {
    // 모든 네비게이션 항목에서 활성 클래스 제거
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });

    // 클릭된 항목에 활성 클래스 추가
    navItem.classList.add('active');

    // 네비게이션 로직 처리
    const label = navItem.querySelector('.nav-label').textContent;
    console.log(`네비게이션: ${label}`);
    
    // 여기서 실제 네비게이션 로직을 구현합니다
    // 지금은 액션을 로그로만 표시합니다
    switch(label) {
      case '홈':
        // 이미 홈 페이지에 있음
        break;
      case '캘린더':
        // 캘린더로 스크롤하거나 새로고침
        document.querySelector('.calendar-section').scrollIntoView({ behavior: 'smooth' });
        break;
      case '할일':
        // 할일 페이지로 이동
        console.log('할일 페이지로 이동');
        break;
      case '채팅':
        // 채팅 페이지로 이동
        console.log('채팅 페이지로 이동');
        break;
      case '즐겨찾기':
        // 즐겨찾기 항목으로 이동
        console.log('즐겨찾기 페이지로 이동');
        break;
    }
  }
}

// 바텀 시트 클래스
class BottomSheet {
  constructor() {
    this.isOpen = false;
    this.chatManager = new ChatManager();
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // 오버레이 클릭으로 닫기
    document.getElementById('overlay').addEventListener('click', () => {
      this.close();
    });

    // 닫기 버튼
    document.getElementById('bottom-sheet-close').addEventListener('click', () => {
      this.close();
    });

    // ESC 키로 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  open(selectedDate = null) {
    this.isOpen = true;
    
    // 오버레이와 바텀 시트 표시
    document.getElementById('overlay').classList.add('active');
    document.getElementById('bottom-sheet').classList.add('active');
    
    // 바디 스크롤 방지
    document.body.style.overflow = 'hidden';

    // 채팅 초기화
    this.chatManager.initializeChat(selectedDate);
  }

  close() {
    this.isOpen = false;
    
    // 오버레이와 바텀 시트 숨기기
    document.getElementById('overlay').classList.remove('active');
    document.getElementById('bottom-sheet').classList.remove('active');
    
    // 바디 스크롤 복원
    document.body.style.overflow = '';

    // 채팅 입력 초기화
    document.getElementById('chat-input').value = '';
    this.chatManager.updateSendButton();
  }
}

// 타임라인 뷰 클래스
class TimelineView {
  constructor() {
    this.isVisible = false;
    this.selectedDate = null;
    this.events = [];
  }

  show(date, events) {
    this.isVisible = true;
    this.selectedDate = date;
    this.events = events;

    // 날짜 제목 업데이트
    const title = date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    document.getElementById('timeline-title').textContent = title;

    // 캘린더 섹션 숨기고 타임라인 섹션 표시
    document.querySelector('.calendar-section').style.display = 'none';
    document.getElementById('timeline-section').style.display = 'block';

    // 타임라인 렌더링
    this.renderTimeline();
  }

  hide() {
    this.isVisible = false;
    
    // 타임라인 섹션 숨기고 캘린더 섹션 표시
    document.getElementById('timeline-section').style.display = 'none';
    document.querySelector('.calendar-section').style.display = 'block';
  }

  renderTimeline() {
    const timelineHours = document.getElementById('timeline-hours');
    timelineHours.innerHTML = '';

    // 24시간 타임라인 생성
    for (let hour = 0; hour < 24; hour++) {
      const hourElement = document.createElement('div');
      hourElement.className = 'timeline-hour';

      const hourLabel = document.createElement('div');
      hourLabel.className = 'hour-label';
      hourLabel.textContent = `${hour.toString().padStart(2, '0')}:00`;

      const hourEvents = document.createElement('div');
      hourEvents.className = 'hour-events';

      // 해당 시간대의 이벤트 찾기
      const hourlyEvents = this.getEventsForHour(hour);
      hourlyEvents.forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.className = 'timeline-event';
        
        const eventTitle = document.createElement('div');
        eventTitle.className = 'event-title';
        eventTitle.textContent = event.title;
        
        const eventTime = document.createElement('div');
        eventTime.className = 'event-time';
        eventTime.textContent = event.time || `${hour.toString().padStart(2, '0')}:00`;
        
        eventElement.appendChild(eventTitle);
        eventElement.appendChild(eventTime);
        hourEvents.appendChild(eventElement);
      });

      hourElement.appendChild(hourLabel);
      hourElement.appendChild(hourEvents);
      timelineHours.appendChild(hourElement);
    }
  }

  getEventsForHour(hour) {
    return this.events.filter(event => {
      // 이벤트 제목에서 시간 정보 추출
      const timeMatch = event.title.match(/(\d{1,2}):(\d{2})/);
      if (timeMatch) {
        const eventHour = parseInt(timeMatch[1]);
        return eventHour === hour;
      }
      return false;
    }).map(event => {
      // 시간 정보를 제거한 제목 반환
      const cleanTitle = event.title.replace(/^\d{1,2}:\d{2}(\s*-\s*\d{1,2}:\d{2})?\s*/, '');
      const timeMatch = event.title.match(/(\d{1,2}:\d{2}(\s*-\s*\d{1,2}:\d{2})?)/);
      return {
        title: cleanTitle,
        time: timeMatch ? timeMatch[1] : null,
        description: event.description
      };
    });
  }
}

// 채팅 관리 클래스
class ChatManager {
  constructor() {
    this.messages = [];
    this.isTyping = false;
    this.selectedDate = null;
    this.scheduleData = {};
    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('chat-send-btn');

    // 입력 필드 이벤트
    chatInput.addEventListener('input', () => {
      this.updateSendButton();
    });

    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // 전송 버튼 클릭
    sendButton.addEventListener('click', () => {
      this.sendMessage();
    });
  }

  initializeChat(selectedDate = null) {
    this.selectedDate = selectedDate;
    
    if (selectedDate) {
      this.scheduleData = {
        date: selectedDate.toISOString().split('T')[0],
        title: '',
        startTime: '',
        endTime: '',
        priority: '보통',
        description: '',
        reminder: 'none'
      };
    } else {
      this.scheduleData = {
        date: '',
        title: '',
        startTime: '',
        endTime: '',
        priority: '보통',
        description: '',
        reminder: 'none'
      };
    }

    // 채팅 메시지 초기화
    const messagesContainer = document.getElementById('chat-messages');
    const welcomeMessage = selectedDate 
      ? `안녕하세요! ${selectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}에 추가할 일정을 만들어드릴게요.

다음 정보를 한 번에 알려주세요:
1) 일정 제목
2) 시작 시간, 종료 시간 
3) 중요도 (높음/보통/낮음)
4) 세부 내용 (선택사항)

예: "팀 미팅, 오후 2시부터 3시까지, 높음, 프로젝트 진행상황 논의"`
      : `안녕하세요! 새로운 일정을 만들어드릴게요.

다음 정보를 한 번에 알려주세요:
1) 일정 제목
2) 날짜와 시간 (예: 12월 25일 오후 2시-3시)
3) 중요도 (높음/보통/낮음)
4) 세부 내용 (선택사항)

예: "팀 미팅, 12월 25일 오후 2시부터 3시까지, 높음, 프로젝트 진행상황 논의"`;
      
    messagesContainer.innerHTML = `
      <div class="chat-message assistant">
        <div class="message-avatar">
          <svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </div>
        <div class="message-content">
          <p>${welcomeMessage}</p>
        </div>
      </div>
    `;

    this.messages = [{
      role: 'system',
      content: `당신은 스마트 플래너 앱의 효율적인 일정 생성 AI 어시스턴트입니다. 최대 2-3번의 대화로 일정을 완성하는 것이 목표입니다.

사용자가 일정 정보를 제공하면 즉시 분석하여 JSON으로 응답하세요. 부족한 정보가 있다면 한 번에 모든 누락된 정보를 질문하세요.

필요한 정보:
1. 일정 제목 (필수)
2. 날짜 (${selectedDate ? `기본값: ${selectedDate.toLocaleDateString('ko-KR')}` : '필수'})
3. 시작 시간 (필수)
4. 종료 시간 (선택사항, 1시간으로 추정 가능)
5. 중요도 (높음/보통/낮음, 기본값: 보통)
6. 세부 내용 (선택사항)

사용자 입력 예시 분석:
- "팀 미팅, 오후 2시부터 3시까지, 높음, 프로젝트 논의" → 모든 정보 충분
- "의사 예약, 내일 오전 10시" → 종료시간, 중요도 추정하여 완성
- "점심 약속" → 날짜, 시간 질문 필요

정보가 충분하면 즉시 JSON 응답:
{
  "action": "create_schedule",
  "title": "일정 제목",
  "date": "YYYY-MM-DD",
  "startTime": "HH:MM",
  "endTime": "HH:MM",
  "priority": "높음|보통|낮음",
  "description": "세부 내용"
}

부족한 정보가 있다면 한 번에 모두 질문하세요. 예: "날짜와 시간을 알려주세요. 중요도는 어떻게 설정할까요?"

간결하고 효율적으로 대화하세요.`
    }];

    // 입력 필드 포커스
    setTimeout(() => {
      document.getElementById('chat-input').focus();
    }, 300);
  }

  updateSendButton() {
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('chat-send-btn');
    const hasText = chatInput.value.trim().length > 0;
    
    sendButton.disabled = !hasText || this.isTyping;
  }

  async sendMessage() {
    const chatInput = document.getElementById('chat-input');
    const message = chatInput.value.trim();
    
    if (!message || this.isTyping) return;

    // 사용자 메시지 추가
    this.addMessage('user', message);
    chatInput.value = '';
    this.updateSendButton();

    // AI 응답 요청
    await this.getAIResponse(message);
  }

  addMessage(role, content) {
    const messagesContainer = document.getElementById('chat-messages');
    const messageElement = document.createElement('div');
    messageElement.className = `chat-message ${role}`;

    const avatarIcon = role === 'user' 
      ? `<svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
           <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
           <circle cx="12" cy="7" r="4"></circle>
         </svg>`
      : `<svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
           <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
         </svg>`;

    messageElement.innerHTML = `
      <div class="message-avatar">
        ${avatarIcon}
      </div>
      <div class="message-content">
        <p>${content}</p>
      </div>
    `;

    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // 메시지 히스토리에 추가
    this.messages.push({ role, content });
  }

  showTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    typingIndicator.style.display = 'flex';
    this.isTyping = true;
    this.updateSendButton();
  }

  hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    typingIndicator.style.display = 'none';
    this.isTyping = false;
    this.updateSendButton();
  }

  async getAIResponse(userMessage) {
    this.showTypingIndicator();

    try {
      console.log('🚀 API 요청 시작:', userMessage);
      console.log('📝 메시지 히스토리:', this.messages);
      
      const requestBody = {
        model: 'gpt-3.5-turbo',
        messages: [...this.messages, { role: 'user', content: userMessage }],
        max_tokens: 500,
        temperature: 0.7
      };
      
      console.log('📤 요청 본문:', requestBody);
      
      const response = await fetch(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 응답 상태:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API 오류 응답:', errorText);
        throw new Error(`API 요청 실패: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ API 응답 데이터:', data);
      
      const aiMessage = data.choices[0].message.content;
      console.log('🤖 AI 메시지:', aiMessage);

      this.hideTypingIndicator();
      
      // JSON 형식의 일정 생성 요청인지 확인
      if (this.isScheduleCreationRequest(aiMessage)) {
        console.log('📅 일정 생성 요청 감지');
        this.handleScheduleCreation(aiMessage);
      } else {
        this.addMessage('assistant', aiMessage);
      }

    } catch (error) {
      console.error('❌ AI 응답 오류:', error);
      console.error('🔍 오류 상세:', error.message);
      console.error('📊 오류 스택:', error.stack);
      
      this.hideTypingIndicator();
      
      let errorMessage = '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
      
      if (error.message.includes('401')) {
        errorMessage = 'API 키 인증에 실패했습니다. 관리자에게 문의해 주세요.';
        console.error('🔑 API 키 문제 - 키 확인 필요');
      } else if (error.message.includes('429')) {
        errorMessage = '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
        console.error('⏰ 요청 제한 초과');
      } else if (error.message.includes('500')) {
        errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
        console.error('🖥️ 서버 오류');
      } else if (error.message.includes('CORS')) {
        errorMessage = 'CORS 오류가 발생했습니다. 브라우저 설정을 확인해 주세요.';
        console.error('🌐 CORS 문제 - 브라우저에서 직접 API 호출 불가');
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = '네트워크 연결을 확인해 주세요.';
        console.error('📡 네트워크 오류 - 인터넷 연결 확인');
      }
      
      console.log('💬 사용자에게 표시할 오류 메시지:', errorMessage);
      this.addMessage('assistant', errorMessage);
    }
  }

  isScheduleCreationRequest(message) {
    try {
      const jsonMatch = message.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonData = JSON.parse(jsonMatch[0]);
        return jsonData.action === 'create_schedule';
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  handleScheduleCreation(message) {
    try {
      const jsonMatch = message.match(/\{[\s\S]*\}/);
      const scheduleInfo = JSON.parse(jsonMatch[0]);
      
      // 수집된 정보로 scheduleData 업데이트
      this.scheduleData = {
        date: scheduleInfo.date || (this.selectedDate ? this.selectedDate.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]),
        title: scheduleInfo.title || '',
        startTime: scheduleInfo.startTime || '',
        endTime: scheduleInfo.endTime || '',
        priority: scheduleInfo.priority || '보통',
        description: scheduleInfo.description || '',
        reminder: 'none'
      };

      // AI 확인 메시지 추가
      const confirmationMessage = `네, 일정 정보를 정리했습니다! 확인하시고 수정이 필요하면 변경해 주세요.`;
      this.addMessage('assistant', confirmationMessage);

      // 일정 확인 모달 열기
      setTimeout(() => {
        if (globalScheduleModal) {
          globalScheduleModal.open(this.scheduleData);
        }
      }, 500);

    } catch (error) {
      console.error('일정 생성 처리 오류:', error);
      this.addMessage('assistant', '일정 정보를 처리하는 중 오류가 발생했습니다. 다시 시도해 주세요.');
    }
  }
}

// 일정 확인 모달 클래스
class ScheduleModal {
  constructor() {
    this.isOpen = false;
    this.scheduleData = {};
    this.calendar = null;
    this.eventsInitialized = false;
    this.escListenerBound = false;
    this.init();
  }

  init() {
    if (!this.eventsInitialized) {
      this.bindEvents();
      this.eventsInitialized = true;
    }
  }

  bindEvents() {
    // 모달 닫기 버튼
    document.getElementById('modal-close').addEventListener('click', () => {
      this.close();
    });

    // 취소 버튼
    document.getElementById('modal-cancel').addEventListener('click', () => {
      this.close();
    });

    // 확인 버튼
    document.getElementById('modal-confirm').addEventListener('click', () => {
      this.confirmSchedule();
    });

    // 모달 배경 클릭으로 닫기
    document.getElementById('schedule-modal').addEventListener('click', (e) => {
      if (e.target.id === 'schedule-modal') {
        this.close();
      }
    });

    // ESC 키로 닫기 (이미 바인딩된 경우 중복 방지)
    if (!this.escListenerBound) {
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.isOpen) {
          this.close();
        }
      });
      this.escListenerBound = true;
    }
  }

  setCalendar(calendar) {
    this.calendar = calendar;
  }

  open(scheduleData) {
    this.isOpen = true;
    this.scheduleData = scheduleData;

    // 폼 필드에 데이터 채우기
    document.getElementById('schedule-title').value = scheduleData.title || '';
    document.getElementById('schedule-date').value = scheduleData.date || '';
    document.getElementById('schedule-start-time').value = scheduleData.startTime || '';
    document.getElementById('schedule-end-time').value = scheduleData.endTime || '';
    document.getElementById('schedule-priority').value = scheduleData.priority || '보통';
    document.getElementById('schedule-description').value = scheduleData.description || '';

    // 알림 설정
    const reminderValue = scheduleData.reminder || 'none';
    const reminderRadio = document.querySelector(`input[name="reminder"][value="${reminderValue}"]`);
    if (reminderRadio) {
      reminderRadio.checked = true;
    }

    // 모달 표시
    document.getElementById('schedule-modal').classList.add('active');
    document.body.style.overflow = 'hidden';

    // 제목 필드에 포커스
    setTimeout(() => {
      document.getElementById('schedule-title').focus();
    }, 300);
  }

  close() {
    this.isOpen = false;
    document.getElementById('schedule-modal').classList.remove('active');
    document.body.style.overflow = '';
  }

  confirmSchedule() {
    console.log('🎯 confirmSchedule 호출됨');
    
    // 폼 데이터 수집
    const formData = {
      title: document.getElementById('schedule-title').value.trim(),
      date: document.getElementById('schedule-date').value,
      startTime: document.getElementById('schedule-start-time').value,
      endTime: document.getElementById('schedule-end-time').value,
      priority: document.getElementById('schedule-priority').value,
      description: document.getElementById('schedule-description').value.trim(),
      reminder: document.querySelector('input[name="reminder"]:checked')?.value || 'none'
    };
    
    console.log('📝 폼 데이터:', formData);

    // 필수 필드 검증
    if (!formData.title) {
      alert('일정 제목을 입력해 주세요.');
      document.getElementById('schedule-title').focus();
      return;
    }

    if (!formData.date) {
      alert('날짜를 선택해 주세요.');
      document.getElementById('schedule-date').focus();
      return;
    }

    if (!formData.startTime) {
      alert('시작 시간을 입력해 주세요.');
      document.getElementById('schedule-start-time').focus();
      return;
    }

    // 캘린더에 일정 추가
    if (globalCalendar) {
      console.log('📅 캘린더에 일정 추가 중...');
      const scheduleDate = new Date(formData.date);
      const priorityIcon = formData.priority === '높음' ? '🔴 ' : formData.priority === '낮음' ? '🟢 ' : '🟡 ';
      const fullTitle = priorityIcon + formData.startTime + (formData.endTime ? ` - ${formData.endTime}` : '') + ` ${formData.title}`;
      const fullDescription = [
        `중요도: ${formData.priority}`,
        formData.description && `설명: ${formData.description}`,
        formData.reminder !== 'none' && `알림: ${formData.reminder}분 전`
      ].filter(Boolean).join('\n');

      console.log('✏️ 추가할 일정:', { fullTitle, fullDescription });
      globalCalendar.addEvent(scheduleDate, fullTitle, fullDescription);
      console.log('✅ 일정 추가 완료');
    }

    // 성공 메시지
    alert('일정이 성공적으로 추가되었습니다!');

    // 모달 닫기
    this.close();
  }
}

// 전역 인스턴스들
let globalCalendar = null;
let globalScheduleModal = null;

// 페이지 로드 시 캘린더 초기화
document.addEventListener('DOMContentLoaded', async () => {
  globalCalendar = new Calendar();
  globalScheduleModal = new ScheduleModal();
  globalScheduleModal.setCalendar(globalCalendar);
  
  // API 연결 테스트
  console.log('🚀 애플리케이션 시작 - API 테스트 실행');
  await testOpenAIConnection();
});

// 모바일 특화 터치 개선사항 추가
document.addEventListener('touchstart', (e) => {
  // 터치 피드백 추가
  if (e.target.classList.contains('calendar-day') || 
      e.target.classList.contains('nav-button') ||
      e.target.classList.contains('action-btn') ||
      e.target.classList.contains('nav-item') ||
      e.target.classList.contains('chat-send-btn')) {
    e.target.style.transform = 'scale(0.95)';
  }
});

document.addEventListener('touchend', (e) => {
  // 터치 피드백 제거
  if (e.target.classList.contains('calendar-day') || 
      e.target.classList.contains('nav-button') ||
      e.target.classList.contains('action-btn') ||
      e.target.classList.contains('nav-item') ||
      e.target.classList.contains('chat-send-btn')) {
    setTimeout(() => {
      e.target.style.transform = '';
    }, 150);
  }
});

// 더 나은 모바일 경험을 위해 더블탭 줌 방지
let lastTouchEnd = 0;
document.addEventListener('touchend', (e) => {
  const now = (new Date()).getTime();
  if (now - lastTouchEnd <= 300) {
    e.preventDefault();
  }
  lastTouchEnd = now;
}, false);
