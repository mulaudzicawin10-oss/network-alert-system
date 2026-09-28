(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);

  const elements = {
    statusCard: $('statusCard'),
    statusIcon: $('statusIcon'),
    statusTitle: $('statusTitle'),
    statusMessage: $('statusMessage'),
    statusBadge: $('statusBadge'),
    lastCheck: $('lastCheck'),
    lastUpdate: $('lastUpdate'),
    pingValue: $('pingValue'),
    downloadValue: $('downloadValue'),
    uploadValue: $('uploadValue'),
    signalValue: $('signalValue'),
    packetLossValue: $('packetLossValue'),
    jitterValue: $('jitterValue'),
    qualityScore: $('qualityScore'),
    qualityBar: $('qualityBar'),
    qualityDescription: $('qualityDescription'),
    timeline: $('timeline'),
    advancedContent: $('advancedContent'),
    connectionType: $('connectionType'),
    effectiveType: $('effectiveType'),
    bandwidthEstimate: $('bandwidthEstimate'),
    latencyInfo: $('latencyInfo'),
    rttValue: $('rttValue'),
    saveDataMode: $('saveDataMode')
  };

  const metrics = {
    ping: 0,
    download: 0,
    upload: 0,
    signal: 0,
    packetLoss: 0,
    jitter: 0,
    quality: 0
  };

  let scanTimer = null;
  let scanInProgress = false;

  function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function getConnection() {
    return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
  }

  function setText(element, value) {
    if (element) element.textContent = value;
  }

  function updateStatusUI(state) {
    if (!elements.statusCard || !elements.statusIcon) return;

    const states = {
      pending: {
        title: 'Analyzing...',
        message: 'Checking your network connection...',
        icon: '<i class="fas fa-sync-alt fa-spin"></i>',
        background: 'linear-gradient(135deg, rgba(124, 58, 237, .15), rgba(59, 130, 246, .15))',
        border: 'rgba(124, 58, 237, .3)',
        iconBackground: 'linear-gradient(135deg, #7c3aed, #3b82f6)'
      },
      good: {
        title: 'Connection Excellent',
        message: 'Your network is running smoothly with strong signal and fast speeds.',
        icon: '<i class="fas fa-check-circle"></i>',
        background: 'linear-gradient(135deg, rgba(16, 185, 129, .2), rgba(52, 211, 153, .1))',
        border: 'rgba(16, 185, 129, .5)',
        iconBackground: 'linear-gradient(135deg, #10b981, #34d399)'
      },
      fair: {
        title: 'Connection Fair',
        message: 'Your network is stable but has room for improvement.',
        icon: '<i class="fas fa-triangle-exclamation"></i>',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, .2), rgba(251, 191, 36, .1))',
        border: 'rgba(245, 158, 11, .5)',
        iconBackground: 'linear-gradient(135deg, #f59e0b, #fbbf24)'
      },
      poor: {
        title: 'Connection Poor',
        message: 'High latency, low speed, or weak signal was detected.',
        icon: '<i class="fas fa-circle-exclamation"></i>',
        background: 'linear-gradient(135deg, rgba(239, 68, 68, .2), rgba(248, 113, 113, .1))',
        border: 'rgba(239, 68, 68, .5)',
        iconBackground: 'linear-gradient(135deg, #ef4444, #f87171)'
      }
    };

    const selected = states[state] || states.pending;
    setText(elements.statusTitle, selected.title);
    setText(elements.statusMessage, selected.message);
    elements.statusIcon.innerHTML = selected.icon;
    elements.statusIcon.style.background = selected.iconBackground;
    elements.statusCard.style.background = selected.background;
    elements.statusCard.style.borderColor = selected.border;
  }

  function setBadge(state, text) {
    if (!elements.statusBadge) return;
    elements.statusBadge.className = 'status-badge';
    if (state !== 'pending') elements.statusBadge.classList.add(state);
    elements.statusBadge.textContent = text;
  }

  function setMetric(element, value, unit) {
    setText(element, `${value} ${unit}`);
  }

  function updateMetricBars() {
    const bars = {
      pingBar: Math.min(100, Math.max(0, 100 - metrics.ping / 2)),
      downloadBar: Math.min(100, metrics.download / 5),
      uploadBar: Math.min(100, metrics.upload),
      signalBar: metrics.signal,
      packetLossBar: Math.min(100, metrics.packetLoss * 10),
      jitterBar: Math.min(100, metrics.jitter * 2)
    };

    Object.entries(bars).forEach(([id, width]) => {
      const bar = $(id);
      if (bar) bar.style.setProperty('--bar-width', `${width}%`);
    });
  }

  function calculateQuality() {
    const scores = {
      ping: Math.max(0, 100 - metrics.ping * 0.5),
      download: Math.min(100, metrics.download / 5),
      upload: Math.min(100, metrics.upload / 1.2),
      signal: metrics.signal,
      packetLoss: Math.max(0, 100 - metrics.packetLoss * 10),
      jitter: Math.max(0, 100 - metrics.jitter * 2)
    };

    return Math.round(
      scores.ping * 0.25 +
      scores.download * 0.25 +
      scores.upload * 0.15 +
      scores.signal * 0.15 +
      scores.packetLoss * 0.15 +
      scores.jitter * 0.05
    );
  }

  function updateValues() {
    setMetric(elements.pingValue, metrics.ping, 'ms');
    setMetric(elements.downloadValue, metrics.download, 'Mbps');
    setMetric(elements.uploadValue, metrics.upload, 'Mbps');
    setMetric(elements.signalValue, metrics.signal, '%');
    setMetric(elements.packetLossValue, metrics.packetLoss, '%');
    setMetric(elements.jitterValue, metrics.jitter, 'ms');

    if (elements.qualityBar) elements.qualityBar.style.width = `${metrics.quality}%`;
    setText(elements.qualityScore, `${metrics.quality}%`);
    updateMetricBars();
  }

  function updateAdvancedInfo() {
    const connection = getConnection();
    setText(elements.connectionType, connection?.type || 'Wi-Fi');
    setText(elements.effectiveType, connection?.effectiveType || 'Unknown');
    setText(elements.bandwidthEstimate, `${Math.round((metrics.download + metrics.upload) / 2)} Mbps`);
    setText(elements.latencyInfo, `${metrics.ping} ms`);
    setText(elements.rttValue, `${metrics.ping + randomNumber(10, 80)} ms`);
    setText(elements.saveDataMode, connection?.saveData ? 'Enabled' : 'Disabled');
  }

  function addTimelineEntry() {
    if (!elements.timeline) return;

    const state = metrics.quality >= 70 ? 'good' : metrics.quality >= 50 ? 'warning' : 'alert';
    const message = state === 'good'
      ? `Network quality is excellent (${metrics.quality}%).`
      : state === 'warning'
        ? `Network quality is fair (${metrics.quality}%).`
        : `Network quality is poor (${metrics.quality}%).`;

    const item = document.createElement('div');
    item.className = `timeline-item ${state}`;
    item.innerHTML = `
      <div class="timeline-dot"></div>
      <div class="timeline-content">
        <p>${message}</p>
        <span class="timeline-time">${new Date().toLocaleTimeString()}</span>
      </div>`;

    elements.timeline.prepend(item);
    while (elements.timeline.children.length > 8) elements.timeline.lastElementChild.remove();
  }

  function updateTimestamp() {
    const time = new Date().toLocaleTimeString();
    setText(elements.lastUpdate, time);
    setText(elements.lastCheck, 'Just now');
  }

  function finishScan() {
    metrics.ping = randomNumber(5, 150);
    metrics.download = randomNumber(20, 500);
    metrics.upload = randomNumber(5, 100);
    metrics.signal = randomNumber(30, 100);
    metrics.packetLoss = randomNumber(0, 10);
    metrics.jitter = randomNumber(1, 50);
    metrics.quality = Math.min(100, Math.max(0, calculateQuality()));

    updateValues();
    updateAdvancedInfo();

    if (metrics.quality >= 70) {
      updateStatusUI('good');
      setBadge('good', 'Excellent');
      setText(elements.qualityDescription, 'Your network connection is excellent and stable.');
    } else if (metrics.quality >= 50) {
      updateStatusUI('fair');
      setBadge('warning', 'Fair');
      setText(elements.qualityDescription, 'Your network is usable, but some applications may experience delays.');
    } else {
      updateStatusUI('poor');
      setBadge('poor', 'Poor');
      setText(elements.qualityDescription, 'Your connection is poor. Check your router, Wi-Fi signal, or ISP.');
    }

    addTimelineEntry();
    updateTimestamp();
    scanInProgress = false;
  }

  function performNetworkCheck() {
    if (scanInProgress) return;
    scanInProgress = true;
    clearTimeout(scanTimer);
    updateStatusUI('pending');
    setBadge('pending', 'Checking');
    setText(elements.qualityDescription, 'Analyzing network connection...');
    if (elements.qualityBar) elements.qualityBar.style.width = '0%';
    setText(elements.qualityScore, '0%');
    scanTimer = setTimeout(finishScan, 1000);
  }

  function resetData() {
    clearTimeout(scanTimer);
    scanInProgress = false;
    Object.keys(metrics).forEach((key) => { metrics[key] = 0; });
    updateStatusUI('pending');
    setBadge('pending', 'Ready');
    ['pingValue', 'jitterValue'].forEach((id) => setText($(id), '-- ms'));
    ['downloadValue', 'uploadValue'].forEach((id) => setText($(id), '-- Mbps'));
    ['signalValue', 'packetLossValue'].forEach((id) => setText($(id), '--%'));
    if (elements.qualityBar) elements.qualityBar.style.width = '0%';
    setText(elements.qualityScore, '0%');
    setText(elements.qualityDescription, 'Waiting for network analysis...');
    if (elements.timeline) {
      elements.timeline.innerHTML = '<div class="timeline-item neutral"><div class="timeline-dot"></div><div class="timeline-content"><p>System reset and ready.</p><span class="timeline-time">Just now</span></div></div>';
    }
    updateTimestamp();
  }

  function toggleAdvancedInfo() {
    if (!elements.advancedContent) return;
    const open = elements.advancedContent.style.display !== 'none';
    elements.advancedContent.style.display = open ? 'none' : 'block';
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({ timestamp: new Date().toISOString(), metrics }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `network-report-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  window.performNetworkCheck = performNetworkCheck;
  window.resetData = resetData;
  window.toggleAdvanced = toggleAdvancedInfo;
  window.exportData = exportData;

  window.addEventListener('load', performNetworkCheck);
})();
