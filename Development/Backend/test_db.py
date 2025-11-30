import psycopg2

# Try different ports and passwords
ports = ['5432', '5433', '5434']
passwords = ['123456', 'postgres', 'admin', 'root', '', 'sajilodocs']

for port in ports:
    for pwd in passwords:
        try:
            conn = psycopg2.connect(
                dbname='sajilodocs_db',
                user='postgres',
                password=pwd,
                host='localhost',
                port=port
            )
            print(f"SUCCESS! Port: {port}, Password: '{pwd}'")
            conn.close()
            exit(0)
        except Exception as e:
            pass

print("Failed all combinations")
