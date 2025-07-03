import espApi from '../../utils/api';

Page({
  data: {
    ipAddress: '',
    connected: false,
    statusText: '未连接'
  },

  onLoad() {
    // 加载保存的IP地址
    const savedIp = espApi.getIpAddress();
    if (savedIp) {
      this.setData({
        ipAddress: savedIp
      });
      this.testConnection();
    }
  },

  onIpInput(e: any) {
    this.setData({
      ipAddress: e.detail.value
    });
  },

  async testConnection() {
    const { ipAddress } = this.data;
    
    if (!ipAddress) {
      wx.showToast({
        title: '请输入IP地址',
        icon: 'none'
      });
      return;
    }
    
    // 显示加载提示
    wx.showLoading({
      title: '正在连接...'
    });
    
    try {
      // 先设置IP地址
      espApi.setIpAddress(ipAddress);
      
      // 测试连接
      const connected = await espApi.testConnection();
      
      this.setData({
        connected,
        statusText: connected ? '连接成功' : '连接失败'
      });
      
      if (connected) {
        wx.showToast({
          title: '连接成功',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: '连接失败',
          icon: 'error'
        });
      }
    } catch (error) {
      console.error('连接测试失败:', error);
      this.setData({
        connected: false,
        statusText: '连接错误'
      });
      
      wx.showToast({
        title: '连接错误',
        icon: 'error'
      });
    } finally {
      wx.hideLoading();
    }
  },

  saveConnection() {
    const { ipAddress, connected } = this.data;
    
    if (!ipAddress) {
      wx.showToast({
        title: '请输入IP地址',
        icon: 'none'
      });
      return;
    }
    
    if (!connected) {
      wx.showModal({
        title: '提示',
        content: '连接测试未通过，是否仍要保存?',
        success: (res) => {
          if (res.confirm) {
            this.saveIpAndNavigate();
          }
        }
      });
    } else {
      this.saveIpAndNavigate();
    }
  },

  saveIpAndNavigate() {
    const { ipAddress } = this.data;
    
    // 保存IP地址
    espApi.setIpAddress(ipAddress);
    
    wx.showToast({
      title: '保存成功',
      icon: 'success'
    });
    
    // 延迟后返回上一页或跳转到主页
    setTimeout(() => {
      wx.navigateBack({
        delta: 1,
        fail: () => {
          wx.switchTab({
            url: '/pages/index/index'
          });
        }
      });
    }, 1000);
  }
}); 