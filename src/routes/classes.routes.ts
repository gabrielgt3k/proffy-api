import { Router } from 'express';
import db from '../database/connection';
import convertHourToMinutes from '../utils/ConvertHourtoMinutes';

const classesRouter = Router();

interface RequestFilters {
  subject: string;
  week_day: string;
  time: string;
}

interface ScheduleItem {
  week_day: string;
  from: string;
  to: string;
}

classesRouter.get('/', async (request, response) => {
  const filters = request.query;

  const { subject, week_day, time } = filters as Partial<RequestFilters>;

  if (!week_day || !subject || !time) {
    return response.status(400).json({
      error: 'Missing filters to search classes',
    });
  }

  const timeInMinutes = convertHourToMinutes(time as string);

  const classes = await db('classes')
    .whereExists(function () {
      this.select('class-schedule.*')
        .from('class-schedule')
        .whereRaw('`class-schedule`.`class_id` = `classes`.`id`')
        .whereRaw('`class-schedule`.`week_day` = ??', [Number(week_day)])
        .whereRaw('`class-schedule`.`from` <= ??', [timeInMinutes])
        .whereRaw('`class-schedule`.`to` > ??', [timeInMinutes]);
    })
    .where('classes.subject', '=', subject)
    .join('users', 'classes.user_id', '=', 'users.id')
    .select(['classes.*', 'users.*']);

  response.json(classes);
});

classesRouter.post('/', async (request, response) => {
  const { name, avatar, whatsapp, bio, subject, cost, schedule } = request.body;

  const trx = await db.transaction();

  try {
    const [user_id] = await trx('users').insert({
      name,
      avatar,
      whatsapp,
      bio,
    });

    const [class_id] = await trx('classes').insert({
      subject,
      cost,
      user_id,
    });

    const classSchedule = schedule.map((scheduleItem: ScheduleItem) => {
      return {
        class_id,
        week_day: scheduleItem.week_day,
        from: convertHourToMinutes(scheduleItem.from),
        to: convertHourToMinutes(scheduleItem.to),
      };
    });

    await trx('class-schedule').insert(classSchedule);

    await trx.commit();

    return response.status(201).send();
  } catch (error) {
    await trx.rollback();

    return response.status(400).json({
      error: 'Unexpected error while creating new class',
    });
  }
});

export default classesRouter;
