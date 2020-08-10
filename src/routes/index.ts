import { Router } from 'express';
import classesRouter from './classes.routes';
import connectionsRoutes from './connections.routes';

const routes = Router();
routes.use('/classes', classesRouter);
routes.use('/connections', connectionsRoutes);

export default routes;
