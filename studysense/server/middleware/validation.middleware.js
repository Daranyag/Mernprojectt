const { sendError } = require('../utils/response.utils');

/**
 * Validate registration request body
 */
const validateRegister = (req, res, next) => {
  const { name, email, password, confirmPassword } = req.body;
  const errors = {};

  // Name validation
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.name = 'Full name is required';
  } else if (name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  } else if (name.trim().length > 60) {
    errors.name = 'Name cannot exceed 60 characters';
  }

  // Email validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.email = 'Email address is required';
  } else if (!emailRegex.test(email.trim())) {
    errors.email = 'Please provide a valid email address';
  }

  // Password validation
  if (!password || typeof password !== 'string') {
    errors.password = 'Password is required';
  } else if (password.length < 8) {
    errors.password = 'Password must be at least 8 characters long';
  } else if (password.length > 128) {
    errors.password = 'Password cannot exceed 128 characters';
  }

  // Password confirmation check (if provided in payload)
  if (confirmPassword !== undefined && password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  if (Object.keys(errors).length > 0) {
    return sendError(res, 400, 'Invalid input provided. Please check the fields.', errors);
  }

  // Normalize fields on request object
  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();

  next();
};

/**
 * Validate login request body
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = {};

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.email = 'Email address is required';
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.password = 'Password is required';
  }

  if (Object.keys(errors).length > 0) {
    return sendError(res, 400, 'Please provide both email and password', errors);
  }

  // Normalize email
  req.body.email = email.trim().toLowerCase();

  next();
};

const mongoose = require('mongoose');
const { TOPIC_STATUSES, TOPIC_PRIORITIES } = require('../models/Topic');

/**
 * Validate MongoDB ObjectId in route params
 */
const validateObjectId = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return sendError(res, 400, `Invalid ID format for parameter '${paramName}': ${id}`);
    }
    next();
  };
};

/**
 * Validate Subject creation/update payload
 */
const validateSubject = (req, res, next) => {
  const { name, description, color } = req.body;
  const errors = {};

  if (name !== undefined) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.name = 'Subject name is required';
    } else if (name.trim().length < 2) {
      errors.name = 'Subject name must be at least 2 characters';
    } else if (name.trim().length > 80) {
      errors.name = 'Subject name cannot exceed 80 characters';
    } else {
      req.body.name = name.trim();
    }
  } else if (req.method === 'POST') {
    errors.name = 'Subject name is required';
  }

  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') {
      errors.description = 'Description must be text';
    } else if (description.trim().length > 2000) {
      errors.description = 'Description / Syllabus cannot exceed 2000 characters';
    } else {
      req.body.description = description.trim();
    }
  }

  if (color !== undefined && color !== null && color !== '') {
    const hexRegex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
    if (!hexRegex.test(color.trim())) {
      errors.color = 'Color must be a valid hex code (e.g. #3b82f6)';
    } else {
      req.body.color = color.trim().toLowerCase();
    }
  }

  if (Object.keys(errors).length > 0) {
    return sendError(res, 400, 'Invalid subject data', errors);
  }

  next();
};

/**
 * Validate Topic creation/update payload
 */
const validateTopic = (req, res, next) => {
  const { title, description, status, priority } = req.body;
  const errors = {};

  if (title !== undefined) {
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      errors.title = 'Topic title is required';
    } else if (title.trim().length < 2) {
      errors.title = 'Topic title must be at least 2 characters';
    } else if (title.trim().length > 120) {
      errors.title = 'Topic title cannot exceed 120 characters';
    } else {
      req.body.title = title.trim();
    }
  } else if (req.method === 'POST') {
    errors.title = 'Topic title is required';
  }

  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') {
      errors.description = 'Description must be text';
    } else if (description.trim().length > 500) {
      errors.description = 'Description cannot exceed 500 characters';
    } else {
      req.body.description = description.trim();
    }
  }

  if (status !== undefined) {
    if (!TOPIC_STATUSES.includes(status)) {
      errors.status = `Status must be one of: ${TOPIC_STATUSES.join(', ')}`;
    }
  }

  if (priority !== undefined) {
    if (!TOPIC_PRIORITIES.includes(priority)) {
      errors.priority = `Priority must be one of: ${TOPIC_PRIORITIES.join(', ')}`;
    }
  }

  if (Object.keys(errors).length > 0) {
    return sendError(res, 400, 'Invalid topic data', errors);
  }

  next();
};

const { MATERIAL_TYPES } = require('../models/StudyMaterial');

/**
 * Validate StudyMaterial creation/update payload
 */
const validateMaterial = (req, res, next) => {
  const { type, title, subject, topic, content, url, tags, isFavorite, isReviewed } = req.body;
  const errors = {};

  // Type validation
  if (req.method === 'POST') {
    if (!type || !MATERIAL_TYPES.includes(type)) {
      errors.type = 'Material type is required and must be either "note", "resource", or "pdf"';
    }
    if (!subject || !mongoose.Types.ObjectId.isValid(subject)) {
      errors.subject = 'A valid Subject ID is required';
    }
  } else if (type !== undefined && !MATERIAL_TYPES.includes(type)) {
    errors.type = 'Material type must be either "note", "resource", or "pdf"';
  }

  // Subject validation on update
  if (subject !== undefined && (!subject || !mongoose.Types.ObjectId.isValid(subject))) {
    errors.subject = 'Subject ID must be a valid MongoDB ObjectId';
  }

  // Topic validation (allows valid ObjectId, string topic name to create/find, or null)
  if (topic !== undefined && topic !== null && topic !== '') {
    if (!mongoose.Types.ObjectId.isValid(topic) && (typeof topic !== 'string' || topic.trim().length < 2)) {
      errors.topic = 'Topic must be a valid ID or a valid topic name (at least 2 characters)';
    }
  }

  // Title validation
  if (title !== undefined) {
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      errors.title = 'Material title is required';
    } else if (title.trim().length < 2) {
      errors.title = 'Title must be at least 2 characters';
    } else if (title.trim().length > 140) {
      errors.title = 'Title cannot exceed 140 characters';
    } else {
      req.body.title = title.trim();
    }
  } else if (req.method === 'POST') {
    errors.title = 'Material title is required';
  }

  // Determine effective material type
  const effectiveType = type || req.existingMaterial?.type;

  // Content validation: Note requires usable content, pdf can have optional extracted content
  if (effectiveType === 'note') {
    if (content !== undefined) {
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        errors.content = 'Note content is required';
      } else if (content.length > 20000) {
        errors.content = 'Note content cannot exceed 20,000 characters';
      } else {
        req.body.content = content.trim();
      }
    } else if (req.method === 'POST') {
      errors.content = 'Note content is required';
    }
  }

  // URL validation: Resource requires valid HTTP/HTTPS URL
  if (effectiveType === 'resource') {
    if (url !== undefined) {
      if (!url || typeof url !== 'string' || !/^https?:\/\/.+/i.test(url.trim())) {
        errors.url = 'Resource requires a valid web URL starting with http:// or https://';
      } else if (url.trim().length > 2000) {
        errors.url = 'URL cannot exceed 2000 characters';
      } else {
        req.body.url = url.trim();
      }
    } else if (req.method === 'POST') {
      errors.url = 'Resource requires a valid web URL';
    }
  }

  // PDF validation
  if (effectiveType === 'pdf') {
    if (content !== undefined && typeof content === 'string') {
      req.body.content = content.trim().slice(0, 20000);
    }
  }

  // Tags validation
  if (tags !== undefined && !Array.isArray(tags)) {
    errors.tags = 'Tags must be an array of strings';
  }

  if (Object.keys(errors).length > 0) {
    return sendError(res, 400, 'Invalid study material data', errors);
  }

  next();
};

const { QUESTION_DIFFICULTIES } = require('../models/Question');

/**
 * Validate Question creation/update payload
 */
const validateQuestion = (req, res, next) => {
  const { questionText, subject, topic, options, correctOptionId, explanation, difficulty, tags } = req.body;
  const errors = {};

  // Subject is required on POST
  if (req.method === 'POST') {
    if (!subject || !mongoose.Types.ObjectId.isValid(subject)) {
      errors.subject = 'A valid Subject ID is required';
    }
    if (!questionText || typeof questionText !== 'string' || questionText.trim().length === 0) {
      errors.questionText = 'Question text is required';
    }
  }

  if (subject !== undefined && (!subject || !mongoose.Types.ObjectId.isValid(subject))) {
    errors.subject = 'Subject ID must be a valid MongoDB ObjectId';
  }

  if (topic !== undefined && topic !== null && topic !== '') {
    if (!mongoose.Types.ObjectId.isValid(topic)) {
      errors.topic = 'Topic ID must be a valid MongoDB ObjectId';
    }
  }

  if (questionText !== undefined) {
    if (!questionText || typeof questionText !== 'string' || questionText.trim().length === 0) {
      errors.questionText = 'Question text cannot be empty';
    } else if (questionText.trim().length < 5) {
      errors.questionText = 'Question text must be at least 5 characters long';
    } else if (questionText.trim().length > 2000) {
      errors.questionText = 'Question text cannot exceed 2000 characters';
    } else {
      req.body.questionText = questionText.trim();
    }
  }

  // Options validation
  if (options !== undefined) {
    if (!Array.isArray(options) || options.length < 2) {
      errors.options = 'At least 2 options are required';
    } else if (options.length > 8) {
      errors.options = 'Cannot have more than 8 options';
    } else {
      const optionIds = new Set();
      for (let i = 0; i < options.length; i++) {
        const opt = options[i];
        if (!opt || typeof opt !== 'object') {
          errors.options = `Option ${i + 1} is invalid`;
          break;
        }
        if (!opt.id || typeof opt.id !== 'string' || opt.id.trim().length === 0) {
          errors.options = `Option ${i + 1} must have a unique non-empty ID`;
          break;
        }
        if (!opt.text || typeof opt.text !== 'string' || opt.text.trim().length === 0) {
          errors.options = `Option ${i + 1} text cannot be empty`;
          break;
        }
        if (opt.text.trim().length > 400) {
          errors.options = `Option ${i + 1} text cannot exceed 400 characters`;
          break;
        }
        if (optionIds.has(opt.id.trim())) {
          errors.options = `Option ID "${opt.id.trim()}" is duplicated`;
          break;
        }
        optionIds.add(opt.id.trim());
      }
    }
  } else if (req.method === 'POST') {
    errors.options = 'Options array with at least 2 options is required';
  }

  // Correct option validation
  if (correctOptionId !== undefined) {
    if (!correctOptionId || typeof correctOptionId !== 'string' || correctOptionId.trim().length === 0) {
      errors.correctOptionId = 'Correct option ID is required';
    } else if (options && Array.isArray(options)) {
      const exists = options.some((opt) => opt && opt.id && opt.id.trim() === correctOptionId.trim());
      if (!exists) {
        errors.correctOptionId = 'Correct option ID must match one of the provided option IDs';
      }
    }
  } else if (req.method === 'POST') {
    errors.correctOptionId = 'Correct option ID is required';
  }

  if (explanation !== undefined && explanation !== null) {
    if (typeof explanation !== 'string') {
      errors.explanation = 'Explanation must be a text string';
    } else if (explanation.length > 2000) {
      errors.explanation = 'Explanation cannot exceed 2000 characters';
    } else {
      req.body.explanation = explanation.trim();
    }
  }

  if (difficulty !== undefined) {
    if (!QUESTION_DIFFICULTIES.includes(difficulty)) {
      errors.difficulty = `Difficulty must be one of: ${QUESTION_DIFFICULTIES.join(', ')}`;
    }
  }

  if (tags !== undefined && !Array.isArray(tags)) {
    errors.tags = 'Tags must be an array of strings';
  }

  if (Object.keys(errors).length > 0) {
    return sendError(res, 400, 'Invalid question data', errors);
  }

  next();
};

/**
 * Validate Quiz creation/update payload
 */
const validateQuiz = (req, res, next) => {
  const { title, description, subject, topics, questionIds } = req.body;
  const errors = {};

  if (req.method === 'POST') {
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      errors.title = 'Quiz title is required';
    }
    if (!subject || !mongoose.Types.ObjectId.isValid(subject)) {
      errors.subject = 'A valid Subject ID is required';
    }
    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      errors.questionIds = 'Quiz must contain at least one question';
    }
  }

  if (title !== undefined) {
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      errors.title = 'Quiz title cannot be empty';
    } else if (title.trim().length < 2) {
      errors.title = 'Quiz title must be at least 2 characters';
    } else if (title.trim().length > 150) {
      errors.title = 'Quiz title cannot exceed 150 characters';
    } else {
      req.body.title = title.trim();
    }
  }

  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') {
      errors.description = 'Description must be text';
    } else if (description.trim().length > 1000) {
      errors.description = 'Description cannot exceed 1000 characters';
    } else {
      req.body.description = description.trim();
    }
  }

  if (subject !== undefined && (!subject || !mongoose.Types.ObjectId.isValid(subject))) {
    errors.subject = 'Subject ID must be a valid MongoDB ObjectId';
  }

  if (topics !== undefined) {
    if (!Array.isArray(topics)) {
      errors.topics = 'Topics must be an array of topic IDs';
    } else {
      for (const t of topics) {
        if (!mongoose.Types.ObjectId.isValid(t)) {
          errors.topics = `Invalid topic ID: ${t}`;
          break;
        }
      }
    }
  }

  if (questionIds !== undefined) {
    if (!Array.isArray(questionIds) || questionIds.length === 0) {
      errors.questionIds = 'Quiz must contain at least one question';
    } else {
      for (const q of questionIds) {
        if (!mongoose.Types.ObjectId.isValid(q)) {
          errors.questionIds = `Invalid question ID: ${q}`;
          break;
        }
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return sendError(res, 400, 'Invalid quiz data', errors);
  }

  next();
};

/**
 * Validate Quiz Submission payload
 */
const validateQuizSubmission = (req, res, next) => {
  const { answers } = req.body;
  const errors = {};

  if (!answers || !Array.isArray(answers)) {
    errors.answers = 'Submission must include an answers array';
    return sendError(res, 400, 'Invalid quiz submission', errors);
  }

  for (let i = 0; i < answers.length; i++) {
    const ans = answers[i];
    if (!ans || typeof ans !== 'object') {
      errors.answers = `Answer item at index ${i} is invalid`;
      break;
    }
    if (!ans.questionId || !mongoose.Types.ObjectId.isValid(ans.questionId)) {
      errors.answers = `Answer item at index ${i} must have a valid questionId`;
      break;
    }
    // selectedOptionId can be null or string
    if (ans.selectedOptionId !== null && ans.selectedOptionId !== undefined && typeof ans.selectedOptionId !== 'string') {
      errors.answers = `selectedOptionId at index ${i} must be a string or null`;
      break;
    }
  }

  if (Object.keys(errors).length > 0) {
    return sendError(res, 400, 'Invalid quiz submission', errors);
  }

  next();
};

const { MISTAKE_STATUSES } = require('../models/Mistake');

/**
 * Validate Mistake update payload
 */
const validateMistakeUpdate = (req, res, next) => {
  const { personalNote, isMarkedForReview, status } = req.body;
  const errors = {};

  if (personalNote !== undefined && personalNote !== null) {
    if (typeof personalNote !== 'string') {
      errors.personalNote = 'Personal note must be a string';
    } else if (personalNote.trim().length > 2000) {
      errors.personalNote = 'Personal note cannot exceed 2000 characters';
    } else {
      req.body.personalNote = personalNote.trim();
    }
  }

  if (status !== undefined) {
    if (!MISTAKE_STATUSES.includes(status)) {
      errors.status = `Status must be one of: ${MISTAKE_STATUSES.join(', ')}`;
    }
  }

  if (Object.keys(errors).length > 0) {
    return sendError(res, 400, 'Invalid mistake update data', errors);
  }

  next();
};

/**
 * Validate Practice Answer payload
 */
const validatePracticeAnswer = (req, res, next) => {
  const { selectedOptionId } = req.body;
  const errors = {};

  if (!selectedOptionId || typeof selectedOptionId !== 'string' || selectedOptionId.trim().length === 0) {
    errors.selectedOptionId = 'A valid selectedOptionId string is required';
  } else {
    req.body.selectedOptionId = selectedOptionId.trim();
  }

  if (Object.keys(errors).length > 0) {
    return sendError(res, 400, 'Invalid practice answer submission', errors);
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateObjectId,
  validateSubject,
  validateTopic,
  validateMaterial,
  validateQuestion,
  validateQuiz,
  validateQuizSubmission,
  validateMistakeUpdate,
  validatePracticeAnswer,
};


