/**
 * OptiPic — Kompresor & Konverter Gambar Privat
 * 100% Client-Side menggunakan HTML5 Canvas API & JSZip
 * Fitur: PWA Offline, Target Size Optimizer (Binary Search), Watermark Pengaman Dokumen,
 *        Rotasi Foto 90°, Pemotong Rasio Aspek (Pas Foto), Salin ke Clipboard, & Modal Zoom
 */

(() => {
  'use strict';

  // --- STATE ---
  const state = {
    items: [], // Array of image objects
    settings: {
      format: 'image/webp',
      mode: 'quality', // 'quality' | 'target_size'
      quality: 0.8,
      targetKB: 200,
      customKB: null,
      resolution: 'original',
      aspectRatio: 'original', // 'original' | '1:1' | '3:4' | '4:6' | '16:9'
      customWidth: null,
      customHeight: null,
      watermark: {
        enabled: false,
        text: 'HANYA UNTUK VERIFIKASI DOKUMEN',
        opacity: 0.25,
        color: 'white',
      },
      theme: 'dark',
    },
    activeModalItem: null,
    modalZoom: 1,
    deferredInstallPrompt: null,
  };

  // --- DOM ELEMENTS ---
  const htmlRoot = document.documentElement;
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIconDark = document.getElementById('themeIconDark');
  const themeIconLight = document.getElementById('themeIconLight');
  const installPwaBtn = document.getElementById('installPwaBtn');

  const quickPresetsContainer = document.getElementById('quickPresetsContainer');

  const tabModeQuality = document.getElementById('tabModeQuality');
  const tabModeTargetSize = document.getElementById('tabModeTargetSize');
  const qualityControlWrapper = document.getElementById('qualityControlWrapper');
  const targetSizeControlWrapper = document.getElementById('targetSizeControlWrapper');
  const targetSizeBadge = document.getElementById('targetSizeBadge');
  const targetSizePresets = document.getElementById('targetSizePresets');
  const customKbWrapper = document.getElementById('customKbWrapper');
  const customKbInput = document.getElementById('customKbInput');

  const formatSelect = document.getElementById('formatSelect');
  const qualitySlider = document.getElementById('qualitySlider');
  const qualityValue = document.getElementById('qualityValue');
  const resolutionPills = document.getElementById('resolutionPills');
  const customResWrapper = document.getElementById('customResWrapper');
  const customWidthInput = document.getElementById('customWidth');
  const customHeightInput = document.getElementById('customHeight');

  const aspectPills = document.getElementById('aspectPills');
  const aspectBadge = document.getElementById('aspectBadge');

  const watermarkAccordionToggle = document.getElementById('watermarkAccordionToggle');
  const watermarkContent = document.getElementById('watermarkContent');
  const watermarkToggle = document.getElementById('watermarkToggle');
  const watermarkTextInput = document.getElementById('watermarkTextInput');
  const watermarkOpacitySlider = document.getElementById('watermarkOpacitySlider');
  const watermarkOpacityValue = document.getElementById('watermarkOpacityValue');
  const watermarkColorSelect = document.getElementById('watermarkColorSelect');

  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const browseBtn = document.getElementById('browseBtn');

  const summaryCard = document.getElementById('summaryCard');
  const statTotalFiles = document.getElementById('statTotalFiles');
  const statOriginalSize = document.getElementById('statOriginalSize');
  const statCompressedSize = document.getElementById('statCompressedSize');
  const statSavings = document.getElementById('statSavings');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const downloadAllBtn = document.getElementById('downloadAllBtn');
  const downloadAllText = document.getElementById('downloadAllText');

  const resultsSection = document.getElementById('resultsSection');
  const cardsGrid = document.getElementById('cardsGrid');
  const badgeCount = document.getElementById('badgeCount');

  // Mobile Sticky Bar
  const mobileStickyBar = document.getElementById('mobileStickyBar');
  const mobileCount = document.getElementById('mobileCount');
  const mobileSavings = document.getElementById('mobileSavings');
  const mobileDownloadAllBtn = document.getElementById('mobileDownloadAllBtn');

  // Comparison Modal
  const compareModal = document.getElementById('compareModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const modalDismissBtn = document.getElementById('modalDismissBtn');
  const modalCopyBtn = document.getElementById('modalCopyBtn');
  const modalDownloadBtn = document.getElementById('modalDownloadBtn');
  const modalFilename = document.getElementById('modalFilename');
  const modalImgBefore = document.getElementById('modalImgBefore');
  const modalImgAfter = document.getElementById('modalImgAfter');
  const modalOriginalMeta = document.getElementById('modalOriginalMeta');
  const modalCompressedMeta = document.getElementById('modalCompressedMeta');
  const compareSlider = document.getElementById('compareSlider');
  const beforeWrapper = document.getElementById('beforeWrapper');
  const sliderDivider = document.getElementById('sliderDivider');
  const modalZoomBtn = document.getElementById('modalZoomBtn');
  const modalZoomText = document.getElementById('modalZoomText');

  // Toast
  const toastNotification = document.getElementById('toastNotification');
  const toastMsg = document.getElementById('toastMsg');

  // --- TOAST HELPER ---
  let toastTimer = null;
  function showToast(message) {
    if (!toastNotification || !toastMsg) return;
    toastMsg.textContent = message;
    toastNotification.style.display = 'flex';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastNotification.style.display = 'none';
    }, 2800);
  }

  // --- INITIALIZATION (THEME & PWA) ---
  function initTheme() {
    const savedTheme = localStorage.getItem('optipic_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    setTheme(initialTheme);
  }

  function setTheme(theme) {
    state.settings.theme = theme;
    htmlRoot.setAttribute('data-theme', theme);
    localStorage.setItem('optipic_theme', theme);

    if (theme === 'dark') {
      themeIconDark.style.display = 'block';
      themeIconLight.style.display = 'none';
    } else {
      themeIconDark.style.display = 'none';
      themeIconLight.style.display = 'block';
    }
  }

  function initPWA() {
    // Bersihkan cache usang versi lama agar update CSS/JS langsung aktif
    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => {
          if (key !== 'optipic-v2.1') {
            caches.delete(key);
          }
        });
      });
    }

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then((reg) => {
          reg.update();
        }).catch((err) => {
          console.warn('Service Worker registration skipped:', err);
        });
      });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      state.deferredInstallPrompt = e;
      if (installPwaBtn) {
        installPwaBtn.style.display = 'inline-flex';
      }
    });

    if (installPwaBtn) {
      installPwaBtn.addEventListener('click', async () => {
        if (!state.deferredInstallPrompt) return;
        state.deferredInstallPrompt.prompt();
        const { outcome } = await state.deferredInstallPrompt.userChoice;
        if (outcome === 'accepted') {
          installPwaBtn.style.display = 'none';
        }
        state.deferredInstallPrompt = null;
      });
    }
  }

  // --- UTILS ---
  function formatBytes(bytes, decimals = 1) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  function getExtensionForMime(mime, originalName) {
    if (mime === 'image/webp') return '.webp';
    if (mime === 'image/jpeg') return '.jpg';
    if (mime === 'image/png') return '.png';
    const match = originalName.match(/\.[0-9a-z]+$/i);
    return match ? match[0].toLowerCase() : '.jpg';
  }

  function getTargetMime(file) {
    if (state.settings.format === 'original') {
      const allowed = ['image/jpeg', 'image/png', 'image/webp'];
      return allowed.includes(file.type) ? file.type : 'image/webp';
    }
    return state.settings.format;
  }

  // --- ASPECT RATIO CROPPING CALCULATION ---
  function calculateCropBox(srcW, srcH, aspectSetting) {
    if (!aspectSetting || aspectSetting === 'original') {
      return { sx: 0, sy: 0, sw: srcW, sh: srcH };
    }
    const ratioMap = {
      '1:1': 1.0,
      '3:4': 3 / 4,
      '4:6': 4 / 6,
      '16:9': 16 / 9,
    };
    const targetRatio = ratioMap[aspectSetting];
    if (!targetRatio) return { sx: 0, sy: 0, sw: srcW, sh: srcH };

    const srcRatio = srcW / srcH;
    let sw = srcW;
    let sh = srcH;
    let sx = 0;
    let sy = 0;

    if (srcRatio > targetRatio) {
      sw = Math.round(srcH * targetRatio);
      sx = Math.round((srcW - sw) / 2);
    } else {
      sh = Math.round(srcW / targetRatio);
      sy = Math.round((srcH - sh) / 2);
    }

    return { sx, sy, sw, sh };
  }

  function calculateTargetDimensions(srcWidth, srcHeight, extraScale = 1.0) {
    const { resolution, customWidth, customHeight, aspectRatio } = state.settings;
    const cropBox = calculateCropBox(srcWidth, srcHeight, aspectRatio);
    let baseW = cropBox.sw;
    let baseH = cropBox.sh;

    if (resolution === 'custom') {
      const maxW = customWidth || baseW;
      const maxH = customHeight || baseH;
      const scale = Math.min(maxW / baseW, maxH / baseH, 1);
      baseW = Math.max(1, Math.round(baseW * scale));
      baseH = Math.max(1, Math.round(baseH * scale));
    } else if (resolution !== 'original') {
      const maxLimit = parseInt(resolution, 10);
      if (maxLimit && (baseW > maxLimit || baseH > maxLimit)) {
        if (baseW >= baseH) {
          baseW = maxLimit;
          baseH = Math.max(1, Math.round((cropBox.sh * maxLimit) / cropBox.sw));
        } else {
          baseW = Math.max(1, Math.round((cropBox.sw * maxLimit) / cropBox.sh));
          baseH = maxLimit;
        }
      }
    }

    if (extraScale < 1.0) {
      return {
        width: Math.max(1, Math.round(baseW * extraScale)),
        height: Math.max(1, Math.round(baseH * extraScale)),
        cropBox,
      };
    }

    return { width: baseW, height: baseH, cropBox };
  }

  // --- DRAWING WITH ROTATION & CROP ON CANVAS ---
  function drawImageTransformed(ctx, img, targetDims, rotation = 0) {
    const { width: W, height: H, cropBox } = targetDims;
    const isRotated90 = rotation === 90 || rotation === 270;
    const canvasW = isRotated90 ? H : W;
    const canvasH = isRotated90 ? W : H;

    ctx.save();
    ctx.translate(canvasW / 2, canvasH / 2);
    if (rotation !== 0) {
      ctx.rotate((rotation * Math.PI) / 180);
    }

    ctx.drawImage(
      img,
      cropBox.sx,
      cropBox.sy,
      cropBox.sw,
      cropBox.sh,
      -W / 2,
      -H / 2,
      W,
      H
    );
    ctx.restore();

    return { canvasW, canvasH };
  }

  // --- WATERMARK DRAWING (Canvas) ---
  function drawWatermark(ctx, width, height) {
    const { enabled, text, opacity, color } = state.settings.watermark;
    if (!enabled || !text || text.trim() === '') return;

    ctx.save();
    const cleanText = text.trim();
    const fontSize = Math.max(16, Math.round(Math.min(width, height) / 22));
    ctx.font = `600 ${fontSize}px sans-serif`;

    let fillRgba = `rgba(255, 255, 255, ${opacity})`;
    let strokeRgba = `rgba(0, 0, 0, ${opacity * 0.7})`;

    if (color === 'black') {
      fillRgba = `rgba(0, 0, 0, ${opacity})`;
      strokeRgba = `rgba(255, 255, 255, ${opacity * 0.7})`;
    } else if (color === 'red') {
      fillRgba = `rgba(220, 38, 38, ${opacity})`;
      strokeRgba = `rgba(255, 255, 255, ${opacity * 0.7})`;
    }

    ctx.translate(width / 2, height / 2);
    ctx.rotate((-25 * Math.PI) / 180);

    ctx.fillStyle = fillRgba;
    ctx.strokeStyle = strokeRgba;
    ctx.lineWidth = Math.max(1, Math.round(fontSize * 0.08));
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textWidth = ctx.measureText(cleanText).width;
    const stepX = textWidth + fontSize * 3;
    const stepY = fontSize * 3.5;
    const diagonal = Math.sqrt(width * width + height * height);

    for (let y = -diagonal; y <= diagonal; y += stepY) {
      for (let x = -diagonal; x <= diagonal; x += stepX) {
        ctx.strokeText(cleanText, x, y);
        ctx.fillText(cleanText, x, y);
      }
    }

    ctx.restore();
  }

  function canvasToBlobAsync(canvas, mime, quality) {
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), mime, quality);
    });
  }

  // --- TARGET SIZE OPTIMIZER (Binary Search Quality & Downscaling) ---
  async function optimizeToTargetSize(img, targetBytes, targetMime, rotation = 0) {
    let extraScale = 1.0;
    let bestBlob = null;
    let bestDims = { width: 0, height: 0 };

    for (let scaleAttempt = 0; scaleAttempt < 3; scaleAttempt++) {
      const targetDims = calculateTargetDimensions(img.naturalWidth, img.naturalHeight, extraScale);
      const isRotated90 = rotation === 90 || rotation === 270;
      const cW = isRotated90 ? targetDims.height : targetDims.width;
      const cH = isRotated90 ? targetDims.width : targetDims.height;

      const canvas = document.createElement('canvas');
      canvas.width = cW;
      canvas.height = cH;
      const ctx = canvas.getContext('2d', { willReadFrequently: false });

      if (targetMime === 'image/jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      drawImageTransformed(ctx, img, targetDims, rotation);
      drawWatermark(ctx, canvas.width, canvas.height);

      if (targetMime === 'image/png') {
        const blob = await canvasToBlobAsync(canvas, targetMime);
        if (blob && (blob.size <= targetBytes || scaleAttempt === 2)) {
          return { blob, width: cW, height: cH };
        }
        extraScale *= 0.75;
        continue;
      }

      // Fast check: If high quality (0.95) already fits target, return immediately
      const highBlob = await canvasToBlobAsync(canvas, targetMime, 0.95);
      if (highBlob && highBlob.size <= targetBytes) {
        return { blob: highBlob, width: cW, height: cH };
      }

      // Fast check: If minimum quality (0.05) is still too big, downscale right away
      const lowBlob = await canvasToBlobAsync(canvas, targetMime, 0.05);
      if (lowBlob && lowBlob.size > targetBytes) {
        if (!bestBlob || lowBlob.size < bestBlob.size) {
          bestBlob = lowBlob;
          bestDims = { width: cW, height: cH };
        }
        extraScale *= 0.75;
        continue;
      }

      // Binary search between 0.05 and 0.95
      let lowQ = 0.05;
      let highQ = 0.95;
      let optimalBlob = lowBlob;

      for (let iter = 0; iter < 5; iter++) {
        const midQ = (lowQ + highQ) / 2;
        const testBlob = await canvasToBlobAsync(canvas, targetMime, midQ);

        if (!testBlob) break;

        if (testBlob.size <= targetBytes) {
          optimalBlob = testBlob;
          lowQ = midQ;
        } else {
          highQ = midQ;
        }
      }

      if (optimalBlob) {
        return { blob: optimalBlob, width: cW, height: cH };
      }

      extraScale *= 0.75;
    }

    return { blob: bestBlob, width: bestDims.width, height: bestDims.height };
  }

  // --- CORE IMAGE COMPRESSION VIA CANVAS ---
  function compressImage(item) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = async () => {
        item.originalWidth = img.naturalWidth;
        item.originalHeight = img.naturalHeight;

        const targetMime = getTargetMime(item.file);
        item.targetMime = targetMime;
        item.targetExt = getExtensionForMime(targetMime, item.file.name);

        const rotation = item.rotation || 0;

        try {
          if (state.settings.mode === 'target_size') {
            const effectiveKb = state.settings.customKB || state.settings.targetKB;
            const targetBytes = effectiveKb * 1024;
            const result = await optimizeToTargetSize(img, targetBytes, targetMime, rotation);

            if (!result.blob) {
              throw new Error('Gagal mengoptimasi gambar ke target ukuran.');
            }

            if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl);

            item.compressedBlob = result.blob;
            item.compressedSize = result.blob.size;
            item.compressedUrl = URL.createObjectURL(result.blob);
            item.compressedWidth = result.width;
            item.compressedHeight = result.height;
            item.isProcessing = false;
            resolve(item);
          } else {
            const targetDims = calculateTargetDimensions(img.naturalWidth, img.naturalHeight);
            const isRotated90 = rotation === 90 || rotation === 270;
            const cW = isRotated90 ? targetDims.height : targetDims.width;
            const cH = isRotated90 ? targetDims.width : targetDims.height;

            item.compressedWidth = cW;
            item.compressedHeight = cH;

            const canvas = document.createElement('canvas');
            canvas.width = cW;
            canvas.height = cH;
            const ctx = canvas.getContext('2d', { willReadFrequently: false });

            if (targetMime === 'image/jpeg') {
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
            }

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            drawImageTransformed(ctx, img, targetDims, rotation);
            drawWatermark(ctx, canvas.width, canvas.height);

            const blob = await canvasToBlobAsync(canvas, targetMime, state.settings.quality);
            if (!blob) throw new Error('Gagal memproses kanvas gambar.');

            if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl);

            item.compressedBlob = blob;
            item.compressedSize = blob.size;
            item.compressedUrl = URL.createObjectURL(blob);
            item.isProcessing = false;
            resolve(item);
          }
        } catch (err) {
          item.isProcessing = false;
          item.error = err.message;
          reject(err);
        }
      };

      img.onerror = () => {
        reject(new Error('Format gambar tidak dapat dibaca oleh browser.'));
      };

      img.src = item.originalUrl;
    });
  }

  // --- EVENT HANDLERS FOR FILE UPLOAD ---
  async function handleFiles(files) {
    if (!files || files.length === 0) return;

    const validFiles = Array.from(files).filter((file) => file.type.startsWith('image/'));
    if (validFiles.length === 0) {
      alert('Silakan pilih file gambar yang valid (JPG, PNG, WebP, AVIF, BMP).');
      return;
    }

    const newItems = validFiles.map((file) => ({
      id: 'img_' + Math.random().toString(36).substring(2, 11),
      file: file,
      originalName: file.name,
      originalSize: file.size,
      originalUrl: URL.createObjectURL(file),
      originalWidth: 0,
      originalHeight: 0,
      rotation: 0,
      compressedBlob: null,
      compressedUrl: null,
      compressedSize: 0,
      compressedWidth: 0,
      compressedHeight: 0,
      targetMime: '',
      targetExt: '',
      isProcessing: true,
    }));

    state.items.push(...newItems);
    renderUI();

    for (const item of newItems) {
      try {
        await compressImage(item);
      } catch (err) {
        console.error('Gagal kompres:', item.originalName, err);
      }
      updateCardUI(item);
      updateSummaryUI();
    }
  }

  let reprocessTimer = null;
  function triggerReprocessAll() {
    clearTimeout(reprocessTimer);
    reprocessTimer = setTimeout(async () => {
      if (state.items.length === 0) return;
      for (const item of state.items) {
        item.isProcessing = true;
        updateCardUI(item);
      }
      for (const item of state.items) {
        try {
          await compressImage(item);
        } catch (err) {
          console.error(err);
        }
        updateCardUI(item);
        updateSummaryUI();
      }
    }, 250);
  }

  // --- RENDERING UI ---
  function renderUI() {
    document.body.classList.toggle('has-items', state.items.length > 0);

    if (state.items.length === 0) {
      summaryCard.style.display = 'none';
      resultsSection.style.display = 'none';
      cardsGrid.innerHTML = '';
      return;
    }

    summaryCard.style.display = 'flex';
    resultsSection.style.display = 'flex';
    badgeCount.textContent = `${state.items.length} File`;

    state.items.forEach((item) => {
      let cardEl = document.getElementById(`card-${item.id}`);
      if (!cardEl) {
        cardEl = createCardElement(item);
        cardsGrid.appendChild(cardEl);
      }
    });

    updateSummaryUI();
  }

  function createCardElement(item) {
    const card = document.createElement('div');
    card.className = `image-card ${item.isProcessing ? 'is-processing' : ''}`;
    card.id = `card-${item.id}`;

    card.innerHTML = `
      <div class="card-preview-area">
        <img src="${item.originalUrl}" alt="${item.originalName}" id="thumb-${item.id}">
        <span class="card-format-tag" id="formatTag-${item.id}">...</span>
        <span class="card-saving-tag neutral" id="savingTag-${item.id}">Memproses</span>
      </div>
      <div class="card-body">
        <div class="card-file-info">
          <span class="card-filename" title="${item.originalName}">${item.originalName}</span>
          <span class="card-dimensions" id="dims-${item.id}">Menghitung ukuran...</span>
        </div>
        <div class="card-size-box">
          <div class="size-item">
            <span class="size-label">Sebelum</span>
            <span class="size-value">${formatBytes(item.originalSize)}</span>
          </div>
          <div class="size-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </div>
          <div class="size-item">
            <span class="size-label">Sesudah</span>
            <span class="size-value new" id="newSize-${item.id}">...</span>
          </div>
        </div>
        <div class="card-actions">
          <button type="button" class="btn btn-outline btn-card-action" id="rotateBtn-${item.id}" title="Putar 90 derajat searah jarum jam">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
            </svg>
            <span>Putar 90°</span>
          </button>
          <button type="button" class="btn btn-outline btn-card-action" id="compareBtn-${item.id}" title="Bandingkan sebelum dan sesudah">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
            <span>Bandingkan</span>
          </button>
          <button type="button" class="btn btn-primary btn-card-action" id="downloadBtn-${item.id}" title="Download gambar ini">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Unduh</span>
          </button>
          <button type="button" class="btn-icon-danger" id="deleteBtn-${item.id}" title="Hapus foto ini">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    `;

    card.querySelector(`#rotateBtn-${item.id}`).addEventListener('click', () => rotateSingleItem(item));
    card.querySelector(`#compareBtn-${item.id}`).addEventListener('click', () => openCompareModal(item));
    card.querySelector(`#downloadBtn-${item.id}`).addEventListener('click', () => downloadSingleItem(item));
    card.querySelector(`#deleteBtn-${item.id}`).addEventListener('click', () => deleteSingleItem(item.id));

    return card;
  }

  function updateCardUI(item) {
    const card = document.getElementById(`card-${item.id}`);
    if (!card) return;

    if (item.isProcessing) {
      card.classList.add('is-processing');
      return;
    }
    card.classList.remove('is-processing');

    const thumb = document.getElementById(`thumb-${item.id}`);
    const formatTag = document.getElementById(`formatTag-${item.id}`);
    const savingTag = document.getElementById(`savingTag-${item.id}`);
    const dims = document.getElementById(`dims-${item.id}`);
    const newSize = document.getElementById(`newSize-${item.id}`);

    if (item.compressedUrl) {
      thumb.src = item.compressedUrl;
    }

    const fmtClean = item.targetExt ? item.targetExt.replace('.', '').toUpperCase() : 'IMG';
    formatTag.textContent = fmtClean;

    const rotText = item.rotation ? ` (${item.rotation}°)` : '';
    dims.textContent = `${item.originalWidth}x${item.originalHeight} px → ${item.compressedWidth}x${item.compressedHeight} px${rotText}`;
    newSize.textContent = formatBytes(item.compressedSize);

    const diff = item.originalSize - item.compressedSize;
    const savingPercent = Math.round((diff / item.originalSize) * 100);

    if (savingPercent > 0) {
      savingTag.className = 'card-saving-tag good';
      savingTag.textContent = `-${savingPercent}%`;
    } else {
      savingTag.className = 'card-saving-tag neutral';
      savingTag.textContent = `+${Math.abs(savingPercent)}%`;
    }
  }

  function updateSummaryUI() {
    const totalFiles = state.items.length;
    statTotalFiles.textContent = totalFiles;

    document.body.classList.toggle('has-items', totalFiles > 0);

    if (totalFiles === 0) {
      summaryCard.style.display = 'none';
      resultsSection.style.display = 'none';
      return;
    }

    const totalOriginal = state.items.reduce((acc, curr) => acc + curr.originalSize, 0);
    const totalCompressed = state.items.reduce((acc, curr) => acc + (curr.compressedSize || curr.originalSize), 0);
    const diff = totalOriginal - totalCompressed;
    const percent = totalOriginal > 0 ? Math.max(0, Math.round((diff / totalOriginal) * 100)) : 0;

    statOriginalSize.textContent = formatBytes(totalOriginal);
    statCompressedSize.textContent = formatBytes(totalCompressed);
    statSavings.textContent = `Hemat ${percent}%`;

    mobileCount.textContent = `${totalFiles} File`;
    mobileSavings.textContent = `Hemat ${percent}% (${formatBytes(diff)})`;
  }

  // --- ACTIONS ---
  async function rotateSingleItem(item) {
    item.rotation = ((item.rotation || 0) + 90) % 360;
    item.isProcessing = true;
    updateCardUI(item);

    try {
      await compressImage(item);
      showToast(`Foto diputar ke ${item.rotation}°`);
    } catch (err) {
      console.error('Gagal memutar foto:', err);
    }
    updateCardUI(item);
    updateSummaryUI();

    if (state.activeModalItem && state.activeModalItem.id === item.id) {
      openCompareModal(item);
    }
  }

  function deleteSingleItem(id) {
    const idx = state.items.findIndex((item) => item.id === id);
    if (idx !== -1) {
      const item = state.items[idx];
      URL.revokeObjectURL(item.originalUrl);
      if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl);
      state.items.splice(idx, 1);
    }
    const card = document.getElementById(`card-${id}`);
    if (card) card.remove();
    updateSummaryUI();
    badgeCount.textContent = `${state.items.length} File`;
  }

  function clearAllItems() {
    if (state.items.length === 0) return;
    if (!confirm('Apakah Anda yakin ingin menghapus semua gambar?')) return;

    state.items.forEach((item) => {
      URL.revokeObjectURL(item.originalUrl);
      if (item.compressedUrl) URL.revokeObjectURL(item.compressedUrl);
    });
    state.items = [];
    cardsGrid.innerHTML = '';
    renderUI();
  }

  function getDownloadFilename(item) {
    const baseName = item.originalName.replace(/\.[^/.]+$/, '');
    return `${baseName}-optipic${item.targetExt || '.webp'}`;
  }

  function downloadSingleItem(item) {
    if (!item.compressedBlob) {
      alert('Gambar masih dalam proses kompresi.');
      return;
    }
    const link = document.createElement('a');
    link.href = item.compressedUrl;
    link.download = getDownloadFilename(item);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function copyImageToClipboard(item) {
    if (!item || !item.compressedBlob) {
      showToast('Gambar belum siap disalin');
      return;
    }

    try {
      if (item.compressedBlob.type === 'image/png') {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': item.compressedBlob }),
        ]);
        showToast('Gambar berhasil disalin ke papan klip!');
      } else {
        // Convert to PNG blob for universal clipboard compatibility
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = img.naturalWidth;
          c.height = img.naturalHeight;
          const ctx = c.getContext('2d');
          ctx.drawImage(img, 0, 0);
          c.toBlob(async (pngBlob) => {
            try {
              await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': pngBlob }),
              ]);
              showToast('Gambar berhasil disalin ke papan klip!');
            } catch (e) {
              showToast('Izin papan klip ditolak oleh browser');
            }
          }, 'image/png');
        };
        img.src = item.compressedUrl;
      }
    } catch (err) {
      console.warn('Clipboard write failed:', err);
      showToast('Gagal menyalin gambar');
    }
  }

  async function downloadAllAsZip() {
    const readyItems = state.items.filter((item) => item.compressedBlob);
    if (readyItems.length === 0) {
      alert('Belum ada gambar yang selesai dikompres.');
      return;
    }

    if (readyItems.length === 1) {
      downloadSingleItem(readyItems[0]);
      return;
    }

    if (typeof JSZip !== 'undefined') {
      try {
        downloadAllText.textContent = 'Membuat ZIP...';
        downloadAllBtn.disabled = true;

        const zip = new JSZip();
        const usedNames = new Set();

        readyItems.forEach((item, index) => {
          let filename = getDownloadFilename(item);
          if (usedNames.has(filename)) {
            const base = filename.replace(/\.[^/.]+$/, '');
            const ext = filename.match(/\.[^/.]+$/)?.[0] || '';
            filename = `${base}-${index + 1}${ext}`;
          }
          usedNames.add(filename);
          zip.file(filename, item.compressedBlob);
        });

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = `optipic-images-${Date.now()}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      } catch (err) {
        console.error('Gagal membuat ZIP:', err);
        fallbackDownloadAll(readyItems);
      } finally {
        downloadAllText.textContent = 'Download Semua ZIP';
        downloadAllBtn.disabled = false;
      }
    } else {
      fallbackDownloadAll(readyItems);
    }
  }

  function fallbackDownloadAll(items) {
    items.forEach((item, index) => {
      setTimeout(() => {
        downloadSingleItem(item);
      }, index * 300);
    });
  }

  // --- COMPARISON MODAL ---
  function openCompareModal(item) {
    if (!item.compressedBlob) {
      alert('Gambar sedang diproses, silakan tunggu sesaat.');
      return;
    }

    state.activeModalItem = item;
    modalFilename.textContent = item.originalName;
    modalImgBefore.src = item.originalUrl;
    modalImgAfter.src = item.compressedUrl;

    const rotText = item.rotation ? ` • ${item.rotation}°` : '';
    modalOriginalMeta.textContent = `${formatBytes(item.originalSize)} (${item.originalWidth}x${item.originalHeight}px)`;
    modalCompressedMeta.textContent = `${formatBytes(item.compressedSize)} (${item.compressedWidth}x${item.compressedHeight}px${rotText})`;

    // Reset zoom
    state.modalZoom = 1;
    document.getElementById('comparisonContainer').classList.remove('is-zoomed');
    if (modalZoomText) modalZoomText.textContent = 'Zoom 2x';

    compareSlider.value = 50;
    updateComparisonSplit(50);

    compareModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeCompareModal() {
    compareModal.style.display = 'none';
    document.body.style.overflow = '';
    state.activeModalItem = null;
  }

  function toggleModalZoom() {
    const container = document.getElementById('comparisonContainer');
    state.modalZoom = state.modalZoom === 1 ? 2 : 1;
    if (state.modalZoom === 2) {
      container.classList.add('is-zoomed');
      modalZoomText.textContent = 'Zoom 1x';
    } else {
      container.classList.remove('is-zoomed');
      modalZoomText.textContent = 'Zoom 2x';
    }
  }

  function updateComparisonSplit(val) {
    beforeWrapper.style.width = `${val}%`;
    sliderDivider.style.left = `${val}%`;
  }

  // --- PRESET APPLICATION ---
  function applyPreset(presetName) {
    quickPresetsContainer.querySelectorAll('.preset-chip').forEach((chip) => {
      chip.classList.toggle('active', chip.dataset.preset === presetName);
    });

    switch (presetName) {
      case 'general':
        formatSelect.value = 'image/webp';
        state.settings.format = 'image/webp';
        setMode('quality');
        qualitySlider.value = 80;
        qualityValue.textContent = '80%';
        state.settings.quality = 0.8;
        setResolution('original');
        setAspectRatio('original');
        setWatermarkEnabled(false);
        break;

      case 'cpns':
        formatSelect.value = 'image/jpeg';
        state.settings.format = 'image/jpeg';
        setMode('target_size');
        setTargetKB(200);
        setResolution('1920');
        setAspectRatio('original');
        setWatermarkEnabled(false);
        break;

      case 'ktp':
        formatSelect.value = 'image/webp';
        state.settings.format = 'image/webp';
        setMode('target_size');
        setTargetKB(300);
        setResolution('original');
        setAspectRatio('original');
        setWatermarkEnabled(true);
        break;

      case 'pasfoto':
        formatSelect.value = 'image/jpeg';
        state.settings.format = 'image/jpeg';
        setMode('quality');
        qualitySlider.value = 85;
        qualityValue.textContent = '85%';
        state.settings.quality = 0.85;
        setResolution('1280');
        setAspectRatio('3:4'); // Otomatis pas foto formal 3:4!
        setWatermarkEnabled(false);
        break;

      case 'seo':
        formatSelect.value = 'image/webp';
        state.settings.format = 'image/webp';
        setMode('quality');
        qualitySlider.value = 75;
        qualityValue.textContent = '75%';
        state.settings.quality = 0.75;
        setResolution('1280');
        setAspectRatio('original');
        setWatermarkEnabled(false);
        break;

      case 'lossless':
        formatSelect.value = 'image/png';
        state.settings.format = 'image/png';
        setMode('quality');
        qualitySlider.value = 100;
        qualityValue.textContent = '100%';
        state.settings.quality = 1.0;
        setResolution('original');
        setAspectRatio('original');
        setWatermarkEnabled(false);
        break;
    }

    triggerReprocessAll();
  }

  function setMode(mode) {
    state.settings.mode = mode;
    if (mode === 'quality') {
      tabModeQuality.classList.add('active');
      tabModeTargetSize.classList.remove('active');
      qualityControlWrapper.style.display = 'flex';
      targetSizeControlWrapper.style.display = 'none';
    } else {
      tabModeQuality.classList.remove('active');
      tabModeTargetSize.classList.add('active');
      qualityControlWrapper.style.display = 'none';
      targetSizeControlWrapper.style.display = 'flex';
    }
  }

  function setTargetKB(kb) {
    state.settings.targetKB = kb;
    state.settings.customKB = null;
    targetSizeBadge.textContent = `Maks ${kb} KB`;
    targetSizePresets.querySelectorAll('.chip-sm').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.kb === String(kb));
    });
    customKbWrapper.style.display = 'none';
  }

  function setResolution(res) {
    state.settings.resolution = res;
    resolutionPills.querySelectorAll('.pill').forEach((p) => {
      p.classList.toggle('active', p.dataset.res === res);
    });
    customResWrapper.style.display = res === 'custom' ? 'block' : 'none';
  }

  function setAspectRatio(aspect) {
    state.settings.aspectRatio = aspect;
    if (aspectPills) {
      aspectPills.querySelectorAll('.pill').forEach((p) => {
        p.classList.toggle('active', p.dataset.aspect === aspect);
      });
    }
    const labelMap = {
      original: 'Ukuran Asli (Tanpa Crop)',
      '1:1': '1:1 Persegi (Profil)',
      '3:4': '3:4 Pas Foto Formal',
      '4:6': '4:6 Pas Foto Cetak',
      '16:9': '16:9 Layar Lebar',
    };
    if (aspectBadge) aspectBadge.textContent = labelMap[aspect] || aspect;
  }

  function setWatermarkEnabled(enabled) {
    state.settings.watermark.enabled = enabled;
    watermarkToggle.checked = enabled;
    const parent = watermarkAccordionToggle.closest('.extra-options-accordion');
    if (enabled) {
      parent.classList.add('open');
      watermarkContent.style.display = 'flex';
    } else {
      parent.classList.remove('open');
      watermarkContent.style.display = 'none';
    }
  }

  // --- ATTACH EVENT LISTENERS ---

  themeToggleBtn.addEventListener('click', () => {
    const nextTheme = state.settings.theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  });

  quickPresetsContainer.addEventListener('click', (e) => {
    const chip = e.target.closest('.preset-chip');
    if (!chip) return;
    applyPreset(chip.dataset.preset);
  });

  tabModeQuality.addEventListener('click', () => {
    setMode('quality');
    triggerReprocessAll();
  });

  tabModeTargetSize.addEventListener('click', () => {
    setMode('target_size');
    triggerReprocessAll();
  });

  targetSizePresets.addEventListener('click', (e) => {
    const btn = e.target.closest('.chip-sm');
    if (!btn) return;

    targetSizePresets.querySelectorAll('.chip-sm').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    const kb = btn.dataset.kb;
    if (kb === 'custom') {
      customKbWrapper.style.display = 'block';
      const val = parseInt(customKbInput.value, 10);
      if (val) {
        state.settings.customKB = val;
        targetSizeBadge.textContent = `Maks ${val} KB`;
        triggerReprocessAll();
      }
    } else {
      customKbWrapper.style.display = 'none';
      state.settings.customKB = null;
      state.settings.targetKB = parseInt(kb, 10);
      targetSizeBadge.textContent = `Maks ${kb} KB`;
      triggerReprocessAll();
    }
  });

  function handleCustomKbInput() {
    const val = parseInt(customKbInput.value, 10);
    if (val && val >= 10) {
      state.settings.customKB = val;
      targetSizeBadge.textContent = `Maks ${val} KB`;
      triggerReprocessAll();
    }
  }
  customKbInput.addEventListener('change', handleCustomKbInput);
  customKbInput.addEventListener('input', handleCustomKbInput);

  // Aspect Ratio Pills
  if (aspectPills) {
    aspectPills.addEventListener('click', (e) => {
      const pill = e.target.closest('.pill');
      if (!pill) return;
      setAspectRatio(pill.dataset.aspect);
      triggerReprocessAll();
    });
  }

  // Watermark Accordion & Inputs
  watermarkAccordionToggle.addEventListener('click', () => {
    const parent = watermarkAccordionToggle.closest('.extra-options-accordion');
    parent.classList.toggle('open');
    watermarkContent.style.display = parent.classList.contains('open') ? 'flex' : 'none';
  });

  watermarkToggle.addEventListener('change', (e) => {
    state.settings.watermark.enabled = e.target.checked;
    const parent = watermarkAccordionToggle.closest('.extra-options-accordion');
    if (e.target.checked && !parent.classList.contains('open')) {
      parent.classList.add('open');
      watermarkContent.style.display = 'flex';
    }
    triggerReprocessAll();
  });

  watermarkTextInput.addEventListener('input', () => {
    state.settings.watermark.text = watermarkTextInput.value;
  });

  watermarkTextInput.addEventListener('change', () => {
    if (state.settings.watermark.enabled) triggerReprocessAll();
  });

  watermarkOpacitySlider.addEventListener('input', () => {
    const val = parseInt(watermarkOpacitySlider.value, 10);
    watermarkOpacityValue.textContent = `${val}%`;
    state.settings.watermark.opacity = val / 100;
  });

  watermarkOpacitySlider.addEventListener('change', () => {
    if (state.settings.watermark.enabled) triggerReprocessAll();
  });

  watermarkColorSelect.addEventListener('change', () => {
    state.settings.watermark.color = watermarkColorSelect.value;
    if (state.settings.watermark.enabled) triggerReprocessAll();
  });

  // Browse buttons & Dropzone
  browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  dropzone.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
    fileInput.value = '';
  });

  ['dragenter', 'dragover'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer && e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  });

  // Paste dari Clipboard (Ctrl + V)
  window.addEventListener('paste', (e) => {
    if (e.clipboardData && e.clipboardData.items) {
      const items = e.clipboardData.items;
      const imageFiles = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            imageFiles.push(
              new File([blob], `screenshot-${Date.now()}.png`, { type: blob.type })
            );
          }
        }
      }
      if (imageFiles.length > 0) {
        handleFiles(imageFiles);
      }
    }
  });

  // Format Output
  formatSelect.addEventListener('change', () => {
    state.settings.format = formatSelect.value;
    triggerReprocessAll();
  });

  // Slider Kualitas
  qualitySlider.addEventListener('input', () => {
    const val = parseInt(qualitySlider.value, 10);
    qualityValue.textContent = `${val}%`;
    state.settings.quality = val / 100;
  });

  qualitySlider.addEventListener('change', () => {
    triggerReprocessAll();
  });

  // Resolusi Pills
  resolutionPills.addEventListener('click', (e) => {
    const pill = e.target.closest('.pill');
    if (!pill) return;
    setResolution(pill.dataset.res);
    if (pill.dataset.res !== 'custom') {
      triggerReprocessAll();
    }
  });

  // Custom Resolution Inputs
  function handleCustomResInput() {
    state.settings.customWidth = parseInt(customWidthInput.value, 10) || null;
    state.settings.customHeight = parseInt(customHeightInput.value, 10) || null;
    if (state.settings.resolution === 'custom') {
      triggerReprocessAll();
    }
  }
  [customWidthInput, customHeightInput].forEach((input) => {
    input.addEventListener('change', handleCustomResInput);
    input.addEventListener('input', handleCustomResInput);
  });

  // Global Actions
  clearAllBtn.addEventListener('click', clearAllItems);
  downloadAllBtn.addEventListener('click', downloadAllAsZip);
  mobileDownloadAllBtn.addEventListener('click', downloadAllAsZip);

  // Modal Events
  closeModalBtn.addEventListener('click', closeCompareModal);
  modalDismissBtn.addEventListener('click', closeCompareModal);
  compareModal.addEventListener('click', (e) => {
    if (e.target === compareModal) closeCompareModal();
  });

  if (modalZoomBtn) {
    modalZoomBtn.addEventListener('click', toggleModalZoom);
  }

  if (modalCopyBtn) {
    modalCopyBtn.addEventListener('click', () => {
      if (state.activeModalItem) {
        copyImageToClipboard(state.activeModalItem);
      }
    });
  }

  modalDownloadBtn.addEventListener('click', () => {
    if (state.activeModalItem) {
      downloadSingleItem(state.activeModalItem);
    }
  });

  compareSlider.addEventListener('input', () => {
    updateComparisonSplit(compareSlider.value);
  });

  // Touch & Drag Support untuk Comparison Slider
  const comparisonContainer = document.getElementById('comparisonContainer');
  let isPointerDown = false;

  function handlePointerMove(e) {
    if (!isPointerDown) return;
    const rect = comparisonContainer.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.round((x / rect.width) * 100);
    compareSlider.value = percent;
    updateComparisonSplit(percent);
  }

  comparisonContainer.addEventListener('mousedown', (e) => {
    isPointerDown = true;
    handlePointerMove(e);
  });
  window.addEventListener('mouseup', () => { isPointerDown = false; });
  comparisonContainer.addEventListener('mousemove', handlePointerMove);

  comparisonContainer.addEventListener('touchstart', (e) => {
    isPointerDown = true;
    handlePointerMove(e);
  }, { passive: true });
  window.addEventListener('touchend', () => { isPointerDown = false; });
  comparisonContainer.addEventListener('touchmove', handlePointerMove, { passive: true });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && compareModal.style.display !== 'none') {
      closeCompareModal();
    }
  });

  // Init
  initTheme();
  initPWA();

  // Sembunyikan dan hapus paksa Netlify Drawer & HUD widget jika diinjeksikan
  const removeNetlifyWidgets = () => {
    const selectors = [
      '#nl-badge-frame', '#nl-hud-frame', 'netlify-drawer', '#netlify-drawer',
      '.netlify-drawer', '[data-netlify-drawer]', 'div[class*="netlify-drawer"]',
      'iframe[src*="netlify"]', 'iframe[title*="Netlify"]', 'iframe[title*="Powered by Netlify"]',
      'div[id*="netlify-feedback"]', 'div[class*="netlify-feedback"]',
      '.feedback-widget', '[aria-label="Netlify Drawer"]'
    ];
    selectors.forEach(sel => {
      document.querySelectorAll(sel).forEach(el => el.remove());
    });
  };
  removeNetlifyWidgets();
  setInterval(removeNetlifyWidgets, 400);
})();
