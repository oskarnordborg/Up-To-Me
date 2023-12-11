tables = [
    """CREATE TABLE appuser (
        idappuser serial PRIMARY KEY,
        createdtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        external_id VARCHAR(256),
        onesignal_id VARCHAR(256) DEFAULT NULL,
        username VARCHAR ( 256 ) DEFAULT '',
        email VARCHAR ( 256 ) DEFAULT '',
        firstname VARCHAR ( 256 ) DEFAULT '',
        lastname VARCHAR ( 256 ) DEFAULT '',
        is_admin BOOLEAN DEFAULT FALSE,
        deleted BOOL DEFAULT FALSE
    );
    """,
    """CREATE TABLE friendship (
        idfriendship SERIAL PRIMARY KEY,
        createdtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted BOOL DEFAULT FALSE,
        appuser1 INT REFERENCES appuser(idappuser),
        appuser2 INT REFERENCES appuser(idappuser),
        accepted BOOL DEFAULT FALSE
    );
    """,
    """CREATE TABLE card (
        idcard serial PRIMARY KEY,
        createdtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        createdby INT REFERENCES appuser(idappuser),
        updatedtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedby INT REFERENCES appuser(idappuser),
        appuser INT REFERENCES appuser(idappuser),
        title VARCHAR ( 256 ) DEFAULT '',
        description VARCHAR ( 2048 ) DEFAULT '',
        deleted BOOL DEFAULT FALSE
    );""",
    """CREATE TABLE deck (
        iddeck serial PRIMARY KEY,
        createdtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        createdby INT REFERENCES appuser(idappuser),
        updatedtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedby INT REFERENCES appuser(idappuser),
        appuser INT REFERENCES appuser(idappuser),
        title VARCHAR ( 256 ) DEFAULT '',
        description VARCHAR ( 2048 ) DEFAULT '',
        deleted BOOL DEFAULT FALSE
    );""",
    """CREATE TABLE card_deck (
        idcard_deck serial PRIMARY KEY,
        createdtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        createdby INT REFERENCES appuser(idappuser),
        updatedtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedby INT REFERENCES appuser(idappuser),
        appuser INT REFERENCES appuser(idappuser) ON DELETE CASCADE,
        card INT REFERENCES card(idcard),
        deck INT REFERENCES deck(iddeck) ON DELETE CASCADE,
        wildcard BOOL DEFAULT FALSE,
        deleted BOOL DEFAULT FALSE
    );""",
    """CREATE TABLE game (
        idgame serial PRIMARY KEY,
        createdtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        createdby INT REFERENCES appuser(idappuser),
        updatedtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedby INT REFERENCES appuser(idappuser),
        appuser INT REFERENCES appuser(idappuser) ON DELETE CASCADE,
        deck INT REFERENCES deck(iddeck) ON DELETE CASCADE,
        deleted BOOL DEFAULT FALSE
    );""",
    """CREATE TABLE game_appuser (
        idgame_appuser serial PRIMARY KEY,
        createdtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        createdby INT REFERENCES appuser(idappuser),
        updatedtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedby INT REFERENCES appuser(idappuser),
        appuser INT REFERENCES appuser(idappuser) ON DELETE CASCADE,
        game INT REFERENCES game(idgame) ON DELETE CASCADE,
        accepted BOOL DEFAULT FALSE,
        deleted BOOL DEFAULT FALSE
    );""",
    """CREATE TABLE game_card (
        idgame_card serial PRIMARY KEY,
        createdtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        createdby INT REFERENCES appuser(idappuser),
        updatedtime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedby INT REFERENCES appuser(idappuser),
        card INT REFERENCES card(idcard),
        game INT REFERENCES game(idgame) ON DELETE CASCADE,
        player INT REFERENCES appuser(idappuser),
        performer INT REFERENCES appuser(idappuser) ON DELETE CASCADE,
        wildcard BOOLEAN DEFAULT FALSE,
        title VARCHAR ( 256 ) DEFAULT '',
        description VARCHAR ( 2048 ) DEFAULT '',
        played_time TIMESTAMP,
        finished_time TIMESTAMP,
        deleted BOOL DEFAULT FALSE
    );""",
]
