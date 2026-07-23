'use strict';

const input = document.getElementById('markdownInput');
const preview = document.getElementById('preview');
const clearBtn = document.getElementById('clearBtn');
const copyHtmlBtn = document.getElementById('copyHtmlBtn');
const downloadBtn = document.getElementById('downloadBtn');

const defaultText = `# Welcome to Toolsuite Editor

Type on the **left**, see the result on the **right**.

- [x] Fast
- [x] Private
- [x] Minimalist

> "Simplicity is the ultimate sophistication."
`;

function init() {
  input.value = localStorage.getItem('toolsuite-md-draft') || defaultText;

  updatePreview();
  autoResizeTextarea();
}

function updatePreview() {
  const raw = input.value;

  preview.innerHTML = marked.parse(raw);

  localStorage.setItem('toolsuite-md-draft', raw);
}

function autoResizeTextarea() {
  input.style.height = 'auto';

  const parentHeight = input.parentElement.clientHeight;
  const labelBarHeight = input.parentElement.querySelector('.label-bar').offsetHeight;

  input.style.height = `${parentHeight - labelBarHeight}px`;
}

input.addEventListener('input', () => {
  updatePreview();
  autoResizeTextarea();
});

window.addEventListener('resize', autoResizeTextarea);

clearBtn.addEventListener('click', () => {
  if (confirm('Clear all text?')) {
    input.value = '';

    updatePreview();
    autoResizeTextarea();
  }
});

copyHtmlBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(preview.innerHTML);

    const originalText = copyHtmlBtn.innerText;

    copyHtmlBtn.innerText = 'COPIED!';

    setTimeout(() => {
      copyHtmlBtn.innerText = originalText;
    }, 2000);

  } catch (err) {
    alert('Failed to copy HTML.');
  }
});
downloadBtn.addEventListener('click', () => {
  const markdown = input.value.trim();

  if (!markdown) {
    notify.error("Nothing to download.");
    return;
  }

  const blob = new Blob([markdown], {
    type: 'text/markdown'
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');

  a.href = url;
  a.download = 'document.md';

  document.body.appendChild(a);

  a.click();

  document.body.removeChild(a);

  URL.revokeObjectURL(url);

  notify.success("Markdown file downloaded!");
});

init();
