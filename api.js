/**
 * api.js - AI内容人性化处理平台 · 前端调用层
 * 作用：调用 server.py 代理接口，密钥不暴露在前端
 */

const API_BASE = '/api';

// Request queue: serialize API calls to prevent result mixing
let _reqQueue = Promise.resolve();
function _enqueue(fn) {
  _reqQueue = _reqQueue.then(fn).catch(() => {});
  return _reqQueue;
}

// Abort in-flight request when new one starts (debounce)
let _currentController = null;

function _cancelCurrent() {
  if (_currentController) {
    _currentController.abort();
    _currentController = null;
  }
}

/**
 * 调用真实 MiniMax API，统一错误处理
 */
async function callAPI(endpoint, body) {
  // Cancel any in-flight request (debounce)
  _cancelCurrent();
  const ctrl = new AbortController();
  _currentController = ctrl;
  const tid = setTimeout(() => { ctrl.abort(); }, 30000);
  try {
    const resp = await fetch(API_BASE + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    clearTimeout(tid);
    _currentController = null;
    const data = await resp.json();
    if (!data.success) {
      throw new Error(data.error || '请求失败，请稍后重试');
    }
    return data.text;
  } catch (e) {
    clearTimeout(tid);
    _currentController = null;
    if (e.name === 'AbortError' || e.message.includes('aborted')) {
      throw new Error('请求超时（30秒），请稍后重试');
    }
    if (e.message && (
      e.message.includes('Failed to fetch') ||
      e.message.includes('NetworkError') ||
      e.message.includes('net::ERR')
    )) {
      throw new Error('网络连接失败，请检查网络后重试');
    }
    throw e;
  }
}

/**
 * 一键降AI率（改写，去AI特征）
 */
async function rewriteText(text) {
  return _enqueue(() => callAPI('/rewrite', { text }));
}

/**
 * 风格改写
 */
async function styleRewriteText(text, style) {
  return _enqueue(() => callAPI('/style_rewrite', { text, style }));
}

/**
 * 提示词降维（专业→大白话）
 */
async function depromptText(text) {
  return _enqueue(() => callAPI('/deprompt', { text }));
}
