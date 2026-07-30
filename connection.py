import sqlite3 as sql

def get_connection():
  conn = sql.connect('wine_database.db')
  return conn

