from flask import Flask
from config import Config
from extensions import db, migrate, login_manager
from models import db

def create_app():
    """
    Application factory for the Softkom Todo App.
    Sets up Flask app, loads config, initializes extensions, and registers blueprints.
    """
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize Flask extensions
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    login_manager.login_view = 'main.login' 

    with app.app_context():
        from routes import bp as routes_bp
        app.register_blueprint(routes_bp)
        # Uncomment the next line to create tables on first run, then comment again
        # db.create_all()

    return app

@login_manager.user_loader
def load_user(user_id):
    """
    Flask-Login user loader callback.
    Returns a User object given a user_id.
    """
    from models import User
    return User.query.get(int(user_id))

if __name__ == '__main__':
    # For local development/testing
    app = create_app()
    app.run(debug=True)