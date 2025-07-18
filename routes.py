from flask import redirect, render_template, Blueprint, request, url_for, flash, jsonify, Request
from werkzeug.security import check_password_hash, generate_password_hash
from models import User, Task
from extensions import db
from sqlalchemy.exc import IntegrityError
from flask_login import login_user, login_required, logout_user, current_user
import requests

bp = Blueprint('main', __name__)

@bp.route("/")
@bp.route("/index")
@login_required
def index():
    """
    Render the main to-do list page for the logged-in user.
    """
    return render_template('index.html', name=current_user.first_name)

@bp.route('/login', methods=['GET', 'POST'])
def login():
    """
    Handle user login. On POST, validate credentials and log the user in.
    """
    if request.method == 'POST':
        email = request.form.get('Email')
        password = request.form.get('Password')
        remember = True if request.form.get('remember') else False

        user = User.query.filter_by(email=email).first()
        if user:
            if user.password_hash:
                if check_password_hash(user.password_hash, password):
                    login_user(user, remember=remember)
                    return redirect(url_for('main.index'))
                else:
                    flash('Invalid password. Please try again.')
            else:
                flash('User account is invalid. Please contact support.')
        else:
            flash('Email not found. Please check your login details and try again.')
    
    return render_template('login.html')

@bp.route('/sign-up', methods=['GET', 'POST'])
def sign_up():
    """
    Handle user registration. On POST, validate and create a new user.
    """
    if request.method == 'POST':
        first_name = request.form.get('First name')
        surname = request.form.get('Surname')
        email = request.form.get('Email')
        phone_number = request.form.get('Phone number')
        password = request.form.get('Password')
        confirm_password = request.form.get('Confirm password')

        # Input validation
        if not all([first_name, surname, email, phone_number, password, confirm_password]):
            flash('All fields are required', 'error')
            return render_template('sign-up.html')

        if password != confirm_password:
            flash('Passwords do not match', 'error')
            return render_template('sign-up.html')

        # Check if user already exists
        existing_user = User.query.filter((User.email == email) | (User.phone_number == phone_number)).first()
        if existing_user:
            if existing_user.email == email:
                flash('Email address already exists', 'error')
            elif existing_user.phone_number == phone_number:
                flash('Phone number already exists', 'error')
            return render_template('sign-up.html')

        # Create new user
        new_user = User(
            first_name=first_name,
            surname=surname,
            email=email,
            phone_number=phone_number,
            password_hash=generate_password_hash(password, method='pbkdf2:sha256')
        )

        try:
            db.session.add(new_user)
            db.session.commit()
            flash('Account created successfully. Please log in.', 'success')
            return redirect(url_for('main.login'))
        except IntegrityError as e:
            db.session.rollback()
            if "UNIQUE constraint failed: user.email" in str(e):
                flash('An account with this email already exists.', 'error')
            elif "UNIQUE constraint failed: user.phone_number" in str(e):
                flash('An account with this phone number already exists.', 'error')
            else:
                flash('An error occurred while creating your account. Please try again.', 'error')
            return render_template('sign-up.html')
        except Exception as e:
            db.session.rollback()
            flash('An unexpected error occurred. Please try again.', 'error')
            return render_template('sign-up.html')

    return render_template('sign-up.html')

@bp.route('/about')
@login_required
def about():
    """
    Render the about page for the logged-in user.
    """
    return render_template('about.html', name=current_user.first_name)

@bp.route('/contact')
@login_required
def contact_us():
    """
    Render the contact page for the logged-in user.
    """
    return render_template('contact.html', name=current_user.first_name)

@bp.route('/logout')
@login_required
def logout():
    """
    Log out the current user and redirect to login page.
    """
    logout_user()
    return redirect(url_for('main.login'))

@bp.route('/tasks', methods=['GET'])
@login_required
def get_tasks():
    """
    Return all tasks for the current user as JSON.
    """
    tasks = Task.query.filter_by(author=current_user).all()
    return jsonify([task.to_dict() for task in tasks])

@bp.route('/tasks', methods=['POST'])
@login_required
def create_task():
    """
    Create a new task for the current user from JSON data.
    """
    data = request.json
    task = Task(
        description=data['description'],
        category=data['category'],
        completed=data.get('completed', False),
        author=current_user
    )
    db.session.add(task)
    db.session.commit()
    return jsonify(task.to_dict()), 201

@bp.route('/tasks/<int:task_id>', methods=['PUT'])
@login_required
def update_task(task_id):
    """
    Update a task's fields (description, category, completed) for the current user.
    """
    task = Task.query.get_or_404(task_id)
    if task.author != current_user:
        return jsonify({'error': 'Unauthorized'}), 403
    data = request.json
    task.description = data.get('description', task.description)
    task.category = data.get('category', task.category)
    task.completed = data.get('completed', task.completed)
    db.session.commit()
    return jsonify(task.to_dict())

@bp.route('/tasks/<int:task_id>', methods=['DELETE'])
@login_required
def delete_task(task_id):
    """
    Delete a task for the current user.
    """
    task = Task.query.get_or_404(task_id)
    if task.author != current_user:
        return jsonify({'error': 'Unauthorized'}), 403
    db.session.delete(task)
    db.session.commit()
    return '', 204

@bp.route('/translate', methods=['POST'])
@login_required
def translate():
    """
    Batch or single translation endpoint using Google Translate API.
    Accepts JSON with 'texts' (list) or 'text' (string) and 'target_lang'.
    Returns translated text(s).
    """
    data = request.json
    texts = data.get('texts')
    target_lang = data.get('target_lang')
    if texts and isinstance(texts, list) and target_lang:
        translations = []
        for text in texts:
            try:
                response = requests.get(
                    "https://translate.googleapis.com/translate_a/single",
                    params={
                        "client": "gtx",
                        "sl": "auto",  # auto-detect source language
                        "tl": target_lang,
                        "dt": "t",
                        "q": text
                    },
                    timeout=10
                )
                response.raise_for_status()
                # The response is a deeply nested list
                translated = response.json()[0][0][0]
                translations.append(translated)
            except Exception as e:
                translations.append(None)
        return jsonify({'translations': translations})
    # Single translation fallback
    text = data.get('text')
    if text and target_lang:
        try:
            response = requests.get(
                "https://translate.googleapis.com/translate_a/single",
                params={
                    "client": "gtx",
                    "sl": "auto",
                    "tl": target_lang,
                    "dt": "t",
                    "q": text
                },
                timeout=10
            )
            response.raise_for_status()
            translated = response.json()[0][0][0]
            return jsonify({'translated': translated})
        except Exception as e:
            return jsonify({'error': 'Translation failed', 'details': str(e)}), 500
    return jsonify({'error': 'Missing text(s) or target language'}), 400