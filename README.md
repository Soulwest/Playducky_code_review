# Playducky code review
Code showcase for Playducky for Senior Backend Developer Typescript vacancy.


## Install and run
1. `docker-compose up --build`
2. Open and make API call `http://localhost:3000`

## Endpoints
- `POST /click` - add click (`{ userId, points }`)
- `GET /leaderboard` - return top 10 users with the highest points
- Tests: `npm test`
