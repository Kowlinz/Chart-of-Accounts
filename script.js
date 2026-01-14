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

// --- 2. CUSTOM MODAL LOGIC (New!) ---
// This function creates the popup HTML and handles the Yes/No clicks
function showCustomModal(type, title, message, onConfirm) {
    // 1. Remove any existing modal first
    var existingModal = document.getElementById('custom-confirm-modal');
    if (existingModal) existingModal.remove();

    // 2. Define Icon based on type
    var iconClass = 'fa-circle-info'; // Default
    if (type === 'modal-danger') iconClass = 'fa-trash-can';
    if (type === 'modal-success') iconClass = 'fa-circle-check';
    if (type === 'modal-info') iconClass = 'fa-floppy-disk';

    // 3. Create the HTML Structure
    var modalHTML = `
        <div id="custom-confirm-modal" class="custom-modal-overlay">
            <div class="custom-modal-box ${type}">
                <div class="modal-icon-circle">
                    <i class="fa-solid ${iconClass}"></i>
                </div>
                <div class="modal-title">${title}</div>
                <div class="modal-message">${message}</div>
                <div class="modal-actions">
                    <button class="btn-modal btn-cancel-modal" id="modal-cancel-btn">Cancel</button>
                    <button class="btn-modal btn-confirm" id="modal-confirm-btn">Confirm</button>
                </div>
            </div>
        </div>
    `;

    // 4. Inject into Body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // 5. Show it
    var modal = document.getElementById('custom-confirm-modal');
    modal.style.display = 'flex';

    // 6. Handle Clicks
    document.getElementById('modal-cancel-btn').onclick = function() {
        modal.remove();
    };

    document.getElementById('modal-confirm-btn').onclick = function() {
        onConfirm(); // Run the actual action (Save, Delete, etc.)
        modal.remove(); // Close modal
    };
}


// --- 3. INDEX PAGE LOGIC ---
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

function toggleChildren(parentName) {
    var container = document.getElementById('children-' + parentName);
    if (!container) return;

    if (container.style.display === 'none' || container.style.display === '') {
        renderTree(parentName);
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
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

function renderRecursive(parentName, container, allData, level) {
    var accounts = allData[parentName] || [];
    accounts.forEach(function(acc) {
        var row = document.createElement('div');
        row.className = 'child-item';
        var indentPixels = 20 + (level * 30);
        row.style.paddingLeft = indentPixels + "px";

        var menuId = 'menu-' + acc.code;
        var sortLink = `sort.html?parent=${acc.name}`;
        var addLink = `add.html?parent=${acc.name}`; 
        var editLink = `edit.html?parent=${parentName}&code=${acc.code}`;
        var viewLink = `view.html?parent=${parentName}&code=${acc.code}`;
        
        row.innerHTML = `
            <span>${acc.code} - ${acc.name}</span>
            <span class="indicator" onclick="event.stopPropagation(); toggleMenu('${menuId}')">
                <i class="fa-solid fa-ellipsis"></i>
            </span>
            <div id="${menuId}" class="dropdown-menu">
                <a href="${sortLink}" class="dropdown-item item-sort link-item">
                    <i class="fa-solid fa-arrow-down-z-a"></i> Edit Sorting
                </a>
                <a href="${addLink}" class="dropdown-item child-menu-header link-item">
                    <i class="fa-solid fa-folder-plus"></i> Add Child for ${acc.name}
                </a>
                <a href="${editLink}" class="dropdown-item item-edit link-item">
                    <i class="fa-solid fa-pen-to-square"></i> Edit
                </a>
                <div class="dropdown-item item-delete" onclick="triggerDelete('${parentName}', '${acc.code}', true)">
                    <i class="fa-solid fa-trash-can"></i> Delete
                </div>
                <a href="${viewLink}" class="dropdown-item item-view link-item">
                    <i class="fa-solid fa-eye"></i> View
                </a>
            </div>
        `;
        container.appendChild(row);
        if (allData[acc.name] && allData[acc.name].length > 0) {
            renderRecursive(acc.name, container, allData, level + 1);
        }
    });
}


// --- 4. ACTION TRIGGERS (Connects Buttons to Modals) ---

// Trigger for SAVING (Create)
function saveToStorage() {
    var parent = document.getElementById('parentAccountDisplay').value;
    var code = document.getElementById('inp-code').value;
    var name = document.getElementById('inp-name').value;
    var nature = document.getElementById('inp-nature').value;
    var desc = document.getElementById('inp-desc').value;

    if(!code || !name) { alert("Code and Name are required!"); return; }

    // Show SUCCESS Modal (Green)
    showCustomModal('modal-success', 'Create Account?', `Are you sure you want to add <b>${name}</b> to ${parent}?`, function() {
        // ACTUAL SAVE LOGIC
        var allData = getStoredData();
        if (!allData[parent]) allData[parent] = [];
        var newAcc = { code: code, name: name, nature: nature, description: desc };
        allData[parent].push(newAcc);
        setStoredData(allData);
        window.location.href = "index.html"; 
    });
}

// Trigger for UPDATING (Edit)
function updateAccount() {
    var parent = document.getElementById('parentAccountDisplay').value;
    var originalCode = document.getElementById('original-code').value;
    var originalName = document.getElementById('original-name').value;
    var newCode = document.getElementById('inp-code').value;
    var newName = document.getElementById('inp-name').value;
    var newNature = document.getElementById('inp-nature').value;
    var newDesc = document.getElementById('inp-desc').value;

    if(!newCode || !newName) { alert("Code and Name are required!"); return; }

    // Show INFO Modal (Blue)
    showCustomModal('modal-info', 'Save Changes?', `Are you sure you want to update <b>${originalName}</b>?`, function() {
        // ACTUAL UPDATE LOGIC
        var allData = getStoredData();
        var list = allData[parent];
        var index = list.findIndex(item => item.code === originalCode);

        if (index !== -1) {
            list[index].code = newCode;
            list[index].name = newName;
            list[index].nature = newNature;
            list[index].description = newDesc;
            if (originalName !== newName) {
                if (allData[originalName]) {
                    allData[newName] = allData[originalName]; 
                    delete allData[originalName]; 
                }
            }
            setStoredData(allData);
            window.location.href = "index.html";
        }
    });
}

// Trigger for DELETING
function triggerDelete(parent, code, fromMenu) {
    // Show DANGER Modal (Red)
    showCustomModal('modal-danger', 'Delete Account?', `Are you sure you want to delete account <b>${code}</b>? This action cannot be undone.`, function() {
        // ACTUAL DELETE LOGIC
        var allData = getStoredData();
        var list = allData[parent];
        if (list) {
            var newList = list.filter(item => item.code !== code);
            allData[parent] = newList;
            setStoredData(allData);
        }
        
        if (!fromMenu) {
             window.location.href = "index.html"; // If deleted from View page
        } else {
             location.reload(); // If deleted from dashboard list
        }
    });
}

// Function wrapper for the Delete button on the View page
function deleteEntry() {
    const urlParams = new URLSearchParams(window.location.search);
    triggerDelete(urlParams.get('parent'), urlParams.get('code'), false);
}


// --- 5. HELPER LOADERS (For Edit/View/Sort Pages) ---

function loadAccountForEdit() {
    const urlParams = new URLSearchParams(window.location.search);
    const parent = urlParams.get('parent');
    const code = urlParams.get('code');
    var allData = getStoredData();
    var list = allData[parent];
    var account = list ? list.find(item => item.code === code) : null;
    if (account) {
        document.getElementById('parentAccountDisplay').value = parent;
        document.getElementById('inp-code').value = account.code;
        document.getElementById('inp-name').value = account.name;
        document.getElementById('inp-nature').value = account.nature || 'Debit';
        document.getElementById('inp-desc').value = account.description || '';
        document.getElementById('original-code').value = account.code;
        document.getElementById('original-name').value = account.name;
    } else { alert("Account not found!"); window.location.href="index.html"; }
}

function loadAccountForView() {
    const urlParams = new URLSearchParams(window.location.search);
    const parent = urlParams.get('parent');
    const code = urlParams.get('code');
    var allData = getStoredData();
    var list = allData[parent];
    var account = list ? list.find(item => item.code === code) : null;
    if (account) {
        document.getElementById('view-parent').value = parent;
        document.getElementById('view-code').value = account.code;
        document.getElementById('view-name').value = account.name;
        document.getElementById('view-nature').value = account.nature;
        document.getElementById('view-desc').value = account.description;
    }
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
    // Show Info Modal for Sorting
    showCustomModal('modal-info', 'Save Order?', 'Do you want to apply this new sorting order?', function() {
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