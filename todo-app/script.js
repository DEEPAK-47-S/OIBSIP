// DOM Elements
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const pendingList = document.getElementById('pendingList');
const completedList = document.getElementById('completedList');
const pendingCount = document.getElementById('pendingCount');
const completedCount = document.getElementById('completedCount');
const pendingEmpty = document.getElementById('pendingEmpty');
const completedEmpty = document.getElementById('completedEmpty');

// State
let tasks = JSON.parse(localStorage.getItem('todo_tasks')) || [];

// Init
render();

// Event Listeners
addBtn.addEventListener('click', handleAddTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleAddTask();
});

function handleAddTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    const newTask = {
        id: Date.now().toString(),
        text: text,
        completed: false,
        addedAt: new Date().toISOString(),
        completedAt: null
    };

    tasks.unshift(newTask);
    taskInput.value = '';
    saveAndRender();
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        task.completedAt = task.completed ? new Date().toISOString() : null;
        saveAndRender();
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveAndRender();
}

function editTask(id, newText) {
    const task = tasks.find(t => t.id === id);
    if (task && newText.trim()) {
        task.text = newText.trim();
        saveAndRender();
    }
}

function saveAndRender() {
    localStorage.setItem('todo_tasks', JSON.stringify(tasks));
    render();
}

function render() {
    // Clear lists
    pendingList.innerHTML = '';
    completedList.innerHTML = '';

    let pending = 0;
    let completed = 0;

    tasks.forEach(task => {
        const li = createTaskElement(task);
        if (task.completed) {
            completedList.appendChild(li);
            completed++;
        } else {
            pendingList.appendChild(li);
            pending++;
        }
    });

    // Update counts
    pendingCount.textContent = `${pending} pending`;
    completedCount.textContent = `${completed} completed`;

    // Manage empty states
    pendingEmpty.style.display = pending === 0 ? 'block' : 'none';
    completedEmpty.style.display = completed === 0 ? 'block' : 'none';
}

function createTaskElement(task) {
    const li = document.createElement('li');
    li.className = `task-item ${task.completed ? 'completed' : ''}`;
    
    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'task-checkbox';
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', () => toggleTask(task.id));

    // Content container
    const contentDiv = document.createElement('div');
    contentDiv.className = 'task-content';

    // Task text
    const textSpan = document.createElement('span');
    textSpan.className = 'task-text';
    textSpan.textContent = task.text;

    // Meta (timestamp)
    const metaSpan = document.createElement('span');
    metaSpan.className = 'task-meta';
    
    const formatOpts = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    const addedDate = new Date(task.addedAt).toLocaleString(undefined, formatOpts);
    let metaText = `Added: ${addedDate}`;
    if (task.completed && task.completedAt) {
        metaText += ` | Completed: ${new Date(task.completedAt).toLocaleString(undefined, formatOpts)}`;
    }
    metaSpan.textContent = metaText;

    contentDiv.appendChild(textSpan);
    contentDiv.appendChild(metaSpan);

    // Actions container
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'task-actions';

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className = 'icon-btn edit-btn';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editBtn.title = 'Edit task';
    
    // Edit functionality
    editBtn.addEventListener('click', () => {
        if (li.classList.contains('editing-mode')) {
            // Save mode
            const input = contentDiv.querySelector('.editing');
            editTask(task.id, input.value);
            li.classList.remove('editing-mode');
        } else {
            // Enter edit mode
            li.classList.add('editing-mode');
            const input = document.createElement('input');
            input.type = 'text';
            input.value = task.text;
            input.className = 'task-text editing';
            
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    editTask(task.id, input.value);
                }
            });

            contentDiv.replaceChild(input, textSpan);
            input.focus();
            editBtn.innerHTML = '<i class="fas fa-check"></i>';
        }
    });

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'icon-btn delete-btn';
    deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
    deleteBtn.title = 'Delete task';
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    if (!task.completed) {
        actionsDiv.appendChild(editBtn);
    }
    actionsDiv.appendChild(deleteBtn);

    li.appendChild(checkbox);
    li.appendChild(contentDiv);
    li.appendChild(actionsDiv);

    return li;
}
