// 1024程序员节祝福语应用功能测试脚本
// 在浏览器控制台中运行此脚本来测试主要功能

console.log('🧪 开始功能兼容性测试...');

// 测试1: 检查BlessingManager是否正确初始化
function testBlessingManagerInit() {
    console.log('📋 测试1: BlessingManager初始化');
    if (typeof window.blessingManager !== 'undefined') {
        console.log('✅ BlessingManager已正确初始化');
        return true;
    } else {
        console.error('❌ BlessingManager未初始化');
        return false;
    }
}

// 测试2: 检查收藏功能开关
function testFavoriteToggle() {
    console.log('📋 测试2: 收藏功能开关');
    const favoriteToggle = document.getElementById('favoriteToggle');
    if (favoriteToggle) {
        console.log('✅ 收藏开关元素存在');
        // 测试开关状态
        const isChecked = favoriteToggle.checked;
        console.log(`📊 收藏开关当前状态: ${isChecked ? '启用' : '禁用'}`);
        return true;
    } else {
        console.error('❌ 收藏开关元素不存在');
        return false;
    }
}

// 测试3: 检查分享功能开关
function testShareToggle() {
    console.log('📋 测试3: 分享功能开关');
    const shareToggle = document.getElementById('shareToggle');
    if (shareToggle) {
        console.log('✅ 分享开关元素存在');
        const isChecked = shareToggle.checked;
        console.log(`📊 分享开关当前状态: ${isChecked ? '启用' : '禁用'}`);
        return true;
    } else {
        console.error('❌ 分享开关元素不存在');
        return false;
    }
}

// 测试4: 检查页面布局调整功能
function testPageLayout() {
    console.log('📋 测试4: 页面布局调整');
    if (typeof window.blessingManager.updatePageLayout === 'function') {
        console.log('✅ 页面布局更新方法存在');
        return true;
    } else {
        console.error('❌ 页面布局更新方法不存在');
        return false;
    }
}

// 测试5: 检查响应式设计
function testResponsiveDesign() {
    console.log('📋 测试5: 响应式设计');
    const container = document.querySelector('.container');
    if (container) {
        const styles = window.getComputedStyle(container);
        console.log(`📊 容器最大宽度: ${styles.maxWidth}`);
        console.log(`📊 容器内边距: ${styles.padding}`);
        console.log('✅ 响应式容器样式正常');
        return true;
    } else {
        console.error('❌ 主容器元素不存在');
        return false;
    }
}

// 测试6: 检查本地存储功能
function testLocalStorage() {
    console.log('📋 测试6: 本地存储功能');
    try {
        // 测试存储
        localStorage.setItem('test_key', 'test_value');
        const value = localStorage.getItem('test_key');
        localStorage.removeItem('test_key');
        
        if (value === 'test_value') {
            console.log('✅ 本地存储功能正常');
            return true;
        } else {
            console.error('❌ 本地存储读取失败');
            return false;
        }
    } catch (error) {
        console.error('❌ 本地存储不可用:', error);
        return false;
    }
}

// 运行所有测试
function runAllTests() {
    console.log('🚀 开始运行所有兼容性测试...\n');
    
    const tests = [
        testBlessingManagerInit,
        testFavoriteToggle,
        testShareToggle,
        testPageLayout,
        testResponsiveDesign,
        testLocalStorage
    ];
    
    let passedTests = 0;
    const totalTests = tests.length;
    
    tests.forEach((test, index) => {
        try {
            if (test()) {
                passedTests++;
            }
        } catch (error) {
            console.error(`❌ 测试${index + 1}执行失败:`, error);
        }
        console.log(''); // 空行分隔
    });
    
    console.log('📊 测试结果汇总:');
    console.log(`✅ 通过测试: ${passedTests}/${totalTests}`);
    console.log(`❌ 失败测试: ${totalTests - passedTests}/${totalTests}`);
    
    if (passedTests === totalTests) {
        console.log('🎉 所有测试通过！应用兼容性良好！');
    } else {
        console.log('⚠️ 部分测试失败，请检查相关功能');
    }
    
    return passedTests === totalTests;
}

// 自动运行测试
runAllTests();