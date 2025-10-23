/**
 * 祝福语管理器 - 负责管理祝福语的显示、搜索、存储等功能
 * @namespace BlessingManager
 */
const BlessingManager = {
    /** @type {Set<string>} 已显示的祝福语文本集合 */
    displayedBlessings: new Set(),
    /** @type {Object|null} 当前显示的祝福语对象 */
    currentBlessing: null,
    /** @type {Array<Object>} 缓存所有祝福语 */
    allBlessings: [],
    /** @type {Array<Object>} 当前已加载的祝福语 */
    loadedBlessings: [],
    /** @type {number} 每页加载数量 */
    pageSize: 50,
    /** @type {number} 当前页数 */
    currentPage: 0,
    /** @type {string} localStorage键名 */
    storageKey: '1024_blessing_progress',
    
    /**
     * 初始化祝福语管理器
     * 加载数据、设置事件监听器、恢复用户进度
     */
    /**
     * 初始化页面管理器
     * 设置时间显示、粒子效果等
     */
    init() {
        this.loadAllBlessings();
        this.loadProgress(); // 加载保存的进度
        this.loadNextPage();
        this.updateCounter();
        this.setupEventListeners();
        this.setupSearchResultsNavigation();
        PageManager.init();
        console.log('BlessingManager initialized with accessibility features');
    },
    
    /**
     * 保存用户进度到localStorage
     * 包括已显示的祝福语、当前页数、点击次数等
     */
    saveProgress() {
        try {
            const progress = {
                displayedBlessings: Array.from(this.displayedBlessings),
                currentPage: this.currentPage,
                clickCount: PageManager.clickCount,
                timestamp: Date.now()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(progress));
            console.log('💾 进度已保存');
        } catch (error) {
            console.warn('⚠️ 保存进度失败:', error);
            this.handleStorageError('SAVE_FAILED', error);
        }
    },
    
    /**
     * 从localStorage加载用户进度
     * 恢复已显示的祝福语、当前页数、点击次数等
     */
    loadProgress() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const progress = JSON.parse(saved);
                
                // 验证数据格式
                if (!progress || typeof progress !== 'object') {
                    throw new Error('进度数据格式无效');
                }
                
                // 检查数据是否过期（7天）
                const daysPassed = (Date.now() - progress.timestamp) / (1000 * 60 * 60 * 24);
                if (daysPassed > 7) {
                    console.log('📅 保存的进度已过期，开始新的旅程');
                    this.clearProgress();
                    return;
                }
                
                // 恢复进度
                this.displayedBlessings = new Set(progress.displayedBlessings || []);
                this.currentPage = progress.currentPage || 0;
                PageManager.clickCount = progress.clickCount || 0;
                
                console.log(`🔄 已恢复进度: ${this.displayedBlessings.size} 条祝福语已收集`);
            }
        } catch (error) {
            console.warn('⚠️ 加载进度失败:', error);
            this.handleStorageError('LOAD_FAILED', error);
            this.clearProgress();
        }
    },
    
    /**
     * 清除保存的用户进度
     * 删除localStorage中的所有进度数据
     */
    clearProgress() {
        try {
            localStorage.removeItem(this.storageKey);
            console.log('🗑️ 进度已清除');
        } catch (error) {
            console.warn('⚠️ 清除进度失败:', error);
            this.handleStorageError('CLEAR_FAILED', error);
        }
    },
    
    /**
     * 处理存储相关错误
     * @param {string} errorType - 错误类型
     * @param {Error} error - 错误对象
     */
    handleStorageError(errorType, error) {
        const errorMessages = {
            'SAVE_FAILED': '无法保存游戏进度，可能是存储空间不足',
            'LOAD_FAILED': '无法加载游戏进度，将重新开始',
            'CLEAR_FAILED': '无法清除游戏进度'
        };
        
        const message = errorMessages[errorType] || '存储操作失败';
        this.showTemporaryMessage(message, 'warning');
    },

    /**
     * 显示临时消息给用户
     * @param {string} message - 要显示的消息内容
     * @param {string} type - 消息类型 ('info', 'warning', 'error')
     */
    showTemporaryMessage(message, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = `temporary-message ${type}`;
        messageEl.textContent = message;
        messageEl.setAttribute('role', 'alert');
        messageEl.setAttribute('aria-live', 'polite');
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            messageEl.style.opacity = '0';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    },
    
    /**
     * 处理按钮点击事件，防止重复点击
     * @param {HTMLElement} button - 按钮元素
     * @param {Function} callback - 点击后执行的回调函数
     */
    handleButtonClick(button, callback) {
        // 防止重复点击
        if (button.disabled) return;
        
        button.disabled = true;
        button.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            callback();
            button.disabled = false;
            button.style.transform = 'scale(1)';
        }, 300);
    },
    
    /**
     * 加载所有祝福语数据
     * 从数据库中读取并随机打乱顺序
     */
    loadAllBlessings() {
        this.allBlessings = [];
        for (const category in BLESSING_DATABASE) {
            BLESSING_DATABASE[category].forEach(blessing => {
                this.allBlessings.push({ text: blessing, category });
            });
        }
        // 随机打乱祝福语顺序，确保每次体验都不同
        this.shuffleArray(this.allBlessings);
    },
    
    /**
     * 随机打乱数组顺序
     * @param {Array} array - 要打乱的数组
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    },
    
    /**
     * 加载下一页祝福语数据
     * 实现分页加载以提高性能
     */
    loadNextPage() {
        const startIndex = this.currentPage * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, this.allBlessings.length);
        
        for (let i = startIndex; i < endIndex; i++) {
            this.loadedBlessings.push(this.allBlessings[i]);
        }
        
        this.currentPage++;
        console.log(`📖 已加载第 ${this.currentPage} 页祝福语，当前可用: ${this.loadedBlessings.length}/${this.allBlessings.length}`);
    },
    
    /**
     * 获取所有祝福语数据
     * @returns {Array<Object>} 所有祝福语数组
     */
    getAllBlessings() {
        return this.allBlessings;
    },
    
    /**
     * 获取已加载的祝福语数据
     * @returns {Array<Object>} 已加载的祝福语数组
     */
    getLoadedBlessings() {
        return this.loadedBlessings;
    },

    /**
     * 搜索祝福语
     * @param {string} keyword - 搜索关键词
     * @returns {Array<Object>} 搜索结果数组
     */
    searchBlessings(keyword) {
        try {
            if (!keyword || keyword.trim() === '') {
                return [];
            }
            
            // 验证搜索关键词长度
            if (keyword.length > 100) {
                this.showTemporaryMessage('搜索关键词过长，请输入较短的关键词', 'warning');
                return [];
            }
            
            const searchTerm = keyword.toLowerCase().trim();
            const results = [];
            
            // 验证数据完整性
            if (!this.allBlessings || !Array.isArray(this.allBlessings)) {
                throw new Error('祝福语数据不可用');
            }
            
            // 搜索所有祝福语
            this.allBlessings.forEach((blessing, index) => {
                try {
                    if (blessing && blessing.text && blessing.category) {
                        if (blessing.text.toLowerCase().includes(searchTerm) || 
                            blessing.category.toLowerCase().includes(searchTerm)) {
                            results.push({
                                ...blessing,
                                index: index,
                                displayed: this.displayedBlessings.has(index)
                            });
                        }
                    }
                } catch (itemError) {
                    console.warn(`搜索第${index}条祝福语时出错:`, itemError);
                }
            });
            
            return results;
        } catch (error) {
            console.error('搜索功能出错:', error);
            this.showTemporaryMessage('搜索功能暂时不可用，请稍后重试', 'error');
            return [];
        }
    },

    /**
     * 显示搜索结果
     * @param {Array<Object>} results - 搜索结果数组
     * @param {string} keyword - 搜索关键词
     */
    showSearchResults(results, keyword) {
        const searchResults = document.getElementById('searchResults');
        const searchResultsList = document.getElementById('searchResultsList');
        const searchResultsTitle = searchResults.querySelector('h3');
        
        if (results.length === 0) {
            searchResultsTitle.textContent = `未找到包含"${keyword}"的祝福语`;
            searchResultsList.innerHTML = '<div class="search-result-item"><div class="search-result-text">没有找到相关祝福语，请尝试其他关键词</div></div>';
        } else {
            searchResultsTitle.textContent = `找到 ${results.length} 条包含"${keyword}"的祝福语`;
            searchResultsList.innerHTML = '';
            
            results.forEach((result, index) => {
                const item = document.createElement('div');
                item.className = `search-result-item ${result.displayed ? 'displayed' : ''}`;
                item.setAttribute('role', 'listitem');
                item.setAttribute('tabindex', '0');
                item.setAttribute('aria-label', `祝福语：${result.text}，分类：${result.category}${result.displayed ? '，已显示过' : ''}`);
                
                item.innerHTML = `
                    <div class="search-result-text">${result.text}</div>
                    <div class="search-result-category">分类：${result.category}</div>
                    ${result.displayed ? '<div class="search-result-status">✓ 已显示过</div>' : ''}
                `;
                
                // 点击搜索结果直接显示该祝福语
                const selectResult = () => {
                    this.showSpecificBlessing(result.index);
                    this.hideSearchResults();
                    this.announceToScreenReader(`已选择祝福语：${result.text}`);
                };
                
                item.addEventListener('click', selectResult);
                item.addEventListener('keydown', (e) => {
                    if (e.code === 'Enter' || e.code === 'Space') {
                        e.preventDefault();
                        selectResult();
                    }
                });
                
                searchResultsList.appendChild(item);
            });
        }
        
        searchResults.style.display = 'block';
        searchResults.scrollIntoView({ behavior: 'smooth' });
    },

    /**
     * 显示特定索引的祝福语
     * @param {number} index - 祝福语在数组中的索引
     */
    showSpecificBlessing(index) {
        const blessing = this.allBlessings[index];
        if (!blessing) return;
        
        // 确保该祝福语已加载
        if (!this.loadedBlessings.some(b => b.text === blessing.text)) {
            this.loadedBlessings.push(blessing);
        }
        
        this.showBlessing(blessing);
        
        // 标记为已显示
        this.displayedBlessings.add(index);
        this.saveProgress();
    },

    /**
     * 隐藏搜索结果面板
     */
    hideSearchResults() {
        document.getElementById('searchResults').style.display = 'none';
    },

    /**
     * 清除搜索输入和结果
     */
    clearSearch() {
        document.getElementById('searchInput').value = '';
        this.hideSearchResults();
    },

    /**
     * 处理模态框中的Tab键导航
     * @param {KeyboardEvent} e - 键盘事件对象
     */
    handleModalTabNavigation(e) {
        const modal = document.getElementById('completionModal');
        const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            }
        } else {
            if (document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        }
    },

    /**
     * 设置搜索结果的键盘导航功能
     * 支持方向键和回车键操作
     */
    setupSearchResultsNavigation() {
        const searchResultsList = document.getElementById('searchResultsList');
        
        searchResultsList.addEventListener('keydown', (e) => {
            const items = searchResultsList.querySelectorAll('.search-result-item');
            const currentIndex = Array.from(items).indexOf(document.activeElement);
            
            switch (e.code) {
                case 'ArrowDown':
                    e.preventDefault();
                    const nextIndex = (currentIndex + 1) % items.length;
                    items[nextIndex]?.focus();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    const prevIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
                    items[prevIndex]?.focus();
                    break;
                case 'Enter':
                case 'Space':
                    e.preventDefault();
                    document.activeElement.click();
                    break;
            }
        });
    },

    /**
     * 向屏幕阅读器宣布状态变化
     * @param {string} message - 要宣布的消息内容
     */
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    },

    /**
     * 生成分享文本
     * @param {Object} blessing - 祝福语对象
     * @returns {string} 格式化的分享文本
     */
    generateShareText(blessing) {
        if (!blessing) {
            blessing = this.currentBlessing;
        }
        
        if (!blessing) {
            return '1024程序员节快乐！愿所有程序员都能收获满满的祝福！';
        }
        
        return `${blessing.text}\n\n——来自1024程序员节祝福语库\n#1024程序员节 #程序员祝福`;
    },

    /**
     * 生成分享链接
     * @returns {string} 当前页面链接
     */
    generateShareUrl() {
        return window.location.href;
    },

    /**
     * 分享到微信
     */
    shareToWeChat() {
        try {
            const text = this.generateShareText();
            const url = this.generateShareUrl();
            
            // 检测是否在微信环境
            if (/MicroMessenger/i.test(navigator.userAgent)) {
                // 在微信中，提示用户使用右上角分享
                this.showShareTip('请点击右上角"..."按钮分享给朋友');
            } else {
                // 在其他环境中，复制文本到剪贴板
                this.copyToClipboard(text + '\n' + url);
                this.showShareSuccess('祝福语已复制，可以粘贴到微信分享');
            }
        } catch (error) {
            console.error('微信分享失败:', error);
            this.showTemporaryMessage('分享失败，请重试', 'error');
        }
    },

    /**
     * 分享到微博
     */
    shareToWeibo() {
        try {
            const text = this.generateShareText();
            const url = this.generateShareUrl();
            const weiboUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`;
            
            window.open(weiboUrl, '_blank', 'width=600,height=400');
            this.showShareSuccess('正在跳转到微博分享页面');
        } catch (error) {
            console.error('微博分享失败:', error);
            this.showTemporaryMessage('分享失败，请重试', 'error');
        }
    },

    /**
     * 分享到QQ
     */
    shareToQQ() {
        try {
            const text = this.generateShareText();
            const url = this.generateShareUrl();
            const qqUrl = `https://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`;
            
            window.open(qqUrl, '_blank', 'width=600,height=400');
            this.showShareSuccess('正在跳转到QQ分享页面');
        } catch (error) {
            console.error('QQ分享失败:', error);
            this.showTemporaryMessage('分享失败，请重试', 'error');
        }
    },

    /**
     * 复制链接到剪贴板
     */
    async copyLink() {
        try {
            const text = this.generateShareText();
            const url = this.generateShareUrl();
            const shareContent = `${text}\n\n链接：${url}`;
            
            await this.copyToClipboard(shareContent);
            this.showShareSuccess('祝福语和链接已复制到剪贴板');
        } catch (error) {
            console.error('复制链接失败:', error);
            this.showTemporaryMessage('复制失败，请重试', 'error');
        }
    },

    /**
     * 复制文本到剪贴板
     * @param {string} text - 要复制的文本
     */
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                // 使用现代 Clipboard API
                await navigator.clipboard.writeText(text);
            } else {
                // 降级方案：使用传统方法
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.left = '-999999px';
                textArea.style.top = '-999999px';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                
                if (!successful) {
                    throw new Error('复制命令执行失败');
                }
            }
        } catch (error) {
            console.error('复制到剪贴板失败:', error);
            throw error;
        }
    },

    /**
     * 显示分享成功提示
     * @param {string} message - 成功消息
     */
    showShareSuccess(message) {
        const successElement = document.createElement('div');
        successElement.className = 'share-success';
        successElement.textContent = message;
        successElement.setAttribute('role', 'alert');
        successElement.setAttribute('aria-live', 'polite');
        
        document.body.appendChild(successElement);
        
        setTimeout(() => {
            if (successElement.parentNode) {
                document.body.removeChild(successElement);
            }
        }, 2000);
    },

    /**
     * 显示分享提示
     * @param {string} message - 提示消息
     */
    showShareTip(message) {
        this.showTemporaryMessage(message, 'info', 4000);
    },

    /**
     * 切换分享选项显示
     */
    toggleShareOptions() {
        const shareOptions = document.getElementById('shareOptions');
        if (shareOptions) {
            const isVisible = shareOptions.style.display !== 'none';
            shareOptions.style.display = isVisible ? 'none' : 'flex';
            
            // 为屏幕阅读器宣布状态
            this.announceToScreenReader(isVisible ? '分享选项已隐藏' : '分享选项已显示');
        }
    },
    
    /**
     * 获取一个随机的未显示过的祝福语
     * @returns {Object|null} 祝福语对象或null（如果没有未显示的）
     */
    getRandomUnDisplayedBlessing() {
        // 首先从已加载的祝福语中查找未显示的
        const loadedUnDisplayed = this.loadedBlessings.filter(blessing => 
            !this.displayedBlessings.has(blessing.text)
        );
        
        // 如果已加载的祝福语不够，且还有更多页面可以加载
        if (loadedUnDisplayed.length < 10 && this.currentPage * this.pageSize < this.allBlessings.length) {
            this.loadNextPage();
            // 重新获取未显示的祝福语
            const updatedUnDisplayed = this.loadedBlessings.filter(blessing => 
                !this.displayedBlessings.has(blessing.text)
            );
            
            if (updatedUnDisplayed.length === 0) {
                return null;
            }
            
            const randomIndex = Math.floor(Math.random() * updatedUnDisplayed.length);
            return updatedUnDisplayed[randomIndex];
        }
        
        // 如果没有未显示的祝福语了
        if (loadedUnDisplayed.length === 0) {
            // 检查是否所有祝福语都已显示
            if (this.displayedBlessings.size >= this.allBlessings.length) {
                return null;
            }
            // 如果还有未加载的，加载下一页
            if (this.currentPage * this.pageSize < this.allBlessings.length) {
                this.loadNextPage();
                return this.getRandomUnDisplayedBlessing();
            }
            return null;
        }
        
        const randomIndex = Math.floor(Math.random() * loadedUnDisplayed.length);
        return loadedUnDisplayed[randomIndex];
    },
    
    /**
     * 显示祝福语
     * @param {Object|null} specificBlessing - 指定要显示的祝福语，为null时随机选择
     */
    showBlessing(specificBlessing = null) {
        try {
            const blessing = specificBlessing || this.getRandomUnDisplayedBlessing();
            
            if (!blessing) {
                this.showCompletion();
                return;
            }
            
            // 验证祝福语数据
            if (!blessing.text || !blessing.category) {
                throw new Error('祝福语数据不完整');
            }
            
            this.currentBlessing = blessing;
            this.displayedBlessings.add(blessing.text);
            
            const textElement = document.getElementById('blessingText');
            const categoryElement = document.getElementById('blessingCategory');
            const displayElement = document.getElementById('blessingDisplay');
            const shareButtons = document.getElementById('shareButtons');
            
            // 验证DOM元素
            if (!textElement || !categoryElement || !displayElement) {
                throw new Error('页面元素不可用');
            }
            
            // 隐藏当前内容
            textElement.classList.remove('show');
            categoryElement.classList.remove('show');
            displayElement.classList.add('updating');
            
            setTimeout(() => {
                try {
                    textElement.textContent = blessing.text;
                    // categoryElement.textContent = `分类：${blessing.category}`;
                    
                    // 显示新内容
                    textElement.classList.add('show');
                    categoryElement.classList.add('show');
                    displayElement.classList.remove('updating');
                    
                    // 显示分享按钮
                    if (shareButtons) {
                        shareButtons.style.display = 'block';
                    }
                    
                    // 添加打字机效果
                    this.typeWriterEffect(textElement, blessing.text);
                    
                    // 为屏幕阅读器宣布新的祝福语
                    this.announceToScreenReader(`新的祝福语：${blessing.text}，分类：${blessing.category}`);
                } catch (displayError) {
                    console.error('更新显示内容时出错:', displayError);
                    this.showTemporaryMessage('显示内容更新失败', 'error');
                }
            }, 200);
            
            this.updateCounter();
            PageManager.updateClickCount();
            
            // 保存进度
            this.saveProgress();
            
            // 检查是否完成
            if (this.displayedBlessings.size >= this.getAllBlessings().length) {
                setTimeout(() => this.showCompletion(), 1000);
            }
            
        } catch (error) {
            console.error('显示祝福语时出错:', error);
            this.showTemporaryMessage('显示祝福语时出现问题，请重试', 'error');
            
            // 尝试恢复：显示默认祝福语
            try {
                const textElement = document.getElementById('blessingText');
                if (textElement) {
                    textElement.textContent = '愿你每天都有好心情！';
                    this.announceToScreenReader('显示了默认祝福语');
                }
            } catch (recoveryError) {
                console.error('恢复显示失败:', recoveryError);
                this.showTemporaryMessage('系统出现严重错误，请刷新页面', 'error');
            }
        }
    },
    
    /**
     * 打字机效果动画
     * @param {HTMLElement} element - 目标元素
     * @param {string} text - 要显示的文本
     */
    typeWriterEffect(element, text) {
        element.textContent = '';
        let i = 0;
        const speed = 50; // 打字速度
        
        function typeChar() {
            if (i < text.length) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(typeChar, speed);
            }
        }
        
        typeChar();
    },
    
    /**
     * 更新祝福语计数器显示
     */
    updateCounter() {
        document.getElementById('blessingCount').textContent = this.displayedBlessings.size;
        document.getElementById('totalBlessings').textContent = this.getAllBlessings().length;
    },
    
    /**
     * 创建烟花特效动画
     */
    createFireworks() {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const firework = document.createElement('div');
                firework.className = 'firework';
                firework.style.left = Math.random() * window.innerWidth + 'px';
                firework.style.top = Math.random() * window.innerHeight + 'px';
                
                const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'];
                
                for (let j = 0; j < 12; j++) {
                    const particle = document.createElement('div');
                    particle.className = 'firework-particle';
                    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
                    particle.style.transform = `rotate(${j * 30}deg) translateX(${50 + Math.random() * 50}px)`;
                    firework.appendChild(particle);
                }
                
                document.body.appendChild(firework);
                
                setTimeout(() => {
                    document.body.removeChild(firework);
                }, 1000);
            }, i * 200);
        }
    },
    
    /**
     * 显示完成祝贺界面
     */
    showCompletion() {
        const modal = document.getElementById('completionModal');
        modal.style.display = 'flex';
        
        // 焦点管理 - 将焦点移到模态框的第一个按钮
        setTimeout(() => {
            const firstButton = modal.querySelector('button');
            if (firstButton) {
                firstButton.focus();
            }
        }, 100);
        
        // 为屏幕阅读器宣布完成状态
        this.announceToScreenReader('恭喜！您已经收集了所有1024条祝福语！');
        
        // 创建特殊烟花效果
        for (let i = 0; i < 10; i++) {
            setTimeout(() => this.createFireworks(), i * 200);
        }
    },
    
    /**
     * 关闭完成祝贺界面
     */
    closeCompletion() {
        document.getElementById('completionModal').style.display = 'none';
    },
    
    /**
     * 重置应用状态
     * 清除所有进度，重新开始
     */
    reset() {
        this.displayedBlessings.clear();
        this.currentBlessing = null;
        
        // 重置分页状态
        this.loadedBlessings = [];
        this.currentPage = 0;
        this.loadNextPage(); // 重新加载第一页
        
        // 清除保存的进度
        this.clearProgress();
        
        const textElement = document.getElementById('blessingText');
        const categoryElement = document.getElementById('blessingCategory');
        
        textElement.classList.remove('show');
        categoryElement.classList.remove('show');
        
        setTimeout(() => {
            textElement.textContent = '点击这里或按空格键获取程序员祝福语';
            categoryElement.textContent = '';
        }, 150);
        
        this.updateCounter();
        this.closeCompletion();
        PageManager.resetClickCount();
        
        console.log('🔄 系统已重置，重新开始祝福语收集之旅！');
    },
    
    /**
     * 设置事件监听器
     * 包括点击、键盘、搜索等事件
     */
    setupEventListeners() {
        // 点击事件
        const blessingDisplay = document.getElementById('blessingDisplay');
        blessingDisplay.addEventListener('click', () => {
            this.handleButtonClick(blessingDisplay, () => this.showBlessing());
        });
        
        // 键盘事件支持
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space' && !event.target.matches('input, textarea, button')) {
                event.preventDefault();
                this.handleButtonClick(blessingDisplay, () => this.showBlessing());
            }
            if (event.code === 'Escape') {
                this.closeCompletion();
                this.hideSearchResults();
            }
        });

        // 祝福语显示区域的键盘支持
        blessingDisplay.addEventListener('keydown', (e) => {
            if (e.code === 'Enter' || e.code === 'Space') {
                e.preventDefault();
                this.handleButtonClick(blessingDisplay, () => this.showBlessing());
            }
        });

        // 模态框焦点管理
        const modal = document.getElementById('completionModal');
        modal.addEventListener('keydown', (e) => {
            if (e.code === 'Tab') {
                this.handleModalTabNavigation(e);
            }
        });

        // 搜索功能事件监听器
        const searchInput = document.getElementById('searchInput');
        const searchBtn = document.getElementById('searchBtn');
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        const closeSearchBtn = document.getElementById('closeSearchBtn');

        // 搜索按钮点击
        searchBtn.addEventListener('click', () => {
            const keyword = searchInput.value.trim();
            if (keyword) {
                const results = this.searchBlessings(keyword);
                this.showSearchResults(results, keyword);
            }
        });

        // 清除搜索按钮点击
        clearSearchBtn.addEventListener('click', () => {
            this.clearSearch();
        });

        // 关闭搜索结果按钮点击
        closeSearchBtn.addEventListener('click', () => {
            this.hideSearchResults();
        });

        // 分享功能事件监听
        const shareBtn = document.getElementById('shareBtn');
        if (shareBtn) {
            shareBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleShareOptions();
            });
        }

        // 分享到微信
        const shareWeChat = document.getElementById('shareWeChat');
        if (shareWeChat) {
            shareWeChat.addEventListener('click', (e) => {
                e.stopPropagation();
                this.shareToWeChat();
                this.toggleShareOptions();
            });
        }

        // 分享到微博
        const shareWeibo = document.getElementById('shareWeibo');
        if (shareWeibo) {
            shareWeibo.addEventListener('click', (e) => {
                e.stopPropagation();
                this.shareToWeibo();
                this.toggleShareOptions();
            });
        }

        // 分享到QQ
        const shareQQ = document.getElementById('shareQQ');
        if (shareQQ) {
            shareQQ.addEventListener('click', (e) => {
                e.stopPropagation();
                this.shareToQQ();
                this.toggleShareOptions();
            });
        }

        // 复制链接
        const copyLink = document.getElementById('copyLink');
        if (copyLink) {
            copyLink.addEventListener('click', async (e) => {
                e.stopPropagation();
                await this.copyLink();
                this.toggleShareOptions();
            });
        }

        // 搜索输入框回车键
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const keyword = searchInput.value.trim();
                if (keyword) {
                    const results = this.searchBlessings(keyword);
                    this.showSearchResults(results, keyword);
                }
            }
        });

        // 搜索输入框实时搜索（可选）
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const keyword = e.target.value.trim();
            
            if (keyword.length >= 2) {
                searchTimeout = setTimeout(() => {
                    const results = this.searchBlessings(keyword);
                    this.showSearchResults(results, keyword);
                }, 500); // 延迟500ms进行搜索
            } else if (keyword.length === 0) {
                this.hideSearchResults();
            }
        });

        // 点击页面其他地方关闭搜索结果和分享选项
        document.addEventListener('click', (e) => {
            const searchContainer = document.getElementById('searchContainer');
            if (searchContainer && !searchContainer.contains(e.target)) {
                this.hideSearchResults();
            }

            // 关闭分享选项
            const shareButtons = document.querySelector('.share-buttons');
            if (shareButtons && !shareButtons.contains(e.target)) {
                const shareOptions = document.getElementById('shareOptions');
                if (shareOptions && shareOptions.style.display === 'flex') {
                    shareOptions.style.display = 'none';
                    this.announceToScreenReader('分享选项已关闭');
                }
            }
        });
    }
};

/**
 * 页面管理器 - 负责页面UI效果和交互
 * @namespace PageManager
 */
const PageManager = {
    clickCount: 0,
    
    init() {
        this.updateDateTime();
        this.createParticles();
        this.updateHeartPattern();
        
        // 定时更新时间
        setInterval(() => this.updateDateTime(), 1000);
        
        // 定时更新心形图案
        setInterval(() => this.updateHeartPattern(), 3000);
    },
    
    /**
     * 更新点击计数显示
     */
    updateClickCount() {
        this.clickCount++;
        document.getElementById('clickCount').textContent = this.clickCount;
    },
    
    /**
     * 重置点击计数
     */
    resetClickCount() {
        this.clickCount = 0;
        document.getElementById('clickCount').textContent = this.clickCount;
    },
    
    /**
     * 更新日期时间显示
     */
    updateDateTime() {
        const now = new Date();
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            weekday: 'long'
        };
        document.getElementById('dateDisplay').textContent = now.toLocaleDateString('zh-CN', options);
    },
    
    /**
     * 创建背景粒子效果
     */
    createParticles() {
        const particlesContainer = document.getElementById('particles');
        
        setInterval(() => {
            if (document.querySelectorAll('.particle').length < 50) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * window.innerWidth + 'px';
                particle.style.animationDelay = Math.random() * 2 + 's';
                particle.style.animationDuration = (4 + Math.random() * 4) + 's';
                
                particlesContainer.appendChild(particle);
                
                setTimeout(() => {
                    if (particle.parentNode) {
                        particle.parentNode.removeChild(particle);
                    }
                }, 8000);
            }
        }, 200);
    },
    
    /**
     * 更新心形图案显示
     */
    updateHeartPattern() {
        const patterns = [
            '❤️💻❤️',
            '💖🖥️💖',
            '💝⌨️💝',
            '💗🖱️💗',
            '💓💾💓',
            '💕🔧💕'
        ];
        const randomPattern = patterns[Math.floor(Math.random() * patterns.length)];
        document.getElementById('heartPattern').textContent = randomPattern;
    }
};

/**
 * 应用初始化器 - 负责应用的启动和错误处理
 * @namespace AppInitializer
 */
const AppInitializer = {
    /**
     * 初始化应用
     * 检查数据完整性并启动系统
     */
    async init() {
        try {
            // 使用重试机制初始化应用
            await this.retryOperation(async () => {
                // 检查祝福语数据库是否加载
                if (typeof BLESSING_DATABASE === 'undefined') {
                    throw new Error('祝福语数据库未加载');
                }
                
                // 验证数据完整性
                if (!BLESSING_DATABASE || Object.keys(BLESSING_DATABASE).length === 0) {
                    throw new Error('祝福语数据格式错误或为空');
                }
                
                console.log('🎉 1024程序员节祝福语库系统启动成功！');
                console.log('📊 数据库统计：');
                
                let totalCount = 0;
                for (const category in BLESSING_DATABASE) {
                    const count = BLESSING_DATABASE[category].length;
                    console.log(`   ${category}: ${count}条`);
                    totalCount += count;
                }
                console.log(`   总计: ${totalCount}条祝福语`);
                console.log('💡 提示：点击页面或按空格键开始收集祝福语！');
                
                BlessingManager.init();
            }, 3, 1000);
        } catch (error) {
            if (error.message.includes('祝福语数据库未加载')) {
                this.handleError('祝福语数据库未加载', 'BLESSING_DATA_MISSING', error);
            } else if (error.message.includes('祝福语数据格式错误')) {
                this.handleError('祝福语数据格式错误或为空', 'BLESSING_DATA_INVALID', error);
            } else if (error.message.includes('网络连接不可用')) {
                this.handleError('网络连接失败', 'NETWORK_ERROR', error);
            } else {
                this.handleError('应用初始化失败', 'INIT_ERROR', error);
            }
        }
    },

    /**
     * 检查网络连接状态
     * @returns {Promise<boolean>} 网络连接是否正常
     */
    async checkNetworkConnection() {
        try {
            // 尝试访问一个轻量级的资源
            const response = await fetch(window.location.href, {
                method: 'HEAD',
                cache: 'no-cache',
                timeout: 5000
            });
            return response.ok;
        } catch (error) {
            console.warn('网络连接检查失败:', error);
            return false;
        }
    },

    /**
     * 重试机制
     * @param {Function} operation - 要重试的操作
     * @param {number} maxRetries - 最大重试次数
     * @param {number} delay - 重试延迟时间（毫秒）
     * @returns {Promise<any>} 操作结果
     */
    async retryOperation(operation, maxRetries = 3, delay = 1000) {
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                console.warn(`操作失败，第${attempt}次尝试:`, error);
                
                if (attempt === maxRetries) {
                    throw error;
                }
                
                // 检查网络连接
                const isOnline = await this.checkNetworkConnection();
                if (!isOnline) {
                    throw new Error('网络连接不可用');
                }
                
                // 等待后重试
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
            }
        }
    },

    /**
     * 错误处理方法
     * @param {string} message - 错误消息
     * @param {string} errorCode - 错误代码
     * @param {Error|null} originalError - 原始错误对象
     */
    handleError(message, errorCode, originalError = null) {
        console.error(`[${errorCode}] ${message}`, originalError);
        
        // 根据错误类型显示不同的错误信息
        let errorMessage = message;
        let canRetry = false;
        
        if (originalError && originalError.name === 'TypeError' && originalError.message.includes('fetch')) {
            errorMessage = '网络连接失败，请检查网络连接';
            canRetry = true;
        } else if (originalError && originalError.message.includes('网络连接不可用')) {
            errorMessage = '网络连接不可用，请检查网络设置';
            canRetry = true;
        } else if (originalError && originalError.message.includes('timeout')) {
            errorMessage = '操作超时，请重试';
            canRetry = true;
        }
        
        // 显示用户友好的错误信息
        this.showErrorMessage(errorMessage, errorCode);
        
        // 尝试恢复或提供备用方案
        this.attemptRecovery(errorCode);
    },

    /**
     * 显示错误信息给用户
     * @param {string} message - 错误消息
     * @param {string} errorCode - 错误代码
     */
    showErrorMessage(message, errorCode) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'error-message';
        errorContainer.setAttribute('role', 'alert');
        errorContainer.setAttribute('aria-live', 'assertive');
        
        errorContainer.innerHTML = `
            <div class="error-content">
                <h3>⚠️ 系统提示</h3>
                <p>${message}</p>
                <p class="error-code">错误代码: ${errorCode}</p>
                <button class="error-retry-btn" onclick="location.reload()">重新加载</button>
            </div>
        `;
        
        document.body.appendChild(errorContainer);
    },

    /**
     * 尝试错误恢复
     * @param {string} errorCode - 错误代码
     */
    async attemptRecovery(errorCode) {
        switch (errorCode) {
            case 'BLESSING_DATA_MISSING':
            case 'BLESSING_DATA_INVALID':
                // 尝试使用备用数据
                this.loadFallbackData();
                break;
            case 'NETWORK_ERROR':
                // 检查网络连接并提示用户
                const isOnline = await this.checkNetworkConnection();
                if (!isOnline) {
                    setTimeout(() => {
                        if (confirm('网络连接似乎有问题，是否重试？')) {
                            location.reload();
                        }
                    }, 2000);
                } else {
                    // 网络正常，尝试重新初始化
                    console.log('网络连接正常，尝试重新初始化...');
                    setTimeout(() => {
                        this.init();
                    }, 1000);
                }
                break;
            default:
                // 通用恢复策略
                console.log('尝试通用错误恢复...');
        }
    },

    /**
     * 加载备用祝福语数据
     * 当主数据加载失败时使用
     */
    loadFallbackData() {
        console.log('尝试加载备用祝福语数据...');
        
        // 创建基本的备用祝福语
        window.BLESSING_DATABASE = {
            "节日祝福": [
                "1024程序员节快乐！愿你的代码永远没有bug！",
                "程序员节快乐，愿你的bug越来越少！"
            ],
            "技术祝福": [
                "愿你的程序运行如丝般顺滑！",
                "愿你的每一行代码都充满智慧！"
            ],
            "励志祝福": [
                "祝你在编程的道路上越走越远！"
            ]
        };
        
        console.log('备用数据加载完成，继续初始化...');
        this.showTemporaryMessage('已加载备用祝福语数据', 'info');
        BlessingManager.init();
    },

    /**
     * 显示临时消息
     * @param {string} message - 消息内容
     * @param {string} type - 消息类型
     * @param {number} duration - 显示持续时间（毫秒）
     */
    showTemporaryMessage(message, type = 'info', duration = 3000) {
        try {
            // 创建消息元素
            const messageElement = document.createElement('div');
            messageElement.className = `temporary-message ${type}`;
            messageElement.textContent = message;
            messageElement.setAttribute('role', 'alert');
            messageElement.setAttribute('aria-live', 'polite');
            
            // 添加到页面
            document.body.appendChild(messageElement);
            
            // 自动移除
            setTimeout(() => {
                if (messageElement.parentNode) {
                    messageElement.style.opacity = '0';
                    setTimeout(() => {
                        if (messageElement.parentNode) {
                            document.body.removeChild(messageElement);
                        }
                    }, 300);
                }
            }, duration);
            
        } catch (error) {
            console.error('显示临时消息失败:', error);
            // 降级到alert
            alert(message);
        }
    }
};

/**
 * 页面加载完成后初始化应用
 */
document.addEventListener('DOMContentLoaded', async () => {
    await AppInitializer.init();
});

/**
 * 监听网络状态变化
 */
window.addEventListener('online', () => {
    console.log('🌐 网络连接已恢复');
    AppInitializer.showTemporaryMessage('网络连接已恢复', 'success');
});

window.addEventListener('offline', () => {
    console.log('📡 网络连接已断开');
    AppInitializer.showTemporaryMessage('网络连接已断开，某些功能可能不可用', 'warning');
});