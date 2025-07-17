# softkom-todo-app
A simple, efficient todo application built with Flask.

Description:

This Todo App allows users to create, manage, and organize their tasks efficiently. It's built using Flask, a lightweight WSGI web application framework in Python.

Features:

1.Create, read, update, and delete tasks
2.Organize tasks into categories
3.Mark tasks as complete
4.User authentication and personalized todo lists

Installation

1.Clone the repository:
git clone https://github.com/<your-username>/todo-app.git
cd todo-app

2.Create a virtual environment and activate it:
python -m venv env
source env/bin/activate  # On Windows, use `env\Scripts\activate`

3.Install the required packages:
pip install -r requirements.txt

4.Set up the database:
flask db upgrade

5.flask run

Usage

After starting the application, navigate to http://localhost:5000 in your web browser. You can create an account, log in, and start managing your todos.


Project Structure

app.py: The main application file
config.py: Configuration settings
models.py: Database models
routes.py: Application routes
extensions.py: Flask extensions
migrations/: Database migration files
static/: Static files (CSS, JavaScript, etc.)
templates/: HTML templates