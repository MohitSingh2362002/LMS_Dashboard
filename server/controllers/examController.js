import Batch from "../models/Batch.js";
import ExamQuestion from "../models/ExamQuestion.js";
import MockTest from "../models/MockTest.js";
import TestAttempt from "../models/TestAttempt.js";
import asyncHandler from "../utils/asyncHandler.js";

const optionLabels = ["A", "B", "C", "D", "E"];

const normalizeOptions = (options = []) =>
  options
    .filter((option) => option?.text?.trim())
    .map((option, index) => ({
      label: (option.label || optionLabels[index] || String(index + 1)).toUpperCase(),
      text: option.text.trim()
    }));

const sanitizeQuestionPayload = (body, user) => ({
  question: body.question,
  type: body.type || "single",
  options: normalizeOptions(body.options || []),
  correctOptions: (body.correctOptions || []).map((item) => String(item).toUpperCase()),
  correctNumericAnswer:
    body.correctNumericAnswer === "" || body.correctNumericAnswer === undefined
      ? undefined
      : Number(body.correctNumericAnswer),
  writtenAnswer: body.writtenAnswer || "",
  explanation: body.explanation || "",
  subject: body.subject,
  chapter: body.chapter,
  topic: body.topic,
  difficulty: body.difficulty || "medium",
  exam: body.exam || "NEET",
  marks: Number(body.marks) || 4,
  negativeMarks: Number(body.negativeMarks) || 0,
  createdBy: user._id
});

const validateQuestionPayload = (res, payload) => {
  if (payload.type === "numeric") {
    if (payload.correctNumericAnswer === undefined || Number.isNaN(payload.correctNumericAnswer)) {
      res.status(400);
      throw new Error("Correct numeric answer is required");
    }
    return;
  }

  if (!payload.correctOptions.length) {
    res.status(400);
    throw new Error("Select at least one correct option");
  }
};

const stripQuestionAnswers = (question) => {
  const item = question.toObject ? question.toObject() : question;
  delete item.correctOptions;
  delete item.correctNumericAnswer;
  delete item.writtenAnswer;
  delete item.explanation;
  return item;
};

const parseBulkQuestions = (text, user) =>
  text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const lines = block.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      const read = (prefix, fallback = "") => {
        const line = lines.find((item) => item.toLowerCase().startsWith(`${prefix.toLowerCase()}:`));
        return line ? line.slice(prefix.length + 1).trim() : fallback;
      };
      const options = lines
        .filter((line) => /^[A-E][).:-]/i.test(line))
        .map((line) => ({ label: line[0].toUpperCase(), text: line.slice(2).trim() }));
      const type = read("Type", "single");
      const answer = read("Answer");

      return sanitizeQuestionPayload(
        {
          question: read("Q", read("Question")),
          type,
          options,
          correctOptions: type === "numeric" ? [] : answer.split(",").map((item) => item.trim()).filter(Boolean),
          correctNumericAnswer: type === "numeric" ? answer : undefined,
          writtenAnswer: read("WrittenAnswer", read("Solution", "")),
          explanation: read("Explanation"),
          subject: read("Subject", "General"),
          chapter: read("Chapter", "General"),
          topic: read("Topic", "General"),
          difficulty: read("Difficulty", "medium"),
          exam: read("Exam", "NEET"),
          marks: read("Marks", "4"),
          negativeMarks: read("Negative", "1")
        },
        user
      );
    })
    .filter((item) => item.question);

const learnerBatchIds = async (learnerId) => {
  const batches = await Batch.find({ learners: learnerId, status: "active" }).select("_id");
  return batches.map((batch) => batch._id);
};

const getId = (value) => value?._id || value;

const canLearnerAccessTest = async (learnerId, test) => {
  if (test.status !== "published") return false;
  if (!test.batch) return true;
  const batches = await learnerBatchIds(learnerId);
  const testBatchId = getId(test.batch);
  return batches.some((batchId) => String(batchId) === String(testBatchId));
};

const parentLearnerBatchIds = async (learnerIds = []) => {
  const batches = await Batch.find({ learners: { $in: learnerIds }, status: "active" }).select("_id");
  return batches.map((batch) => batch._id);
};

const canParentAccessTest = async (parent, test) => {
  const learnerIds = parent.linkedLearners || [];
  if (!learnerIds.length || test.status !== "published") return false;
  if (!test.batch) return true;
  const batches = await parentLearnerBatchIds(learnerIds);
  const testBatchId = getId(test.batch);
  return batches.some((batchId) => String(batchId) === String(testBatchId));
};

const scoreAnswer = (question, answer = {}) => {
  const selectedOptions = (answer.selectedOptions || [])
    .map((item) => String(item).trim().toUpperCase())
    .filter(Boolean)
    .sort();
  const correctOptions = (question.correctOptions || [])
    .map((item) => String(item).trim().toUpperCase())
    .filter(Boolean)
    .sort();

  if (question.type === "numeric") {
    const skipped = answer.numericAnswer === undefined || answer.numericAnswer === null || answer.numericAnswer === "";
    const learnerValue = Number(answer.numericAnswer);
    const correctValue = Number(question.correctNumericAnswer);
    const isCorrect = !skipped && !Number.isNaN(learnerValue) && Math.abs(learnerValue - correctValue) < 0.000001;
    return {
      skipped,
      isCorrect,
      score: skipped ? 0 : isCorrect ? question.marks : -Math.abs(question.negativeMarks || 0)
    };
  }

  const skipped = selectedOptions.length === 0;
  const isCorrect =
    !skipped &&
    selectedOptions.length === correctOptions.length &&
    selectedOptions.every((item, index) => item === correctOptions[index]);

  return {
    skipped,
    isCorrect,
    score: skipped ? 0 : isCorrect ? question.marks : -Math.abs(question.negativeMarks || 0)
  };
};

export const getQuestionBank = asyncHandler(async (req, res) => {
  const filter = {};
  ["subject", "chapter", "topic", "exam", "difficulty", "type"].forEach((field) => {
    if (req.query[field]) filter[field] = req.query[field];
  });

  const questions = await ExamQuestion.find(filter)
    .populate("createdBy", "name email")
    .sort({ updatedAt: -1 });

  res.json(questions);
});

export const createQuestion = asyncHandler(async (req, res) => {
  const payload = sanitizeQuestionPayload(req.body, req.user);
  validateQuestionPayload(res, payload);
  const question = await ExamQuestion.create(payload);
  res.status(201).json(question);
});

export const updateQuestion = asyncHandler(async (req, res) => {
  const question = await ExamQuestion.findById(req.params.id);

  if (!question) {
    res.status(404);
    throw new Error("Question not found");
  }

  const payload = sanitizeQuestionPayload(req.body, req.user);
  validateQuestionPayload(res, payload);

  Object.assign(question, payload, {
    createdBy: question.createdBy
  });

  const updated = await question.save();
  res.json(updated);
});

export const bulkImportQuestions = asyncHandler(async (req, res) => {
  const questions = parseBulkQuestions(req.body.text || "", req.user);

  if (!questions.length) {
    res.status(400);
    throw new Error("No valid questions found in the import text");
  }

  const inserted = await ExamQuestion.insertMany(questions);
  res.status(201).json({ count: inserted.length, questions: inserted });
});

export const getMockTests = asyncHandler(async (req, res) => {
  // Auto-publish any scheduled tests whose startsAt has arrived
  const now = new Date();
  await MockTest.updateMany(
    { status: "scheduled", startsAt: { $lte: now } },
    { $set: { status: "published" } }
  );
  // Auto-archive published tests whose endsAt has passed (if set)
  await MockTest.updateMany(
    { status: "published", endsAt: { $lte: now, $exists: true, $ne: null } },
    { $set: { status: "archived" } }
  );

  const filter = {};

  if (req.user.role === "learner") {
    const batches = await learnerBatchIds(req.user._id);
    filter.status = "published";
    filter.$or = [{ batch: { $exists: false } }, { batch: null }, { batch: { $in: batches } }];
  } else {
    ["status", "examPattern", "batch", "course"].forEach((field) => {
      if (req.query[field]) filter[field] = req.query[field];
    });
  }

  const tests = await MockTest.find(filter)
    .populate("course", "title thumbnail pricing instructorDisplayName")
    .populate("batch", "name performanceGroup")
    .populate("questions", "subject chapter topic marks")
    .sort({ updatedAt: -1 });

  res.json(tests);
});

export const createMockTest = asyncHandler(async (req, res) => {
  const selectedQuestions = await ExamQuestion.find({ _id: { $in: req.body.questions || [] } });
  const invalidQuestion = selectedQuestions.find((question) =>
    question.type === "numeric"
      ? question.correctNumericAnswer === undefined || Number.isNaN(Number(question.correctNumericAnswer))
      : !(question.correctOptions || []).length
  );

  if (invalidQuestion) {
    res.status(400);
    throw new Error("All selected questions must have a saved correct answer");
  }

  const test = await MockTest.create({
    title: req.body.title,
    examPattern: req.body.examPattern || "NEET",
    course: req.body.course || null,
    batch: req.body.batch || null,
    questions: selectedQuestions.map((question) => question._id),
    durationMinutes: Number(req.body.durationMinutes) || 180,
    startsAt: req.body.startsAt || null,
    endsAt: req.body.endsAt || null,
    status: req.body.status || "draft",
    createdBy: req.user._id
  });

  const populated = await MockTest.findById(test._id)
    .populate("course", "title")
    .populate("batch", "name performanceGroup")
    .populate("questions", "subject chapter topic marks");

  res.status(201).json(populated);
});

export const updateMockTest = asyncHandler(async (req, res) => {
  const test = await MockTest.findById(req.params.id);
  if (!test) {
    res.status(404);
    throw new Error("Mock test not found");
  }

  const allowed = ["title", "examPattern", "status", "durationMinutes", "batch", "course", "startsAt", "endsAt"];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) {
      test[field] = req.body[field] === "" ? null : req.body[field];
    }
  });

  const updated = await test.save();
  const populated = await MockTest.findById(updated._id)
    .populate("course", "title")
    .populate("batch", "name performanceGroup")
    .populate("questions", "subject chapter topic marks");
  res.json(populated);
});

export const getMockTestForAttempt = asyncHandler(async (req, res) => {
  const test = await MockTest.findById(req.params.id)
    .populate("course", "title")
    .populate("batch", "name performanceGroup")
    .populate("questions");

  if (!test) {
    res.status(404);
    throw new Error("Mock test not found");
  }

  if (req.user.role === "learner" && !(await canLearnerAccessTest(req.user._id, test))) {
    res.status(403);
    throw new Error("This test is not available for your batch");
  }

  const item = test.toObject();
  item.questions = item.questions.map(stripQuestionAnswers);
  res.json(item);
});

export const submitAttempt = asyncHandler(async (req, res) => {
  const test = await MockTest.findById(req.params.id).populate("questions");

  if (!test) {
    res.status(404);
    throw new Error("Mock test not found");
  }

  if (!(await canLearnerAccessTest(req.user._id, test))) {
    res.status(403);
    throw new Error("This test is not available for your batch");
  }

  const answerMap = new Map((req.body.answers || []).map((answer) => [String(answer.question), answer]));
  let score = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let skippedCount = 0;
  const weakTopicCounts = {};

  const answers = test.questions.map((question) => {
    const rawAnswer = answerMap.get(String(question._id)) || {};
    const result = scoreAnswer(question, rawAnswer);
    score += result.score;
    correctCount += result.isCorrect ? 1 : 0;
    incorrectCount += !result.skipped && !result.isCorrect ? 1 : 0;
    skippedCount += result.skipped ? 1 : 0;

    if (!result.skipped && !result.isCorrect) {
      weakTopicCounts[question.topic] = (weakTopicCounts[question.topic] || 0) + 1;
    }

    return {
      question: question._id,
      selectedOptions: rawAnswer.selectedOptions || [],
      numericAnswer: rawAnswer.numericAnswer,
      isCorrect: result.isCorrect,
      score: result.score
    };
  });

  const maxScore = test.questions.reduce((total, question) => total + (question.marks || 0), 0);
  const weakTopics = Object.entries(weakTopicCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic]) => topic);

  const attempt = await TestAttempt.create({
    learner: req.user._id,
    test: test._id,
    answers,
    score,
    maxScore,
    correctCount,
    incorrectCount,
    skippedCount,
    timeTakenSeconds: Number(req.body.timeTakenSeconds) || 0,
    weakTopics
  });

  res.status(201).json(attempt);
});

export const getMyAttempts = asyncHandler(async (req, res) => {
  const attempts = await TestAttempt.find({ learner: req.user._id })
    .populate("test", "title examPattern durationMinutes")
    .sort({ createdAt: -1 });

  res.json(attempts);
});

export const getParentExamSummary = asyncHandler(async (req, res) => {
  const learnerIds = req.user.linkedLearners || [];
  const batches = await Batch.find({ learners: { $in: learnerIds }, status: "active" })
    .populate("learners", "name email avatar")
    .select("_id name learners");
  const batchIds = batches.map((batch) => batch._id);

  const [tests, attempts] = await Promise.all([
    MockTest.find({
      status: "published",
      $or: [{ batch: { $exists: false } }, { batch: null }, { batch: { $in: batchIds } }]
    })
      .populate("course", "title")
      .populate("batch", "name performanceGroup")
      .populate("questions", "subject chapter topic marks")
      .sort({ updatedAt: -1 }),
    TestAttempt.find({ learner: { $in: learnerIds } })
      .populate("learner", "name email avatar")
      .populate("test", "title examPattern durationMinutes")
      .sort({ createdAt: -1 })
  ]);

  res.json({ tests, attempts, batches });
});

export const getLeaderboard = asyncHandler(async (req, res) => {
  if (req.user.role === "learner") {
    const test = await MockTest.findById(req.params.id);

    if (!test || !(await canLearnerAccessTest(req.user._id, test))) {
      res.status(403);
      throw new Error("This leaderboard is not available for your batch");
    }
  }

  if (req.user.role === "parent") {
    const test = await MockTest.findById(req.params.id);

    if (!test || !(await canParentAccessTest(req.user, test))) {
      res.status(403);
      throw new Error("This leaderboard is not available for your linked learners");
    }
  }

  const attempts = await TestAttempt.find({ test: req.params.id })
    .populate("learner", "name email avatar")
    .sort({ score: -1, timeTakenSeconds: 1, submittedAt: 1 });

  const bestByLearner = [];
  const seen = new Set();

  attempts.forEach((attempt) => {
    const learnerId = String(attempt.learner?._id);
    if (!seen.has(learnerId)) {
      seen.add(learnerId);
      bestByLearner.push(attempt);
    }
  });

  res.json(bestByLearner.map((attempt, index) => ({ ...attempt.toObject(), rank: index + 1 })));
});
