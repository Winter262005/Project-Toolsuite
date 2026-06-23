document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const elements = {
        workflowName: document.getElementById('workflowName'),
        runnerOS: document.getElementById('runnerOS'),
        triggerPush: document.getElementById('triggerPush'),
        triggerPR: document.getElementById('triggerPR'),
        triggerDispatch: document.getElementById('triggerDispatch'),
        triggerBranches: document.getElementById('triggerBranches'),
        branchGroup: document.getElementById('branchGroup'),

        templatePicker: document.getElementById('templatePicker'),
        previewArea: document.getElementById('previewArea'),
        previewTitle: document.getElementById('previewTitle'),
        explanationList: document.getElementById('explanationList'),
        secretsWidget: document.getElementById('secretsWidget'),
        secretsList: document.getElementById('secretsList'),

        // Node
        nodeVersion: document.getElementById('nodeVersion'),
        nodeCache: document.getElementById('nodeCache'),
        nodeLint: document.getElementById('nodeLint'),
        nodeTest: document.getElementById('nodeTest'),
        nodeBuild: document.getElementById('nodeBuild'),

        // Python
        pythonVersion: document.getElementById('pythonVersion'),
        pipCommand: document.getElementById('pipCommand'),
        pythonLint: document.getElementById('pythonLint'),
        pythonTest: document.getElementById('pythonTest'),

        // React
        reactNodeVersion: document.getElementById('reactNodeVersion'),
        reactBuildCmd: document.getElementById('reactBuildCmd'),
        reactDeployTarget: document.getElementById('reactDeployTarget'),
        reactS3Bucket: document.getElementById('reactS3Bucket'),
        reactAWSRegion: document.getElementById('reactAWSRegion'),
        reactGHBranch: document.getElementById('reactGHBranch'),
        reactFTPServer: document.getElementById('reactFTPServer'),
        reactFTPTargetDir: document.getElementById('reactFTPTargetDir'),
        reactS3Group: document.getElementById('reactS3Group'),
        reactGHPagesGroup: document.getElementById('reactGHPagesGroup'),
        reactFTPGroup: document.getElementById('reactFTPGroup'),

        // Docker
        dockerRegistry: document.getElementById('dockerRegistry'),
        dockerImageName: document.getElementById('dockerImageName'),
        dockerHubUsername: document.getElementById('dockerHubUsername'),
        dockerHubToken: document.getElementById('dockerHubToken'),
        dockerHubGroup: document.getElementById('dockerHubGroup'),
        dockerGHCRGroup: document.getElementById('dockerGHCRGroup'),
        dockerAWSGroup: document.getElementById('dockerAWSGroup'),
        dockerAWSRegistryId: document.getElementById('dockerAWSRegistryId'),
        dockerAWSRegion: document.getElementById('dockerAWSRegion'),

        // Pages
        pagesBuildStep: document.getElementById('pagesBuildStep'),
        pagesBuildCmd: document.getElementById('pagesBuildCmd'),
        pagesOutputDir: document.getElementById('pagesOutputDir'),
        pagesBuildSubPanel: document.getElementById('pagesBuildSubPanel'),

        // Vercel
        vercelTokenName: document.getElementById('vercelTokenName'),
        vercelProjectId: document.getElementById('vercelProjectId'),
        vercelOrgId: document.getElementById('vercelOrgId')
    };

    let activeTemplate = 'node';


    setupEventListeners();
    updatePanelVisibility();
    generate();

    function setupEventListeners() {

        const inputElements = document.querySelectorAll('input, select');
        inputElements.forEach(el => {
            el.addEventListener('input', generate);
            el.addEventListener('change', generate);
        });


        const tabs = elements.templatePicker.querySelectorAll('.radio-tab-label');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                tabs.forEach(t => t.classList.remove('checked'));
                tab.classList.add('checked');

                const radio = tab.querySelector('input[type="radio"]');
                radio.checked = true;
                activeTemplate = radio.value;

                updatePanelVisibility();
                generate();
            });
        });


        const outputTabs = document.getElementById('outputTabPicker').querySelectorAll('.radio-tab-label');
        outputTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                outputTabs.forEach(t => t.classList.remove('checked'));
                tab.classList.add('checked');

                const radio = tab.querySelector('input[type="radio"]');
                radio.checked = true;

                if (radio.value === 'code') {
                    document.getElementById('output-tab-code').style.display = 'block';
                    document.getElementById('output-tab-explanation').style.display = 'none';
                } else {
                    document.getElementById('output-tab-code').style.display = 'none';
                    document.getElementById('output-tab-explanation').style.display = 'block';
                }
            });
        });


        const toggleBranchGroup = () => {
            const needsBranch = elements.triggerPush.checked || elements.triggerPR.checked;
            elements.branchGroup.style.display = needsBranch ? 'block' : 'none';
        };
        elements.triggerPush.addEventListener('change', toggleBranchGroup);
        elements.triggerPR.addEventListener('change', toggleBranchGroup);
        toggleBranchGroup();

        // React Sub panels
        elements.reactDeployTarget.addEventListener('change', () => {
            const val = elements.reactDeployTarget.value;
            elements.reactS3Group.classList.remove('active');
            elements.reactGHPagesGroup.classList.remove('active');
            elements.reactFTPGroup.classList.remove('active');

            if (val === 's3') elements.reactS3Group.classList.add('active');
            if (val === 'ghpages') elements.reactGHPagesGroup.classList.add('active');
            if (val === 'ftp') elements.reactFTPGroup.classList.add('active');
        });

        // Docker Sub panels
        elements.dockerRegistry.addEventListener('change', () => {
            const val = elements.dockerRegistry.value;
            elements.dockerHubGroup.classList.remove('active');
            elements.dockerGHCRGroup.classList.remove('active');
            elements.dockerAWSGroup.classList.remove('active');

            if (val === 'dockerhub') elements.dockerHubGroup.classList.add('active');
            if (val === 'ghcr') elements.dockerGHCRGroup.classList.add('active');
            if (val === 'aws') elements.dockerAWSGroup.classList.add('active');
        });

        // Pages Sub panels
        elements.pagesBuildStep.addEventListener('change', () => {
            if (elements.pagesBuildStep.checked) {
                elements.pagesBuildSubPanel.classList.add('active');
            } else {
                elements.pagesBuildSubPanel.classList.remove('active');
            }
        });
    }

    function updatePanelVisibility() {
        // Hide all template specific panels
        document.querySelectorAll('.template-panel').forEach(panel => {
            panel.style.display = 'none';
        });
        // Show active template panel
        const activePanel = document.getElementById(`panel-${activeTemplate}`);
        if (activePanel) {
            activePanel.style.display = 'block';
        }
    }

    function generate() {
        const wfName = elements.workflowName.value.trim() || 'CI/CD Pipeline';
        const os = elements.runnerOS.value;
        const branches = elements.triggerBranches.value.split(',').map(b => b.trim()).filter(b => b.length > 0);


        const cleanedName = wfName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'ci';
        if (elements.previewTitle) {
            elements.previewTitle.innerText = `.github/workflows/${cleanedName}.yml`;
        }


        let triggerYaml = '';
        if (elements.triggerPush.checked || elements.triggerPR.checked || elements.triggerDispatch.checked) {
            triggerYaml += 'on:\n';
            if (elements.triggerPush.checked) {
                triggerYaml += '  push:\n';
                if (branches.length > 0) {
                    triggerYaml += `    branches: [ ${branches.map(b => `"${b}"`).join(', ')} ]\n`;
                }
            }
            if (elements.triggerPR.checked) {
                triggerYaml += '  pull_request:\n';
                if (branches.length > 0) {
                    triggerYaml += `    branches: [ ${branches.map(b => `"${b}"`).join(', ')} ]\n`;
                }
            }
            if (elements.triggerDispatch.checked) {
                triggerYaml += '  workflow_dispatch:\n';
            }
        } else {

            triggerYaml += 'on:\n  push:\n    branches: [ "main" ]\n';
        }

        let yaml = `name: ${wfName}\n\n${triggerYaml}\n`;
        let explanationSteps = [];
        let secretsNeeded = [];


        let triggerDesc = 'Triggered when code is ';
        const triggers = [];
        if (elements.triggerPush.checked) triggers.push('pushed');
        if (elements.triggerPR.checked) triggers.push('submitted via Pull Request');
        let trigText = triggers.join(' or ');
        if (branches.length > 0 && (elements.triggerPush.checked || elements.triggerPR.checked)) {
            trigText += ` to branch(es): <code>${branches.join(', ')}</code>`;
        }
        if (elements.triggerDispatch.checked) {
            trigText += (trigText ? ' or ' : '') + 'manually triggered (workflow_dispatch)';
        }
        explanationSteps.push({
            title: 'Trigger Events',
            desc: triggerDesc + (trigText || 'pushed to main branch') + '.'
        });


        explanationSteps.push({
            title: 'Execution Environment',
            desc: `Runs the job pipeline on a hosted virtual runner running <code>${os}</code>.`
        });

        // Template specific YAML generation
        if (activeTemplate === 'node') {
            const version = elements.nodeVersion.value;
            const cache = elements.nodeCache.value;
            const lint = elements.nodeLint.checked;
            const test = elements.nodeTest.checked;
            const build = elements.nodeBuild.checked;

            yaml += `jobs:\n  build-and-test:\n    runs-on: ${os}\n\n    steps:\n      - name: Checkout repository\n        uses: actions/checkout@v4\n\n`;

            explanationSteps.push({
                title: 'Checkout Code',
                desc: 'Uses <code>actions/checkout@v4</code> to pull your repository files into the environment runner.'
            });

            if (cache === 'pnpm') {
                yaml += `      - name: Install pnpm\n        uses: pnpm/action-setup@v3\n        with:\n          version: 9\n\n`;
                explanationSteps.push({
                    title: 'pnpm Package Manager setup',
                    desc: 'Installs and configures <code>pnpm</code> version 9 globally on the runner.'
                });
            }

            yaml += `      - name: Set up Node.js\n        uses: actions/setup-node@v4\n        with:\n          node-version: '${version}'\n`;
            if (cache !== 'none') {
                yaml += `          cache: '${cache}'\n`;
            }
            yaml += `\n`;

            explanationSteps.push({
                title: 'Node.js Setup',
                desc: `Installs Node.js <code>${version}</code> and sets up active <code>${cache !== 'none' ? cache : 'no'}</code> dependency caching to speed up pipelines.`
            });

            const installCmd = cache === 'pnpm' ? 'pnpm install --frozen-lockfile' : (cache === 'yarn' ? 'yarn install --frozen-lockfile' : 'npm ci');
            yaml += `      - name: Install dependencies\n        run: ${installCmd}\n\n`;
            explanationSteps.push({
                title: 'Dependency Installation',
                desc: `Installs clean workspace dependencies using command: <code>${installCmd}</code>.`
            });

            if (lint) {
                const lintCmd = cache === 'pnpm' ? 'pnpm run lint' : (cache === 'yarn' ? 'yarn run lint' : 'npm run lint');
                yaml += `      - name: Run linter\n        run: ${lintCmd}\n\n`;
                explanationSteps.push({
                    title: 'Linter Execution',
                    desc: `Validates clean coding styles by executing lint command: <code>${lintCmd}</code>.`
                });
            }

            if (test) {
                const testCmd = cache === 'pnpm' ? 'pnpm test' : (cache === 'yarn' ? 'yarn test' : 'npm test');
                yaml += `      - name: Run tests\n        run: ${testCmd}\n\n`;
                explanationSteps.push({
                    title: 'Unit Test Execution',
                    desc: `Executes your automated test cases using command: <code>${testCmd}</code>.`
                });
            }

            if (build) {
                const buildCmd = cache === 'pnpm' ? 'pnpm build' : (cache === 'yarn' ? 'yarn build' : 'npm run build');
                yaml += `      - name: Build project\n        run: ${buildCmd}\n`;
                explanationSteps.push({
                    title: 'Production Build',
                    desc: `Compiles and prepares distribution build files using command: <code>${buildCmd}</code>.`
                });
            }

        } else if (activeTemplate === 'python') {
            const version = elements.pythonVersion.value;
            const pipCmd = elements.pipCommand.value.trim() || 'pip install -r requirements.txt';
            const lint = elements.pythonLint.checked;
            const test = elements.pythonTest.checked;

            yaml += `jobs:\n  python-ci:\n    runs-on: ${os}\n\n    steps:\n      - name: Checkout repository\n        uses: actions/checkout@v4\n\n`;
            yaml += `      - name: Set up Python\n        uses: actions/setup-python@v5\n        with:\n          python-version: '${version}'\n          cache: 'pip'\n\n`;
            yaml += `      - name: Install dependencies\n        run: |\n          python -m pip install --upgrade pip\n          ${pipCmd}\n\n`;

            explanationSteps.push({
                title: 'Checkout Code',
                desc: 'Uses <code>actions/checkout@v4</code> to pull your repository files into the environment runner.'
            });
            explanationSteps.push({
                title: 'Python Installation',
                desc: `Installs Python version <code>${version}</code> and sets up <code>pip</code> caching automatically.`
            });
            explanationSteps.push({
                title: 'Dependency Installation',
                desc: `Upgrades pip and installs project requirements via: <code>${pipCmd}</code>.`
            });

            if (lint) {
                yaml += `      - name: Lint with flake8\n        run: |\n          pip install flake8\n          # stop the build if there are Python syntax errors or undefined names\n          flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics\n          # exit-zero treats all errors as warnings.\n          flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics\n\n`;
                explanationSteps.push({
                    title: 'Flake8 Code Linting',
                    desc: 'Installs and runs <code>flake8</code> to scan codebase syntax errors, undefined names, and format compliance.'
                });
            }

            if (test) {
                yaml += `      - name: Test with pytest\n        run: |\n          pip install pytest\n          pytest\n`;
                explanationSteps.push({
                    title: 'Pytest Test Suite',
                    desc: 'Installs and runs <code>pytest</code> to execute Python unit and integration tests.'
                });
            }

        } else if (activeTemplate === 'react') {
            const version = elements.reactNodeVersion.value;
            const buildCmd = elements.reactBuildCmd.value.trim() || 'npm run build';
            const target = elements.reactDeployTarget.value;

            yaml += `jobs:\n  build-and-deploy:\n    runs-on: ${os}\n\n    steps:\n      - name: Checkout repository\n        uses: actions/checkout@v4\n\n`;
            yaml += `      - name: Set up Node.js\n        uses: actions/setup-node@v4\n        with:\n          node-version: '${version}'\n          cache: 'npm'\n\n`;
            yaml += `      - name: Install dependencies\n        run: npm ci\n\n`;
            yaml += `      - name: Build static site\n        run: ${buildCmd}\n\n`;

            explanationSteps.push({
                title: 'Checkout & Setup Environment',
                desc: `Pulls files, configures Node.js <code>${version}</code> environment with npm cache, and installs dependencies cleanly.`
            });
            explanationSteps.push({
                title: 'Production Compile',
                desc: `Compiles assets to production-ready static files using: <code>${buildCmd}</code>.`
            });

            if (target === 's3') {
                const bucket = elements.reactS3Bucket.value.trim() || 'my-react-app-bucket';
                const region = elements.reactAWSRegion.value.trim() || 'us-east-1';

                yaml += `      - name: Configure AWS credentials\n        uses: aws-actions/configure-aws-credentials@v4\n        with:\n          aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}\n          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}\n          aws-region: ${region}\n\n`;
                yaml += `      - name: Deploy to S3 Bucket\n        run: aws s3 sync dist/ s3://${bucket} --delete\n`;

                explanationSteps.push({
                    title: 'AWS Auth Configuration',
                    desc: `Uses repository secrets to securely log in to Amazon Web Services region: <code>${region}</code>.`
                });
                explanationSteps.push({
                    title: 'S3 Object Sync',
                    desc: `Synchronizes production folder build outputs to Amazon S3 bucket <code>s3://${bucket}</code> and purges deleted local assets.`
                });

                secretsNeeded.push('AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY');

            } else if (target === 'ghpages') {
                const branchName = elements.reactGHBranch.value.trim() || 'gh-pages';

                yaml += `      - name: Deploy to GitHub Pages\n        uses: JamesIves/github-pages-deploy-action@v4\n        with:\n          folder: dist\n          branch: ${branchName}\n          token: \${{ secrets.GITHUB_TOKEN }}\n`;

                explanationSteps.push({
                    title: 'Pages Deploy Action',
                    desc: `Pushes production compilation directory contents straight into branch <code>${branchName}</code> using auto-managed access token.`
                });

            } else if (target === 'ftp') {
                const ftpServer = elements.reactFTPServer.value.trim() || 'ftp.example.com';
                const ftpTargetDir = elements.reactFTPTargetDir.value.trim() || '/public_html';

                yaml += `      - name: Deploy via FTP\n        uses: SamKirkland/FTP-Deploy-Action@v4.3.5\n        with:\n          server: ${ftpServer}\n          username: \${{ secrets.FTP_USERNAME }}\n          password: \${{ secrets.FTP_PASSWORD }}\n          local-dir: ./dist/\n          server-dir: ${ftpTargetDir}\n`;

                explanationSteps.push({
                    title: 'FTP Sync Deployment',
                    desc: `Uploads production assets to FTP Server <code>${ftpServer}</code> directory path: <code>${ftpTargetDir}</code>.`
                });

                secretsNeeded.push('FTP_USERNAME', 'FTP_PASSWORD');
            }

        } else if (activeTemplate === 'docker') {
            const registry = elements.dockerRegistry.value;
            const imgName = elements.dockerImageName.value.trim() || 'myapp';

            yaml += `jobs:\n  docker-build:\n    runs-on: ${os}\n\n    steps:\n      - name: Checkout repository\n        uses: actions/checkout@v4\n\n`;
            yaml += `      - name: Set up QEMU\n        uses: docker/setup-qemu-action@v3\n\n`;
            yaml += `      - name: Set up Docker Buildx\n        uses: docker/setup-buildx-action@v3\n\n`;

            explanationSteps.push({
                title: 'Checkout & Buildx Prep',
                desc: 'Pulls the project repository and configures hardware emulation (QEMU) alongside Buildx builder for multi-platform architectures.'
            });

            if (registry === 'dockerhub') {
                const userSec = elements.dockerHubUsername.value.trim() || 'DOCKERHUB_USERNAME';
                const passSec = elements.dockerHubToken.value.trim() || 'DOCKERHUB_TOKEN';

                yaml += `      - name: Log in to Docker Hub\n        uses: docker/login-action@v3\n        with:\n          username: \${{ secrets.${userSec} }}\n          password: \${{ secrets.${passSec} }}\n\n`;
                yaml += `      - name: Build and push Docker image\n        uses: docker/build-push-action@v6\n        with:\n          context: .\n          push: true\n          tags: |\n            \${{ secrets.${userSec} }}/${imgName}:latest\n            \${{ secrets.${userSec} }}/${imgName}:\${{ github.sha }}\n`;

                explanationSteps.push({
                    title: 'Docker Hub Login',
                    desc: `Logs into official Docker Hub registry using secrets parameters: <code>${userSec}</code> and <code>${passSec}</code>.`
                });
                explanationSteps.push({
                    title: 'Build & Registry Push',
                    desc: `Builds Docker container image using project local Dockerfile, tags as <code>latest</code> and <code>git-sha</code>, and pushes to Docker Hub.`
                });

                secretsNeeded.push(userSec, passSec);

            } else if (registry === 'ghcr') {
                yaml += `      - name: Log in to GitHub Container Registry\n        uses: docker/login-action@v3\n        with:\n          registry: ghcr.io\n          username: \${{ github.actor }}\n          password: \${{ secrets.GITHUB_TOKEN }}\n\n`;
                yaml += `      - name: Build and push Docker image\n        uses: docker/build-push-action@v6\n        with:\n          context: .\n          push: true\n          tags: |\n            ghcr.io/\${{ github.repository }}/${imgName}:latest\n            ghcr.io/\${{ github.repository }}/${imgName}:\${{ github.sha }}\n`;

                explanationSteps.push({
                    title: 'GHCR Registry Login',
                    desc: 'Authenticates with GitHub Container Registry (ghcr.io) automatically utilizing sandbox user actor and workspace token credentials.'
                });
                explanationSteps.push({
                    title: 'Build & Package Push',
                    desc: `Builds, tags, and uploads Docker container packages directly to GitHub Packages storage namespace <code>ghcr.io/\${{ github.repository }}/${imgName}</code>.`
                });

            } else if (registry === 'aws') {
                const registryId = elements.dockerAWSRegistryId.value.trim() || '123456789012';
                const region = elements.dockerAWSRegion.value.trim() || 'us-east-1';

                yaml += `      - name: Configure AWS credentials\n        uses: aws-actions/configure-aws-credentials@v4\n        with:\n          aws-access-key-id: \${{ secrets.AWS_ACCESS_KEY_ID }}\n          aws-secret-access-key: \${{ secrets.AWS_SECRET_ACCESS_KEY }}\n          aws-region: ${region}\n\n`;
                yaml += `      - name: Log in to Amazon ECR\n        id: login-ecr\n        uses: aws-actions/amazon-ecr-login@v2\n\n`;
                yaml += `      - name: Build and push Docker image\n        uses: docker/build-push-action@v6\n        with:\n          context: .\n          push: true\n          tags: |\n            ${registryId}.dkr.ecr.${region}.amazonaws.com/${imgName}:latest\n            ${registryId}.dkr.ecr.${region}.amazonaws.com/${imgName}:\${{ github.sha }}\n`;

                explanationSteps.push({
                    title: 'AWS Auth Configuration',
                    desc: 'Logs into AWS infrastructure using vault secrets: <code>AWS_ACCESS_KEY_ID</code> and <code>AWS_SECRET_ACCESS_KEY</code>.'
                });
                explanationSteps.push({
                    title: 'AWS ECR Container Registry Login',
                    desc: 'Uses specialized login agent action to retrieve local Docker login details from Amazon Elastic Container Registry.'
                });
                explanationSteps.push({
                    title: 'Build & AWS Push',
                    desc: `Builds Docker container image and securely uploads container package to AWS Elastic Container Registry location.`
                });

                secretsNeeded.push('AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY');
            }

        } else if (activeTemplate === 'pages') {
            const hasBuild = elements.pagesBuildStep.checked;
            const buildCmd = elements.pagesBuildCmd.value.trim() || 'npm run build';
            const outputDir = elements.pagesOutputDir.value.trim() || 'dist';

            yaml += `permissions:\n  contents: read\n  pages: write\n  id-token: write\n\nconcurrency:\n  group: "pages"\n  cancel-in-progress: false\n\njobs:\n  deploy-pages:\n    environment:\n      name: github-pages\n      url: \${{ steps.deployment.outputs.page_url }}\n    runs-on: ${os}\n\n    steps:\n      - name: Checkout repository\n        uses: actions/checkout@v4\n\n`;

            explanationSteps.push({
                title: 'Security Permissions',
                desc: 'Declares required access credentials: read authorization for repositories, and write capabilities for GitHub Pages deployments & OIDC tokens.'
            });
            explanationSteps.push({
                title: 'Deployment Concurrency',
                desc: 'Queues pages deployment runs to ensure updates are released sequentially without race conditions.'
            });

            if (hasBuild) {
                yaml += `      - name: Set up Node.js\n        uses: actions/setup-node@v4\n        with:\n          node-version: '20.x'\n          cache: 'npm'\n\n      - name: Install dependencies\n        run: npm ci\n\n      - name: Build static files\n        run: ${buildCmd}\n\n`;

                explanationSteps.push({
                    title: 'Project Compilation',
                    desc: `Installs Node.js 20, configures dependency caching, and executes production compilation command: <code>${buildCmd}</code>.`
                });
            }

            yaml += `      - name: Configure GitHub Pages\n        uses: actions/configure-pages@v5\n\n`;
            yaml += `      - name: Upload production artifact\n        uses: actions/upload-pages-artifact@v3\n        with:\n          path: '${outputDir}'\n\n`;
            yaml += `      - name: Deploy to GitHub Pages\n        id: deployment\n        uses: actions/deploy-pages@v4\n`;

            explanationSteps.push({
                title: 'Pages Infrastructure Setup',
                desc: 'Initializes and retrieves setup instructions from GitHub Pages framework environment.'
            });
            explanationSteps.push({
                title: 'Artifact Package Upload',
                desc: `Packs and uploads production folder <code>${outputDir}</code> workspace into secure staging artifact storage.`
            });
            explanationSteps.push({
                title: 'Final Live Release',
                desc: 'Instructs Pages deploy worker to release uploaded staging package straight to web domain hosting.'
            });

        } else if (activeTemplate === 'vercel') {
            const tokenSec = elements.vercelTokenName.value.trim() || 'VERCEL_TOKEN';
            const projectSec = elements.vercelProjectId.value.trim() || 'VERCEL_PROJECT_ID';
            const orgSec = elements.vercelOrgId.value.trim() || 'VERCEL_ORG_ID';

            yaml += `env:\n  VERCEL_ORG_ID: \${{ secrets.${orgSec} }}\n  VERCEL_PROJECT_ID: \${{ secrets.${projectSec} }}\n\njobs:\n  deploy-vercel:\n    runs-on: ${os}\n    steps:\n      - name: Checkout repository\n        uses: actions/checkout@v4\n\n`;
            yaml += `      - name: Install Vercel CLI\n        run: npm install --global vercel@latest\n\n`;
            yaml += `      - name: Pull Vercel Environment Information\n        run: vercel pull --yes --environment=production --token=\${{ secrets.${tokenSec} }}\n\n`;
            yaml += `      - name: Build Project Artifacts\n        run: vercel build --prod --token=\${{ secrets.${tokenSec} }}\n\n`;
            yaml += `      - name: Deploy Project Artifacts to Vercel\n        run: vercel deploy --prebuilt --prod --token=\${{ secrets.${tokenSec} }}\n`;

            explanationSteps.push({
                title: 'Checkout & Environment Variables',
                desc: `Pulls files, then injects target Vercel credentials: <code>${orgSec}</code> and <code>${projectSec}</code> into environmental context.`
            });
            explanationSteps.push({
                title: 'Vercel Command Line Tooling',
                desc: 'Installs current Vercel Command-Line Interface (CLI) application globally inside execution runner.'
            });
            explanationSteps.push({
                title: 'Credentials & Config Fetch',
                desc: `Pulls active Vercel configuration state from Vercel registry via access token key: <code>${tokenSec}</code>.`
            });
            explanationSteps.push({
                title: 'Pre-compile Assets',
                desc: 'Compiles optimization package build directories matching Vercel runtime constraints.'
            });
            explanationSteps.push({
                title: 'Production Deployment',
                desc: 'Uploads pre-built local artifacts to live host namespace under deployment token.'
            });

            secretsNeeded.push(tokenSec, projectSec, orgSec);
        }

        // Render YAML Preview
        elements.previewArea.value = yaml;

        // Render Explanations
        elements.explanationList.innerHTML = '';
        explanationSteps.forEach(step => {
            const li = document.createElement('li');
            li.className = 'explanation-item';
            li.innerHTML = `
                <div class="explanation-title">${step.title}</div>
                <div class="explanation-desc">${step.desc}</div>
            `;
            elements.explanationList.appendChild(li);
        });

        // Render Secrets
        if (secretsNeeded.length > 0) {
            elements.secretsWidget.style.display = 'block';
            elements.secretsList.innerHTML = '';
            secretsNeeded.forEach(secName => {
                const li = document.createElement('li');
                li.style.marginBottom = '6px';
                li.innerHTML = `<code>${secName}</code>`;
                elements.secretsList.appendChild(li);
            });
        } else {
            elements.secretsWidget.style.display = 'none';
        }
    }

    // Copy to clipboard function
    window.copyWorkflow = function () {
        const txt = elements.previewArea.value;
        navigator.clipboard.writeText(txt).then(() => {
            if (typeof notify !== 'undefined') {
                notify.success('Workflow configuration copied to clipboard!');
            } else {
                alert('Workflow configuration copied!');
            }
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            if (typeof notify !== 'undefined') {
                notify.error('Could not copy config to clipboard.');
            }
        });
    };

    // Download file function
    window.downloadWorkflow = function () {
        const txt = elements.previewArea.value;
        const blob = new Blob([txt], { type: 'text/yaml;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');

        // Make the file name fit clean patterns
        const cleanedName = elements.workflowName.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'ci';
        a.href = url;
        a.download = `${cleanedName}.yml`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (typeof notify !== 'undefined') {
            notify.success(`Downloaded ${cleanedName}.yml successfully!`);
        }
    };
});
