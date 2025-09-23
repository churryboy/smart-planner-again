const express = require('express');
const { Event } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all events for user
router.get('/', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let whereClause = { user_id: req.user.id };
    
    if (start_date && end_date) {
      whereClause.start_date = {
        [require('sequelize').Op.between]: [start_date, end_date]
      };
    }

    const events = await Event.findAll({
      where: whereClause,
      order: [['start_date', 'ASC']],
    });

    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: '일정을 불러오는 중 오류가 발생했습니다.' });
  }
});

// Create new event
router.post('/', async (req, res) => {
  try {
    const {
      title,
      description,
      start_date,
      end_date,
      start_time,
      end_time,
      priority,
      reminder,
      color
    } = req.body;

    if (!title || !start_date || !end_date) {
      return res.status(400).json({ error: '제목, 시작일, 종료일은 필수입니다.' });
    }

    const event = await Event.create({
      title,
      description,
      start_date,
      end_date,
      start_time,
      end_time,
      priority: priority || 'medium',
      reminder,
      color: color || '#3B82F6',
      user_id: req.user.id,
    });

    res.status(201).json({
      message: '일정이 성공적으로 추가되었습니다.',
      event,
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: '일정 추가 중 오류가 발생했습니다.' });
  }
});

// Update event
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const event = await Event.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!event) {
      return res.status(404).json({ error: '일정을 찾을 수 없습니다.' });
    }

    await event.update(updateData);

    res.json({
      message: '일정이 수정되었습니다.',
      event,
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: '일정 수정 중 오류가 발생했습니다.' });
  }
});

// Delete event
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!event) {
      return res.status(404).json({ error: '일정을 찾을 수 없습니다.' });
    }

    await event.destroy();

    res.json({ message: '일정이 삭제되었습니다.' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: '일정 삭제 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
