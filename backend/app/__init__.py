import os

from dotenv import load_dotenv

load_dotenv()

db_connection_params = {
    "dbname": os.environ["DB_NAME"],
    "user": os.environ["DB_USERNAME"],
    "password": os.environ["DB_PASSWORD"],
    "host": os.environ["DB_HOST"],
    "port": os.environ["DB_PORT"],
}
