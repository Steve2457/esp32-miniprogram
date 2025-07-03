// ESP32通信服务

interface TimeData {
  year: number;
  month: number;
  date: number;
  hour: number;
  minute: number;
  second: number;
}

interface AlarmData {
  hour: number;
  minute: number;
  enabled: boolean;
}

interface TimerData {
  hours: number;
  minutes: number;
  seconds: number;
  action?: string;
}

interface ReminderData {
  title: string;
  description: string;
  datetime: string;
}

class ESP32Api {
  private baseUrl: string = '';
  
  // 设置ESP32 IP地址
  setIpAddress(ip: string) {
    this.baseUrl = `http://${ip}`;
    wx.setStorageSync('esp32_ip', ip);
  }
  
  // 获取ESP32 IP地址
  getIpAddress(): string {
    return wx.getStorageSync('esp32_ip') || '';
  }
  
  // 检查是否已设置IP地址
  hasIpAddress(): boolean {
    return !!wx.getStorageSync('esp32_ip');
  }
  
  // 测试连接
  async testConnection(): Promise<boolean> {
    if (!this.hasIpAddress()) return false;
    
    try {
      const res = await this.request({
        url: '/',
        method: 'GET'
      });
      return res === "ESP32 Smart Desktop Assistant API";
    } catch (error) {
      console.error("连接测试失败:", error);
      return false;
    }
  }
  
  // 获取设备状态
  async getStatus() {
    return this.request({
      url: '/api/status',
      method: 'GET'
    });
  }
  
  // 设置时间
  async setTime(timeData: TimeData) {
    return this.request({
      url: '/api/time',
      method: 'POST',
      data: timeData
    });
  }
  
  // 设置时间格式
  async setTimeFormat(is24h: boolean) {
    return this.request({
      url: '/api/time_format',
      method: 'POST',
      data: {
        format_24h: is24h
      }
    });
  }
  
  // 设置闹钟
  async setAlarm(alarmData: AlarmData) {
    return this.request({
      url: '/api/alarm',
      method: 'POST',
      data: alarmData
    });
  }
  
  // 设置定时器
  async setTimer(timerData: TimerData) {
    return this.request({
      url: '/api/timer',
      method: 'POST',
      data: timerData
    });
  }
  
  // 设置提醒
  async setReminder(reminderData: ReminderData) {
    return this.request({
      url: '/api/reminder',
      method: 'POST',
      data: reminderData
    });
  }
  
  // 通用请求方法
  private async request(options: {
    url: string;
    method: 'GET' | 'POST';
    data?: any;
  }) {
    if (!this.hasIpAddress()) {
      throw new Error('未设置ESP32 IP地址');
    }
    
    return new Promise((resolve, reject) => {
      wx.request({
        url: this.baseUrl + options.url,
        method: options.method,
        data: options.data,
        success: (res) => {
          resolve(res.data);
        },
        fail: (err) => {
          console.error('请求失败:', err);
          reject(err);
        }
      });
    });
  }
}

const espApi = new ESP32Api();
export default espApi; 