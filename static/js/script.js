// softkom-todo-app JavaScript
// Handles all client-side logic for the to-do list UI, including task CRUD, category switching, and batch translation.

// Global variables
let currentCategory = 'personal';

// Wait for the DOM to load before attaching event listeners
// Sets up all UI event handlers and fetches initial tasks
/**
 * Initialize event listeners and fetch tasks on page load.
 */
document.addEventListener('DOMContentLoaded', function() {
    const inputBox = document.getElementById('input-type');
    const listContainer = document.getElementById('list-container');
    const personalButton = document.getElementById('personal');
    const professionalButton = document.getElementById('professional');
    const clearAllElement = document.querySelector('.clear-all-container');
    const addButton = document.querySelector('button');
    const translateAllBtn = document.getElementById('translate-all-btn');
    const langSelectAll = document.getElementById('lang-select-all');

    // Update the clear all icon
    const clearAllIcon = clearAllElement.querySelector('img');
    clearAllIcon.src = "/static/images/delete.png";

    fetchTasks();

    // Add task on Enter key
    inputBox.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    addButton.addEventListener('click', addTask);

    // Handle clicks on task items (delete, toggle, edit)
    listContainer.addEventListener('click', handleTaskClick);
    personalButton.addEventListener('click', () => switchCategory('personal'));
    professionalButton.addEventListener('click', () => switchCategory('professional'));
    clearAllElement.addEventListener('click', clearAllTasks);

    // Batch translation: translate all visible tasks
    if (translateAllBtn && langSelectAll) {
        translateAllBtn.addEventListener('click', function() {
            const listContainer = document.getElementById('list-container');
            // Only translate visible tasks (current category)
            const tasks = Array.from(listContainer.querySelectorAll('li')).filter(li => li.style.display !== 'none');
            const texts = tasks.map(li => li.querySelector('.task-text').textContent);
            const targetLang = langSelectAll.value;
            // Show loading message
            tasks.forEach(li => {
                li.querySelector('.translated-text').textContent = 'Translating...';
            });
            fetch('/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ texts: texts, target_lang: targetLang })
            })
            .then(response => response.json())
            .then(data => {
                if (data.translations && Array.isArray(data.translations)) {
                    data.translations.forEach((translated, i) => {
                        tasks[i].querySelector('.translated-text').textContent = translated || 'Translation failed';
                    });
                } else {
                    tasks.forEach(li => {
                        li.querySelector('.translated-text').textContent = 'Translation failed';
                    });
                }
            })
            .catch(() => {
                tasks.forEach(li => {
                    li.querySelector('.translated-text').textContent = 'Translation failed';
                });
            });
        });
    }
});

/**
 * Fetch all tasks from the backend and render them in the UI.
 */
function fetchTasks() {
    fetch('/tasks')
        .then(response => response.json())
        .then(tasks => {
            const listContainer = document.getElementById('list-container');
            listContainer.innerHTML = '';
            tasks.forEach(task => {
                let li = createTaskElement(task);
                listContainer.appendChild(li);
            });
            updateTaskVisibility();
        })
        .catch(error => console.error('Error:', error));
}

/**
 * Create a DOM element for a single task, including translation span.
 * @param {Object} task - The task object from backend
 * @returns {HTMLElement} The <li> element for the task
 */
function createTaskElement(task) {
    let li = document.createElement('li');
    li.className = 'task-item';
    if (task.completed) li.classList.add('checked');
    li.innerHTML = `
        <img src="/static/images/${task.completed ? 'checked' : 'unchecked'}.png" class="status-icon">
        <span class="task-text" contenteditable="true">${task.description}</span>
        <img src="/static/images/remove.png" class="delete-icon">
        <span class="translated-text" style="margin-left:1em;color:#555;"></span>
    `;
    li.dataset.category = task.category;
    li.dataset.id = task.id;
    return li;
}

/**
 * Add a new task using the value in the input box.
 * Sends a POST request to the backend and updates the UI.
 */
function addTask() {
    const inputBox = document.getElementById('input-type');
    if (inputBox.value === '') {
        alert('You must write something!');
    } else {
        fetch('/tasks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                description: inputBox.value,
                category: currentCategory,
                completed: false
            }),
        })
        .then(response => response.json())
        .then(task => {
            const listContainer = document.getElementById('list-container');
            let li = createTaskElement(task);
            listContainer.appendChild(li);
            inputBox.value = '';
            updateTaskVisibility();
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }
}

/**
 * Handle clicks on task items (delete, toggle, edit).
 * @param {Event} e - The click event
 */
function handleTaskClick(e) {
    const taskElement = e.target.closest('li');
    if (e.target.classList.contains('delete-icon')) {
        deleteTask(taskElement);
    } else if (e.target.classList.contains('status-icon')) {
        toggleTask(taskElement);
    } else if (e.target.classList.contains('task-text')) {
        e.target.addEventListener('blur', () => updateTaskDescription(taskElement));
    }
}

/**
 * Toggle the completed status of a task.
 * @param {HTMLElement} taskElement - The <li> element for the task
 */
function toggleTask(taskElement) {
    const taskId = taskElement.dataset.id;
    const completed = !taskElement.classList.contains('checked');
    
    fetch(`/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: completed }),
    })
    .then(response => response.json())
    .then(task => {
        taskElement.classList.toggle('checked');
        const statusIcon = taskElement.querySelector('.status-icon');
        statusIcon.src = `/static/images/${completed ? 'checked' : 'unchecked'}.png`;
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

/**
 * Delete a task from the backend and remove it from the UI.
 * @param {HTMLElement} taskElement - The <li> element for the task
 */
function deleteTask(taskElement) {
    const taskId = taskElement.dataset.id;
    
    fetch(`/tasks/${taskId}`, {
        method: 'DELETE',
    })
    .then(response => {
        if (response.ok) {
            taskElement.remove();
            updateTaskVisibility();
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

/**
 * Update the description of a task after editing.
 * @param {HTMLElement} taskElement - The <li> element for the task
 */
function updateTaskDescription(taskElement) {
    const taskId = taskElement.dataset.id;
    const newDescription = taskElement.querySelector('.task-text').textContent;
    
    fetch(`/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: newDescription }),
    })
    .then(response => response.json())
    .catch((error) => {
        console.error('Error:', error);
    });
}

/**
 * Delete all tasks in the current category.
 */
function clearAllTasks() {
    const listContainer = document.getElementById('list-container');
    const tasks = listContainer.querySelectorAll('li');
    
    tasks.forEach(task => {
        if (task.dataset.category === currentCategory) {
            deleteTask(task);
        }
    });
}

/**
 * Switch between personal and professional categories.
 * @param {string} category - The category to switch to
 */
function switchCategory(category) {
    currentCategory = category;
    document.getElementById('personal').classList.toggle('active', category === 'personal');
    document.getElementById('professional').classList.toggle('active', category === 'professional');
    updateTaskVisibility();
}

/**
 * Show/hide tasks based on the current category and display a message if none.
 */
function updateTaskVisibility() {
    const listContainer = document.getElementById('list-container');
    const noTasksMessage = document.getElementById('no-tasks-message');
    const tasks = listContainer.querySelectorAll('li');
    let visibleTasks = 0;

    tasks.forEach(task => {
        if (task.dataset.category === currentCategory) {
            task.style.display = 'flex';
            visibleTasks++;
        } else {
            task.style.display = 'none';
        }
    });

    if (visibleTasks === 0) {
        noTasksMessage.style.display = 'block';
    } else {
        noTasksMessage.style.display = 'none';
    }
}