# Backend Setup Instructions

## Prerequisites
- Python 3.x
- MySQL Server running on localhost:3306

## Database Setup
1.  Create a MySQL database named `documanage_db`.
    ```sql
    CREATE DATABASE documanage_db;
    ```
2.  Ensure you have a user `root` with no password, OR update `Backend/settings.py` with your MySQL credentials:
    ```python
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': 'documanage_db',
            'USER': 'your_username',
            'PASSWORD': 'your_password',
            'HOST': 'localhost',
            'PORT': '3306',
        }
    }
    ```

## Running the Server
1.  Navigate to the `Backend` directory:
    ```bash
    cd Backend
    ```
2.  Install dependencies (if not already done):
    ```bash
    pip install django djangorestframework django-cors-headers mysqlclient python-dotenv
    ```
3.  Run migrations:
    ```bash
    python manage.py migrate
    ```
4.  Start the server:
    ```bash
    python manage.py runserver
    ```

## API Endpoints
- **Auth**: `/api/auth/register/`, `/api/auth/login/`
- **Folders**: `/api/folders/`
- **Files**: `/api/files/`
- **Shares**: `/api/shares/folder/`, `/api/shares/file/`
- **Notifications**: `/api/notifications/`
