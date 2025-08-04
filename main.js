// ==UserScript==
// @name        自动打开b站字幕
// @namespace   http://tampermonkey.net/
// @version     1.0.3
// @description 自动开启B站视频字幕功能
// @author      NuperAki
// @match       https://www.bilibili.com/video/*
// @icon        https://www.bilibili.com/favicon.ico
// @grant       none
// @supportURL  https://github.com/TheHeartFickle/OpenSubtitleOnBiliBili/issues
// @updateURL   https://github.com/TheHeartFickle/OpenSubtitleOnBiliBili/blob/main/main.js
// ==/UserScript==

(function () {
    let subtitleInterval = null;
    let currentHref = window.location.href;
    
    // 字幕开启状态的d值特征
    const ACTIVE_D_PATTERN = /M40,-30/;

    // 查找字幕按钮
    function findSubtitle() {
        const buttons = document.querySelectorAll('.bpx-common-svg-icon');
        for (const btn of buttons) {
            const parent = btn.parentElement?.parentElement;
            if (parent?.getAttribute('aria-label') === '字幕') {
                return btn;
            }
        }
        return null;
    }

    // 检查字幕按钮是否已激活
    function isSubtitleActive(btn) {
        const maskPath = btn.querySelector('mask path');
        if (!maskPath) return false;
        
        // 检测d属性值
        const dValue = maskPath.getAttribute('d') || '';
        return ACTIVE_D_PATTERN.test(dValue);
    }

    function tryOpenSubtitle() {
        const btn = findSubtitle();
        if (!btn) return false;
        
        // 检查字幕状态
        const isActive = isSubtitleActive(btn);
        if (!isActive) {
            btn.click();
            console.log("B站字幕已自动开启");
            return true;
        }
        return false;
    }

    function openSubtitle() {
        // 清除现有定时器
        if (subtitleInterval) {
            clearInterval(subtitleInterval);
            subtitleInterval = null;
        }

        // 立即尝试打开字幕
        if (tryOpenSubtitle()) return;

        // 设置定时器定期检查
        subtitleInterval = setInterval(() => {
            if (tryOpenSubtitle()) {
                clearInterval(subtitleInterval);
                subtitleInterval = null;
            }
        }, 500);

        // 10秒后自动停止检测
        setTimeout(() => {
            if (subtitleInterval) {
                clearInterval(subtitleInterval);
                subtitleInterval = null;
            }
        }, 10000);
    }

    // 初始检测
    openSubtitle();

    // 监听URL变化（SPA路由切换）
    setInterval(() => {
        if (window.location.href !== currentHref) {
            currentHref = window.location.href;
            openSubtitle();
        }
    }, 500);

    // 页面完全加载后重新检测
    window.addEventListener('load', openSubtitle);
    
    // 监听播放器状态变化
    const playerContainer = document.querySelector('.bpx-player-container, #bilibili-player');
    if (playerContainer) {
        const observer = new MutationObserver(optimizedObserverCallback);
        observer.observe(playerContainer, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
        });
    }
})();