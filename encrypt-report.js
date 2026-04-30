#!/usr/bin/env node
// Encrypt the pricing strategy report with a password and produce a self-contained
// HTML file with a password gate. Uses AES-256-GCM with PBKDF2 (250k iterations).

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SOURCE_PATH = '/home/richardreynolds/Projects/10 Wildberry Lane CMA/Pricing-Strategy-Report.html';
const OUTPUT_PATH = '/home/richardreynolds/Projects/10-wildberry-lane-cma/pricing-strategy/index.html';
const PASSWORD = 'HomeSweetMaine2026!';
const ITERATIONS = 250000;

const html = fs.readFileSync(SOURCE_PATH, 'utf8');

const salt = crypto.randomBytes(16);
const iv = crypto.randomBytes(12);
const key = crypto.pbkdf2Sync(PASSWORD, salt, ITERATIONS, 32, 'sha256');
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const encrypted = Buffer.concat([cipher.update(html, 'utf8'), cipher.final()]);
const authTag = cipher.getAuthTag();
// Web Crypto AES-GCM expects ciphertext||authTag concatenated
const ctWithTag = Buffer.concat([encrypted, authTag]);

const payload = {
  salt: salt.toString('base64'),
  iv: iv.toString('base64'),
  ct: ctWithTag.toString('base64'),
  iter: ITERATIONS,
};

const wrapper = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex,nofollow">
<title>10 Wildberry Lane — Pricing Strategy</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  :root {
    --navy-deep: #0f1d3a;
    --navy: #1a2744;
    --gold: #c9a84c;
    --cream: #faf8f2;
    --paper: #fdfdfb;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; height: 100%; }
  body {
    font-family: 'Inter', -apple-system, sans-serif;
    background: linear-gradient(135deg, var(--navy-deep) 0%, var(--navy) 100%);
    color: #fff;
    -webkit-font-smoothing: antialiased;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }
  .gate {
    width: 100%;
    max-width: 480px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.10);
    padding: 48px 44px;
    text-align: center;
    backdrop-filter: blur(6px);
  }
  .gate .brand {
    font-family: 'Playfair Display', serif;
    font-size: 11px;
    letter-spacing: 0.32em;
    color: var(--gold);
    text-transform: uppercase;
    margin-bottom: 28px;
  }
  .gate h1 {
    font-family: 'Playfair Display', serif;
    font-weight: 500;
    font-size: 34px;
    line-height: 1.15;
    margin: 0 0 8px;
    letter-spacing: -0.005em;
  }
  .gate .sub {
    font-size: 15px;
    color: rgba(255,255,255,0.65);
    margin-bottom: 32px;
  }
  .gate .divider {
    width: 48px; height: 2px; background: var(--gold); margin: 0 auto 28px;
  }
  .gate label {
    display: block;
    font-size: 11px;
    letter-spacing: 0.22em;
    color: var(--gold);
    text-transform: uppercase;
    margin-bottom: 10px;
    font-weight: 600;
  }
  .gate input[type="password"] {
    width: 100%;
    padding: 14px 16px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.20);
    color: #fff;
    font-family: inherit;
    font-size: 15px;
    letter-spacing: 0.04em;
    outline: none;
    transition: border-color 0.15s ease;
  }
  .gate input[type="password"]:focus {
    border-color: var(--gold);
    background: rgba(255,255,255,0.10);
  }
  .gate button {
    width: 100%;
    margin-top: 16px;
    padding: 14px 16px;
    background: var(--gold);
    color: var(--navy-deep);
    border: none;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    cursor: pointer;
    transition: background 0.15s ease;
  }
  .gate button:hover { background: #d6b75a; }
  .gate button:disabled { background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.5); cursor: wait; }
  .gate .err {
    margin-top: 16px;
    color: #f4a596;
    font-size: 13px;
    min-height: 18px;
  }
  .gate .footer {
    margin-top: 32px;
    padding-top: 20px;
    border-top: 1px solid rgba(255,255,255,0.10);
    color: rgba(255,255,255,0.45);
    font-size: 11.5px;
    line-height: 1.5;
  }
</style>
</head>
<body>
  <div class="gate" id="gate">
    <div class="brand">Home Sweet Maine</div>
    <h1>10 Wildberry Lane</h1>
    <div class="sub">Pricing Strategy Report &middot; April 30, 2026</div>
    <div class="divider"></div>
    <form id="form" autocomplete="off">
      <label for="pw">Access Password</label>
      <input type="password" id="pw" autofocus required>
      <button type="submit" id="btn">Open Report</button>
      <div class="err" id="err"></div>
    </form>
    <div class="footer">
      Confidential. For the sellers of 10 Wildberry Lane only.<br>
      Prepared by Richard Reynolds and Michael Hamilton, Home Sweet Maine.
    </div>
  </div>

<script>
const PAYLOAD = ${JSON.stringify(payload)};

function b64(s) {
  const bin = atob(s);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

async function decrypt(pw) {
  const enc = new TextEncoder();
  const salt = b64(PAYLOAD.salt);
  const iv = b64(PAYLOAD.iv);
  const ct = b64(PAYLOAD.ct);
  const km = await crypto.subtle.importKey('raw', enc.encode(pw), { name: 'PBKDF2' }, false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PAYLOAD.iter, hash: 'SHA-256' },
    km,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  return new TextDecoder().decode(pt);
}

document.getElementById('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const pw = document.getElementById('pw').value;
  const btn = document.getElementById('btn');
  const err = document.getElementById('err');
  err.textContent = '';
  btn.disabled = true;
  btn.textContent = 'Decrypting...';
  try {
    const html = await decrypt(pw);
    // Navigate to a fresh blob URL — guarantees correct viewport (mobile zoom)
    // and scroll position (top of page), unlike document.write which inherits
    // the gate page's layout state.
    const blob = new Blob([html], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    window.location.replace(blobUrl);
  } catch (ex) {
    err.textContent = 'Incorrect password. Please try again.';
    btn.disabled = false;
    btn.textContent = 'Open Report';
    document.getElementById('pw').select();
  }
});
</script>
</body>
</html>
`;

fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
fs.writeFileSync(OUTPUT_PATH, wrapper, 'utf8');
console.log('Wrote ' + OUTPUT_PATH + ' (' + Math.round(wrapper.length/1024) + ' KB)');
console.log('Source HTML: ' + Math.round(html.length/1024) + ' KB');
console.log('Encrypted (base64): ' + Math.round(payload.ct.length/1024) + ' KB');
console.log('Password: ' + PASSWORD);
