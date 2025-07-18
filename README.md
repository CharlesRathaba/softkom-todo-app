# softkom-todo-app
A simple, efficient todo application built with Flask.

Description:

This Todo App allows users to create, manage, and organize their tasks efficiently. It's built using Flask, a lightweight WSGI web application framework in Python.

Features:

1.Create, read, update, and delete tasks
2.Organize tasks into categories
3.Mark tasks as complete
4.User authentication and personalized todo lists
5.Translate all visible tasks into a language of the user's choice.

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

- Set the `DATABASE_URI` environment variable to your database connection string. For example, if you are using Neon or another Postgres provider, your connection string will look like:

  ```
  export DATABASE_URI=postgresql://<username>:<password>@<host>/<database>
  ```
  On Windows (Command Prompt):
  ```
  set DATABASE_URI=postgresql://<username>:<password>@<host>/<database>
  ```

- In `app.py`, temporarily uncomment the line with `db.create_all()` inside the `create_app()` function. Run the app once (e.g., with `flask run` or `python app.py`) to create the tables in your database. After the tables are created, comment the `db.create_all()` line again to avoid recreating tables on every start.

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

api/: Vercel hosting
