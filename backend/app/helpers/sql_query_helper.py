def create_query(table, fields):
    return f"INSERT INTO {table}({fields.keys()}) VALUES ({fields.values()})"
