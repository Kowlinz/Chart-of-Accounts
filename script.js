// --- 1. LOCAL STORAGE HANDLING ---
function getStoredData() {
    var data = localStorage.getItem('winnolasData');
    if (!data) {
        return { "Asset": [], "Liability": [], "Capital": [], "Income": [], "Expense": [] };
    }
    return JSON.parse(data);
}

function setStoredData(data) {
    localStorage.setItem('winnolasData', JSON.stringify(data));
}

// --- NEW: EXPANDED STATE HANDLING ---
function getExpandedState() {
    var state = localStorage.getItem('winnolasExpanded');
    return state ? JSON.parse(state) : [];
}

function setExpandedState(state) {
    localStorage.setItem('winnolasExpanded', JSON.stringify(state));
}

function restoreExpandedState() {
    // This runs when page loads to re-open previously opened folders
    var expanded = getExpandedState();
    
    // Restore Root folders (Asset, Liability, etc.)
    ['Asset', 'Liability', 'Capital', 'Income', 'Expense'].forEach(function(root) {
        if (expanded.includes(root)) {
            var container = document.getElementById('children-' + root);
            if (container) {
                renderTree(root); 
                container.style.display = 'block';
            }
        }
    });
}


// --- 2. CUSTOM MODAL LOGIC ---
function showCustomModal(type, title, message, onConfirm) {
    var existingModal = document.getElementById('custom-confirm-modal');
    if (existingModal) existingModal.remove();

    var iconClass = 'fa-circle-info';
    if (type === 'modal-danger') iconClass = 'fa-trash-can';
    if (type === 'modal-success') iconClass = 'fa-circle-check';
    if (type === 'modal-info') iconClass = 'fa-floppy-disk';

    var modalHTML = `
        <div id="custom-confirm-modal" class="custom-modal-overlay">
            <div class="custom-modal-box ${type}">
                <div class="modal-icon-circle"><i class="fa-solid ${iconClass}"></i></div>
                <div class="modal-title">${title}</div>
                <div class="modal-message">${message}</div>
                <div class="modal-actions">
                    <button class="btn-modal btn-cancel-modal" id="modal-cancel-btn">Cancel</button>
                    <button class="btn-modal btn-confirm" id="modal-confirm-btn">Confirm</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    var modal = document.getElementById('custom-confirm-modal');
    modal.style.display = 'flex';

    document.getElementById('modal-cancel-btn').onclick = function() { modal.remove(); };
    document.getElementById('modal-confirm-btn').onclick = function() { onConfirm(); modal.remove(); };
}


// --- 3. INDEX PAGE LOGIC (Updated) ---

function toggleMenu(menuId) {
    var menu = document.getElementById(menuId);
    var isAlreadyOpen = menu.classList.contains('show');
    document.querySelectorAll('.dropdown-menu').forEach(m => m.classList.remove('show'));
    if (!isAlreadyOpen) menu.classList.add('show');
}

window.onclick = function(event) {
    if (!event.target.matches('.indicator') && !event.target.matches('.indicator i')) {
        document.querySelectorAll('.dropdown-menu').forEach(d => d.classList.remove('show'));
    }
}

// Logic for Main Roots (Asset, Liability, etc.)
function toggleChildren(parentName) {
    var container = document.getElementById('children-' + parentName);
    if (!container) return;

    var expanded = getExpandedState();

    if (container.style.display === 'none' || container.style.display === '') {
        // OPENING
        renderTree(parentName);
        container.style.display = 'block';
        
        if (!expanded.includes(parentName)) {
            expanded.push(parentName);
            setExpandedState(expanded);
        }
    } else {
        // CLOSING
        container.style.display = 'none';
        
        expanded = expanded.filter(item => item !== parentName);
        setExpandedState(expanded);
    }
}

// Logic for Nested Sub-Folders
function toggleSubFolder(name, rowElement) {
    var container = document.getElementById('children-' + name);
    if (!container) return;

    var expanded = getExpandedState();
    var icon = rowElement.querySelector('.tree-toggle-icon');

    if (container.style.display === 'none') {
        // OPENING
        container.style.display = 'block';
        if(icon) icon.classList.add('expanded');

        if (!expanded.includes(name)) {
            expanded.push(name);
            setExpandedState(expanded);
        }
    } else {
        // CLOSING
        container.style.display = 'none';
        if(icon) icon.classList.remove('expanded');

        expanded = expanded.filter(item => item !== name);
        setExpandedState(expanded);
    }
}

function renderTree(rootName) {
    var container = document.getElementById('children-' + rootName);
    if (!container) return;
    var allData = getStoredData();
    container.innerHTML = "";
    renderRecursive(rootName, container, allData, 0);
    if (container.innerHTML === "") {
        container.innerHTML = "<div class='child-item empty'>No sub-accounts yet.</div>";
    }
}

// --- UPDATED RENDER RECURSIVE FUNCTION ---
function renderRecursive(parentName, container, allData, level) {
    var accounts = allData[parentName] || [];
    var expandedState = getExpandedState();

    accounts.forEach(function(acc) {
        // 1. Check for children
        var hasChildren = allData[acc.name] && allData[acc.name].length > 0;
        
        var row = document.createElement('div');
        row.className = 'child-item';
        
        // 2. INDENTATION UPDATE:
        // Root Parent is 25px. 
        // We start level 0 at 50px so it is indented.
        // Then we add 30px for every subsequent level.
        var indentPixels = 50 + (level * 30);
        
        row.style.paddingLeft = indentPixels + "px";

        var menuId = 'menu-' + acc.code;
        var sortLink = `sort.html?parent=${acc.name}`;
        var addLink = `add.html?parent=${acc.name}&parentCode=${acc.code}`; 
        var editLink = `edit.html?parent=${parentName}&code=${acc.code}`;
        var viewLink = `view.html?parent=${parentName}&code=${acc.code}`;
        
        // 3. Arrow & Styling Logic (Retained)
        var toggleIcon = '';
        var textClass = 'leaf-normal';
        var clickAction = ''; 
        var arrowClass = '';

        var isOpen = expandedState.includes(acc.name);
        if(isOpen) arrowClass = 'expanded';

        if (hasChildren) {
            toggleIcon = `<span class="tree-toggle-icon ${arrowClass}"><i class="fa-solid fa-angle-right"></i></span>`;
            textClass = 'parent-bold';
            clickAction = `onclick="toggleSubFolder('${acc.name}', this)"`;
        } else {
            toggleIcon = `<span class="no-arrow-spacer"></span>`;
        }

        // 4. Build Row HTML (Retained)
        row.innerHTML = `
            <div class="row-content" ${clickAction} style="display:flex; align-items:center; flex-grow:1; cursor:pointer;">
                ${toggleIcon}
                <span class="${textClass}">${acc.code} - ${acc.name}</span>
            </div>

            <span class="indicator" onclick="event.stopPropagation(); toggleMenu('${menuId}')">
                <i class="fa-solid fa-ellipsis"></i>
            </span>

            <div id="${menuId}" class="dropdown-menu" onclick="event.stopPropagation()">
                <a href="${sortLink}" class="dropdown-item item-sort link-item"><i class="fa-solid fa-arrow-down-z-a"></i> Edit Sorting</a>
                <a href="${addLink}" class="dropdown-item child-menu-header link-item"><i class="fa-solid fa-folder-plus"></i> Add Child for ${acc.name}</a>
                <a href="${editLink}" class="dropdown-item item-edit link-item"><i class="fa-solid fa-pen-to-square"></i> Edit</a>
                <div class="dropdown-item item-delete" onclick="triggerDelete('${parentName}', '${acc.code}', true)"><i class="fa-solid fa-trash-can"></i> Delete</div>
                <a href="${viewLink}" class="dropdown-item item-view link-item"><i class="fa-solid fa-eye"></i> View</a>
            </div>
        `;
        
        container.appendChild(row);

        // 5. Recursion (Retained)
        if (hasChildren) {
            var subContainer = document.createElement('div');
            subContainer.id = 'children-' + acc.name;
            subContainer.className = 'children-container';
            subContainer.style.display = isOpen ? 'block' : 'none';
            container.appendChild(subContainer);
            
            renderRecursive(acc.name, subContainer, allData, level + 1);
        }
    });
}


// --- 4. ACTION TRIGGERS ---

var currentTags = []; 

function addTag() {
    var input = document.getElementById('inp-tags');
    if (!input) return;
    var tagValue = input.value.trim();
    if (tagValue === "") return;
    currentTags.push(tagValue);
    input.value = ""; 
    renderTags();
}

function removeTag(index) {
    currentTags.splice(index, 1);
    renderTags();
}

function renderTags() {
    var container = document.getElementById('tags-list-container');
    if (!container) return;
    container.innerHTML = "";
    currentTags.forEach(function(tag, index) {
        var div = document.createElement('div');
        div.className = 'tag-item';
        div.innerHTML = `<span>${tag}</span><span class="tag-remove-btn" onclick="removeTag(${index})"><i class="fa-solid fa-xmark"></i></span>`;
        container.appendChild(div);
    });
}

function getFormValues() {
    return {
        code: document.getElementById('inp-code').value,
        name: document.getElementById('inp-name').value,
        nature: document.getElementById('inp-nature') ? document.getElementById('inp-nature').value : '',
        tags: currentTags, 
        desc: document.getElementById('inp-desc') ? document.getElementById('inp-desc').value : '',
        cashflow: document.getElementById('inp-cashflow') ? document.getElementById('inp-cashflow').value : '',
        finpos: document.getElementById('inp-finpos') ? document.getElementById('inp-finpos').value : '',
        opt_depository: document.getElementById('chk-depository') ? document.getElementById('chk-depository').checked : false,
        opt_sales: document.getElementById('chk-sales') ? document.getElementById('chk-sales').checked : false,
        def_ap: document.getElementById('chk-def-ap') ? document.getElementById('chk-def-ap').checked : false,
        def_ar: document.getElementById('chk-def-ar') ? document.getElementById('chk-def-ar').checked : false,
        def_asset: document.getElementById('chk-def-asset') ? document.getElementById('chk-def-asset').checked : false,
        def_furn: document.getElementById('chk-def-furn') ? document.getElementById('chk-def-furn').checked : false,
        def_ffe: document.getElementById('chk-def-ffe') ? document.getElementById('chk-def-ffe').checked : false
    };
}

function setFormValues(account) {
    if(document.getElementById('inp-code')) document.getElementById('inp-code').value = account.code;
    if(document.getElementById('inp-name')) document.getElementById('inp-name').value = account.name;
    if(document.getElementById('inp-nature')) document.getElementById('inp-nature').value = account.nature || 'Debit';
    
    if (account.tags && Array.isArray(account.tags)) {
        currentTags = account.tags;
        renderTags();
    } else {
        currentTags = [];
        renderTags();
    }

    if(document.getElementById('inp-desc')) document.getElementById('inp-desc').value = account.description || '';
    if(document.getElementById('inp-cashflow')) document.getElementById('inp-cashflow').value = account.cashflow || 'All';
    if(document.getElementById('inp-finpos')) document.getElementById('inp-finpos').value = account.finpos || 'None';
    if(document.getElementById('chk-depository')) document.getElementById('chk-depository').checked = account.opt_depository || false;
    if(document.getElementById('chk-sales')) document.getElementById('chk-sales').checked = account.opt_sales || false;
    if(document.getElementById('chk-def-ap')) document.getElementById('chk-def-ap').checked = account.def_ap || false;
    if(document.getElementById('chk-def-ar')) document.getElementById('chk-def-ar').checked = account.def_ar || false;
    if(document.getElementById('chk-def-asset')) document.getElementById('chk-def-asset').checked = account.def_asset || false;
    if(document.getElementById('chk-def-furn')) document.getElementById('chk-def-furn').checked = account.def_furn || false;
    if(document.getElementById('chk-def-ffe')) document.getElementById('chk-def-ffe').checked = account.def_ffe || false;
}

function saveToStorage() {
    var parent = document.getElementById('parentAccountDisplay').value;
    var values = getFormValues();

    if(!values.code || !values.name) { alert("Code and Name are required!"); return; }

    showCustomModal('modal-success', 'Create Account?', `Are you sure you want to add <b>${values.name}</b> to ${parent}?`, function() {
        var allData = getStoredData();
        if (!allData[parent]) allData[parent] = [];
        allData[parent].push(values);
        setStoredData(allData);
        window.location.href = "index.html"; 
    });
}

function updateAccount() {
    var parent = document.getElementById('parentAccountDisplay').value;
    var originalCode = document.getElementById('original-code').value;
    var originalName = document.getElementById('original-name').value;
    var values = getFormValues();

    if(!values.code || !values.name) { alert("Code and Name are required!"); return; }

    showCustomModal('modal-info', 'Save Changes?', `Are you sure you want to update <b>${originalName}</b>?`, function() {
        var allData = getStoredData();
        var list = allData[parent];
        var index = list.findIndex(item => item.code === originalCode);

        if (index !== -1) {
            Object.assign(list[index], values);
            if (originalName !== values.name) {
                if (allData[originalName]) {
                    allData[values.name] = allData[originalName]; 
                    delete allData[originalName]; 
                }
            }
            setStoredData(allData);
            window.location.href = "index.html";
        }
    });
}

function triggerDelete(parent, code, fromMenu) {
    showCustomModal('modal-danger', 'Delete Account?', `Delete account <b>${code}</b>?`, function() {
        var allData = getStoredData();
        var list = allData[parent];
        if (list) {
            var newList = list.filter(item => item.code !== code);
            allData[parent] = newList;
            setStoredData(allData);
        }
        if (!fromMenu) { window.location.href = "index.html"; } 
        else { location.reload(); }
    });
}

function deleteEntry() {
    const urlParams = new URLSearchParams(window.location.search);
    triggerDelete(urlParams.get('parent'), urlParams.get('code'), false);
}


// --- 6. PAGE LOADERS ---

function getPathArray(targetName, allData) {
    var roots = ["Asset", "Liability", "Capital", "Income", "Expense"];
    if (roots.includes(targetName)) return [targetName];

    for (const [parentName, children] of Object.entries(allData)) {
        var found = children.find(c => c.name === targetName);
        if (found) {
            var parentPath = getPathArray(parentName, allData);
            return [...parentPath, targetName]; 
        }
    }
    return [targetName];
}

function renderParentPath(accountName) {
    var container = document.getElementById('parentPathContainer');
    if(!container) return; 
    var allData = getStoredData();
    var pathArray = getPathArray(accountName, allData);
    
    var mainText = accountName;
    var pathText = pathArray.join(' <span class="path-separator">></span> ');

    container.innerHTML = `
        <div class="parent-main-text">${mainText}</div>
        <div class="parent-sub-text">${pathText}</div>
        <input type="hidden" id="parentAccountDisplay" value="${accountName}">
    `;
}

function loadAccountForAdd() {
    const urlParams = new URLSearchParams(window.location.search);
    const parent = urlParams.get('parent') || 'Asset';
    const parentCode = urlParams.get('parentCode');

    renderParentPath(parent);
    
    if (parentCode) {
        document.getElementById('inp-code').value = parentCode + "-";
    }

    var roots = ["Asset", "Liability", "Capital", "Income", "Expense"];
    if (!roots.includes(parent)) {
        document.getElementById('inp-name').value = parent + " - ";
    }
}

function loadAccountForEdit() {
    const urlParams = new URLSearchParams(window.location.search);
    const parent = urlParams.get('parent');
    const code = urlParams.get('code');
    var allData = getStoredData();
    var list = allData[parent];
    var account = list ? list.find(item => item.code === code) : null;
    if (account) {
        renderParentPath(parent);
        document.getElementById('original-code').value = account.code;
        document.getElementById('original-name').value = account.name;
        setFormValues(account);
    } else { alert("Account not found!"); window.location.href="index.html"; }
}

function loadAccountForView() {
    loadAccountForEdit(); 
}

function loadAccountForSorting() {
    const urlParams = new URLSearchParams(window.location.search);
    const parentName = urlParams.get('parent');
    document.getElementById('sorting-parent-name').innerText = parentName;
    var allData = getStoredData();
    var accounts = allData[parentName] || [];
    var container = document.getElementById('sort-list');
    container.innerHTML = "";
    if (accounts.length === 0) { container.innerHTML = "<div class='empty-sort'>No items to sort.</div>"; return; }
    accounts.forEach(function(acc) {
        var item = document.createElement('div');
        item.classList.add('sortable-item');
        item.setAttribute('draggable', 'true');
        item.dataset.code = acc.code;
        item.innerHTML = `<div class="drag-handle"><i class="fa-solid fa-grip-vertical"></i></div><div class="sort-text">${acc.code} - ${acc.name}</div>`;
        item.addEventListener('dragstart', function() { item.classList.add('dragging'); });
        item.addEventListener('dragend', function() { item.classList.remove('dragging'); });
        container.appendChild(item);
    });
    container.addEventListener('dragover', function(e) {
        e.preventDefault();
        const afterElement = getDragAfterElement(container, e.clientY);
        const draggable = document.querySelector('.dragging');
        if (afterElement == null) { container.appendChild(draggable); } 
        else { container.insertBefore(draggable, afterElement); }
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.sortable-item:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) { return { offset: offset, element: child }; } 
        else { return closest; }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function saveSortingOrder() {
    showCustomModal('modal-info', 'Save Order?', 'Apply sorting?', function() {
        const urlParams = new URLSearchParams(window.location.search);
        const parentName = urlParams.get('parent');
        var container = document.getElementById('sort-list');
        var items = container.querySelectorAll('.sortable-item');
        var newOrderCodes = [];
        items.forEach(item => newOrderCodes.push(item.dataset.code));
        var allData = getStoredData();
        var oldList = allData[parentName];
        var newList = [];
        newOrderCodes.forEach(code => {
            var account = oldList.find(acc => acc.code === code);
            if (account) newList.push(account);
        });
        allData[parentName] = newList;
        setStoredData(allData);
        window.location.href = "index.html";
    });
}


// --- 7. AUTO-RESTORE STATE ON PAGE LOAD ---
document.addEventListener('DOMContentLoaded', function() {
    if(document.getElementById('children-Asset')) {
        restoreExpandedState();
    }
});