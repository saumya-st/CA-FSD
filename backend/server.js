const express = require('express');
const mongoose = require('mongoose');
const Feedback = require('./models/Feedback');

const app = express();

app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/studentFeedback')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err.message));

app.post('/api/feedback', async (req, res) => {
    try {
        const { studentName, courseName, message, rating } = req.body;

        if (!studentName || !courseName || !message || rating === undefined) {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        if (typeof rating !== 'number' || rating < 1 || rating > 5) {
            return res.status(400).json({
                message: 'Rating must be between 1 and 5'
            });
        }

        const feedback = new Feedback({
            studentName,
            courseName,
            message,
            rating
        });

        await feedback.save();

        res.status(201).json({
            message: 'Feedback submitted successfully',
            feedback
        });

    } catch (err) {
        res.status(500).json({
            message: 'Server Error'
        });
    }
});

app.get('/api/feedback', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;

        if (!Number.isInteger(page) || !Number.isInteger(limit) || page < 1 || limit < 1) {
            return res.status(400).json({
                message: 'Invalid page or limit'
            });
        }

        const skip = (page - 1) * limit;

        const feedback = await Feedback.find()
            .skip(skip)
            .limit(limit);

        const total = await Feedback.countDocuments();

        res.status(200).json({
            feedback,
            currentPage: page,
            totalRecords: total,
            totalPages: Math.ceil(total / limit)
        });

    } catch (err) {
        res.status(500).json({
            message: 'Server Error'
        });
    }
});

app.patch('/api/feedback/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                message: 'Status is required'
            });
        }

        if (!['Pending', 'Reviewed'].includes(status)) {
            return res.status(400).json({
                message: 'Invalid status'
            });
        }

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                message: 'Invalid feedback ID'
            });
        }

        const feedback = await Feedback.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        if (!feedback) {
            return res.status(404).json({
                message: 'Feedback not found'
            });
        }

        res.status(200).json({
            message: 'Feedback status updated successfully',
            feedback
        });

    } catch (err) {
        res.status(500).json({
            message: 'Server Error'
        });
    }
});

app.listen(5000, () => {
    console.log('Server running on port 5000');
});