import espApi from '../../utils/api';

interface AlarmData {
  hour: number;
  minute: number;
  enabled: boolean;
}

Page({
  data: {
    alarmTime: '07:00',
    isAlarmEnabled: false,
    connected: false,
    connectionStatus: '未连接设备'
  },
  
  onLoad() {
    // 检查连接状态
    this.checkConnection();
  },
  
  onShow() {
    // 每次显示页面时检查连接状态
    this.checkConnection();
    
    // 如果已连接，获取当前闹钟状态
    if (this.data.connected) {
      this.getAlarmStatus();
    }
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
        this.getAlarmStatus();
      }
    } catch (error) {
      console.error('连接检查失败:', error);
      this.setData({
        connected: false,
        connectionStatus: '连接错误'
      });
    }
  },
  
  // 获取当前闹钟状态
  async getAlarmStatus() {
    try {
      wx.showLoading({
        title: '获取闹钟设置...'
      });
      
      const status = await espApi.getStatus();
      const { alarm } = status as { alarm: AlarmData };
      
      if (alarm) {
        const hourStr = alarm.hour.toString().padStart(2, '0');
        const minuteStr = alarm.minute.toString().padStart(2, '0');
        
        this.setData({
          alarmTime: `${hourStr}:${minuteStr}`,
          isAlarmEnabled: alarm.enabled
        });
      }
      
      wx.hideLoading();
    } catch (error) {
      console.error('获取闹钟状态失败:', error);
      wx.hideLoading();
      
      wx.showToast({
        title: '获取闹钟设置失败',
        icon: 'none'
      });
    }
  },
  
  // 时间选择器变化
  onTimeChange(e: any) {
    this.setData({
      alarmTime: e.detail.value
    });
  },
  
  // 闹钟启用状态变化
  onSwitchChange(e: any) {
    this.setData({
      isAlarmEnabled: e.detail.value
    });
  },
  
  // 保存闹钟设置
  async saveAlarm() {
    if (!this.data.connected) {
      wx.showToast({
        title: '请先连接设备',
        icon: 'none'
      });
      return;
    }
    
    try {
      wx.showLoading({
        title: '保存闹钟设置...',
        mask: true
      });
      
      const { alarmTime, isAlarmEnabled } = this.data;
      const [hourStr, minuteStr] = alarmTime.split(':');
      
      const alarmData = {
        hour: parseInt(hourStr, 10),
        minute: parseInt(minuteStr, 10),
        enabled: isAlarmEnabled
      };
      
      await espApi.setAlarm(alarmData);
      
      wx.hideLoading();
      wx.showToast({
        title: '闹钟设置已保存',
        icon: 'success'
      });
    } catch (error) {
      console.error('保存闹钟设置失败:', error);
      
      wx.hideLoading();
      wx.showToast({
        title: '保存闹钟设置失败',
        icon: 'none'
      });
    }
  }
}); 