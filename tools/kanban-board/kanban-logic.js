'use strict';

// 1. DATA STRUCTURE & STATE
// Tasks are stored as an object where keys are list IDs
let boardState = JSON.parse(localStorage.getItem('toolsuite_kanban')) || {
    'todo-list': [],
    'progress-list': [],
    'done-list': []
};

// 2. INITIALIZE DRAG & DROP
const lists = ['todo-list', 'progress-list', 'done-list'];

lists.forEach(listId => {
    const el = document.getElementById(listId);
    
    // SortableJS initialization
    new Sortable(el, {
        group: 'shared', // Allows moving between lists
        animation: 150,
        ghostClass: 'ghost-card',
        onEnd: function() {
            saveState(); // Sync data structure whenever a card is moved
        }
    });

    // Initial Render from LocalStorage
    renderList(listId);
});

// 3. CORE LOGIC
function renderList(listId) {
    const container = document.getElementById(listId);
    container.innerHTML = '';
    
    boardState[listId].forEach((taskText, index) => {
        const card = createCardElement(taskText, listId);
        container.appendChild(card);
    });
}

function createCardElement(text, listId) {
    const card = document.createElement('div');
    card.className = 'task-card';
    card.innerHTML = `
        <span>${text}</span>
        <span class="delete-btn" onclick="deleteTask(this, '${listId}')">×</span>
    `;
    return card;
}

window.addTask = function(listId) {
    const text = prompt("Enter Task Description:");
    if (!text || text.trim() === "") return;

    const container = document.getElementById(listId);
    const card = createCardElement(text, listId);
    container.appendChild(card);
    
    saveState();
};

window.deleteTask = function(btn, listId) {
    if (confirm("Delete this task?")) {
        btn.parentElement.remove();
        saveState();
    }
};

// 4. SYNC DOM STATE TO LOCALSTORAGE
function saveState() {
    const newState = {};
    
    lists.forEach(listId => {
        const listEl = document.getElementById(listId);
        const tasks = Array.from(listEl.querySelectorAll('.task-card span:first-child'))
                           .map(span => span.innerText);
        newState[listId] = tasks;
    });

    boardState = newState;
    localStorage.setItem('toolsuite_kanban', JSON.stringify(boardState));
}