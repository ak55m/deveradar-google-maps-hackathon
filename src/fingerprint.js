// Browser Fingerprint Generator
// Creates a unique fingerprint based on browser characteristics

export function generateFingerprint() {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency,
    navigator.deviceMemory || 'unknown',
    navigator.platform,
    navigator.cookieEnabled,
    navigator.doNotTrack,
    navigator.webdriver,
    window.innerWidth + 'x' + window.innerHeight,
    window.devicePixelRatio,
    navigator.maxTouchPoints || 0,
    navigator.vendor,
    navigator.product,
    navigator.productSub,
    navigator.appName,
    navigator.appVersion,
    navigator.appCodeName,
    navigator.buildID || 'unknown',
    navigator.oscpu || 'unknown',
    navigator.languages ? navigator.languages.join(',') : navigator.language,
    navigator.onLine,
    navigator.javaEnabled(),
    navigator.mimeTypes ? navigator.mimeTypes.length : 0,
    navigator.plugins ? navigator.plugins.length : 0,
    'canvas-' + getCanvasFingerprint(),
    'webgl-' + getWebGLFingerprint(),
    'audio-' + getAudioFingerprint()
  ];

  // Create a hash from all components
  const fingerprint = components.join('|');
  return hashString(fingerprint);
}

function getCanvasFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('DevRadar Fingerprint 🔍', 2, 2);
    return canvas.toDataURL().slice(-50); // Last 50 chars for uniqueness
  } catch (e) {
    return 'canvas-error';
  }
}

function getWebGLFingerprint() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'no-webgl';
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) + '|' + 
             gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
    }
    return 'webgl-no-debug';
  } catch (e) {
    return 'webgl-error';
  }
}

function getAudioFingerprint() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const analyser = audioContext.createAnalyser();
    const gainNode = audioContext.createGain();
    const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

    gainNode.gain.value = 0; // Silent
    oscillator.type = 'triangle';
    oscillator.connect(analyser);
    analyser.connect(scriptProcessor);
    scriptProcessor.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(0);
    
    const audioData = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(audioData);
    
    oscillator.stop();
    audioContext.close();
    
    // Create a simple hash from the audio data
    return audioData.slice(0, 10).reduce((acc, val) => acc + Math.abs(val), 0).toString().slice(0, 8);
  } catch (e) {
    return 'audio-error';
  }
}

function hashString(str) {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

// Cache the fingerprint to avoid regenerating it
let cachedFingerprint = null;

export function getFingerprint() {
  if (!cachedFingerprint) {
    cachedFingerprint = generateFingerprint();
  }
  return cachedFingerprint;
}

// Test function to see fingerprint components
export function debugFingerprint() {
  console.log('Fingerprint:', getFingerprint());
  console.log('User Agent:', navigator.userAgent);
  console.log('Screen:', screen.width + 'x' + screen.height);
  console.log('Platform:', navigator.platform);
  console.log('Language:', navigator.language);
  console.log('Timezone:', new Date().getTimezoneOffset());
  console.log('Hardware Concurrency:', navigator.hardwareConcurrency);
  console.log('Device Memory:', navigator.deviceMemory);
} 