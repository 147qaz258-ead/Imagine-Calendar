/**
 * 畅选日历 - 共享交互逻辑
 * 学生职业规划领域的"张雪峰"
 */

// =====================================================
// 全局配置与状态管理
// =====================================================

const AppConfig = {
  // 企业类型颜色映射
  companyTypeColors: {
    soe: '#6b7280',      // 国企 - 灰色
    foreign: '#8b5cf6',  // 外企 - 紫色
    private: '#f59e0b',  // 民企 - 黄色
    startup: '#10b981',  // 创业公司 - 绿色
    gov: '#ef4444',      // 政府机关 - 红色
    ngo: '#06b6d4'       // NGO - 青色
  },

  // 企业类型名称
  companyTypeNames: {
    soe: '国企',
    foreign: '外企',
    private: '民企',
    startup: '创业公司',
    gov: '政府机关',
    ngo: 'NGO'
  },

  // API基础路径（原型使用本地存储模拟）
  apiBaseUrl: '/api',

  // 本地存储键名
  storageKeys: {
    user: 'changxuan_user',
    filters: 'changxuan_filters',
    events: 'changxuan_events',
    token: 'changxuan_token'
  }
};

// 应用状态
const AppState = {
  currentUser: null,
  filters: {},
  isLoading: false
};

// =====================================================
// 工具函数
// =====================================================

/**
 * 格式化日期
 */
function formatDate(date, format = 'YYYY-MM-DD') {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes);
}

/**
 * 获取星期几
 */
function getWeekday(date) {
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return weekdays[new Date(date).getDay()];
}

/**
 * 防抖函数
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 */
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * 生成唯一ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 深拷贝
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// =====================================================
// 本地存储管理
// =====================================================

const Storage = {
  get(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.error('Storage get error:', e);
      return null;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage set error:', e);
      return false;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error('Storage remove error:', e);
      return false;
    }
  },

  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (e) {
      console.error('Storage clear error:', e);
      return false;
    }
  }
};

// =====================================================
// 用户认证模块
// =====================================================

const Auth = {
  /**
   * 检查是否已登录
   */
  isLoggedIn() {
    return !!Storage.get(AppConfig.storageKeys.token);
  },

  /**
   * 获取当前用户
   */
  getCurrentUser() {
    return Storage.get(AppConfig.storageKeys.user);
  },

  /**
   * 模拟登录
   */
  async login(phone, code) {
    // 模拟API请求延迟
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 模拟验证码验证
    if (code !== '123456') {
      throw new Error('验证码错误');
    }

    const user = {
      id: generateId(),
      phone: phone,
      name: '用户' + phone.substr(-4),
      avatar: null,
      createdAt: new Date().toISOString()
    };

    Storage.set(AppConfig.storageKeys.user, user);
    Storage.set(AppConfig.storageKeys.token, 'mock_token_' + generateId());

    AppState.currentUser = user;
    return user;
  },

  /**
   * 退出登录
   */
  logout() {
    Storage.remove(AppConfig.storageKeys.user);
    Storage.remove(AppConfig.storageKeys.token);
    AppState.currentUser = null;
    window.location.href = 'index.html';
  },

  /**
   * 发送验证码（模拟）
   */
  async sendVerificationCode(phone) {
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('验证码已发送至:', phone);
    console.log('模拟验证码: 123456');
    return true;
  }
};

// =====================================================
// 筛选条件管理
// =====================================================

const FilterManager = {
  /**
   * 获取筛选条件
   */
  getFilters() {
    return Storage.get(AppConfig.storageKeys.filters) || {};
  },

  /**
   * 保存筛选条件
   */
  saveFilters(filters) {
    Storage.set(AppConfig.storageKeys.filters, filters);
    AppState.filters = filters;
    return true;
  },

  /**
   * 清除筛选条件
   */
  clearFilters() {
    Storage.remove(AppConfig.storageKeys.filters);
    AppState.filters = {};
    return true;
  },

  /**
   * 检查事件是否符合筛选条件
   */
  matchFilters(event, filters) {
    if (!filters || Object.keys(filters).length === 0) {
      return true;
    }

    // 检查地点
    if (filters.location && filters.location.length > 0) {
      if (!filters.location.includes(event.location) && !filters.location.includes('全国可调配')) {
        return false;
      }
    }

    // 检查平台性质
    if (filters.platformType && filters.platformType.length > 0) {
      if (!filters.platformType.includes(event.companyType)) {
        return false;
      }
    }

    // 检查行业
    if (filters.industry && filters.industry.length > 0) {
      if (!filters.industry.some(ind => event.tags.includes(ind))) {
        return false;
      }
    }

    return true;
  }
};

// =====================================================
// 招聘事件管理
// =====================================================

const EventManager = {
  /**
   * 获取所有事件
   */
  getEvents() {
    return Storage.get(AppConfig.storageKeys.events) || this.getDefaultEvents();
  },

  /**
   * 获取默认模拟数据
   */
  getDefaultEvents() {
    return [
      {
        id: '1',
        title: '中国银行2024春招',
        company: '中国银行',
        companyType: 'soe',
        deadline: '2024-03-15',
        location: '全国',
        tags: ['金融', '银行'],
        url: '#',
        description: '中国银行2024年春季校园招聘'
      },
      {
        id: '2',
        title: '腾讯产品经理培训生',
        company: '腾讯',
        companyType: 'private',
        deadline: '2024-03-20',
        location: '深圳',
        tags: ['互联网', '产品'],
        url: '#',
        description: '腾讯产品经理培训生项目'
      },
      {
        id: '3',
        title: '宝洁管培生项目',
        company: '宝洁',
        companyType: 'foreign',
        deadline: '2024-03-25',
        location: '广州',
        tags: ['快消', '管培生'],
        url: '#',
        description: '宝洁管理培训生项目'
      },
      {
        id: '4',
        title: '字节跳动研发工程师',
        company: '字节跳动',
        companyType: 'private',
        deadline: '2024-03-18',
        location: '北京',
        tags: ['互联网', '研发'],
        url: '#',
        description: '字节跳动研发工程师招聘'
      },
      {
        id: '5',
        title: '国家电网校园招聘',
        company: '国家电网',
        companyType: 'soe',
        deadline: '2024-03-30',
        location: '全国',
        tags: ['能源', '国企'],
        url: '#',
        description: '国家电网2024年校园招聘'
      },
      {
        id: '6',
        title: '微软软件开发工程师',
        company: '微软',
        companyType: 'foreign',
        deadline: '2024-04-01',
        location: '上海',
        tags: ['科技', '研发'],
        url: '#',
        description: '微软软件开发工程师招聘'
      }
    ];
  },

  /**
   * 按日期获取事件
   */
  getEventsByDate(dateStr) {
    const events = this.getEvents();
    return events.filter(e => e.deadline === dateStr);
  },

  /**
   * 按月份获取事件
   */
  getEventsByMonth(year, month) {
    const events = this.getEvents();
    return events.filter(e => {
      const d = new Date(e.deadline);
      return d.getFullYear() === year && d.getMonth() === month;
    });
  },

  /**
   * 添加自定义事件
   */
  addEvent(event) {
    const events = this.getEvents();
    event.id = generateId();
    events.push(event);
    Storage.set(AppConfig.storageKeys.events, events);
    return event;
  },

  /**
   * 计算剩余天数
   */
  getDaysRemaining(deadline) {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end - now;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  },

  /**
   * 格式化截止时间显示
   */
  formatDeadline(deadline) {
    const days = this.getDaysRemaining(deadline);
    if (days < 0) return '已截止';
    if (days === 0) return '今日截止';
    if (days === 1) return '明日截止';
    return `剩余${days}天`;
  }
};

// =====================================================
// UI 组件
// =====================================================

const UI = {
  /**
   * 显示加载状态
   */
  showLoading(container) {
    container.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
      </div>
    `;
  },

  /**
   * 显示空状态
   */
  showEmpty(container, message = '暂无数据') {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <div>${message}</div>
      </div>
    `;
  },

  /**
   * 显示Toast提示
   */
  showToast(message, type = 'info', duration = 2000) {
    // 移除已存在的toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: ${type === 'error' ? '#fef2f2' : type === 'success' ? '#f0fdf4' : '#eff6ff'};
      border: 1px solid ${type === 'error' ? '#fecaca' : type === 'success' ? '#bbf7d0' : '#bfdbfe'};
      color: ${type === 'error' ? '#dc2626' : type === 'success' ? '#16a34a' : '#2563eb'};
      padding: 16px 24px;
      border-radius: 8px;
      z-index: 9999;
      font-size: 14px;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, duration);
  },

  /**
   * 显示确认对话框
   */
  showConfirm(message, onConfirm, onCancel) {
    const result = confirm(message);
    if (result && onConfirm) {
      onConfirm();
    } else if (!result && onCancel) {
      onCancel();
    }
  },

  /**
   * 更新底部导航激活状态
   */
  updateNavigation() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
      const href = item.getAttribute('href');
      if (href === currentPage) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }
};

// =====================================================
// 页面初始化
// =====================================================

document.addEventListener('DOMContentLoaded', function() {
  // 初始化用户状态
  AppState.currentUser = Auth.getCurrentUser();
  AppState.filters = FilterManager.getFilters();

  // 更新导航状态
  UI.updateNavigation();

  console.log('畅选日历已初始化');
  console.log('当前用户:', AppState.currentUser);
  console.log('筛选条件:', AppState.filters);
});

// =====================================================
// 导出模块（供页面使用）
// =====================================================

window.AppConfig = AppConfig;
window.AppState = AppState;
window.Auth = Auth;
window.FilterManager = FilterManager;
window.EventManager = EventManager;
window.UI = UI;
window.Storage = Storage;
window.Utils = {
  formatDate,
  getWeekday,
  debounce,
  throttle,
  generateId,
  deepClone
};