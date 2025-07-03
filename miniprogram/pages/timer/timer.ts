import espApi from '../../utils/api';

interface TimerData {
  hours: number;
  minutes: number;
  seconds: number;
  running: boolean;
}

Page({
  data: {
    hours: '00',
    minutes: '10',
    seconds: '00',
    hourArray: Array.from({length: 24}, (_, i) => i.toString().padStart(2, '0')),
    minuteArray: Array.from({length: 60}, (_, i) => i.toString().padStart(2, '0')),
    secondArray: Array.from({length: 60}, (_, i) => i.toString().padStart(2, '0')),
    isRunning: false,
    timerStatusText: '定时器未运行',
    connected: false,
    connectionStatus: '未连接设备',
    refreshInterval: null as any
  },
  
  onLoad() {
    // 检查连接状态
    this.checkConnection();
  },
  
  onShow() {
    // 每次显示页面时检查连接状态
    this.checkConnection();
    
    // 如果已连接，获取当前定时器状态
    if (this.data.connected) {
      this.getTimerStatus();
    }
    
    // 启动定时刷新
    this.startRefreshInterval();
  },
  
  onHide() {
    // 清除定时刷新
    this.clearRefreshInterval();
  },
  
  onUnload() {
    // 清除定时刷新
    this.clearRefreshInterval();
  },
  
  // 设置定时刷新
  startRefreshInterval() {
    if (this.data.refreshInterval) {
      clearInterval(this.data.refreshInterval);
    }
    
    const refreshInterval = setInterval(() => {
      if (this.data.connected && this.data.isRunning) {
        this.getTimerStatus();
      }
    }, 3000); // 每3秒更新一次
    
    this.setData({
      refreshInterval
    });
  },
  
  // 清除定时刷新
  clearRefreshInterval() {
    if (this.data.refreshInterval) {
      clearInterval(this.data.refreshInterval);
      this.setData({
        refreshInterval: null
      });
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
        this.getTimerStatus();
      }
    } catch (error) {
      console.error('连接检查失败:', error);
      this.setData({
        connected: false,
        connectionStatus: '连接错误'
      });
    }
  },
  
  // 获取当前定时器状态
  async getTimerStatus() {
    try {
      const status = await espApi.getStatus();
      const { timer } = status as { timer: TimerData };
      
      if (timer) {
        const hours = timer.hours.toString().padStart(2, '0');
        const minutes = timer.minutes.toString().padStart(2, '0');
        const seconds = timer.seconds.toString().padStart(2, '0');
        
        this.setData({
          hours,
          minutes,
          seconds,
          isRunning: timer.running,
          timerStatusText: timer.running ? '定时器运行中' : '定时器未运行'
        });
      }
    } catch (error) {
      console.error('获取定时器状态失败:', error);
      
      wx.showToast({
        title: '获取定时器状态失败',
        icon: 'none'
      });
    }
  },
  
  // 小时选择器变化
  onHourChange(e: any) {
    this.setData({
      hours: this.data.hourArray[e.detail.value]
    });
  },
  
  // 分钟选择器变化
  onMinuteChange(e: any) {
    this.setData({
      minutes: this.data.minuteArray[e.detail.value]
    });
  },
  
  // 秒选择器变化
  onSecondChange(e: any) {
    this.setData({
      seconds: this.data.secondArray[e.detail.value]
    });
  },
  
  // 开始定时器
  async startTimer() {
    if (!this.data.connected) {
      wx.showToast({
        title: '请先连接设备',
        icon: 'none'
      });
      return;
    }
    
    try {
      wx.showLoading({
        title: '开始定时器...',
        mask: true
      });
      
      const { hours, minutes, seconds } = this.data;
      
      const timerData = {
        hours: parseInt(hours, 10),
        minutes: parseInt(minutes, 10),
        seconds: parseInt(seconds, 10),
        action: 'start'
      };
      
      await espApi.setTimer(timerData);
      
      this.setData({
        isRunning: true,
        timerStatusText: '定时器运行中'
      });
      
      wx.hideLoading();
      wx.showToast({
        title: '定时器已启动',
        icon: 'success'
      });
      
      // 立即获取状态更新
      setTimeout(() => {
        this.getTimerStatus();
      }, 1000);
    } catch (error) {
      console.error('启动定时器失败:', error);
      
      wx.hideLoading();
      wx.showToast({
        title: '启动定时器失败',
        icon: 'none'
      });
    }
  },
  
  // 停止定时器
  async stopTimer() {
    if (!this.data.connected) {
      wx.showToast({
        title: '请先连接设备',
        icon: 'none'
      });
      return;
    }
    
    try {
      wx.showLoading({
        title: '停止定时器...',
        mask: true
      });
      
      const { hours, minutes, seconds } = this.data;
      
      const timerData = {
        hours: parseInt(hours, 10),
        minutes: parseInt(minutes, 10),
        seconds: parseInt(seconds, 10),
        action: 'stop'
      };
      
      await espApi.setTimer(timerData);
      
      this.setData({
        isRunning: false,
        timerStatusText: '定时器已暂停'
      });
      
      wx.hideLoading();
      wx.showToast({
        title: '定时器已停止',
        icon: 'success'
      });
      
      // 立即获取状态更新
      setTimeout(() => {
        this.getTimerStatus();
      }, 1000);
    } catch (error) {
      console.error('停止定时器失败:', error);
      
      wx.hideLoading();
      wx.showToast({
        title: '停止定时器失败',
        icon: 'none'
      });
    }
  },
  
  // 重置定时器
  async resetTimer() {
    if (!this.data.connected) {
      wx.showToast({
        title: '请先连接设备',
        icon: 'none'
      });
      return;
    }
    
    try {
      wx.showLoading({
        title: '重置定时器...',
        mask: true
      });
      
      const { hours, minutes, seconds } = this.data;
      
      const timerData = {
        hours: parseInt(hours, 10),
        minutes: parseInt(minutes, 10),
        seconds: parseInt(seconds, 10),
        action: 'reset'
      };
      
      await espApi.setTimer(timerData);
      
      this.setData({
        isRunning: false,
        timerStatusText: '定时器已重置'
      });
      
      wx.hideLoading();
      wx.showToast({
        title: '定时器已重置',
        icon: 'success'
      });
      
      // 立即获取状态更新
      setTimeout(() => {
        this.getTimerStatus();
      }, 1000);
    } catch (error) {
      console.error('重置定时器失败:', error);
      
      wx.hideLoading();
      wx.showToast({
        title: '重置定时器失败',
        icon: 'none'
      });
    }
  }
}); 