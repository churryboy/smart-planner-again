const express = require('express');
const { Todo } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all todos for user
router.get('/', async (req, res) => {
  try {
    const todos = await Todo.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
    });

    res.json(todos);
  } catch (error) {
    console.error('Get todos error:', error);
    res.status(500).json({ error: '할 일을 불러오는 중 오류가 발생했습니다.' });
  }
});

// Create new todo
router.post('/', async (req, res) => {
  try {
    const { title, description, due_date, priority } = req.body;

    if (!title) {
      return res.status(400).json({ error: '제목은 필수입니다.' });
    }

    const todo = await Todo.create({
      title,
      description,
      due_date,
      priority: priority || 'medium',
      user_id: req.user.id,
    });

    res.status(201).json({
      message: '할 일이 추가되었습니다.',
      todo,
    });
  } catch (error) {
    console.error('Create todo error:', error);
    res.status(500).json({ error: '할 일 추가 중 오류가 발생했습니다.' });
  }
});

// Update todo
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const todo = await Todo.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!todo) {
      return res.status(404).json({ error: '할 일을 찾을 수 없습니다.' });
    }

    await todo.update(updateData);

    res.json({
      message: '할 일이 수정되었습니다.',
      todo,
    });
  } catch (error) {
    console.error('Update todo error:', error);
    res.status(500).json({ error: '할 일 수정 중 오류가 발생했습니다.' });
  }
});

// Delete todo
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const todo = await Todo.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!todo) {
      return res.status(404).json({ error: '할 일을 찾을 수 없습니다.' });
    }

    await todo.destroy();

    res.json({ message: '할 일이 삭제되었습니다.' });
  } catch (error) {
    console.error('Delete todo error:', error);
    res.status(500).json({ error: '할 일 삭제 중 오류가 발생했습니다.' });
  }
});

module.exports = router;
