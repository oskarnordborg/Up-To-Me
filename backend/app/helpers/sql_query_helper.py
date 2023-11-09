def create_query(cursor, table, fields):
    return cursor.execute(f"INSERT INTO {table}({fields.keys()}) VALUES ({fields.values()})")
