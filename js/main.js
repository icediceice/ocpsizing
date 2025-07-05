let selectedLoggingStack = 'elasticsearch';
let selectedCapacityLoggingStack = 'elasticsearch';
let workloadCounter = 0;
let workloads = [];
let currentMode = 'capacity';
let selectedSubscriptionType = 'core';
const LOCAL_STORAGE_KEY = 'openShiftSizingCalculatorInputs';

const WORKLOAD_PRESETS = {
    container: { name: 'Typical Container', vcpu: 0.5, memory: 1 },
    vm: { name: 'Typical VM', vcpu: 2, memory: 4 }
};

// Initialize with one default workload
function initializeWorkloads() {
    if (workloads.length === 0) {
        addWorkload();
    }
}

/**
 * @description Handles the selection of the subscription type.
 * @param {string} type - The selected subscription type ('core' or 'socket').
 * @param {HTMLElement} element - The clicked radio option element.
 */
function selectSubscriptionType(type, element) {
    if (element.classList.contains('disabled')) {
        return;
    }
    selectedSubscriptionType = type;
    
    // Update UI selection
    element.parentElement.querySelectorAll('.radio-option').forEach(option => {
        option.classList.remove('selected');
    });
    element.classList.add('selected');
    element.querySelector('input[type="radio"]').checked = true;
    saveInputsToLocalStorage();
}

function selectLoggingStack(stack, element) {
    selectedLoggingStack = stack;
    
    // Update UI
    element.parentElement.querySelectorAll('.radio-option').forEach(option => {
        option.classList.remove('selected');
    });
    element.classList.add('selected');
    
    // Update radio button
    element.querySelector('input[type="radio"]').checked = true;
    saveInputsToLocalStorage();
}

function selectCapacityLoggingStack(stack, element) {
    selectedCapacityLoggingStack = stack;
    
    // Update UI
    element.parentElement.querySelectorAll('.radio-option').forEach(option => {
        option.classList.remove('selected');
    });
    element.classList.add('selected');
    
    // Update radio button
    element.querySelector('input[type="radio"]').checked = true;
    saveInputsToLocalStorage();
}

function toggleCapacityUtilizationBuffer() {
    const enableBuffer = document.getElementById('capacityEnableUtilizationBuffer').checked;
    const bufferInputs = document.getElementById('capacityUtilizationBufferInputs');
    
    bufferInputs.style.display = enableBuffer ? 'block' : 'none';
    
    if (!enableBuffer) {
        document.getElementById('capacityMaxUtilization').value = 100; // No buffer when disabled
    } else {
        document.getElementById('capacityMaxUtilization').value = 80; // Default buffer when enabled
    }
}

function toggleSocketInput() {
    const customizeSockets = document.getElementById('customizeSockets').checked;
    const socketInput = document.getElementById('socketsPerNode');
    
    socketInput.style.display = customizeSockets ? 'block' : 'none';
    
    if (!customizeSockets) {
        socketInput.value = 2; // Reset to default when hiding
    }
}

function toggleCapacitySocketInput() {
    const customizeSockets = document.getElementById('capacityCustomizeSockets').checked;
    const socketInput = document.getElementById('capacitySocketsPerNode');
    
    socketInput.style.display = customizeSockets ? 'block' : 'none';
    
    if (!customizeSockets) {
        socketInput.value = 2; // Reset to default when hiding
    }
}

function toggleLoggingStorageSection() {
    const content = document.getElementById('storageContent');
    const toggle = document.getElementById('storageToggle');
    
    if (content.classList.contains('active')) {
        content.classList.remove('active');
        toggle.textContent = "▼";
    } else {
        content.classList.add('active');
        toggle.textContent = "▲";
    }
}

function toggleGrowthSection() {
    const content = document.getElementById('growthContent');
    const toggle = document.getElementById('growthToggle');
    
    if (content.classList.contains('active')) {
        content.classList.remove('active');
        toggle.textContent = "▼";
    } else {
        content.classList.add('active');
        toggle.textContent = "▲";
    }
}

function toggleGrowthInputs() {
    const enableGrowth = document.getElementById('enableGrowth').checked;
    const growthInputs = document.getElementById('growthInputs');
    growthInputs.style.display = enableGrowth ? 'block' : 'none';
}

function addWorkload(workload = null) {
    workloadCounter++;
    const workloadId = `workload-${workloadCounter}`;
    
    const isNew = !workload;
    const type = isNew ? 'container' : workload.type;
    const preset = WORKLOAD_PRESETS[type];
    const name = isNew ? preset.name : workload.name;
    const instances = isNew ? 50 : workload.instances;
    const vcpu = isNew ? preset.vcpu : workload.vcpu;
    const memory = isNew ? preset.memory : workload.memory;
    
    const workloadHTML = `
        <div class="workload-item" id="${workloadId}">
            <button class="remove-workload" onclick="removeWorkload('${workloadId}')" title="Remove workload">×</button>
            <div class="workload-inputs">
                <div class="workload-field">
                    <label>Workload Name</label>
                    <input type="text" placeholder="e.g., Web Applications" value="${name}" data-field="name" onchange="updateWorkloads()">
                </div>
                <div class="workload-field">
                    <label>Type</label>
                    <select data-field="type" onchange="handleWorkloadTypeChange(this)">
                        <option value="container" ${type === 'container' ? 'selected' : ''}>Container</option>
                        <option value="vm" ${type === 'vm' ? 'selected' : ''}>VM</option>
                    </select>
                </div>
                <div class="workload-field">
                    <label>Instances</label>
                    <input type="number" placeholder="100" value="${instances}" min="1" data-field="instances" onchange="updateWorkloads()">
                </div>
                <div class="workload-field">
                    <label>vCPU/Instance</label>
                    <input type="number" placeholder="0.5" value="${vcpu}" min="0.1" step="0.1" data-field="vcpu" onchange="updateWorkloads()">
                </div>
                <div class="workload-field">
                    <label>Memory/Instance (GB)</label>
                    <input type="number" placeholder="1.0" value="${memory}" min="0.1" step="0.1" data-field="memory" onchange="updateWorkloads()">
                </div>
            </div>
        </div>
    `;
    
    document.getElementById('workloads-container').insertAdjacentHTML('beforeend', workloadHTML);
    if (isNew) {
        updateWorkloads();
    }
}

function handleWorkloadTypeChange(selectElement) {
    const workloadItem = selectElement.closest('.workload-item');
    if (!workloadItem) return;

    const type = selectElement.value;
    const preset = WORKLOAD_PRESETS[type];

    if (preset) {
        workloadItem.querySelector('[data-field="name"]').value = preset.name;
        workloadItem.querySelector('[data-field="vcpu"]').value = preset.vcpu;
        workloadItem.querySelector('[data-field="memory"]').value = preset.memory;
    }

    updateWorkloads();
}

function removeWorkload(workloadId) {
    document.getElementById(workloadId).remove();
    updateWorkloads();
}

function updateWorkloads() {
    workloads = [];
    const workloadElements = document.querySelectorAll('.workload-item');
    
    workloadElements.forEach(element => {
        const workload = {
            name: element.querySelector('[data-field="name"]').value || 'Unnamed Workload',
            type: element.querySelector('[data-field="type"]').value,
            instances: parseInt(element.querySelector('[data-field="instances"]').value) || 0,
            vcpu: parseFloat(element.querySelector('[data-field="vcpu"]').value) || 0,
            memory: parseFloat(element.querySelector('[data-field="memory"]').value) || 0
        };
        workloads.push(workload);
    });
    checkSubscriptionForVmWorkloads();
    saveInputsToLocalStorage();
}

function checkSubscriptionForVmWorkloads() {
    const hasVmWorkload = workloads.some(w => w.type === 'vm');
    const subscriptionSelector = document.getElementById('subscription-type-selector');
    const coreOption = subscriptionSelector.querySelector('div[onclick*="\'core\'"]');
    const socketOption = subscriptionSelector.querySelector('div[onclick*="\'socket\'"]');

    // Remove existing warning message if any
    const existingWarning = document.getElementById('vm-subscription-warning');
    if (existingWarning) {
        existingWarning.remove();
    }

    // Use classList to enable/disable the core option
    coreOption.classList.toggle('disabled', hasVmWorkload);
    coreOption.querySelector('input').disabled = hasVmWorkload;

    if (hasVmWorkload) {
        // Force selection to socket-based
        selectSubscriptionType('socket', socketOption);

        // Add a warning message
        const warningHTML = `
            <div id="vm-subscription-warning" class="warning" style="margin-top: 15px;">
                <i class="icon-advanced"></i> OpenShift Virtualization (VMs) requires a Bare-metal (Socket-based) subscription. The subscription type has been automatically selected.
            </div>
        `;
        subscriptionSelector.insertAdjacentHTML('afterend', warningHTML);
    }
}

/**
 * @description Calculates the required OpenShift subscriptions based on the cluster size and subscription model.
 * @param {string} type - The subscription type ('core' or 'socket').
 * @param {number} billableNodes - The number of nodes that count towards subscription (i.e., worker nodes).
 * @param {number} cpuCoresPerNode - The number of physical CPU cores per node.
 * @param {number} socketsPerNode - The number of physical sockets per node.
 * @returns {object} An object containing the subscription calculation details.
 */
function calculateSubscriptions(type, billableNodes, cpuCoresPerNode, socketsPerNode) {
    const totalPhysicalCores = billableNodes * cpuCoresPerNode;
    const totalSockets = billableNodes * socketsPerNode;
    let subscriptions = 0;
    let calculationMethod = '';

    if (type === 'core') {
        // Core-based: 1 subscription per 2 physical cores.
        subscriptions = Math.ceil(totalPhysicalCores / 2);
        calculationMethod = `Core-based: ${totalPhysicalCores} total billable cores / 2 cores per subscription.`;
    } else if (type === 'socket') {
        // Bare-metal (Socket-based): The greater of (sockets/2) or (cores/128).
        const subsBySockets = Math.ceil(totalSockets / 2);
        const subsByCores = Math.ceil(totalPhysicalCores / 128);
        subscriptions = Math.max(subsBySockets, subsByCores);
        
        if (subsByCores > subsBySockets) {
            calculationMethod = `Bare-metal (Core-limited): ${totalPhysicalCores} total billable cores / 128 cores per subscription.`;
        } else {
            calculationMethod = `Bare-metal (Socket-limited): ${totalSockets} total billable sockets / 2 sockets per subscription.`;
        }
    }

    return {
        count: subscriptions,
        type: type === 'core' ? 'Core-based' : 'Bare-metal (Socket-based)',
        totalPhysicalCores,
        totalSockets,
        calculationMethod
    };
}

function calculateCpuReservation(totalCpuCores) {
    let reservation = 0;
    
    if (totalCpuCores >= 1) {
        reservation += 1 * 0.06; // First CPU: 6%
    }
    if (totalCpuCores >= 2) {
        reservation += 1 * 0.01; // Second CPU: 1%
    }
    if (totalCpuCores >= 3) {
        let cores3to4 = Math.min(totalCpuCores - 2, 2);
        reservation += cores3to4 * 0.005; // 3rd-4th CPU: 0.5%
    }
    if (totalCpuCores > 4) {
        let remainingCores = totalCpuCores - 4;
        reservation += remainingCores * 0.0025; // Remaining: 0.25%
    }
    
    return reservation;
}

function calculateMemoryReservation(totalMemoryGB) {
    let reservation = 0;
    
    // 25% of first 4 GB
    let first4GB = Math.min(totalMemoryGB, 4);
    reservation += first4GB * 0.25;
    
    // 20% of next 4 GB (GB 4-8)
    if (totalMemoryGB > 4) {
        let next4GB = Math.min(totalMemoryGB - 4, 4);
        reservation += next4GB * 0.20;
    }
    
    // 10% of next 8 GB (GB 8-16)
    if (totalMemoryGB > 8) {
        let next8GB = Math.min(totalMemoryGB - 8, 8);
        reservation += next8GB * 0.10;
    }
    
    // 6% of next 112 GB (GB 16-128)
    if (totalMemoryGB > 16) {
        let next112GB = Math.min(totalMemoryGB - 16, 112);
        reservation += next112GB * 0.06;
    }
    
    // 2% of remaining memory (GB 128+)
    if (totalMemoryGB > 128) {
        let remaining = totalMemoryGB - 128;
        reservation += remaining * 0.02;
    }
    
    return reservation;
}

function calculateLogStorageRequirements() {
    const logVolumePerPod = parseFloat(document.getElementById('logVolumePerPod').value);
    const retentionDays = parseInt(document.getElementById('logRetentionDays').value);
    const compressionRatio = parseFloat(document.getElementById('compressionRatio').value);
    const replicationFactor = parseInt(document.getElementById('replicationFactor').value);

    // Calculate total pods across all workloads
    const totalPods = workloads.reduce((sum, workload) => sum + workload.instances, 0);
    
    // Calculate raw log volume
    const dailyRawLogVolume = totalPods * logVolumePerPod; // MB/day
    const totalRawLogVolume = dailyRawLogVolume * retentionDays; // MB total
    
    // Apply compression
    const compressedLogVolume = totalRawLogVolume / compressionRatio;
    
    // Add infrastructure logs (estimated at 20% of application logs)
    const infraLogVolume = compressedLogVolume * 0.2;
    const totalLogVolume = compressedLogVolume + infraLogVolume;
    
    // Apply replication factor (for Elasticsearch)
    let storageWithReplication = totalLogVolume;
    if (selectedLoggingStack === 'elasticsearch') {
        storageWithReplication = totalLogVolume * replicationFactor;
    }
    
    // Add safety margin (20%)
    const finalStorageRequirement = storageWithReplication * 1.2;
    
    // Convert to GB
    const storageRequirementGB = finalStorageRequirement / 1024;
    
    return {
        totalPods,
        dailyRawLogVolumeMB: dailyRawLogVolume,
        totalRawLogVolumeMB: totalRawLogVolume,
        compressedLogVolumeMB: compressedLogVolume,
        infraLogVolumeMB: infraLogVolume,
        totalLogVolumeMB: totalLogVolume,
        storageWithReplicationMB: storageWithReplication,
        finalStorageRequirementGB: storageRequirementGB,
        retentionDays,
        compressionRatio,
        replicationFactor
    };
}

function getMasterNodeRequirements(workerNodeCount = 0) {
    // Master node resource requirements based on cluster size
    // Minimum 3 master nodes for HA
    const masterCount = 3;
    
    // Resource requirements per master based on worker node count
    let cpuPerMaster, memoryPerMaster;
    
    if (workerNodeCount <= 120) {
        // Up to 120 worker nodes: 8 cores / 32GB per master
        cpuPerMaster = 8;
        memoryPerMaster = 32;
    } else if (workerNodeCount <= 252) {
        // 121-252 worker nodes: 16 cores / 32GB per master
        cpuPerMaster = 16;
        memoryPerMaster = 32;
    } else {
        // Over 252 worker nodes: higher requirements (custom sizing needed)
        cpuPerMaster = 24;
        memoryPerMaster = 48;
    }
    
    return {
        count: masterCount,
        cpu: cpuPerMaster, // vCPUs per master
        memory: memoryPerMaster, // GB per master
        totalCpu: masterCount * cpuPerMaster,
        totalMemory: masterCount * memoryPerMaster
    };
}

function getLoggingOverhead(stack, workerNodes) {
    if (stack === 'elasticsearch') {
        return {
            memoryPerNode: 0.786, // 786Mi in GB
            cpuPerNode: 0.25, // 250m in cores
            totalMemory: workerNodes * 0.786,
            totalCpu: workerNodes * 0.25
        };
    } else {
        return {
            memoryPerNode: 2.05, // 2Gi + 50Mi in GB
            cpuPerNode: 0.25, // 250m in cores
            totalMemory: workerNodes * 2.05,
            totalCpu: workerNodes * 0.25
        };
    }
}

function getInfrastructureRequirements(stack, clusterSize) {
    const loggingInfra = {
        elasticsearch: {
            small: { memory: 49, cpu: 10, storage: 800 },
            medium: { memory: 125, cpu: 15, storage: 2000 },
            large: { memory: 280, cpu: 30, storage: 4000 }
        },
        loki: {
            small: { memory: 16, cpu: 10, storage: 300 },
            medium: { memory: 25, cpu: 18, storage: 600 },
            large: { memory: 47, cpu: 35, storage: 1200 }
        }
    };

    const monitoring = {
        small: { memory: 10.6, cpu: 5, storage: 200 },
        medium: { memory: 25, cpu: 8, storage: 400 },
        large: { memory: 50, cpu: 15, storage: 800 }
    };

    const sizeCategory = getInfrastructureSizeCategory(stack, clusterSize);
    const logging = loggingInfra[stack][sizeCategory];
    const mon = monitoring[sizeCategory];
    return { totalMemory: logging.memory + mon.memory, totalCpu: logging.cpu + mon.cpu, totalStorage: logging.storage + mon.storage, loggingMemory: logging.memory, monitoringMemory: mon.memory };
}

function getInfrastructureSizeCategory(stack, clusterSize) {
    const loggingInfra = {
        elasticsearch: {
            small: { memory: 49, cpu: 10, storage: 800 },
            medium: { memory: 125, cpu: 15, storage: 2000 },
            large: { memory: 280, cpu: 30, storage: 4000 }
        },
        loki: {
            small: { memory: 16, cpu: 10, storage: 300 },
            medium: { memory: 25, cpu: 18, storage: 600 },
            large: { memory: 47, cpu: 35, storage: 1200 }
        }
    };

    const monitoring = {
        small: { memory: 10.6, cpu: 5, storage: 200 },
        medium: { memory: 25, cpu: 8, storage: 400 },
        large: { memory: 50, cpu: 15, storage: 800 }
    };

    let sizeCategory;
    if (clusterSize < 50) sizeCategory = 'small';
    else if (clusterSize < 250) sizeCategory = 'medium';
    else sizeCategory = 'large';

    return sizeCategory;
}

function calculateGrowthProjections(baseWorkloads, annualGrowthRate, months, usableVcpuPerNode, usableMemoryPerNode, maxUtilization, currentWorkerNodes) {
    const projections = [];
    const maxUtilizationPercent = maxUtilization * 100;

    // Derive total available resources per node for accurate utilization reporting
    const availableVcpuPerNode = usableVcpuPerNode / maxUtilization;
    const availableMemoryPerNode = usableMemoryPerNode / maxUtilization;
    
    // Convert annual growth rate to monthly growth rate
    const monthlyGrowthRate = Math.pow(1 + (annualGrowthRate / 100), 1/12) - 1;
    
    let firstUrgentMonth = null;
    let firstWarningMonth = null;
    let firstCautionMonth = null;

    let workerNodesForMonth = currentWorkerNodes; // Start with the initial node count
    
    for (let month = 0; month <= months; month++) {
        const growthFactor = month === 0 ? 1 : Math.pow(1 + monthlyGrowthRate, month);
        
        const projectedWorkloads = baseWorkloads.map(workload => ({
            ...workload,
            instances: Math.ceil(workload.instances * growthFactor)
        }));
        
        const totalInstances = projectedWorkloads.reduce((sum, w) => sum + w.instances, 0);
        const totalVcpu = projectedWorkloads.reduce((sum, w) => sum + (w.instances * w.vcpu), 0);
        const totalMemory = projectedWorkloads.reduce((sum, w) => sum + (w.instances * w.memory), 0);

        // Calculate utilization based on the nodes available at the start of the month
        const totalAvailableVcpu = workerNodesForMonth * availableVcpuPerNode;
        const totalAvailableMemory = workerNodesForMonth * availableMemoryPerNode;

        const cpuUtilization = (totalVcpu / totalAvailableVcpu) * 100;
        const memoryUtilization = (totalMemory / totalAvailableMemory) * 100;
        const maxCurrentUtilization = Math.max(cpuUtilization, memoryUtilization);
        
        // Determine if expansion is needed for the *next* month
        const needsExpansion = maxCurrentUtilization > maxUtilizationPercent;
        let optimalNodesForNextMonth = workerNodesForMonth;
        if (needsExpansion) {
            const nodesForCpu = Math.ceil(totalVcpu / usableVcpuPerNode);
            const nodesForMemory = Math.ceil(totalMemory / usableMemoryPerNode);
            optimalNodesForNextMonth = Math.max(nodesForCpu, nodesForMemory, 3);
        }
        
        // Calculate growth from previous month
        let utilizationGrowth = 0;
        if (month > 0 && projections.length > 0) {
            utilizationGrowth = maxCurrentUtilization - projections[projections.length - 1].maxUtilization;
        }
        
        // Recommendation logic - only set once for the first occurrence
        let recommendation = '';
        let showRecommendation = false;
        
        if (maxCurrentUtilization > maxUtilizationPercent + 5) {
            recommendation = 'URGENT: Add nodes immediately';
            if (firstUrgentMonth === null) {
                firstUrgentMonth = month;
                showRecommendation = true;
            }
        } else if (maxCurrentUtilization > maxUtilizationPercent) {
            recommendation = 'WARNING: Plan node expansion';
            if (firstWarningMonth === null && firstUrgentMonth === null) {
                firstWarningMonth = month;
                showRecommendation = true;
            }
        } else if (maxCurrentUtilization > maxUtilizationPercent - 10) {
            recommendation = 'CAUTION: Monitor closely';
            if (firstCautionMonth === null && firstWarningMonth === null && firstUrgentMonth === null) {
                firstCautionMonth = month;
                showRecommendation = true;
            }
        } else {
            recommendation = 'OK: Capacity sufficient';
        }
        
        projections.push({
            month: month,
            workloads: projectedWorkloads,
            totalInstances: totalInstances,
            totalVcpu: totalVcpu,
            totalMemory: totalMemory,
            workerNodesInMonth: workerNodesForMonth,
            recommendedNodesForNextMonth: optimalNodesForNextMonth,
            cpuUtilization: cpuUtilization,
            memoryUtilization: memoryUtilization,
            maxUtilization: maxCurrentUtilization,
            utilizationGrowth: utilizationGrowth,
            needsExpansion: needsExpansion,
            recommendation: recommendation,
            showRecommendation: showRecommendation,
            growthFactor: growthFactor,
            monthlyGrowthRate: monthlyGrowthRate * 100
        });

        // Set the node count for the next iteration
        workerNodesForMonth = optimalNodesForNextMonth;
    }
    
    return projections;
}

function exportToExcel() {
    if (!window.lastCalculationResults) {
        alert('Please calculate resources first before exporting');
        return;
    }

    const calc = window.lastCalculationResults;
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
        ['OpenShift Resource Planning Calculator'],
        ['Generated on:', new Date().toLocaleString()],
        [''],
        ['Cluster Summary'],
        ['Worker Nodes Required:', calc.finalWorkerNodes],
        ['Master Nodes:', calc.mergeMasters ? '0 (merged)' : calc.masterNodeRequirements.count],
        ['Master CPU per Node (cores):', calc.mergeMasters ? 'N/A' : calc.masterNodeRequirements.cpu],
        ['Master Memory per Node (GB):', calc.mergeMasters ? 'N/A' : calc.masterNodeRequirements.memory],
        ['Total Master Resources:', calc.mergeMasters ? 'N/A' : `${calc.masterNodeRequirements.totalCpu} cores / ${calc.masterNodeRequirements.totalMemory} GB`],
        ['Dedicated Infrastructure:', calc.infraReqs.totalCpu > 0 ? 'User-defined resource pool' : 'None'],
        ['Total Cluster Size:', calc.totalClusterNodes],
        ['Configuration:', calc.mergeMasters ? 'Compact cluster (Masters merged)' : 'Dedicated nodes'],
        [''],
        ['Workload Requirements'],
        ['Total Application Instances:', calc.totalInstances],
        ['Total vCPU Needed:', calc.totalVcpuNeeded.toFixed(1)],
        ['Total Memory Needed (GB):', calc.totalMemoryNeeded.toFixed(1)],
        ['Logging Stack:', calc.selectedLoggingStack === 'elasticsearch' ? 'Elasticsearch' : 'LokiStack'],
        [''],
        ['Worker Node Capacity'],
        ['Physical CPU Cores:', calc.cpuCores],
        ['Total vCPUs per Node:', calc.totalVcpuPerNode],
        ['Available vCPUs (after OS):', calc.availableVcpuPerNode.toFixed(2)],
        ['Available Memory (after OS) (GB):', calc.availableMemoryPerNode.toFixed(1)],
        [''],
        ['Utilization Analysis'],
        ['CPU Utilization (%):', calc.actualCpuUtilization.toFixed(1)],
        ['Memory Utilization (%):', calc.actualMemoryUtilization.toFixed(1)],
        ['Max Utilization Target (%):', calc.maxUtilization],
        [''],
        ['Subscription Requirements'],
        ['Model:', calc.subscriptionInfo.type],
        ['Billable Nodes (Workers):', calc.finalWorkerNodes],
        ['Total Billable Cores:', calc.subscriptionInfo.totalPhysicalCores],
        ...(calc.subscriptionInfo.type === 'Bare-metal (Socket-based)' ? 
            [['Total Billable Sockets:', calc.subscriptionInfo.totalSockets]] : 
            []),
        ['Required Subscriptions:', calc.subscriptionInfo.count],
        ['Calculation:', calc.subscriptionInfo.calculationMethod],
        [''],
        ['Calculated Infrastructure Requirements'],
        ['Total Infra CPU (Cores):', calc.infraReqs.totalCpu.toFixed(1)],
        ['Total Infra Memory (GB):', calc.infraReqs.totalMemory.toFixed(1)],
        ['Total Infra Storage (GB):', calc.infraReqs.totalStorage.toFixed(1)],
        [''],
        ['Log Storage Requirements'],
        ['Total Pods Generating Logs:', calc.logStorage.totalPods],
        ['Daily Raw Log Volume (GB):', (calc.logStorage.dailyRawLogVolumeMB / 1024).toFixed(1)],
        ['Total Storage Required (GB):', calc.logStorage.finalStorageRequirementGB.toFixed(1)],
        ['Retention Period (days):', calc.logStorage.retentionDays],
        ['Compression Ratio:', calc.logStorage.compressionRatio + ':1']
    ];
    
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
    
    // Workloads sheet
    const workloadData = [
        ['Workload Breakdown'],
        ['Name', 'Instances', 'vCPU per Instance', 'Memory per Instance (GB)', 'Total vCPU', 'Total Memory (GB)']
    ];
    
    calc.workloads.forEach(workload => {
        workloadData.push([
            workload.name,
            workload.instances,
            workload.vcpu,
            workload.memory,
            (workload.instances * workload.vcpu).toFixed(1),
            (workload.instances * workload.memory).toFixed(1)
        ]);
    });
    
    const workloadWs = XLSX.utils.aoa_to_sheet(workloadData);
    XLSX.utils.book_append_sheet(wb, workloadWs, 'Workloads');
    
    // Growth projections sheet (if available)
    if (calc.growthProjections) {
        const annualGrowthRate = parseFloat(document.getElementById('growthRate').value);
        const monthlyGrowthRate = calc.growthProjections[1] ? calc.growthProjections[1].monthlyGrowthRate : 0;
        
        const growthData = [
            ['Growth Projections'],
            ['Annual Growth Rate (%):', annualGrowthRate],
            ['Equivalent Monthly Growth Rate (%):', monthlyGrowthRate.toFixed(3)],
            [''],
            ['Month', 'Total Instances', 'Total vCPU', 'Total Memory (GB)', 'Nodes in Month', 'CPU Utilization (%)', 'Memory Utilization (%)', 'Max Utilization (%)', 'Utilization Growth (%)', 'Recommendation', 'Show Alert']
        ];
        
        calc.growthProjections.forEach(proj => {
            growthData.push([
                proj.month,
                proj.totalInstances,
                proj.totalVcpu.toFixed(1),
                proj.totalMemory.toFixed(1),
                proj.workerNodesInMonth,
                proj.cpuUtilization.toFixed(1),
                proj.memoryUtilization.toFixed(1),
                proj.maxUtilization.toFixed(1),
                proj.utilizationGrowth.toFixed(1),
                proj.recommendation,
                proj.showRecommendation ? 'YES' : 'NO'
            ]);
        });
        
        const growthWs = XLSX.utils.aoa_to_sheet(growthData);
        XLSX.utils.book_append_sheet(wb, growthWs, 'Growth Projections');
    }
    
    // Save file
    const fileName = `OpenShift_Resource_Plan_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
}

function createGrowthChart(projections, maxUtilizationThreshold) {
    const canvas = document.getElementById('growthChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (window.growthChartInstance) {
        window.growthChartInstance.destroy();
    }
    
    // Create threshold line data
    const thresholdData = projections.map(() => maxUtilizationThreshold);
    const warningThresholdData = projections.map(() => maxUtilizationThreshold + 10);
    
    window.growthChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: projections.map(p => `Month ${p.month}`),
            datasets: [
                {
                    label: 'Cluster Utilization (%)',
                    data: projections.map(p => p.maxUtilization),
                    borderColor: '#ee0979',
                    backgroundColor: 'rgba(238, 9, 121, 0.1)',
                    tension: 0.4,
                    fill: false,
                    pointRadius: 5,
                    pointHoverRadius: 8
                },
                {
                    label: 'Target Threshold',
                    data: thresholdData,
                    borderColor: '#28a745',
                    backgroundColor: 'transparent',
                    borderDash: [5, 5],
                    tension: 0,
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 0
                },
                {
                    label: 'Warning Threshold',
                    data: warningThresholdData,
                    borderColor: '#ffc107',
                    backgroundColor: 'transparent',
                    borderDash: [10, 5],
                    tension: 0,
                    fill: false,
                    pointRadius: 0,
                    pointHoverRadius: 0
                }
            ]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Timeline'
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Utilization (%)'
                    },
                    min: 0,
                    max: Math.max(100, Math.max(...projections.map(p => p.maxUtilization)) + 10)
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Growth Projection: Cluster Utilization Over Time'
                },
                legend: {
                    display: true
                },
                tooltip: {
                    callbacks: {
                        afterBody: function(context) {
                            if (context[0].datasetIndex === 0) {
                                const projection = projections[context[0].dataIndex];
                                return [
                                    `Instances: ${projection.totalInstances}`,
                                    `vCPU Usage: ${projection.totalVcpu.toFixed(1)}`,
                                    `Memory Usage: ${projection.totalMemory.toFixed(1)} GB`,
                                    `Recommendation: ${projection.recommendation}`
                                ];
                            }
                            return null;
                        }
                    }
                }
            }
        }
    });
}

function calculateResources() {
    // Update workloads from UI
    updateWorkloads();
    
    if (workloads.length === 0) {
        alert('Please add at least one workload type');
        return;
    }

    // Calculate total workload requirements
    const totalInstances = workloads.reduce((sum, workload) => sum + workload.instances, 0);
    const totalVcpuNeeded = workloads.reduce((sum, workload) => sum + (workload.instances * workload.vcpu), 0);
    const totalMemoryNeeded = workloads.reduce((sum, workload) => sum + (workload.instances * workload.memory), 0);

    // Calculate log storage requirements
    const logStorage = calculateLogStorageRequirements();

    // Get worker node specifications
    const cpuCores = parseInt(document.getElementById('cpuCores').value);
    const cpuToVcpuRatio = parseFloat(document.getElementById('cpuToVcpuRatio').value);
    const socketsPerNode = parseInt(document.getElementById('socketsPerNode').value);
    const memoryPerNode = parseInt(document.getElementById('memoryPerNode').value);
    const maxUtilization = parseInt(document.getElementById('maxUtilization').value) / 100;
    
    // Get merge options
    const mergeMasters = document.getElementById('mergeMasters').checked;
    
    // Calculate worker node capacity
    const totalVcpuPerNode = cpuCores * cpuToVcpuRatio;
    
    // Calculate OpenShift reservations
    const cpuReservation = calculateCpuReservation(cpuCores);
    const memoryReservation = calculateMemoryReservation(memoryPerNode);
    
    // Available resources after OpenShift reservations
    let availableVcpuPerNode = totalVcpuPerNode - cpuReservation;
    let availableMemoryPerNode = memoryPerNode - memoryReservation;
    
    // Calculate worker nodes needed with iterative approach to handle master overhead
    let finalWorkerNodes = 3; // Start with minimum for compact clusters
    let iterations = 0;
    const maxIterations = 15;
    let infraReqs = {};
    let masterOverhead = { cpu: 0, memory: 0 };
    
    while (iterations < maxIterations) {
        // Recalculate master overhead based on current worker count estimate
        if (mergeMasters) {
            const currentMasterReqs = getMasterNodeRequirements(finalWorkerNodes);
            // In compact mode, master services consume a fixed amount of cluster resources
            // This is the total resources that would be needed for 3 dedicated masters
            // Apply CPU to vCPU ratio (hyperthreading) to convert cores to vCPUs
            masterOverhead.cpu = currentMasterReqs.count * currentMasterReqs.cpu * cpuToVcpuRatio; // Total vCPUs for all masters
            masterOverhead.memory = currentMasterReqs.count * currentMasterReqs.memory; // Total memory for all masters
        } else {
            masterOverhead.cpu = 0;
            masterOverhead.memory = 0;
        }
        
        // Calculate usable resources per node (after system reservations only)
        const availableAfterSystem = {
            cpu: availableVcpuPerNode,
            memory: availableMemoryPerNode
        };
        
        const usableVcpuPerNode = Math.max(0, availableAfterSystem.cpu * maxUtilization);
        const usableMemoryPerNode = Math.max(0, availableAfterSystem.memory * maxUtilization);
        
        // Check if we have enough resources per node
        if (usableVcpuPerNode <= 0 || usableMemoryPerNode <= 0) {
            // Not enough resources on a single node, this configuration is not viable
            alert('Error: Node specifications are too small. Please increase node specifications.');
            return;
        }
        
        const loggingOverhead = getLoggingOverhead(selectedLoggingStack, finalWorkerNodes);
        
        // Calculate infra requirements based on current estimated cluster size
        const currentClusterSize = (mergeMasters ? 0 : 3) + finalWorkerNodes;
        infraReqs = getInfrastructureRequirements(selectedLoggingStack, currentClusterSize);
        
        // Total requirements including logging, infra, and master overhead
        let totalVcpuWithOverhead = totalVcpuNeeded + loggingOverhead.totalCpu + infraReqs.totalCpu;
        let totalMemoryWithOverhead = totalMemoryNeeded + loggingOverhead.totalMemory + infraReqs.totalMemory;
        
        // Add master overhead to total requirements (fixed cluster overhead)
        if (mergeMasters) {
            totalVcpuWithOverhead += masterOverhead.cpu;
            totalMemoryWithOverhead += masterOverhead.memory;
        }
        
        // Calculate new worker node requirements
        const newNodesForCpu = Math.ceil(totalVcpuWithOverhead / usableVcpuPerNode);
        const newNodesForMemory = Math.ceil(totalMemoryWithOverhead / usableMemoryPerNode);
        let newWorkerNodes = Math.max(newNodesForCpu, newNodesForMemory);
        
        // Ensure minimum nodes for merged configurations
        if (mergeMasters) {
            newWorkerNodes = Math.max(newWorkerNodes, 3);
        }
        
        if (newWorkerNodes === finalWorkerNodes) {
            break; // Converged
        }
        
        finalWorkerNodes = newWorkerNodes;
        iterations++;
    }
    
    // Final calculation of usable resources with converged values
    if (mergeMasters) {
        const finalMasterReqs = getMasterNodeRequirements(finalWorkerNodes);
        // Master overhead is fixed total cluster resources (not per node)
        // Apply CPU to vCPU ratio (hyperthreading) to convert cores to vCPUs
        masterOverhead.cpu = finalMasterReqs.count * finalMasterReqs.cpu * cpuToVcpuRatio;
        masterOverhead.memory = finalMasterReqs.count * finalMasterReqs.memory;
    }
    
    const finalAvailableVcpuPerNode = availableVcpuPerNode;
    const finalAvailableMemoryPerNode = availableMemoryPerNode;
    const finalUsableVcpuPerNode = finalAvailableVcpuPerNode * maxUtilization;
    const finalUsableMemoryPerNode = finalAvailableMemoryPerNode * maxUtilization;

    // Calculate final cluster size
    const masterNodes = mergeMasters ? 0 : 3;
    const totalClusterNodes = masterNodes + finalWorkerNodes;
    
    // Calculate subscription requirements based on worker nodes only
    const subscriptionInfo = calculateSubscriptions(selectedSubscriptionType, finalWorkerNodes, cpuCores, socketsPerNode);

    // Recalculate final infra requirements based on the converged node count
    const finalInfraReqs = getInfrastructureRequirements(selectedLoggingStack, totalClusterNodes);
    const finalLoggingOverhead = getLoggingOverhead(selectedLoggingStack, finalWorkerNodes);
    
    // Calculate total requirements with final values
    let totalVcpuWithLogging = totalVcpuNeeded + finalLoggingOverhead.totalCpu + finalInfraReqs.totalCpu;
    let totalMemoryWithLogging = totalMemoryNeeded + finalLoggingOverhead.totalMemory + finalInfraReqs.totalMemory;
    
    // Calculate actual utilization using final available resources (including master overhead)
    const actualCpuUtilization = (totalVcpuWithLogging / (finalWorkerNodes * finalAvailableVcpuPerNode)) * 100;
    const actualMemoryUtilization = (totalMemoryWithLogging / (finalWorkerNodes * finalAvailableMemoryPerNode)) * 100;

    // Growth projections
    let growthProjections = null;
    if (document.getElementById('enableGrowth').checked) {
        const annualGrowthRate = parseFloat(document.getElementById('growthRate').value);
        const projectionMonths = parseInt(document.getElementById('projectionMonths').value);
        
        growthProjections = calculateGrowthProjections(
            workloads, 
            annualGrowthRate, 
            projectionMonths, 
            finalUsableVcpuPerNode, 
            finalUsableMemoryPerNode, 
            maxUtilization,
            finalWorkerNodes
        );
    }

    // Calculate final master node requirements based on final worker count
    const finalMasterReqs = getMasterNodeRequirements(finalWorkerNodes);
    
    // Store results for export
    window.lastCalculationResults = {
        workloads,
        totalInstances,
        totalVcpuNeeded,
        totalMemoryNeeded,
        logStorage,
        cpuCores,
        cpuToVcpuRatio,
        socketsPerNode,
        totalVcpuPerNode,
        memoryPerNode,
        cpuReservation,
        memoryReservation,
        availableVcpuPerNode: finalAvailableVcpuPerNode,
        availableMemoryPerNode: finalAvailableMemoryPerNode,
        usableVcpuPerNode: finalUsableVcpuPerNode,
        usableMemoryPerNode: finalUsableMemoryPerNode,
        finalWorkerNodes,
        masterNodes,
        masterNodeRequirements: finalMasterReqs,
        infraNodes: 0,
        totalClusterNodes,
        infraReqs: finalInfraReqs,
        finalLoggingOverhead,
        actualCpuUtilization,
        actualMemoryUtilization,
        maxUtilization: maxUtilization * 100,
        totalVcpuWithLogging,
        totalMemoryWithLogging,
        mergeMasters,
        masterOverhead,
        finalInfraOverhead: { cpu: finalInfraReqs.totalCpu, memory: finalInfraReqs.totalMemory },
        growthProjections,
        subscriptionInfo
    };

    // Display results
    displayResults(window.lastCalculationResults);
}

function displayResults(calc) {
    const resultsContainer = document.getElementById('results-container');
    
    const isOverutilized = calc.actualCpuUtilization > calc.maxUtilization || calc.actualMemoryUtilization > calc.maxUtilization;
    const utilizationStatusMessage = isOverutilized ? 
        '<div class="warning"><i class="icon-warning"></i> Warning: Resource utilization exceeds target. Consider adding more nodes or using larger ones.</div>' : 
        '<div class="success"> Allocation looks good! All utilization targets are met.</div>';

    let resultsHTML = `
        <div class="result-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
            <h3><i class="icon-rocket"></i> Key Recommendations</h3>
            <div class="result-item">
                <span><span class="status-icon">#<i class="icon-warning"></i></span>Worker Nodes Required:</span>
                <span class="result-value" style="font-size: 1.5rem;">${calc.finalWorkerNodes}</span>
            </div>
             <div class="result-item">
                <span><span class="status-icon"><i class="icon-export"></i></span>Required Subscriptions:</span>
                <span class="result-value" style="font-size: 1.5rem;">${calc.subscriptionInfo.count}</span>
            </div>
            <div class="result-item">
                <span><span class="status-icon">${isOverutilized ? '<i class="icon-warning"></i>' : ''}</span>Cluster Utilization:</span>
                <span class="result-value">CPU: ${calc.actualCpuUtilization.toFixed(1)}% | Mem: ${calc.actualMemoryUtilization.toFixed(1)}%</span>
            </div>
            ${utilizationStatusMessage}
        </div>

        <div class="result-card">
            <h3><i class="icon-export"></i> Cluster Profile & Node Configuration</h3>
            <div class="result-item"><span>Total Worker Nodes:</span><span class="result-value">${calc.finalWorkerNodes}</span></div>
            <div class="result-item"><span>Total Master Nodes:</span><span class="result-value">${calc.mergeMasters ? '0 (merged)' : calc.masterNodeRequirements.count}</span></div>
            <div class="result-item"><span>Configuration:</span><span class="result-value">${calc.mergeMasters ? 'Compact Cluster' : 'Dedicated Masters'}</span></div>
            
            ${!calc.mergeMasters ? `
            <div class="breakdown-section" style="margin-top: 15px; background: rgba(74, 144, 226, 0.1); border-left: 4px solid #4a90e2;">
                <div class="breakdown-title" style="color: #4a90e2;"><i class="icon-settings"></i> Master Node Recommendations</div>
                <div class="breakdown-item"><span>Recommended Master Count:</span><span>${calc.masterNodeRequirements.count} nodes (for HA)</span></div>
                <div class="breakdown-item"><span>CPU per Master:</span><span>${calc.masterNodeRequirements.cpu} cores</span></div>
                <div class="breakdown-item"><span>Memory per Master:</span><span>${calc.masterNodeRequirements.memory} GB</span></div>
                <div class="breakdown-item" style="font-weight: bold; border-top: 1px solid #4a90e2;"><span>Total Master Resources:</span><span>${calc.masterNodeRequirements.totalCpu} cores / ${calc.masterNodeRequirements.totalMemory} GB</span></div>
                <div class="info-note" style="margin-top: 10px; font-size: 0.9em; color: #666;">
                    <i class="icon-info"></i> Master sizing based on ${calc.finalWorkerNodes} worker nodes
                    ${calc.finalWorkerNodes <= 120 ? '(up to 120 workers: 8c/32GB per master)' : 
                      calc.finalWorkerNodes <= 252 ? '(121-252 workers: 16c/32GB per master)' : 
                      '(over 252 workers: contact Red Hat for custom sizing)'}
                </div>
            </div>
            ` : `
            <div class="breakdown-section" style="margin-top: 15px; background: rgba(156, 39, 176, 0.1); border-left: 4px solid #9c27b0;">
                <div class="breakdown-title" style="color: #9c27b0;"><i class="icon-compress"></i> Compact Cluster Configuration</div>
                <div class="breakdown-item"><span>Master Services on Workers:</span><span>Yes (Total: ${calc.masterOverhead.cpu} vCPUs / ${calc.masterOverhead.memory} GB cluster-wide)</span></div>
                <div class="breakdown-item"><span>Minimum Worker Nodes:</span><span>3 (for HA master quorum)</span></div>
                <div class="info-note" style="margin-top: 10px; font-size: 0.9em; color: #666;">
                    <i class="icon-info"></i> In compact mode, master services run on worker nodes, reducing infrastructure overhead but requiring minimum 3 nodes for HA.
                </div>
            </div>
            
            <div class="breakdown-section" style="margin-top: 15px; background: rgba(156, 39, 176, 0.1); border-left: 4px solid #9c27b0;">
                <div class="breakdown-title" style="color: #9c27b0;"><i class="icon-cluster"></i> Cluster-Wide Resource Allocation</div>
                <div class="breakdown-item"><span>Total Cluster CPU Capacity</span><span>${(calc.finalWorkerNodes * calc.totalVcpuPerNode).toFixed(2)} vCPUs</span></div>
                <div class="breakdown-item"><span>Total Cluster Memory Capacity</span><span>${(calc.finalWorkerNodes * calc.memoryPerNode).toFixed(1)} GB</span></div>
                <div class="breakdown-item"><span>(-) System Reservations</span><span>-${(calc.finalWorkerNodes * calc.cpuReservation).toFixed(2)} vCPUs / -${(calc.finalWorkerNodes * calc.memoryReservation).toFixed(1)} GB</span></div>
                <div class="breakdown-item"><span>(-) Master Services (Fixed Overhead)</span><span>-${calc.masterOverhead.cpu.toFixed(2)} vCPUs / -${calc.masterOverhead.memory.toFixed(1)} GB</span></div>
                <div class="breakdown-item"><span>(-) Logging Services</span><span>-${calc.finalLoggingOverhead.totalCpu.toFixed(2)} vCPUs / -${calc.finalLoggingOverhead.totalMemory.toFixed(1)} GB</span></div>
                <div class="breakdown-item" style="border-top: 2px solid #9c27b0; font-weight: bold;"><span>(=) Available for Workloads</span><span>${((calc.finalWorkerNodes * calc.availableVcpuPerNode) - calc.masterOverhead.cpu - calc.finalLoggingOverhead.totalCpu).toFixed(2)} vCPUs / ${((calc.finalWorkerNodes * calc.availableMemoryPerNode) - calc.masterOverhead.memory - calc.finalLoggingOverhead.totalMemory).toFixed(1)} GB</span></div>
                <div class="info-note" style="margin-top: 10px; font-size: 0.9em; color: #666;">
                    <i class="icon-info"></i> Master services consume a fixed ${calc.masterOverhead.cpu} vCPU / ${calc.masterOverhead.memory} GB from total cluster resources.
                </div>
            </div>
            `}
            
            <div class="breakdown-section" style="margin-top: 20px; background: rgba(255,255,255,0.1);">
                <div class="breakdown-title" style="color: white;">Single Worker Node Profile</div>
                <div class="breakdown-item"><span>Physical Capacity</span><span>${calc.cpuCores} Cores / ${calc.memoryPerNode} GB RAM</span></div>
                <div class="breakdown-item"><span>(-) OS/System Reservation</span><span>-${calc.cpuReservation.toFixed(2)} Cores / -${calc.memoryReservation.toFixed(1)} GB RAM</span></div>
                <div class="breakdown-item"><span>(-) Logging Agent Overhead</span><span>-${calc.finalLoggingOverhead.cpuPerNode.toFixed(2)} vCPUs / -${calc.finalLoggingOverhead.memoryPerNode.toFixed(2)} GB RAM</span></div>
                <div class="breakdown-item" style="border-top: 2px solid white; font-weight: bold;"><span>(=) Available for Workloads</span><span>${calc.availableVcpuPerNode.toFixed(2)} vCPUs / ${calc.availableMemoryPerNode.toFixed(1)} GB RAM</span></div>
                <div class="breakdown-item"><span>(<i class="icon-warning"></i>) Max Utilization Target</span><span>${calc.maxUtilization}%</span></div>
                <div class="breakdown-item" style="border-top: 2px solid white; font-weight: bold; background: rgba(0,0,0,0.2);"><span>(=) Usable Capacity per Node</span><span>${calc.usableVcpuPerNode.toFixed(2)} vCPUs / ${calc.usableMemoryPerNode.toFixed(1)} GB RAM</span></div>
            </div>
        </div>

        <div class="result-card">
            <h3><i class="icon-workload"></i> Total Resource Demand</h3>
            <div class="breakdown-section" style="background: rgba(255,255,255,0.1);">
                <div class="breakdown-title" style="color: white;">Application Workloads</div>
                ${calc.workloads.map(w => `
                    <div class="breakdown-item">
                        <span>${w.name} (${w.instances} x ${w.type})</span>
                        <span>${(w.instances * w.vcpu).toFixed(1)} vCPUs / ${(w.instances * w.memory).toFixed(1)} GB</span>
                    </div>
                `).join('')}
                <div class="breakdown-item" style="border-top: 2px solid white; font-weight: bold;">
                    <span>Subtotal:</span>
                    <span>${calc.totalVcpuNeeded.toFixed(1)} vCPUs / ${calc.totalMemoryNeeded.toFixed(1)} GB</span>
                </div>
            </div>
            <div class="breakdown-section" style="margin-top: 15px; background: rgba(255,255,255,0.1);">
                <div class="breakdown-title" style="color: white;">Cluster Services Overhead</div>
                <div class="breakdown-item"><span>Logging, Monitoring, etc.</span><span>${calc.finalInfraOverhead.cpu.toFixed(1)} vCPUs / ${calc.finalInfraOverhead.memory.toFixed(1)} GB</span></div>
            </div>
             <div class="result-item" style="margin-top: 15px;">
                <span><strong>Total Required Capacity:</strong></span>
                <span class="result-value">${calc.totalVcpuWithLogging.toFixed(1)} vCPUs / ${calc.totalMemoryWithLogging.toFixed(1)} GB</span>
            </div>
        </div>

        <div class="result-card">
            <h3><i class="icon-export"></i> OpenShift Subscription Estimate</h3>
            <div class="result-item">
                <span>Subscription Model:</span>
                <span class="result-value">${calc.subscriptionInfo.type}</span>
            </div>
            <div class="result-item">
                <span>Total Billable Physical Cores (on ${calc.finalWorkerNodes} worker nodes):</span>
                <span class="result-value">${calc.subscriptionInfo.totalPhysicalCores} cores</span>
            </div>
            ${calc.subscriptionInfo.type === 'Bare-metal (Socket-based)' ? `
            <div class="result-item">
                <span>Total Billable Sockets (on ${calc.finalWorkerNodes} worker nodes):</span>
                <span class="result-value">${calc.subscriptionInfo.totalSockets} sockets</span>
            </div>
            ` : ''}
            <div class="result-item">
                <span><strong>Required Subscriptions:</strong></span>
                <span class="result-value" style="font-size: 1.5rem;">${calc.subscriptionInfo.count}</span>
            </div>
            <div class="warning" style="margin-top: 15px; padding: 10px; text-align: center; background: rgba(0,0,0,0.2);">
                <i class="icon-calculator"></i> <strong>Calculation:</strong> ${calc.subscriptionInfo.calculationMethod}
            </div>
        </div>`;

    resultsHTML += `
        <div class="storage-breakdown">
            <h3><i class="icon-storage"></i> Log Storage Requirements</h3>
            <div class="result-item">
                <span>Total Pods Generating Logs:</span>
                <span class="result-value">${calc.logStorage.totalPods}</span>
            </div>
            <div class="result-item">
                <span>Daily Raw Log Volume:</span>
                <span class="result-value">${(calc.logStorage.dailyRawLogVolumeMB / 1024).toFixed(1)} GB/day</span>
            </div>
            <div class="result-item">
                <span>Total Storage Required (incl. retention, compression):</span>
                <span class="result-value">${calc.logStorage.finalStorageRequirementGB.toFixed(1)} GB</span>
            </div>
            ${selectedLoggingStack === 'elasticsearch' ? `
            <div class="result-item">
                <span>Replication Factor:</span>
                <span class="result-value">${calc.logStorage.replicationFactor}x</span>
            </div>
            ` : ''}
        </div>
    `;


    // Growth projections
    if (calc.growthProjections) {
        const currentUtilization = Math.max(calc.actualCpuUtilization, calc.actualMemoryUtilization);
        const annualGrowthRate = parseFloat(document.getElementById('growthRate').value);
        const monthlyGrowthRate = calc.growthProjections[1] ? calc.growthProjections[1].monthlyGrowthRate : 0;
        
        resultsHTML += `
            <div class="growth-chart-container">
                <h3><i class="icon-growth"></i> Growth Projections</h3>
                <div class="result-item" style="margin-bottom: 15px;">
                    <span>Current Cluster Utilization:</span>
                    <span class="result-value">${currentUtilization.toFixed(1)}%</span>
                </div>
                <div class="result-item" style="margin-bottom: 15px;">
                    <span>Annual Growth Rate:</span>
                    <span class="result-value">${annualGrowthRate}% (${monthlyGrowthRate.toFixed(2)}% monthly)</span>
                </div>
                <canvas id="growthChart" width="400" height="200"></canvas>
            </div>
            
            <div class="growth-projections">
                <div class="projection-card">
                    <h4><i class="icon-growth"></i> Monthly Growth Analysis</h4>
        `;
        
        // Show key months
        const keyMonths = calc.growthProjections.filter((_, index) => 
            index === 0 || index === 3 || index === 6 || index === 12 || index === calc.growthProjections.length - 1
        ).slice(0, 6);
        
        keyMonths.forEach(proj => {
            resultsHTML += `
                <div class="projection-item">
                    <span>Month ${proj.month}: ${proj.maxUtilization.toFixed(1)}%</span>
                    <span>${proj.utilizationGrowth > 0 ? '+' : ''}${proj.utilizationGrowth.toFixed(1)}% growth</span>
                </div>
            `;
        });
        
        const totalGrowth = ((calc.growthProjections[calc.growthProjections.length - 1].totalInstances / calc.totalInstances - 1) * 100).toFixed(1);
        const finalUtilization = calc.growthProjections[calc.growthProjections.length - 1].maxUtilization;
        
        resultsHTML += `
                </div>
                
                <div class="projection-card">
                    <h4><i class="icon-growth"></i> Growth Summary</h4>
                    <div class="projection-item">
                        <span>Total Instance Growth:</span>
                        <span class="result-value">${totalGrowth}%</span>
                    </div>
                    <div class="projection-item">
                        <span>Final Utilization:</span>
                        <span class="result-value">${finalUtilization.toFixed(1)}%</span>
                    </div>
                    <div class="projection-item">
                        <span>Utilization Increase:</span>
                        <span>+${(finalUtilization - currentUtilization).toFixed(1)}%</span>
                    </div>
                </div>
            </div>
        `;

        // Recommendations section - only show the first critical recommendation
        const firstCriticalRecommendation = calc.growthProjections.find(proj => 
            proj.showRecommendation && (proj.recommendation.includes('URGENT') || proj.recommendation.includes('WARNING') || proj.recommendation.includes('CAUTION'))
        );

        resultsHTML += `
            <div class="recommendation-card">
                <h4><i class="icon-server"></i> Node Expansion Recommendation</h4>
        `;

        if (firstCriticalRecommendation) {
            let statusClass = '';
            if (firstCriticalRecommendation.recommendation.includes('URGENT')) statusClass = 'status-urgent';
            else if (firstCriticalRecommendation.recommendation.includes('WARNING')) statusClass = 'status-warning';
            else if (firstCriticalRecommendation.recommendation.includes('CAUTION')) statusClass = 'status-caution';
            else statusClass = 'status-ok';

            const nodesNeeded = firstCriticalRecommendation.recommendedNodesForNextMonth - firstCriticalRecommendation.workerNodesInMonth;

            resultsHTML += `
                <div class="recommendation-item">
                    <span>Month ${firstCriticalRecommendation.month}: ${firstCriticalRecommendation.maxUtilization.toFixed(1)}% utilization</span>
                    <span class="recommendation-status ${statusClass}">${firstCriticalRecommendation.recommendation}</span>
                </div>`;
            if (nodesNeeded > 0) {
                resultsHTML += `<div class="recommendation-item">
                        <span>Recommended Action:</span>
                        <span class="result-value">Add ${nodesNeeded} worker node(s)</span>
                    </div>`;
            }
            resultsHTML += `
                <div class="recommendation-item">
                    <span>Target Instances at that time:</span>
                    <span class="result-value">${firstCriticalRecommendation.totalInstances} instances</span>
                </div>
            `;
        } else {
            resultsHTML += `
                <div class="recommendation-item">
                    <span>No capacity expansion needed within projection period</span>
                    <span class="recommendation-status status-ok">OK: Current capacity sufficient</span>
                </div>
            `;
        }

        resultsHTML += '</div>';
    }

    resultsContainer.innerHTML = resultsHTML;

    // Create growth chart if projections exist
    if (calc.growthProjections) {
        setTimeout(() => {
            createGrowthChart(calc.growthProjections, calc.maxUtilization);
        }, 100);
    }

    // Show export buttons
    document.getElementById('exportBtn').style.display = 'inline-flex';
    document.getElementById('resourcesExportBtn').style.display = 'inline-flex';
}

function saveInputsToLocalStorage() {
    // Collect all sizing inputs
    const sizingInputs = {
        workloads: workloads, // 'workloads' global variable is already up-to-date
        cpuCores: document.getElementById('cpuCores').value,
        customizeSockets: document.getElementById('customizeSockets').checked,
        socketsPerNode: document.getElementById('socketsPerNode').value,
        cpuToVcpuRatio: document.getElementById('cpuToVcpuRatio').value,
        memoryPerNode: document.getElementById('memoryPerNode').value,
        maxUtilization: document.getElementById('maxUtilization').value,
        mergeMasters: document.getElementById('mergeMasters').checked,
        loggingStack: selectedLoggingStack,
        subscriptionType: selectedSubscriptionType,
        logVolumePerPod: document.getElementById('logVolumePerPod').value,
        logRetentionDays: document.getElementById('logRetentionDays').value,
        compressionRatio: document.getElementById('compressionRatio').value,
        replicationFactor: document.getElementById('replicationFactor').value,
        enableGrowth: document.getElementById('enableGrowth').checked,
        growthRate: document.getElementById('growthRate').value,
        projectionMonths: document.getElementById('projectionMonths').value,
    };

    // Collect all capacity inputs
    const capacityInputs = {
        desiredTotalCpu: document.getElementById('desiredTotalCpu').value,
        desiredTotalMemory: document.getElementById('desiredTotalMemory').value,
        capacityCpuCores: document.getElementById('capacityCpuCores').value,
        capacityMemoryPerNode: document.getElementById('capacityMemoryPerNode').value,
        capacityCustomizeSockets: document.getElementById('capacityCustomizeSockets').checked,
        capacitySocketsPerNode: document.getElementById('capacitySocketsPerNode').value,
        capacityEnableUtilizationBuffer: document.getElementById('capacityEnableUtilizationBuffer').checked,
        capacityMaxUtilization: document.getElementById('capacityMaxUtilization').value,
        capacityMergeMasters: document.getElementById('capacityMergeMasters').checked,
        capacityLoggingStack: selectedCapacityLoggingStack,
        // The subscription type is shared, but let's read it from its own context
        capacitySubscriptionType: document.querySelector('input[name="capacitySubscriptionType"]:checked').value,
    };

    const dataToSave = {
        mode: currentMode,
        sizing: sizingInputs,
        capacity: capacityInputs
    };

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave));
}

function loadInputsFromLocalStorage() {
    const savedDataJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!savedDataJSON) {
        initializeWorkloads(); // If no saved data, just start with a default workload
        return;
    }

    try {
        const savedData = JSON.parse(savedDataJSON);

        // Restore mode
        const modeSelector = document.getElementById('mode-selector');
        const modeOption = modeSelector.querySelector(`div[onclick*="'${savedData.mode}'"]`);
        if (modeOption) {
            switchMode(savedData.mode, modeOption);
        }

        // Restore Sizing Inputs
        const sizing = savedData.sizing;
        if (sizing) {
            document.getElementById('cpuCores').value = sizing.cpuCores;
            document.getElementById('customizeSockets').checked = sizing.customizeSockets;
            document.getElementById('socketsPerNode').value = sizing.socketsPerNode;
            toggleSocketInput(); // Update visibility
            document.getElementById('cpuToVcpuRatio').value = sizing.cpuToVcpuRatio;
            document.getElementById('memoryPerNode').value = sizing.memoryPerNode;
            document.getElementById('maxUtilization').value = sizing.maxUtilization;
            document.getElementById('mergeMasters').checked = sizing.mergeMasters;

            const logStackOption = document.querySelector(`div[onclick*="'${sizing.loggingStack}'"]`);
            if (logStackOption) selectLoggingStack(sizing.loggingStack, logStackOption);

            const subTypeOption = document.querySelector(`#subscription-type-selector div[onclick*="'${sizing.subscriptionType}'"]`);
            if (subTypeOption) selectSubscriptionType(sizing.subscriptionType, subTypeOption);

            document.getElementById('logVolumePerPod').value = sizing.logVolumePerPod;
            document.getElementById('logRetentionDays').value = sizing.logRetentionDays;
            document.getElementById('compressionRatio').value = sizing.compressionRatio;
            document.getElementById('replicationFactor').value = sizing.replicationFactor;

            document.getElementById('enableGrowth').checked = sizing.enableGrowth;
            toggleGrowthInputs(); // Update visibility
            document.getElementById('growthRate').value = sizing.growthRate;
            document.getElementById('projectionMonths').value = sizing.projectionMonths;

            // Restore workloads
            document.getElementById('workloads-container').innerHTML = '';
            workloadCounter = 0;
            workloads = [];
            if (sizing.workloads && sizing.workloads.length > 0) {
                sizing.workloads.forEach(workload => {
                    addWorkload(workload);
                });
                updateWorkloads(); // This will update the global 'workloads' array and check for VM subscription requirements
            } else {
                addWorkload(); // Add a default one if none were saved
            }
        }

        // Restore Capacity Inputs
        const capacity = savedData.capacity;
        if (capacity) {
            document.getElementById('desiredTotalCpu').value = capacity.desiredTotalCpu || 12;
            document.getElementById('desiredTotalMemory').value = capacity.desiredTotalMemory || 32;
            document.getElementById('capacityCpuCores').value = capacity.capacityCpuCores;
            document.getElementById('capacityMemoryPerNode').value = capacity.capacityMemoryPerNode;
            document.getElementById('capacityCustomizeSockets').checked = capacity.capacityCustomizeSockets;
            document.getElementById('capacitySocketsPerNode').value = capacity.capacitySocketsPerNode;
            toggleCapacitySocketInput(); // Update visibility

            document.getElementById('capacityEnableUtilizationBuffer').checked = capacity.capacityEnableUtilizationBuffer || false;
            document.getElementById('capacityMaxUtilization').value = capacity.capacityMaxUtilization || 80;
            toggleCapacityUtilizationBuffer(); // Update visibility
            
            document.getElementById('capacityMergeMasters').checked = capacity.capacityMergeMasters || false;

            const capLogStackOption = document.querySelector(`#capacity-logging-selector div[onclick*="'${capacity.capacityLoggingStack || 'elasticsearch'}'"]`);
            if (capLogStackOption) selectCapacityLoggingStack(capacity.capacityLoggingStack || 'elasticsearch', capLogStackOption);

            const capSubTypeOption = document.querySelector(`#capacity-subscription-type-selector div[onclick*="'${capacity.capacitySubscriptionType}'"]`);
            if (capSubTypeOption) selectSubscriptionType(capacity.capacitySubscriptionType, capSubTypeOption);
        }
    } catch (e) {
        console.error("Failed to load saved data, resetting to defaults.", e);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        initializeWorkloads();
    }
}

function switchMode(mode, element) {
    currentMode = mode;
    
    document.getElementById('sizing-calculator-inputs').style.display = (mode === 'sizing') ? 'block' : 'none';
    document.getElementById('capacity-estimator-inputs').style.display = (mode === 'capacity') ? 'block' : 'none';

    // Update UI selection
    element.parentElement.querySelectorAll('.radio-option').forEach(option => {
        option.classList.remove('selected');
    });
    element.classList.add('selected');
    element.querySelector('input[type="radio"]').checked = true;

    // Clear results
    document.getElementById('results-container').innerHTML = `
        <div class="result-card">
            <h3><i class="icon-welcome"></i> Welcome!</h3>
            <p>Configure your options and click the button to see the results.</p>
        </div>
    `;
    document.getElementById('exportBtn').style.display = 'none';
    document.getElementById('resourcesExportBtn').style.display = 'none';
    document.getElementById('capacityExportBtn').style.display = 'none';
    document.getElementById('capacityExcelBtn').style.display = 'none';
    document.getElementById('capacityTextBtn').style.display = 'none';
    saveInputsToLocalStorage();
}

function resetToDefaults() {
    if (!confirm('Are you sure you want to reset all inputs to their default values? This will clear any saved data.')) {
        return;
    }

    // Clear local storage
    localStorage.removeItem(LOCAL_STORAGE_KEY);

    // Reset Sizing Inputs
    document.getElementById('cpuCores').value = 8;
    document.getElementById('customizeSockets').checked = false;
    document.getElementById('socketsPerNode').value = 2;
    toggleSocketInput();
    document.getElementById('cpuToVcpuRatio').value = 2;
    document.getElementById('memoryPerNode').value = 32;
    document.getElementById('maxUtilization').value = 80;
    document.getElementById('mergeMasters').checked = false;

    selectLoggingStack('elasticsearch', document.querySelector('div[onclick*="\'elasticsearch\'"]'));
    selectSubscriptionType('core', document.querySelector('#subscription-type-selector div[onclick*="\'core\'"]'));

    document.getElementById('logVolumePerPod').value = 100;
    document.getElementById('logRetentionDays').value = 30;
    document.getElementById('compressionRatio').value = 3;
    document.getElementById('replicationFactor').value = 1;

    document.getElementById('enableGrowth').checked = false;
    toggleGrowthInputs();
    document.getElementById('growthRate').value = 50;
    document.getElementById('projectionMonths').value = 12;

    // Reset workloads
    document.getElementById('workloads-container').innerHTML = '';
    workloadCounter = 0;
    workloads = [];
    addWorkload();

    // Reset Capacity Inputs
    document.getElementById('desiredTotalCpu').value = 12;
    document.getElementById('desiredTotalMemory').value = 32;
    document.getElementById('capacityCpuCores').value = 8;
    document.getElementById('capacityMemoryPerNode').value = 32;
    document.getElementById('capacityCustomizeSockets').checked = false;
    document.getElementById('capacitySocketsPerNode').value = 2;
    toggleCapacitySocketInput();
    document.getElementById('capacityEnableUtilizationBuffer').checked = false;
    document.getElementById('capacityMaxUtilization').value = 80;
    toggleCapacityUtilizationBuffer();
    selectCapacityLoggingStack('elasticsearch', document.querySelector('#capacity-logging-selector div[onclick*="\'elasticsearch\'"]'));
    selectSubscriptionType('core', document.querySelector('#capacity-subscription-type-selector div[onclick*="\'core\'"]'));

    // Reset results
    document.getElementById('results-container').innerHTML = `
        <div class="result-card">
            <h3><i class="icon-welcome"></i> Welcome!</h3>
            <p>Inputs have been reset to default values.</p>
        </div>
    `;
    document.getElementById('exportBtn').style.display = 'none';

    alert('All inputs have been reset to their default values.');
}

function calculateWorkerNodesNeeded(desiredTotalCpu, desiredTotalMemory, cpuPerNode, memoryPerNode, maxUtilization = 0.80, loggingStack = 'elasticsearch') {
    // Constants for calculations
    const cpuToVcpuRatio = 2; // Assuming hyperthreading
    
    // Per-node calculations
    const totalVcpuPerNode = cpuPerNode * cpuToVcpuRatio;
    const cpuReservation = calculateCpuReservation(cpuPerNode);
    const memoryReservation = calculateMemoryReservation(memoryPerNode);
    
    const availableVcpuPerNode = totalVcpuPerNode - cpuReservation;
    const availableMemoryPerNode = memoryPerNode - memoryReservation;
    
    // Calculate usable resources considering max utilization
    const usableVcpuPerNode = availableVcpuPerNode * maxUtilization;
    const usableMemoryPerNode = availableMemoryPerNode * maxUtilization;
    
    // Calculate base worker nodes needed (before logging overhead)
    const nodesForCpu = Math.ceil(desiredTotalCpu / usableVcpuPerNode);
    const nodesForMemory = Math.ceil(desiredTotalMemory / usableMemoryPerNode);
    let baseWorkerNodes = Math.max(nodesForCpu, nodesForMemory, 3); // Minimum 3 nodes
    
    // Account for logging overhead and recalculate iteratively
    let finalWorkerNodes = baseWorkerNodes;
    let iterations = 0;
    const maxIterations = 10;
    
    while (iterations < maxIterations) {
        const loggingOverhead = getLoggingOverhead(loggingStack, finalWorkerNodes);
        
        // Calculate infra requirements based on current estimated cluster size
        const currentClusterSize = 3 + finalWorkerNodes; // 3 masters + workers
        const infraReqs = getInfrastructureRequirements(loggingStack, currentClusterSize);
        
        // Total requirements including logging and infra overhead
        let totalVcpuWithLogging = desiredTotalCpu + loggingOverhead.totalCpu + infraReqs.totalCpu;
        let totalMemoryWithLogging = desiredTotalMemory + loggingOverhead.totalMemory + infraReqs.totalMemory;
        
        // Calculate new worker node requirements
        const newNodesForCpu = Math.ceil(totalVcpuWithLogging / usableVcpuPerNode);
        const newNodesForMemory = Math.ceil(totalMemoryWithLogging / usableMemoryPerNode);
        let newWorkerNodes = Math.max(newNodesForCpu, newNodesForMemory, 3);
        
        if (newWorkerNodes === finalWorkerNodes) {
            break; // Converged
        }
        
        finalWorkerNodes = newWorkerNodes;
        iterations++;
    }
    
    return finalWorkerNodes;
}

function calculateCapacity() {
    // Get desired resource requirements
    const desiredTotalCpu = parseInt(document.getElementById('desiredTotalCpu').value) || 0;
    const desiredTotalMemory = parseInt(document.getElementById('desiredTotalMemory').value) || 0;
    
    // Get node specifications
    const cpuPerNode = parseInt(document.getElementById('capacityCpuCores').value) || 0;
    const memoryPerNode = parseInt(document.getElementById('capacityMemoryPerNode').value) || 0;

    if (desiredTotalCpu <= 0 || desiredTotalMemory <= 0 || cpuPerNode <= 0 || memoryPerNode <= 0) {
        alert('Please enter valid, positive numbers for all specifications.');
        return;
    }

    // Get configuration options
    const enableUtilizationBuffer = document.getElementById('capacityEnableUtilizationBuffer').checked;
    const maxUtilization = enableUtilizationBuffer ? 
        (parseInt(document.getElementById('capacityMaxUtilization').value) / 100) : 1.0;
    const loggingStack = selectedCapacityLoggingStack;
    const mergeMasters = document.getElementById('capacityMergeMasters').checked;

    // Calculate worker nodes needed
    const workerNodesNeeded = calculateWorkerNodesNeeded(
        desiredTotalCpu, 
        desiredTotalMemory, 
        cpuPerNode, 
        memoryPerNode, 
        maxUtilization, 
        loggingStack
    );
    
    // Get subscription inputs
    const socketsPerNode = parseInt(document.getElementById('capacitySocketsPerNode').value) || 2;
    const subscriptionInfo = calculateSubscriptions(selectedSubscriptionType, workerNodesNeeded, cpuPerNode, socketsPerNode);

    const containerPreset = WORKLOAD_PRESETS.container;
    const vmPreset = WORKLOAD_PRESETS.vm;

    // --- Calculate Actual Usable Resources for the calculated cluster ---
    const cpuToVcpuRatio = 2; // Assuming hyperthreading

    // Per-node calculations
    const totalVcpuPerNode = cpuPerNode * cpuToVcpuRatio;
    const cpuReservation = calculateCpuReservation(cpuPerNode);
    const memoryReservation = calculateMemoryReservation(memoryPerNode);
    
    let availableVcpuPerNode = totalVcpuPerNode - cpuReservation;
    let availableMemoryPerNode = memoryPerNode - memoryReservation;

    // Account for master overhead in compact cluster mode
    let masterOverhead = { cpu: 0, memory: 0 };
    if (mergeMasters) {
        const masterReqs = getMasterNodeRequirements(workerNodesNeeded);
        // In compact mode, master services consume a fixed amount of cluster resources
        // This is the total resources that would be needed for 3 dedicated masters
        // Apply CPU to vCPU ratio (hyperthreading) to convert cores to vCPUs
        masterOverhead.cpu = masterReqs.count * masterReqs.cpu * cpuToVcpuRatio; // Total vCPUs needed for all masters
        masterOverhead.memory = masterReqs.count * masterReqs.memory; // Total memory needed for all masters
    }

    // Total cluster resources available on workers (before master overhead)
    let totalAvailableVcpu = workerNodesNeeded * availableVcpuPerNode;
    let totalAvailableMemory = workerNodesNeeded * availableMemoryPerNode;
    
    // Subtract master overhead from total cluster resources (not per node)
    if (mergeMasters) {
        totalAvailableVcpu -= masterOverhead.cpu;
        totalAvailableMemory -= masterOverhead.memory;
    }

    // Calculate infrastructure overhead (services that run on infra nodes)
    const masterNodes = mergeMasters ? 0 : 3;
    const currentClusterSize = masterNodes + workerNodesNeeded;
    const infraReqs = getInfrastructureRequirements(loggingStack, currentClusterSize);

    // Subtract logging per-node overhead from worker nodes
    const loggingOverhead = getLoggingOverhead(loggingStack, workerNodesNeeded);
    totalAvailableVcpu -= loggingOverhead.totalCpu;
    totalAvailableMemory -= loggingOverhead.totalMemory;

    // Apply max utilization to get the final usable pool for workloads
    const usableVcpu = totalAvailableVcpu * maxUtilization;
    const usableMemory = totalAvailableMemory * maxUtilization;

    // Calculate overhead breakdown for display
    const overheadBreakdown = {
        totalPhysicalCores: workerNodesNeeded * cpuPerNode,
        totalPhysicalMemory: workerNodesNeeded * memoryPerNode,
        totalVcpu: workerNodesNeeded * totalVcpuPerNode,
        systemReservation: {
            cpu: workerNodesNeeded * cpuReservation,
            memory: workerNodesNeeded * memoryReservation
        },
        masterOverhead: {
            cpu: mergeMasters ? masterOverhead.cpu : 0,
            memory: mergeMasters ? masterOverhead.memory : 0
        },
        loggingOverhead: {
            cpu: loggingOverhead.totalCpu,
            memory: loggingOverhead.totalMemory
        },
        infraOverhead: {
            cpu: infraReqs.totalCpu,
            memory: infraReqs.totalMemory
        },
        utilizationBuffer: enableUtilizationBuffer ? {
            cpu: totalAvailableVcpu * (1 - maxUtilization),
            memory: totalAvailableMemory * (1 - maxUtilization)
        } : { cpu: 0, memory: 0 },
        totalOverhead: {
            cpu: (workerNodesNeeded * totalVcpuPerNode) - usableVcpu,
            memory: (workerNodesNeeded * memoryPerNode) - usableMemory
        },
        availableAfterSystemReservation: {
            cpu: workerNodesNeeded * (totalVcpuPerNode - cpuReservation),
            memory: workerNodesNeeded * (memoryPerNode - memoryReservation)
        },
        availableAfterMasterOverhead: {
            cpu: totalAvailableVcpu,
            memory: totalAvailableMemory
        },
        availableAfterLogging: {
            cpu: totalAvailableVcpu,
            memory: totalAvailableMemory
        },
        enableUtilizationBuffer,
        maxUtilization: maxUtilization * 100
    };

    // --- Calculate Capacity ---
    const containerCapacityByCpu = Math.floor(usableVcpu / containerPreset.vcpu);
    const containerCapacityByMem = Math.floor(usableMemory / containerPreset.memory);
    const containerCapacity = Math.min(containerCapacityByCpu, containerCapacityByMem);

    const vmCapacityByCpu = Math.floor(usableVcpu / vmPreset.vcpu);
    const vmCapacityByMem = Math.floor(usableMemory / vmPreset.memory);
    const vmCapacity = Math.min(vmCapacityByCpu, vmCapacityByMem);

    // Calculate master node requirements
    const masterNodeRequirements = getMasterNodeRequirements(workerNodesNeeded);

    const results = {
        desiredTotalCpu,
        desiredTotalMemory,
        cpuPerNode,
        memoryPerNode,
        workerNodesNeeded,
        masterNodes,
        masterNodeRequirements,
        mergeMasters,
        usableVcpu,
        usableMemory,
        overheadBreakdown,
        loggingStack,
        containerPreset,
        containerCapacity,
        containerLimitingFactor: containerCapacityByCpu < containerCapacityByMem ? 'vCPU' : 'Memory',
        vmPreset,
        vmCapacity,
        vmLimitingFactor: vmCapacityByCpu < vmCapacityByMem ? 'vCPU' : 'Memory',
        subscriptionInfo
    };

    // Store results for export
    window.lastCapacityResults = results;
    
    displayCapacityResults(results);
}

function displayCapacityResults(results) {
    const resultsContainer = document.getElementById('results-container');

    const resultsHTML = `
        <div class="result-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
            <h3><i class="icon-calculate"></i> Worker Nodes Calculation</h3>
            <div class="result-item">
                <span><span class="status-icon"><i class="icon-server"></i></span>Required Worker Nodes:</span>
                <span class="result-value" style="font-size: 1.5rem;">${results.workerNodesNeeded}</span>
            </div>
            <div class="result-item">
                <span>Your Requirements:</span>
                <span class="result-value">${results.desiredTotalCpu} CPUs / ${results.desiredTotalMemory} GB RAM</span>
            </div>
            <div class="result-item">
                <span>Each Node Specs:</span>
                <span class="result-value">${results.cpuPerNode} Cores / ${results.memoryPerNode} GB RAM</span>
            </div>
            <div class="result-item">
                <span>Logging Stack:</span>
                <span class="result-value">${results.loggingStack === 'elasticsearch' ? 'Elasticsearch' : 'LokiStack'}</span>
            </div>
            <div class="result-item">
                <span>Final Usable Resources (for workloads):</span>
                <span class="result-value">${results.usableVcpu.toFixed(1)} vCPUs / ${results.usableMemory.toFixed(1)} GB</span>
            </div>
        </div>

        <div class="result-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <h3><i class="icon-settings"></i> Cluster Configuration</h3>
            <div class="result-item">
                <span>Configuration Type:</span>
                <span class="result-value">${results.mergeMasters ? 'Compact Cluster' : 'Dedicated Masters'}</span>
            </div>
            
            ${!results.mergeMasters ? `
            <div class="breakdown-section" style="margin-top: 15px; background: rgba(255,255,255,0.1);">
                <div class="breakdown-title" style="color: white;"><i class="icon-server"></i> Master Node Recommendations</div>
                <div class="breakdown-item"><span>Required Master Count:</span><span>${results.masterNodeRequirements.count} nodes (for HA)</span></div>
                <div class="breakdown-item"><span>CPU per Master:</span><span>${results.masterNodeRequirements.cpu} cores</span></div>
                <div class="breakdown-item"><span>Memory per Master:</span><span>${results.masterNodeRequirements.memory} GB</span></div>
                <div class="breakdown-item" style="font-weight: bold; border-top: 1px solid white;"><span>Total Master Resources:</span><span>${results.masterNodeRequirements.totalCpu} cores / ${results.masterNodeRequirements.totalMemory} GB</span></div>
                <div class="info-note" style="margin-top: 10px; font-size: 0.9em; opacity: 0.8;">
                    Master sizing based on ${results.workerNodesNeeded} worker nodes
                    ${results.workerNodesNeeded <= 120 ? '(up to 120 workers: 8c/32GB per master)' : 
                      results.workerNodesNeeded <= 252 ? '(121-252 workers: 16c/32GB per master)' : 
                      '(over 252 workers: contact Red Hat for custom sizing)'}
                </div>
            </div>
            ` : `
            <div class="breakdown-section" style="margin-top: 15px; background: rgba(255,255,255,0.1);">
                <div class="breakdown-title" style="color: white;"><i class="icon-compress"></i> Compact Cluster Details</div>
                <div class="breakdown-item"><span>Master Services on Workers:</span><span>Yes</span></div>
                <div class="breakdown-item"><span>Total Master Overhead:</span><span>${results.overheadBreakdown.masterOverhead.cpu} vCPUs / ${results.overheadBreakdown.masterOverhead.memory} GB (cluster-wide)</span></div>
                <div class="breakdown-item"><span>Minimum Worker Count:</span><span>3 (for HA master quorum)</span></div>
                <div class="info-note" style="margin-top: 10px; font-size: 0.9em; opacity: 0.8;">
                    In compact mode, master services consume a fixed ${results.overheadBreakdown.masterOverhead.cpu} vCPU / ${results.overheadBreakdown.masterOverhead.memory} GB from total cluster resources.
                </div>
            </div>
            `}
        </div>

        <div class="result-card" style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);">
            <h3><i class="icon-advanced"></i> Resource Overhead Breakdown</h3>
            <div class="overhead-summary">
                <div class="result-item">
                    <span><strong>🖥️ Total Physical Resources:</strong></span>
                    <span class="result-value">${results.overheadBreakdown.totalPhysicalCores} Cores / ${results.overheadBreakdown.totalPhysicalMemory} GB</span>
                </div>
                <div class="result-item">
                    <span><strong>⚡ Total vCPU (with hyperthreading):</strong></span>
                    <span class="result-value">${results.overheadBreakdown.totalVcpu} vCPUs</span>
                </div>
            </div>
            
            <div class="resource-flow" style="margin-top: 20px;">
                <div class="flow-step" style="margin: 10px 0; padding: 12px; background: rgba(255,255,255,0.2); border-radius: 8px; border-left: 4px solid #3498db;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 600;">📦 Raw Physical Resources</span>
                        <span style="font-weight: bold; color: #2c3e50;">${results.overheadBreakdown.totalVcpu} vCPUs / ${results.overheadBreakdown.totalPhysicalMemory} GB</span>
                    </div>
                </div>
                
                <div class="flow-step" style="margin: 10px 0; padding: 12px; background: rgba(255,255,255,0.2); border-radius: 8px; border-left: 4px solid #e74c3c;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-weight: 600;">➖ System Reservations (kubelet, OS)</span>
                        <span style="color: #e74c3c; font-weight: bold;">-${results.overheadBreakdown.systemReservation.cpu.toFixed(1)} vCPUs / -${results.overheadBreakdown.systemReservation.memory.toFixed(1)} GB</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.9em; color: #555;">
                        <span>Available after system reservations:</span>
                        <span style="font-weight: bold;">${results.overheadBreakdown.availableAfterSystemReservation.cpu.toFixed(1)} vCPUs / ${results.overheadBreakdown.availableAfterSystemReservation.memory.toFixed(1)} GB</span>
                    </div>
                </div>
                
                ${results.mergeMasters && results.overheadBreakdown.masterOverhead.cpu > 0 ? `
                <div class="flow-step" style="margin: 10px 0; padding: 12px; background: rgba(255,255,255,0.2); border-radius: 8px; border-left: 4px solid #9c27b0;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-weight: 600;">➖ Master Services Overhead (compact cluster)</span>
                        <span style="color: #9c27b0; font-weight: bold;">-${results.overheadBreakdown.masterOverhead.cpu.toFixed(1)} vCPUs / -${results.overheadBreakdown.masterOverhead.memory.toFixed(1)} GB</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.9em; color: #555;">
                        <span>Available after master overhead:</span>
                        <span style="font-weight: bold;">${results.overheadBreakdown.availableAfterMasterOverhead.cpu.toFixed(1)} vCPUs / ${results.overheadBreakdown.availableAfterMasterOverhead.memory.toFixed(1)} GB</span>
                    </div>
                </div>
                ` : ''}
                
                <div class="flow-step" style="margin: 10px 0; padding: 12px; background: rgba(255,255,255,0.2); border-radius: 8px; border-left: 4px solid #e67e22;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-weight: 600;">➖ Logging Agents (per-node overhead)</span>
                        <span style="color: #e67e22; font-weight: bold;">-${results.overheadBreakdown.loggingOverhead.cpu.toFixed(1)} vCPUs / -${results.overheadBreakdown.loggingOverhead.memory.toFixed(1)} GB</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.9em; color: #555;">
                        <span>Available after logging overhead:</span>
                        <span style="font-weight: bold;">${results.overheadBreakdown.availableAfterLogging.cpu.toFixed(1)} vCPUs / ${results.overheadBreakdown.availableAfterLogging.memory.toFixed(1)} GB</span>
                    </div>
                </div>

                <div class="flow-step" style="margin: 10px 0; padding: 12px; background: rgba(255,255,255,0.2); border-radius: 8px; border-left: 4px solid #9b59b6;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <span style="font-weight: 600;">🏗️ Cluster Services (runs on infra nodes)</span>
                        <span style="color: #9b59b6; font-weight: bold;">-${results.overheadBreakdown.infraOverhead.cpu.toFixed(1)} vCPUs / -${results.overheadBreakdown.infraOverhead.memory.toFixed(1)} GB</span>
                    </div>
                    <div style="font-size: 0.85em; color: #666; margin-top: 5px;">
                        <em>Note: These services typically run on dedicated infrastructure nodes, not worker nodes. This shows the total cluster resource requirement.</em>
                    </div>
                </div>

                ${results.overheadBreakdown.enableUtilizationBuffer ? `
                <div class="flow-step" style="margin: 10px 0; padding: 12px; background: rgba(255,255,255,0.2); border-radius: 8px; border-left: 4px solid #f39c12;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 600;">➖ Utilization Buffer (${(100 - results.overheadBreakdown.maxUtilization).toFixed(0)}% safety margin)</span>
                        <span style="color: #f39c12; font-weight: bold;">-${results.overheadBreakdown.utilizationBuffer.cpu.toFixed(1)} vCPUs / -${results.overheadBreakdown.utilizationBuffer.memory.toFixed(1)} GB</span>
                    </div>
                </div>
                ` : `
                <div class="flow-step" style="margin: 10px 0; padding: 12px; background: rgba(255,255,255,0.2); border-radius: 8px; border-left: 4px solid #27ae60;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="font-weight: 600;">✅ No Utilization Buffer</span>
                        <span style="color: #27ae60; font-weight: bold;">100% utilization allowed</span>
                    </div>
                </div>
                `}
                
                <div class="flow-step" style="margin: 15px 0; padding: 15px; background: linear-gradient(135deg, #27ae60, #2ecc71); border-radius: 8px; color: white;">
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 1.1em;">
                        <span style="font-weight: bold;">🎯 Final Usable Resources (for your workloads)</span>
                        <span style="font-weight: bold; font-size: 1.2em;">${results.usableVcpu.toFixed(1)} vCPUs / ${results.usableMemory.toFixed(1)} GB</span>
                    </div>
                </div>
            </div>
            
            <div class="overhead-summary-stats" style="margin-top: 20px; padding: 15px; background: rgba(0,0,0,0.1); border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                    <span><strong>📊 Total Overhead:</strong></span>
                    <span style="color: #e74c3c; font-weight: bold;">${results.overheadBreakdown.totalOverhead.cpu.toFixed(1)} vCPUs / ${results.overheadBreakdown.totalOverhead.memory.toFixed(1)} GB</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 8px 0;">
                    <span><strong>📈 Efficiency:</strong></span>
                    <span style="color: #27ae60; font-weight: bold;">
                        ${((results.usableVcpu / results.overheadBreakdown.totalVcpu) * 100).toFixed(1)}% CPU / 
                        ${((results.usableMemory / results.overheadBreakdown.totalPhysicalMemory) * 100).toFixed(1)}% Memory
                    </span>
                </div>
            </div>
            
            <div class="warning" style="margin-top: 15px; padding: 10px; text-align: center; background: rgba(52, 152, 219, 0.2); border-radius: 5px;">
                <i class="icon-chart"></i> <strong>💡 Understanding Resource Flow:</strong><br>
                This breakdown shows how your physical hardware resources are allocated step-by-step, from raw capacity down to what's actually available for your applications.
            </div>
        </div>

        <div class="result-card">
            <h3><i class="icon-workload"></i> Estimated Container Capacity</h3>
            <div class="result-item">
                <span>Assumed Container Size:</span>
                <span class="result-value">${results.containerPreset.vcpu} vCPU / ${results.containerPreset.memory} GB RAM</span>
            </div>
            <div class="result-item">
                <span><strong>Estimated Containers:</strong></span>
                <span class="result-value" style="font-size: 1.5rem;">~ ${results.containerCapacity}</span>
            </div>
            <div class="result-item">
                <span>Limiting Resource:</span>
                <span class="result-value">${results.containerLimitingFactor}</span>
            </div>
        </div>

        ${results.subscriptionInfo.type === 'Bare-metal (Socket-based)' ? `
            <div class="result-card">
                <h3><i class="icon-server"></i> Estimated VM Capacity (OpenShift Virtualization)</h3>
                <div class="result-item">
                    <span>Assumed VM Size:</span>
                    <span class="result-value">${results.vmPreset.vcpu} vCPU / ${results.vmPreset.memory} GB RAM</span>
                </div>
                <div class="result-item">
                    <span><strong>Estimated VMs:</strong></span>
                    <span class="result-value" style="font-size: 1.5rem;">~ ${results.vmCapacity}</span>
                </div>
                <div class="result-item">
                    <span>Limiting Resource:</span>
                    <span class="result-value">${results.vmLimitingFactor}</span>
                </div>
            </div>
        ` : `<div class="warning"><i class="icon-advanced"></i> <strong>VM Estimation Not Available:</strong> OpenShift Virtualization requires a socket-based subscription. Please select "Bare-metal (Socket-based)" to estimate VM capacity.</div>`}

        <div class="result-card">
            <h3><i class="icon-export"></i> OpenShift Subscription Estimate</h3>
            <div class="result-item">
                <span>Subscription Model:</span>
                <span class="result-value">${results.subscriptionInfo.type}</span>
            </div>
            <div class="result-item">
                <span>Total Billable Physical Cores (on ${results.workerNodesNeeded} worker nodes):</span>
                <span class="result-value">${results.subscriptionInfo.totalPhysicalCores} cores</span>
            </div>
            ${results.subscriptionInfo.type === 'Bare-metal (Socket-based)' ? `
            <div class="result-item">
                <span>Total Billable Sockets (on ${results.workerNodesNeeded} worker nodes):</span>
                <span class="result-value">${results.subscriptionInfo.totalSockets} sockets</span>
            </div>
            ` : ''}
            <div class="result-item">
                <span><strong>Required Subscriptions:</strong></span>
                <span class="result-value" style="font-size: 1.5rem;">${results.subscriptionInfo.count}</span>
            </div>
            <div class="warning" style="margin-top: 15px; padding: 10px; text-align: center; background: rgba(0,0,0,0.2);">
                <i class="icon-chart"></i> <strong>Calculation:</strong> ${results.subscriptionInfo.calculationMethod}
            </div>
        </div>

        <div class="warning">
            <i class="icon-chart"></i> <strong>Note:</strong> These are estimates based on a standard OpenShift deployment with dedicated master/infra nodes and typical overhead. Infrastructure services are assumed to run on dedicated infra nodes separate from worker nodes.
        </div>
    `;

    resultsContainer.innerHTML = resultsHTML;
    document.getElementById('capacityExportBtn').style.display = 'inline-flex';
    document.getElementById('capacityExcelBtn').style.display = 'inline-flex';
    document.getElementById('capacityTextBtn').style.display = 'inline-flex';
}

function exportCapacityDiagram() {
    if (!window.lastCapacityResults) {
        alert('Please calculate capacity first before generating diagram');
        return;
    }

    const results = window.lastCapacityResults;
    
    // Create a visual diagram using Canvas
    createVisualDiagram(results);
}

function createVisualDiagram(results) {
    // Create a modal to display the diagram
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.8); z-index: 1000; display: flex; 
        align-items: center; justify-content: center; padding: 20px;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: white; border-radius: 10px; padding: 20px; 
        max-width: 90%; max-height: 90%; overflow: auto;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    `;
    
    const header = document.createElement('div');
    header.style.cssText = `
        display: flex; justify-content: space-between; align-items: center; 
        margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px;
    `;
    header.innerHTML = `
        <h2 style="margin: 0; color: #333;">OpenShift Cluster Architecture Diagram</h2>
        <div>
            <button id="downloadDiagram" style="
                background: #007bff; color: white; border: none; padding: 8px 16px; 
                border-radius: 5px; margin-right: 10px; cursor: pointer;
            ">Download Image</button>
            <button id="closeDiagram" style="
                background: #6c757d; color: white; border: none; padding: 8px 16px; 
                border-radius: 5px; cursor: pointer;
            ">Close</button>
        </div>
    `;
    
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    canvas.style.cssText = `border: 1px solid #ddd; border-radius: 5px;`;
    
    content.appendChild(header);
    content.appendChild(canvas);
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Draw the diagram
    drawClusterArchitectureDiagram(canvas, results);
    
    // Event handlers
    document.getElementById('closeDiagram').onclick = () => {
        document.body.removeChild(modal);
    };
    
    document.getElementById('downloadDiagram').onclick = () => {
        const link = document.createElement('a');
        link.download = `OpenShift_Cluster_Architecture_${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL();
        link.click();
    };
    
    modal.onclick = (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    };
}

function drawClusterArchitectureDiagram(canvas, results) {
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.fillStyle = '#f0f8ff';
    ctx.fillRect(0, 0, width, height);
    
    // Define colors
    const colors = {
        master: '#3498db',
        worker: '#2ecc71',
        infra: '#e74c3c',
        compact: '#9b59b6',
        text: '#2c3e50',
        connection: '#95a5a6',
        background: '#ecf0f1'
    };
    
    // Helper function to draw rounded rectangle
    function roundRect(x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
    
    // Helper function to draw node
    function drawNode(x, y, width, height, title, specs, color, icon) {
        // Node background
        ctx.fillStyle = color;
        ctx.strokeStyle = '#34495e';
        ctx.lineWidth = 2;
        roundRect(x, y, width, height, 10);
        ctx.fill();
        ctx.stroke();
        
        // Node icon and title
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(icon + ' ' + title, x + width/2, y + 20);
        
        // Node specs
        ctx.font = '11px Arial';
        ctx.fillText(specs, x + width/2, y + 35);
        
        // CPU/Memory details
        ctx.font = '10px Arial';
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        
        return { x, y, width, height };
    }
    
    // Helper function to draw connection
    function drawConnection(fromX, fromY, toX, toY, label = '') {
        ctx.strokeStyle = colors.connection;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        if (label) {
            ctx.fillStyle = colors.text;
            ctx.font = '9px Arial';
            ctx.textAlign = 'center';
            const midX = (fromX + toX) / 2;
            const midY = (fromY + toY) / 2;
            ctx.fillText(label, midX, midY);
        }
    }
    
    // Title
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('OpenShift Cluster Architecture', width/2, 30);
    
    // Cluster type
    const clusterType = results.mergeMasters ? 'Compact Cluster' : 'Standard Cluster';
    ctx.font = '16px Arial';
    ctx.fillText(`${clusterType} - ${results.workerNodesNeeded} Worker Nodes`, width/2, 55);
    
    // Layout parameters
    const nodeWidth = 120;
    const nodeHeight = 80;
    const spacing = 40;
    const startY = 100;
    
    if (results.mergeMasters) {
        // Compact cluster layout
        ctx.fillStyle = colors.text;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Compact Cluster Configuration:', 50, startY);
        ctx.font = '12px Arial';
        ctx.fillText('Master services run on worker nodes (minimum 3 for HA)', 50, startY + 20);
        
        // Draw worker nodes (which also act as masters)
        let nodeY = startY + 50;
        let nodeX = 50;
        const nodesPerRow = Math.min(Math.floor((width - 100) / (nodeWidth + spacing)), 6);
        
        for (let i = 0; i < results.workerNodesNeeded; i++) {
            if (i > 0 && i % nodesPerRow === 0) {
                nodeY += nodeHeight + spacing;
                nodeX = 50;
            }
            
            const isMaster = i < 3; // First 3 nodes are masters in compact mode
            const nodeColor = isMaster ? colors.compact : colors.worker;
            const nodeTitle = isMaster ? `Master+Worker ${i + 1}` : `Worker ${i + 1}`;
            const nodeSpecs = `${results.cpuPerNode}c / ${results.memoryPerNode}GB`;
            
            drawNode(nodeX, nodeY, nodeWidth, nodeHeight, nodeTitle, nodeSpecs, nodeColor, isMaster ? '👑' : '⚙️');
            
            // Draw master services indicator on first 3 nodes
            if (isMaster) {
                ctx.fillStyle = 'rgba(255,255,255,0.8)';
                ctx.font = '8px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('Master Services', nodeX + nodeWidth/2, nodeY + nodeHeight - 5);
            }
            
            nodeX += nodeWidth + spacing;
        }
        
        // Master node recommendations box
        const masterReqY = nodeY + nodeHeight + 40;
        ctx.fillStyle = colors.background;
        ctx.strokeStyle = colors.compact;
        ctx.lineWidth = 2;
        roundRect(50, masterReqY, 400, 100, 10);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = colors.text;
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Compact Cluster Master Requirements:', 70, masterReqY + 20);
        ctx.font = '11px Arial';
        ctx.fillText(`• Resource overhead per node: ${results.masterNodeRequirements.cpu} cores / ${results.masterNodeRequirements.memory} GB`, 70, masterReqY + 40);
        ctx.fillText(`• Minimum 3 nodes required for master HA quorum`, 70, masterReqY + 55);
        ctx.fillText(`• Master services share resources with workloads`, 70, masterReqY + 70);
        
    } else {
        // Standard cluster layout
        
        // Master nodes section
        ctx.fillStyle = colors.text;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Control Plane (Master Nodes):', 50, startY);
        
        let masterY = startY + 30;
        for (let i = 0; i < 3; i++) {
            const masterX = 50 + (i * (nodeWidth + spacing));
            const masterSpecs = `${results.masterNodeRequirements.cpu}c / ${results.masterNodeRequirements.memory}GB`;
            drawNode(masterX, masterY, nodeWidth, nodeHeight, `Master ${i + 1}`, masterSpecs, colors.master, '👑');
        }
        
        // Master specifications box
        const masterSpecY = masterY + nodeHeight + 20;
        ctx.fillStyle = colors.background;
        ctx.strokeStyle = colors.master;
        ctx.lineWidth = 2;
        roundRect(50, masterSpecY, 400, 120, 10);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = colors.text;
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Master Node Recommendations:', 70, masterSpecY + 20);
        ctx.font = '11px Arial';
        ctx.fillText(`• Count: ${results.masterNodeRequirements.count} nodes (for HA)`, 70, masterSpecY + 40);
        ctx.fillText(`• CPU: ${results.masterNodeRequirements.cpu} cores per master`, 70, masterSpecY + 55);
        ctx.fillText(`• Memory: ${results.masterNodeRequirements.memory} GB per master`, 70, masterSpecY + 70);
        ctx.fillText(`• Total Resources: ${results.masterNodeRequirements.totalCpu} cores / ${results.masterNodeRequirements.totalMemory} GB`, 70, masterSpecY + 85);
        ctx.fillText(`• Sizing for ${results.workerNodesNeeded} worker nodes ${results.workerNodesNeeded <= 120 ? '(up to 120)' : '(over 120)'}`, 70, masterSpecY + 100);
        
        // Worker nodes section
        const workerSectionY = masterSpecY + 140;
        ctx.fillStyle = colors.text;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Worker Nodes (${results.workerNodesNeeded} nodes):`, 50, workerSectionY);
        
        let workerY = workerSectionY + 30;
        let workerX = 50;
        const workerNodesPerRow = Math.min(Math.floor((width - 100) / (nodeWidth + spacing)), 8);
        
        for (let i = 0; i < Math.min(results.workerNodesNeeded, 12); i++) { // Show max 12 nodes
            if (i > 0 && i % workerNodesPerRow === 0) {
                workerY += nodeHeight + spacing;
                workerX = 50;
            }
            
            const workerSpecs = `${results.cpuPerNode}c / ${results.memoryPerNode}GB`;
            drawNode(workerX, workerY, nodeWidth, nodeHeight, `Worker ${i + 1}`, workerSpecs, colors.worker, '⚙️');
            
            workerX += nodeWidth + spacing;
        }
        
        // Show "..." if there are more nodes
        if (results.workerNodesNeeded > 12) {
            ctx.fillStyle = colors.text;
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`... and ${results.workerNodesNeeded - 12} more worker nodes`, workerX + 50, workerY + nodeHeight/2);
        }
        
        // Draw connections between masters
        for (let i = 0; i < 2; i++) {
            const fromX = 50 + (i * (nodeWidth + spacing)) + nodeWidth;
            const toX = 50 + ((i + 1) * (nodeWidth + spacing));
            const connectionY = masterY + nodeHeight/2;
            drawConnection(fromX, connectionY, toX, connectionY, 'HA');
        }
    }
    
    // Infrastructure services section
    const infraY = height - 150;
    ctx.fillStyle = colors.background;
    ctx.strokeStyle = colors.infra;
    ctx.lineWidth = 2;
    roundRect(50, infraY, width - 100, 100, 10);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Infrastructure Services:', 70, infraY + 25);
    ctx.font = '11px Arial';
    ctx.fillText(`• Logging Backend (${results.loggingStack === 'elasticsearch' ? 'Elasticsearch' : 'LokiStack'}), Monitoring, Registry, Router`, 70, infraY + 45);
    ctx.fillText(`• Resource Requirements: ${results.overheadBreakdown?.infraOverhead?.cpu?.toFixed(1) || 'N/A'} vCPUs / ${results.overheadBreakdown?.infraOverhead?.memory?.toFixed(1) || 'N/A'} GB`, 70, infraY + 60);
    ctx.fillText('• These services typically run on dedicated infrastructure nodes', 70, infraY + 75);
    
    // Legend
    const legendY = height - 40;
    ctx.fillStyle = colors.text;
    ctx.font = '10px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Legend:', 50, legendY);
    ctx.fillText('� Master/Control Plane', 120, legendY);
    ctx.fillText('⚙️ Worker Node', 250, legendY);
    if (results.mergeMasters) {
        ctx.fillText('Purple: Master+Worker (Compact)', 350, legendY);
    }
}

function exportCapacityToExcel() {
    if (!window.lastCapacityResults) {
        alert('Please calculate capacity first before exporting to Excel');
        return;
    }

    const results = window.lastCapacityResults;
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
        ['OpenShift Capacity Planning Summary'],
        ['Generated', new Date().toLocaleString()],
        [''],
        ['CLUSTER CONFIGURATION'],
        ['Worker Nodes Required', results.workerNodesNeeded],
        ['Master Nodes', results.mergeMasters ? '0 (merged)' : results.masterNodeRequirements.count],
        ['Cluster Type', results.mergeMasters ? 'Compact Cluster' : 'Standard Cluster'],
        ['CPU Cores per Worker Node', results.cpuPerNode],
        ['Memory per Worker Node (GB)', results.memoryPerNode],
        ['Logging Stack', results.loggingStack === 'elasticsearch' ? 'Elasticsearch' : 'LokiStack'],
        ['Utilization Buffer', results.overheadBreakdown.enableUtilizationBuffer ? 
            `Enabled (${(100 - results.overheadBreakdown.maxUtilization).toFixed(0)}% buffer)` : 
            'Disabled (100% utilization)'],
        [''],
        ...(results.mergeMasters ? [
            ['COMPACT CLUSTER DETAILS'],
            ['Master Services on Workers', 'Yes'],
            ['Total Master Overhead (CPU)', results.overheadBreakdown.masterOverhead.cpu.toFixed(2) + ' vCPUs (cluster-wide)'],
            ['Total Master Overhead (Memory)', results.overheadBreakdown.masterOverhead.memory.toFixed(2) + ' GB (cluster-wide)'],
            ['Minimum Worker Count for HA', '3 nodes'],
            ['']
        ] : [
            ['MASTER NODE RECOMMENDATIONS'],
            ['Master Count', results.masterNodeRequirements.count + ' nodes (for HA)'],
            ['CPU per Master', results.masterNodeRequirements.cpu + ' cores'],
            ['Memory per Master', results.masterNodeRequirements.memory + ' GB'],
            ['Total Master Resources', `${results.masterNodeRequirements.totalCpu} cores / ${results.masterNodeRequirements.totalMemory} GB`],
            ['Master Sizing Basis', `${results.workerNodesNeeded} worker nodes ${results.workerNodesNeeded <= 120 ? '(up to 120)' : results.workerNodesNeeded <= 252 ? '(121-252)' : '(over 252)'}`],
            ['']
        ]),
        ['RESOURCE BREAKDOWN'],
        ['Total Physical Cores', results.overheadBreakdown.totalPhysicalCores],
        ['Total Physical Memory (GB)', results.overheadBreakdown.totalPhysicalMemory],
        ['Total vCPU (with hyperthreading)', results.overheadBreakdown.totalVcpu],
        [''],
        ['OVERHEAD ANALYSIS'],
        ['System Reservations (vCPU)', results.overheadBreakdown.systemReservation.cpu.toFixed(2)],
        ['System Reservations (GB)', results.overheadBreakdown.systemReservation.memory.toFixed(2)],
        ...(results.mergeMasters ? [
            ['Master Services Overhead (vCPU)', results.overheadBreakdown.masterOverhead.cpu.toFixed(2)],
            ['Master Services Overhead (GB)', results.overheadBreakdown.masterOverhead.memory.toFixed(2)]
        ] : []),
        ['Logging Overhead (vCPU)', results.overheadBreakdown.loggingOverhead.cpu.toFixed(2)],
        ['Logging Overhead (GB)', results.overheadBreakdown.loggingOverhead.memory.toFixed(2)],
        ['Infrastructure Services (vCPU)', results.overheadBreakdown.infraOverhead.cpu.toFixed(2)],
        ['Infrastructure Services (GB)', results.overheadBreakdown.infraOverhead.memory.toFixed(2)],
        ['Utilization Buffer (vCPU)', results.overheadBreakdown.utilizationBuffer.cpu.toFixed(2)],
        ['Utilization Buffer (GB)', results.overheadBreakdown.utilizationBuffer.memory.toFixed(2)],
        [''],
        ['FINAL RESULTS'],
        ['Usable vCPU for Workloads', results.usableVcpu.toFixed(2)],
        ['Usable Memory for Workloads (GB)', results.usableMemory.toFixed(2)],
        ['Container Capacity Estimate', results.containerCapacity],
        ['VM Capacity Estimate', results.vmCapacity],
        [''],
        ['EFFICIENCY'],
        ['CPU Efficiency (%)', ((results.usableVcpu / results.overheadBreakdown.totalVcpu) * 100).toFixed(1)],
        ['Memory Efficiency (%)', ((results.usableMemory / results.overheadBreakdown.totalPhysicalMemory) * 100).toFixed(1)],
        [''],
        ['SUBSCRIPTION'],
        ['Model', results.subscriptionInfo.type],
        ['Required Subscriptions', results.subscriptionInfo.count],
        ['Calculation Method', results.subscriptionInfo.calculationMethod]
    ];

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // Resource Flow Sheet
    const flowData = [
        ['Resource Flow Analysis'],
        ['Step', 'Description', 'vCPU', 'Memory (GB)', 'Running Total vCPU', 'Running Total Memory'],
        ['1', 'Raw Physical Resources', results.overheadBreakdown.totalVcpu, results.overheadBreakdown.totalPhysicalMemory, results.overheadBreakdown.totalVcpu, results.overheadBreakdown.totalPhysicalMemory],
        ['2', 'System Reservations', `-${results.overheadBreakdown.systemReservation.cpu.toFixed(2)}`, `-${results.overheadBreakdown.systemReservation.memory.toFixed(2)}`, results.overheadBreakdown.availableAfterSystemReservation.cpu.toFixed(2), results.overheadBreakdown.availableAfterSystemReservation.memory.toFixed(2)],
        ['3', 'Logging Agents', `-${results.overheadBreakdown.loggingOverhead.cpu.toFixed(2)}`, `-${results.overheadBreakdown.loggingOverhead.memory.toFixed(2)}`, results.overheadBreakdown.availableAfterLogging.cpu.toFixed(2), results.overheadBreakdown.availableAfterLogging.memory.toFixed(2)],
        ['4', 'Utilization Buffer', `-${results.overheadBreakdown.utilizationBuffer.cpu.toFixed(2)}`, `-${results.overheadBreakdown.utilizationBuffer.memory.toFixed(2)}`, results.usableVcpu.toFixed(2), results.usableMemory.toFixed(2)],
        ['', '', '', '', '', ''],
        ['INFRA', 'Cluster Services (separate infra nodes)', results.overheadBreakdown.infraOverhead.cpu.toFixed(2), results.overheadBreakdown.infraOverhead.memory.toFixed(2), 'N/A - Dedicated Nodes', 'N/A - Dedicated Nodes']
    ];

    const flowWs = XLSX.utils.aoa_to_sheet(flowData);
    XLSX.utils.book_append_sheet(wb, flowWs, 'Resource Flow');

    // Node Details Sheet
    const nodeData = [
        ['Per-Node Analysis'],
        ['Metric', 'Value'],
        ['Physical CPU Cores', results.cpuPerNode],
        ['Total vCPU (with hyperthreading)', results.cpuPerNode * 2],
        ['Physical Memory (GB)', results.memoryPerNode],
        ['System CPU Reservation', (results.overheadBreakdown.systemReservation.cpu / results.workerNodesNeeded).toFixed(3)],
        ['System Memory Reservation (GB)', (results.overheadBreakdown.systemReservation.memory / results.workerNodesNeeded).toFixed(3)],
        ['Logging CPU Overhead', (results.overheadBreakdown.loggingOverhead.cpu / results.workerNodesNeeded).toFixed(3)],
        ['Logging Memory Overhead (GB)', (results.overheadBreakdown.loggingOverhead.memory / results.workerNodesNeeded).toFixed(3)],
        ['Available vCPU per Node', (results.overheadBreakdown.availableAfterLogging.cpu / results.workerNodesNeeded).toFixed(3)],
        ['Available Memory per Node (GB)', (results.overheadBreakdown.availableAfterLogging.memory / results.workerNodesNeeded).toFixed(3)],
        ['Usable vCPU per Node', (results.usableVcpu / results.workerNodesNeeded).toFixed(3)],
        ['Usable Memory per Node (GB)', (results.usableMemory / results.workerNodesNeeded).toFixed(3)]
    ];

    const nodeWs = XLSX.utils.aoa_to_sheet(nodeData);
    XLSX.utils.book_append_sheet(wb, nodeWs, 'Per-Node Details');

    // Save file
    const fileName = `OpenShift_Capacity_Plan_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
}

function exportCapacityTextReport() {
    if (!window.lastCapacityResults) {
        alert('Please calculate capacity first before generating report');
        return;
    }

    const results = window.lastCapacityResults;
    
    // Create comprehensive text report
    const textReport = `
OpenShift Capacity Planning Report
=================================
Generated: ${new Date().toLocaleString()}

CONFIGURATION SUMMARY
====================
Worker Nodes Required: ${results.workerNodesNeeded}
Master Nodes: ${results.mergeMasters ? '0 (merged with workers)' : results.masterNodeRequirements.count}
Cluster Configuration: ${results.mergeMasters ? 'Compact Cluster' : 'Standard Cluster'}
Node Specifications: ${results.cpuPerNode} cores / ${results.memoryPerNode} GB per worker node
Logging Stack: ${results.loggingStack === 'elasticsearch' ? 'Elasticsearch' : 'LokiStack'}
Utilization Buffer: ${results.overheadBreakdown.enableUtilizationBuffer ? 
    `Enabled (${(100 - results.overheadBreakdown.maxUtilization).toFixed(0)}% buffer)` : 
    'Disabled (100% utilization)'}

${results.mergeMasters ? `
COMPACT CLUSTER DETAILS
=======================
Master Services Location: On worker nodes
Total Master Services Overhead: ${results.overheadBreakdown.masterOverhead.cpu.toFixed(2)} vCPUs / ${results.overheadBreakdown.masterOverhead.memory.toFixed(2)} GB (cluster-wide)
Minimum Worker Count: 3 nodes (for master HA quorum)
Benefits: Reduced infrastructure overhead
Considerations: Master services consume fixed cluster resources
` : `
MASTER NODE RECOMMENDATIONS
===========================
Master Count: ${results.masterNodeRequirements.count} nodes (for HA)
CPU per Master: ${results.masterNodeRequirements.cpu} cores
Memory per Master: ${results.masterNodeRequirements.memory} GB
Total Master Resources: ${results.masterNodeRequirements.totalCpu} cores / ${results.masterNodeRequirements.totalMemory} GB
Sizing Basis: ${results.workerNodesNeeded} worker nodes ${results.workerNodesNeeded <= 120 ? '(up to 120 workers: 8c/32GB per master)' : 
                                                     results.workerNodesNeeded <= 252 ? '(121-252 workers: 16c/32GB per master)' : 
                                                     '(over 252 workers: contact Red Hat for custom sizing)'}
`}

RESOURCE FLOW ANALYSIS
======================
Step 1: Raw Physical Resources
    └─ ${results.overheadBreakdown.totalVcpu} vCPUs / ${results.overheadBreakdown.totalPhysicalMemory} GB

Step 2: System Reservations (OS, kubelet)
    └─ -${results.overheadBreakdown.systemReservation.cpu.toFixed(1)} vCPUs / -${results.overheadBreakdown.systemReservation.memory.toFixed(1)} GB
    └─ Available: ${results.overheadBreakdown.availableAfterSystemReservation.cpu.toFixed(1)} vCPUs / ${results.overheadBreakdown.availableAfterSystemReservation.memory.toFixed(1)} GB

${results.mergeMasters && results.overheadBreakdown.masterOverhead.cpu > 0 ? `Step 3: Master Services Overhead (compact cluster)
    └─ -${results.overheadBreakdown.masterOverhead.cpu.toFixed(1)} vCPUs / -${results.overheadBreakdown.masterOverhead.memory.toFixed(1)} GB (fixed cluster-wide)
    └─ Available: ${results.overheadBreakdown.availableAfterMasterOverhead.cpu.toFixed(1)} vCPUs / ${results.overheadBreakdown.availableAfterMasterOverhead.memory.toFixed(1)} GB

` : ''}Step ${results.mergeMasters && results.overheadBreakdown.masterOverhead.cpu > 0 ? '4' : '3'}: Logging Agents (per-node overhead)
    └─ -${results.overheadBreakdown.loggingOverhead.cpu.toFixed(1)} vCPUs / -${results.overheadBreakdown.loggingOverhead.memory.toFixed(1)} GB
    └─ Available: ${results.overheadBreakdown.availableAfterLogging.cpu.toFixed(1)} vCPUs / ${results.overheadBreakdown.availableAfterLogging.memory.toFixed(1)} GB

${results.overheadBreakdown.enableUtilizationBuffer ? 
`Step ${results.mergeMasters && results.overheadBreakdown.masterOverhead.cpu > 0 ? '5' : '4'}: Utilization Buffer (${(100 - results.overheadBreakdown.maxUtilization).toFixed(0)}% safety margin)
    └─ -${results.overheadBreakdown.utilizationBuffer.cpu.toFixed(1)} vCPUs / -${results.overheadBreakdown.utilizationBuffer.memory.toFixed(1)} GB` : 
`Step ${results.mergeMasters && results.overheadBreakdown.masterOverhead.cpu > 0 ? '5' : '4'}: No Utilization Buffer - 100% utilization allowed`}

FINAL USABLE RESOURCES: ${results.usableVcpu.toFixed(1)} vCPUs / ${results.usableMemory.toFixed(1)} GB

INFRASTRUCTURE SERVICES (Dedicated Nodes)
=========================================
Services: Monitoring, Logging Backend, Registry, Router
Resource Requirement: ${results.overheadBreakdown.infraOverhead.cpu.toFixed(1)} vCPUs / ${results.overheadBreakdown.infraOverhead.memory.toFixed(1)} GB
Note: These services run on dedicated infrastructure nodes, separate from worker nodes

CAPACITY ESTIMATES
==================
Container Workloads:
└─ Assumed size: ${results.containerPreset.vcpu} vCPU / ${results.containerPreset.memory} GB per container
└─ Estimated capacity: ~${results.containerCapacity} containers
└─ Limiting factor: ${results.containerLimitingFactor}

Virtual Machine Workloads:
└─ Assumed size: ${results.vmPreset.vcpu} vCPU / ${results.vmPreset.memory} GB per VM
└─ Estimated capacity: ~${results.vmCapacity} VMs
└─ Limiting factor: ${results.vmLimitingFactor}

EFFICIENCY ANALYSIS
===================
Resource Efficiency:
└─ CPU: ${((results.usableVcpu / results.overheadBreakdown.totalVcpu) * 100).toFixed(1)}% of physical resources usable
└─ Memory: ${((results.usableMemory / results.overheadBreakdown.totalPhysicalMemory) * 100).toFixed(1)}% of physical resources usable

Total Overhead:
└─ CPU: ${results.overheadBreakdown.totalOverhead.cpu.toFixed(1)} vCPUs (${((results.overheadBreakdown.totalOverhead.cpu / results.overheadBreakdown.totalVcpu) * 100).toFixed(1)}%)
└─ Memory: ${results.overheadBreakdown.totalOverhead.memory.toFixed(1)} GB (${((results.overheadBreakdown.totalOverhead.memory / results.overheadBreakdown.totalPhysicalMemory) * 100).toFixed(1)}%)

SUBSCRIPTION REQUIREMENTS
=========================
Subscription Model: ${results.subscriptionInfo.type}
Required Subscriptions: ${results.subscriptionInfo.count}
Calculation Method: ${results.subscriptionInfo.calculationMethod}
Total Billable Cores: ${results.subscriptionInfo.totalPhysicalCores}
${results.subscriptionInfo.totalSockets ? `Total Billable Sockets: ${results.subscriptionInfo.totalSockets}` : ''}

RECOMMENDATIONS
===============
1. Plan for ${results.workerNodesNeeded} worker nodes with the specified hardware configuration
2. Reserve additional infrastructure nodes for cluster services
3. Monitor actual utilization and adjust capacity as needed
4. Consider the ${results.overheadBreakdown.enableUtilizationBuffer ? 'configured utilization buffer' : 'lack of utilization buffer'} in your operational planning

Generated by OpenShift Resource Calculator
==========================================
    `;
    
    // Create and download the report
    const blob = new Blob([textReport], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OpenShift_Capacity_Report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function exportResourcesDiagram() {
    if (!window.lastCalculationResults) {
        alert('Please calculate resources first before generating diagram');
        return;
    }

    const calc = window.lastCalculationResults;
    
    // Create a detailed text-based diagram
    const diagram = `
OpenShift Resource Planning Diagram
===================================

Workload Requirements:
${calc.workloads.map(w => `- ${w.name}: ${w.instances} instances (${(w.instances * w.vcpu).toFixed(1)} vCPUs / ${(w.instances * w.memory).toFixed(1)} GB)`).join('\n')}

Total Requirements: ${calc.totalVcpuNeeded.toFixed(1)} vCPUs / ${calc.totalMemoryNeeded.toFixed(1)} GB

Calculated Infrastructure:
┌─────────────────────────────────────┐
│           Master Nodes              │
│         (${calc.mergeMasters ? '0 - merged' : calc.masterNodes} nodes)              │
${!calc.mergeMasters ? `├─────────────────────────────────────┤
│  Master 1: 2 vCPUs / 8 GB RAM       │
│  Master 2: 2 vCPUs / 8 GB RAM       │
│  Master 3: 2 vCPUs / 8 GB RAM       │` : ''}
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│           Worker Nodes              │
│         (${calc.finalWorkerNodes} nodes)              │
├─────────────────────────────────────┤
│  Node 1: ${calc.cpuCores} cores / ${calc.memoryPerNode} GB RAM    │
│  Node 2: ${calc.cpuCores} cores / ${calc.memoryPerNode} GB RAM    │
│  Node 3: ${calc.cpuCores} cores / ${calc.memoryPerNode} GB RAM    │
${calc.finalWorkerNodes > 3 ? `│  ...                                │
│  Node ${calc.finalWorkerNodes}: ${calc.cpuCores} cores / ${calc.memoryPerNode} GB RAM    │` : ''}
└─────────────────────────────────────┘

Resource Allocation:
- Total Cluster Nodes: ${calc.totalClusterNodes}
- Worker Node Utilization: CPU ${calc.actualCpuUtilization.toFixed(1)}% / Memory ${calc.actualMemoryUtilization.toFixed(1)}%
- Logging Stack: ${calc.selectedLoggingStack}
- Infrastructure Overhead: ${calc.finalInfraOverhead.cpu.toFixed(1)} vCPUs / ${calc.finalInfraOverhead.memory.toFixed(1)} GB

Subscription Requirements:
- Model: ${calc.subscriptionInfo.type}
- Required Subscriptions: ${calc.subscriptionInfo.count}
- Calculation: ${calc.subscriptionInfo.calculationMethod}

Log Storage:
- Total Pods: ${calc.logStorage.totalPods}
- Daily Log Volume: ${(calc.logStorage.dailyRawLogVolumeMB / 1024).toFixed(1)} GB/day
- Required Storage: ${calc.logStorage.finalStorageRequirementGB.toFixed(1)} GB
    `;
    
    // Create and download the diagram as a text file
    const blob = new Blob([diagram], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `OpenShift_Resources_Diagram_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Initialize
window.onload = function() {
    loadInputsFromLocalStorage();
};