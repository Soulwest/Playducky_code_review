import Fastify from 'fastify';
import {createClient} from '@clickhouse/client';

const fastify = Fastify();
const clickhouse = createClient({url: 'http://clickhouse:8123'});

const secondsPerUniqClick = 3;

// Initialize the database
async function initDB() {
    await clickhouse.query({
        query: `
            CREATE TABLE IF NOT EXISTS clicks (
                userId String,
                points Int32 DEFAULT 1,
                createdAt DateTime DEFAULT now() 
            ) ENGINE = MergeTree()
            ORDER BY (userId, createdAt);
        `,
        format: 'JSON',
    });
    // DateTime64(3) if we want to use milliseconds
}

fastify.post('/click', async (request, reply) => {
    const {userId, points = 1} = request.body as { userId: string; points?: number };
    if (!userId)
        return reply.status(400).send({error: 'userId is required'});

    try {
        await clickhouse.insert({
            table: 'clicks',
            values: [{userId, points}],
            format: 'JSONEachRow',
        });
        reply.send({success: true});
    } catch (error) {
        console.error('Error inserting click:', error);
        //TODO: save click to a file or a queue for later processing
        reply.status(500).send({error: 'Failed to insert click'});
    }
});
fastify.get('/leaderboard', async (_, reply) => {
    try {
        // Query example. In real life we would use a materialized view for time_div for avoiding the division on each query
        // Here I make the division to show how to use an adjustable var (secondsPerUniqClick) in the query
        const result = await clickhouse.query({
            query: `
                SELECT userId, sum(points) AS totalPoints
                FROM (
                    SELECT userId, points, toUnixTimestamp(createdAt) / {secondsPerUniqClick: Int32} as time_div
                    FROM clicks
                    Group by userId, points, time_div
                ) AS t
                GROUP BY userId
                ORDER BY totalPoints DESC
                LIMIT 10
            `,
            format: 'JSON',
            query_params: {
                secondsPerUniqClick: secondsPerUniqClick
            },
        });
        reply.send(await result.json()); // send full results to the client, here we may filter outgoing data
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        reply.status(500).send({error: 'Failed to fetch leaderboard'});
    }
});

const start = async () => {
    await initDB();
    await fastify.listen({port: 3000, host: '0.0.0.0'});
};

start().catch(console.error);
