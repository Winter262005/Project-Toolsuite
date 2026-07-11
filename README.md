# Project-Toolsuite

Project Toolsuite is a privacy-first collection of browser-based utilities designed for moments when speed, simplicity, and reliability matter most.

Whether you're working with files, development tools, graphics, security utilities, or quick productivity workflows, the goal remains the same:

Your work stays yours.

No logins. No paywalls. No "verify your email" for the 17th time.

*In development, forever... :)*

---

## What is Project Toolsuite?

Project Toolsuite is an open-source collection of browser-based tools built to make everyday tasks easier.

The project focuses on simplicity, privacy, and accessibility. Most tools are designed to work directly in the browser, helping users get things done without unnecessary setup or account creation.

Some of the areas currently covered include:

* File utilities
* Developer tools
* Graphics and design tools
* Security utilities
* Productivity tools

---

## Getting Started

### Use Online

Visit the live website and start using the available tools:

https://project-toolsuite.vercel.app

No installation required.

### Run Locally

Clone the repository:

```bash
git clone https://github.com/YOUR-USERNAME/Project-Toolsuite.git
```

Move into the project directory:

```bash
cd Project-Toolsuite
```

Open `index.html` directly in your browser, or run a local server:

```bash
npx serve .
```

Then visit:

```text
http://localhost:3000
```

---

## Tech Stack

This project is built using:

* HTML5
* CSS3
* JavaScript
* Service Worker (PWA support)
* Vercel for deployment

---

## Project Structure

```text
Project-Toolsuite/
│
├── .github/
├── assets/
├── tools/
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LEADERBOARD.md
├── LICENSE
├── README.md
├── SECURITY.md
├── contributers.html
├── index.html
├── manifest.json
├── privacy.html
├── sw.js
├── theme.css
└── theme.js
```

---

## Sitemap Generation

The sitemap is generated from the repository structure using:

```bash
python3 scripts/generate_sitemap.py
```

Run this script whenever new tool pages or static pages are added to keep `sitemap.xml` up to date.

The script automatically:

- Discovers tool HTML files under `tools/`
- Includes static pages such as the homepage, privacy page, and contributors page
- Regenerates a valid `sitemap.xml`

---

## Tool Health Checker

The Tool Health Checker is a client-side maintenance utility designed to validate registered tools and identify common project issues.

### Checks Performed

- Validates registered tool page paths from the project registry
- Detects missing or unreachable tool pages
- Verifies `theme.css` inclusion
- Verifies `theme.js` inclusion
- Generates a downloadable JSON report
- Provides a human-readable scan summary

### Usage

1. Open **Tool Health Checker** from the homepage.
2. Click **Run Health Scan**.
3. Review the scan summary and results table.
4. Download the JSON report for maintenance or debugging purposes.

### Example Summary

```text
Tools Scanned: 56
Pages Missing: 0
Missing Theme CSS: 0
Missing Theme JS: 0
```

### JSON Report Example

```json
{
  "tool": "JSON Formatter",
  "path": "tools/json-formatter/json-formatter.html",
  "pageStatus": "PASS",
  "cssStatus": "PASS",
  "jsStatus": "PASS"
}
```

The Health Checker helps contributors quickly identify broken registrations, missing theme integrations, and configuration regressions without requiring additional build tools or CI setup.

---

## Developer Documentation

Project Toolsuite includes shared utility scripts that are reused across multiple tools and pages.

### Shared Utilities

- `theme.js` – Handles theme initialization, theme switching, and recent tool tracking.
- `assets/js/notifications.js` – Provides toast-style notification functionality for success, error, and informational messages.

### Documentation

See the shared utilities documentation:

```text
docs/shared-utilities.md
```

The documentation includes:

- Public API references
- Function descriptions
- Parameter and return value documentation
- Theme initialization behavior
- Notification methods
- Recommended script placement
- Common integration examples

---

## Contributing

Contributions are welcome, whether you're fixing bugs, improving documentation, or building new tools.

Basic workflow:

1. Fork the repository
2. Clone your fork
3. Create a branch

```bash
git checkout -b feature-name
```

4. Make your changes
5. Commit your work

```bash
git commit -m "Add: feature description"
```

6. Push your branch

```bash
git push origin feature-name
```

7. Open a Pull Request

For detailed guidelines, please read `CONTRIBUTING.md`.

---

## Security

If you discover a security issue, please follow the instructions in `SECURITY.md` and report it responsibly.

Please do not open public issues for security vulnerabilities.

---

## License

This project is licensed under the GNU General Public License v3.0.

See the `LICENSE` file for complete details.

---

## Contributors Leaderboard

<!-- LEADERBOARD_START -->

| Rank | Contributor | Points | Commits |
|-----:|------------|-------:|--------:|
| 1 | @Winter262005 | 309 | 309 |
| 2 | @love25-codes | 28 | 28 |
| 3 | @VITianYash42 | 20 | 20 |
| 4 | @rach-kanc | 16 | 16 |
| 5 | @Sargam-Ghagre | 15 | 15 |
| 6 | @Ishwarpatra | 14 | 14 |
| 7 | @Dru-429 | 13 | 13 |
| 8 | @AdityaMittal08 | 9 | 9 |
| 9 | @ritiktyagiai | 8 | 8 |
| 10 | @adikulkarni006 | 8 | 8 |
| 11 | @aditijha509 | 6 | 6 |
| 12 | @JaiHarsan | 5 | 5 |
| 13 | @ShrutiiShinde05 | 5 | 5 |
| 14 | @helen1806 | 5 | 5 |
| 15 | @SamXop123 | 4 | 4 |
| 16 | @shreyagupta2006 | 3 | 3 |
| 17 | @stargalax | 3 | 3 |
| 18 | @hashhhh-16 | 3 | 3 |
| 19 | @SuyashSoni10 | 3 | 3 |
| 20 | @ShaikhWarsi | 3 | 3 |
| 21 | @Pranavkale11 | 3 | 3 |
| 22 | @KaustAbhinand | 3 | 3 |
| 23 | @architsinghal0005 | 2 | 2 |
| 24 | @VedanshN | 2 | 2 |
| 25 | @nikhil1205-ai | 2 | 2 |
| 26 | @MEHWISH310 | 2 | 2 |
| 27 | @dishant62 | 2 | 2 |
| 28 | @AshutoshDash1999 | 2 | 2 |
| 29 | @Aharshi3614 | 2 | 2 |
| 30 | @yhcb21 | 1 | 1 |
| 31 | @Shweta-Bairagi0312 | 1 | 1 |
| 32 | @jahareena-06 | 1 | 1 |
| 33 | @vishakhaojha57 | 1 | 1 |
| 34 | @Vanshikaram | 1 | 1 |
| 35 | @Shlok-Dwivedi | 1 | 1 |
| 36 | @StackFox | 1 | 1 |
| 37 | @PulkitSachdev25 | 1 | 1 |
| 38 | @Laasya2007 | 1 | 1 |
| 39 | @Gunjan10-droid | 1 | 1 |
| 40 | @CharlapallyDivyani | 1 | 1 |
| 41 | @anshul-lh44 | 1 | 1 |
| 42 | @androidvitb | 1 | 1 |

<!-- LEADERBOARD_END -->

---

Built with ❤️ by the open-source community.
