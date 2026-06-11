/**
 * IP Subnet Calculator - script.js
 * Client-side IPv4 subnet calculations and formatting.
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const ipInput = document.getElementById('ipAddress');
    const cidrInput = document.getElementById('cidrPrefix');
    const cidrSlider = document.getElementById('cidrSlider');
    const calculateBtn = document.getElementById('calculateBtn');
    const presetBtns = document.querySelectorAll('.preset-btn');
    
    // Error elements
    const ipError = document.getElementById('ipError');
    const cidrError = document.getElementById('cidrError');
    
    // Result elements
    const resNetwork = document.getElementById('resNetwork');
    const resBroadcast = document.getElementById('resBroadcast');
    const resFirstHost = document.getElementById('resFirstHost');
    const resLastHost = document.getElementById('resLastHost');
    const resSubnetMask = document.getElementById('resSubnetMask');
    const resCidr = document.getElementById('resCidr');
    const resTotalHosts = document.getElementById('resTotalHosts');
    const resUsableHosts = document.getElementById('resUsableHosts');
    
    // Metadata elements
    const metaClass = document.getElementById('metaClass');
    const metaScope = document.getElementById('metaScope');
    const metaDescription = document.getElementById('metaDescription');
    const edgeCaseCard = document.getElementById('edgeCaseCard');
    const edgeCaseExplanation = document.getElementById('edgeCaseExplanation');
    
    // Binary elements
    const binIp = document.getElementById('binIp');
    const binMask = document.getElementById('binMask');
    const binNetwork = document.getElementById('binNetwork');
    const binBroadcast = document.getElementById('binBroadcast');
    
    // Toast element
    const copyToast = document.getElementById('copyToast');

    // REGEX for IPv4 Address Validation
    const ipRegex = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

    // Initialize Calculator
    calculateSubnet();

    // Event Listeners for sync inputs
    cidrInput.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val) && val >= 0 && val <= 32) {
            cidrSlider.value = val;
            clearError(cidrError);
            updatePresetActiveState(val);
            calculateSubnet();
        } else {
            showError(cidrError, 'Must be between 0 and 32');
        }
    });

    cidrSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        cidrInput.value = val;
        clearError(cidrError);
        updatePresetActiveState(val);
        calculateSubnet();
    });

    ipInput.addEventListener('input', () => {
        const ip = ipInput.value.trim();
        if (ipRegex.test(ip)) {
            clearError(ipError);
            calculateSubnet();
        }
    });

    // Preset buttons
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const val = parseInt(btn.getAttribute('data-value'), 10);
            cidrInput.value = val;
            cidrSlider.value = val;
            clearError(cidrError);
            updatePresetActiveState(val);
            calculateSubnet();
        });
    });

    // Explicit Calculate button
    calculateBtn.addEventListener('click', () => {
        const isIpValid = validateIp();
        const isCidrValid = validateCidr();
        
        if (isIpValid && isCidrValid) {
            calculateSubnet();
        }
    });

    // Enter Key on Inputs triggers calculation
    ipInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            calculateBtn.click();
        }
    });

    cidrInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            calculateBtn.click();
        }
    });

    // Copy to clipboard setup
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                const textToCopy = targetEl.textContent.trim();
                navigator.clipboard.writeText(textToCopy)
                    .then(() => showToast(`Copied: ${textToCopy}`))
                    .catch(() => showToast('Failed to copy text'));
            }
        });
    });

    /**
     * Set active class on active preset button
     */
    function updatePresetActiveState(cidr) {
        presetBtns.forEach(btn => {
            const val = parseInt(btn.getAttribute('data-value'), 10);
            if (val === cidr) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    /**
     * Input Validation Helpers
     */
    function validateIp() {
        const ip = ipInput.value.trim();
        if (!ip) {
            showError(ipError, 'IP Address cannot be empty');
            return false;
        }
        if (!ipRegex.test(ip)) {
            showError(ipError, 'Invalid IPv4 address format (e.g. 192.168.1.1)');
            return false;
        }
        clearError(ipError);
        return true;
    }

    function validateCidr() {
        const val = parseInt(cidrInput.value, 10);
        if (isNaN(val) || val < 0 || val > 32) {
            showError(cidrError, 'CIDR Prefix must be an integer between 0 and 32');
            return false;
        }
        clearError(cidrError);
        return true;
    }

    function showError(element, msg) {
        element.textContent = msg;
    }

    function clearError(element) {
        element.textContent = '';
    }

    /**
     * Subnet Math and Execution
     */
    function calculateSubnet() {
        const ipStr = ipInput.value.trim();
        const cidrVal = parseInt(cidrInput.value, 10);

        // Simple validation checks before computing
        if (!ipRegex.test(ipStr) || isNaN(cidrVal) || cidrVal < 0 || cidrVal > 32) {
            return;
        }

        // Convert IP to integer representation
        const ipInt = ipToInt(ipStr);

        // Calculate Mask
        // Shift bits in JS works on 32-bit signed ints. Masking with >>> 0 forces unsigned.
        const maskInt = cidrVal === 0 ? 0 : (0xffffffff << (32 - cidrVal)) >>> 0;
        const wildcardInt = maskInt ^ 0xffffffff;

        // Calculate Network and Broadcast Addresses
        const networkInt = (ipInt & maskInt) >>> 0;
        const broadcastInt = cidrVal === 32 ? networkInt : (networkInt | wildcardInt) >>> 0;

        // Convert back to dot-decimal strings
        const networkStr = intToIp(networkInt);
        const broadcastStr = intToIp(broadcastInt);
        const maskStr = intToIp(maskInt);

        // Calculate host boundaries & counts
        let firstHostInt, lastHostInt, totalHosts, usableHosts;

        if (cidrVal === 32) {
            // Single IP Host case
            firstHostInt = networkInt;
            lastHostInt = networkInt;
            totalHosts = 1;
            usableHosts = 1;
            
            showEdgeCaseCard(32);
        } else if (cidrVal === 31) {
            // Point-to-Point links case (RFC 3021)
            firstHostInt = networkInt;
            lastHostInt = broadcastInt;
            totalHosts = 2;
            usableHosts = 2;
            
            showEdgeCaseCard(31);
        } else {
            // Standard subnet cases
            firstHostInt = networkInt + 1;
            lastHostInt = broadcastInt - 1;
            totalHosts = Math.pow(2, 32 - cidrVal);
            usableHosts = totalHosts - 2;
            
            hideEdgeCaseCard();
        }

        const firstHostStr = intToIp(firstHostInt);
        const lastHostStr = intToIp(lastHostInt);

        // Populate results fields in UI
        resNetwork.textContent = networkStr;
        resBroadcast.textContent = broadcastStr;
        resFirstHost.textContent = firstHostStr;
        resLastHost.textContent = lastHostStr;
        resSubnetMask.textContent = maskStr;
        resCidr.textContent = `/${cidrVal}`;
        resTotalHosts.textContent = totalHosts.toLocaleString();
        resUsableHosts.textContent = usableHosts.toLocaleString();

        // Populate Binary breakdowns with highlighted subnet vs host bits
        binIp.innerHTML = getBinaryHtmlWithLegend(ipInt, cidrVal);
        binMask.innerHTML = getBinaryHtmlWithLegend(maskInt, cidrVal);
        binNetwork.innerHTML = getBinaryHtmlWithLegend(networkInt, cidrVal);
        binBroadcast.innerHTML = getBinaryHtmlWithLegend(broadcastInt, cidrVal);

        // Update properties and Class designations
        updateIpMetadata(ipStr, ipInt);
    }

    /**
     * Conversion helpers
     */
    function ipToInt(ipStr) {
        const parts = ipStr.split('.').map(Number);
        return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
    }

    function intToIp(intVal) {
        return [
            (intVal >>> 24) & 255,
            (intVal >>> 16) & 255,
            (intVal >>> 8) & 255,
            intVal & 255
        ].join('.');
    }

    /**
     * Binary Highlight Generator
     */
    function getBinaryHtmlWithLegend(intVal, cidr) {
        const binary = (intVal >>> 0).toString(2).padStart(32, '0');
        let html = '';
        for (let i = 0; i < 32; i++) {
            if (i > 0 && i % 8 === 0) {
                html += '.';
            }
            const bit = binary[i];
            if (i < cidr) {
                html += `<span class="mask-bits">${bit}</span>`;
            } else {
                html += `<span class="host-bits">${bit}</span>`;
            }
        }
        return html;
    }

    /**
     * Determines IP Class and Subnet Type and binds description to UI
     */
    function updateIpMetadata(ipStr, ipInt) {
        const firstOctet = parseInt(ipStr.split('.')[0], 10);
        const secondOctet = parseInt(ipStr.split('.')[1], 10);
        
        let ipClass = 'Unknown';
        let classCss = 'class-e';
        let ipScope = 'Public';
        let scopeCss = 'type-public';
        let description = 'Routable public IP address on the global Internet.';

        // 1. IP Class Determination
        if (firstOctet >= 0 && firstOctet <= 127) {
            ipClass = 'Class A';
            classCss = 'class-a';
        } else if (firstOctet >= 128 && firstOctet <= 191) {
            ipClass = 'Class B';
            classCss = 'class-b';
        } else if (firstOctet >= 192 && firstOctet <= 223) {
            ipClass = 'Class C';
            classCss = 'class-c';
        } else if (firstOctet >= 224 && firstOctet <= 239) {
            ipClass = 'Class D (Multicast)';
            classCss = 'class-d';
            ipScope = 'Multicast';
            scopeCss = 'type-special';
            description = 'Used for one-to-many multicast messaging. Not assigned to individual host devices.';
        } else if (firstOctet >= 240 && firstOctet <= 255) {
            ipClass = 'Class E (Reserved)';
            classCss = 'class-e';
            ipScope = 'Reserved';
            scopeCss = 'type-special';
            description = 'Reserved by the IETF for experimental, research, or future administrative use.';
        }

        // 2. IP Range/Scope Determination (Overriding description/scope if matched)
        if (ipClass !== 'Class D (Multicast)' && ipClass !== 'Class E (Reserved)') {
            // Private network check (RFC 1918)
            if (firstOctet === 10) {
                ipScope = 'Private (RFC 1918)';
                scopeCss = 'type-private';
                description = 'Used for private intranets. Non-routable on the public Internet. Free to configure locally.';
            } else if (firstOctet === 172 && (secondOctet >= 16 && secondOctet <= 31)) {
                ipScope = 'Private (RFC 1918)';
                scopeCss = 'type-private';
                description = 'Used for private intranets. Non-routable on the public Internet. Free to configure locally.';
            } else if (firstOctet === 192 && secondOctet === 168) {
                ipScope = 'Private (RFC 1918)';
                scopeCss = 'type-private';
                description = 'Used for private intranets. Non-routable on the public Internet. Free to configure locally.';
            }
            // Loopback check
            else if (firstOctet === 127) {
                ipScope = 'Loopback';
                scopeCss = 'type-loopback';
                description = 'Special loopback range. Used for testing network software on the local host machine itself.';
            }
            // Link-Local / APIPA
            else if (firstOctet === 169 && secondOctet === 254) {
                ipScope = 'Link-Local (APIPA)';
                scopeCss = 'type-special';
                description = 'Automatic Private IP Addressing. Assigned locally when a host fails to receive an IP from a DHCP server.';
            }
            // Carrier-Grade NAT (RFC 6598)
            else if (firstOctet === 100 && (secondOctet >= 64 && secondOctet <= 127)) {
                ipScope = 'Shared CGNAT';
                scopeCss = 'type-special';
                description = 'Carrier-Grade NAT range. Used by ISPs to conserve public IPv4 addresses for consumer routing.';
            }
            // Documentation Test Networks (RFC 5737)
            else if (
                (firstOctet === 192 && secondOctet === 0 && parseInt(ipStr.split('.')[2], 10) === 2) ||
                (firstOctet === 198 && secondOctet === 51 && parseInt(ipStr.split('.')[2], 10) === 100) ||
                (firstOctet === 203 && secondOctet === 0 && parseInt(ipStr.split('.')[2], 10) === 113)
            ) {
                ipScope = 'Documentation';
                scopeCss = 'type-special';
                description = 'TEST-NET ranges reserved exclusively for tutorials, documentation, and example configurations.';
            }
        }

        // Apply metadata designations to elements
        metaClass.textContent = ipClass;
        metaClass.className = `meta-value-badge ${classCss}`;
        
        metaScope.textContent = ipScope;
        metaScope.className = `meta-value-badge ${scopeCss}`;
        
        metaDescription.textContent = description;
    }

    /**
     * Info display for edge-cases
     */
    function showEdgeCaseCard(cidr) {
        edgeCaseCard.classList.remove('hidden');
        if (cidr === 32) {
            edgeCaseExplanation.innerHTML = `<strong>/32 Subnet: Single Host.</strong> In a /32 network, there is only 1 address. The network, broadcast, and host address are all the same. There are no dedicated network or broadcast boundaries.`;
        } else if (cidr === 31) {
            edgeCaseExplanation.innerHTML = `<strong>/31 Subnet: Point-to-Point (RFC 3021).</strong> In a /31 network, there are exactly 2 addresses. To prevent wasting 50% of the addresses on point-to-point links, RFC 3021 removes the network and broadcast address restrictions, allowing both IP addresses to be fully usable host addresses.`;
        }
    }

    function hideEdgeCaseCard() {
        edgeCaseCard.classList.add('hidden');
    }

    /**
     * Clipboard Toast Alert
     */
    let toastTimeout;
    function showToast(msg) {
        copyToast.textContent = msg;
        copyToast.classList.remove('hidden');
        
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            copyToast.classList.add('hidden');
        }, 2000);
    }
});
