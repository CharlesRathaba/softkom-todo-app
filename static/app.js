// --- Firebase Config & Initialization ---
// TODO: Replace with your Firebase config from the Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyAzF6rMmBotA7NjZeR7RG2tWl8bDc-_B1k",
    authDomain: "softkom-todo-app.firebaseapp.com",
    projectId: "softkom-todo-app",
    storageBucket: "softkom-todo-app.firebasestorage.app",
    messagingSenderId: "667613672262",
    appId: "1:667613672262:web:89b4df9c0b3c5fce636b47"
  };

// TODO: Load Firebase SDKs via CDN in index.html before this script
// Example:
// <script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js"></script>
// <script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js"></script>

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- DOM Elements ---
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userInfo = document.getElementById('user-info');
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const languageSelect = document.getElementById('language-select');

let currentUser = null;

// --- Auth Logic ---
loginBtn.addEventListener('click', () => {
    const email = prompt('Enter email:');
    const password = prompt('Enter password:');
    if (!email || !password) return;
    auth.signInWithEmailAndPassword(email, password)
        .catch(err => {
            if (err.code === 'auth/user-not-found') {
                // Register new user
                auth.createUserWithEmailAndPassword(email, password)
                    .catch(e => alert('Error: ' + e.message));
            } else {
                alert('Error: ' + err.message);
            }
        });
});

logoutBtn.addEventListener('click', () => {
    auth.signOut();
});

function updateUserUI(user) {
    if (user) {
        userInfo.textContent = `Logged in as: ${user.email}`;
        loginBtn.classList.add('hidden');
        logoutBtn.classList.remove('hidden');
        todoForm.classList.remove('hidden');
        loadTodos();
    } else {
        userInfo.textContent = '';
        loginBtn.classList.remove('hidden');
        logoutBtn.classList.add('hidden');
        todoForm.classList.add('hidden');
        todoList.innerHTML = '';
    }
}

auth.onAuthStateChanged(user => {
    currentUser = user;
    updateUserUI(user);
});

// --- To-Do CRUD Logic ---
function renderTodos(todos) {
    todoList.innerHTML = '';
    todos.forEach(doc => {
        const todo = doc.data();
        const li = document.createElement('li');
        li.className = 'flex items-center justify-between mb-2 p-2 border rounded';
        li.innerHTML = `
            <span class="${todo.completed ? 'line-through text-gray-400' : ''}">${todo.text}</span>
            <div>
                <button class="bg-blue-400 text-white px-2 py-1 rounded mr-2" data-id="${doc.id}" data-action="translate">🌐</button>
                <button class="bg-green-500 text-white px-2 py-1 rounded mr-2" data-id="${doc.id}" data-action="complete">✔</button>
                <button class="bg-red-500 text-white px-2 py-1 rounded" data-id="${doc.id}" data-action="delete">🗑</button>
            </div>
        `;
        todoList.appendChild(li);
    });
}

function loadTodos() {
    if (!currentUser) return;
    db.collection('todos')
        .where('uid', '==', currentUser.uid)
        .orderBy('created', 'desc')
        .onSnapshot(snapshot => {
            renderTodos(snapshot.docs);
        });
}

todoForm.addEventListener('submit', e => {
    e.preventDefault();
    const text = todoInput.value.trim();
    if (!text || !currentUser) return;
    db.collection('todos').add({
        text,
        completed: false,
        uid: currentUser.uid,
        created: firebase.firestore.FieldValue.serverTimestamp()
    });
    todoInput.value = '';
});

todoList.addEventListener('click', e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    const action = btn.getAttribute('data-action');
    if (action === 'complete') {
        db.collection('todos').doc(id).update({ completed: true });
    } else if (action === 'delete') {
        db.collection('todos').doc(id).delete();
    } else if (action === 'translate') {
        handleTranslate(id);
    }
});

// --- Translation Logic ---
function handleTranslate(todoId) {
    const lang = languageSelect.value;
    db.collection('todos').doc(todoId).get().then(doc => {
        const todo = doc.data();
        if (!todo) return;
        translateTodo(todo.text, lang, translated => {
            alert(`Translation: ${translated}`);
        });
    });
}

function translateTodo(text, targetLang, callback) {
    fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, target_lang: targetLang })
    })
    .then(res => res.json())
    .then(data => {
        callback(data.translated_text);
    })
    .catch(() => {
        alert('Translation failed.');
    });
}

// --- Initialization ---
window.onload = function() {
    // Hide form until user is logged in
    todoForm.classList.add('hidden');
}; 