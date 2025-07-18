// Global variables
let currentCategory = 'personal';

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

    inputBox.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    addButton.addEventListener('click', addTask);

    listContainer.addEventListener('click', handleTaskClick);
    personalButton.addEventListener('click', () => switchCategory('personal'));
    professionalButton.addEventListener('click', () => switchCategory('professional'));
    clearAllElement.addEventListener('click', clearAllTasks);

    // Add translation event delegation
    listContainer.addEventListener('click', function(e) {
        if (e.target.classList.contains('translate-btn')) {
            const li = e.target.closest('li');
            const text = li.querySelector('.task-text').textContent;
            const langSelect = li.querySelector('.lang-select');
            const targetLang = langSelect.value;
            const translatedTextSpan = li.querySelector('.translated-text');
            e.target.disabled = true;
            translatedTextSpan.textContent = 'Translating...';
            fetch('/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text, target_lang: targetLang })
            })
            .then(response => response.json())
            .then(data => {
                if (data.translated) {
                    translatedTextSpan.textContent = data.translated;
                } else {
                    translatedTextSpan.textContent = 'Translation failed';
                }
            })
            .catch(() => {
                translatedTextSpan.textContent = 'Translation failed';
            })
            .finally(() => {
                e.target.disabled = false;
            });
        }
    });

    if (translateAllBtn && langSelectAll) {
        translateAllBtn.addEventListener('click', function() {
            const listContainer = document.getElementById('list-container');
            const tasks = Array.from(listContainer.querySelectorAll('li')).filter(li => li.style.display !== 'none');
            const texts = tasks.map(li => li.querySelector('.task-text').textContent);
            const targetLang = langSelectAll.value;
            // Set all to 'Translating...'
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

    // Add translation UI
    const template = document.getElementById('task-translate-template');
    if (template) {
        const translationUI = template.content.cloneNode(true);
        li.appendChild(translationUI);
    }
    return li;
}

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

function clearAllTasks() {
    const listContainer = document.getElementById('list-container');
    const tasks = listContainer.querySelectorAll('li');
    
    tasks.forEach(task => {
        if (task.dataset.category === currentCategory) {
            deleteTask(task);
        }
    });
}

function switchCategory(category) {
    currentCategory = category;
    document.getElementById('personal').classList.toggle('active', category === 'personal');
    document.getElementById('professional').classList.toggle('active', category === 'professional');
    updateTaskVisibility();
}

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