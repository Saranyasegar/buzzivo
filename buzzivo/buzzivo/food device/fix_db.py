import sqlite3

try:
    conn = sqlite3.connect('instance/restaurant_pager.db')
    cursor = conn.cursor()
    cursor.execute('ALTER TABLE "order" ADD COLUMN target_time DATETIME;')
    conn.commit()
    print('Column added successfully')
except Exception as e:
    print('Error:', e)
