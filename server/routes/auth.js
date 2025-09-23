const express = require('express');
const { User } = require('../models');
const { generateToken, authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({ error: '이메일, 비밀번호, 이름을 모두 입력해주세요.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: '비밀번호는 최소 6자 이상이어야 합니다.' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: '이미 등록된 이메일입니다.' });
    }

    // Create user
    const user = await User.create({ email, password, name });
    const token = generateToken(user.id);

    res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: '회원가입 중 오류가 발생했습니다.' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' });
    }

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    // Check password
    const isValidPassword = await user.checkPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    }

    const token = generateToken(user.id);

    res.json({
      message: '로그인되었습니다.',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: '로그인 중 오류가 발생했습니다.' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
    },
  });
});

module.exports = router;
