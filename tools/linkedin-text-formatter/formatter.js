const input = document.getElementById("input");
const output = document.getElementById("output");


const charCount = document.getElementById("charCount");
const wordCount = document.getElementById("wordCount");

function validateInput() {
  if (!input.value.trim()) {
    output.value = "";

    if (window.notify) {
      notify.error("Please enter some text before formatting.");
    } else {
      alert("Please enter some text before formatting.");
    }

    return false;
  }

  return true;
}

function updateCounter() {
  const text = input.value;

  charCount.textContent = text.length;

  const words = text.trim()
    ? text.trim().split(/\s+/).length
    : 0;

  wordCount.textContent = words;
}

input.addEventListener("input", updateCounter);

function transformText(style) {
  if (!validateInput()) {
    return;
  }

  const start = input.selectionStart;
  const end = input.selectionEnd;

  const text = input.value;

  output.value = [...text]
    .map((char) => convertChar(char, style))
    .join("");

  restoreInputFocus(start, end);
}

function toSmallCaps(text) {
  const map = {
    a: "ᴀ",
    b: "ʙ",
    c: "ᴄ",
    d: "ᴅ",
    e: "ᴇ",
    f: "ꜰ",
    g: "ɢ",
    h: "ʜ",
    i: "ɪ",
    j: "ᴊ",
    k: "ᴋ",
    l: "ʟ",
    m: "ᴍ",
    n: "ɴ",
    o: "ᴏ",
    p: "ᴘ",
    q: "ǫ",
    r: "ʀ",
    s: "ꜱ",
    t: "ᴛ",
    u: "ᴜ",
    v: "ᴠ",
    w: "ᴡ",
    x: "x",
    y: "ʏ",
    z: "ᴢ",
  };

  return [...text].map((char) => map[char.toLowerCase()] || char).join("");
}

function convertChar(char, style) {
  const code = char.charCodeAt(0);

  const isUpper = code >= 65 && code <= 90;
  const isLower = code >= 97 && code <= 122;

  if (!isUpper && !isLower) return char;

  const index = isUpper ? code - 65 : code - 97;

  const maps = {
    bold: {
      upper: 0x1d5d4,
      lower: 0x1d5ee,
    },
    italic: {
      upper: 0x1d608,
      lower: 0x1d622,
    },
    boldItalic: {
      upper: 0x1d63c,
      lower: 0x1d656,
    },
  };

  const base = isUpper ? maps[style].upper : maps[style].lower;

  return String.fromCodePoint(base + index);
}

document.getElementById("boldBtn").addEventListener("click", () => {
  transformText("bold");
});

document.getElementById("italicBtn").addEventListener("click", () => {
  transformText("italic");
});

document.getElementById("boldItalicBtn").addEventListener("click", () => {
  transformText("boldItalic");
});

document.getElementById("copyBtn").addEventListener("click", async () => {
  if (!output.value) return;

  await navigator.clipboard.writeText(output.value);
notify.success("Copied to clipboard!");
});

document.getElementById("clearBtn").addEventListener("click", () => {
  input.value = "";
  output.value = "";
  updateCounter();
});

document.getElementById("smallCapsBtn").addEventListener("click", () => {
    if (!validateInput()) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;

    output.value = toSmallCaps(input.value);

    restoreInputFocus(start, end);
});

document.getElementById("underlineBtn").addEventListener("click", () => {
    if (!validateInput()) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;

    output.value = [...input.value]
        .map(char => char === " " ? " " : char + "\u0332")
        .join("");

    restoreInputFocus(start, end);
});


document.getElementById("strikeBtn").addEventListener("click", () => {
    if (!validateInput()) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;

    output.value = [...input.value]
        .map(char => char === " " ? " " : char + "\u0336")
        .join("");
});


updateCounter();
