#!/usr/bin/env node
// Encrypt the meeting walkthrough script with a separate password from the
// seller-facing pricing report. This is for Richard's eyes only.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SOURCE_PATH = '/home/richardreynolds/Projects/10 Wildberry Lane CMA/Meeting-Script.html';
const OUTPUT_PATH = path.join(__dirname, 'walkthrough', 'index.html');
const PASSWORD = 'Reynolds2026!';
const ITERATIONS = 250000;

const html = fs.readFileSync(SOURCE_PATH, 'utf8');

const salt = crypto.randomBytes(16);
const iv = crypto.randomBytes(12);
const key = crypto.pbkdf2Sync(PASSWORD, salt, ITERATIONS, 32, 'sha256');
const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
const encrypted = Buffer.concat([cipher.update(html, 'utf8'), cipher.final()]);
const authTag = cipher.getAuthTag();
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
<title>Walkthrough · Restricted</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  :root {
    --navy-deep: #0f1d3a;
    --navy: #1a2744;
    --gold: #c9a84c;
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
    max-width: 440px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.10);
    padding: 44px 36px;
    text-align: center;
  }
  .brand {
    font-family: 'Playfair Display', serif;
    font-size: 10px;
    letter-spacing: 0.32em;
    color: var(--gold);
    text-transform: uppercase;
    margin-bottom: 24px;
  }
  h1 {
    font-family: 'Playfair Display', serif;
    font-weight: 500;
    font-size: 28px;
    margin: 0 0 6px;
    letter-spacing: -0.005em;
  }
  .sub {
    font-size: 13px;
    color: rgba(255,255,255,0.65);
    margin-bottom: 22px;
  }
  .divider {
    width: 40px; height: 2px; background: var(--gold); margin: 0 auto 22px;
  }
  label {
    display: block;
    font-size: 10px;
    letter-spacing: 0.22em;
    color: var(--gold);
    text-transform: uppercase;
    margin-bottom: 8px;
    font-weight: 600;
  }
  input[type="password"] {
    width: 100%;
    padding: 13px 14px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.20);
    color: #fff;
    font-family: inherit;
    font-size: 15px;
    outline: none;
  }
  input[type="password"]:focus {
    border-color: var(--gold);
    background: rgba(255,255,255,0.10);
  }
  button {
    width: 100%;
    margin-top: 14px;
    padding: 13px 14px;
    background: var(--gold);
    color: var(--navy-deep);
    border: none;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    cursor: pointer;
  }
  button:disabled { opacity: 0.6; cursor: wait; }
  .err {
    margin-top: 14px;
    color: #f4a596;
    font-size: 13px;
    min-height: 18px;
  }
  .footer {
    margin-top: 26px;
    padding-top: 18px;
    border-top: 1px solid rgba(255,255,255,0.10);
    color: rgba(255,255,255,0.45);
    font-size: 11px;
    line-height: 1.5;
  }
</style>
</head>
<body>
  <div class="gate">
    <div class="brand">Restricted</div>
    <h1>Meeting Walkthrough</h1>
    <div class="sub">Presenter notes · 10 Wildberry Lane</div>
    <div class="divider"></div>
    <form id="form" autocomplete="off">
      <label for="pw">Access Password</label>
      <input type="password" id="pw" autofocus required>
      <button type="submit" id="btn">Unlock</button>
      <div class="err" id="err"></div>
    </form>
    <div class="footer">For Richard Reynolds only. Confidential script for the seller meeting.</div>
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
  const km = await crypto.subtle.importKey('raw', enc.encode(pw), { name: 'PBKDF2' }, false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: b64(PAYLOAD.salt), iterations: PAYLOAD.iter, hash: 'SHA-256' },
    km,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64(PAYLOAD.iv) }, key, b64(PAYLOAD.ct));
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
    const blob = new Blob([html], { type: 'text/html' });
    const blobUrl = URL.createObjectURL(blob);
    window.location.replace(blobUrl);
  } catch (ex) {
    err.textContent = 'Incorrect password.';
    btn.disabled = false;
    btn.textContent = 'Unlock';
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
console.log('Password: ' + PASSWORD);
