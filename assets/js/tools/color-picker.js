(function() {
      const nativePicker = document.getElementById('native-color-picker');
      const swatchHero = document.getElementById('color-swatch-hero');
      const heroHexLabel = document.getElementById('hero-hex-label');
      const heroHintLabel = document.getElementById('hero-hint-label');
      const btnRandom = document.getElementById('btn-random-color');

      const valHex = document.getElementById('val-hex');
      const valRgb = document.getElementById('val-rgb');
      const valHsl = document.getElementById('val-hsl');
      const valCmyk = document.getElementById('val-cmyk');
      const valCss = document.getElementById('val-css');

      const wcagWhiteSample = document.getElementById('wcag-white-sample');
      const wcagWhiteBadge = document.getElementById('wcag-white-badge');
      const wcagDarkSample = document.getElementById('wcag-dark-sample');
      const wcagDarkBadge = document.getElementById('wcag-dark-badge');
      const paletteBtns = document.querySelectorAll('.palette-swatch-btn');
      const copyButtons = document.querySelectorAll('.copy-btn');

      function hexToRgb(hex) {
        let c = hex.replace('#', '');
        if (c.length === 3) c = c.split('').map(x => x + x).join('');
        const num = parseInt(c, 16);
        return {
          r: (num >> 16) & 255,
          g: (num >> 8) & 255,
          b: num & 255
        };
      }

      function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
          h = s = 0;
        } else {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
          }
          h /= 6;
        }
        return {
          h: Math.round(h * 360),
          s: Math.round(s * 100),
          l: Math.round(l * 100)
        };
      }

      function rgbToCmyk(r, g, b) {
        let c = 1 - (r / 255);
        let m = 1 - (g / 255);
        let y = 1 - (b / 255);
        let k = Math.min(c, Math.min(m, y));
        if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
        return {
          c: Math.round(((c - k) / (1 - k)) * 100),
          m: Math.round(((m - k) / (1 - k)) * 100),
          y: Math.round(((y - k) / (1 - k)) * 100),
          k: Math.round(k * 100)
        };
      }

      function getLuminance(r, g, b) {
        const a = [r, g, b].map(v => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
      }

      function getContrast(lum1, lum2) {
        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);
        return (brightest + 0.05) / (darkest + 0.05);
      }

      function updateColor(hex) {
        hex = hex.toUpperCase();
        nativePicker.value = hex;
        swatchHero.style.backgroundColor = hex;

        const rgb = hexToRgb(hex);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);

        heroHexLabel.textContent = hex;
        // Text color on hero swatch
        const heroTextColor = hsl.l > 60 ? '#0F172A' : '#FFFFFF';
        heroHexLabel.style.color = heroTextColor;
        heroHintLabel.style.color = heroTextColor;

        valHex.textContent = hex;
        valRgb.textContent = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        valHsl.textContent = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
        valCmyk.textContent = `cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`;
        valCss.textContent = `--color-brand: ${hex};`;

        // WCAG check
        const lum = getLuminance(rgb.r, rgb.g, rgb.b);
        const whiteContrast = getContrast(lum, 1.0);
        const darkContrast = getContrast(lum, 0.0);

        wcagWhiteSample.style.color = hex;
        wcagDarkSample.style.color = hex;

        if (whiteContrast >= 7) {
          wcagWhiteBadge.textContent = `AAA (${whiteContrast.toFixed(1)}:1)`;
          wcagWhiteBadge.style.background = '#DCFCE7';
          wcagWhiteBadge.style.color = '#166534';
        } else if (whiteContrast >= 4.5) {
          wcagWhiteBadge.textContent = `AA (${whiteContrast.toFixed(1)}:1)`;
          wcagWhiteBadge.style.background = '#FEF9C3';
          wcagWhiteBadge.style.color = '#854D0E';
        } else {
          wcagWhiteBadge.textContent = `Fail (${whiteContrast.toFixed(1)}:1)`;
          wcagWhiteBadge.style.background = '#FEE2E2';
          wcagWhiteBadge.style.color = '#991B1B';
        }

        if (darkContrast >= 7) {
          wcagDarkBadge.textContent = `AAA (${darkContrast.toFixed(1)}:1)`;
          wcagDarkBadge.style.background = '#DCFCE7';
          wcagDarkBadge.style.color = '#166534';
        } else if (darkContrast >= 4.5) {
          wcagDarkBadge.textContent = `AA (${darkContrast.toFixed(1)}:1)`;
          wcagDarkBadge.style.background = '#FEF9C3';
          wcagDarkBadge.style.color = '#854D0E';
        } else {
          wcagDarkBadge.textContent = `Fail (${darkContrast.toFixed(1)}:1)`;
          wcagDarkBadge.style.background = '#FEE2E2';
          wcagDarkBadge.style.color = '#991B1B';
        }
      }

      nativePicker.addEventListener('input', (e) => {
        updateColor(e.target.value);
      });

      paletteBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          updateColor(btn.dataset.color);
        });
      });

      btnRandom.addEventListener('click', () => {
        const rand = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        updateColor(rand);
        if (window.SoundFX) window.SoundFX.playClick();
      });

      copyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const targetId = btn.dataset.target;
          const text = document.getElementById(targetId).textContent;
          navigator.clipboard.writeText(text).then(() => {
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => btn.textContent = originalText, 1500);
            if (window.ClassPanel) window.ClassPanel.showToast(`Copied ${text} to clipboard!`);
          });
        });
      });

      updateColor('#4F46E5');
    })();