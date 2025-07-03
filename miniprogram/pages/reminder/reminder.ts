import espApi from '../../utils/api';

interface ReminderData {
  title: string;
  description: string;
  datetime: string;
}

Page({
  data: {
    reminderTitle: '',
    reminderDesc: '',
    reminderDate: '',
    displayDateTime: '点击选择日期和时间',
    connected: false,
    connectionStatus: '未连接设备',
    hasCurrentReminder: false,
    currentReminder: {
      title: '',
      description: '',
      datetime: '',
      displayTime: ''
    },
    dateTimeSelector: [] as string[][],
    dateTimeArray: [0, 0, 0, 0, 0] // 年、月、日、时、分
  },
  
  onLoad() {
    // 初始化日期时间选择器
    this.initDateTimeSelector();
    
    // 检查连接状态
    this.checkConnection();
  },
  
  onShow() {
    // 每次显示页面时检查连接状态
    this.checkConnection();
    
    // 如果已连接，获取当前提醒状态
    if (this.data.connected) {
      this.getReminderStatus();
    }
  },
  
  // 初始化日期时间选择器数据
  initDateTimeSelector() {
    const date = new Date();
    const years: string[] = [];
    const months: string[] = [];
    const days: string[] = [];
    const hours: string[] = [];
    const minutes: string[] = [];
    
    // 年（当前年份及之后的3年）
    for (let i = 0; i < 4; i++) {
      years.push((date.getFullYear() + i) + '年');
    }
    
    // 月
    for (let i = 1; i <= 12; i++) {
      months.push(i + '月');
    }
    
    // 日（暂时设为31天，后续会根据年月调整）
    for (let i = 1; i <= 31; i++) {
      days.push(i + '日');
    }
    
    // 时
    for (let i = 0; i < 24; i++) {
      hours.push(i.toString().padStart(2, '0') + '时');
    }
    
    // 分
    for (let i = 0; i < 60; i++) {
      minutes.push(i.toString().padStart(2, '0') + '分');
    }
    
    this.setData({
      dateTimeSelector: [years, months, days, hours, minutes]
    });
    
    // 设置初始值为当前时间的后一小时
    const nextHour = new Date(date.getTime() + 60 * 60 * 1000);
    const year = nextHour.getFullYear();
    const month = nextHour.getMonth();
    const day = nextHour.getDate() - 1; // 因为我们日期从1开始
    const hour = nextHour.getHours();
    const minute = nextHour.getMinutes();
    
    this.setData({
      dateTimeArray: [0, month, day, hour, minute],
      displayDateTime: `${year}年${month + 1}月${day + 1}日 ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
    });
  },
  
  // 检查与ESP32的连接状态
  async checkConnection() {
    const hasIp = espApi.hasIpAddress();
    
    if (!hasIp) {
      this.setData({
        connected: false,
        connectionStatus: '未连接设备'
      });
      return;
    }
    
    try {
      const connected = await espApi.testConnection();
      this.setData({
        connected,
        connectionStatus: connected 
          ? `已连接 ${espApi.getIpAddress()}` 
          : '连接失败'
      });
      
      if (connected) {
        this.getReminderStatus();
      }
    } catch (error) {
      console.error('连接检查失败:', error);
      this.setData({
        connected: false,
        connectionStatus: '连接错误'
      });
    }
  },
  
  // 获取当前提醒状态
  async getReminderStatus() {
    try {
      wx.showLoading({
        title: '获取提醒设置...'
      });
      
      const status = await espApi.getStatus();
      const { reminder } = status as { reminder: ReminderData };
      
      if (reminder && reminder.title) {
        // 提取日期时间
        const dateTime = new Date(reminder.datetime);
        const displayTime = `${dateTime.getFullYear()}年${dateTime.getMonth() + 1}月${dateTime.getDate()}日 ${dateTime.getHours().toString().padStart(2, '0')}:${dateTime.getMinutes().toString().padStart(2, '0')}`;
        
        this.setData({
          hasCurrentReminder: true,
          currentReminder: {
            title: reminder.title,
            description: reminder.description,
            datetime: reminder.datetime,
            displayTime
          }
        });
      } else {
        this.setData({
          hasCurrentReminder: false
        });
      }
      
      wx.hideLoading();
    } catch (error) {
      console.error('获取提醒状态失败:', error);
      wx.hideLoading();
      
      wx.showToast({
        title: '获取提醒设置失败',
        icon: 'none'
      });
    }
  },
  
  // 标题输入
  onTitleInput(e: any) {
    this.setData({
      reminderTitle: e.detail.value
    });
  },
  
  // 描述输入
  onDescInput(e: any) {
    this.setData({
      reminderDesc: e.detail.value
    });
  },
  
  // 日期时间选择
  onDateTimeChange(e: any) {
    const value = e.detail.value;
    const dateTimeSelector = this.data.dateTimeSelector;
    
    // 获取选择的年、月、日、时、分
    const year = parseInt(dateTimeSelector[0][value[0]]);
    const month = parseInt(dateTimeSelector[1][value[1]]);
    const day = parseInt(dateTimeSelector[2][value[2]]);
    const hour = parseInt(dateTimeSelector[3][value[3]]);
    const minute = parseInt(dateTimeSelector[4][value[4]]);
    
    // 更新显示的日期时间
    const displayDateTime = `${year}年${month}月${day}日 ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    // 生成ISO格式的日期字符串 (YYYY-MM-DDThh:mm:ss)
    const isoDateTime = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
    
    this.setData({
      dateTimeArray: value,
      displayDateTime,
      reminderDate: isoDateTime
    });
  },
  
  // 保存提醒
  async saveReminder() {
    if (!this.data.connected) {
      wx.showToast({
        title: '请先连接设备',
        icon: 'none'
      });
      return;
    }
    
    const { reminderTitle, reminderDesc, reminderDate } = this.data;
    
    if (!reminderTitle) {
      wx.showToast({
        title: '请输入提醒标题',
        icon: 'none'
      });
      return;
    }
    
    if (!reminderDate) {
      wx.showToast({
        title: '请选择提醒时间',
        icon: 'none'
      });
      return;
    }
    
    try {
      wx.showLoading({
        title: '保存提醒设置...',
        mask: true
      });
      
      const reminderData = {
        title: reminderTitle,
        description: reminderDesc,
        datetime: reminderDate
      };
      
      await espApi.setReminder(reminderData);
      
      wx.hideLoading();
      wx.showToast({
        title: '提醒设置已保存',
        icon: 'success'
      });
      
      // 刷新当前提醒状态
      setTimeout(() => {
        this.getReminderStatus();
      }, 1000);
      
      // 清空表单
      this.setData({
        reminderTitle: '',
        reminderDesc: ''
      });
    } catch (error) {
      console.error('保存提醒设置失败:', error);
      
      wx.hideLoading();
      wx.showToast({
        title: '保存提醒设置失败',
        icon: 'none'
      });
    }
  }
}); 