import { Router } from 'express';
import db from '../database/connection';

const connectionsRoutes = Router();

connectionsRoutes.get('/', async (request, response) => {
  const [totalConnections] = await db('connections').count('* as total');

  const { total } = totalConnections;

  return response.json({ total });
});

connectionsRoutes.post('/', async (request, response) => {
  const { user_id } = request.body;

  await db('connections').insert({
    user_id,
  });

  return response.status(201).send();
});

export default connectionsRoutes;
