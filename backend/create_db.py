import asyncio
import asyncpg

async def main():
    # Connect to the default 'postgres' database
    conn = await asyncpg.connect('postgresql://postgres:postgres@localhost:5432/postgres')
    # Create the target database
    try:
        await conn.execute('CREATE DATABASE prepagent')
        print("Database 'prepagent' created successfully.")
    except asyncpg.exceptions.DuplicateDatabaseError:
        print("Database 'prepagent' already exists.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await conn.close()

if __name__ == '__main__':
    asyncio.run(main())
