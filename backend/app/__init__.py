import os

from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = "postgresql+psycopg2://{}:{}@{}/{}".format(
    os.environ["DB_USERNAME"],
    os.environ["DB_PASSWORD"],
    os.environ["DB_HOST"],
    os.environ["DB_NAME"],
)

db_connection_params = {
    "dbname": os.environ["DB_NAME"],
    "user": os.environ["DB_USERNAME"],
    "password": os.environ["DB_PASSWORD"],
    "host": os.environ["DB_HOST"],
    "port": os.environ["DB_PORT"],
}
