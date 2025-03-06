// middleware/validation.js
import { body, validationResult } from 'express-validator';

const botValidationRules = () => {
  return [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('rank').isInt({ min: 0 }).withMessage('Rank must be a positive number')
  ];
};

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Custom error handler
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Using validation in routes
router.post('/', botValidationRules(), validate, async (req, res) => {
  try {
    // Your route logic here
  } catch (err) {
    next(new AppError('Failed to create bot', 500));
  }
});