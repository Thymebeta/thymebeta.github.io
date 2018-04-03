from aiofiles import open as open_async
from asyncpg import create_pool


class DatabasePool:
    USERNAME = 'postgres'
    PASSWORD = 'postgres'

    def __init__(self):
        self.pool = None
        self.acquire = lambda: None

    async def register_db(self, _, loop):
        if self.PASSWORD is None:
            self.pool = await create_pool(user=self.USERNAME, loop=loop, max_size=1000)
        else:
            self.pool = await create_pool(user=self.USERNAME, password=self.PASSWORD, loop=loop, max_size=1000)
        self.acquire = self.pool.acquire

        await self.populate_db()

    async def populate_db(self):
        async with open_async('schema.txt') as _file:
            schema = await _file.read()

        async with self.acquire() as con:
            await con.execute(schema)
