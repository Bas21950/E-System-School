import { Router } from 'express';
import { list, getOne, create, update, remove } from './education-levels.controller';

const router = Router();

router.get('/', list);
router.get('/:id', getOne);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);

export default router;
