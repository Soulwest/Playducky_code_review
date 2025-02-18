import Fastify from 'fastify';
//import {createClient} from '@clickhouse/client';
import {afterAll, beforeAll, describe, expect, test} from '@jest/globals';
import axios from 'axios';

const fastify = Fastify();
//const clickhouse = createClient({url: 'http://clickhouse:8123'});

beforeAll(async () => {
    await fastify.listen({port: 3000, host: '0.0.0.0'});
});

afterAll(async () => {
    await fastify.close();
});

describe('Click API', () => {
    test('POST /click should add a click', async () => {
        const response = await axios.post('http://localhost:3000/click', {userId: 'test-user', points: 5});
        expect(response.status).toBe(200);
        expect(response.data.success).toBe(true);
    });

    test('GET /leaderboard should return top users', async () => {
        const response = await axios.get('http://localhost:3000/leaderboard');
        expect(response.status).toBe(200);
        console.log(response.data);
        expect(Array.isArray(response.data.data)).toBe(true);
        //expect(response.data.length).toBeGreaterThan(0);
    });
});
