// index.ts
import espApi from '../../utils/api';

// 获取应用实例
const app = getApp<IAppOption>();

interface DeviceStatus {
  current_time: {
    year: number;
    month: number;
    date: number;
    hour: number;
    minute: number;
    second: number;
  };
  time_format_24h: boolean;
  alarm: {
    hour: number;
    minute: number;
    enabled: boolean;
  };
  timer: {
    hours: number;
    minutes: number;
    seconds: number;
    running: boolean;
  };
  reminder: {
    title: string;
    description: string;
    datetime: string;
  };
}

Page({
  data: {
    currentTime: '00:00:00',
    currentDate: '2024年01月01日',
    is24hFormat: true,
    connected: false,
    connectionStatus: '未连接设备',
    deviceStatus: null as DeviceStatus | null
  },

  onLoad() {
    // 开始定时更新时间
    this.updateTime();
    setInterval(() => {
      this.updateTime();
    }, 1000);
    
    // 检查连接状态
    this.checkConnection();
  },
  
  onShow() {
    // 每次显示页面时检查连接状态
    this.checkConnection();
    
    // 如果已连接，获取设备状态
    if (this.data.connected) {
      this.fetchDeviceStatus();
    }
  },
  
  // 更新当前时间显示
  updateTime() {
    const now = new Date();
    
    // 时间格式化
    const hour = now.getHours();
    const minute = now.getMinutes().toString().padStart(2, '0');
    const second = now.getSeconds().toString().padStart(2, '0');
    
    let timeStr = '';
    if (this.data.is24hFormat) {
      timeStr = `${hour.toString().padStart(2, '0')}:${minute}:${second}`;
    } else {
      const period = hour >= 12 ? '下午' : '上午';
      const hour12 = hour % 12 || 12;
      timeStr = `${period} ${hour12}:${minute}:${second}`;
    }
    
    // 日期格式化
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    const dateStr = `${year}年${month}月${day}日`;
    
    this.setData({
      currentTime: timeStr,
      currentDate: dateStr
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
        this.fetchDeviceStatus();
      }
    } catch (error) {
      console.error('连接检查失败:', error);
      this.setData({
        connected: false,
        connectionStatus: '连接错误'
      });
    }
  },
  
  // 获取设备状态
  async fetchDeviceStatus() {
    try {
      wx.showLoading({
        title: '获取状态中...',
        mask: true
      });
      
      const status = await espApi.getStatus() as DeviceStatus;
      
      this.setData({
        deviceStatus: status,
        is24hFormat: status.time_format_24h
      });
      
      wx.hideLoading();
    } catch (error) {
      console.error('获取设备状态失败:', error);
      wx.hideLoading();
      
      wx.showToast({
        title: '获取设备状态失败',
        icon: 'none'
      });
    }
  },
  
  // 切换时间格式
  async onFormatChange(e: any) {
    const is24hFormat = e.detail.value;
    this.setData({ is24hFormat });
    
    // 更新时间显示
    this.updateTime();
    
    // 同步到设备
    if (this.data.connected) {
      try {
        await espApi.setTimeFormat(is24hFormat);
        
        wx.showToast({
          title: '时间格式已更新',
          icon: 'success'
        });
      } catch (error) {
        console.error('设置时间格式失败:', error);
        
        wx.showToast({
          title: '设置时间格式失败',
          icon: 'none'
        });
      }
    }
  },
  
  // 同步时间到设备
  async syncTime() {
    if (!this.data.connected) {
      wx.showToast({
        title: '请先连接设备',
        icon: 'none'
      });
      return;
    }
    
    try {
      wx.showLoading({
        title: '同步时间中...',
        mask: true
      });
      
      const now = new Date();
      const timeData = {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        date: now.getDate(),
        hour: now.getHours(),
        minute: now.getMinutes(),
        second: now.getSeconds()
      };
      
      await espApi.setTime(timeData);
      
      wx.hideLoading();
      wx.showToast({
        title: '时间同步成功',
        icon: 'success'
      });
    } catch (error) {
      console.error('同步时间失败:', error);
      
      wx.hideLoading();
      wx.showToast({
        title: '同步时间失败',
        icon: 'none'
      });
    }
  },
  
  // 导航到连接页面
  navigateToConnect() {
    wx.navigateTo({
      url: '/pages/connect/connect'
    });
  },
  
  // 导航到闹钟页面
  navigateToAlarm() {
    wx.navigateTo({
      url: '/pages/alarm/alarm'
    });
  },
  
  // 导航到定时器页面
  navigateToTimer() {
    wx.navigateTo({
      url: '/pages/timer/timer'
    });
  },
  
  // 导航到提醒页面
  navigateToReminder() {
    wx.navigateTo({
      url: '/pages/reminder/reminder'
    });
  }
}); 