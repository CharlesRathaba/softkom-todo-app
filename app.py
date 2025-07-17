from flask import Flask
from config import Config
from extensions import db, migrate, login_manager
from models import db

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    login_manager.login_view = 'main.login' 

    with app.app_context():
        from routes import bp as routes_bp
        app.register_blueprint(routes_bp)
        #db.create_all()

    return app

@login_manager.user_loader
def load_user(user_id):
    from models import User
    return User.query.get(int(user_id))

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)